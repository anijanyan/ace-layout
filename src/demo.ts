"use strict";

import {Box} from "./widgets/boxes/box";
import {MenuManager, MenuToolBar} from "./widgets/menu/menu";
import {TabManager} from "./widgets/tabs/tabManager";
import {PanelManager} from "./widgets/tabs/panelManager";
import {Button} from "./widgets/elements/button";
import {FileSystemWeb} from "./file-system/file-system-web";
import {AceTreeWrapper} from "./widgets/trees/ace-tree";
import {dom} from "./utils/dom";
import {PanelBar} from "./widgets/tabs/panel";
import {addExampleMenuItems} from "./menu_example";

dom.importCssString(require("text-loader!../styles/layout.css"), "layout.css");

var mainBox: Box, outerBox: Box;
var fileTree
document.body.innerHTML = "";

let menuToolBar;
var base = new Box({
    vertical: false,
    toolBars: {
        top: new MenuToolBar(),
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
        1: new Box({
            ratio: 1,
            size: 100,
            isMain: true,
            buttonList: [{
                class: "consoleCloseBtn", title: "F6", onclick: function () {
                    outerBox[1].hide();
                }
            }],
        }),
        toolBars: {},
    }),
});

window["fileTreeWrapper"] = fileTree;
let fileSystem = new FileSystemWeb();

function renderFileTree() {
    let button = new Button({value: "Open Folder"});
    let buttonWrapper = ["div", {}, button.render()];
    var aceTree = new AceTreeWrapper();
    var aceTreeWrapper = ["div", {style: "height: 100%"}, aceTree.element];
    button.element.addEventListener("mousedown", async (e) => {
        var nodes = await fileSystem.open();
        aceTree.updateTreeData(nodes);
        aceTree.element.addEventListener("item-click", (evt: CustomEvent) => {
            fileSystem.openFile(evt.detail);
        });
    })
    dom.buildDom(["div", {style: "height: 100%"}, buttonWrapper, aceTreeWrapper], fileTree.element);
}

addExampleMenuItems(MenuManager.getInstance(), "");

base.render();

var onResize = function () {
    base.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;

document.body.appendChild(base.element);
var tabManager = TabManager.getInstance({
    main: mainBox,
    console: outerBox[1],
    fileSystem: fileSystem
});
tabManager.fileSystem.on("openFile", (treeNode, fileContent) => {
    tabManager.open({
        path: treeNode.path,
        fileContent: fileContent
    });
});

var panelManager = PanelManager.getInstance({
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
    localStorage.tabs = JSON.stringify(tabManager.toJSON());
    localStorage.panels = JSON.stringify(panelManager.toJSON());
};

var tabState = {};
var panelState = {};
try {
    if (localStorage.tabs) {
        tabState = JSON.parse(localStorage.tabs);
    }
    if (localStorage.panels)
        panelState = JSON.parse(localStorage.panels);
} catch (e) {
}
tabManager.setState(tabState);
panelManager.setState(panelState);

mainBox.addButtons();
outerBox[1].addButtons();
renderFileTree();
onResize();


