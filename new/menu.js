var ace = require("ace-builds")

var dom = ace.require("ace/lib/dom");
var HashHandler = ace.require("ace/keyboard/hash_handler").HashHandler;
var event = ace.require("ace/lib/event");
var keyUtil = ace.require("ace/lib/keys");
var lib = require("./lib");

dom.importCssString(require("text-loader!./menu.css"), "menu.css");

function getEdge(style, dir) {
    return parseInt(style["padding" + dir], 10) +
        parseInt(style["margin" + dir], 10) +
        parseInt(style["border" + dir], 10);
}

function getElementEdges(element) {
    var style = getComputedStyle(element);
    var edge = {};
    edge.top = getEdge(style, "Top");
    edge.bottom = getEdge(style, "Bottom");
    edge.left = getEdge(style, "Left");
    edge.right = getEdge(style, "Right");

    return edge;
}

function getPrevSibling(node, conditionFn, parentElement) {
    parentElement = node ? node.parentElement : parentElement;
    var wrapped = false;
    do {
        node = node && node.previousSibling;
        if (!node && !wrapped) {
            node = parentElement.lastChild;
            wrapped = true;
        }
        if (!node) return;
    } while (!conditionFn(node));

    return node;
}

function getNextSibling(node, conditionFn, parentElement) {
    parentElement = node ? node.parentElement : parentElement;
    var wrapped = false;
    do {
        node = node && node.nextSibling;
        if (!node && !wrapped) {
            node = parentElement.firstChild;
            wrapped = true;
        }
        if (!node) return;
    } while (!conditionFn(node));

    return node;
}

class MenuManager {
    static findHost = lib.findHost;
    menus = {};
    activeMenu = null;

    find(path, item) {
        if (typeof path === "string") path = path.split("/");
        item = item || this.menus;
        path.forEach(function(part) {
            if (!item || !item.map) return;
            item = item.map[part];
        });
        return item;
    }

    addByPath(path, options) {
        if (typeof path == "string") path = path.split("/");
        var item = this.menus;
        path.forEach(function(part) {
            if (!item.map) item.map = {};
            if (!item.map[part]) item.map[part] = {};
            item = item.map[part];
        });
        item.path = path.join("/");
        var name = path.pop();
        item.id = name;
        item.label = options.label || name;
        item.position = options.position;
        item.hotKey = options.hotKey;
        item.type = options.type;
        item.checked = options.checked;
        item.disabled = options.disabled;
        item.className = options.className;
        item.exec = options.exec;
    }

    getTarget(target) {
        while (target) {
            if (target.$host) return target;
            target = target.parentElement;
        }
        return null;
    }

