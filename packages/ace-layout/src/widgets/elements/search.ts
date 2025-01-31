import {LayoutHTMLElement} from "../widget";
import {dom} from "../../utils/dom";

export class SettingsSearchBox {
    hideFiltered = false;
    value = "";
    currValue = "";
    prefsParentNode: LayoutHTMLElement;
    searchResultsCount = 0;
    searchResults: any;
    element: any;
    searchField: any;

    constructor(prefsParentNode: LayoutHTMLElement) {
        this.prefsParentNode = prefsParentNode;
    }

    filter() {
        let childNode;
        let noResult = true;
        this.searchResultsCount = 0;

        for (let i = 0; i < this.prefsParentNode.childNodes.length; i++) {
            childNode = this.prefsParentNode.childNodes[i];

            this.updateVisibility(childNode);
            if (noResult && !childNode.isFiltered) {
                noResult = false;
            }

        }
        if (this.currValue != "") {
            this.searchResults.innerHTML = " " + this.searchResultsCount + " Preferences Found";
        } else {
            this.searchResults.innerHTML = "";
        }

    }

    showHide(item, show) {
        show = show || false;
        item.isFiltered = !show;
        item.style.display = show ? "block" : "none";
    }

    updateVisibility(item: LayoutHTMLElement) {
        let text = item.innerText;
        let tokens = this.getTokens(text);
        let show = true;
        if (!tokens) {
            show = false;
        } else {
            this.searchResultsCount++;
        }
        this.showHide(item, show);
    }

    getTokens(string) {
        let tokens: {}[] = [];
        let caption = string.toLowerCase();

        let lower = this.currValue.toLowerCase();
        let upper = this.currValue.toUpperCase();

        function addToken(value, className) {
            value && tokens.push({
                type: className || "",
                value: value
            });
        }

        let lastIndex = -1;
        let matchMask = 0;
        let index, distance;

        let fullMatchIndex = caption.indexOf(lower);
        if (fullMatchIndex === -1) {
            for (let j = 0; j < this.currValue.length; j++) {
                let i1 = caption.indexOf(lower[j], lastIndex + 1);
                let i2 = caption.indexOf(upper[j], lastIndex + 1);
                index = (i1 >= 0) ? ((i2 < 0 || i1 < i2) ? i1 : i2) : i2;
                if (index < 0)
                    return null;
                distance = index - lastIndex - 1;
                if (distance > 0) {
                    matchMask = matchMask | (1 << j);
                }
                lastIndex = index;
            }
        }

        let filterText = lower;
        lower = caption.toLowerCase();
        lastIndex = 0;
        let lastI = 0;
        for (let i = 0; i <= filterText.length; i++) {
            if (i !== lastI && (matchMask & (1 << i) || i === filterText.length)) {
                let sub = filterText.slice(lastI, i);
                lastI = i;
                index = lower.indexOf(sub, lastIndex);
                if (index === -1) continue;
                addToken(string.slice(lastIndex, index), "");
                lastIndex = index + sub.length;
                addToken(string.slice(index, lastIndex), "completion-highlight");
            }
        }
        addToken(string.slice(lastIndex, string.length), "");

        return tokens;
    }

    build() {
        this.element = dom.buildDom(["div", {},
            ["input", {class: "search_field tbsimple", placeholder: "Search preferences"}],
            ["span", {class: "search_results"}],
            ["span", {class: "searchbtn_close"}]
        ]);
        this.element.$host = this;
        this.searchField = this.element.querySelector(".search_field");
        this.searchResults = this.element.querySelector(".search_results");
        let _this = this;
        this.element.querySelector(".searchbtn_close").addEventListener("mousedown", function (e) {
            _this.clear();
        });
        this.searchField.addEventListener("input", function (e) {
            _this.currValue = e.target.value;
            _this.filter();
        });
    }

    clear() {
        if (this.currValue.length) {
            this.searchField.value = "";
            this.currValue = "";
            this.filter();
        }
    }
}