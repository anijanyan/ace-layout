import {Editor} from "ace-code/src/editor";
import theme = require("ace-code/src/theme/textmate");
import {VirtualRenderer as Renderer} from "ace-code/src/virtual_renderer";
import {Ace} from "ace-code";
import {Tab} from "../tabs/tab";
import * as ace from "ace-code";
import modeList = require("ace-code/src/ext/modelist");
import {Mode as JSMode} from "ace-code/src/mode/javascript";
import {Mode as CSSMode} from "ace-code/src/mode/css";
import {Mode as HtmlMode} from "ace-code/src/mode/html";
import {LayoutEditor} from "../widget";

//TODO this is for demo
function parseJson(name) {
    try {
        let data = localStorage[name];
        return data && JSON.parse(data);
    } catch (e) {
        return null;
    }
}

export class AceEditor implements LayoutEditor {
    private editor: Ace.Editor;
    container: HTMLElement;
    tab?: Tab;

    resize() {
        this.editor.resize();
    }

    focus() {
        this.editor.focus();
    }

    hide() {
        if (this.tab) {
            this.saveMetadata();
        }
    }

    destroy() {
        this.saveMetadata();
        this.editor.destroy();
        this.container.remove();
    }

    constructor() {
        this.editor = new Editor(new Renderer(null, theme));
        this.editor.setOptions({"customScrollbar": true})
        this.container = this.editor.container;
        this.container.style.position = "absolute";
    }

    setSession(tab: Tab, value?: string) {
        if (!value && tab.session) {
            value = (tab.session as Ace.EditSession).getValue();
        }
        if (typeof value == "string") {
            tab.session = ace.createEditSession(value || "", null);
        }

        this.saveMetadata();

        this.tab = tab;
        this.loadMetadata();

        this.editor.setSession(tab.session as Ace.EditSession);

        if (tab.path !== undefined) {
            var mode = modeList.getModeForPath(tab.path).mode

            //TODO: set mode
            switch (mode) {
                case "ace/mode/javascript":
                    mode = new JSMode();
                    break;
                case "ace/mode/css":
                    mode = new CSSMode();
                    break;
                case "ace/mode/html":
                    mode = new HtmlMode();
                    break;
            }
            this.editor.session.setMode(mode);
        }

        this.editor.setOptions({
            newLineMode: "unix",
            enableLiveAutocompletion: true,
            enableBasicAutocompletion: true,
            showPrintMargin: false,
        });
    }

    //TODO: move to separate class
    loadMetadata() {
        var path = this.tab.path;
        var session = this.tab.session as Ace.EditSession;
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

    saveMetadata() {
        if (!this.tab || !this.tab.path || !this.tab.session)
            return;

        var session = this.tab.session as Ace.EditSession;
        var undoManager = session.getUndoManager();
        localStorage["@file@" + this.tab.path] = JSON.stringify({
            selection: session.selection.toJSON(),
            //@ts-ignore
            undoManager: undoManager.toJSON(),
            value: session.getValue(),
            scroll: [
                session.getScrollLeft(),
                session.getScrollTop()
            ],
        });
    }
}

