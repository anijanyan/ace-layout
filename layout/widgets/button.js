define(function(require, exports, module) {
var dom = require("ace/lib/dom");

/**
 * @type {Button}
 * @implements {Widget}
 */
class Button {
    /**
     *
     * @param {Object} options
     * @param {Boolean|undefined} options.disabled
     * @param {String|undefined} options.value
     * @param {String|undefined} options.className
     */
    constructor(options) {
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

exports.Button = Button;
});