// ==UserScript==
// @name         UHC Vault Cleanup SHELL
// @namespace    https://www.hidalgocare.com/
// @version      0.003
// @description  Eliminate UHC Vault headaches
// @author       Antonio Hidalgo
// @include      https://coreb2c.uhcprovider.com/coreb2c/esrMpinPickList.do*
// @include      https://coreb2c.uhcprovider.com/coreb2c/ProviderTaxidAction.do*
// @include      https://coreb2c.uhcprovider.com/coreb2c/medicareSolReport.do*
// @require      https://code.jquery.com/jquery-3.5.1.js
// @updateURL    https://raw.githubusercontent.com/tchuke/userscripts/master/src/uhc_vault.js
// @downloadURL  https://raw.githubusercontent.com/tchuke/userscripts/master/src/uhc_vault.js
// ==/UserScript==

(function () {
    'use strict';

    /* globals jQuery */

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

    /* const switcher = {
        "7250_A01": "cap_details", // one flavor
        "7010_A02": "cap_paid_recap_details", // details rather than summary flavor
        "7280_A01": "member_changes_cap_details", // one flavor
        "7090_A02": "member_changes_cap_summary", // details rather than summary flavor
    }; */

    addNewStyle(".hidalgooption {background-color:orange}");
    function colorIt($elem) {
        $elem.addClass("hidalgooption");
    }

    function getTypeCapReportPCPValue() {
        return "RPT7_DYNAMIC_Capitation - UnitedHealthcare Preferred Care Partners~REPORT_DYNAMIC";
    }
    function getTypeCapReportMedicaValue() {
        return "RPT6_DYNAMIC_Capitation - UnitedHealthcare Preferred Care Network~REPORT_DYNAMIC";
    }
    function getSubcategoryCapDetailsFileValue() {
        return "15_Capitation Detail File (EC7810)~RPT2_DYNAMIC_RPTI";
    }
    function getSubcategoryCapDetailsValue() {
        return "15_Capitation Details (EC7250)~RPT2_DYNAMIC_RPTG";
    }
    function getSubcategoryCapPaidRecapValue() {
        return "15_Capitation Paid Recap (EC7010)~RPT2_DYNAMIC_RPTC";
    }
    function getSubcategoryMemberChangesCapDetailsValue() {
        return "15_Member Changes Capitation Details (EC7280)~RPT2_DYNAMIC_RPTH";
    }
    function getSubcategoryMemberChangesCapSummaryValue() {
        return "15_Primary Member Changes Capitation Summary (EC7090)~RPT2_DYNAMIC_RPTF";
    }

    function getAllNeededTypeValues() {
        return [
            getTypeCapReportPCPValue(),
            getTypeCapReportMedicaValue(),
        ];
    }
    function getAllNeededSubcategoryValues() {
        return [
            getSubcategoryCapDetailsFileValue(),
            getSubcategoryCapDetailsValue(),
            getSubcategoryCapPaidRecapValue(),
            getSubcategoryMemberChangesCapDetailsValue(),
            getSubcategoryMemberChangesCapSummaryValue(),
        ];
    }
    function getAllCorrectZipLinks() {
        function getAllZipLinks() {
            return jQuery("a[href*='ZIP']");
        }
        let zipLinks = getAllZipLinks();
        let flavor2Links = zipLinks.filter("a[href*='A02_']");
        return flavor2Links.length ? flavor2Links : zipLinks;
    }

    function styleHidalgoOptions() {
        function selectOptionWithValue(value) {
            return jQuery(`option[value='${value}']`);
        }
        colorIt(getAllCorrectZipLinks().first());
        colorIt(selectOptionWithValue(getTypeCapReportPCPValue()));
        colorIt(selectOptionWithValue(getTypeCapReportMedicaValue()));
        for (let subValue of getAllNeededSubcategoryValues()) {
            colorIt(selectOptionWithValue(subValue));
        }
    }

    function addIframeFun(id, payerValueToSelect, reportValueToSelect) {
        function getDropdownReportTypeSelector() {
            return "select[name=reportId]";
        }
        function getDropdownReportSubcategorySelector() {
            return "select[name=rptNavigateReport]";
        }
        function afterSubChangeFun(myIFrame) {
            function setIfBlank(dropdown, intendedValue) {
                const setValue = dropdown.val();
                if (setValue !== intendedValue) {
                    dropdown.val(intendedValue);
                }
            }
            return () => {
                const iframeContents = myIFrame.contents();
                const typeDropdown = iframeContents.find(getDropdownReportTypeSelector());
                const subDropdown = iframeContents.find(getDropdownReportSubcategorySelector());
                setIfBlank(typeDropdown, payerValueToSelect);
                setIfBlank(subDropdown, reportValueToSelect);
                const searchButton = iframeContents.find("button#searchBtn");
                setTimeout(() => searchButton.click(), 6000);
            };
        }
        function afterTypeChangeFun(myIFrame) {
            return () => {
                const iframeContents = myIFrame.contents();
                const subDropdown = iframeContents.find(getDropdownReportSubcategorySelector());
                subDropdown.val(reportValueToSelect).change();
                setTimeout(afterSubChangeFun(myIFrame), 6000);
            };
        }

        return () => {
            const myIFrame = jQuery(`<iframe id='${id}' style=''>`);
            // IFrame is sandboxed as its form would otherwise navigate top-level
            const sandboxDisallowingTopNavigation = "allow-downloads allow-forms allow-same-origin allow-scripts";
            myIFrame.
                attr('src', "https://coreb2c.uhcprovider.com/coreb2c/esrMpinPickList.do").
                attr('height', 500).
                attr('width', 500).
                attr('sandbox', sandboxDisallowingTopNavigation).
                insertBefore("div.link-miniApp-b2c-footer");

            function setAndSubmitIframeForm() {
                let iframeContents = myIFrame.contents();
                let typeDropdown = iframeContents.find(getDropdownReportTypeSelector());
                typeDropdown.val(payerValueToSelect).change();
                setTimeout(afterTypeChangeFun(myIFrame), 6000);
            }
            myIFrame.ready(() => {
                setTimeout(setAndSubmitIframeForm, 6000);
            });
        };
    }

    function loadAllReportIFrames() {
        let idx = 0;
        for (let subValue of getAllNeededSubcategoryValues()) {
            for (let typeValue of getAllNeededTypeValues()) {
                const delayMillis = idx * 5000;
                idx = idx + 1;
                setTimeout(addIframeFun(`hidalgo_iframe_${idx}`, typeValue, subValue), delayMillis);
            }
        }
    }

    function addSearchAllButton() {
        const searchButton = jQuery("button[value=SEARCH]");
        if (searchButton.length) {
            const nextTd = searchButton.closest("td").next();
            const myButton = jQuery('<button id="hidalgo_SEARCHALL" class="button">FETCH LATEST HIDALGO MD REPORTS</button>');
            nextTd.prepend(myButton);
            myButton.one("click", loadAllReportIFrames);
        }
    }

    (function downloadRecentZipLinks() {
        function isInIFrame() {
            return self !== top;
        }
        const isIframe = isInIFrame();
        if (isIframe) {
            const recentZipLinks = getAllCorrectZipLinks();
            if (recentZipLinks.length) {
                setTimeout(() => recentZipLinks.get(0).click(), 6000);
            }
        }
    }()); // End of downloadRecentZipLinks() and invoke.

    (function doItAll() {
        styleHidalgoOptions();
        addSearchAllButton();
    }()); // end of doItAll() and invoke

}());
