// ==UserScript==
// @name         YouTube - Ad-Free!
// @namespace    https://www.hidalgocare.com/
// @version      0.105
// @description  Avoids advertisements taking away from your YouTube experience
// @author       Antonio Hidalgo
// @include      https://www.youtube.com/*
// @exclude      https://www.youtube.com/ad_companion*
// @exclude      https://www.youtube.com/live_chat_replay*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/tchuke/userscripts/master/src/youtube.js
// @downloadURL  https://raw.githubusercontent.com/tchuke/userscripts/master/src/youtube.js
// ==/UserScript==

(function () {
    'use strict';

    function log(arg) {
        /* eslint-disable */
        console.log(arg);
        /* eslint-enable */
    }

    function addNewStyle(newStyle) {
        let styleElement = document.getElementById('styles_js');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.id = 'styles_js';
            document.getElementsByTagName('head')[0].appendChild(styleElement);
        }
        styleElement.appendChild(document.createTextNode(newStyle));
    }

    function handleStaticAds() {
        addNewStyle(`
        ytd-companion-slot-renderer,
        ytd-promoted-sparkles-web-renderer,
        .ytd-promoted-sparkles-text-search-renderer,
        .ytp-ad-overlay-slot {display:none !important;}`);
    }

    function handleVideoAds() {

        const adCounter = {
            ads: [0, 0],
            durations: [0, 0],
            addD(secs, idx) {
                this.ads[idx] = this.ads[idx] + 1;
                if (secs) {
                    this.durations[idx] = this.durations[idx] + secs;
                }
                return [this.ads[idx], this.durations[idx]];
            },
            addClickedAdDuration(secs) {
                return this.addD(secs, 0);
            },
            addForwardedAdDuration(secs) {
                return this.addD(secs, 1);
            }
        };

        function secsToTimeString(secs) {
            const durationMinutes = Math.floor(secs / 60);
            const durationSeconds = Math.floor(secs % 60);
            return `${durationMinutes} mins ${durationSeconds} secs`;
        }

        function targetAdSpeed() {
            const HTML5_MAX_SPEED = 16.0;
            return HTML5_MAX_SPEED;
        }
        class UserSpeedTracker {
            static normalSpeed() { return 1.0; }

            constructor() {
                this.userLastSpeed = UserSpeedTracker.normalSpeed();
            }

            memoizeUserLastSpeed(rate) {
                if (rate !== targetAdSpeed()) {
                    if (rate === UserSpeedTracker.normalSpeed()) {
                        // We can't tell if this is due to user or newly loaded video, so do nothing.
                    } else {
                        this.userLastSpeed = rate;
                    }
                }
            }

            getUserLastSpeed() {
                return this.userLastSpeed;
            }
        }

        const userSpeedTracker = new UserSpeedTracker();

        const contentEffects = [
            function memoize(video) { userSpeedTracker.memoizeUserLastSpeed(video.playbackRate); }
        ];
        const toggleEffects = [
            {
                attribute: "muted",
                adTest(video) { return video.muted; },
                contentTest(video) { return !this.adTest(video); },
                adEffect(video) { video.muted = true; },
                contentEffect(video) { video.muted = false; },
            }, {
                attribute: "playbackRate",
                adTest(video) { return video.playbackRate === targetAdSpeed(); },
                contentTest(video) { return !this.adTest(video); },
                adEffect(video) { video.playbackRate = targetAdSpeed(); },
                contentEffect(video) { video.playbackRate = userSpeedTracker.getUserLastSpeed(); },
            }, {
                attribute: "currentTime",
                spedUpMarker(video) { return 0.6 * video.duration; },
                adTest(video) { return video.currentTime >= this.spedUpMarker(video); },
                contentTest() { return true; },
                adEffect(video) { video.currentTime = this.spedUpMarker(video); },
                contentEffect() { }, // Do nothing.
            }
        ];

        function updateVideoEffects(video, isAd) {
            function adReducer(accumulator, effect) {
                const adEffectNotYet = !effect.adTest(video);
                if (adEffectNotYet) {
                    //log(`Adding missing ad effect "${effect.attribute}"`);
                    effect.adEffect(video);
                }
                return accumulator || adEffectNotYet;
            }

            if (isAd) {
                const isNewAd = toggleEffects.reduce(adReducer, false);
                if (isNewAd) {
                    const [totalAds, totalDuration] = adCounter.addForwardedAdDuration(video.duration);
                    log(`SPEEDING UP an AD (${totalAds} so far saving you ${secsToTimeString(totalDuration)}) !`);
                }
            } else { // isContent
                toggleEffects.forEach(effect => {
                    if (!effect.contentTest(video)) {
                        //log(`Adding missing content effect "${effect.attribute}"`);
                        effect.contentEffect(video);
                    }
                });
                contentEffects.forEach(contentEffect => contentEffect(video));
                for (let eff of contentEffects) {
                    eff(video);
                }
            }
        }

        function skipAds(video, adAncestor) {
            const [adContainer] = adAncestor.getElementsByClassName("video-ads");
            if (adContainer) {
                const skipButtons = adContainer.getElementsByClassName("ytp-ad-skip-button");
                if (skipButtons.length) {
                    video.muted = true;
                    const [totalAds, totalDuration] = adCounter.addClickedAdDuration(video.duration);
                    log(`SKIPPING a clickable AD (${totalAds} so far saving you ${secsToTimeString(totalDuration)}) !`);
                    Array.from(skipButtons).forEach(skipButton => skipButton.click());
                } else {
                    const isAd = adContainer.getElementsByClassName("ytp-ad-text").length;
                    updateVideoEffects(video, isAd);
                }
            }
        }

        function startPlayerObserver(target) {
            const options = {
                childList: true,
                subtree: true,
            };
            const videos = target.querySelectorAll('video');
            const [video] = videos;
            const observer = new MutationObserver(() => skipAds(video, target));
            observer.observe(target, options);
        }

        const waitingForPlayer = setInterval(() => {
            const onPageWithPlayer = (location.pathname === "/watch");
            if (onPageWithPlayer) {
                const players = document.querySelectorAll("div.html5-video-player");
                const playersSpotted = players.length;
                log(`players spotted: ${playersSpotted}`);
                if (playersSpotted) {
                    const [player] = players;
                    startPlayerObserver(player);
                    clearInterval(waitingForPlayer);
                }
            }
        }, 250);
    }

    handleStaticAds();
    handleVideoAds();

}());
