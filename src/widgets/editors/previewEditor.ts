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

    setSession(tab: Tab<string>, value?: string) {
        this.savePrevious();
        this.tab = tab;
        this.container.setAttribute("srcdoc", value ?? tab.session);
    }

    private savePrevious() {
        if (!this.tab)
            return;
        this.tab.session = this.container.attributes["srcdoc"].nodeValue;
    }
}