    bindKeys() {
        function isMenuBarItem(node) {
            return node.classList.contains("menuButton");
        }
        function isMenuPopupActiveItem(node) {
            return node.classList.contains("menu_item") && !node.classList.contains("disabled") && !node.isFiltered;
        }
        function menuKeyDown(menuManager) {
            var menuPopup = menuManager.activeMenu.getLastOpenPopup();
            if (!menuPopup)
                return;

            var menu = menuPopup.selectedMenu ? menuPopup.selectedMenu.buttonElement : null;

            var nextMenu = getNextSibling(menu, isMenuPopupActiveItem, menuPopup.element);
            menuPopup.moveOnTarget(nextMenu);
            menuPopup.scrollIfNeeded();
        }
        var menuKb = new HashHandler([
            {
                bindKey: "Esc",
                name: "Esc",
                exec: function (menuManager) {
                    if (menuManager.searchBox && menuManager.searchBox.isOpen) {
                        menuManager.searchBox.close();
                        return;
                    }
                    var activeMenu = menuManager.activeMenu;
                    if (!activeMenu.menuPopup && activeMenu !== menuManager.menuBar) {
                        activeMenu.close();
                        menuManager.closeMenu();
                    } else {
                        activeMenu.closeLastMenu();
                        if (!activeMenu.menuPopup && activeMenu === menuManager.menuBar) {
                            menuManager.closeMenu();
                        }
                    }
                }
            }, {
                bindKey: "Left",
                name: "Left",
                exec: function (menuManager) {
                    var activeMenu = menuManager.activeMenu;
                    activeMenu.closeLastMenu();
                    if (!activeMenu.menuPopup) {
                        if (activeMenu === menuManager.menuBar) {
                            var prevMenu = getPrevSibling(activeMenu.selectedMenu.buttonElement, isMenuBarItem);
                            if (prevMenu) {
                                activeMenu.moveOnTarget(prevMenu);
                            }
                        } else if (!activeMenu.element) {
                            menuManager.closeMenu();
                        }

                    }
                }
            }, {
                bindKey: "Right",
                name: "Right",
                exec: function (menuManager) {
                    function moveToNextOnBar() {
                        if (menuManager.activeMenu !== menuManager.menuBar) {
                            return;
                        }
                        var nextMenu = getNextSibling(menuManager.menuBar.selectedMenu.buttonElement, isMenuBarItem);
                        if (nextMenu) {
                            menuManager.menuBar.moveOnTarget(nextMenu);
                        }
                    }
                    var menuPopup = menuManager.activeMenu.getLastOpenPopup();
                    var menu = menuManager.activeMenu.getLastSelectedMenu();
                    if (!menu) {
                        return;
                    }
                    var moveToNext = !menu.map || (menuManager.activeMenu === menuManager.menuBar && !menuManager.activeMenu.menuPopup.selectedMenu);

                    if (!moveToNext && ((!menuPopup.selectedMenu && (menuManager.activeMenu.menuPopup !== menuPopup || menuManager.activeMenu !== menuPopup))
                        || menuPopup.selectedMenu === menu)) {
                        var isNewOpened = false;
                        if (menuPopup.selectedMenu === menu) {
                            menuPopup.openMenu();
                            isNewOpened = true;
                        }
                        menuKeyDown(menuManager);
                        if (!isNewOpened && !menuPopup.selectedMenu) {
                            moveToNext = true;
                        }
                    }
                    if (moveToNext) {
                        moveToNextOnBar();
                    }
                }
            },  {
                bindKey: "Enter",
                name: "Enter",
                exec: function (menuManager) {
                    var menuPopup = menuManager.activeMenu.getLastOpenPopup();
                    var menu = menuManager.activeMenu.getLastSelectedMenu();
                    if (menu && menu.map && menuPopup.selectedMenu === menu) {
                        menuPopup.openMenu();
                    }
                }
            }, {
                bindKey: "Up",
                name: "Up",
                exec: function (menuManager) {
                    var menuPopup = menuManager.activeMenu.getLastOpenPopup();
                    var menu = menuPopup.selectedMenu ? menuPopup.selectedMenu.buttonElement : null;

                    var prevMenu = getPrevSibling(menu, isMenuPopupActiveItem, menuPopup.element);
                    menuPopup.moveOnTarget(prevMenu);
                    menuPopup.scrollIfNeeded();
                }
            }, {
                bindKey: "Backspace",
                name: "Backspace",
                exec: function (menuManager) {
                    menuManager.searchBox.removeSymbol();
                }
            }, {
                bindKey: "Down",
                name: "Down",
                exec: menuKeyDown
            }]);

        var _this = this;
        event.addCommandKeyListener(window, function (e, hashId, keyCode) {
            if (!_this.isActive) {
                return;
            }
            event.stopEvent(e);

            var keyString = keyUtil.keyCodeToString(keyCode);
            var command = menuKb.findKeyCommand(hashId, keyString);
            if (command) {
                command.exec(_this);
            } else if (e.key.length === 1) {
                menuManager.addSymbolToSearchBox(e.key);
            }
        });
    }

    build() {
        window.addEventListener("contextmenu", this.onContextMenu);
    }

