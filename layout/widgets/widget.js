define(function(require, exports, module) {
/**
 * Interface for classes that represent a widgets.
 *
 * @interface
 */
class Widget {
    render() {}
    remove() {}
    toJSON() {}
}

/**
 * Interface for classes that represent location of the panel on layout.
 *
 * @interface
 */
class PanelLocation {
    /**
     * @property {Box}
     */
    parent
    /**
     * @property {Number}
     */
    index
    /**
     * @property {String}
     */
    size
    /**
     * @property {Box|undefined}
     */
    box
}

})