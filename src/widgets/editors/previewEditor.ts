import {Tab} from "../tabs/tab";
import {LayoutEditor} from "../widget";

export class PreviewEditor implements LayoutEditor {
    editor;
    container: HTMLElement;
    tab?: Tab;

    resize() {
    }

    focus() {
    }

    constructor() {
        this.container = document.createElement("iframe");
        this.container.style.position = "absolute";
    }

    setSession(tab: Tab, value?: string) {
        this.container.setAttribute("srcdoc", value ?? "");
    }
}

