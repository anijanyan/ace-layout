import {LayoutHTMLElement, TabPanelOptions} from "../widget";
import {TabPanelBar} from "../toolbars/tabPanelBar";

export abstract class TabPanel {
    active: boolean;
    title: string;
    element: LayoutHTMLElement;
    parent?: TabPanelBar<TabPanel>;

    protected constructor(options: TabPanelOptions) {
        this.active = options.active ?? false;
        this.title = options.title;
    }

    activate() {
        this.active = true;
        this.element.classList.add("active");
    }

    deactivate() {
        this.active = false;
        this.element.classList.remove("active");
    }

    abstract render();

    abstract toJSON(): TabPanelOptions;
}