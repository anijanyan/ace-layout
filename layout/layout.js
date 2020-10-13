var dom = require("ace/lib/dom");
var event = require("ace/lib/event");
var lib = require("layout/lib");
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
var keyUtil = require("ace/lib/keys");

dom.importCssString(require("ace/requirejs/text!layout/layout.css"), "layout.css");


var {Box, Pane} = require("layout/box");
var {Tab, TabBar, Panel, PanelBar} = require("layout/tab");
var {TabManager} = require("layout/tabManager");
var {PanelManager} = require("layout/panelManager");
var {Accordion} = require("layout/accordion");
var {MenuManager, MenuToolBar} = require("layout/menu");

class FindBar {
    constructor(options) {
    }

    setBox(x, y, w, h) {
        lib.setBox(this.element, x, y, w, h);
        this.box = [x, y, w, h];
    }

    draw() {
        if (this.element) this.element;
        this.element = dom.buildDom(["div", {
            class: "findbar",
        }]);
        return this.element
    }

    close() {
        var element = this.element;

        var rect = element.getBoundingClientRect();
        element.style.top = rect.top + rect.height + "px";
    }
}

document.body.innerHTML = "";

var base = new Box({
    vertical: false,
    toolBars: {
        top: new MenuToolBar({
            menus: []
        }),
        left: new PanelBar({
            panelList: [
                new Panel({
                    panelTitle: "Workspace",
                    panelBody: new Accordion({
                        vertical: true,
                        size: "200px",
                        boxes: [
                            {title: "open editors", obj: new Box({vertical: false, size: "200px", color: "blue"})},
                            {title: "project name", obj: new Box({vertical: false, size: "500px", color: "red"})},
                            {title: "outline", obj: new Box({vertical: false, size: "500px", color: "green"})},
                            {title: "timeline", obj: new Box({vertical: false, size: "500px", color: "pink"})}
                        ]
                    }),
                    location: "left"
                }),
                new Panel({
                    panelTitle: "Navigate",
                    panelBody: new Box({
                        size: "200px",
                        color: "yellow"
                    }),
                    location: "left",
                    autohide: true
                }),
                new Panel({
                    panelTitle: "Commands",
                    panelBody: new Box({
                        size: "200px",
                        color: "orange"
                    }),
                    location: "left",
                    autohide: true
                }),
                new Panel({
                    panelTitle: "Changes",
                    panelBody: new Box({
                        size: "200px",
                        color: "violet"
                    }),
                    location: "left",
                    autohide: true
                })
            ]
        }),
        right: new PanelBar({
            panelList: [
                new Panel({
                    panelTitle: "Outline",
                    panelBody: new Box({
                        size: "200px",
                        color: "red"
                    }),
                    location: "right"
                }),
                new Panel({
                    panelTitle: "Debugger",
                    panelBody: new Box({
                        size: "200px",
                        color: "yellow"
                    }),
                    location: "right"
                })
            ]
        }),
        bottom: new PanelBar({})
    },
    1: new Box({
        vertical: false,
        0: mainBox = new Box({
            vertical: true,
            0: new Box({
                ratio: 1,
                isMain: true,
            }),
            1: new Box({
                ratio: 1,
                isMain: true,
                size: "100px",
                buttonList: [{
                    class: "consoleCloseBtn", title: "F6", onclick: function () {
                        mainBox[1].hide();
                    }
                }],
            }),
        }),
        toolBars: {},
    }),
});

base.draw();

var onResize = function () {
    base.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;

document.body.appendChild(base.element);

class SearchManager {
    constructor() {
        this.mainBox = mainBox;
    }

    addTransitioningToElement(element) {
        Box.enableAnimation()
        // window.addEventListener('transitionend', function x(e) {
        // console.log(e)
        // })
        element.addEventListener('transitionend', function x() {
            element.removeEventListener('transitionend', x);
            Box.disableAnimation()
        });
    }

    animateBox(box) {
        this.addTransitioningToElement(box.element);
    }

    openFindBar() {
        this.animateBox(this.mainBox);

        if (!this.findBar) {
            this.findBar = new FindBar();
        }
        this.mainBox.addToolBar("bottom", this.findBar);
        this.mainBox.resize();
    };

    closeFindBar() {
        this.animateBox(this.mainBox);

        this.mainBox.removeBar("bottom");
        this.findBar.close();
        this.mainBox.resize();
    }
}

searchManager = new SearchManager();

var menuKb = new HashHandler([
    {
        bindKey: "F6",
        name: "F6",
        exec: function () {
            mainBox[1].toggleShowHide();
        }
    }
]);

event.addCommandKeyListener(window, function (e, hashId, keyCode) {
    var keyString = keyUtil.keyCodeToString(keyCode);
    var command = menuKb.findKeyCommand(hashId, keyString);
    if (command) {
        event.stopEvent(e);
        command.exec();
    }
});

window.onbeforeunload = function () {
    localStorage.tabs = JSON.stringify(tabManager.toJSON());
    localStorage.panels = JSON.stringify(panelManager.toJSON());
};

tabManager = new TabManager({
    main: mainBox[0],
    console: mainBox[1],
});

panelManager = new PanelManager({
    base: base,
    locations: {
        left: {
            parent: base,
            index: 0,
            size: "200px"
        },
        right: {
            parent: base[1],
            index: 1,
            size: "200px"
        }
    }

});

var tabState = {};
var panelState = {};
try {
    if (localStorage.tabs)
        tabState = JSON.parse(localStorage.tabs);
    if (localStorage.panels)
        panelState = JSON.parse(localStorage.panels);
} catch (e) {
}
tabManager.setState(tabState);
panelManager.setState(panelState);

onResize();

mainBox[1].addButtonsToChildPane();
