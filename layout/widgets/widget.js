define(function(require, exports, module) {
    /**
     * Interface for classes that represent a color.
     *
     * @interface
     */
    class Widget {
        render() {}
        resize() {}
        remove() {}
        toJSON() {}
    }

/*    const WidgetType = {
        "Accordion": 1,
        "Box": 2,
        "ListBox": 3,
        "PanelManager": 4,
        "Tab": 5,
        "Pane": 6,
        "Panel": 7,
        "PanelBar": 8
    }
    Object.freeze(WidgetType);

    exports.WidgetType = WidgetType;
    exports.Widget = Widget;*/
})