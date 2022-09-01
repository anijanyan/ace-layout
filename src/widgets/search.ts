import dom = require("ace-code/src/lib/dom");

export class SettingsSearchBox {

    hideFiltered = false;
    value = "";
    currValue = "";
    prefsParentNode;
    searchResultsCount = 0;

    /**
     *
     * @param {HTMLElement} prefsParentNode
     */
    constructor(prefsParentNode) {
        this.prefsParentNode = prefsParentNode;
    }

    filter() {
        var childNode;
        var noResult = true;
        this.searchResultsCount = 0;

        for (var i = 0; i < this.prefsParentNode.childNodes.length; i++) {
            childNode = this.prefsParentNode.childNodes[i];

            this.updateVisibility(childNode);
            if (noResult && !childNode.isFiltered) {
                noResult = false;
            }

        }
        if (this.currValue != "") {
            this.searchResults.innerHTML = " "+ this.searchResultsCount + " Preferences Found";
        } else {
            this.searchResults.innerHTML = "";
        }

    }

    showHide(item, show) {
        show = show || false;
        item.isFiltered = !show;
        item.style.display = show ? "block" : "none";
    }

    /**
     *
     * @param {HTMLElement} item
     */
    updateVisibility(item) {
        var text = item.innerText;
        var tokens = this.getTokens(text);
        var show = true;
        if (!tokens) {
            show = false;
        } else {
            this.searchResultsCount++;
        }
        this.showHide(item, show);
    }

    getTokens(string) {
        var tokens = [];
        var caption = string.toLowerCase();

        var lower = this.currValue.toLowerCase();
        var upper = this.currValue.toUpperCase();

        function addToken(value, className) {
            value && tokens.push({
                type: className || "",
                value: value
            });
        }

        var lastIndex = -1;
        var matchMask = 0;
        var index, distance;

        var fullMatchIndex = caption.indexOf(lower);
        if (fullMatchIndex === -1) {
            for (var j = 0; j < this.currValue.length; j++) {
                var i1 = caption.indexOf(lower[j], lastIndex + 1);
                var i2 = caption.indexOf(upper[j], lastIndex + 1);
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

        var filterText = lower;
        lower = caption.toLowerCase();
        lastIndex = 0;
        var lastI = 0;
        for (var i = 0; i <= filterText.length; i++) {
            if (i !== lastI && (matchMask & (1 << i) || i === filterText.length)) {
                var sub = filterText.slice(lastI, i);
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
        var _this = this;
        this.element.querySelector(".searchbtn_close").addEventListener("mousedown", function (e) {
            _this.clear();
        });
        this.searchField.addEventListener("input", function (e) {
            _this.currValue = e.target.value;
            _this.filter();
        });
    }

    clear() {
        if (this.currValue.length){
            this.searchField.value = "";
            this.currValue = "";
            this.filter();
        }
    }
}