var ace = require("ace-builds");

var lib = require("./lib");
var dom = ace.require("ace/lib/dom");
var oop = ace.require("ace/lib/oop");
var {EventEmitter} = ace.require("ace/lib/event_emitter");

var Editor = ace.require("ace/editor").Editor;
var EditSession = ace.require("ace/edit_session").EditSession;
var Renderer = ace.require("ace/virtual_renderer").VirtualRenderer;
var theme = ace.require("ace/theme/textmate");

var {Box, Pane} = require("./box");

class TabManager {
    constructor(options) {
        this.containers = {};
        this.containers.console = options.console;
        this.containers.main = options.main;
        this.tabs = {};
    }
    toJSON() {
        var containers = this.containers
        return {
            console: containers.console && containers.console.toJSON(),
            main: containers.main && containers.main.toJSON(),
        };
    }

    setChildBoxData(box, boxData, index) {
        if (!boxData[index])
            return;

        var boxType = boxData[index].type;
        if (!box[index])
            box.addChildBox(index, boxType === "pane" ? new Pane({tabList: {}}) : new Box({vertical: boxType === "vbox"}))

        this.setBoxData(box[index], boxData[index]);

    }
    setBoxData(box, boxData) {
        if (!boxData) return;

        var boxType = boxData.type;
        if (boxData.fixedSize)
            box.fixedSize = boxData.fixedSize;

        if (boxType === "pane") {
            if (boxData.tabBar) {
                box.tabBar.scrollLeft = boxData.tabBar.scrollLeft;
                if (boxData.tabBar.tabList) {
                    box.tabBar.freeze = true;
                    boxData.tabBar.tabList.forEach((tab) => {
                        tab = box.tabBar.addTab(tab)
                        this.tabs[tab.path] = tab;
                        if (tab.preview)
                            this.previewTab = tab;
                    })
                    box.tabBar.freeze = false;
                    box.tabBar.render();
                }
            }
        } else {
            box.hidden = boxData.hidden;
            box.ratio = boxData.ratio;
            this.setChildBoxData(box, boxData, 0);
            this.setChildBoxData(box, boxData, 1);
        }
    }
    setState(json) {
        var setState = (box, json) => {
            if (!box) return
            box.removeAllChildren();
            this.setBoxData(box, json);
            if (!box[0] && box.isMain)
                this.setChildBoxData(box, [{type: "pane"}], 0)
            
        };
        
        setState(this.containers.main, json && json.main);
        setState(this.containers.console, json && json.console);
    }
    clear() {

    }
    getPanes() {

    }
    getTabs() {

    }
    get activePane() {
        return this.containers.main.element.querySelector(".tabPanel").host
    }
    get activeTab() {
        return this.activePane.tabBar.activeTab;
    }
    get focussedTab() {
        return this.activePane.tabBar.activeTab;
    }

    activateTab(tab) {
        var pane = tab.parent.parent;

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
        tabManager.loadFile(tab);

        pane.resize();
    }

    deactivateTab(tab) {
        var pane = tab.parent.parent;
        if (tab.parent.activeTab == tab && pane.editor) {
            pane.editor.container.style.display = "none";
        }
    }
    
    open(options) {
        var tab = this.tabs[options.path]
        if (!tab || !tab.parent) {
            var pane = this.activePane
            if (this.previewTab)
                this.previewTab.close();
            
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
                this.previewTab.close();
            }
        }
        tab.parent.removeSelections()
        tab.parent.activateTab(tab);
        return tab;
    }
    
    clearPreviewStatus(tab) {
        tab.preview = false;
        tab.element.style.fontStyle = ""
        if (this.previewTab == tab)
            this.previewTab = null;
        
    }
}


oop.implement(TabManager.prototype, EventEmitter);

exports.TabManager = TabManager