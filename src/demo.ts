"use strict";

import {Box} from "./widgets/boxes/box";
import {MenuManager, MenuToolBar} from "./widgets/menu/menu";
import {TabManager} from "./widgets/tabs/tabManager";
import {PanelManager} from "./widgets/tabs/panelManager";
import {Button} from "./widgets/elements/button";
import {FileSystemWeb} from "./file-system/file-system-web";
import {AceTreeWrapper} from "./widgets/trees/ace-tree";
import {dom} from "./utils/dom";

dom.importCssString(require("text-loader!../styles/layout.css"), "layout.css");

var mainBox
var fileTree
document.body.innerHTML = "";

let menuToolBar;
var base = new Box({
    vertical: false,
    toolBars: {
        top: menuToolBar = new MenuToolBar(),
    },
    0: new Box({
        vertical: false,
        0: new Box({
            vertical: false,
            0: fileTree = new Box({
                size: 200
            }),
            1: new Box({
                isMain: true,
                0: mainBox = new Box({
                    isMain: true,
                }),
            }),

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

MenuManager.getInstance().addByPath("AWS Cloud9", {
    className: "c9btn",
    position: 50,
})
MenuManager.getInstance().addByPath("File", {
    position: 100,
})

base.render();

var onResize = function () {
    base.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;

document.body.appendChild(base.element);
var tabManager = TabManager.getInstance({
    main: mainBox,
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

onResize();

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
renderFileTree();
