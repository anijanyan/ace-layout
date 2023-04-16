import {Utils} from "../../utils/lib";

import {LayoutHTMLElement, Position} from "../widget";
import {dom} from "../../utils/dom";
import {MenuItems, MenuManager} from "./menuManager";
import * as menuCSS from "../../styles/menu.css";

dom.importCssString(menuCSS, "menu.css");

export abstract class Menu {
    menuManager: MenuManager;
    selectedMenu?: MenuItems;
    menuPopup?: MenuPopup;
    selectedClass: string;
    element?: LayoutHTMLElement;

    getLastOpenPopup() {
        return !this.menuPopup ? this : this.menuPopup.getLastOpenPopup();
    }

    getLastSelectedMenu() {
        return !this.menuPopup || !this.menuPopup.selectedMenu ? this.selectedMenu : this.menuPopup.getLastSelectedMenu();
    }

    closeLastMenu() {
        if (this.menuPopup && this.menuPopup.menuPopup) {
            this.menuPopup.closeLastMenu();
        } else {
            this.closeMenu();
        }

    }

    selectMenu(menu: MenuItems) {
        menu.buttonElement!.classList.add(this.selectedClass);
        this.selectedMenu = menu;
    }

    unselectMenu() {
        if (!this.selectedMenu)
            return;

        this.selectedMenu.buttonElement!.classList.remove(this.selectedClass);
        this.selectedMenu = undefined;
    }

    openMenu(direction?: string) {
        if (!direction && this.constructor.name === "MenuPopup")
            direction = "right";

        if (this.menuPopup)
            return this.menuPopup;

        this.menuPopup = new MenuPopup();
        this.menuPopup.direction = direction ?? "";
        this.menuPopup.isSubMenu = this.constructor.name === "MenuPopup";
        this.menuPopup.menuManager = this.menuManager;
        this.menuPopup.menu = this.selectedMenu!;
        this.menuPopup.parentMenu = this;
        this.menuPopup.open();

        if (this.menuManager.searchBox && this.menuManager.searchBox.isOpen) {
            if (!this.menuPopup.isSubMenu) {
                this.menuManager.searchBox.setParentPopup(this.menuPopup);
            } else {
                this.menuManager.searchBox.addSymbol("/");
            }
        }

        return this.menuPopup;
    }

    closeMenu() {
        if (!this.menuPopup) {
            return;
        }
        if (this.menuManager.searchBox && this.menuManager.searchBox.isOpen && this.menuPopup.isSubMenu && this.menuManager.searchBox.value.substring(this.menuManager.searchBox.value.length - 1) === "/") {
            this.menuManager.searchBox.removeSymbol();
        }
        this.menuPopup.close();
        this.menuPopup = undefined;
    }

    moveOnTarget(target: LayoutHTMLElement) {
        let host: MenuItems = target ? target.$host : null;
        if (!host) {
            return;
        }
        if (this.selectedMenu) {
            if (host.path === this.selectedMenu.path) {
                return;
            } else {
                this.unselectMenu();
            }
        }
        if (this.menuPopup) {
            this.closeMenu();
        }
        host.buttonElement = host.$buttonElement || target;
        this.selectMenu(host);
    }

    abstract getMenuByPath(path)

    openMenuByPath(path) {
        if (typeof path === "string")
            path = path.split("/");
        let menu = this.getMenuByPath(path.shift());

        if (!menu)
            return;
        if (!menu.$host)
            menu.$host = menu;

        this.moveOnTarget(menu);
        if (!menu.$host.map) return;
        this.openMenu();
        if (path.length)
            this.menuPopup?.openMenuByPath(path);
    }

    abstract activateMenu()
}

export class MenuBar extends Menu {
    selectedClass = "menuButtonDown";
    menus: MenuItems;
    bottom: number;

    build(parent: LayoutHTMLElement) {
        this.element = parent;
        let items = this.menus.map;
        Object.keys(items).filter(Boolean).map(key => items[key]).sort(function (item1, item2) {
            return item1.position - item2.position;
        }).map(item => {
            item.$buttonElement = dom.buildDom(["div", {
                class: "menuButton" + (item.className ? " " + item.className : ""),
                $host: item,
                onmousedown: e => this.onMouseDown(e),
            }, item.label + ""], this.element);
        });
        let rect = this.element.getBoundingClientRect();
        this.bottom = rect.bottom;
    }

    activateMenu() {
        this.element!.addEventListener("mousemove", this.onMouseMove);
    }

