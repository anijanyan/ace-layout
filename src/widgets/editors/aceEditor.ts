import {Editor} from "ace-code/src/editor";
import theme = require("ace-code/src/theme/textmate");
import {VirtualRenderer as Renderer} from "ace-code/src/virtual_renderer";
import {Ace} from "ace-code";
import {Tab} from "../tabs/tab";
import * as ace from "ace-code";
import modeList = require("ace-code/src/ext/modelist");
import {Mode as JSMode} from "ace-code/src/mode/javascript";

export namespace AceEditor {

    export function create(): Ace.Editor {
        this.editor = new Editor(new Renderer(null, theme));
        this.editor.container.style.position = "absolute";
        return this.editor;
    }

    export function setSession(tab: Tab, value?: string) {
        var editor = tab.editor
        if (!editor) return;

        if (editor.session && editor.session.tab) {
            editor.session.tab.saveMetadata();
        }

        if (typeof value == "string") {
            tab.session = ace.createEditSession(value || "", null);

            tab.session.tab = tab;
            // tab.editor.on("input", updateSaveButton)
            tab.loadMetadata();
        }

        editor.setSession(tab.session);

        if (tab.path !== undefined) {
            var mode = modeList.getModeForPath(tab.path).mode

            //TODO: set mode
            if (mode == "ace/mode/javascript") mode = new JSMode();
            editor.session.setMode(mode);
        }

        editor.container.style.display = "";

        editor.setOptions({
            newLineMode: "unix",
            enableLiveAutocompletion: true,
            enableBasicAutocompletion: true,
            showPrintMargin: false,
        });
    }
}

