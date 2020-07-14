var ace = require("ace-builds");
var Range = ace.require("ace/range").Range;
var dom = ace.require("ace/lib/dom");
var shortcuts = ace.require("ace/ext/menu_tools/get_editor_keyboard_shortcuts");
var FilteredList= ace.require("ace/autocomplete").FilteredList;
var AcePopup = ace.require('ace/autocomplete/popup').AcePopup;
var $singleLineEditor = ace.require('ace/autocomplete/popup').$singleLineEditor;
var UndoManager = ace.require("ace/undomanager").UndoManager;
var Tokenizer = ace.require("ace/tokenizer").Tokenizer;
 
function prompt(editor, message, options, callback) {
    if (typeof message == "object") {
        return prompt(editor, "", message, options);
    }
    if (openPrompt) {
        var lastPrompt = openPrompt;
        editor = lastPrompt.editor;
        lastPrompt.close();
        if (lastPrompt.name && lastPrompt.name == options.name)
            return;
    }
    if (options.$type)
       return prompt[options.$type](editor, callback);

    var cmdLine = $singleLineEditor();
    cmdLine.session.setUndoManager(new UndoManager());

    var el = dom.buildDom(["div", {class: "ace_prompt_container" + (options.hasDescription ? " input-box-with-description" : "")}]);
    var overlay = overlayPage(editor, el, done);
    el.appendChild(cmdLine.container);

    if (editor) {
        editor.cmdLine = cmdLine;
        cmdLine.setOption("fontSize", editor.getOption("fontSize"));
    }
    if (message) {
        cmdLine.setValue(message, 1);
    }
    if (options.selection) {
        cmdLine.selection.setRange({
            start: cmdLine.session.doc.indexToPosition(options.selection[0]),
            end: cmdLine.session.doc.indexToPosition(options.selection[1])
        });
    }

    if (options.getCompletions) {
    }

    if (options.$rules) {
        var tokenizer = new Tokenizer(options.$rules);
        cmdLine.session.bgTokenizer.setTokenizer(tokenizer);
    }

    if (options.placeholder) {
        cmdLine.setOption("placeholder", options.placeholder);
    }

    if (options.hasDescription) {
        var promptTextContainer = dom.buildDom(["div", {class: "ace_prompt_text_container"}]);
        dom.buildDom(options.prompt || "Press 'Enter' to confirm or 'Escape' to cancel", promptTextContainer);
        el.appendChild(promptTextContainer);
    }

    overlay.setIgnoreFocusOut(options.ignoreFocusOut);

    function accept() {
        var val;
        if (popup && popup.getCursorPosition().row > 0) {
            val = valueFromRecentList();
        } else {
            val = cmdLine.getValue();
        }
        var curData = popup ? popup.getData(popup.getRow()) : val;
        if (curData && !curData.error) {
            done();
            options.onAccept && options.onAccept({
                value: val,
                item: curData
            }, cmdLine);
        }
    }

    var keys = {
        "Enter": accept,
        "Esc|Shift-Esc": function() {
            options.onCancel && options.onCancel(cmdLine.getValue(), cmdLine);
            done();
        }
    };

    if (popup) {
        Object.assign(keys, {
            "Up": function(editor) { popup.goTo("up"); valueFromRecentList();},
            "Down": function(editor) { popup.goTo("down"); valueFromRecentList();},
            "Ctrl-Up|Ctrl-Home": function(editor) { popup.goTo("start"); valueFromRecentList();},
            "Ctrl-Down|Ctrl-End": function(editor) { popup.goTo("end"); valueFromRecentList();},
            "Tab": function(editor) {
                popup.goTo("down"); valueFromRecentList();
            },
            "PageUp": function(editor) { popup.gotoPageUp(); valueFromRecentList();},
            "PageDown": function(editor) { popup.gotoPageDown(); valueFromRecentList();}
        });
    }

    cmdLine.commands.bindKeys(keys);


    cmdLine.on("input", function() {
        options.onInput && options.onInput();
        updateCompletions();
    });

    function updateCompletions() {
        if (options.getCompletions) {
            var prefix;
            if (options.getPrefix) {
                prefix = options.getPrefix(cmdLine);
            }

            var completions = options.getCompletions(cmdLine);
            popup.setData(completions, prefix);
            popup.resize(true);
        }
    }

    function valueFromRecentList() {
        var current = popup.getData(popup.getRow());
        if (current && !current.error)
            return current.value || current.caption || current;
    }

    cmdLine.resize(true);
    if (popup) {
        popup.resize(true);
    }
 
 
}
  
var {Box} = require("./box");
var lib = require("./lib");

class ListBox extends Box {
    draw() {
        if (this.element) return this.element;
        super.draw();
        
        var popup = new AcePopup();
        popup.renderer.setStyle("ace_listBox");
        popup.container.style.display = "block";
        popup.container.style.position = "absolute";
        popup.container.style.zIndex = "0";
        popup.container.style.boxShadow = "none";
        popup.renderer.setScrollMargin(2, 2, 0, 0);
        popup.autoSelect = false;
        popup.renderer.$maxLines = null;
        popup.setRow(-1);
        popup.on("click", (e) => {
            e.stop();
            var data = popup.getData(popup.getRow());
            this._signal("select", data);
        });
        popup.on("dblclick", (e) => {
            e.stop();
            var data = popup.getData(popup.getRow());
            this._signal("choose", data);
        });
        popup.on("tripleclick", (e) => {
            e.stop();
        });
        popup.on("quadclick", (e) => {
            e.stop();
        });
        this.element.appendChild(popup.container);
        this.popup = popup;
        delete popup.focus
        
        // popup.session.bgTokenizer.$tokenizeRow = function() { return {tokens: [{}], state: "start"} }
        // popup.renderer.$textLayer.$renderLine = function() {
            // debugger
        // }
        
        // updateCompletions();
        return this.element;
    }
    $updateChildSize(x, y, w, h) {
        lib.setBox(this.popup.container, x, y, w, h);
        this.popup.resize(true);
    }
}

exports.ListBox = ListBox;