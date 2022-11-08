import {tabCommands} from "../../commands/tabCommands";
import {Box} from "../boxes/box";

import oop = require("ace-code/src/lib/oop");
import {EventEmitter} from "ace-code/src/lib/event_emitter";
import useragent = require("ace-code/src/lib/useragent");

import {TabList, TabManagerOptions, TabOptions} from "../widget";
import {Tab} from "./tab";
import {Pane} from "../boxes/pane";
import {FileSystemWeb} from "../../file-system/file-system-web";
import {MenuManager} from "../menu/menuManager";
import {CommandManager} from "../../commands/commandManager";

var newTabCounter = 1;

function saveJson(name, value) {
    localStorage[name] = JSON.stringify(value);
}

export class TabManager {
    private static _instance: TabManager;
    containers: { "main": Box, [containerName: string]: Box };
    tabs: TabList;
    previewTab: Tab;
    activePane: Pane;
    fileSystem?: FileSystemWeb;

    static getInstance(options?: TabManagerOptions) {
        if (!TabManager._instance) {
            TabManager._instance = new TabManager(options);
        }

        return TabManager._instance;
    }

    private constructor(options: TabManagerOptions) {
        this.containers = options.containers;
        this.tabs = {};
        this.fileSystem = options.fileSystem;
        this.commandsInit();
    }

    commandsInit() {
        MenuManager.getInstance().addByPath("/context/tabs");
        var commandsKeys = [];
        for (var command of tabCommands) {
            if (command.exec !== undefined) {
                MenuManager.getInstance().addByPath("/context/tabs/" + command.name, {
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

        CommandManager.registerCommands(commandsKeys, this);
    }

    toJSON() {
        var containers = this.containers;
        return Object.fromEntries(Object.keys(containers).map(container => [container, containers[container] && containers[container].toJSON()]));
    }

    setChildBoxData(box: Box, boxData, index: number) {
        if (!boxData[index])
            return;

        var boxType = boxData[index].type;
        if (!box[index])
            box.addChildBox(index, boxType === "pane" ? new Pane() : new Box({vertical: boxType === "vbox"}))

        this.setBoxData(box[index], boxData[index]);

    }

    setBoxData(box: Box | Pane, boxData) {
        if (!boxData) return;

        if (boxData.fixedSize)
            box.fixedSize = boxData.fixedSize;

        if (box instanceof Pane) {
            if (boxData.tabBar) {
                box.tabBar.scrollLeft = boxData.tabBar.scrollLeft;
                if (boxData.tabBar.tabList) {
                    box.tabBar.freeze = true;
                    boxData.tabBar.tabList.forEach((tabData: TabOptions) => {
                        let tab = box.tabBar.addTab(new Tab(tabData))
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
                this.setChildBoxData(box, [{type: "pane"}], 0);
        };

        for (let container in this.containers) {
            setState(this.containers[container], state && state[container]);
        }
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

    deactivateTab(tab: Tab) {
        var pane = tab.parent.parent;
        if (tab.parent.activeTab == tab && pane.editor) {
            pane.editor.container.style.display = "none";
        }
    }

    open(options: { path: string, preview?: boolean, fileContent?: string }): Tab {
        var tab = this.tabs[options.path]
        if (!tab || !tab.parent) {
            var pane = this.activePane && this.activePane.tabBar.tabList.length > 0 ? this.activePane
                : this.containers.main.element.querySelector(".tabPanel").host;
            if (this.previewTab)
                this.previewTab.remove();

            var tabTitle = options.path.split("/").pop();

            tab = pane.tabBar.addTab(new Tab({
                preview: options.preview,
                title: tabTitle,
                path: options.path,
                active: true,
            }), undefined, options.fileContent);
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
        //TODO: duplicate of activateTab?
        tab.parent.activateTab(tab, options.fileContent);
        return tab;
    }

    clearPreviewStatus(tab: Tab) {
        tab.preview = false;
        tab.element.style.fontStyle = ""
        if (this.previewTab == tab)
            this.previewTab = null;

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


    addNewTab(pane: Pane, options?: TabOptions) {
        options = options ?? {title: `Untitled ${newTabCounter++}`};
        options.active = true;
        return pane.tabBar.addTab(new Tab(options));
    };

    //TODO: move to separate class
    loadFile(tab: Tab, fileContent?: string) {
        let editor = tab.editor ?? tab.parent.parent.initEditor(tab.editorType);
        if (tab.session) {
            editor.setSession(tab, tab.session.getValue());
        } else if (!tab.path) {
            editor.setSession(tab, "");
        } else if (tab.path) {
            editor.container.style.display = "none";
            editor.setSession(tab, fileContent ?? "");
        } else {
            editor.container.style.display = "none";
        }
    };

    navigateToTab(index: number, tab?: Tab, tabs?: Tab[]) {
        var tabsList = tabs || this.tabs;
        var activeTab = tab || this.activeTab;
        //TODO: seems we need better `activate` method for Tab
        if (index >= 0 && tabsList.length > index) activeTab.parent.activateTab(tabsList[index], "", true);
    }
}

oop.implement(TabManager.prototype, EventEmitter);
