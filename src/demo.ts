"use strict";

import {Box} from "./widgets/box";
import {MenuManager, MenuToolBar} from "./widgets/menu";
import {ListBox} from "./widgets/listBox";
import {TabManager} from "./widgets/tabManager";
import {PanelManager} from "./widgets/panelManager";

var dom = require("ace-code/src/lib/dom");
dom.importCssString(require("text-loader!./styles/layout.css"), "layout.css");

var mainBox
var listBox


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
            0: listBox = new ListBox({
                size: 200,
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

window.fileTree = listBox;

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
    main: mainBox
});

var panelManager = PanelManager.getInstance({
    layout: base,
    locations: {
        left: {
            parent: base,
            index: 0,
            size: "200px"
        }
    }
});

window.onbeforeunload = function () {
    localStorage.tabs = JSON.stringify(tabManager.toJSON());
    localStorage.panels = JSON.stringify(panelManager.toJSON());
};

function open(data, preview) {
    tabManager.open({
        path: data.path, preview,
    });
}

onResize();

listBox.on("select", function (data) {
    if (data.className) return;
    open(data, true);
});

listBox.on("choose", function (data) {
    if (data.className) return;
    open(data, false);
});


function updateTree() {
    var selected = listBox.popup.getData(listBox.popup.getRow());
    var data = [{className: "header", name: "Modules"}];
    var files = [];
    //TODO: this is just example
    var modules = ["anchor.js", "apply_delta.js"];
    for (let name of modules) {
        var path = name;
        files.push({name: path, path: path, readOnly: true})
    }
    data = data.concat(files);
    listBox.popup.setData(data);
    listBox.popup.resize(true);
    listBox.popup.session.setScrollTop(0)
    if (selected) {
        data.some(function (item, i) {
            if (item.name == selected.name) {
                listBox.popup.setRow(i);
                return true
            }
        })
    }
}

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
updateTree()
