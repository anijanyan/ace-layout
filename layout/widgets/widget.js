define(function(require, exports, module) {

    class Widget {
        render() {}
        remove() {}
        addItem() {}
        removeItem() {}
        toJSON() {}
        get children() {}
    }

    const WidgetType = {
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
    exports.Widget = Widget;
})