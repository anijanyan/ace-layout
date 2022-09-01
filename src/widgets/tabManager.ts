import {tabCommands} from "../models/commands";
import {Box, Pane} from "./box";
import * as ace from "ace-code";

import oop = require("ace-code/src/lib/oop");
import {EventEmitter} from "ace-code/src/lib/event_emitter";
import {HashHandler} from "ace-code/src/keyboard/hash_handler";
import event = require("ace-code/src/lib/event");
import useragent = require("ace-code/src/lib/useragent");
import keyUtil = require("ace-code/src/lib/keys");

import {Editor} from "ace-code/src/editor";
import {VirtualRenderer as Renderer} from "ace-code/src/virtual_renderer";
import theme = require("ace-code/src/theme/textmate");
import modeList = require("ace-code/src/ext/modelist");
import {TabList, TabManagerOptions} from "./widget";
import {Tab} from "./tab";

var newTabCounter = 1;

function parseJson(name) {
    try {
        let data = localStorage[name];
        return data && JSON.parse(data);
    } catch (e) {
        return null;
    }
}

function saveJson(name, value) {
    localStorage[name] = JSON.stringify(value);
}

export class TabManager {
    private static _instance: TabManager;
    containers: { "console"?: Box, "main": Box };
    tabs: TabList;
    previewTab: Tab;
    activePane: Pane;

    static getInstance(options?: TabManagerOptions) {
        if (!TabManager._instance) {
            TabManager._instance = new TabManager(options);
        }

        return TabManager._instance;
    }

    private constructor(options: TabManagerOptions) {
        this.containers = {console: options.console, main: options.main};
        this.tabs = {};
        this.commandsInit();
    }

    commandsInit() {
        window.menuManager.addByPath("/context/tabs");
        var commandsKeys = [];
        for (var command of tabCommands) {
            if (command.exec !== undefined) {
                window.menuManager.addByPath("/context/tabs/" + command.name, {
                    position: command.position,
                    hotKey: (useragent.isMac ? command.mac : command.win),
                    exec: command.exec
                });
                commandsKeys.push({
                    bindKey: {
                        win: command.win,
                        mac: command.mac
                    },
                    exec: command.exec
                });
            }
        }

        var menuKb = new HashHandler(commandsKeys);

        var _this = this;
        event.addCommandKeyListener(window, function (e, hashId, keyCode) {
            var keyString = keyUtil.keyCodeToString(keyCode);
            var command = menuKb.findKeyCommand(hashId, keyString);
            if (command) {
                event.stopEvent(e);
                command.exec(_this);
            }
        });
    }

    toJSON() {
        var containers = this.containers
        return {
            console: containers.console && containers.console.toJSON(),
            main: containers.main && containers.main.toJSON(),
        };
    }

    setChildBoxData(box: Box, boxData, index: number) {
        if (!boxData[index])
            return;

        var boxType = boxData[index].type;
        if (!box[index])
            box.addChildBox(index, boxType === "pane" ? new Pane({tabList: {}}) : new Box({vertical: boxType === "vbox"}))

        this.setBoxData(box[index], boxData[index]);

    }

    setBoxData(box: Box | Pane, boxData) {
        if (!boxData) return;

        var boxType = boxData.type;
        if (boxData.fixedSize)
            box.fixedSize = boxData.fixedSize;

        if (boxType === "pane") {
            if (boxData.tabBar) {
                box.tabBar.scrollLeft = boxData.tabBar.scrollLeft;
                if (boxData.tabBar.tabList) {
                    box.tabBar.freeze = true;
                    boxData.tabBar.tabList.forEach((tab: Tab) => {
                        tab = box.tabBar.addTab(tab)
                        this.tabs[tab.path] = tab;
                        if (tab.preview)
                            this.previewTab = tab;
                    })
                    box.tabBar.freeze = false;
                    box.tabBar.configurate();
                }
            }
        } else {
            box.hidden = boxData.hidden;
            box.ratio = boxData.ratio;
            this.setChildBoxData(box, boxData, 0);
            this.setChildBoxData(box, boxData, 1);
        }
    }

    setState(state) {
        var setState = (box, state) => {
            if (!box) return
            box.removeAllChildren();
            this.setBoxData(box, state);
            if (!box[0] && box.isMain)
                this.setChildBoxData(box, [{type: "pane"}], 0)

        };

        setState(this.containers.main, state && state.main);
        setState(this.containers.console, state && state.console);
    }

    clear() {

    }

    getPanes() {

    }

    getTabs() {
        return this.tabs;
    }

    get activeTab(): Tab {
        return this.activePane.tabBar.activeTab;
    }

    activateTab(tab: Tab) {
        var pane = tab.parent.parent;
        this.activePane = pane;

        function initBoxTabEditor() {
            tab.editorType = tab.editorType || "ace";
            if (!pane.editors) pane.editors = {};
            var editorType = tab.editorType;

            if (!pane.editors[editorType]) {
                pane.editor = new Editor(new Renderer(null, theme));
                pane.editor.container.style.position = "absolute";
                pane.editors[editorType] = pane.editor;
                pane.editor.setSession(null)
            } else {
                pane.editor = pane.editors[editorType];
            }
            pane.editor.container.style.display = "";

            pane.element.appendChild(pane.editor.container);
        }

        initBoxTabEditor();
        TabManager.getInstance().loadFile(tab);

        pane.resize();
    }

