"use strict";

import {
    AceLayout,
    AceTreeWrapper,
    Box,
    Button,
    dom,
    FileSystemWeb,
    MenuManager,
    MenuToolbar,
    PanelBar, PanelManager, TabManager
} from "ace-layout";
import {addExampleMenuItems, menuDefs} from "../menu_example";

let mainBox: Box, outerBox: Box, consoleBox: Box;
let fileTree: Box;
document.body.innerHTML = "";
let base = new Box({
    vertical: false,
    toolBars: {
        top: new MenuToolbar(),
        bottom: new PanelBar({})
    },
    childBox1: outerBox = new Box({
        vertical: true,
        childBox1: new Box({
            vertical: false,
            childBox1: fileTree = new Box({
                size: 200,
            }),
            childBox2: mainBox = new Box({
                isMain: true,
            }),

        }),
        childBox2: consoleBox = new Box({
            size: 300,
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
    aceTree.render();
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
