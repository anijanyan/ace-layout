"use strict";

import {Box} from "ace-layout/widgets/boxes/box";
import {TabManager} from "ace-layout/widgets/tabs/tabManager";
import {PanelManager} from "ace-layout/widgets/tabs/panelManager";
import {Button} from "ace-layout/widgets/elements/button";
import {FileSystemWeb} from "ace-layout/file-system/file-system-web";
import {AceTreeWrapper} from "ace-layout/widgets/trees/ace-tree";
import {dom} from "ace-layout/utils/dom";
import {addExampleMenuItems, menuDefs} from "../menu_example";
import {MenuManager} from "ace-layout/widgets/menu/menuManager";
import {AceLayout} from "ace-layout/widgets/layout";
import {MenuToolbar} from "ace-layout/widgets/toolbars/menuToolbar";
import {PanelBar} from "ace-layout/widgets/toolbars/panelBar";

let mainBox: Box, outerBox: Box, consoleBox: Box;
let fileTree;
document.body.innerHTML = "";
let base = new Box({
    vertical: false,
    toolBars: {
        top: new MenuToolbar(),
        bottom: new PanelBar({})
    },
    0: outerBox = new Box({
        vertical: true,
        0: new Box({
            vertical: false,
            0: fileTree = new Box({
                size: 200,
            }),
            1: mainBox = new Box({
                isMain: true,
            }),

        }),
        1: consoleBox = new Box({
            ratio: 1,
            size: 100,
            isMain: true
        }),
        toolBars: {},
    }),
});

new AceLayout(base);

let fileSystem = new FileSystemWeb();

function renderFileTree() {
    let button = new Button({value: "Open Folder"});
    let buttonWrapper = ["div", {}, button.render()];
    let aceTree = new AceTreeWrapper();
    let aceTreeWrapper = ["div", {style: "height: 100%"}, aceTree.element];
    button.element.addEventListener("mousedown", async (e) => {
        let nodes = await fileSystem.open();
        aceTree.updateTreeData(nodes);
        aceTree.element.addEventListener("item-click", (evt: CustomEvent) => {
            fileSystem.openFile(evt.detail);
        });
    })
    dom.buildDom(["div", {style: "height: 100%"}, buttonWrapper, aceTreeWrapper], fileTree.element);
}

menuDefs["View/Console"] = {
    properties: "700,check,false,false,F6",
    exec: () => consoleBox.toggleShowHide()
};
addExampleMenuItems(MenuManager.getInstance(), "", menuDefs);

base.render();

let onResize = function () {
    base.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;

document.body.appendChild(base.element);
let tabManager = TabManager.getInstance({
    containers: {
        main: mainBox,
        console: consoleBox
    },
    fileSystem: fileSystem
});

let panelManager = PanelManager.getInstance({
    layout: base,
    locations: {
        left: {
            parent: base,
            index: 0,
            size: 200
        }
    }
});

window.onbeforeunload = function () {
    tabManager.saveTo(localStorage);
    localStorage.tabs = JSON.stringify(tabManager.toJSON());
    localStorage.panels = JSON.stringify(panelManager.toJSON());
};

let tabState = {};
let panelState = {};
try {
    if (localStorage.tabs)
        tabState = JSON.parse(localStorage.tabs);

    if (localStorage.panels)
        panelState = JSON.parse(localStorage.panels);
} catch (e) {
}
tabManager.setState(tabState);
panelManager.setState(panelState);

tabManager.restoreFrom(localStorage);

renderFileTree();
onResize();


consoleBox.renderButtons([{
    class: "consoleCloseBtn",
    title: "F6",
    onclick: function () {
        consoleBox.hide();
    },
    content: "x"
}]);

/*updateSaveButton(e, editor) {
    let tab = editor.session.tab;
    if (tab.parent && tab.parent.activeTab == tab) {
        if (tab.session.getUndoManager().isClean() != this.refs.saveButton.disabled) {
            this.refs.saveButton.disabled = tab.session.getUndoManager().isClean();
        }
        if (this.refs.saveButton.disabled) {
            tab.element.classList.remove("changed");
        } else {
            tab.element.classList.add("changed");
        }
    }
    if (e && tab.preview) {
        tabManager.clearPreviewStatus(tab);
    }
}*/
