import {tabCommands} from "../../commands/tabCommands";
import {Box} from "../boxes/box";

import oop = require("ace-code/src/lib/oop");
import {EventEmitter} from "ace-code/src/lib/event_emitter";
import useragent = require("ace-code/src/lib/useragent");

import {EditSession, LayoutHTMLElement, TabManagerOptions, TabOptions} from "../widget";
import {Tab} from "./tab";
import {Pane} from "../boxes/pane";
import {FileSystemWeb} from "../../file-system/file-system-web";
import {MenuManager} from "../menu/menuManager";
import {CommandManager} from "../../commands/commandManager";
import {Ace} from "ace-code";

let newTabCounter = 1;

export class TabManager {
    private static _instance: TabManager;
    containers: { "main": Box, [containerName: string]: Box };
    tabs: {[path: string]: Tab};
    previewTab?: Tab;
    activePane?: Pane;
    fileSystem?: FileSystemWeb;

    static getInstance(options?: TabManagerOptions) {
        if (!TabManager._instance)
            TabManager._instance = new TabManager(options!);

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
        let commandsKeys: Ace.Command[] = [];
        for (let command of tabCommands) {
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
        let containers = Object.keys(this.containers);
        return Object.fromEntries(containers.map(container => [container, this.containers[container]?.toJSON()]));
    }

    setChildBoxData(box: Box, boxData, index: number) {
        if (!boxData[index])
            return;

        let boxType = boxData[index].type;
        if (!box[index])
            box.addChildBox(index, boxType === "pane" ? new Pane() : new Box({vertical: boxType === "vbox"}))

        this.setBoxData(box[index], boxData[index]);

    }

    setBoxData(box: Box | Pane, boxData) {
        if (!boxData)
            return;

        if (boxData.fixedSize)
            box.fixedSize = boxData.fixedSize;

        if (box instanceof Pane) {
            if (boxData.tabBar) {
                box.tabBar.scrollLeft = boxData.tabBar.scrollLeft;
                if (boxData.tabBar.tabList) {
                    box.tabBar.freeze = true;
                    boxData.tabBar.tabList.forEach((tabData: TabOptions) => {
                        let tab: Tab = box.tabBar.addTab(new Tab(tabData)) as Tab;
                        this.tabs[tab.path] = tab;
                        if (tab.preview)
                            this.previewTab = tab;
                    })
                    box.tabBar.freeze = false;
                    box.tabBar.configure();
                }
            }
        } else {
            box.hidden = boxData.hidden;
            box.ratio = boxData.ratio;
            this.setChildBoxData(box, boxData, 0);
            this.setChildBoxData(box, boxData, 1);
        }
    }

    setState(state: {}) {
        this.activePane = undefined;
        this.tabs = {};
        this.previewTab = undefined;

        for (let container in this.containers) {
            this.setContainerState(container, state[container]);
        }
    }

    setContainerState(container: string, state: {}) {
        this.$setBoxState(this.containers[container], state);
    }

    private $setBoxState = (box, state) => {
        if (!box)
            return;
        box.removeAllChildren();
        this.setBoxData(box, state);
        if (!box[0] && box.isMain)
            this.setChildBoxData(box, [{type: "pane"}], 0);
    };

    clear() {

    }

    getPanes() {

    }

    getTabs() {
        return this.tabs;
    }

    get activeTab(): Tab | undefined {
        return this.activePane?.tabBar.activeTab;
    }

    open<SessionType extends EditSession>(tabOptions: TabOptions, container?: string, fileContent?: string): Tab<SessionType> {
        let tab = this.tabs[tabOptions.path];
        tabOptions.active = tabOptions.active ?? true;
        if (!tab || !tab.parent) {
            let pane: Pane;
            if (container) {
                pane = this.getContainerPane(container);
            } else {
                pane = this.activePane && this.activePane.tabBar.tabList.length > 0 ? this.activePane
                    : this.getContainerPane("main");
            }

            if (this.previewTab)
                this.previewTab.remove();

            tab = pane.tabBar.addTab(new Tab(tabOptions), undefined, fileContent) as Tab;
            if (tabOptions.preview)
                this.previewTab = tab;
            tab.parent!.scrollTabIntoView(tab);
            this.tabs[tab.path] = tab;
        }
        if (!tabOptions.preview) {
            if (this.previewTab == tab) {
                this.clearPreviewStatus(tab);
            } else if (this.previewTab) {
                this.previewTab.remove();
            }
        }
        tab.parent!.removeSelections()
        //TODO: duplicate of activateTab?
        tab.parent!.activateTab(tab, fileContent);
        return tab as Tab<SessionType>;
    }

    getContainerPane(container: string): Pane {
        return (this.containers[container]!.element!.querySelector(".tabPanel") as LayoutHTMLElement)!.$host as Pane;
    }

    clearPreviewStatus(tab: Tab) {
        tab.preview = false;
        tab.element.style.fontStyle = "";
        if (this.previewTab == tab)
            this.previewTab = undefined;
    }

    get newTabPath(): string {
        return `untitled_${newTabCounter}`;
    }

    addNewTab(pane: Pane, options?: TabOptions) {
        while (this.tabs.hasOwnProperty(this.newTabPath)) {
            newTabCounter++;
        }
        options ??= {title: `Untitled ${newTabCounter}`, path: this.newTabPath};
        options.active = true;

        let newTab = pane.tabBar.addTab(new Tab(options));
        this.tabs[this.newTabPath] = newTab;
        return newTab;
    };

    removeTab(tab: Tab) {
        delete this.tabs[tab.path];
    }

    //TODO: move to separate class
    loadFile(tab: Tab, fileContent?: string | null) {
        let editor = tab.isActive ? tab.editor! : tab.parent!.parent.getEditor(tab.editorType);
        editor.setSession(tab, fileContent);
    };

    navigateToTab(index: number, tab?: Tab, tabs?: Tab[]) {
        let tabsList = tabs || this.tabs;
        let activeTab = tab || this.activeTab;
        //TODO: seems we need better `activate` method for Tab
        if (index >= 0 && tabsList.length > index)
            activeTab?.parent?.activateTab(tabsList[index], undefined, true);
    }

    saveTo(storage: {}) {
        for (let path in this.tabs) {
            let tab = this.tabs[path];
            storage["@file@" + path] = tab.session ? tab.editor!.sessionToJSON(tab) : tab.sessionValue;
        }
    }

    restoreFrom(storage: {}) {
        for (let path in this.tabs) {
            let tab = this.tabs[path];
            tab.sessionValue = storage["@file@" + path];
            if (tab.session)
                tab.editor!.restoreSessionFromJson(tab);
        }
    }

    getTab(path: string): Tab | undefined {
        return this.tabs[path];
    }
}

oop.implement(TabManager.prototype, EventEmitter);