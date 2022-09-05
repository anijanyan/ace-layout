import dom = require("ace-code/src/lib/dom");
import {Box} from "./widgets/box";
import {PanelBar} from "./widgets/tab";
import {SettingsSearchBox} from "./widgets/search";
import {Switcher} from "./widgets/switcher";
import {Button} from "./widgets/button";
import {Dropdown} from "./widgets/dropdown";

dom.importCssString(require("text-loader!./styles/layout.css"), "layout.css");
dom.importCssString(require("text-loader!./styles/preferences.css"), "preferences.css");

let navigation;
let app;
let preferences = new Box({
    classNames: "bar-preferences",
    toolBars: {
        top: new PanelBar({size: 31}),
    },
    0: navigation = new Box({
        size: 200,
    }),
    1: app = new Box({
    }),
});
document.body.appendChild(preferences.render());

let resultPreferences = {};

function addState(state, prefModel) {
    // First Level
    for (let name in state) {
        if (!prefModel[name]) {
            prefModel[name] = {groupName: name}
        }
        if (state[name]["position"]) {
            prefModel[name]["position"] = state[name]["position"]
            delete state[name]["position"]
        }
        if (state[name]["type"]) {
            prefModel[name]["groupData"] = state[name]
        } else if (typeof state[name] === "object") {
            if (!prefModel[name]["subGroups"]) {
                prefModel[name]["subGroups"] = {}
            }
            addState(state[name], prefModel[name]["subGroups"])
        } else {
            prefModel[name] = state[name]
        }
    }
}


