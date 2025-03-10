import {ButtonOptions, LayoutHTMLElement, Widget} from "../widget";
import {dom} from "../../utils/dom";
import * as buttonCSS from "../../../assets/styles/button.css";

dom.importCssString(buttonCSS, "button.css");

export class Button implements Widget {
    disabled?: boolean;
    value?: string;
    className: string;
    onClick?: VoidFunction;
    options: any;
    element: LayoutHTMLElement;

    constructor(options: ButtonOptions) {
        let {
            disabled,
            value,
            className,
            onClick,
            ...other
        } = options;
        this.disabled = disabled;
        this.value = value;
        this.className = className || "blackbutton";
        this.onClick = onClick;
        this.options = other;
    }

    remove() {
    }

    render() {
        this.renderElement();
        this.element.$host = this;

        this.element.setAttribute('role', 'button');
        this.element.onclick = this.onClick ?? null;

        this.disabled && this.element.classList.add("disabled");
        this.onClick && this.element.addEventListener('click', this.onClick);

        this.element.addEventListener('mousedown', (e) => this.addClass(e, "down"));
        this.element.addEventListener('mouseup', (e) => this.removeClass(e, "down"));

        this.element.addEventListener('mouseover', (e) => this.addClass(e, "over"));
        this.element.addEventListener('mouseout', (e) => this.removeClass(e, "over"));

        this.element.addEventListener('focus', (e) => this.addClass(e, "focus"));
        this.element.addEventListener('unfocus', (e) => this.removeClass(e, "focus"));

        return this.element;
    }

    addClass(e: MouseEvent | FocusEvent, className: string) {
        e.preventDefault();
        this.element.classList.add(className);
    }

    removeClass(e: MouseEvent | Event, className: string) {
        this.element.classList.remove(className);
    }

    renderElement() {
        this.element ??= dom.buildDom(["div", {
            ...this.options
        }, this.value]);

        this.element.classList.add(this.className);
    }

    toJSON() {
        return {};
    }
}
