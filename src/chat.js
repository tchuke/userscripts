// ==UserScript==
// @name         Chat!
// @namespace    https://www.hidalgocare.com/
// @version      0.001
// @description  Streamlines chat experience
// @author       Antonio Hidalgo
// @match        https://chat.google.com/*
// @match        https://hangouts.google.com/webchat/frame*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/tchuke/userscripts/master/src/chat.js
// @downloadURL  https://raw.githubusercontent.com/tchuke/userscripts/master/src/chat.js
// ==/UserScript==

(function () {
    "use strict";

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

    function hide(selector) {
        addNewStyle(selector + ' {display:none !important;}');
    }

    // CHAT
    // My Status
    hide('.RASpke');
    // notifications (indie, global)
    hide('.jUwp6d');
    hide('.TeY52c');
    // block (indie, global)
    hide('div.JPdR6b.cpiW7b.qjTEB > div > div > span:nth-child(7)');
    hide('div.JPdR6b.e5Emjc.EvB6Cd.qjTEB > div > div > span:nth-child(4)');
    // Settings: Desktop (section, navbar)
    hide('div.HzTBCc.krjOGe > div:nth-child(2) > span:nth-child(1)');
    hide('.ctDTIf[jsname="sA2X9e"]');

    // HANGOUTS
    // Notifications (global)
    hide('.yYNSGb');
}());