    buildMenuBar(parent) {
        this.menuBar = new MenuBar();
        this.menuBar.menus = this.menus;
        this.menuBar.menuManager = this;
        this.menuBar.build(parent);
    }

    openMenuByPath(path, position) {
        if (typeof path === "string") path = path.split("/");
        if (path[0] && path[0].length) {//TODO context menu
            this.activeMenu = this.menuBar;
        } else {
            this.activeMenu = new MenuPopup();
            this.activeMenu.menuManager = this;
            this.activeMenu.position = position;
            this.activeMenu.menu = this.find(path);
            this.activeMenu.open();
        }
        this.activateMenu();
        this.activeMenu.openMenuByPath(path);
    }

    activateMenu() {
        this.isActive = true;
        window.addEventListener("mousedown", this.onMouseDown);
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("resize", this.onWindowResize);
        if (this.activeMenu.activateMenu) {
            this.activeMenu.activateMenu();
        }
    }
    closeMenu() {
        this.isActive = false;
        window.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("resize", this.onWindowResize);
        if (this.activeMenu.closeMenu) {
            this.activeMenu.closeMenu();
        }
        this.activeMenu = null;
        if (this.searchBox) {
            this.searchBox.close();
        }
    }

    //event handlers
    onMouseDown(e) {
        var host = lib.findHost(e.target);
        if (host && host.buttonElement) {
            if (host.exec) {
                host.exec()
            }
            
        }

        this.closeMenu();
    }
    onMouseDown = this.onMouseDown.bind(this);

    onMouseMove(e) {
        var lastPos = {x: e.clientX, y: e.clientY};
        if (this.lastPos && this.lastPos.x === lastPos.x && this.lastPos.y === lastPos.y) {
            return;
        }
        this.prevPos = this.lastPos;
        this.lastPos = lastPos;
    }

    onMouseMove = this.onMouseMove.bind(this);

    onWindowResize(e) {
        if (!this.activeMenu) {
            return;
        }
        var menuPopup = this.activeMenu.constructor.name === "MenuPopup" ? this.activeMenu : this.activeMenu.menuPopup;
        if (menuPopup) {
            menuPopup.renderRecursive();
        }
    }
    onWindowResize = this.onWindowResize.bind(this);

    onContextMenu(e) {
        e.preventDefault();
        if (this.getTarget(e.target)) {
            return;
        }

        var pos = {x: e.clientX + 2, y: e.clientY + 2};
        this.openMenuByPath("/context", pos);
    }
    onContextMenu = this.onContextMenu.bind(this);

    addSymbolToSearchBox(symbol) {
        if (!this.searchBox || !this.searchBox.isOpen) {
            this.openSearchBox();
        }
        this.searchBox.addSymbol(symbol);
    }

    openSearchBox() {
        if (!this.searchBox) {
            this.searchBox = new MenuSearchBox();
            this.searchBox.menuManager = this;
        }

        this.searchBox.setParentPopup(this.activeMenu.getLastOpenPopup());
        this.searchBox.open();
    }
}
MenuManager.prototype.add = MenuManager.prototype.addByPath


class Menu {
    menuManager;
    selectedMenu = null;
    menuPopup = null;
    selectedClass;
    element;

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

    selectMenu(menu) {
        menu.buttonElement.classList.add(this.selectedClass);
        this.selectedMenu = menu;
    }
    unselectMenu() {
        if (!this.selectedMenu) {
            return;
        }
        this.selectedMenu.buttonElement.classList.remove(this.selectedClass);
        this.selectedMenu = null;
    }