    inactivateMenu() {
        this.unselectMenu();
        this.closeMenu();
        this.element!.removeEventListener("mousemove", this.onMouseMove);
    }

    /*** event handlers ***/
    onMouseDown(e) {
        e.preventDefault();
        let activate = true;
        if (this.menuManager.isActive) {
            this.menuManager.inactivateMenu();
        } else {
            let target = e.target;
            target.$host.buttonElement = target.$host.$buttonElement;
            this.selectMenu(target.$host);
            this.openMenu();
            this.menuManager.activeMenu = this;
            this.menuManager.activateMenu();
        }
    }

    moveOnTarget(target) {
        super.moveOnTarget(target);
        if (this.selectedMenu?.map)
            this.openMenu();
    }

    onMouseMove = (e) => {
        let target = this.menuManager.getTarget(e.target);

        this.moveOnTarget(target);
    }


    getMenuByPath(path) {
        return this.menuManager.find(path);
    }
}

export class MenuPopup extends Menu {
    selectedClass = "hover";
    menu: MenuItems;
    position: Position;
    isSubMenu = false;
    direction: string;
    prevMaxHeight;
    parentMenu: Menu;

    inactivateMenu() {
        this.close();
    }

    activateMenu() {
    }

    open() {
        this.build();
        this.render();
    }

    build() {
        if (this.element) {
            return;
        }
        if (this.menu.element) {
            this.element = this.menu.element;
            return;
        }

        let result: any[] = [];
        if (this.menu.map) {
            //TODO: ?
            let items = Object.values(this.menu.map).sort(function (item1: MenuItems, item2: MenuItems) {
                return item1.position - item2.position;
            });
            let afterDivider = true;
            result = items
                .map((item: MenuItems) => {
                    if (item.label[0] === "~") {
                        if (afterDivider) return;
                        afterDivider = true;
                        return [
                            "div",
                            {
                                class: "menu_divider",
                                $host: item,
                            },
                        ];
                    }
                    afterDivider = false;
                    let classList = ["menu_item"];
                    if (item.checked) classList.push(item.type === "check" ? "checked" : "selected");
                    if (item.map) classList.push("submenu");
                    if (item.disabled) classList.push("disabled");
                    return [
                        "div",
                        {
                            class: classList.join(" "),
                            $host: item,
                        },
                        ["u", " "],
                        ["a", item.label + ""],
                        [
                            "span",
                            {
                                class: "shortcut",
                            },
                            item.hotKey,
                        ],
                    ];
                })
                .filter(Boolean);
            if (afterDivider) result.pop();
        }

        this.menu.element = dom.buildDom(
            [
                "blockquote",
                {
                    class: "menu",
                    style: "display:block",
                    $host: this.menu,
                    onmousemove: this.onMouseMove,
                    onmouseup: this.onMouseUp
                },
                result,
            ],
            document.body
        );
        this.element = this.menu.element;
    }

    render() {
        if (!this.element)
            return;

        if (this.element.style.maxWidth)
            this.element.style.maxWidth = window.innerWidth + "px";

        if (this.element.style.maxHeight)
            this.element.style.maxHeight = window.innerHeight + "px";

        let elRect = this.element.getBoundingClientRect();

        let edge = Utils.getElementEdges(this.element);

        let parentRect, top, left;

        if (this.menu && this.menu.buttonElement)
            parentRect = this.menu.buttonElement.getBoundingClientRect();

        if (parentRect) {
            if (this.isSubMenu) {
                top = parentRect.top - edge.top;
                left = parentRect.right;
            } else {
                top = parentRect.bottom;
                left = parentRect.left;
            }
        } else {
            top = this.position.y;
            left = this.position.x
        }


        let targetH = Math.min(elRect.height, window.innerHeight);
        let availableH = window.innerHeight - top - edge.top - edge.bottom - 2;

        if (availableH < targetH && (!parentRect || this.isSubMenu)) {
            let tmpTop = parentRect ? window.innerHeight : top;
            top = tmpTop - targetH - edge.top;
            top = Math.max(top, this.menuManager.menuBar.bottom);
            availableH = window.innerHeight - top - edge.top - edge.bottom - 2;
        }
        this.element.style.maxHeight = (availableH - 10) + "px";
        elRect = this.element.getBoundingClientRect();

        let availableW = window.innerWidth - left - edge.left - edge.right - 2;
        if (availableW < elRect.width) {
            if (parentRect) {
                let tmpLeft = this.isSubMenu ? parentRect.left : parentRect.right;
                if (tmpLeft > availableW) {
                    this.direction = "left";
                    left = tmpLeft - elRect.width + edge.left;
                    left = Math.max(left, 0);
                    availableW = tmpLeft + edge.left + edge.right;
                }
                if (availableW < elRect.width) {
                    this.element.style.maxWidth = availableW + "px";
                    this.element.style.overflowX = "auto";
                }
            } else {
                left = window.innerWidth - elRect.width - edge.left - edge.right;
            }
        }

        this.element.style.top = top + "px";
        this.element.style.left = left + "px";
        this.element.style.position = "absolute";
        this.element.style.zIndex = String(195055);
        this.element.style.overflowY = "auto";
    }

