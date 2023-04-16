import {ButtonOptions, LayoutHTMLElement, Widget} from "../widget";
import {dom} from "../../utils/dom";
import * as buttonCSS from "../../styles/button.css";

dom.importCssString(buttonCSS, "button.css");

export class Button implements Widget {
    disabled?: boolean;
    value?: string;
    className: string;
    options: any;
    element: LayoutHTMLElement;

    constructor(options: ButtonOptions) {
        let {disabled, value, className, ...other} = options;
        this.disabled = disabled;
        this.value = value;
        this.className = className || "blackbutton";
        this.options = other;
    }

    remove() {
    }

    render() {
        this.element = dom.buildDom(["div", {
            class: this.className + (this.disabled ? this.className + "Disabled" : ""),
            onmousedown: (e) => {
                e.preventDefault();
                e.target.className = this.className + " " + this.className + "Down";
            },
            onmouseup: (e) => {
                e.target.className = this.className;
            },
            onmouseover: (e) => {
                e.target.className = this.className + " " + this.className + "Over";
            },
            onfocus: (e) => {
                e.target.className = this.className + " " + this.className + "Focus";
            },
            onunfocus: (e) => {
                e.target.className = this.className;
            },
            onmouseout: (e) => {
                e.target.className = this.className;
            },
            ...this.options
        }, this.value]);

        this.element.$host = this;
        return this.element;
    }

    toJSON() {
    }
}