    deactivateTab(tab: Tab) {
        var pane = tab.parent.parent;
        if (tab.parent.activeTab == tab && pane.editor) {
            pane.editor.container.style.display = "none";
        }
    }

    open(options: { path: string, preview?: boolean }): Tab {
        var tab = this.tabs[options.path]
        if (!tab || !tab.parent) {
            var pane = this.activePane && this.activePane.tabBar.tabList.length > 0 ? this.activePane
                : this.containers.main.element.querySelector(".tabPanel").host;
            if (this.previewTab)
                this.previewTab.remove();

            var tabTitle = options.path.split("/").pop();

            tab = pane.tabBar.addTab({
                preview: options.preview,
                tabTitle: tabTitle,
                path: options.path,
                active: true,
            });
            if (options.preview)
                this.previewTab = tab;
            tab.parent.scrollTabIntoView(tab)
            this.tabs[tab.path] = tab
        }
        if (!options.preview) {
            if (this.previewTab == tab) {
                this.clearPreviewStatus(tab);
            } else if (this.previewTab) {
                this.previewTab.remove();
            }
        }
        tab.parent.removeSelections()
        tab.parent.activateTab(tab);
        return tab;
    }

    clearPreviewStatus(tab: Tab) {
        tab.preview = false;
        tab.element.style.fontStyle = ""
        if (this.previewTab == tab)
            this.previewTab = null;

    }

    saveMetadata(tab: Tab) {
        if (!tab.path || !tab.session) return;

        var session = tab.session
        var undoManager = tab.session.$undoManager;
        localStorage["@file@" + tab.path] = JSON.stringify({
            selection: session.selection.toJSON(),
            undoManager: undoManager.toJSON(),
            value: undoManager.isClean() ? undefined : session.getValue(),
            scroll: [
                session.getScrollLeft(),
                session.getScrollTop()
            ],
        });
    }

    /*updateSaveButton(e, editor) {
        var tab = editor.session.tab;
        if (tab.parent && tab.parent.activeTab == tab) {
            if (tab.session.getUndoManager().isClean() != this.refs.saveButton.disabled) {
                this.refs.saveButton.disabled = tab.session.getUndoManager().isClean();
            }
            if (this.refs.saveButton.disabled) {
                tab.element.classList.remove("changed");
            } else {
                tab.element.classList.add("changed");
            }
        }
        if (e && tab.preview) {
            tabManager.clearPreviewStatus(tab);
        }
    }*/

    setSession(tab: Tab, value?: string) {
        var editor = tab.editor
        if (!editor) return;

        if (editor.session && editor.session.tab) {
            this.saveMetadata(editor.session.tab);
        }

        if (typeof value == "string") {
            tab.session = ace.createEditSession(value || "");

            tab.session.tab = tab;
            // tab.editor.on("input", updateSaveButton)
            this.loadMetadata(tab)
        }

        editor.setSession(tab.session);

        if (tab.path !== undefined) {
            var mode = modeList.getModeForPath(tab.path).mode

            //TODO: set mode
            //editor.session.setMode(mode);
        }

        editor.container.style.display = "";

        editor.setOptions({
            newLineMode: "unix",
            enableLiveAutocompletion: true,
            enableBasicAutocompletion: true,
            showPrintMargin: false,
        });
    }

    loadMetadata(tab: Tab) {
        var path = tab.path;
        var session = tab.session;
        var metadata = parseJson("@file@" + path)
        if (!metadata) return;
        try {
            if (typeof metadata.value == "string" && metadata.value != session.getValue()) {
                session.doc.setValue(metadata.value);
            }
            if (metadata.selection) {
                session.selection.fromJSON(metadata.selection);
            }
            if (metadata.scroll) {
                session.setScrollLeft(metadata.scroll[0]);
                session.setScrollTop(metadata.scroll[1]);
            }

        } catch (e) {
            console.error(e)
        }
    }

    addNewTab(pane: Pane) {
        pane.tabBar.addTab({
            tabTitle: `Untitled ${newTabCounter++}`,
            active: true,
        });
    };

    loadFile(tab: Tab) {
        if (!tab.editor) return;

        if (tab.session) {
            this.setSession(tab, tab.session)
        } else if (!tab.path) {
            this.setSession(tab, "")
        } else if (tab.path) {
            tab.editor.container.style.display = "none";
            var fileContent = require("text-loader!../../node_modules/ace-code/src/" + tab.path)
            this.setSession(tab, fileContent);
        } else {
            tab.editor.container.style.display = "none";
        }
    };

    navigateToTab(index: number, tab?: Tab, tabs?: Tab[]) {
        var tabsList = tabs || this.tabs;
        var activeTab = tab || this.activeTab;
        //TODO: seems we need better `activate` method for Tab
        if (index >= 0 && tabsList.length > index) activeTab.parent.activateTab(tabsList[index]);
    }
}

oop.implement(TabManager.prototype, EventEmitter);