    close() {
        if (this.menuPopup) {
            this.closeMenu();
        }
        if (this.element) {
            this.element.remove();
            delete this.element;
        }
        if (this.menu.element) {
            delete this.menu.element;
        }

    }

    scrollIfNeeded() {
        if (!this.selectedMenu)
            return;

        let menu = this.element!;
        let item = this.selectedMenu.buttonElement!;
        let menuRect = menu.getBoundingClientRect();
        let itemRect = item.getBoundingClientRect();

        if (itemRect.top < menuRect.top) {
            item.scrollIntoView(true);
        } else if (itemRect.bottom > menuRect.bottom) {
            item.scrollIntoView(false);
        }
    }

    moveOnTarget(target) {
        super.moveOnTarget(target);
    }

    //handle events
    onMouseMove = (e) => {
        if (e.target === this.element)
            return;

        if (this.menuPopup && this.isDirectedToSubMenu(e))
            return;

        let target = this.menuManager.getTarget(e.target);
        if (target === this.element)
            return;

        this.moveOnTarget(target);
        if (this.selectedMenu?.map)
            this.openMenu();
    }


    onMouseUp = (e) => {
        if (e.target === this.element)
            return;

        let target = this.menuManager.getTarget(e.target);
        if (!target || target === this.element)
            return;

        let host = target.$host;
        if (host && host.buttonElement) {
            e.preventDefault();
            if (host.exec)
                host.exec(this.menuManager.currentHost);
        }

        if (!host.map)
            this.menuManager.inactivateMenu();
    }

    isDirectedToSubMenu(e) {
        let currPos = {x: e.clientX, y: e.clientY};
        let prevPos = this.menuManager.prevPos;
        let rect = this.menuPopup!.element!.getBoundingClientRect();

        let rectYTop = rect.top;
        let rectYBottom = rect.bottom;

        if (currPos.y < rectYTop || currPos.y > rectYBottom) {
            return false;
        }

        let rectX = this.menuPopup!.direction === "left" ? rect.right : rect.left;
        let prevDiffX = Math.abs(rectX - prevPos.x);
        let currDiffX = Math.abs(rectX - currPos.x);

        if (prevDiffX < currDiffX) {
            return false;
        }

        let directedToBottom = currPos.y > prevPos.y;
        let prevDiffY = directedToBottom ? rectYBottom - prevPos.y : prevPos.y - rectYTop;
        let tng = prevDiffY / prevDiffX;
        let maxYDiff = tng * currDiffX;

        return (directedToBottom && rectYBottom - maxYDiff >= currPos.y) || (!directedToBottom && rectYTop + maxYDiff <= currPos.y);
    }

    renderRecursive() {
        this.render();
        if (this.menuPopup) {
            this.menuPopup.renderRecursive();
        }
    }

    getMenuByPath(path: string) {
        let childNode;
        let childNodes = this.element!.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
            childNode = childNodes[i];
            if (childNode.$host && childNode.$host.id === path) {
                if (childNode.classList.contains("menu_item") && !childNode.classList.contains("disabled")) {
                    return childNode;
                }
            }
        }
        return null;
    }
}

export class MenuSearchBox {
    parentPopup?: MenuPopup;
    isOpen = false;
    hideFiltered = false;
    value = "";
    currValue = "";
    currPopupMenu?: MenuPopup;
    menuManager?: MenuManager;
    isChanged: boolean;
    searchField: any;
    suggestionPopup: any;
    selectMenu: any;
    secondarySelectMenu: any;
    element: LayoutHTMLElement;

    open() {
        if (!this.element) {
            this.build();
        }

        this.isOpen = true;

        document.body.appendChild(this.element);
        this.calcElementPosition();
    }

    close() {
        this.isOpen = false;

        if (this.parentPopup && this.parentPopup.element) {
            if (this.parentPopup.prevMaxHeight) {
                this.parentPopup.element.style.maxHeight = this.parentPopup.prevMaxHeight;
            }
        }
        if (this.value.length) {
            this.value = "";
            this.currValue = "";
            this.update();
        }
        this.parentPopup = undefined;

        this.element.remove();
    }

