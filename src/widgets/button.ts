import dom = require("ace-code/src/lib/dom");
import {ButtonOptions} from "./widget";

dom.importCssString(require("text-loader!../styles/button.css"), "button.css");

/**
 * @type {Button}
 * @implements {Widget}
 */
export class Button {
    disabled?: boolean;
    value?: string;
    className: string;
    options: any;
    element: any;

    constructor(options: ButtonOptions) {
        let {disabled, value, className, ...other} = options;
        this.disabled = disabled;
        this.value = value;
        this.className = className || "blackbutton";
        this.options = other;
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