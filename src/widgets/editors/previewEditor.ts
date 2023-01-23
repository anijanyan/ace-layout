import {Tab} from "../tabs/tab";
import {LayoutEditor} from "../widget";

export class PreviewEditor implements LayoutEditor {
    editor;
    container: HTMLElement;
    tab?: Tab<string>;

    resize() {
    }

    focus() {
    }

    hide() {}

    destroy() {
        this.container.remove();
    }

    constructor() {
        this.container = document.createElement("iframe");
        this.container.style.position = "absolute";
    }

    setSession(tab: Tab<string>, value?: string) {
        this.tab = tab;
        value ??= tab.session;
        tab.session = value;
        this.container.setAttribute("srcdoc", value);
    }
}

