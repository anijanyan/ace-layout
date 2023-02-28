import {Tab} from "../tabs/tab";
import {LayoutEditor} from "../widget";

export class PreviewEditor implements LayoutEditor<string> {
    editor;
    container: HTMLElement;
    tab: Tab<string>;

    resize() {
    }

    focus() {
    }

    destroy() {
        this.container.remove();
    }

    constructor() {
        this.container = document.createElement("iframe");
        this.container.style.position = "absolute";
    }

    setSession(tab: Tab<string>, value?: string | null) {
        this.tab = tab;
        value ??= tab.session;
        tab.session = value;
        this.container.setAttribute("srcdoc", value);
    }

    restoreSessionFromJson(tab: Tab<string>) {
        tab.session = tab.sessionValue ?? "";
        tab.sessionValue = undefined;
    }

    sessionToJSON(tab: Tab<string>) {
        return tab.session;
    }
}