    openMenu(direction) {
        if (!direction && this.constructor.name === "MenuPopup") {
            direction = "right";
        }
        if (this.menuPopup) {
            return this.menuPopup;
        }
        this.menuPopup = new MenuPopup();
        this.menuPopup.direction = direction;
        this.menuPopup.isSubMenu = this.constructor.name === "MenuPopup";
        this.menuPopup.menuManager = this.menuManager;
        this.menuPopup.menu = this.selectedMenu;
        this.menuPopup.parentMenu = this;
        this.menuPopup.open();

        if (this.menuManager.searchBox && this.menuManager.searchBox.isOpen){
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
        if (this.menuManager.searchBox && this.menuManager.searchBox.isOpen && this.menuPopup.isSubMenu && this.menuManager.searchBox.value.substr(this.menuManager.searchBox.value.length - 1, 1) === "/"){
            this.menuManager.searchBox.removeSymbol();
        }
        this.menuPopup.close();
        this.menuPopup = null;
    }

    moveOnTarget(target) {
        var host = target ? target.$host : null;
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

    getMenuByPath(path){}
    openMenuByPath(path) {
        if (typeof path === "string") path = path.split("/");
        var menu = this.getMenuByPath(path.shift());

        if (!menu) return;
        if (!menu.$host) {
            menu.$host = menu;
        }
        this.moveOnTarget(menu);
        if (!menu.$host.map) return;
        this.openMenu();
        if (path.length) {
            this.menuPopup.openMenuByPath(path, menu);
        }
    }
}

class MenuBar extends Menu {
    selectedClass = "menuButtonDown";
    menus;
    build(parent) {
        this.element = parent;
        var items = this.menus.map;
        Object.keys(items).filter(Boolean).map(key => items[key]).sort(function(item1, item2) {
            return item1.position - item2.position;
        }).map(item => {
            item.$buttonElement = dom.buildDom(["div", {
                class: "menuButton" + (item.className ? " " + item.className : ""),
                $host: item,
                onmousedown: e => this.onMouseDown(e),
            }, item.label + ""], this.element);
        });
        var rect = this.element.getBoundingClientRect();
        this.bottom = rect.bottom;
    }

    activateMenu() {
        this.element.addEventListener("mousemove", this.onMouseMove);
    }
    closeMenu() {
        this.unselectMenu();
        this.closeMenu();
        this.element.removeEventListener("mousemove", this.onMouseMove);
    }
    /*** event handlers ***/
    onMouseDown(e) {
        e.preventDefault();
        var activate = true;
        if (this.menuManager.isActive) {
            activate = this.menuManager.activeMenu !== this;
            this.menuManager.closeMenu();
        }
        if (activate) {
            var target = e.target;
            target.$host.buttonElement = target.$host.$buttonElement;
            this.selectMenu(target.$host);
            this.openMenu();
            this.menuManager.activeMenu = this;
            this.menuManager.activateMenu();
        }
    }
    moveOnTarget(target) {
        super.moveOnTarget(target);
        if (this.selectedMenu.map) {
            this.openMenu();
        }
    }
    onMouseMove(e) {
        var target = this.menuManager.getTarget(e.target);

        this.moveOnTarget(target);
    }
    onMouseMove = this.onMouseMove.bind(this);
    getMenuByPath(path) {
        return this.menuManager.find(path);
    }
}

class MenuPopup extends Menu{
    selectedClass = "hover";
    menu;
    position;
    isSubMenu = false;
    direction;
    closeMenu() {
        this.close();
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

        var result = {};

        if (this.menu.map) {
            var items = Object.values(this.menu.map).sort(function(item1, item2) {
                return item1.position - item2.position;
            });
            var afterDivider = true;
            var result = items
                .map((item) => {
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
                    var classList = ["menu_item"];
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
                    onclick: this.onClick
                },
                result,
            ],
            document.body
        );
        this.element = this.menu.element;
    }
    render() {
        if (this.element.style.maxWidth){
            this.element.style.maxWidth = window.innerWidth + "px";
        }
        if (this.element.style.maxHeight){
            this.element.style.maxHeight = window.innerHeight + "px";
        }

        var elRect = this.element.getBoundingClientRect();

        var edge = getElementEdges(this.element);

        var parentRect, top, left;

        if (this.menu && this.menu.buttonElement) {
            parentRect = this.menu.buttonElement.getBoundingClientRect();
        }

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



        var targetH = Math.min(elRect.height, window.innerHeight);
        var availableH = window.innerHeight - top - edge.top - edge.bottom - 2;

        if (availableH < targetH && (!parentRect || this.isSubMenu)) {
            var tmpTop = parentRect ? window.innerHeight : top;
            top = tmpTop - targetH - edge.top;
            top = Math.max(top, this.menuManager.menuBar.bottom);
            availableH = window.innerHeight - top - edge.top - edge.bottom - 2;
        }
        this.element.style.maxHeight = (availableH - 10) + "px";
        elRect = this.element.getBoundingClientRect();

        var availableW = window.innerWidth - left - edge.left - edge.right - 2;
        if (availableW < elRect.width) {
            if (parentRect) {
                var tmpLeft = this.isSubMenu ? parentRect.left : parentRect.right;
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
        this.element.style.zIndex = 195055;
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
        if (!this.selectedMenu) {
            return;
        }
        var menu = this.element;
        var item = this.selectedMenu.buttonElement;
        var menuRect = menu.getBoundingClientRect();
        var itemRect = item.getBoundingClientRect();

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
    onMouseMove(e) {
        if (e.target === this.element) {
            return;
        }

        if (this.menuPopup && this.isDirectedToSubMenu(e)) {
            return;
        }

        var target = this.menuManager.getTarget(e.target);
        if (target === this.element) {
            return;
        }

        this.moveOnTarget(target);
        if (this.selectedMenu.map) {
            this.openMenu();
        }
    }
    onMouseMove = this.onMouseMove.bind(this);

    onClick(e) {
        if (e.target === this.element)
            return;

        var target = this.menuManager.getTarget(e.target);
        if (target === this.element)
            return;

        var host = target.$host;
        if (host.hotKey) {
            this.menuManager.closeMenu();
        }
    }
    onClick = this.onClick.bind(this);

    isDirectedToSubMenu(e) {
        var currPos = {x: e.clientX, y: e.clientY};
        var prevPos = this.menuManager.prevPos;
        var rect = this.menuPopup.element.getBoundingClientRect();

        var rectYTop = rect.top;
        var rectYBottom = rect.bottom;

        if (currPos.y < rectYTop || currPos.y > rectYBottom) {
            return false;
        }

        var rectX = this.menuPopup.direction === "left" ? rect.right : rect.left;
        var prevDiffX = Math.abs(rectX - prevPos.x);
        var currDiffX = Math.abs(rectX - currPos.x);

        if (prevDiffX < currDiffX) {
            return false;
        }

        var directedToBottom = currPos.y > prevPos.y;
        var prevDiffY = directedToBottom ? rectYBottom - prevPos.y : prevPos.y - rectYTop;
        var tng = prevDiffY / prevDiffX;
        var maxYDiff = tng * currDiffX;

        return (directedToBottom && rectYBottom - maxYDiff >= currPos.y) || (!directedToBottom && rectYTop + maxYDiff <= currPos.y);
    }

    renderRecursive() {
        this.render();
        if (this.menuPopup) {
            this.menuPopup.renderRecursive();
        }
    }

    getMenuByPath(path) {
        var childNode;
        for (var i = 0; i < this.element.childNodes.length; i++) {
            childNode = this.element.childNodes[i];
            if (childNode.$host && childNode.$host.id === path) {
                if (childNode.classList.contains("menu_item") && !childNode.classList.contains("disabled")) {
                    return childNode;
                }
            }
        }
        return null;
    }
}

class MenuSearchBox {
    parentPopup = null;
    isOpen = false;
    hideFiltered = false;
    value = "";
    currValue = "";
    currPopupMenu;
    menuManager = null;

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
        if (this.value.length){
            this.value = "";
            this.currValue = "";
            this.update();
        }
        this.parentPopup = null;

        this.element.remove();
    }

    setParentPopup(parentPopup) {
        if (this.parentPopup && this.parentPopup.element) {
            if (this.parentPopup.prevMaxHeight) {
                this.parentPopup.element.style.maxHeight = this.parentPopup.prevMaxHeight;
            }
        }
        this.parentPopup = parentPopup;
        this.currPopupMenu = parentPopup;
        if (this.isOpen) {
            this.calcElementPosition();
            var currPopupMenu = parentPopup;
            var valueArr = this.value.split("/");
            while (currPopupMenu) {
                this.currPopupMenu = currPopupMenu;
                this.currValue = valueArr.shift();
                this.isChanged = true;
                this.update();
                this.isOpen = false;
                currPopupMenu = this.currPopupMenu.selectedMenu && this.currPopupMenu.selectedMenu.map ? this.currPopupMenu.openMenu() : null;
                this.isOpen = true;
            }
        }
    }

    calcElementPosition() {
        this.parentPopup.prevMaxHeight = null;
        var parentRect = this.parentPopup.element.getBoundingClientRect();
        var top = parentRect.top - 20;
        if(top < this.menuManager.menuBar.bottom){
            top = parentRect.bottom;
            if (parentRect.bottom + 20 > window.innerHeight) {
                this.parentPopup.prevMaxHeight = this.parentPopup.element.style.maxHeight;
                this.parentPopup.element.style.maxHeight = (parseInt(this.parentPopup.element.style.maxHeight, 10) - 20) + "px";
                top -= 20;
            }
        }
        this.element.style.top = top + "px";
        this.element.style.right = (window.innerWidth - parentRect.right) + "px";
    }

    addSymbol(symbol) {
        if (symbol === "/" && this.value.substr(this.value.length - 1, 1) === "/") {
            return;
        }
        this.value += symbol;
        if (symbol === "/") {
            if (this.currPopupMenu.selectedMenu && this.currPopupMenu.selectedMenu.map) {
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
        var removed = this.value.substr(this.value.length - 1, 1);
        this.value = this.value.substr(0, this.value.length - 1);

        if (removed === "/") {
            this.currValue = this.value.split("/").pop();
            this.currPopupMenu = this.currPopupMenu.parentMenu;
            this.isChanged = false;
        } else {
            this.currValue = this.currValue.substr(0, this.currValue.length - 1);
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

        if (!show && menu.classList.contains("hover") && this.currPopupMenu.menuPopup) {
            show = true;
        }
        menu.isFiltered = !show;
        show = show || !this.hideFiltered;
        menu.style.display = show ? "block" : "none";
    }

    setPopupMenuHighlights() {
        var childNode;
        this.selectMenu = null;
        this.secondarySelectMenu = null;
        if (this.hideFiltered) {
            var rect = this.currPopupMenu.element.getBoundingClientRect();
            var edges = getElementEdges(this.currPopupMenu.element);
            var width = rect.width - edges.left - edges.right;
        }
        var afterDivider = true;
        var noResult = true;

        for (var i = 0; i < this.currPopupMenu.element.childNodes.length; i++) {
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
            this.currPopupMenu.element.style.width = Math.ceil(width) + "px";
            var noResultEl = this.currPopupMenu.element.querySelector(".menu_no_result");
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
            var suggestionList = {};
            var addToSuggestionList = (menus) => {
                Object.keys(menus).forEach((name) => {
                    var item = menus[name];
                    if (item.label && item.label[0] === "~") {
                        return;
                    }
                    if (!item.path) {
                        console.log(item);
                        return;
                    }
                    var path = item.path;
                    var tokens = this.getTokens(path);
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

            addToSuggestionList(this.menuManager.menus.map);

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

            for (var i = 0; i < this.suggestionPopup.element.childNodes.length; i++) {
                var childNode = this.suggestionPopup.element.childNodes[i];
                var menuTitle = childNode.querySelector("a");
                var innerHtml = "";
                for (var t = 0; t < childNode.$host.tokens.length; t++) {
                    innerHtml += "<span class='menu-" + childNode.$host.tokens[t].type + "'>" + childNode.$host.tokens[t].value + "</span>";
                }
                menuTitle.innerHTML = innerHtml;
            }
        }
    }

    setHighlights(menu) {
        var text = menu.$host.label;
        var menuTitle = menu.querySelector("a");
        if (!this.currValue.length) {
            menuTitle.innerHTML = text;
            this.showHideMenuNode(menu, true);
            return;
        }
        var tokens = this.getTokens(text);
        var innerHtml = "";
        var show = true;
        if (tokens) {
            if (menu.classList.contains("disabled")) {
                innerHtml = text;
            } else {
                this.secondarySelectMenu = this.secondarySelectMenu || menu;
                if (!this.selectMenu && tokens[0].type === "completion-highlight") {
                    this.selectMenu = menu;
                }
                for (var i = 0; i < tokens.length; i++) {
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
        this.element = dom.buildDom(["div", {class: "menu_searchbox"},
            ["span", {class: "search_field"}],
            ["span", {class: "searchbtn_filter"}],
            ["span", {class: "searchbtn_close"}]
        ]);
        this.element.$host = this;
        this.searchField = this.element.querySelector(".search_field");
        var _this = this;
        this.element.querySelector(".searchbtn_close").addEventListener("mousedown", function (e) {
            _this.close();
        });
        this.element.querySelector(".searchbtn_filter").addEventListener("mousedown", function (e) {
            _this.switchShowHideFiltered();
        });
    }
}

class MenuToolBar {
    constructor(options) {
        this.menus = options.menus;
    }

    setBox(x, y, w, h) {
        lib.setBox(this.element, x, y, w, h);
        this.box = [x, y, w, h];
    }
    draw() {
        if (!this.element) {
            this.element = dom.buildDom(["div", {
                class: "menuToolBar",
            }, [
                "div", {
                    class: "menuBar",
                    ref: "menuBar"
                }
            ]], null, this);

            var menuManager = new MenuManager();
            window.menuManager = menuManager;

            var $menuDefs = {
                "AWS Cloud9": "50,,,,",
                "File": "100,,,,",
                "Edit": "200,,,,",
                "Find": "300,,,,",
                "View": "400,,,,",
                "Go": "500,,,,",
                "Tools": "700,,,,",
                "Window": "800,,,,",
                "File/~1000000": "1000000,,,,",
                "File/Download Project": "1300,,false,, ",
                "File/Open Recent": "500,,false,, ",
                "File/Open Recent/~1000000": "1000000,,,,",
                "File/Open Recent/Clear Menu": "2000000,,false,true, ",
                "View/Console": "700,check,false,false,F6",
            };


            function addDefs(menuDefs, root) {
                Object.keys(menuDefs).forEach(function(x) {
                    var item = menuDefs[x];
                    if (typeof item == "object") {
                        return addDefs(item, x);
                    }
                    var parts = /(\d*),([^,]*),([^,]*),([^,]*),(.*)/.exec(item);
                    var path = root ? root + "/" + x : x;


                    menuManager.addBypath(path, {
                        className: path == "AWS Cloud9" ? "btn" : undefined,
                        type: parts[2],
                        checked: parts[3] == "true",
                        disabled: parts[4] == "true",
                        position: parseInt(parts[1]),
                        hotKey: (parts[5] || "").trim(),
                    });
                });
            }

            addDefs($menuDefs);

            menuManager.build();
            menuManager.buildMenuBar(this.menuBar);
            menuManager.bindKeys();
        }
        return this.element
    }
}

exports.MenuManager = MenuManager;
exports.MenuToolBar = MenuToolBar;
