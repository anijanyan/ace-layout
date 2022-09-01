import dom = require("ace-code/src/lib/dom");

dom.importCssString(require("text-loader!../styles/switcher.css"), "switcher.css");

export class Switcher{
    /**
     *
     * @param {Object} options
     * @param {String|undefined} options.value
     * @param {String|undefined} options.className
     * @param {Boolean|undefined} options.checked
     */
    constructor(options) {
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
    }
}