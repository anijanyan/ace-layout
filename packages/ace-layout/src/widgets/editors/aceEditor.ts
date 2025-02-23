import ace from "ace-code/esm-resolver";
import {Editor} from "ace-code/src/editor";
import {VirtualRenderer as Renderer} from "ace-code/src/virtual_renderer";
import {Ace} from "ace-code";
import {Tab} from "../tabs/tab";
import modeList = require("ace-code/src/ext/modelist");
import {LayoutEditor} from "../widget";
import "ace-code/src/ext/language_tools";

export class AceEditor implements LayoutEditor<Ace.EditSession> {
    editor: Ace.Editor;
    container: HTMLElement;
    tab: Tab<Ace.EditSession>;

    resize() {
        this.editor.resize();
    }

    focus() {
        this.editor.focus();
    }

    destroy() {
        this.editor.setSession(ace.createEditSession("", this.getMode()));
        this.editor.destroy();
        this.container.remove();
    }

    constructor() {
        this.editor = new Editor(new Renderer(null));
        this.container = this.editor.container;
        this.container.style.position = "absolute";

        this.editor.setOptions({
            customScrollbar: false,
            newLineMode: "unix",
            enableLiveAutocompletion: true,
            enableBasicAutocompletion: true,
            showPrintMargin: false,
        });
    }

    setSession(tab: Tab<Ace.EditSession>, value?: string | null) {
        this.tab = tab;
        this.initTabSession(value);
        this.editor.setSession(this.tab.session);
    }

    private initTabSession(value?: string | null) {
        if (this.tab.session && value == null)
            return;

        this.tab.session ??= ace.createEditSession(value ?? "", this.getMode());

        if (value == null) {
            this.restoreSessionFromJson(this.tab);
        } else {
            this.tab.session.setValue(value);
        }
    }

    private getMode() {
        if (this.tab.path !== undefined) {
            return modeList.getModeForPath(this.tab.path).mode;
        }
        return null;
    }

    public static getSessionState(tab: Tab<Ace.EditSession>) {
        let session = tab.session;
        let undoManager = session.getUndoManager();
        return JSON.stringify({
            selection: session.selection.toJSON(),
            //@ts-ignore
            undoManager: undoManager.toJSON(),
            value: session.getValue(),
            scroll: [
                session.getScrollLeft(),
                session.getScrollTop()
            ],
        })
    }

    public sessionToJSON(tab: Tab<Ace.EditSession>) {
        return AceEditor.getSessionState(tab);
    }

    public restoreSessionFromJson(tab: Tab<Ace.EditSession>) {
        if (!tab.session || !tab.sessionValue)
            return;

        let session = tab.session;
        let json = JSON.parse(tab.sessionValue);
        try {
            if (typeof json.value == "string" && json.value != session.getValue())
                session.doc.setValue(json.value);

            if (json.selection)
                session.selection.fromJSON(json.selection);

            if (json.scroll) {
                session.setScrollLeft(json.scroll[0]);
                session.setScrollTop(json.scroll[1]);
            }

            tab.sessionValue = undefined;
        } catch (e) {
            console.error(e)
        }
    }
}

