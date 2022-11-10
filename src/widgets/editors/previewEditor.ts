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

    hide() {
        this.savePrevious();
    }

    destroy() {
        this.container.remove();
    }

    constructor() {
        this.container = document.createElement("iframe");
        this.container.style.position = "absolute";
    }

    setSession(tab: Tab, value?: string) {
        this.savePrevious();
        this.tab = tab;
        this.container.setAttribute("srcdoc", value ?? tab.session as string);
    }

    private savePrevious() {
        if (!this.tab)
            return;
        this.tab.session = this.container.attributes["srcdoc"].nodeValue;
    }
}

