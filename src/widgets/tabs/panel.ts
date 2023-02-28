import {Accordion} from "../boxes/accordion";
import {Box} from "../boxes/box";
import {PanelOptions} from "../widget";
import {PanelManager} from "./panelManager";
import {dom} from "../../utils/dom";
import * as panelCSS from "../../../styles/panel.css";
import {TabPanel} from "./tabPanel";
import type {PanelBar} from "../toolbars/panelBar";

dom.importCssString(panelCSS, "panel.css");

export class Panel extends TabPanel {
    location?: string;
    panelBody: Accordion | Box;
    autoHide: boolean;
    parent: PanelBar;

    constructor(options: PanelOptions) {
        super(options);
        this.location = options.location;
        this.panelBody = options.panelBody;
        this.autoHide = options.autoHide ?? false;
        this.title = options.title;
    }

    activate() {
        super.activate();
        PanelManager.getInstance().activatePanel(this);
    }

    deactivate() {
        super.deactivate();
        PanelManager.getInstance().deactivatePanel(this);
    }

    render() {
        this.element = dom.buildDom(["div", {
            class: "panelButton" + (this.active ? " active" : ""),
        }, ["span", {
            class: "panelTitle"
        }, this.title]]);

        this.element.$host = this;
        return this.element;
    }

    toJSON(): PanelOptions {
        return {
            active: this.active,
            title: this.title,
            autoHide: this.autoHide,
            panelBody: this.panelBody.toJSON(),
        };
    }

    remove() {
    }
}