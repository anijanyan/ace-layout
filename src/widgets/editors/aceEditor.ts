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
    tab?: Tab<Ace.EditSession>;

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

    setSession(tab: Tab<Ace.EditSession>, value?: string) {
        this.saveMetadata();

        this.tab = tab;

        this.initTabSession(value);

        this.editor.setSession(this.tab.session);

        this.editor.setOptions({
            newLineMode: "unix",
            enableLiveAutocompletion: true,
            enableBasicAutocompletion: true,
            showPrintMargin: false,
        });
    }

    private initTabSession(value?: string) {
        this.tab.session ??= ace.createEditSession(value ?? "", this.getMode());

        if (value == null) {
            this.loadMetadata();
        } else {
            this.tab.session.setValue(value);
        }
    }

    private getMode() {
        if (this.tab.path !== undefined) {
            var mode = modeList.getModeForPath(this.tab.path).mode

            //TODO: set mode
            switch (mode) {
                case "ace/mode/javascript":
                    return new JSMode();
                case "ace/mode/css":
                    return new CSSMode();
                case "ace/mode/html":
                    return new HtmlMode();
            }
        }
        return null;
    }

    private loadMetadata() {
        var path = this.tab.path;
        var session = this.tab.session;
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

    private saveMetadata() {
        if (!this.tab || !this.tab.path || !this.tab.session)
            return;

        var session = this.tab.session;
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

