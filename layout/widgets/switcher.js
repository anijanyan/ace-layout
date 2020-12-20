define(function(require, exports, module) {
var dom = require("ace/lib/dom");

/**
 * @type {Switcher}
 * @implements {Widget}
 */
class Switcher {
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
            class: this.className + (this.checked ? " " + this.className + "Down" : ""),
            onmousedown: (e) => {
                e.preventDefault();
                this.checked = !this.checked;
                e.target.className = this.className + (this.checked ? " " + this.className + "Down" : "");
            },
            ...this.options
        }, ""]);

        this.element.$host = this;
        return this.element;
    }

    toJSON() {
    }

}

exports.Switcher = Switcher;
});