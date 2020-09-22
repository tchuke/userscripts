// ==UserScript==
// @name         YouTube - Ad-Free!
// @namespace    https://www.hidalgocare.com/
// @version      0.103
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
        // Not seen: #player-ads
        addNewStyle('ytd-promoted-sparkles-web-renderer, .ytd-promoted-sparkles-text-search-renderer, .ytp-ad-overlay-slot {display:none !important;}');
    }

    function handleVideoAds() {

        const adCounter = {
            ads: [0, 0],
            durations: [0, 0],
            addD: function addD(secs, idx) {
                this.ads[idx] = this.ads[idx] + 1;
                if (secs) {
                    this.durations[idx] = this.durations[idx] + secs;
                }
                return [this.ads[idx], this.durations[idx]];
            },
            addClickedAdDuration: function addClickedAdDuration(secs) {
                return this.addD(secs, 0);
            },
            addForwardedAdDuration: function addForwardedAdDuration(secs) {
                return this.addD(secs, 1);
            }
        };

        function secsToTimeString(secs) {
            const durationMinutes = Math.floor(secs / 60);
            const durationSeconds = Math.floor(secs % 60);
            return `${durationMinutes} mins ${durationSeconds} secs`;
        }

        const HTML5_MAX_SPEED = 16.0;

        const memoizeUserLastSpeed = (function () {
            const NORMAL_SPEED = 1.0;
            let userLastSpeed = NORMAL_SPEED;
            return function (rate) {
                //log(`Video is set to ${rate}`);
                if (rate !== HTML5_MAX_SPEED) {
                    if (rate === NORMAL_SPEED) {
                        // We can't tell if this is due to user or newly loaded video, so do nothing.
                    } else {
                        userLastSpeed = rate;
                    }
                }
                return userLastSpeed;
            };
        }());

        function updateVideoSpeed(video, newRate) {
            const oldRate = video.playbackRate;
            const rateHasChanged = (oldRate !== newRate);
            if (rateHasChanged) {
                //log(`Changing video to speed ${ newRate }`);
                video.playbackRate = newRate;
                if (newRate === HTML5_MAX_SPEED) {
                    video.muted = true;
                    const [totalAds, totalDuration] = adCounter.addForwardedAdDuration(video.duration);
                    log(`SPEEDING UP an AD (${totalAds} so far saving you ${secsToTimeString(totalDuration)}) !`);
                } else {
                    video.muted = false;
                }
            }
        }

        function skipAds(video, adAncestor) {
            //log("skipAds() called");
            const [adContainer] = adAncestor.getElementsByClassName("video-ads");
            const skipButtons = adContainer.getElementsByClassName("ytp-ad-skip-button");
            const areSkipButtons = skipButtons.length;
            if (areSkipButtons) {
                const [totalAds, totalDuration] = adCounter.addClickedAdDuration(video.duration);
                log(`SKIPPING a clickable AD (${totalAds} so far saving you ${secsToTimeString(totalDuration)}) !`);
                Array.from(skipButtons).forEach(skipButton => skipButton.click());
            } else {
                const userLastSpeed = memoizeUserLastSpeed(video.playbackRate);
                const adLength = adContainer.getElementsByClassName("ytp-ad-text").length;
                const newRate = adLength ? HTML5_MAX_SPEED : userLastSpeed;
                updateVideoSpeed(video, newRate);
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
                log(`players length: ${players.length}`);
                if (players.length) {
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
