import {LayoutHTMLElement, SwitcherOptions, Widget} from "../widget";
import {dom} from "../../utils/dom";
import * as switcherCSS from "../../../assets/styles/switcher.css";

dom.importCssString(switcherCSS, "switcher.css");

export class Switcher implements Widget {
    className?: string;
    element: LayoutHTMLElement;
    checked: boolean;
    private options: any;

    constructor(options: SwitcherOptions) {
        let {className, checked, ...other} = options;
        this.className = className || "cboffline";
        this.options = other;
        this.checked = checked || false;
    }

    render() {
        this.element = dom.buildDom(["div", {
            class: this.className + (this.checked ? " " + this.className + "Checked" : ""),
            onmousedown: (e) => {
                e.preventDefault();
                this.checked = !this.checked;
                e.target.className = this.className + (this.checked ? " " + this.className + "Down" : "");
            },
            onclick: (e) => {
                e.preventDefault();
                e.target.className = this.className + (this.checked ? " " + this.className + "Checked" : "");
            },
            ...this.options
        }, ""]);

        this.element.$host = this;
        return this.element;
    }

    toJSON() {
        return {};
    }

    remove() {
    }
}
