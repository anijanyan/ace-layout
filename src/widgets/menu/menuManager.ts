import {Utils} from "../../lib";
import {LayoutHTMLElement, MenuOptions, Position} from "../widget";
import {MenuBar, MenuPopup, MenuSearchBox} from "./menu";
import {HashHandler} from "ace-code/src/keyboard/hash_handler";

import event = require("ace-code/src/lib/event");
import keyUtil = require("ace-code/src/lib/keys");

function getPrevSibling(node, conditionFn, parentElement?: HTMLElement) {
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

function getNextSibling(node, conditionFn, parentElement?: HTMLElement) {
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

export class MenuManager {
    private static _instance: MenuManager;
    static findHost = Utils.findHost;
    menus = new MenuItems();

    activeMenu: MenuPopup | MenuBar = null;
    isActive: boolean;
    menuBar: MenuBar;
    searchBox: MenuSearchBox;
    currentHost: any;
    lastPos: Position;
    prevPos: Position;

    static getInstance() {
        if (!MenuManager._instance) {
            MenuManager._instance = new MenuManager();
        }

        return MenuManager._instance;
    }

    find(path, item?: MenuItems) {
        if (typeof path === "string") path = path.split("/");
        item = item || this.menus;
        path.forEach(function (part) {
            if (!item || !item.map) return;
            item = item.map[part];
        });
        return item;
    }

    addByPath(path, options: MenuOptions = {}) {
        if (typeof path == "string") path = path.split("/");
        var item = this.menus;
        path.forEach(function (part) {
            item.map ??= {};
            item.map[part] ??= new MenuItems();
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

    getTarget(target: LayoutHTMLElement, callback?: any): LayoutHTMLElement {
        while (target) {
            if (target.$host && (!callback || callback(target))) return target;
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

        function menuKeyDown(menuManager: MenuManager) {
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
                        menuManager.inactivateMenu();
                    } else {
                        activeMenu.closeLastMenu();
                        if (!activeMenu.menuPopup && activeMenu === menuManager.menuBar) {
                            menuManager.inactivateMenu();
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
                            menuManager.inactivateMenu();
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
            }, {
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
                MenuManager.getInstance().addSymbolToSearchBox(e.key);
            }
        });
    }

    build() {
        window.addEventListener("contextmenu", this.onContextMenuOpen);
    }

    buildMenuBar(parent) {
        this.menuBar = new MenuBar();
        this.menuBar.menus = this.menus;
        this.menuBar.menuManager = this;
        this.menuBar.build(parent);
    }

    openMenuByPath(path, position: Position) {
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

    inactivateMenu() {
        this.isActive = false;
        window.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("resize", this.onWindowResize);
        if (this.activeMenu.inactivateMenu) {
            this.activeMenu.inactivateMenu();
        }
        this.activeMenu = null;
        if (this.searchBox) {
            this.searchBox.close();
        }
        this.currentHost = null;
    }

    //event handlers
    onMouseDown = (e) => {
        var host = Utils.findHost(e.target);
        if (host && host.buttonElement) {
            e.preventDefault();
            if (host.exec) {
                host.exec(this.currentHost);
            }
        }

        let target = this.getTarget(e.target, (target) => target.$host instanceof MenuItems);
        if (!target)
            this.inactivateMenu();
    }

    onMouseMove = (e) => {
        var lastPos = {x: e.clientX, y: e.clientY};
        if (this.lastPos && this.lastPos.x === lastPos.x && this.lastPos.y === lastPos.y) {
            return;
        }
        this.prevPos = this.lastPos;
        this.lastPos = lastPos;
    }

    onWindowResize = (e) => {
        if (!this.activeMenu) {
            return;
        }
        var menuPopup = this.activeMenu instanceof MenuPopup ? this.activeMenu : this.activeMenu.menuPopup;
        if (menuPopup) {
            menuPopup.renderRecursive();
        }
    }

    onContextMenuOpen = (e) => {
        e.preventDefault();
        let target = this.getTarget(e.target, (target) => target.$host.contextMenu);
        if (!target) {
            return;
        }

        var pos = {x: e.clientX + 2, y: e.clientY + 2};
        this.openMenuByPath("/context/" + target.$host.contextMenu, pos);
        this.currentHost = target.$host;
    }

    addSymbolToSearchBox(symbol: string) {
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

    add = this.addByPath;
}

export class MenuItems {
    map: { [part: string]: MenuItems };
    path: any;
    id: any;
    label: any;
    position: number;
    hotKey: string;
    type: string;
    checked: boolean;
    disabled: boolean;
    className: string;
    exec: Function;
    element: LayoutHTMLElement;
    buttonElement?: HTMLElement;
    $buttonElement?: HTMLElement;
}