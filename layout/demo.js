var dom = require("ace/lib/dom");
var net = require("ace/lib/net");
var EditSession = require("ace/edit_session").EditSession;
var JSMode = require("ace/mode/javascript").Mode;
dom.importCssString(require("ace/requirejs/text!layout/styles/layout.css"), "layout.css");

var {Box, Pane} = require("layout/widgets/box");
var {PanelBar} = require("layout/widgets/tab");
var {TabManager} = require("layout/widgets/tabManager");
var {PanelManager} = require("layout/widgets/panelManager");
var {MenuToolBar} = require("layout/widgets/menu");
var {ListBox} = require("layout/widgets/listBox");

var mainBox
var listBox

document.body.innerHTML = "";

var base = new Box({
    vertical: false,
    toolBars: {
        top: new MenuToolBar({
            menus: []
        }),
    },
    0: new Box({
        vertical: false,
        0: new Box({
            vertical: false,
            0: listBox = new ListBox({
                size: "200px",
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

base.render();

var onResize = function () {
    base.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;

document.body.appendChild(base.element);

window.onbeforeunload = function () {
    localStorage.tabs = JSON.stringify(tabManager.toJSON());
    localStorage.panels = JSON.stringify(panelManager.toJSON());
};

tabManager = new TabManager({
    main: mainBox,
});

tabManager.loadFile = function (tab) {
    if (!tab.editor) return;

    if (tab.session) {
        return setSession(tab, tab.session)
    } else if (!tab.path) {
        return setSession(tab, "")
    } else if (tab.path) {
        tab.editor.container.style.display = "none";
        net.get(tab.path, function (value) {
            setSession(tab, value);
        });
    } else {
        tab.editor.container.style.display = "none";
    }
};

function setSession(tab, value) {
    var editor = tab.editor
    if (!editor) return;

    if (editor.session && editor.session.tab) {
        //TODO: do we need this?
        //saveMetadataForTab(editor.session.tab);
    }

    if (typeof value == "string") {
        tab.session = new EditSession(value || "", new JSMode());
        tab.session.tab = tab;
    }

    tab.session.$readOnly = true;
    editor.setSession(tab.session);
    editor.$options.readOnly.set.call(editor, editor.$readOnly);
    editor.container.style.display = "";

    editor.setOptions({
        newLineMode: "unix",
        enableLiveAutocompletion: true,
        enableBasicAutocompletion: true,
        showPrintMargin: false,
    });
}

panelManager = new PanelManager({
    layout: base,
    locations: {
        left: {
            parent: base,
            index: 0,
            size: "200px"
        }
    }
});

function open(data, preview) {
    tabManager.open({
        path: data.path,
        preview,
    })
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
    if (define !== undefined && define.modules !== undefined) {
        var modules = define.modules;

        for (let name in modules) {
            if (["require", "exports", "module"].includes(name)) continue;
            var path = name;
            var parts = path.split("/");
            if (parts[0] === "docs")
                path = "demo/kitchen-sink/" + path;
            else if (parts[0] === "ace")
                path = 'src/' + parts.slice(1).join('/');
            if (!/\.js$/.test(path)) path += '.js';
            files.push({name: name, path: path, readOnly: true})
        }
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