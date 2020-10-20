define(function(require, exports, module) {
var dom = require("ace/lib/dom");
var lib = require("layout/lib");
var oop = require("ace/lib/oop");
var {EventEmitter} = require("ace/lib/event_emitter");
var ace = require("ace/ace");

var Editor = require("ace/editor").Editor;
var EditSession = require("ace/edit_session").EditSession;
var Renderer = require("ace/virtual_renderer").VirtualRenderer;
var theme = require("ace/theme/textmate");

var {Box, Pane} = require("layout/widgets/box");
var newTabCounter = 1;



    function getJson(name) {
        try {
            return JSON.parse(localStorage[name]);
        } catch(e) {
            return null;
        }
    }
    function saveJson(name, value) {
        localStorage[name] = JSON.stringify(value);
    }

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


    saveMetadataForTab(tab) {
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

    setSession(tab, value) {
        var editor = tab.editor
        if (!editor) return;

        if (editor.session && editor.session.tab) {
            this.saveMetadataForTab(editor.session.tab);
        }

        if (typeof value == "string") {
            tab.session = ace.createEditSession(value || "");
            tab.session.tab = tab;
            // tab.editor.on("input", updateSaveButton)
            this.loadMetadata(tab)
        }
        // var readOnly = tab.path?.startsWith("defaults/");
        // tab.session.$readOnly = readOnly;
        editor.setSession(tab.session);
        // editor.$options.readOnly.set.call(editor, editor.$readOnly);

        /*if (sharedWorker.$doc)
            sharedWorker.$doc.off("change", sharedWorker.changeListener);
        if (tab.session) {
            sharedWorker.deltaQueue = sharedWorker.$doc = null;
            sharedWorker.attachToDocument(editor.session.getDocument());
            editor.session.$worker = sharedWorker;
            sharedWorker.session = tab.session;
        }*/
        editor.container.style.display = "";

        editor.setOptions({
            newLineMode: "unix",
            enableLiveAutocompletion: true,
            enableBasicAutocompletion: true,
            showPrintMargin: false,
        });
        // editor.completers = cvuCompleters

        // updateSaveButton(false, editor);
    }

    loadMetadata(tab) {
        var path = tab.path;
        var session = tab.session;
        var metadata = getJson("@file@" + path)
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

        }catch(e) {
            console.error(e)
        }
    }

    addNewTab(pane) {
        pane.tabBar.addTab({
            tabTitle: `Untitled ${newTabCounter++}`,
            active: true,
        });
    };
    loadFile(tab) {
        if (!tab.editor) return;

        if (tab.session) {
            return this.setSession(tab, tab.session)
        } else if (!tab.path) {
            return this.setSession(tab, "")
        } else if (tab.path) {
            tab.editor.container.style.display = "none";
            // loadCVUDefinition(tab.path, function(err, value) {
            //     setSession(tab, value)
            // });
        } else {
            tab.editor.container.style.display = "none";
        }
    };
}

oop.implement(TabManager.prototype, EventEmitter);

exports.TabManager = TabManager
});