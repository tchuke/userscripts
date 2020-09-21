// ==UserScript==
// @name         YouTube - Ad-Free!
// @version      0.1
// @description  Skips and removes ads on YouTube automatically
// @author       ahidalgo
// @match        https://www.youtube.com/*
// @grant        none
// @namespace    https://www.hidalgocare.com/
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

    const HTML5_MAX_SPEED = 16.0;
    const NORMAL_SPEED = 1.0;
    const AD_CSS_CLASS = "tony-ad";

    let userLastSpeed = NORMAL_SPEED;

    function updateUserLastSpeed(videos) {
        videos.forEach(video => {
            const rate = video.playbackRate;
            //console.log("Video is set to " + rate);
            if (rate !== HTML5_MAX_SPEED) {
                if (rate === NORMAL_SPEED) {
                    // We can't tell if this is due to user or newly loaded video, so do nothing.
                } else {
                    userLastSpeed = rate;
                }
            }
        });
    }

    function updateVideosSpeed(videos, newRate) {
        videos.forEach(video => {
            let oldRate = video.playbackRate;
            if (oldRate !== newRate) {
                //console.log(`Setting video to speed ${newRate}`);
                video.playbackRate = newRate;
            }
            if (oldRate === HTML5_MAX_SPEED) {
                if (newRate !== HTML5_MAX_SPEED) {
                    log("SLOWING DOWN for CONTENT.");
                    video.classList.remove(AD_CSS_CLASS);
                    video.muted = false;
                }
            } else if (newRate === HTML5_MAX_SPEED) {
                log("SPEEDING UP for AD!");
                video.classList.add(AD_CSS_CLASS);
                video.muted = true;
            }
        });
    }
    function skipAds(targets) {
        //    console.log("skipAds() called");
        targets.forEach(target => {
            let skipButtons = target.getElementsByClassName("ytp-ad-skip-button");
            if (skipButtons.length) {
                Array.from(skipButtons).forEach(skipButton => skipButton.click());
                log("SKIPPED A CLICKABLE AD!");
            } else {
                let videos = target.querySelectorAll('video');
                updateUserLastSpeed(videos);
                let newRate = target.getElementsByClassName("ytp-ad-text").length ? HTML5_MAX_SPEED : userLastSpeed;
                updateVideosSpeed(videos, newRate);
            }
        });
    }

    function startPlayersObserver(targets) {
        let observer = new MutationObserver(() => skipAds(targets));
        const options = {
            childList: true,
            subtree: true,
        };
        targets.forEach(target => {
            observer.observe(target, options);
        });
    }

    // Not seen by Tony:
    // #player-ads
    // Seen by Tony:
    addNewStyle('ytd-promoted-sparkles-web-renderer, .ytd-promoted-sparkles-text-search-renderer, .ytp-ad-overlay-slot {display:none !important;}');

    addNewStyle(`video.${AD_CSS_CLASS} {filter: opacity(5%) hue-rotate(120deg) grayscale(50%);}`);

    const waitingForPlayer = setInterval(() => {
        let onPageWithPlayer = (location.pathname === "/watch");
        if (onPageWithPlayer) {
            let players = document.querySelectorAll("ytd-player");
            log(`players length: ${players.length}`);
            if (players.length) {
                startPlayersObserver(players);
                clearInterval(waitingForPlayer);
            }
        }
    }, 250);
}());
