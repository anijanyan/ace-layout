import {Editor} from "ace-code/src/editor";
import theme = require("ace-code/src/theme/textmate");
import {VirtualRenderer as Renderer} from "ace-code/src/virtual_renderer";
import {Ace} from "ace-code";
import {Tab} from "../tabs/tab";
import * as ace from "ace-code";
import modeList = require("ace-code/src/ext/modelist");
import {Mode as JSMode} from "ace-code/src/mode/javascript";
import {LayoutEditor} from "../widget";

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

    constructor() {
        this.editor = new Editor(new Renderer(null, theme));
        this.editor.setOptions({"customScrollbar": true})
        this.container = this.editor.container;
        this.container.style.position = "absolute";
    }

    setSession(tab: Tab, value?: string) {
        if (this.tab) {
            this.tab.saveMetadata();
        }

        if (typeof value == "string") {
            tab.session = ace.createEditSession(value || "", null);

            this.tab = tab;
            // tab.editor.on("input", updateSaveButton)
            tab.loadMetadata();
        }

        this.editor.setSession(tab.session);

        if (tab.path !== undefined) {
            var mode = modeList.getModeForPath(tab.path).mode

            //TODO: set mode
            if (mode == "ace/mode/javascript") mode = new JSMode();
            this.editor.session.setMode(mode);
        }

        this.editor.container.style.display = "";

        this.editor.setOptions({
            newLineMode: "unix",
            enableLiveAutocompletion: true,
            enableBasicAutocompletion: true,
            showPrintMargin: false,
        });
    }
}