    setParentPopup(parentPopup: MenuPopup) {
        if (this.parentPopup && this.parentPopup.element) {
            if (this.parentPopup.prevMaxHeight) {
                this.parentPopup.element.style.maxHeight = this.parentPopup.prevMaxHeight;
            }
        }
        this.parentPopup = parentPopup;
        this.currPopupMenu = parentPopup;
        if (this.isOpen) {
            this.calcElementPosition();
            let currPopupMenu: MenuPopup | null = parentPopup;
            let valueArr = this.value.split("/");
            while (currPopupMenu) {
                this.currPopupMenu = currPopupMenu;
                this.currValue = valueArr.shift() ?? "";
                this.isChanged = true;
                this.update();
                this.isOpen = false;
                currPopupMenu = this.currPopupMenu.selectedMenu && this.currPopupMenu.selectedMenu.map ? this.currPopupMenu.openMenu() : null;
                this.isOpen = true;
            }
        }
    }

    calcElementPosition() {
        if (!this.parentPopup)
            return;
        this.parentPopup.prevMaxHeight = null;
        let parentRect = this.parentPopup.element!.getBoundingClientRect();
        let top = parentRect.top - 20;
        if (top < this.menuManager!.menuBar.bottom) {
            top = parentRect.bottom;
            if (parentRect.bottom + 20 > window.innerHeight) {
                this.parentPopup.prevMaxHeight = this.parentPopup.element!.style.maxHeight;
                this.parentPopup.element!.style.maxHeight = (parseInt(this.parentPopup.element!.style.maxHeight, 10) - 20) + "px";
                top -= 20;
            }
        }
        this.element.style.top = top + "px";
        this.element.style.right = (window.innerWidth - parentRect.right) + "px";
    }

    addSymbol(symbol: string) {
        if (symbol === "/" && this.value.substring(this.value.length - 1) === "/") {
            return;
        }
        this.value += symbol;
        if (symbol === "/") {
            if (this.currPopupMenu?.selectedMenu && this.currPopupMenu.selectedMenu.map) {
                this.currPopupMenu = this.currPopupMenu.openMenu();
                this.currValue = "";
            }
            this.isChanged = false;
        } else {
            this.currValue += symbol;
            this.isChanged = true;
        }

        this.update();
    }

    removeSymbol() {
        if (!this.isOpen) {
            return;
        }
        let removed = this.value.substring(this.value.length - 1);
        this.value = this.value.substring(0, this.value.length - 1);

        if (removed === "/") {
            this.currValue = this.value.split("/").pop() ?? "";
            this.currPopupMenu = (this.currPopupMenu?.parentMenu instanceof MenuPopup) ? this.currPopupMenu.parentMenu : undefined;
            this.isChanged = false;
        } else {
            this.currValue = this.currValue.substring(0, this.currValue.length - 1);
            this.isChanged = true;
        }

        this.update();
        if (!this.value.length) {
            this.close();
        }
    }

    update() {
        this.searchField.textContent = this.value;

        if (this.currPopupMenu && this.currPopupMenu.element && this.isChanged) {
            this.setPopupMenuHighlights();
            if (this.hideFiltered) {
                this.calcElementPosition();
            }
        }
    }

    switchShowHideFiltered() {
        this.hideFiltered = !this.hideFiltered;
        this.update();
        if (!this.hideFiltered) {
            this.calcElementPosition();
        }
    }

    showHideMenuNode(menu, show) {
        show = show || false;

        if (!show && menu.classList.contains("hover") && this.currPopupMenu?.menuPopup) {
            show = true;
        }
        menu.isFiltered = !show;
        show = show || !this.hideFiltered;
        menu.style.display = show ? "block" : "none";
    }

