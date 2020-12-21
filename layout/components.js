var dom = require("ace/lib/dom");

dom.importCssString(require("ace/requirejs/text!layout/styles/button.css"), "button.css");
dom.importCssString(require("ace/requirejs/text!layout/styles/switcher.css"), "switcher.css");

var {Button} = require("layout/widgets/button");
var {Switcher} = require("layout/widgets/switcher");

let structure = {
        "Auto-pair Brackets, Quotes, etc.": {
            "type": "checkbox",
            "position": 1000,
            "path": "user/ace/@behavioursEnabled"
        },
        "Wrap Selection with Brackets, Quotes, etc.": {
            "type": "checkbox",
            "position": 1001,
            "path": "user/ace/@wrapBehavioursEnabled"
        },
        "Code Folding": {
            "type": "checkbox",
            "position": 2000,
            "path": "user/ace/@showFoldWidgets"
        },
        "Fade Fold Widgets": {
            "type": "checkbox",
            "position": 2500,
            "path": "user/ace/@fadeFoldWidgets"
        },
        "Copy With Empty Selection": {
            "type": "checkbox",
            "position": 2550,
            "path": "user/ace/@copyWithEmptySelection"
        },
        "Full Line Selection": {
            "type": "checkbox",
            "position": 3000,
            "path": "user/ace/@selectionStyle",
            "values": "line|text"
        },
        "Highlight Active Line": {
            "type": "checkbox",
            "position": 4000,
            "path": "user/ace/@highlightActiveLine"
        },
        "Highlight Gutter Line": {
            "type": "checkbox",
            "position": 4000,
            "path": "user/ace/@highlightGutterLine"
        },
        "Show Invisible Characters": {
            "type": "checkbox",
            "position": 5000,
            "path": "user/ace/@showInvisibles"
        },
        "Show Gutter": {
            "type": "checkbox",
            "position": 6000,
            "path": "user/ace/@showGutter"
        },
        "Show Line Numbers": {
            "type": "dropdown",
            "width": 150,
            "path": "user/ace/@showLineNumbers",
            "items": [
                {
                    "caption": "Normal",
                    "value": true
                },
                {
                    "caption": "Relative",
                    "value": "relative"
                },
                {
                    "caption": "None",
                    "value": false
                }
            ],
            "position": 6250
        },
        "Show Indent Guides": {
            "type": "checkbox",
            "position": 6500,
            "path": "user/ace/@displayIndentGuides"
        },
        "Highlight Selected Word": {
            "type": "checkbox",
            "position": 7000,
            "path": "user/ace/@highlightSelectedWord"
        },
        "Scroll Past the End of the Document": {
            "type": "dropdown",
            "width": 150,
            "path": "user/ace/@scrollPastEnd",
            "items": [
                {
                    "caption": "Off",
                    "value": "0"
                },
                {
                    "caption": "Half Editor Height",
                    "value": "0.5"
                },
                {
                    "caption": "Full Editor Height",
                    "value": "1"
                }
            ],
            "position": 8000
        },
        "Animate Scrolling": {
            "type": "checkbox",
            "path": "user/ace/@animatedScroll",
            "position": 9000
        },
        "Font Family": {
            "type": "textbox",
            "path": "user/ace/@fontFamily",
            "position": 10000
        },
        "Font Size": {
            "type": "spinner",
            "path": "user/ace/@fontSize",
            "min": "1",
            "max": "72",
            "position": 10500
        },
        "Antialiased Fonts": {
            "type": "checkbox",
            "path": "user/ace/@antialiasedfonts",
            "position": 10600
        },
        "Show Print Margin": {
            "type": "checked-spinner",
            "checkboxPath": "user/ace/@showPrintMargin",
            "path": "user/ace/@printMarginColumn",
            "min": "1",
            "max": "200",
            "position": 11000
        },
        "Mouse Scroll Speed": {
            "type": "spinner",
            "path": "user/ace/@scrollSpeed",
            "min": "1",
            "max": "8",
            "position": 13000
        },
        "Cursor Style": {
            "type": "dropdown",
            "path": "user/ace/@cursorStyle",
            "items": [
                {
                    "caption": "Ace",
                    "value": "ace"
                },
                {
                    "caption": "Slim",
                    "value": "slim"
                },
                {
                    "caption": "Smooth",
                    "value": "smooth"
                },
                {
                    "caption": "Smooth And Slim",
                    "value": "smooth slim"
                },
                {
                    "caption": "Wide",
                    "value": "wide"
                }
            ],
            "position": 13500
        },
        "Merge Undo Deltas": {
            "type": "dropdown",
            "path": "user/ace/@mergeUndoDeltas",
            "items": [
                {
                    "caption": "Always",
                    "value": "always"
                },
                {
                    "caption": "Never",
                    "value": "off"
                },
                {
                    "caption": "Timed",
                    "value": "true"
                }
            ],
            "position": 14000
        },
        "Enable Wrapping For New Documents": {
            "type": "checkbox",
            "path": "user/ace/@useWrapMode"
        }
}

function parseTree(tree) {
    let newTree = [];
    for (let el of Object.keys(tree)) {
        switch (tree[el]["type"]) {
            case "checkbox":
                newTree.push(["div", {class: "preferenceItem"}, ["span", {}, el], new Switcher({}).render()]);
                break;
            case "textbox":
                newTree.push(["div", {class: "preferenceItem"}, ["span", {}, el], ["input", {}]]);
                break;
            case "spinner":
                newTree.push(["div", {class: "preferenceItem"}, ["span", {}, el], ["input", {
                    type: "number",
                    min: tree[el]["min"],
                    max: tree[el]["max"]
                }]]);
                break;
            case "checked-spinner":
                newTree.push(["div", {class: "preferenceItem"}, ["input", {type: "checkbox"}], ["span", {}, el], ["input", {
                    type: "number",
                    min: tree[el]["min"],
                    max: tree[el]["max"]
                }]]);
                break;
            case "button":
                //TODO:
                newTree.push(["div", {class: "preferenceItem"}, new Button({}).render()]);
                break;
        }
    }
    return newTree;
}
let app = document.createElement("div");
let testing = parseTree(structure);
dom.buildDom([testing], app);
document.body.appendChild(app);