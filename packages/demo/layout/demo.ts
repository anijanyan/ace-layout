import {AceLayout} from "ace-layout/widgets/layout";
import {HashHandler} from "ace-code/src/keyboard/hash_handler";
import {Box} from "ace-layout/widgets/boxes/box";
import {Panel} from "ace-layout/widgets/tabs/panel";
import {Accordion} from "ace-layout/widgets/boxes/accordion";
import {TabManager} from "ace-layout/widgets/tabs/tabManager";
import {PanelManager} from "ace-layout/widgets/tabs/panelManager";
import {addExampleMenuItems, menuDefs} from "../menu_example";
import {MenuManager} from "ace-layout/widgets/menu/menuManager";
import {Toolbar} from "ace-layout/widgets/toolbars/toolbar";
import {MenuToolbar} from "ace-layout/widgets/toolbars/menuToolbar";
import {PanelBar} from "ace-layout/widgets/toolbars/panelBar";

import {dom} from "ace-layout/utils/dom";

import keyUtil from "ace-code/src/lib/keys";

import event from "ace-code/src/lib/event";

class FindBar extends Toolbar{
    render() {
        this.element ??= dom.buildDom(["div", {
            class: "findbar",
        }]);
        return this.element
    }

    close() {
        let element = this.element;

        let rect = element.getBoundingClientRect();
        element.style.top = rect.top + rect.height + "px";
    }

    remove() {
    }

    toJSON() {
    }
}

document.body.innerHTML = "";
let mainBox: Box;
let consoleBox: Box;
let base = new Box({
    vertical: false,
    toolBars: {
        top: new MenuToolbar(),
        left: new PanelBar({
            panelList: [
                new Panel({
                    title: "Workspace",
                    panelBody: new Accordion({
                        vertical: true,
                        size: 200,
                        sections: [
                            {title: "open editors", box: new Box({vertical: false, size: 200, color: "blue"})},
                            {title: "project name", box: new Box({vertical: false, size: 500, color: "red"})},
                            {title: "outline", box: new Box({vertical: false, size: 500, color: "green"})},
                            {title: "timeline", box: new Box({vertical: false, size: 500, color: "pink"})}
                        ]
                    }),
                    location: "left"
                }),
                new Panel({
                    title: "Navigate",
                    panelBody: new Box({
                        size: 200,
                        color: "yellow"
                    }),
                    location: "left",
                    autoHide: true
                }),
                new Panel({
                    title: "Commands",
                    panelBody: new Box({
                        size: 200,
                        color: "orange"
                    }),
                    location: "left",
                    autoHide: true
                }),
                new Panel({
                    title: "Changes",
                    panelBody: new Box({
                        size: 200,
                        color: "violet"
                    }),
                    location: "left",
                    autoHide: true
                })
            ]
        }),
        right: new PanelBar({
            panelList: [
                new Panel({
                    title: "Outline",
                    panelBody: new Box({
                        size: 200,
                        color: "red"
                    }),
                    location: "right"
                }),
                new Panel({
                    title: "Debugger",
                    panelBody: new Box({
                        size: 200,
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
            1: consoleBox = new Box({
                ratio: 1,
                isMain: true,
                size: 100
            }),
        }),
        toolBars: {},
    }),
});

new AceLayout(base);

addExampleMenuItems(MenuManager.getInstance(), "", menuDefs);
base.render();

let onResize = function () {
    base.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;

document.body.appendChild(base.element);

class SearchManager {
    box: Box;
    findBar: FindBar;

    constructor(box: Box) {
        this.box = box;
    }

    addTransitioningToElement(element) {
        Box.enableAnimation()
        element.addEventListener('transitionend', function x() {
            element.removeEventListener('transitionend', x);
            Box.disableAnimation()
        });
    }

    animateBox(box) {
        this.addTransitioningToElement(box.element);
    }

    openFindBar() {
        this.animateBox(this.box);

        this.findBar ??= new FindBar();
        this.box.addToolBar("bottom", this.findBar);
        this.box.resize();
    };

    closeFindBar() {
        this.animateBox(this.box);

        this.box.removeToolBar("bottom");
        this.findBar.close();
        this.box.resize();
    }
}

let searchManager = new SearchManager(mainBox);

let menuKb = new HashHandler([
    {
        bindKey: "F6",
        name: "F6",
        exec: function () {
            consoleBox.toggleShowHide();
        }
    }
]);

event.addCommandKeyListener(window, function (e, hashId, keyCode) {
    let keyString = keyUtil.keyCodeToString(keyCode);
    let command = menuKb.findKeyCommand(hashId, keyString);
    if (command) {
        event.stopEvent(e);
        command.exec();
    }
});

window.onbeforeunload = function () {
    let storage = {};
    tabManager.saveTo(storage);
    localStorage["layout"] = JSON.stringify(storage);

    localStorage.layout_tabs = JSON.stringify(tabManager.toJSON());
    localStorage.layout_panels = JSON.stringify(panelManager.toJSON());
};

let tabManager = TabManager.getInstance({
    containers: {
        main: mainBox[0]!,
        console: consoleBox
    }
});

let panelManager = PanelManager.getInstance({
    layout: base,
    locations: {
        left: {
            parent: base,
            index: 0,
            size: 200
        },
        right: {
            parent: base[1]!,
            index: 1,
            size: 200
        }
    }
});

let tabState = {};
let panelState = {};
try {
    if (localStorage.layout_tabs)
        tabState = JSON.parse(localStorage.layout_tabs);
    if (localStorage.layout_panels)
        panelState = JSON.parse(localStorage.layout_panels);
} catch (e) {
}

tabManager.setState(tabState);
panelManager.setState(panelState);
if (localStorage["layout"])
    tabManager.restoreFrom(JSON.parse(localStorage["layout"]));

onResize();

consoleBox.renderButtons([{
    class: "consoleCloseBtn",
    title: "F6",
    onclick: function () {
        consoleBox.hide();
    },
    content: "x"
}]);