    setPopupMenuHighlights() {
        if (!this.currPopupMenu?.element)
            return;
        let childNode;
        let width: number = 0;
        this.selectMenu = null;
        this.secondarySelectMenu = null;
        if (this.hideFiltered) {
            let rect = this.currPopupMenu.element.getBoundingClientRect();
            let edges = Utils.getElementEdges(this.currPopupMenu.element);
            width = rect.width - edges.left - edges.right;
        }
        let afterDivider = true;
        let noResult = true;

        for (let i = 0; i < this.currPopupMenu.element.childNodes.length; i++) {
            childNode = this.currPopupMenu.element.childNodes[i];
            if (childNode.classList.contains("menu_item")) {
                this.setHighlights(childNode);
                afterDivider = afterDivider && childNode.isFiltered;
                if (noResult && !childNode.isFiltered) {
                    noResult = false;
                }
            } else if (childNode.classList.contains("menu_divider")) {
                this.showHideMenuNode(childNode, !afterDivider);
                afterDivider = true;
            }
        }
        if (this.hideFiltered) {
            this.currPopupMenu.element.style.width = Math.ceil(width) + "px";//TODO
            let noResultEl = this.currPopupMenu.element.querySelector(".menu_no_result");
            if (noResult && !noResultEl) {
                dom.buildDom(["div", {class: "menu_no_result"}, "No matching result"], this.currPopupMenu.element);
            } else if (!noResult && noResultEl) {
                noResultEl.remove();
            }
        }
        this.selectMenu = this.selectMenu || this.secondarySelectMenu;
        if (this.selectMenu) {
            this.currPopupMenu.moveOnTarget(this.selectMenu);
            this.currPopupMenu.scrollIfNeeded();
        }

        if (this.hideFiltered) {
            this.currPopupMenu.renderRecursive();
        }

        if (this.suggestionPopup) {
            this.suggestionPopup.close();
        }

        if (noResult) {
            this.currValue = this.value;
            let suggestionList = {};
            let addToSuggestionList = (menus) => {
                Object.keys(menus).forEach((name) => {
                    let item = menus[name];
                    if (item.label && item.label[0] === "~") {
                        return;
                    }
                    if (!item.path) {
                        console.log(item);
                        return;
                    }
                    let path = item.path;
                    let tokens = this.getTokens(path);
                    if (tokens) {
                        suggestionList[path] = {
                            label: path,
                            tokens: tokens
                        };
                    }

                    if (item.map) {
                        addToSuggestionList(item.map);
                    }
                });
            };

            addToSuggestionList(this.menuManager!.menus.map);

            this.suggestionPopup = new MenuPopup();
            this.suggestionPopup.direction = "right";
            this.suggestionPopup.isSubMenu = true;
            this.suggestionPopup.menuManager = this.menuManager;
            this.suggestionPopup.menu = {
                buttonElement: this.element,
                map: suggestionList
            };
            this.suggestionPopup.parentMenu = this;
            this.suggestionPopup.open();

            for (let i = 0; i < this.suggestionPopup.element.childNodes.length; i++) {
                let childNode = this.suggestionPopup.element.childNodes[i];
                let menuTitle = childNode.querySelector("a");
                let innerHtml = "";
                for (let t = 0; t < childNode.$host.tokens.length; t++) {
                    innerHtml += "<span class='menu-" + childNode.$host.tokens[t].type + "'>" + childNode.$host.tokens[t].value + "</span>";
                }
                menuTitle.innerHTML = innerHtml;
            }
        }
    }

    setHighlights(menu) {
        let text = menu.$host.label;
        let menuTitle = menu.querySelector("a");
        if (!this.currValue || !this.currValue.length) {
            menuTitle.innerHTML = text;
            this.showHideMenuNode(menu, true);
            return;
        }
        let tokens = this.getTokens(text);
        let innerHtml = "";
        let show = true;
        if (tokens) {
            if (menu.classList.contains("disabled")) {
                innerHtml = text;
            } else {
                this.secondarySelectMenu = this.secondarySelectMenu || menu;
                if (!this.selectMenu && tokens[0].type === "completion-highlight") {
                    this.selectMenu = menu;
                }
                for (let i = 0; i < tokens.length; i++) {
                    innerHtml += "<span class='menu-" + tokens[i].type + "'>" + tokens[i].value + "</span>";
                }
            }
        } else {
            innerHtml = text;
            show = false;
        }
        this.showHideMenuNode(menu, show);
        menuTitle.innerHTML = innerHtml;
    }

    getTokens(string): any[] | undefined {
        let tokens: any[] = [];
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
                    return;
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
        this.element = dom.buildDom(["div", {class: "menu_searchbox"},
            ["span", {class: "search_field"}],
            ["span", {class: "searchbtn_filter"}],
            ["span", {class: "searchbtn_close"}]
        ]);
        this.element.$host = this;
        this.searchField = this.element.querySelector(".search_field");
        let _this = this;
        this.element?.querySelector(".searchbtn_close")?.addEventListener("mousedown", function (e) {
            _this.close();
        });
        this.element?.querySelector(".searchbtn_filter")?.addEventListener("mousedown", function (e) {
            _this.switchShowHideFiltered();
        });
    }
}