let $prefs = [
    {
        "Experimental": {
            "type": "custom",
            "title": "Introduction",
            "position": 1,
            "node": [
                "apf",
                "bar",
                "<h1>Experimental Features</h1><p style=\"white-space:normal\">AWS Cloud9 is continuously in development. New features in alpha or beta are first hidden and can be enabled via this page. <i>Use at your own risk</i>.</p>"
            ]
        },
        "User Settings": {
            "type": "custom",
            "title": "Introduction",
            "position": 1,
            "node": [
                "apf",
                "bar",
                "<h1>User Settings</h1><p>Manually edit these settings by clicking on this link: <a href=\"javascript:void(0)\">user.settings</a>.</p><p class=\"hint\">These settings are synced across all your environments.</p>"
            ]
        },
        "Project": {
            "type": "custom",
            "title": "Introduction",
            "position": 1,
            "node": [
                "apf",
                "bar",
                "<h1>Project Settings</h1><p>These settings are specific to this project. They are saved at: <span style=\"padding:5px 0 5px 0px\"><a href=\"javascript:void(0)\">&lt;project&gt;/.c9/project.settings</a>.</span></p><p class=\"hint\">Hint: Add the .c9 folder to your repository to share these settings with your collaborators.</p>"
            ]
        }
    },
    {
        "General": {
            "Tree and Go Panel": {
                "position": 25,
                "Enable Preview on Tree Selection": {
                    "type": "checkbox",
                    "position": 3000,
                    "path": "user/general/@preview-tree"
                },
                "Hidden File Pattern": {
                    "type": "textbox",
                    "path": "user/projecttree/@hiddenFilePattern",
                    "position": 4000
                }
            },
            "User Interface": {
                "Environment Files Icon and Selection Style": {
                    "type": "dropdown",
                    "position": 3000,
                    "path": "user/general/@treestyle",
                    "items": [
                        {
                            "value": "default",
                            "caption": "Default"
                        },
                        {
                            "value": "alternative",
                            "caption": "Alternative"
                        }
                    ]
                }
            }
        }
    },
    {
        "File": {
            "position": 150,
            "Meta Data": {
                "position": 200,
                "Maximum of Undo Stack Items in Meta Data": {
                    "type": "spinner",
                    "path": "user/metadata/@undolimit",
                    "position": 200,
                    "min": 10,
                    "max": 10000
                }
            }
        }
    },
    {
        "General": {
            "General": {
                "Warn Before Exiting": {
                    "type": "checkbox",
                    "position": 8000,
                    "path": "user/general/@confirmexit"
                }
            }
        }
    },
    {
        "Project": {
            "position": 10,
            "Code Editor (Ace)": {
                "position": "10100",
                "Soft Tabs": {
                    "type": "checked-spinner",
                    "checkboxPath": "project/ace/@useSoftTabs",
                    "path": "project/ace/@tabSize",
                    "min": "1",
                    "max": "64",
                    "position": 100
                },
                "Autodetect Tab Size on Load": {
                    "type": "checkbox",
                    "path": "project/ace/@guessTabSize",
                    "position": 150
                },
                "New File Line Endings": {
                    "type": "dropdown",
                    "path": "project/ace/@newLineMode",
                    "width": 130,
                    "items": [
                        {
                            "caption": "Windows (CRLF)",
                            "value": "windows"
                        },
                        {
                            "caption": "Unix (LF)",
                            "value": "unix"
                        }
                    ],
                    "position": 200
                }
            }
        }
    },
    {
        "Editors": {
            "position": 400,
            "Code Editor (Ace)": {
                "position": 200,
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
        }
    },
    {
        "Project": {
            "Find in Files": {
                "position": "10300",
                "Ignore these files": {
                    "name": "txtPref",
                    "type": "textarea",
                    "width": 150,
                    "height": 130,
                    "rowheight": 155,
                    "position": 1000
                },
                "Maximum number of files to search (in 1000)": {
                    "type": "spinner",
                    "path": "project/find.nak/@searchLimit",
                    "min": "20",
                    "max": "500",
                    "position": 10500
                }
            }
        }
    },
    {
        "General": {
            "Tree and Go Panel": {
                "Scope Go to Anything To Favorites": {
                    "type": "checkbox",
                    "position": 1000,
                    "path": "user/projecttree/@scope"
                }
            }
        }
    },
    {
        "Project": {
            "position": 150,
            "Code Editor (Ace)": {
                "On Save, Strip Whitespace": {
                    "type": "checkbox",
                    "position": 900,
                    "path": "project/general/@stripws"
                }
            }
        }
    },
    {
        "General": {
            "Tree and Go Panel": {
                "Reveal Active File in Project Tree": {
                    "type": "checkbox",
                    "position": 4000,
                    "path": "user/general/@revealfile"
                }
            }
        }
    },
    {
        "General": {
            "Find in Files": {
                "position": 30,
                "Search In This Path When 'Project' Is Selected": {
                    "type": "textbox",
                    "position": 100,
                    "path": "user/findinfiles/@project"
                },
                "Show Full Path in Results": {
                    "type": "checkbox",
                    "position": 100,
                    "path": "user/findinfiles/@fullpath"
                },
                "Clear Results Before Each Search": {
                    "type": "checkbox",
                    "position": 100,
                    "path": "user/findinfiles/@clear"
                },
                "Scroll Down as Search Results Come In": {
                    "type": "checkbox",
                    "position": 100,
                    "path": "user/findinfiles/@scrolldown"
                },
                "Open Files when Navigating Results with ↓ ↑": {
                    "type": "checkbox",
                    "position": 100,
                    "path": "user/findinfiles/@consolelaunch"
                }
            }
        }
    },
    {
        "File": {
            "position": 150,
            "Watchers": {
                "position": 300,
                "Auto-Merge Files When a Conflict Occurs": {
                    "type": "checkbox",
                    "path": "user/general/@automerge",
                    "min": "1",
                    "max": "64",
                    "tooltip": "Whenever the file watcher detects a file change on disk, 'auto merge' will fetch the contents from disc and merges it with the version in the editor.",
                    "position": 2200
                }
            }
        }
    },
    {
        "Project": {
            "Hints & Warnings": {
                "position": "10700",
                "Warning Level": {
                    "type": "dropdown",
                    "path": "project/language/@warnLevel",
                    "items": [
                        {
                            "caption": "Error",
                            "value": "error"
                        },
                        {
                            "caption": "Warning",
                            "value": "warning"
                        },
                        {
                            "caption": "Info",
                            "value": "info"
                        }
                    ],
                    "position": 5000
                },
                "Mark Missing Optional Semicolons": {
                    "type": "checkbox",
                    "path": "project/language/@semi",
                    "position": 7000
                },
                "Mark Undeclared Variables": {
                    "type": "checkbox",
                    "path": "project/language/@undeclaredVars",
                    "position": 8000
                },
                "Mark Unused Function Arguments": {
                    "type": "checkbox",
                    "path": "project/language/@unusedFunctionArgs",
                    "position": 9000
                },
                "Ignore Messages Matching Regex": {
                    "title": [
                        null,
                        "Ignore Messages Matching ",
                        [
                            "a",
                            {
                                "href": "http://en.wikipedia.org/wiki/Regular_expression",
                                "target": "blank"
                            },
                            "Regex"
                        ]
                    ],
                    "type": "textbox",
                    "path": "project/language/@ignoredMarkers",
                    "width": 300,
                    "position": 11000
                }
            },
            "JavaScript Support": {
                "position": "101100",
                "Customize JavaScript Warnings With .eslintrc": {
                    "title": [
                        null,
                        "Customize JavaScript Warnings With ",
                        [
                            "a",
                            {
                                "href": "http://eslint.org/docs/user-guide/configuring",
                                "target": "blank"
                            },
                            ".eslintrc"
                        ]
                    ],
                    "position": 210,
                    "type": "checkbox",
                    "path": "project/language/@eslintrc"
                }
            }
        }
    },
    {
        "Language": {
            "position": 500,
            "Input": {
                "position": 100,
                "Complete As You Type": {
                    "type": "checkbox",
                    "path": "user/language/@continuousCompletion",
                    "position": 4000
                },
                "Complete On Enter": {
                    "type": "checkbox",
                    "path": "user/language/@enterCompletion",
                    "position": 5000
                },
                "Highlight Variable Under Cursor": {
                    "type": "checkbox",
                    "path": "user/language/@instanceHighlight",
                    "position": 6000
                }
            },
            "Hints & Warnings": {
                "position": 200,
                "Enable Hints and Warnings": {
                    "type": "checkbox",
                    "path": "user/language/@hints",
                    "position": 1000
                },
                "Ignore Messages Matching Regex": {
                    "title": [
                        null,
                        "Ignore Messages Matching ",
                        [
                            "a",
                            {
                                "href": "http://en.wikipedia.org/wiki/Regular_expression",
                                "target": "blank"
                            },
                            "Regex"
                        ]
                    ],
                    "type": "textbox",
                    "path": "user/language/@ignoredMarkers",
                    "position": 3000
                }
            }
        }
    },
    {
        "Language": {
            "Hints & Warnings": {
                "Show Available Quick Fixes On Click": {
                    "type": "checkbox",
                    "position": 1000,
                    "path": "user/language/@quickfixes"
                }
            }
        }
    },
    {
        "Language": {
            "Input": {
                "Use Cmd-Click for Jump to Definition": {
                    "type": "checkbox",
                    "path": "user/language/@overrideMultiselectShortcuts",
                    "position": 6000
                }
            }
        }
    },
    {
        "Project": {
            "JavaScript Support": {
                "position": "101100",
                "Format Code on Save": {
                    "position": 320,
                    "type": "checkbox",
                    "path": "project/javascript/@formatOnSave"
                },
                "Custom Code Formatter": {
                    "position": 340,
                    "type": "textbox",
                    "path": "project/javascript/@formatter",
                    "realtime": true
                }
            }
        }
    },
    {
        "Project": {
            "JavaScript Support": {
                "position": "101100",
                "Tern Completions": {
                    "position": 220,
                    "type": "custom",
                    "name": "ternCompletions",
                    "node": [
                        "apf",
                        "bar",
                        "\n            <div><div class=\" ace_tree blackdg ace-tree-datagrid\" style=\"height: 253px;\"><textarea class=\"ace_text-input\" wrap=\"off\" autocorrect=\"off\" autocapitalize=\"off\" spellcheck=\"false\" style=\"opacity: 0; font-size: 1px;\"></textarea><div class=\"ace_tree_scroller\" style=\"inset: 23px 16px 0px 0px;\"><div class=\"ace_tree_cells\" style=\"margin-top: 0px; margin-left: 0px; width: 637px; height: 253px;\"><div class=\"ace_tree_layer ace_tree_selection-layer\"></div><div class=\"ace_tree_layer ace_tree_cell-layer\"><div style=\"height:23px;padding-right:0px\" class=\"tree-row  even\"><span class=\"tree-column \" style=\"width:100%;\"><span class=\"toggler open\"></span><span class=\"caption\" style=\"width: auto; height: 23px\">Experimental</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  odd\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">accounting</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  even\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">ace</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  odd\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">add2home</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  even\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">alertify</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  odd\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">amcharts</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  even\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">angularfire</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  odd\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">appframework</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  even\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">appletvjs</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  odd\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">applicationinsights</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  even\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">arbiter</span></span></div><div style=\"height:23px;padding-right:0px\" class=\"tree-row  odd\"><span class=\"tree-column \" style=\"width:100%;\"><span style=\"width:10px\" class=\"tree-indent\"></span><span class=\"toggler empty\"></span><span class=\"checkbox \"></span><span class=\"caption\" style=\"width: auto; height: 23px\">argparse</span></span></div></div></div></div><div class=\"tree-headings\" style=\"height: 23px; right: 16px; padding-right: 0px;\"><span class=\"tree-column \" style=\"width:100%;height:\">JavaScript Library Code Completion</span><span class=\"tree-column-resizer\"></span></div><div class=\"ace_scrollbar ace_scrollbar-v\" style=\"width: 21px; top: 23px; bottom: 0px;\"><div class=\"ace_scrollbar-inner\" style=\"width: 21px; height: 9361px;\">&nbsp;</div></div><div class=\"ace_scrollbar ace_scrollbar-h\" style=\"display: none; height: 21px; left: 0px; right: 16px;\"><div class=\"ace_scrollbar-inner\" style=\"height: 21px; width: 0px;\">&nbsp;</div></div></div></div>"
                    ]
                }
            }
        }
    },
    {
        "Project": {
            "Python Support": {
                "position": "101300",
                "Enable advanced (jedi) Python code completion": {
                    "position": 310,
                    "type": "checkbox",
                    "path": "project/python/@completion"
                },
                "Python Version": {
                    "position": 320,
                    "type": "dropdown",
                    "path": "project/python/@version",
                    "items": [
                        {
                            "caption": "Python 2",
                            "value": "python2"
                        },
                        {
                            "caption": "Python 3",
                            "value": "python3"
                        }
                    ]
                },
                "Pylint command-line options": {
                    "position": 330,
                    "type": "textbox",
                    "width": 300,
                    "message": "-d all -e E -e F",
                    "path": "project/python/@pylintFlags"
                },
                "PYTHONPATH": {
                    "position": 340,
                    "type": "textbox",
                    "width": 300,
                    "path": "project/python/@path"
                },
                "Format Code on Save": {
                    "position": 350,
                    "type": "checkbox",
                    "path": "project/python/@formatOnSave"
                },
                "Custom Code Formatter": {
                    "position": 360,
                    "type": "textbox",
                    "path": "project/python/@formatter"
                }
            }
        }
    },
    {
        "Project": {
            "Go Support": {
                "position": "101400",
                "Enable Go code completion": {
                    "position": 510,
                    "type": "checkbox",
                    "path": "project/golang/@completion"
                },
                "Format Code on Save": {
                    "position": 520,
                    "type": "checkbox",
                    "path": "project/golang/@formatOnSave"
                },
                "Custom Code Formatter": {
                    "position": 530,
                    "type": "textbox",
                    "path": "project/golang/@formatter"
                }
            }
        }
    },
    {
        "Run": {
            "position": 600,
            "Run & Debug": {
                "position": 100,
                "Save All Unsaved Tabs Before Running": {
                    "type": "checkbox",
                    "path": "user/runconfig/@saveallbeforerun",
                    "position": 100
                }
            }
        }
    },
    {
        "Project": {
            "Run & Debug": {
                "position": "10300",
                "Runner Path in Environment": {
                    "type": "textbox",
                    "path": "project/run/@path",
                    "position": 1000
                }
            },
            "Run Configurations": {
                "position": "10200",
                "Run Configurations": {
                    "type": "custom",
                    "name": "runcfg",
                    "title": "Run Configurations",
                    "position": 120,
                    "node": [
                        "apf",
                        "bar",
                        "\n            <div class=\" ace_tree blackdg\" style=\"width: 600px; margin-bottom: 30px; height: 36px;\"><textarea class=\"ace_text-input\" wrap=\"off\" autocorrect=\"off\" autocapitalize=\"off\" spellcheck=\"false\" style=\"opacity: 0; font-size: 1px;\"></textarea><div class=\"ace_tree_scroller\" style=\"inset: 18px 0px 0px;\"><div class=\"ace_tree_cells\" style=\"margin-top: 0px; margin-left: 0px; width: 600px; height: 36px;\"><div class=\"ace_tree_layer ace_tree_selection-layer\"></div><div class=\"ace_tree_layer ace_tree_cell-layer\"><div class=\"message empty\">No run configurations</div></div></div></div><div class=\"tree-headings\" style=\"height: 18px; right: 0px; padding-right: 0px;\"><span class=\"tree-column \" style=\"width:15%;height:\">Name</span><span class=\"tree-column-resizer\"></span><span class=\"tree-column \" style=\"width:30%;height:\">Command</span><span class=\"tree-column-resizer\"></span><span class=\"tree-column \" style=\"width:15%;height:\">CWD</span><span class=\"tree-column-resizer\"></span><span class=\"tree-column \" style=\"width:10%;height:\">Debug</span><span class=\"tree-column-resizer\"></span><span class=\"tree-column \" style=\"width:20%;height:\">Runner</span><span class=\"tree-column-resizer\"></span><span class=\"tree-column \" style=\"width:10%;height:\">Default</span><span class=\"tree-column-resizer\"></span></div><div class=\"ace_scrollbar ace_scrollbar-v\" style=\"width: 21px; top: 18px; bottom: 0px; display: none;\"><div class=\"ace_scrollbar-inner\" style=\"width: 21px; height: 0px;\">&nbsp;</div></div><div class=\"ace_scrollbar ace_scrollbar-h\" style=\"display: none; height: 21px; left: 0px; right: 0px;\"><div class=\"ace_scrollbar-inner\" style=\"height: 21px; width: 0px;\">&nbsp;</div></div></div><div style=\"position: absolute; left: 10px; bottom: 10px; display: flex; align-items: stretch; padding: 0px; justify-content: flex-start;\" class=\"hbox\"><div class=\"c9-toolbarbutton-glossy \" style=\"box-sizing: border-box; margin: 0px;\">\n                <div class=\"c9-icon\"> </div>\n                <div class=\"c9-label\">Remove Selected Configs</div>\n            </div><div class=\"c9-toolbarbutton-glossy \" style=\"box-sizing: border-box; margin: 0px;\">\n                <div class=\"c9-icon\"> </div>\n                <div class=\"c9-label\">Add New Config</div>\n            </div><div class=\"c9-toolbarbutton-glossy \" style=\"box-sizing: border-box; margin: 0px;\">\n                <div class=\"c9-icon\"> </div>\n                <div class=\"c9-label\">Set As Default</div>\n            </div></div>"
                    ]
                }
            }
        }
    },
    {
        "Project": {
            "Build": {
                "position": "10400",
                "Builder Path in Environment": {
                    "type": "textbox",
                    "path": "project/build/@path",
                    "position": 1000
                }
            }
        }
    },
    {
        "Run": {
            "position": 600,
            "Build": {
                "position": 400,
                "Automatically Build Supported Files": {
                    "type": "checkbox",
                    "path": "user/build/@autobuild",
                    "position": 100
                }
            }
        }
    },
    {
        "Editors": {
            "Terminal": {
                "position": 100,
                "Text Color": {
                    "type": "colorbox",
                    "path": "user/terminal/@foregroundColor",
                    "position": 10100
                },
                "Background Color": {
                    "type": "colorbox",
                    "path": "user/terminal/@backgroundColor",
                    "position": 10200
                },
                "Selection Color": {
                    "type": "colorbox",
                    "path": "user/terminal/@selectionColor",
                    "position": 10250
                },
                "Font Family": {
                    "type": "textbox",
                    "path": "user/terminal/@fontfamily",
                    "position": 10300
                },
                "Font Size": {
                    "type": "spinner",
                    "path": "user/terminal/@fontsize",
                    "min": "1",
                    "max": "72",
                    "position": 11000
                },
                "Antialiased Fonts": {
                    "type": "checkbox",
                    "path": "user/terminal/@antialiasedfonts",
                    "position": 12000
                },
                "Blinking Cursor": {
                    "type": "checkbox",
                    "path": "user/terminal/@blinking",
                    "position": 12000
                },
                "Scrollback": {
                    "type": "spinner",
                    "path": "user/terminal/@scrollback",
                    "min": "1",
                    "max": "100000",
                    "position": 13000
                }
            }
        }
    },
    {
        "Editors": {
            "Output": {
                "position": 130,
                "Text Color": {
                    "type": "colorbox",
                    "path": "user/output/@foregroundColor",
                    "position": 10100
                },
                "Background Color": {
                    "type": "colorbox",
                    "path": "user/output/@backgroundColor",
                    "position": 10200
                },
                "Selection Color": {
                    "type": "colorbox",
                    "path": "user/output/@selectionColor",
                    "position": 10250
                },
                "Warn Before Closing Unnamed Configuration": {
                    "type": "checkbox",
                    "path": "user/output/@nosavequestion",
                    "position": 10300
                },
                "Preserve log between runs": {
                    "type": "checkbox",
                    "path": "user/output/@keepOutput",
                    "position": 10300
                }
            }
        }
    },
    {
        "General": {
            "Collaboration": {
                "Show Notification Bubbles": {
                    "type": "checkbox",
                    "position": 1000,
                    "path": "user/collab/@showbubbles"
                }
            }
        }
    },
    {
        "Project": {
            "position": 100,
            "Run & Debug": {
                "position": "10300",
                "Preview URL": {
                    "type": "textbox",
                    "path": "project/preview/@url"
                }
            }
        }
    },
    {
        "Run": {
            "position": 600,
            "Preview": {
                "position": 200,
                "Preview Running Apps": {
                    "type": "checkbox",
                    "path": "user/preview/@running_app",
                    "position": 400
                },
                "Default Previewer": {
                    "type": "dropdown",
                    "path": "user/preview/@default",
                    "position": 500,
                    "items": [
                        {
                            "caption": "Raw",
                            "value": "preview.raw"
                        },
                        {
                            "caption": "Browser",
                            "value": "preview.browser"
                        }
                    ]
                },
                "When Saving Reload Preview": {
                    "type": "dropdown",
                    "path": "user/preview/@onSave",
                    "position": 600,
                    "items": [
                        {
                            "caption": "Only on Ctrl-Enter",
                            "value": "false"
                        },
                        {
                            "caption": "Always",
                            "value": "true"
                        }
                    ]
                }
            }
        }
    },
    {
        "Project": {
            "Code Formatters": {
                "position": "10900",
                "JSBeautify": {
                    "type": "label",
                    "caption": "JSBeautify settings:"
                },
                "Format Code on Save": {
                    "position": 320,
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@formatOnSave"
                },
                "Use JSBeautify for JavaScript": {
                    "position": 340,
                    "type": "checkbox",
                    "path": "project/javascript/@use_jsbeautify"
                },
                "Preserve Empty Lines": {
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@preserveempty",
                    "position": 350
                },
                "Keep Array Indentation": {
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@keeparrayindentation",
                    "position": 351
                },
                "JSLint Strict Whitespace": {
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@jslinthappy",
                    "position": 352
                },
                "Braces": {
                    "type": "dropdown",
                    "path": "project/format/jsbeautify/@braces",
                    "width": "185",
                    "position": 353,
                    "items": [
                        {
                            "value": "collapse",
                            "caption": "Braces with control statement"
                        },
                        {
                            "value": "expand",
                            "caption": "Braces on own line"
                        },
                        {
                            "value": "end-expand",
                            "caption": "End braces on own line"
                        }
                    ]
                },
                "Preserve Inline Blocks": {
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@preserve-inline",
                    "position": 353.5
                },
                "Space Before Conditionals": {
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@space_before_conditional",
                    "position": 354
                },
                "Unescape Strings": {
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@unescape_strings",
                    "position": 355
                },
                "Indent Inner Html": {
                    "type": "checkbox",
                    "path": "project/format/jsbeautify/@indent_inner_html",
                    "position": 356
                }
            },
            "JavaScript Support": {
                "position": "101100",
                "Use Built-in JSBeautify as Code Formatter": {
                    "position": 320,
                    "type": "checkbox",
                    "path": "project/javascript/@use_jsbeautify"
                }
            }
        }
    },
    {
        "General": {
            "Tree and Go Panel": {
                "Download Files As": {
                    "type": "dropdown",
                    "path": "user/general/@downloadFilesAs",
                    "items": [
                        {
                            "caption": "auto",
                            "value": "auto"
                        },
                        {
                            "caption": "tar.gz",
                            "value": "tar.gz"
                        },
                        {
                            "caption": "zip",
                            "value": "zip"
                        }
                    ],
                    "position": 5000
                }
            }
        }
    },
    {
        "Editors": {
            "Terminal": {
                "Use AWS Cloud9 as the default editor": {
                    "type": "checkbox",
                    "path": "user/terminal/@defaultEnvEditor",
                    "position": 14000
                }
            }
        }
    },
    {
        "Experimental": {
            "File": {
                "position": 150,
                "Save": {
                    "position": 100,
                    "Auto-Save Files": {
                        "type": "dropdown",
                        "position": 100,
                        "path": "user/general/@autosave",
                        "width": 130,
                        "items": [
                            {
                                "caption": "Off",
                                "value": false
                            },
                            {
                                "caption": "On Focus Change",
                                "value": "onFocusChange"
                            },
                            {
                                "caption": "After Delay",
                                "value": "afterDelay"
                            }
                        ]
                    }
                }
            }
        }
    },
    {
        "General": {
            "User Interface": {
                "position": 20,
                "Automatically Close Empty Panes": {
                    "type": "checkbox",
                    "path": "user/tabs/@autoclosepanes",
                    "position": 1150
                }
            }
        }
    }
]

$prefs.forEach(function(state) {
    addState(state, resultPreferences);
})

function sortPreferences(preferences: any) {
    preferences = Object.values(preferences).map((preference: any) => {
        if (preference["subGroups"]) {
            preference["subGroups"] = sortPreferences(preference["subGroups"]);
        }
        return preference;
    }).sort(function(item1, item2) {
        return item1["position"] - item2["position"];
    });

    return preferences;
}

resultPreferences = sortPreferences(resultPreferences);

let navigationHtml = []
let appHtml = []

function render() {
    renderGroup(resultPreferences);

    dom.buildDom(["div", {style: "overflow-y: scroll; height: 100%"}, navigationHtml], navigation.element);
    let preferencesNode = dom.buildDom(["div", {style: "overflow-y: scroll; height: 100%"}, appHtml], app.element);
    let searchBox = new SettingsSearchBox(preferencesNode);
    searchBox.build();
    dom.buildDom([searchBox.element], preferences.toolBars.top.element);
}

function renderGroup(preferences) {
    preferences.forEach(function(item) {
        if (item["groupData"]) {
            appHtml.push(renderItem(item["groupName"], item["groupData"]));
        }
        if (item["subGroups"]) {
            if (item["subGroups"].length > 0 && item["subGroups"][0]["groupData"])
                appHtml.push(renderItem(item["groupName"]));
            navigationHtml.push(["div", {}, item["groupName"]]);
            renderGroup(item["subGroups"]);
        }
    })

}

function renderItem(title: string, item?: Object) {
    if (item) {
        switch (item["type"]) {
            case "checkbox":
                return ["div", {class: "preferenceItem"}, ["span", {}, title], new Switcher({}).render()];
            case "textbox":
                return ["div", {class: "preferenceItem"}, ["span", {}, title], ["input", {class: "tbsimple"}]];
            case "spinner":
                return ["div", {class: "preferenceItem"}, ["span", {}, title], ["div", {class: "spinner"}, ["input", {
                    type: "number",
                    min: item["min"],
                    max: item["max"]
                }]]];
            case "checked-spinner":
                return ["div", {class: "preferenceItem"}, ["div", {class: "label"}, new Switcher({className: "checkbox"}).render(), ["span", {}, title]], ["div", {class: "spinner"}, ["input", {
                    type: "number",
                    min: item["min"],
                    max: item["max"]
                }]]];
            case "button":
                //TODO:
                return ["div", {class: "preferenceItem"}, new Button({}).render()];
            case "dropdown":
                //TODO:
                return ["div", {class: "preferenceItem"}, ["span", {}, title], new Dropdown({
                    items: item["items"],
                    width: item["width"]
                }).render()];
            case "custom":
                return ["div", {class: "preferenceItem"}, item["node"][2]];
            default:
                return [];
        }
    } else {
        return ["div", {class: "preferenceItem header"}, ["div", {}, title]]
    }
}

render();

function onResize () {
    preferences.setBox(0, 0, window.innerWidth, window.innerHeight)
}
window.onresize = onResize;
onResize();