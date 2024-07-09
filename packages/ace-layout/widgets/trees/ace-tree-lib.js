(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 217:
/***/ ((module) => {

"use strict";


var $cancelT;
module.exports = { 
    lineMode: false,
    pasteCancelled: function() {
        if ($cancelT && $cancelT > Date.now() - 50)
            return true;
        return $cancelT = false;
    },
    cancel: function() {
        $cancelT = Date.now();
    }
};


/***/ }),

/***/ 379:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var oop = __webpack_require__(645);
var MultiHashHandler = (__webpack_require__(50)/* .MultiHashHandler */ .O);
var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);

/**
 * @class CommandManager
 *
 **/

/**
 * new CommandManager(platform, commands)
 * @param {String} platform Identifier for the platform; must be either `"mac"` or `"win"`
 * @param {Array} commands A list of commands
 *
 **/

var CommandManager = function(platform, commands) {
    MultiHashHandler.call(this, commands, platform);
    this.byName = this.commands;
    this.setDefaultHandler("exec", function(e) {
        if (!e.args) {
            return e.command.exec(e.editor, {}, e.event, true);
        }
        return e.command.exec(e.editor, e.args, e.event, false);
    });
};

oop.inherits(CommandManager, MultiHashHandler);

(function() {

    oop.implement(this, EventEmitter);

    this.exec = function(command, editor, args) {
        if (Array.isArray(command)) {
            for (var i = command.length; i--; ) {
                if (this.exec(command[i], editor, args)) return true;
            }
            return false;
        }

        if (typeof command === "string")
            command = this.commands[command];

        if (!command)
            return false;

        if (editor && editor.$readOnly && !command.readOnly)
            return false;

        if (this.$checkCommandState != false && command.isAvailable && !command.isAvailable(editor))
            return false;

        var e = {editor: editor, command: command, args: args};
        e.returnValue = this._emit("exec", e);
        this._signal("afterExec", e);

        return e.returnValue === false ? false : true;
    };

    this.toggleRecording = function(editor) {
        if (this.$inReplay)
            return;

        editor && editor._emit("changeStatus");
        if (this.recording) {
            this.macro.pop();
            this.off("exec", this.$addCommandToMacro);

            if (!this.macro.length)
                this.macro = this.oldMacro;

            return this.recording = false;
        }
        if (!this.$addCommandToMacro) {
            this.$addCommandToMacro = function(e) {
                this.macro.push([e.command, e.args]);
            }.bind(this);
        }

        this.oldMacro = this.macro;
        this.macro = [];
        this.on("exec", this.$addCommandToMacro);
        return this.recording = true;
    };

    this.replay = function(editor) {
        if (this.$inReplay || !this.macro)
            return;

        if (this.recording)
            return this.toggleRecording(editor);

        try {
            this.$inReplay = true;
            this.macro.forEach(function(x) {
                if (typeof x == "string")
                    this.exec(x, editor);
                else
                    this.exec(x[0], editor, x[1]);
            }, this);
        } finally {
            this.$inReplay = false;
        }
    };

    this.trimMacro = function(m) {
        return m.map(function(x){
            if (typeof x[0] != "string")
                x[0] = x[0].name;
            if (!x[1])
                x = x[0];
            return x;
        });
    };

}).call(CommandManager.prototype);

exports.F = CommandManager;


/***/ }),

/***/ 50:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;


var keyUtil = __webpack_require__(451);
var useragent = __webpack_require__(943);
var KEY_MODS = keyUtil.KEY_MODS;

function HashHandler(config, platform) {
    this.platform = platform || (useragent.isMac ? "mac" : "win");
    this.commands = {};
    this.commandKeyBinding = {};
    this.addCommands(config);
    this.$singleCommand = true;
}

function MultiHashHandler(config, platform) {
    HashHandler.call(this, config, platform);
    this.$singleCommand = false;
}

MultiHashHandler.prototype = HashHandler.prototype;

(function() {
    

    this.addCommand = function(command) {
        if (this.commands[command.name])
            this.removeCommand(command);

        this.commands[command.name] = command;

        if (command.bindKey)
            this._buildKeyHash(command);
    };

    this.removeCommand = function(command, keepCommand) {
        var name = command && (typeof command === 'string' ? command : command.name);
        command = this.commands[name];
        if (!keepCommand)
            delete this.commands[name];

        // exhaustive search is brute force but since removeCommand is
        // not a performance critical operation this should be OK
        var ckb = this.commandKeyBinding;
        for (var keyId in ckb) {
            var cmdGroup = ckb[keyId];
            if (cmdGroup == command) {
                delete ckb[keyId];
            } else if (Array.isArray(cmdGroup)) {
                var i = cmdGroup.indexOf(command);
                if (i != -1) {
                    cmdGroup.splice(i, 1);
                    if (cmdGroup.length == 1)
                        ckb[keyId] = cmdGroup[0];
                }
            }
        }
    };

    this.bindKey = function(key, command, position) {
        if (typeof key == "object" && key) {
            if (position == undefined)
                position = key.position;
            key = key[this.platform];
        }
        if (!key)
            return;
        if (typeof command == "function")
            return this.addCommand({exec: command, bindKey: key, name: command.name || key});
        
        key.split("|").forEach(function(keyPart) {
            var chain = "";
            if (keyPart.indexOf(" ") != -1) {
                var parts = keyPart.split(/\s+/);
                keyPart = parts.pop();
                parts.forEach(function(keyPart) {
                    var binding = this.parseKeys(keyPart);
                    var id = KEY_MODS[binding.hashId] + binding.key;
                    chain += (chain ? " " : "") + id;
                    this._addCommandToBinding(chain, "chainKeys");
                }, this);
                chain += " ";
            }
            var binding = this.parseKeys(keyPart);
            var id = KEY_MODS[binding.hashId] + binding.key;
            this._addCommandToBinding(chain + id, command, position);
        }, this);
    };
    
    function getPosition(command) {
        return typeof command == "object" && command.bindKey
            && command.bindKey.position 
            || (command.isDefault ? -100 : 0);
    }
    this._addCommandToBinding = function(keyId, command, position) {
        var ckb = this.commandKeyBinding, i;
        if (!command) {
            delete ckb[keyId];
        } else if (!ckb[keyId] || this.$singleCommand) {
            ckb[keyId] = command;
        } else {
            if (!Array.isArray(ckb[keyId])) {
                ckb[keyId] = [ckb[keyId]];
            } else if ((i = ckb[keyId].indexOf(command)) != -1) {
                ckb[keyId].splice(i, 1);
            }
            
            if (typeof position != "number") {
                position = getPosition(command);
            }

            var commands = ckb[keyId];
            for (i = 0; i < commands.length; i++) {
                var other = commands[i];
                var otherPos = getPosition(other);
                if (otherPos > position)
                    break;
            }
            commands.splice(i, 0, command);
        }
    };

    this.addCommands = function(commands) {
        commands && Object.keys(commands).forEach(function(name) {
            var command = commands[name];
            if (!command)
                return;
            
            if (typeof command === "string")
                return this.bindKey(command, name);

            if (typeof command === "function")
                command = { exec: command };

            if (typeof command !== "object")
                return;

            if (!command.name)
                command.name = name;

            this.addCommand(command);
        }, this);
    };

    this.removeCommands = function(commands) {
        Object.keys(commands).forEach(function(name) {
            this.removeCommand(commands[name]);
        }, this);
    };

    this.bindKeys = function(keyList) {
        Object.keys(keyList).forEach(function(key) {
            this.bindKey(key, keyList[key]);
        }, this);
    };

    this._buildKeyHash = function(command) {
        this.bindKey(command.bindKey, command);
    };

    // accepts keys in the form ctrl+Enter or ctrl-Enter
    // keys without modifiers or shift only 
    this.parseKeys = function(keys) {
        var parts = keys.toLowerCase().split(/[\-\+]([\-\+])?/).filter(function(x){return x;});
        var key = parts.pop();

        var keyCode = keyUtil[key];
        if (keyUtil.FUNCTION_KEYS[keyCode])
            key = keyUtil.FUNCTION_KEYS[keyCode].toLowerCase();
        else if (!parts.length)
            return {key: key, hashId: -1};
        else if (parts.length == 1 && parts[0] == "shift")
            return {key: key.toUpperCase(), hashId: -1};

        var hashId = 0;
        for (var i = parts.length; i--;) {
            var modifier = keyUtil.KEY_MODS[parts[i]];
            if (modifier == null) {
                if (typeof console != "undefined")
                    console.error("invalid modifier " + parts[i] + " in " + keys);
                return false;
            }
            hashId |= modifier;
        }
        return {key: key, hashId: hashId};
    };

    this.findKeyCommand = function findKeyCommand(hashId, keyString) {
        var key = KEY_MODS[hashId] + keyString;
        return this.commandKeyBinding[key];
    };

    this.handleKeyboard = function(data, hashId, keyString, keyCode) {
        if (keyCode < 0) return;
        var key = KEY_MODS[hashId] + keyString;
        var command = this.commandKeyBinding[key];
        if (data.$keyChain) {
            data.$keyChain += " " + key;
            command = this.commandKeyBinding[data.$keyChain] || command;
        }
        
        if (command) {
            if (command == "chainKeys" || command[command.length - 1] == "chainKeys") {
                data.$keyChain = data.$keyChain || key;
                return {command: "null"};
            }
        }
        
        if (data.$keyChain) {
            if ((!hashId || hashId == 4) && keyString.length == 1)
                data.$keyChain = data.$keyChain.slice(0, -key.length - 1); // wait for input
            else if (hashId == -1 || keyCode > 0)
                data.$keyChain = ""; // reset keyChain
        }
        return {command: command};
    };
    
    this.getStatusText = function(editor, data) {
        return data.$keyChain || "";
    };

}).call(HashHandler.prototype);

__webpack_unused_export__ = HashHandler;
exports.O = MultiHashHandler;


/***/ }),

/***/ 957:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var keyUtil  = __webpack_require__(451);
var event = __webpack_require__(631);

var KeyBinding = function(editor) {
    this.$editor = editor;
    this.$data = {editor: editor};
    this.$handlers = [];
    this.setDefaultHandler(editor.commands);
};

(function() {
    this.setDefaultHandler = function(kb) {
        this.removeKeyboardHandler(this.$defaultHandler);
        this.$defaultHandler = kb;
        this.addKeyboardHandler(kb, 0);
    };

    this.setKeyboardHandler = function(kb) {
        var h = this.$handlers;
        if (h[h.length - 1] == kb)
            return;

        while (h[h.length - 1] && h[h.length - 1] != this.$defaultHandler)
            this.removeKeyboardHandler(h[h.length - 1]);

        this.addKeyboardHandler(kb, 1);
    };

    this.addKeyboardHandler = function(kb, pos) {
        if (!kb)
            return;
        if (typeof kb == "function" && !kb.handleKeyboard)
            kb.handleKeyboard = kb;
        var i = this.$handlers.indexOf(kb);
        if (i != -1)
            this.$handlers.splice(i, 1);

        if (pos == undefined)
            this.$handlers.push(kb);
        else
            this.$handlers.splice(pos, 0, kb);

        if (i == -1 && kb.attach)
            kb.attach(this.$editor);
    };

    this.removeKeyboardHandler = function(kb) {
        var i = this.$handlers.indexOf(kb);
        if (i == -1)
            return false;
        this.$handlers.splice(i, 1);
        kb.detach && kb.detach(this.$editor);
        return true;
    };

    this.getKeyboardHandler = function() {
        return this.$handlers[this.$handlers.length - 1];
    };
    
    this.getStatusText = function() {
        var data = this.$data;
        var editor = data.editor;
        return this.$handlers.map(function(h) {
            return h.getStatusText && h.getStatusText(editor, data) || "";
        }).filter(Boolean).join(" ");
    };

    this.$callKeyboardHandlers = function(hashId, keyString, keyCode, e) {
        var toExecute;
        var success = false;
        var commands = this.$editor.commands;

        for (var i = this.$handlers.length; i--;) {
            toExecute = this.$handlers[i].handleKeyboard(
                this.$data, hashId, keyString, keyCode, e
            );
            if (!toExecute || !toExecute.command)
                continue;
            
            // allow keyboardHandler to consume keys
            if (toExecute.command == "null") {
                success = true;
            } else {
                success = commands.exec(toExecute.command, this.$editor, toExecute.args, e);
            }
            // do not stop input events to not break repeating
            if (success && e && hashId != -1 && 
                toExecute.passEvent != true && toExecute.command.passEvent != true
            ) {
                event.stopEvent(e);
            }
            if (success)
                break;
        }
        
        if (!success && hashId == -1) {
            toExecute = {command: "insertstring"};
            success = commands.exec("insertstring", this.$editor, keyString);
        }
        
        if (success && this.$editor._signal)
            this.$editor._signal("keyboardActivity", toExecute);
        
        return success;
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        var keyString = keyUtil.keyCodeToString(keyCode);
        return this.$callKeyboardHandlers(hashId, keyString, keyCode, e);
    };

    this.onTextInput = function(text) {
        return this.$callKeyboardHandlers(-1, text);
    };

}).call(KeyBinding.prototype);

exports.$ = KeyBinding;


/***/ }),

/***/ 984:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;


var event = __webpack_require__(631);
var useragent = __webpack_require__(943);
var dom = __webpack_require__(435);
var lang = __webpack_require__(955);
var clipboard = __webpack_require__(217);
var BROKEN_SETDATA = useragent.isChrome < 18;
var USE_IE_MIME_TYPE =  useragent.isIE;
var HAS_FOCUS_ARGS = useragent.isChrome > 63;
var MAX_LINE_LENGTH = 400;

var KEYS = __webpack_require__(451);
var MODS = KEYS.KEY_MODS;
var isIOS = useragent.isIOS;
var valueResetRegex = isIOS ? /\s/ : /\n/;
var isMobile = useragent.isMobile;

var TextInput = function(parentNode, host) {
    var text = dom.createElement("textarea");
    text.className = "ace_text-input";

    text.setAttribute("wrap", "off");
    text.setAttribute("autocorrect", "off");
    text.setAttribute("autocapitalize", "off");
    text.setAttribute("spellcheck", false);

    text.style.opacity = "0";
    parentNode.insertBefore(text, parentNode.firstChild);

    var copied = false;
    var pasted = false;
    var inComposition = false;
    var sendingText = false;
    var tempStyle = '';
    
    if (!isMobile)
        text.style.fontSize = "1px";

    var commandMode = false;
    var ignoreFocusEvents = false;
    
    var lastValue = "";
    var lastSelectionStart = 0;
    var lastSelectionEnd = 0;
    var lastRestoreEnd = 0;
    
    // FOCUS
    // ie9 throws error if document.activeElement is accessed too soon
    try { var isFocused = document.activeElement === text; } catch(e) {}

    this.setAriaOptions = function(options) {
        if (options.activeDescendant) {
            text.setAttribute("aria-haspopup", "true");
            text.setAttribute("aria-autocomplete", "list");
            text.setAttribute("aria-activedescendant", options.activeDescendant);
        } else {
            text.setAttribute("aria-haspopup", "false");
            text.setAttribute("aria-autocomplete", "both");
            text.removeAttribute("aria-activedescendant");
        }
        if (options.role) {
            text.setAttribute("role", options.role);
        }
    };
    this.setAriaOptions({role: "textbox"});

    event.addListener(text, "blur", function(e) {
        if (ignoreFocusEvents) return;
        host.onBlur(e);
        isFocused = false;
    }, host);
    event.addListener(text, "focus", function(e) {
        if (ignoreFocusEvents) return;
        isFocused = true;
        if (useragent.isEdge) {
            // on edge focus event is fired even if document itself is not focused
            try {
                if (!document.hasFocus())
                    return;
            } catch(e) {}
        }
        host.onFocus(e);
        if (useragent.isEdge)
            setTimeout(resetSelection);
        else
            resetSelection();
    }, host);
    this.$focusScroll = false;
    this.focus = function() {
        if (tempStyle || HAS_FOCUS_ARGS || this.$focusScroll == "browser")
            return text.focus({ preventScroll: true });

        var top = text.style.top;
        text.style.position = "fixed";
        text.style.top = "0px";
        try {
            var isTransformed = text.getBoundingClientRect().top != 0;
        } catch(e) {
            // getBoundingClientRect on IE throws error if element is not in the dom tree
            return;
        }
        var ancestors = [];
        if (isTransformed) {
            var t = text.parentElement;
            while (t && t.nodeType == 1) {
                ancestors.push(t);
                t.setAttribute("ace_nocontext", true);
                if (!t.parentElement && t.getRootNode)
                    t = t.getRootNode().host;
                else
                    t = t.parentElement;
            }
        }
        text.focus({ preventScroll: true });
        if (isTransformed) {
            ancestors.forEach(function(p) {
                p.removeAttribute("ace_nocontext");
            });
        }
        setTimeout(function() {
            text.style.position = "";
            if (text.style.top == "0px")
                text.style.top = top;
        }, 0);
    };
    this.blur = function() {
        text.blur();
    };
    this.isFocused = function() {
        return isFocused;
    };
    
    host.on("beforeEndOperation", function() {
        var curOp = host.curOp;
        var commandName = curOp && curOp.command && curOp.command.name;
        if (commandName == "insertstring")
            return;
        var isUserAction = commandName && (curOp.docChanged || curOp.selectionChanged);
        if (inComposition && isUserAction) {
            // exit composition from commands other than insertstring
            lastValue = text.value = "";
            onCompositionEnd();
        }
        // sync value of textarea
        resetSelection();
    });
    
    var resetSelection = isIOS
    ? function(value) {
        if (!isFocused || (copied && !value) || sendingText) return;
        if (!value) 
            value = "";
        var newValue = "\n ab" + value + "cde fg\n";
        if (newValue != text.value)
            text.value = lastValue = newValue;
        
        var selectionStart = 4;
        var selectionEnd = 4 + (value.length || (host.selection.isEmpty() ? 0 : 1));

        if (lastSelectionStart != selectionStart || lastSelectionEnd != selectionEnd) {
            text.setSelectionRange(selectionStart, selectionEnd);
        }
        lastSelectionStart = selectionStart;
        lastSelectionEnd = selectionEnd;
    }
    : function() {
        if (inComposition || sendingText)
            return;
        // modifying selection of blured textarea can focus it (chrome mac/linux)
        if (!isFocused && !afterContextMenu)
            return;
        // this prevents infinite recursion on safari 8 
        // see https://github.com/ajaxorg/ace/issues/2114
        inComposition = true;
        
        var selectionStart = 0;
        var selectionEnd = 0;
        var line = "";

        if (host.session) {
            var selection = host.selection;
            var range = selection.getRange();
            var row = selection.cursor.row;
            selectionStart = range.start.column;
            selectionEnd = range.end.column;
            line = host.session.getLine(row);

            if (range.start.row != row) {
                var prevLine = host.session.getLine(row - 1);
                selectionStart = range.start.row < row - 1 ? 0 : selectionStart;
                selectionEnd += prevLine.length + 1;
                line = prevLine + "\n" + line;
            }
            else if (range.end.row != row) {
                var nextLine = host.session.getLine(row + 1);
                selectionEnd = range.end.row > row  + 1 ? nextLine.length : selectionEnd;
                selectionEnd += line.length + 1;
                line = line + "\n" + nextLine;
            }
            else if (isMobile && row > 0) {
                line = "\n" + line;
                selectionEnd += 1;
                selectionStart += 1;
            }

            if (line.length > MAX_LINE_LENGTH) {
                if (selectionStart < MAX_LINE_LENGTH && selectionEnd < MAX_LINE_LENGTH) {
                    line = line.slice(0, MAX_LINE_LENGTH);
                } else {
                    line = "\n";
                    if (selectionStart == selectionEnd) {
                        selectionStart = selectionEnd = 0;
                    }
                    else {
                        selectionStart = 0;
                        selectionEnd = 1;
                    }
                }
            }
        }

        var newValue = line + "\n\n";
        if (newValue != lastValue) {
            text.value = lastValue = newValue;
            lastSelectionStart = lastSelectionEnd = newValue.length;
        }
        
        // contextmenu on mac may change the selection
        if (afterContextMenu) {
            lastSelectionStart = text.selectionStart;
            lastSelectionEnd = text.selectionEnd;
        }
        // on firefox this throws if textarea is hidden
        if (
            lastSelectionEnd != selectionEnd 
            || lastSelectionStart != selectionStart 
            || text.selectionEnd != lastSelectionEnd // on ie edge selectionEnd changes silently after the initialization
        ) {
            try {
                text.setSelectionRange(selectionStart, selectionEnd);
                lastSelectionStart = selectionStart;
                lastSelectionEnd = selectionEnd;
            } catch(e){}
        }
        inComposition = false;
    };
    this.resetSelection = resetSelection;

    if (isFocused)
        host.onFocus();


    var isAllSelected = function(text) {
        return text.selectionStart === 0 && text.selectionEnd >= lastValue.length
            && text.value === lastValue && lastValue
            && text.selectionEnd !== lastSelectionEnd;
    };

    var onSelect = function(e) {
        if (inComposition)
            return;
        if (copied) {
            copied = false;
        } else if (isAllSelected(text)) {
            host.selectAll();
            resetSelection();
        } else if (isMobile && text.selectionStart != lastSelectionStart) {
            resetSelection();
        }
    };

    var inputHandler = null;
    this.setInputHandler = function(cb) {inputHandler = cb;};
    this.getInputHandler = function() {return inputHandler;};
    var afterContextMenu = false;
    
    var sendText = function(value, fromInput) {
        if (afterContextMenu)
            afterContextMenu = false;
        if (pasted) {
            resetSelection();
            if (value)
                host.onPaste(value);
            pasted = false;
            return "";
        } else {
            var selectionStart = text.selectionStart;
            var selectionEnd = text.selectionEnd;
        
            var extendLeft = lastSelectionStart;
            var extendRight = lastValue.length - lastSelectionEnd;
            
            var inserted = value;
            var restoreStart = value.length - selectionStart;
            var restoreEnd = value.length - selectionEnd;
        
            var i = 0;
            while (extendLeft > 0 && lastValue[i] == value[i]) {
                i++;
                extendLeft--;
            }
            inserted = inserted.slice(i);
            i = 1;
            while (extendRight > 0 && lastValue.length - i > lastSelectionStart - 1  && lastValue[lastValue.length - i] == value[value.length - i]) {
                i++;
                extendRight--;
            }
            restoreStart -= i-1;
            restoreEnd -= i-1;
            var endIndex = inserted.length - i + 1;
            if (endIndex < 0) {
                extendLeft = -endIndex;
                endIndex = 0;
            } 
            inserted = inserted.slice(0, endIndex);
            
            // composition update can be called without any change
            if (!fromInput && !inserted && !restoreStart && !extendLeft && !extendRight && !restoreEnd)
                return "";
            sendingText = true;
            
            // some android keyboards converts two spaces into sentence end, which is not useful for code
            var shouldReset = false;
            if (useragent.isAndroid && inserted == ". ") {
                inserted = "  ";
                shouldReset = true;
            }
            
            if (inserted && !extendLeft && !extendRight && !restoreStart && !restoreEnd || commandMode) {
                host.onTextInput(inserted);
            } else {
                host.onTextInput(inserted, {
                    extendLeft: extendLeft,
                    extendRight: extendRight,
                    restoreStart: restoreStart,
                    restoreEnd: restoreEnd
                });
            }
            sendingText = false;
            
            lastValue = value;
            lastSelectionStart = selectionStart;
            lastSelectionEnd = selectionEnd;
            lastRestoreEnd = restoreEnd;
            return shouldReset ? "\n" : inserted;
        }
    };
    var onInput = function(e) {
        if (inComposition)
            return onCompositionUpdate();
        if (e && e.inputType) {
            if (e.inputType == "historyUndo") return host.execCommand("undo");
            if (e.inputType == "historyRedo") return host.execCommand("redo");
        }
        var data = text.value;
        var inserted = sendText(data, true);
        if (
            data.length > MAX_LINE_LENGTH + 100 
            || valueResetRegex.test(inserted)
            || isMobile && lastSelectionStart < 1 && lastSelectionStart == lastSelectionEnd
        ) {
            resetSelection();
        }
    };
    
    var handleClipboardData = function(e, data, forceIEMime) {
        var clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData || BROKEN_SETDATA)
            return;
        // using "Text" doesn't work on old webkit but ie needs it
        var mime = USE_IE_MIME_TYPE || forceIEMime ? "Text" : "text/plain";
        try {
            if (data) {
                // Safari 5 has clipboardData object, but does not handle setData()
                return clipboardData.setData(mime, data) !== false;
            } else {
                return clipboardData.getData(mime);
            }
        } catch(e) {
            if (!forceIEMime)
                return handleClipboardData(e, data, true);
        }
    };

    var doCopy = function(e, isCut) {
        var data = host.getCopyText();
        if (!data)
            return event.preventDefault(e);

        if (handleClipboardData(e, data)) {
            if (isIOS) {
                resetSelection(data);
                copied = data;
                setTimeout(function () {
                    copied = false;
                }, 10);
            }
            isCut ? host.onCut() : host.onCopy();
            event.preventDefault(e);
        } else {
            copied = true;
            text.value = data;
            text.select();
            setTimeout(function(){
                copied = false;
                resetSelection();
                isCut ? host.onCut() : host.onCopy();
            });
        }
    };
    
    var onCut = function(e) {
        doCopy(e, true);
    };
    
    var onCopy = function(e) {
        doCopy(e, false);
    };
    
    var onPaste = function(e) {
        var data = handleClipboardData(e);
        if (clipboard.pasteCancelled())
            return;
        if (typeof data == "string") {
            if (data)
                host.onPaste(data, e);
            if (useragent.isIE)
                setTimeout(resetSelection);
            event.preventDefault(e);
        }
        else {
            text.value = "";
            pasted = true;
        }
    };

    event.addCommandKeyListener(text, host.onCommandKey.bind(host), host);

    event.addListener(text, "select", onSelect, host);
    event.addListener(text, "input", onInput, host);

    event.addListener(text, "cut", onCut, host);
    event.addListener(text, "copy", onCopy, host);
    event.addListener(text, "paste", onPaste, host);


    // Opera has no clipboard events
    if (!('oncut' in text) || !('oncopy' in text) || !('onpaste' in text)) {
        event.addListener(parentNode, "keydown", function(e) {
            if ((useragent.isMac && !e.metaKey) || !e.ctrlKey)
                return;

            switch (e.keyCode) {
                case 67:
                    onCopy(e);
                    break;
                case 86:
                    onPaste(e);
                    break;
                case 88:
                    onCut(e);
                    break;
            }
        }, host);
    }


    // COMPOSITION
    var onCompositionStart = function(e) {
        if (inComposition || !host.onCompositionStart || host.$readOnly) 
            return;
        
        inComposition = {};

        if (commandMode)
            return;
        
        if (e.data)
            inComposition.useTextareaForIME = false;
        
        setTimeout(onCompositionUpdate, 0);
        host._signal("compositionStart");
        host.on("mousedown", cancelComposition);
        
        var range = host.getSelectionRange();
        range.end.row = range.start.row;
        range.end.column = range.start.column;
        inComposition.markerRange = range;
        inComposition.selectionStart = lastSelectionStart;
        host.onCompositionStart(inComposition);
        
        if (inComposition.useTextareaForIME) {
            lastValue = text.value = "";
            lastSelectionStart = 0;
            lastSelectionEnd = 0;
        }
        else {
            if (text.msGetInputContext)
                inComposition.context = text.msGetInputContext();
            if (text.getInputContext)
                inComposition.context = text.getInputContext();
        }
    };

    var onCompositionUpdate = function() {
        if (!inComposition || !host.onCompositionUpdate || host.$readOnly)
            return;
        if (commandMode)
            return cancelComposition();
        
        if (inComposition.useTextareaForIME) {
            host.onCompositionUpdate(text.value);
        }
        else {
            var data = text.value;
            sendText(data);
            if (inComposition.markerRange) {
                if (inComposition.context) {
                    inComposition.markerRange.start.column = inComposition.selectionStart
                        = inComposition.context.compositionStartOffset;
                }
                inComposition.markerRange.end.column = inComposition.markerRange.start.column
                    + lastSelectionEnd - inComposition.selectionStart + lastRestoreEnd;
            }
        }
    };

    var onCompositionEnd = function(e) {
        if (!host.onCompositionEnd || host.$readOnly) return;
        inComposition = false;
        host.onCompositionEnd();
        host.off("mousedown", cancelComposition);
        // note that resetting value of textarea at this point doesn't always work
        // because textarea value can be silently restored
        if (e) onInput();
    };
    

    function cancelComposition() {
        // force end composition
        ignoreFocusEvents = true;
        text.blur();
        text.focus();
        ignoreFocusEvents = false;
    }

    var syncComposition = lang.delayedCall(onCompositionUpdate, 50).schedule.bind(null, null);
    
    function onKeyup(e) {
        // workaround for a bug in ie where pressing esc silently moves selection out of textarea
        if (e.keyCode == 27 && text.value.length < text.selectionStart) {
            if (!inComposition)
                lastValue = text.value;
            lastSelectionStart = lastSelectionEnd = -1;
            resetSelection();
        }
        syncComposition();
    }

    event.addListener(text, "compositionstart", onCompositionStart, host);
    event.addListener(text, "compositionupdate", onCompositionUpdate, host);
    event.addListener(text, "keyup", onKeyup, host);
    event.addListener(text, "keydown", syncComposition, host);
    event.addListener(text, "compositionend", onCompositionEnd, host);

    this.getElement = function() {
        return text;
    };
    
    // allows to ignore composition (used by vim keyboard handler in the normal mode)
    // this is useful on mac, where with some keyboard layouts (e.g swedish) ^ starts composition
    this.setCommandMode = function(value) {
        commandMode = value;
        text.readOnly = false;
    };
    
    this.setReadOnly = function(readOnly) {
        if (!commandMode)
            text.readOnly = readOnly;
    };

    this.setCopyWithEmptySelection = function(value) {
    };

    this.onContextMenu = function(e) {
        afterContextMenu = true;
        resetSelection();
        host._emit("nativecontextmenu", {target: host, domEvent: e});
        this.moveToMouse(e, true);
    };
    
    this.moveToMouse = function(e, bringToFront) {
        if (!tempStyle)
            tempStyle = text.style.cssText;
        text.style.cssText = (bringToFront ? "z-index:100000;" : "")
            + (useragent.isIE ? "opacity:0.1;" : "")
            + "text-indent: -" + (lastSelectionStart + lastSelectionEnd) * host.renderer.characterWidth * 0.5 + "px;";

        var rect = host.container.getBoundingClientRect();
        var style = dom.computedStyle(host.container);
        var top = rect.top + (parseInt(style.borderTopWidth) || 0);
        var left = rect.left + (parseInt(rect.borderLeftWidth) || 0);
        var maxTop = rect.bottom - top - text.clientHeight -2;
        var move = function(e) {
            dom.translate(text, e.clientX - left - 2, Math.min(e.clientY - top - 2, maxTop));
        }; 
        move(e);

        if (e.type != "mousedown")
            return;

        host.renderer.$isMousePressed = true;

        clearTimeout(closeTimeout);
        // on windows context menu is opened after mouseup
        if (useragent.isWin)
            event.capture(host.container, move, onContextMenuClose);
    };

    this.onContextMenuClose = onContextMenuClose;
    var closeTimeout;
    function onContextMenuClose() {
        clearTimeout(closeTimeout);
        closeTimeout = setTimeout(function () {
            if (tempStyle) {
                text.style.cssText = tempStyle;
                tempStyle = '';
            }
            host.renderer.$isMousePressed = false;
            if (host.renderer.$keepTextAreaAtCursor)
                host.renderer.$moveTextAreaToCursor();
        }, 0);
    }

    var onContextMenu = function(e) {
        host.textInput.onContextMenu(e);
        onContextMenuClose();
    };
    event.addListener(text, "mouseup", onContextMenu, host);
    event.addListener(text, "mousedown", function(e) {
        e.preventDefault();
        onContextMenuClose();
    }, host);
    event.addListener(host.renderer.scroller, "contextmenu", onContextMenu, host);
    event.addListener(text, "contextmenu", onContextMenu, host);
    
    if (isIOS)
        addIosSelectionHandler(parentNode, host, text);

    function addIosSelectionHandler(parentNode, host, text) {
        var typingResetTimeout = null;
        var typing = false;

        text.addEventListener("keydown", function (e) {
            if (typingResetTimeout) clearTimeout(typingResetTimeout);
            typing = true;
        }, true);

        text.addEventListener("keyup", function (e) {
            typingResetTimeout = setTimeout(function () {
                typing = false;
            }, 100);
        }, true);
    
        // IOS doesn't fire events for arrow keys, but this unique hack changes everything!
        var detectArrowKeys = function(e) {
            if (document.activeElement !== text) return;
            if (typing || inComposition || host.$mouseHandler.isMousePressed) return;

            if (copied) {
                return;
            }
            var selectionStart = text.selectionStart;
            var selectionEnd = text.selectionEnd;
            
            var key = null;
            var modifier = 0;
            // console.log(selectionStart, selectionEnd);
            if (selectionStart == 0) {
                key = KEYS.up;
            } else if (selectionStart == 1) {
                key = KEYS.home;
            } else if (selectionEnd > lastSelectionEnd && lastValue[selectionEnd] == "\n") {
                key = KEYS.end;
            } else if (selectionStart < lastSelectionStart && lastValue[selectionStart - 1] == " ") {
                key = KEYS.left;
                modifier = MODS.option;
            } else if (
                selectionStart < lastSelectionStart
                || (
                    selectionStart == lastSelectionStart 
                    && lastSelectionEnd != lastSelectionStart
                    && selectionStart == selectionEnd
                )
            ) {
                key = KEYS.left;
            } else if (selectionEnd > lastSelectionEnd && lastValue.slice(0, selectionEnd).split("\n").length > 2) {
                key = KEYS.down;
            } else if (selectionEnd > lastSelectionEnd && lastValue[selectionEnd - 1] == " ") {
                key = KEYS.right;
                modifier = MODS.option;
            } else if (
                selectionEnd > lastSelectionEnd
                || (
                    selectionEnd == lastSelectionEnd 
                    && lastSelectionEnd != lastSelectionStart
                    && selectionStart == selectionEnd
                )
            ) {
                key = KEYS.right;
            }
            
            if (selectionStart !== selectionEnd)
                modifier |= MODS.shift;

            if (key) {
                var result = host.onCommandKey({}, modifier, key);
                if (!result && host.commands) {
                    key = KEYS.keyCodeToString(key);
                    var command = host.commands.findKeyCommand(modifier, key);
                    if (command)
                        host.execCommand(command);
                }
                lastSelectionStart = selectionStart;
                lastSelectionEnd = selectionEnd;
                resetSelection("");
            }
        };
        // On iOS, "selectionchange" can only be attached to the document object...
        document.addEventListener("selectionchange", detectArrowKeys);
        host.on("destroy", function() {
            document.removeEventListener("selectionchange", detectArrowKeys);
        });
    }

    this.destroy = function() {
        if (text.parentElement)
            text.parentElement.removeChild(text);
    };
};

exports.k = TextInput;
__webpack_unused_export__ = function(_isMobile, _isIOS) {
    isMobile = _isMobile;
    isIOS = _isIOS;
};


/***/ }),

/***/ 845:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"no use strict";

var oop = __webpack_require__(645);
var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);

var optionsProvider = {
    setOptions: function(optList) {
        Object.keys(optList).forEach(function(key) {
            this.setOption(key, optList[key]);
        }, this);
    },
    getOptions: function(optionNames) {
        var result = {};
        if (!optionNames) {
            var options = this.$options;
            optionNames = Object.keys(options).filter(function(key) {
                return !options[key].hidden;
            });
        } else if (!Array.isArray(optionNames)) {
            result = optionNames;
            optionNames = Object.keys(result);
        }
        optionNames.forEach(function(key) {
            result[key] = this.getOption(key);
        }, this);
        return result;
    },
    setOption: function(name, value) {
        if (this["$" + name] === value)
            return;
        var opt = this.$options[name];
        if (!opt) {
            return warn('misspelled option "' + name + '"');
        }
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].setOption(name, value);

        if (!opt.handlesSet)
            this["$" + name] = value;
        if (opt && opt.set)
            opt.set.call(this, value);
    },
    getOption: function(name) {
        var opt = this.$options[name];
        if (!opt) {
            return warn('misspelled option "' + name + '"');
        }
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].getOption(name);
        return opt && opt.get ? opt.get.call(this) : this["$" + name];
    }
};

function warn(message) {
    if (typeof console != "undefined" && console.warn)
        console.warn.apply(console, arguments);
}

function reportError(msg, data) {
    var e = new Error(msg);
    e.data = data;
    if (typeof console == "object" && console.error)
        console.error(e);
    setTimeout(function() { throw e; });
}

var AppConfig = function() {
    this.$defaultOptions = {};
};

(function() {
    // module loading
    oop.implement(this, EventEmitter);
    /*
     * option {name, value, initialValue, setterName, set, get }
     */
    this.defineOptions = function(obj, path, options) {
        if (!obj.$options)
            this.$defaultOptions[path] = obj.$options = {};

        Object.keys(options).forEach(function(key) {
            var opt = options[key];
            if (typeof opt == "string")
                opt = {forwardTo: opt};

            opt.name || (opt.name = key);
            obj.$options[opt.name] = opt;
            if ("initialValue" in opt)
                obj["$" + opt.name] = opt.initialValue;
        });

        // implement option provider interface
        oop.implement(obj, optionsProvider);

        return this;
    };

    this.resetOptions = function(obj) {
        Object.keys(obj.$options).forEach(function(key) {
            var opt = obj.$options[key];
            if ("value" in opt)
                obj.setOption(key, opt.value);
        });
    };

    this.setDefaultValue = function(path, name, value) {
        if (!path) {
            for (path in this.$defaultOptions)
                if (this.$defaultOptions[path][name])
                    break;
            if (!this.$defaultOptions[path][name])
                return false;
        }
        var opts = this.$defaultOptions[path] || (this.$defaultOptions[path] = {});
        if (opts[name]) {
            if (opts.forwardTo)
                this.setDefaultValue(opts.forwardTo, name, value);
            else
                opts[name].value = value;
        }
    };

    this.setDefaultValues = function(path, optionHash) {
        Object.keys(optionHash).forEach(function(key) {
            this.setDefaultValue(path, key, optionHash[key]);
        }, this);
    };
    
    this.warn = warn;
    this.reportError = reportError;
    
}).call(AppConfig.prototype);

exports.o = AppConfig;


/***/ }),

/***/ 435:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var useragent = __webpack_require__(943); 
var XHTML_NS = "http://www.w3.org/1999/xhtml";

exports.buildDom = function buildDom(arr, parent, refs) {
    if (typeof arr == "string" && arr) {
        var txt = document.createTextNode(arr);
        if (parent)
            parent.appendChild(txt);
        return txt;
    }
    
    if (!Array.isArray(arr)) {
        if (arr && arr.appendChild && parent)
            parent.appendChild(arr);
        return arr;
    }
    if (typeof arr[0] != "string" || !arr[0]) {
        var els = [];
        for (var i = 0; i < arr.length; i++) {
            var ch = buildDom(arr[i], parent, refs);
            ch && els.push(ch);
        }
        return els;
    }
    
    var el = document.createElement(arr[0]);
    var options = arr[1];
    var childIndex = 1;
    if (options && typeof options == "object" && !Array.isArray(options))
        childIndex = 2;
    for (var i = childIndex; i < arr.length; i++)
        buildDom(arr[i], el, refs);
    if (childIndex == 2) {
        Object.keys(options).forEach(function(n) {
            var val = options[n];
            if (n === "class") {
                el.className = Array.isArray(val) ? val.join(" ") : val;
            } else if (typeof val == "function" || n == "value" || n[0] == "$") {
                el[n] = val;
            } else if (n === "ref") {
                if (refs) refs[val] = el;
            } else if (n === "style") {
                if (typeof val == "string") el.style.cssText = val;
            } else if (val != null) {
                el.setAttribute(n, val);
            }
        });
    }
    if (parent)
        parent.appendChild(el);
    return el;
};

exports.getDocumentHead = function(doc) {
    if (!doc)
        doc = document;
    return doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
};

exports.createElement = function(tag, ns) {
    return document.createElementNS ?
            document.createElementNS(ns || XHTML_NS, tag) :
            document.createElement(tag);
};

exports.removeChildren = function(element) {
    element.innerHTML = "";
};

exports.createTextNode = function(textContent, element) {
    var doc = element ? element.ownerDocument : document;
    return doc.createTextNode(textContent);
};

exports.createFragment = function(element) {
    var doc = element ? element.ownerDocument : document;
    return doc.createDocumentFragment();
};

exports.hasCssClass = function(el, name) {
    var classes = (el.className + "").split(/\s+/g);
    return classes.indexOf(name) !== -1;
};

/*
* Add a CSS class to the list of classes on the given node
*/
exports.addCssClass = function(el, name) {
    if (!exports.hasCssClass(el, name)) {
        el.className += " " + name;
    }
};

/*
* Remove a CSS class from the list of classes on the given node
*/
exports.removeCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g);
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        classes.splice(index, 1);
    }
    el.className = classes.join(" ");
};

exports.toggleCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g), add = true;
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        add = false;
        classes.splice(index, 1);
    }
    if (add)
        classes.push(name);

    el.className = classes.join(" ");
    return add;
};


/*
    * Add or remove a CSS class from the list of classes on the given node
    * depending on the value of <tt>include</tt>
    */
exports.setCssClass = function(node, className, include) {
    if (include) {
        exports.addCssClass(node, className);
    } else {
        exports.removeCssClass(node, className);
    }
};

exports.hasCssString = function(id, doc) {
    var index = 0, sheets;
    doc = doc || document;
    if ((sheets = doc.querySelectorAll("style"))) {
        while (index < sheets.length) {
            if (sheets[index++].id === id) {
                return true;
            }
        }
    }
};

exports.removeElementById = function(id, doc) {
    doc = doc || document;
    if(doc.getElementById(id)) {
        doc.getElementById(id).remove();
    }
};

var strictCSP;
var cssCache = [];
exports.useStrictCSP = function(value) {
    strictCSP = value;
    if (value == false) insertPendingStyles();
    else if (!cssCache) cssCache = [];
};

function insertPendingStyles() {
    var cache = cssCache;
    cssCache = null;
    cache && cache.forEach(function(item) {
        importCssString(item[0], item[1]);
    });
}

function importCssString(cssText, id, target) {
    if (typeof document == "undefined")
        return;
    if (cssCache) {
        if (target) {
            insertPendingStyles();
        } else if (target === false) {
            return cssCache.push([cssText, id]);
        }
    }
    if (strictCSP) return;

    var container = target;
    if (!target || !target.getRootNode) {
        container = document;
    } else {
        container = target.getRootNode();
        if (!container || container == target)
            container = document;
    }
    
    var doc = container.ownerDocument || container;
    
    // If style is already imported return immediately.
    if (id && exports.hasCssString(id, container))
        return null;
    
    if (id)
        cssText += "\n/*# sourceURL=ace/css/" + id + " */";
    
    var style = exports.createElement("style");
    style.appendChild(doc.createTextNode(cssText));
    if (id)
        style.id = id;

    if (container == doc)
        container = exports.getDocumentHead(doc);
    container.insertBefore(style, container.firstChild);
}
exports.importCssString = importCssString;

exports.importCssStylsheet = function(uri, doc) {
    exports.buildDom(["link", {rel: "stylesheet", href: uri}], exports.getDocumentHead(doc));
};
exports.scrollbarWidth = function(doc) {
    var inner = exports.createElement("ace_inner");
    inner.style.width = "100%";
    inner.style.minWidth = "0px";
    inner.style.height = "200px";
    inner.style.display = "block";

    var outer = exports.createElement("ace_outer");
    var style = outer.style;

    style.position = "absolute";
    style.left = "-10000px";
    style.overflow = "hidden";
    style.width = "200px";
    style.minWidth = "0px";
    style.height = "150px";
    style.display = "block";

    outer.appendChild(inner);

    var body = (doc && doc.documentElement) || (document && document.documentElement);
    if (!body) return 0;

    body.appendChild(outer);

    var noScrollbar = inner.offsetWidth;

    style.overflow = "scroll";
    var withScrollbar = inner.offsetWidth;

    if (noScrollbar === withScrollbar) {
        withScrollbar = outer.clientWidth;
    }

    body.removeChild(outer);

    return noScrollbar - withScrollbar;
};

exports.computedStyle = function(element, style) {
    return window.getComputedStyle(element, "") || {};
};

exports.setStyle = function(styles, property, value) {
    if (styles[property] !== value) {
        //console.log("set style", property, styles[property], value);
        styles[property] = value;
    }
};

exports.HAS_CSS_ANIMATION = false;
exports.HAS_CSS_TRANSFORMS = false;
exports.HI_DPI = useragent.isWin
    ? typeof window !== "undefined" && window.devicePixelRatio >= 1.5
    : true;

if (useragent.isChromeOS) exports.HI_DPI = false;

if (typeof document !== "undefined") {
    // detect CSS transformation support
    var div = document.createElement("div");
    if (exports.HI_DPI && div.style.transform  !== undefined)
        exports.HAS_CSS_TRANSFORMS = true;
    if (!useragent.isEdge && typeof div.style.animationName !== "undefined")
        exports.HAS_CSS_ANIMATION = true;
    div = null;
}

if (exports.HAS_CSS_TRANSFORMS) {
    exports.translate = function(element, tx, ty) {
        element.style.transform = "translate(" + Math.round(tx) + "px, " + Math.round(ty) +"px)";
    };
} else {
    exports.translate = function(element, tx, ty) {
        element.style.top = Math.round(ty) + "px";
        element.style.left = Math.round(tx) + "px";
    };
}


/***/ }),

/***/ 631:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var keys = __webpack_require__(451);
var useragent = __webpack_require__(943);

var pressedKeys = null;
var ts = 0;

var activeListenerOptions;
function detectListenerOptionsSupport() {
    activeListenerOptions = false;
    try {
        document.createComment("").addEventListener("test", function() {}, { 
            get passive() { 
                activeListenerOptions = {passive: false};
            }
        });
    } catch(e) {}
}

function getListenerOptions() {
    if (activeListenerOptions == undefined)
        detectListenerOptionsSupport();
    return activeListenerOptions;
}

function EventListener(elem, type, callback) {
    this.elem = elem;
    this.type = type;
    this.callback = callback;
}
EventListener.prototype.destroy = function() {
    removeListener(this.elem, this.type, this.callback);
    this.elem = this.type = this.callback = undefined;
};

var addListener = exports.addListener = function(elem, type, callback, destroyer) {
    elem.addEventListener(type, callback, getListenerOptions());
    if (destroyer)
        destroyer.$toDestroy.push(new EventListener(elem, type, callback));
};

var removeListener = exports.removeListener = function(elem, type, callback) {
    elem.removeEventListener(type, callback, getListenerOptions());
};

/*
* Prevents propagation and clobbers the default action of the passed event
*/
exports.stopEvent = function(e) {
    exports.stopPropagation(e);
    exports.preventDefault(e);
    return false;
};

exports.stopPropagation = function(e) {
    if (e.stopPropagation)
        e.stopPropagation();
};

exports.preventDefault = function(e) {
    if (e.preventDefault)
        e.preventDefault();
};

/*
 * @return {Number} 0 for left button, 1 for middle button, 2 for right button
 */
exports.getButton = function(e) {
    if (e.type == "dblclick")
        return 0;
    if (e.type == "contextmenu" || (useragent.isMac && (e.ctrlKey && !e.altKey && !e.shiftKey)))
        return 2;

    // DOM Event
    return e.button;
};

exports.capture = function(el, eventHandler, releaseCaptureHandler) {
    var ownerDocument = el && el.ownerDocument || document;
    function onMouseUp(e) {
        eventHandler && eventHandler(e);
        releaseCaptureHandler && releaseCaptureHandler(e);

        removeListener(ownerDocument, "mousemove", eventHandler);
        removeListener(ownerDocument, "mouseup", onMouseUp);
        removeListener(ownerDocument, "dragstart", onMouseUp);
    }

    addListener(ownerDocument, "mousemove", eventHandler);
    addListener(ownerDocument, "mouseup", onMouseUp);
    addListener(ownerDocument, "dragstart", onMouseUp);
    
    return onMouseUp;
};

exports.addMouseWheelListener = function(el, callback, destroyer) {
    addListener(el, "wheel",  function(e) {
        var factor = 0.15;
        // workaround for firefox changing deltaMode based on which property is accessed first
        var deltaX = e.deltaX || 0;
        var deltaY = e.deltaY || 0;
        switch (e.deltaMode) {
            case e.DOM_DELTA_PIXEL:
                e.wheelX = deltaX * factor;
                e.wheelY = deltaY * factor;
                break;
            case e.DOM_DELTA_LINE:
                var linePixels = 15;
                e.wheelX = deltaX * linePixels;
                e.wheelY = deltaY * linePixels;
                break;
            case e.DOM_DELTA_PAGE:
                var pagePixels = 150;
                e.wheelX = deltaX * pagePixels;
                e.wheelY = deltaY * pagePixels;
                break;
        }
        callback(e);
    }, destroyer);
};

exports.addMultiMouseDownListener = function(elements, timeouts, eventHandler, callbackName, destroyer) {
    var clicks = 0;
    var startX, startY, timer; 
    var eventNames = {
        2: "dblclick",
        3: "tripleclick",
        4: "quadclick"
    };

    function onMousedown(e) {
        if (exports.getButton(e) !== 0) {
            clicks = 0;
        } else if (e.detail > 1) {
            clicks++;
            if (clicks > 4)
                clicks = 1;
        } else {
            clicks = 1;
        }
        if (useragent.isIE) {
            var isNewClick = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;
            if (!timer || isNewClick)
                clicks = 1;
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(function() {timer = null;}, timeouts[clicks - 1] || 600);

            if (clicks == 1) {
                startX = e.clientX;
                startY = e.clientY;
            }
        }
        
        e._clicks = clicks;

        eventHandler[callbackName]("mousedown", e);

        if (clicks > 4)
            clicks = 0;
        else if (clicks > 1)
            return eventHandler[callbackName](eventNames[clicks], e);
    }
    if (!Array.isArray(elements))
        elements = [elements];
    elements.forEach(function(el) {
        addListener(el, "mousedown", onMousedown, destroyer);
    });
};

var getModifierHash = function(e) {
    return 0 | (e.ctrlKey ? 1 : 0) | (e.altKey ? 2 : 0) | (e.shiftKey ? 4 : 0) | (e.metaKey ? 8 : 0);
};

exports.getModifierString = function(e) {
    return keys.KEY_MODS[getModifierHash(e)];
};

function normalizeCommandKeys(callback, e, keyCode) {
    var hashId = getModifierHash(e);

    if (!useragent.isMac && pressedKeys) {
        if (e.getModifierState && (e.getModifierState("OS") || e.getModifierState("Win")))
            hashId |= 8;
        if (pressedKeys.altGr) {
            if ((3 & hashId) != 3)
                pressedKeys.altGr = 0;
            else
                return;
        }
        if (keyCode === 18 || keyCode === 17) {
            var location = "location" in e ? e.location : e.keyLocation;
            if (keyCode === 17 && location === 1) {
                if (pressedKeys[keyCode] == 1)
                    ts = e.timeStamp;
            } else if (keyCode === 18 && hashId === 3 && location === 2) {
                var dt = e.timeStamp - ts;
                if (dt < 50)
                    pressedKeys.altGr = true;
            }
        }
    }
    
    if (keyCode in keys.MODIFIER_KEYS) {
        keyCode = -1;
    }
    
    if (!hashId && keyCode === 13) {
        var location = "location" in e ? e.location : e.keyLocation;
        if (location === 3) {
            callback(e, hashId, -keyCode);
            if (e.defaultPrevented)
                return;
        }
    }
    
    if (useragent.isChromeOS && hashId & 8) {
        callback(e, hashId, keyCode);
        if (e.defaultPrevented)
            return;
        else
            hashId &= ~8;
    }

    // If there is no hashId and the keyCode is not a function key, then
    // we don't call the callback as we don't handle a command key here
    // (it's a normal key/character input).
    if (!hashId && !(keyCode in keys.FUNCTION_KEYS) && !(keyCode in keys.PRINTABLE_KEYS)) {
        return false;
    }
    
    return callback(e, hashId, keyCode);
}


exports.addCommandKeyListener = function(el, callback, destroyer) {
    if (useragent.isOldGecko || (useragent.isOpera && !("KeyboardEvent" in window))) {
        // Old versions of Gecko aka. Firefox < 4.0 didn't repeat the keydown
        // event if the user pressed the key for a longer time. Instead, the
        // keydown event was fired once and later on only the keypress event.
        // To emulate the 'right' keydown behavior, the keyCode of the initial
        // keyDown event is stored and in the following keypress events the
        // stores keyCode is used to emulate a keyDown event.
        var lastKeyDownKeyCode = null;
        addListener(el, "keydown", function(e) {
            lastKeyDownKeyCode = e.keyCode;
        }, destroyer);
        addListener(el, "keypress", function(e) {
            return normalizeCommandKeys(callback, e, lastKeyDownKeyCode);
        }, destroyer);
    } else {
        var lastDefaultPrevented = null;

        addListener(el, "keydown", function(e) {
            pressedKeys[e.keyCode] = (pressedKeys[e.keyCode] || 0) + 1;
            var result = normalizeCommandKeys(callback, e, e.keyCode);
            lastDefaultPrevented = e.defaultPrevented;
            return result;
        }, destroyer);

        addListener(el, "keypress", function(e) {
            if (lastDefaultPrevented && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey)) {
                exports.stopEvent(e);
                lastDefaultPrevented = null;
            }
        }, destroyer);

        addListener(el, "keyup", function(e) {
            pressedKeys[e.keyCode] = null;
        }, destroyer);

        if (!pressedKeys) {
            resetPressedKeys();
            addListener(window, "focus", resetPressedKeys);
        }
    }
};
function resetPressedKeys() {
    pressedKeys = Object.create(null);
}

if (typeof window == "object" && window.postMessage && !useragent.isOldIE) {
    var postMessageId = 1;
    exports.nextTick = function(callback, win) {
        win = win || window;
        var messageName = "zero-timeout-message-" + (postMessageId++);
        
        var listener = function(e) {
            if (e.data == messageName) {
                exports.stopPropagation(e);
                removeListener(win, "message", listener);
                callback();
            }
        };
        
        addListener(win, "message", listener);
        win.postMessage(messageName, "*");
    };
}

exports.$idleBlocked = false;
exports.onIdle = function(cb, timeout) {
    return setTimeout(function handler() {
        if (!exports.$idleBlocked) {
            cb();
        } else {
            setTimeout(handler, 100);
        }
    }, timeout);
};

exports.$idleBlockId = null;
exports.blockIdle = function(delay) {
    if (exports.$idleBlockId)
        clearTimeout(exports.$idleBlockId);
        
    exports.$idleBlocked = true;
    exports.$idleBlockId = setTimeout(function() {
        exports.$idleBlocked = false;
    }, delay || 100);
};

exports.nextFrame = typeof window == "object" && (window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || window.oRequestAnimationFrame);

if (exports.nextFrame)
    exports.nextFrame = exports.nextFrame.bind(window);
else
    exports.nextFrame = function(callback) {
        setTimeout(callback, 17);
    };


/***/ }),

/***/ 366:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


var EventEmitter = {};
var stopPropagation = function() { this.propagationStopped = true; };
var preventDefault = function() { this.defaultPrevented = true; };

EventEmitter._emit =
EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry || (this._eventRegistry = {});
    this._defaultHandlers || (this._defaultHandlers = {});

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler)
        return;

    if (typeof e != "object" || !e)
        e = {};

    if (!e.type)
        e.type = eventName;
    if (!e.stopPropagation)
        e.stopPropagation = stopPropagation;
    if (!e.preventDefault)
        e.preventDefault = preventDefault;

    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++) {
        listeners[i](e, this);
        if (e.propagationStopped)
            break;
    }
    
    if (defaultHandler && !e.defaultPrevented)
        return defaultHandler(e, this);
};


EventEmitter._signal = function(eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners)
        return;
    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++)
        listeners[i](e, this);
};

EventEmitter.once = function(eventName, callback) {
    var _self = this;
    this.on(eventName, function newCallback() {
        _self.off(eventName, newCallback);
        callback.apply(null, arguments);
    });
    if (!callback) {
        /*global Promise*/
        return new Promise(function(resolve) {
            callback = resolve;
        });
    }
};


EventEmitter.setDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers;
    if (!handlers)
        handlers = this._defaultHandlers = {_disabled_: {}};
    
    if (handlers[eventName]) {
        var old = handlers[eventName];
        var disabled = handlers._disabled_[eventName];
        if (!disabled)
            handlers._disabled_[eventName] = disabled = [];
        disabled.push(old);
        var i = disabled.indexOf(callback);
        if (i != -1) 
            disabled.splice(i, 1);
    }
    handlers[eventName] = callback;
};
EventEmitter.removeDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers;
    if (!handlers)
        return;
    var disabled = handlers._disabled_[eventName];
    
    if (handlers[eventName] == callback) {
        if (disabled)
            this.setDefaultHandler(eventName, disabled.pop());
    } else if (disabled) {
        var i = disabled.indexOf(callback);
        if (i != -1)
            disabled.splice(i, 1);
    }
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback, capturing) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1)
        listeners[capturing ? "unshift" : "push"](callback);
    return callback;
};

EventEmitter.off =
EventEmitter.removeListener =
EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        return;

    var index = listeners.indexOf(callback);
    if (index !== -1)
        listeners.splice(index, 1);
};

EventEmitter.removeAllListeners = function(eventName) {
    if (!eventName) this._eventRegistry = this._defaultHandlers = undefined;
    if (this._eventRegistry) this._eventRegistry[eventName] = undefined;
    if (this._defaultHandlers) this._defaultHandlers[eventName] = undefined;
};

exports.b = EventEmitter;


/***/ }),

/***/ 451:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*! @license
==========================================================================
SproutCore -- JavaScript Application Framework
copyright 2006-2009, Sprout Systems Inc., Apple Inc. and contributors.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

SproutCore and the SproutCore logo are trademarks of Sprout Systems, Inc.

For more information about SproutCore, visit http://www.sproutcore.com


==========================================================================
@license */

// Most of the following code is taken from SproutCore with a few changes.



var oop = __webpack_require__(645);

/*
 * Helper functions and hashes for key handling.
 */
var Keys = (function() {
    var ret = {
        MODIFIER_KEYS: {
            16: 'Shift', 17: 'Ctrl', 18: 'Alt', 224: 'Meta',
            91: 'MetaLeft', 92: 'MetaRight', 93: 'ContextMenu'
        },

        KEY_MODS: {
            "ctrl": 1, "alt": 2, "option" : 2, "shift": 4,
            "super": 8, "meta": 8, "command": 8, "cmd": 8, 
            "control": 1
        },

        FUNCTION_KEYS : {
            8  : "Backspace",
            9  : "Tab",
            13 : "Return",
            19 : "Pause",
            27 : "Esc",
            32 : "Space",
            33 : "PageUp",
            34 : "PageDown",
            35 : "End",
            36 : "Home",
            37 : "Left",
            38 : "Up",
            39 : "Right",
            40 : "Down",
            44 : "Print",
            45 : "Insert",
            46 : "Delete",
            96 : "Numpad0",
            97 : "Numpad1",
            98 : "Numpad2",
            99 : "Numpad3",
            100: "Numpad4",
            101: "Numpad5",
            102: "Numpad6",
            103: "Numpad7",
            104: "Numpad8",
            105: "Numpad9",
            '-13': "NumpadEnter",
            112: "F1",
            113: "F2",
            114: "F3",
            115: "F4",
            116: "F5",
            117: "F6",
            118: "F7",
            119: "F8",
            120: "F9",
            121: "F10",
            122: "F11",
            123: "F12",
            144: "Numlock",
            145: "Scrolllock"
        },

        PRINTABLE_KEYS: {
           32: ' ',  48: '0',  49: '1',  50: '2',  51: '3',  52: '4', 53:  '5',
           54: '6',  55: '7',  56: '8',  57: '9',  59: ';',  61: '=', 65:  'a',
           66: 'b',  67: 'c',  68: 'd',  69: 'e',  70: 'f',  71: 'g', 72:  'h',
           73: 'i',  74: 'j',  75: 'k',  76: 'l',  77: 'm',  78: 'n', 79:  'o',
           80: 'p',  81: 'q',  82: 'r',  83: 's',  84: 't',  85: 'u', 86:  'v',
           87: 'w',  88: 'x',  89: 'y',  90: 'z', 107: '+', 109: '-', 110: '.',
          186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`',
          219: '[', 220: '\\',221: ']', 222: "'", 111: '/', 106: '*'
        }
    };

    // workaround for firefox bug
    ret.PRINTABLE_KEYS[173] = '-';

    // A reverse map of FUNCTION_KEYS
    var name, i;
    for (i in ret.FUNCTION_KEYS) {
        name = ret.FUNCTION_KEYS[i].toLowerCase();
        ret[name] = parseInt(i, 10);
    }

    // A reverse map of PRINTABLE_KEYS
    for (i in ret.PRINTABLE_KEYS) {
        name = ret.PRINTABLE_KEYS[i].toLowerCase();
        ret[name] = parseInt(i, 10);
    }

    // Add the MODIFIER_KEYS, FUNCTION_KEYS and PRINTABLE_KEYS to the KEY
    // variables as well.
    oop.mixin(ret, ret.MODIFIER_KEYS);
    oop.mixin(ret, ret.PRINTABLE_KEYS);
    oop.mixin(ret, ret.FUNCTION_KEYS);

    // aliases
    ret.enter = ret["return"];
    ret.escape = ret.esc;
    ret.del = ret["delete"];
    
    (function() {
        var mods = ["cmd", "ctrl", "alt", "shift"];
        for (var i = Math.pow(2, mods.length); i--;) {            
            ret.KEY_MODS[i] = mods.filter(function(x) {
                return i & ret.KEY_MODS[x];
            }).join("-") + "-";
        }
    })();

    ret.KEY_MODS[0] = "";
    ret.KEY_MODS[-1] = "input-";

    return ret;
})();
oop.mixin(exports, Keys);

exports.keyCodeToString = function(keyCode) {
    // Language-switching keystroke in Chrome/Linux emits keyCode 0.
    var keyString = Keys[keyCode];
    if (typeof keyString != "string")
        keyString = String.fromCharCode(keyCode);
    return keyString.toLowerCase();
};


/***/ }),

/***/ 955:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.last = function(a) {
    return a[a.length - 1];
};

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject(array[i]);
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function deepCopy(obj) {
    if (typeof obj !== "object" || !obj)
        return obj;
    var copy;
    if (Array.isArray(obj)) {
        copy = [];
        for (var key = 0; key < obj.length; key++) {
            copy[key] = deepCopy(obj[key]);
        }
        return copy;
    }
    if (Object.prototype.toString.call(obj) !== "[object Object]")
        return obj;
    
    copy = {};
    for (var key in obj)
        copy[key] = deepCopy(obj[key]);
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};

/*
 * splice out of 'array' anything that === 'value'
 */
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.escapeHTML = function(str) {
    return ("" + str).replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
    });

    return matches;
};

/* deprecated */
exports.deferredCall = function(fcn) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };
    
    deferred.isPending = function() {
        return timer;
    };

    return deferred;
};


exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var _self = function(timeout) {
        if (timer == null)
            timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function(timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function() {
        this.cancel();
        fcn();
    };

    _self.cancel = function() {
        timer && clearTimeout(timer);
        timer = null;
    };

    _self.isPending = function() {
        return timer;
    };

    return _self;
};


/***/ }),

/***/ 552:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*
 * based on code from:
 *
 * @license RequireJS text 0.25.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */


var dom = __webpack_require__(435);

exports.get = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
};

exports.loadScript = function(path, callback) {
    var head = dom.getDocumentHead();
    var s = document.createElement('script');

    s.src = path;
    head.appendChild(s);

    s.onload = s.onreadystatechange = function(_, isAbort) {
        if (isAbort || !s.readyState || s.readyState == "loaded" || s.readyState == "complete") {
            s = s.onload = s.onreadystatechange = null;
            if (!isAbort)
                callback();
        }
    };
};

/*
 * Convert a url into a fully qualified absolute URL
 * This function does not work in IE6
 */
exports.qualifyURL = function(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
};


/***/ }),

/***/ 645:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
    return obj;
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};


/***/ }),

/***/ 943:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/*
 * I hate doing this, but we need some way to determine if the user is on a Mac
 * The reason is that users have different expectations of their key combinations.
 *
 * Take copy as an example, Mac people expect to use CMD or APPLE + C
 * Windows folks expect to use CTRL + C
 */
exports.OS = {
    LINUX: "LINUX",
    MAC: "MAC",
    WINDOWS: "WINDOWS"
};

/*
 * Return an exports.OS constant
 */
exports.getOS = function() {
    if (exports.isMac) {
        return exports.OS.MAC;
    } else if (exports.isLinux) {
        return exports.OS.LINUX;
    } else {
        return exports.OS.WINDOWS;
    }
};

// this can be called in non browser environments (e.g. from ace/requirejs/text)
var _navigator = typeof navigator == "object" ? navigator : {};

var os = (/mac|win|linux/i.exec(_navigator.platform) || ["other"])[0].toLowerCase();
var ua = _navigator.userAgent || "";
var appName = _navigator.appName || "";

// Is the user using a browser that identifies itself as Windows
exports.isWin = (os == "win");

// Is the user using a browser that identifies itself as Mac OS
exports.isMac = (os == "mac");

// Is the user using a browser that identifies itself as Linux
exports.isLinux = (os == "linux");

// Windows Store JavaScript apps (aka Metro apps written in HTML5 and JavaScript) do not use the "Microsoft Internet Explorer" string in their user agent, but "MSAppHost" instead.
exports.isIE = 
    (appName == "Microsoft Internet Explorer" || appName.indexOf("MSAppHost") >= 0)
    ? parseFloat((ua.match(/(?:MSIE |Trident\/[0-9]+[\.0-9]+;.*rv:)([0-9]+[\.0-9]+)/)||[])[1])
    : parseFloat((ua.match(/(?:Trident\/[0-9]+[\.0-9]+;.*rv:)([0-9]+[\.0-9]+)/)||[])[1]); // for ie
    
exports.isOldIE = exports.isIE && exports.isIE < 9;

// Is this Firefox or related?
exports.isGecko = exports.isMozilla = ua.match(/ Gecko\/\d+/);

// Is this Opera 
exports.isOpera = typeof opera == "object" && Object.prototype.toString.call(window.opera) == "[object Opera]";

// Is the user using a browser that identifies itself as WebKit 
exports.isWebKit = parseFloat(ua.split("WebKit/")[1]) || undefined;

exports.isChrome = parseFloat(ua.split(" Chrome/")[1]) || undefined;

exports.isEdge = parseFloat(ua.split(" Edge/")[1]) || undefined;

exports.isAIR = ua.indexOf("AdobeAIR") >= 0;

exports.isAndroid = ua.indexOf("Android") >= 0;

exports.isChromeOS = ua.indexOf(" CrOS ") >= 0;

exports.isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

if (exports.isIOS) exports.isMac = true;

exports.isMobile = exports.isIOS || exports.isAndroid;


/***/ }),

/***/ 481:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var event = __webpack_require__(631);

/** 
 *
 *
 * Batches changes (that force something to be redrawn) in the background.
 * @class RenderLoop
 **/


var RenderLoop = function(onRender, win) {
    this.onRender = onRender;
    this.pending = false;
    this.changes = 0;
    this.$recursionLimit = 2;
    this.window = win || window;
    var _self = this;
    this._flush = function(ts) {
        _self.pending = false;
        var changes = _self.changes;

        if (changes) {
            event.blockIdle(100);
            _self.changes = 0;
            _self.onRender(changes);
        }
        
        if (_self.changes) {
            if (_self.$recursionLimit-- < 0) return;
            _self.schedule();
        } else {
            _self.$recursionLimit = 2;
        }
    };
};

(function() {

    this.schedule = function(change) {
        this.changes = this.changes | change;
        if (this.changes && !this.pending) {
            event.nextFrame(this._flush);
            this.pending = true;
        }
    };

    this.clear = function(change) {
        var changes = this.changes;
        this.changes = 0;
        return changes;
    };

}).call(RenderLoop.prototype);

exports.x = RenderLoop;


/***/ }),

/***/ 745:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;


var oop = __webpack_require__(645);
var dom = __webpack_require__(435);
var event = __webpack_require__(631);
var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);
// on ie maximal element height is smaller than what we get from 4-5K line document
// so scrollbar doesn't work, as a workaround we do not set height higher than MAX_SCROLL_H
// and rescale scrolltop
var MAX_SCROLL_H = 0x8000;

/**
 * An abstract class representing a native scrollbar control.
 * @class ScrollBar
 **/

/**
 * Creates a new `ScrollBar`. `parent` is the owner of the scroll bar.
 * @param {Element} parent A DOM element
 *
 * @constructor
 **/
var ScrollBar = function(parent) {
    this.element = dom.createElement("div");
    this.element.className = "ace_scrollbar ace_scrollbar" + this.classSuffix;

    this.inner = dom.createElement("div");
    this.inner.className = "ace_scrollbar-inner";
    // on safari scrollbar is not shown for empty elements
    this.inner.textContent = "\xa0";
    this.element.appendChild(this.inner);

    parent.appendChild(this.element);

    this.setVisible(false);
    this.skipEvent = false;

    event.addListener(this.element, "scroll", this.onScroll.bind(this));
    event.addListener(this.element, "mousedown", event.preventDefault);
};

(function() {
    oop.implement(this, EventEmitter);

    this.setVisible = function(isVisible) {
        this.element.style.display = isVisible ? "" : "none";
        this.isVisible = isVisible;
        this.coeff = 1;
    };
}).call(ScrollBar.prototype);

/**
 * Represents a vertical scroll bar.
 * @class VScrollBar
 **/

/**
 * Creates a new `VScrollBar`. `parent` is the owner of the scroll bar.
 * @param {Element} parent A DOM element
 * @param {Object} renderer An editor renderer
 *
 * @constructor
 **/
var VScrollBar = function(parent, renderer) {
    ScrollBar.call(this, parent);
    this.scrollTop = 0;
    this.scrollHeight = 0;

    // in OSX lion the scrollbars appear to have no width. In this case resize the
    // element to show the scrollbar but still pretend that the scrollbar has a width
    // of 0px
    // in Firefox 6+ scrollbar is hidden if element has the same width as scrollbar
    // make element a little bit wider to retain scrollbar when page is zoomed 
    renderer.$scrollbarWidth = 
    this.width = dom.scrollbarWidth(parent.ownerDocument);
    this.inner.style.width =
    this.element.style.width = (this.width || 15) + 5 + "px";
    this.$minWidth = 0;
};

oop.inherits(VScrollBar, ScrollBar);

(function() {

    this.classSuffix = '-v';

    /**
     * Emitted when the scroll bar, well, scrolls.
     * @event scroll
     * @param {Object} e Contains one property, `"data"`, which indicates the current scroll top position
     **/
    this.onScroll = function() {
        if (!this.skipEvent) {
            this.scrollTop = this.element.scrollTop;
            if (this.coeff != 1) {
                var h = this.element.clientHeight / this.scrollHeight;
                this.scrollTop = this.scrollTop * (1 - h) / (this.coeff - h);
            }
            this._emit("scroll", {data: this.scrollTop});
        }
        this.skipEvent = false;
    };

    /**
     * Returns the width of the scroll bar.
     * @returns {Number}
     **/
    this.getWidth = function() {
        return Math.max(this.isVisible ? this.width : 0, this.$minWidth || 0);
    };

    /**
     * Sets the height of the scroll bar, in pixels.
     * @param {Number} height The new height
     **/
    this.setHeight = function(height) {
        this.element.style.height = height + "px";
    };

    /**
     * Sets the inner height of the scroll bar, in pixels.
     * @param {Number} height The new inner height
     * @deprecated Use setScrollHeight instead
     **/
    this.setInnerHeight = 
    /**
     * Sets the scroll height of the scroll bar, in pixels.
     * @param {Number} height The new scroll height
     **/
    this.setScrollHeight = function(height) {
        this.scrollHeight = height;
        if (height > MAX_SCROLL_H) {
            this.coeff = MAX_SCROLL_H / height;
            height = MAX_SCROLL_H;
        } else if (this.coeff != 1) {
            this.coeff = 1;
        }
        this.inner.style.height = height + "px";
    };

    /**
     * Sets the scroll top of the scroll bar.
     * @param {Number} scrollTop The new scroll top
     **/
    this.setScrollTop = function(scrollTop) {
        // on chrome 17+ for small zoom levels after calling this function
        // this.element.scrollTop != scrollTop which makes page to scroll up.
        if (this.scrollTop != scrollTop) {
            this.skipEvent = true;
            this.scrollTop = scrollTop;
            this.element.scrollTop = scrollTop * this.coeff;
        }
    };

}).call(VScrollBar.prototype);

/**
 * Represents a horisontal scroll bar.
 * @class HScrollBar
 **/

/**
 * Creates a new `HScrollBar`. `parent` is the owner of the scroll bar.
 * @param {Element} parent A DOM element
 * @param {Object} renderer An editor renderer
 *
 * @constructor
 **/
var HScrollBar = function(parent, renderer) {
    ScrollBar.call(this, parent);
    this.scrollLeft = 0;

    // in OSX lion the scrollbars appear to have no width. In this case resize the
    // element to show the scrollbar but still pretend that the scrollbar has a width
    // of 0px
    // in Firefox 6+ scrollbar is hidden if element has the same width as scrollbar
    // make element a little bit wider to retain scrollbar when page is zoomed 
    this.height = renderer.$scrollbarWidth;
    this.inner.style.height =
    this.element.style.height = (this.height || 15) + 5 + "px";
};

oop.inherits(HScrollBar, ScrollBar);

(function() {

    this.classSuffix = '-h';

    /**
     * Emitted when the scroll bar, well, scrolls.
     * @event scroll
     * @param {Object} e Contains one property, `"data"`, which indicates the current scroll left position
     **/
    this.onScroll = function() {
        if (!this.skipEvent) {
            this.scrollLeft = this.element.scrollLeft;
            this._emit("scroll", {data: this.scrollLeft});
        }
        this.skipEvent = false;
    };

    /**
     * Returns the height of the scroll bar.
     * @returns {Number}
     **/
    this.getHeight = function() {
        return this.isVisible ? this.height : 0;
    };

    /**
     * Sets the width of the scroll bar, in pixels.
     * @param {Number} width The new width
     **/
    this.setWidth = function(width) {
        this.element.style.width = width + "px";
    };

    /**
     * Sets the inner width of the scroll bar, in pixels.
     * @param {Number} width The new inner width
     * @deprecated Use setScrollWidth instead
     **/
    this.setInnerWidth = function(width) {
        this.inner.style.width = width + "px";
    };

    /**
     * Sets the scroll width of the scroll bar, in pixels.
     * @param {Number} width The new scroll width
     **/
    this.setScrollWidth = function(width) {
        this.inner.style.width = width + "px";
    };

    /**
     * Sets the scroll left of the scroll bar.
     * @param {Number} scrollLeft The new scroll left
     **/
    this.setScrollLeft = function(scrollLeft) {
        // on chrome 17+ for small zoom levels after calling this function
        // this.element.scrollTop != scrollTop which makes page to scroll up.
        if (this.scrollLeft != scrollLeft) {
            this.skipEvent = true;
            this.scrollLeft = this.element.scrollLeft = scrollLeft;
        }
    };

}).call(HScrollBar.prototype);


__webpack_unused_export__ = VScrollBar; // backward compatibility
exports.lc = VScrollBar; // backward compatibility
exports.zy = HScrollBar; // backward compatibility

__webpack_unused_export__ = VScrollBar;
__webpack_unused_export__ = HScrollBar;


/***/ }),

/***/ 677:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    function bindKey(win, mac) {
        return {
            win: win,
            mac: mac
        };
    }
    exports.commands = [
        {
            name: "selectAll",
            bindKey: bindKey("Ctrl-A", "Command-A"),
            exec: function(editor) {
                editor.selectAll();
            }
        },
        {
            name: "centerselection",
            bindKey: bindKey(null, "Ctrl-L"),
            exec: function(editor) {
                editor.centerSelection();
            }
        },
        {
            name: "closeOrlevelUp",
            bindKey: bindKey("Left", "Left|Ctrl-B"),
            exec: function(editor) {
                editor.navigateLevelUp(true);
            }
        },
        ,
        {
            name: "levelUp",
            bindKey: bindKey("Shift-Left", "Shift-Left|Ctrl-B"),
            exec: function(editor) {
                editor.navigateLevelUp();
            }
        },
        {
            name: "levelDown",
            bindKey: bindKey("Right", "Right|Ctrl-F"),
            exec: function(editor) {
                editor.navigateLevelDown();
            }
        },
        {
            name: "goToStart",
            editorKey: bindKey("Ctrl-Home", "Ctrl-Home"),
            bindKey: bindKey("Home|Ctrl-Home", "Home|Ctrl-Home"),
            exec: function(editor) {
                editor.navigateStart();
            }
        },
        {
            name: "goToEnd",
            editorKey: bindKey("Ctrl-End", "Ctrl-End"),
            bindKey: bindKey("End|Ctrl-End", "End|Ctrl-End"),
            exec: function(editor) {
                editor.navigateEnd();
            }
        },
        {
            name: "closeAllFromSelected",
            bindKey: bindKey("Ctrl-Left", "Ctrl-Left"),
            exec: function(ed) {
                ed.provider.close(ed.selection.getCursor(), true);
            }
        },
        {
            name: "openAllFromSelected",
            bindKey: bindKey("Ctrl-Right", "Ctrl-Right"),
            exec: function(ed) {
                ed.provider.open(ed.selection.getCursor(), true);
            }
        },
        {
            name: "pageup",
            bindKey: "Option-PageUp",
            exec: function(editor) {
                editor.scrollPageUp();
            }
        },
        {
            name: "gotopageup",
            bindKey: "PageUp",
            exec: function(editor) {
                editor.gotoPageUp();
            }
        },
        {
            name: "pagedown",
            bindKey: "Option-PageDown",
            exec: function(editor) {
                editor.scrollPageDown();
            }
        },
        {
            name: "gotopageDown",
            bindKey: "PageDown",
            exec: function(editor) {
                editor.gotoPageDown();
            }
        },
        {
            name: "scrollup",
            bindKey: bindKey("Ctrl-Up", null),
            exec: function(e) {
                e.renderer.scrollBy(0, -2 * e.renderer.layerConfig.lineHeight);
            }
        },
        {
            name: "scrolldown",
            bindKey: bindKey("Ctrl-Down", null),
            exec: function(e) {
                e.renderer.scrollBy(0, 2 * e.renderer.layerConfig.lineHeight);
            }
        },
        {
            name: "insertstring",
            exec: function(e, args) {
                e.insertSting(args);
            }
        },
        {
            name: "goUp",
            bindKey: bindKey("Up", "Up|Ctrl-P"),
            exec: function(editor) {
                editor.selection.moveSelection(-1);
            }
        },
        {
            name: "goDown",
            bindKey: bindKey("Down", "Down|Ctrl-N"),
            exec: function(editor) {
                editor.selection.moveSelection(1);
            }
        },
        {
            name: "selectUp",
            bindKey: bindKey("Shift-Up", "Shift-Up"),
            exec: function(editor) {
                editor.selection.moveSelection(-1, true);
            }
        },
        {
            name: "selectDown",
            bindKey: bindKey("Shift-Down", "Shift-Down"),
            exec: function(editor) {
                editor.selection.moveSelection(1, true);
            }
        },
        {
            name: "selectToUp",
            bindKey: bindKey("Ctrl-Up", "Ctrl-Up"),
            exec: function(editor) {
                editor.selection.moveSelection(-1, false, true);
            }
        },
        {
            name: "selectToDown",
            bindKey: bindKey("Ctrl-Down", "Ctrl-Down"),
            exec: function(editor) {
                editor.selection.moveSelection(1, false, true);
            }
        },
        {
            name: "selectMoreUp",
            bindKey: bindKey("Ctrl-Shift-Up", "Ctrl-Shift-Up"),
            exec: function(editor) {
                editor.selection.moveSelection(-1, true, true);
            }
        },
        {
            name: "selectMoreDown",
            bindKey: bindKey("Ctrl-Shift-Down", "Ctrl-Shift-Down"),
            exec: function(editor) {
                editor.selection.moveSelection(1, true, true);
            }
        },
        {
            name: "rename",
            bindKey: "F2",
            exec: function(tree) {
                tree.edit && tree.edit.startRename();
            }
        },
        {
            name: "chose",
            bindKey: "Enter",
            exec: function(tree) {
                tree._emit("afterChoose");
            }
        },
        {
            name: "delete",
            bindKey: "Delete",
            exec: function(tree) {
                tree._emit("delete");
            }
        },
        {
            name: "foldOther",
            bindKey: bindKey("Alt-0", "Command-Option-0"),
            exec: function(tree) {
                tree.provider.close(tree.provider.root, true);
                tree.reveal(tree.selection.getCursor());
            }
        }
    ];
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 614:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "no use strict";
    var lang = __webpack_require__(955);
    var oop = __webpack_require__(645);
    var net = __webpack_require__(552);
    var AppConfig = (__webpack_require__(845)/* .AppConfig */ .o);
    module.exports = exports = new AppConfig();
    var global = function() {
        return this;
    }();
    var options = {
        packaged: false,
        workerPath: null,
        modePath: null,
        themePath: null,
        basePath: "",
        suffix: ".js",
        $moduleUrls: {}
    };
    exports.get = function(key) {
        if (!options.hasOwnProperty(key)) throw new Error("Unknown config key: " + key);
        return options[key];
    };
    exports.set = function(key, value) {
        if (!options.hasOwnProperty(key)) throw new Error("Unknown config key: " + key);
        options[key] = value;
    };
    exports.all = function() {
        return lang.copyObject(options);
    };
    exports.moduleUrl = function(name, component) {
        if (options.$moduleUrls[name]) return options.$moduleUrls[name];
        var parts = name.split("/");
        component = component || parts[parts.length - 2] || "";
        var base = parts[parts.length - 1].replace(component, "").replace(/(^[\-_])|([\-_]$)/, "");
        if (!base && parts.length > 1) base = parts[parts.length - 2];
        var path = options[component + "Path"];
        if (path == null) path = options.basePath;
        if (path && path.slice(-1) != "/") path += "/";
        return path + component + "-" + base + this.get("suffix");
    };
    exports.setModuleUrl = function(name, subst) {
        return options.$moduleUrls[name] = subst;
    };
    exports.$loading = {};
    exports.loadModule = function(moduleName, onLoad) {
        debugger;
    };
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 768:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 * 
 * Copyright 2011 Irakli Gozalishvili. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    exports.isDark = false;
    exports.cssClass = "ace_tree-light";
    exports.cssText = __webpack_require__(28);
    var dom = __webpack_require__(435);
    dom.importCssString(exports.cssText, exports.cssClass);
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 950:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * The main class required to set up a Tree instance in the browser.
 *
 * @class Tree
 **/ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var oop = __webpack_require__(645);
    var Scrollable = __webpack_require__(541);
    var dom = __webpack_require__(435);
    var escapeHTML = (__webpack_require__(955).escapeHTML);
    var DataProvider = function(root) {
        this.rowHeight = 25;
        this.setRoot(root);
    };
    (function() {
        this.rowHeight = undefined;
        this.rowHeightInner = undefined;
        this.$indentSize = 10;
        oop.implement(this, Scrollable);
        this.$sortNodes = true;
        this.setRoot = function(root) {
            if (Array.isArray(root)) root = {
                items: root
            };
            this.root = root || {};
            if (this.root.$depth == undefined) {
                this.root.$depth = -1;
            }
            if (this.root.$depth < 0) {
                this.visibleItems = [];
                this.open(this.root);
                this.visibleItems.unshift();
            } else {
                this.visibleItems = [
                    this.root
                ];
            }
            this.$selectedNode = this.root;
            this._signal("setRoot");
            this._signal("change");
        };
        this.open = this.expand = function(node, deep, silent) {
            if (typeof deep != "number") deep = deep ? 100 : 0;
            if (!node) return;
            var items = this.visibleItems;
            if (this.isOpen(node) && (node !== this.root || items.length)) return;
            var ch = this.getChildren(node);
            if (this.loadChildren && this.shouldLoadChildren(node, ch)) {
                var timer = setTimeout((function() {
                    node.status = "loading";
                    this._signal("change", node);
                }).bind(this), 100);
                this.loadChildren(node, (function(err, ch) {
                    clearTimeout(timer);
                    this.collapse(node, null, true);
                    node.status = "loaded";
                    if (!err) this.expand(node, null, false);
                }).bind(this));
                this.setOpen(node, true);
                return;
            }
            this.setOpen(node, true);
            var i = items.indexOf(node);
            if (!ch) {
                this._signal("change", node);
                return;
            }
            if (i === -1 && items.length || this.forceEmpty) return;
            ch = [
                i + 1,
                0
            ].concat(ch);
            items.splice.apply(items, ch);
            for(var j = 2; j < ch.length; j++){
                var childNode = ch[j];
                if (this.isOpen(childNode)) {
                    this.setOpen(childNode, false);
                    this.open(childNode, deep - 1, silent);
                } else if (deep > 0) {
                    this.open(childNode, deep - 1, silent);
                }
            }
            this.rows = items.length;
            silent || this._signal("expand", node);
        };
        this.close = this.collapse = function(node, deep, silent) {
            if (typeof deep != "number") deep = deep ? 1000 : 0;
            var items = this.visibleItems;
            var isRoot = node === this.root;
            if (isRoot) {
                this.setOpen(node, false);
                if (deep) {
                    for(var i = 0; i < items.length; i++){
                        var ch = items[i];
                        if (!ch.isRoot) {
                            if (this.isOpen(ch) && ch.$depth - node.$depth < deep) {
                                this.setOpen(ch, false);
                                silent || this._signal("collapse", ch);
                            }
                        }
                    }
                }
                items.length = 0;
                if (isRoot) this.open(this.root, 0, silent);
                return;
            }
            if (!node || !this.isOpen(node)) return;
            var i = items.indexOf(node);
            if (i === -1) return;
            var thisDepth = node.$depth;
            var deletecount = 0;
            for(var t = i + 1; t < items.length; t++){
                if (items[t].$depth > thisDepth) deletecount++;
                else break;
            }
            if (deep) {
                for(var j = 0; j < deletecount; j++){
                    var ch = items[j + i];
                    if (this.isOpen(ch) && ch.$depth - node.$depth < deep) {
                        this.setOpen(ch, false);
                        silent || this._signal("collapse", ch);
                    }
                }
            }
            items.splice(i + 1, deletecount);
            this.setOpen(node, false);
            silent || this._signal("collapse", node);
            if (isRoot) this.open(this.root, 0, silent);
        };
        this.toggleNode = function(node, deep, silent) {
            if (node && this.isOpen(node)) this.close(node, deep, silent);
            else this.open(node, deep, silent);
        };
        this.sort = function(children, compare) {
            if (!compare) {
                compare = alphanumCompare;
            }
            return children.sort(function(a, b) {
                var aChildren = a.children || a.map;
                var bChildren = b.children || b.map;
                if (aChildren && !bChildren) return -1;
                if (!aChildren && bChildren) return 1;
                return compare(a.label || "", b.label || "");
            });
        };
        this.setFilter = function(fn) {
            this.$filterFn = fn;
            this.setRoot(this.root);
        };
        this.getChildren = function(node) {
            var children = node.children;
            if (!children) {
                if (node.status === "pending") return;
                if (node.map) {
                    children = Object.keys(node.map).map(function(key) {
                        var ch = node.map[key];
                        ch.parent = node;
                        return ch;
                    });
                } else if (node.items) {
                    children = node.items;
                }
                if (children) {
                    node.children = children;
                }
            }
            var ch = children && children[0] && children[0];
            if (ch) {
                var d = node.$depth + 1 || 0;
                children.forEach(function(n) {
                    n.$depth = d;
                    n.parent = node;
                });
            }
            if (this.$filterFn) {
                children = children && children.filter(this.$filterFn);
            }
            if (this.$sortNodes && !node.$sorted) {
                children && this.sort(children);
            }
            return children;
        };
        this.loadChildren = null;
        this.shouldLoadChildren = function(node, ch) {
            return node.status === "pending";
        };
        this.hasChildren = function(node) {
            if (node.children) return node.children.length !== 0;
            return node.map || node.status === "pending" || node.items && node.items.length;
        };
        this.findNodeByPath = function() {};
        this.getSibling = function(node, dir) {
            if (!dir) dir = 1;
            var parent = node.parent;
            var ch = this.getChildren(parent);
            var pos = ch.indexOf(node);
            return ch[pos + dir];
        };
        this.getNodeAtIndex = function(i) {
            return this.visibleItems[i];
        };
        this.getIndexForNode = function(node) {
            return this.visibleItems.indexOf(node);
        };
        this.getMinIndex = function() {
            return 0;
        };
        this.getMaxIndex = function() {
            return this.visibleItems.length - 1;
        };
        this.setOpen = function(node, val) {
            return node.isOpen = val;
        };
        this.isOpen = function(node) {
            return node.isOpen;
        };
        this.isVisible = function(node) {
            return this.visibleItems.indexOf(node) !== -1;
        };
        this.isSelected = function(node) {
            return node.isSelected;
        };
        this.setSelected = function(node, val) {
            return node.isSelected = !!val;
        };
        this.isSelectable = function(node) {
            return !node || !(node.noSelect || node.$depth < 0);
        };
        this.isAncestor = function(node, child) {
            do {
                if (child == node) return true;
            }while (child = child.parent)
            return false;
        };
        this.setAttribute = function(node, name, value) {
            node[name] = value;
            this._signal("change", node);
        };
        this.getDataRange = function(rows, columns, callback) {
            var view = this.visibleItems.slice(rows.start, rows.start + rows.length);
            callback(null, view, false);
            return view;
        };
        this.getRange = function(top, bottom) {
            var start = Math.floor(top / this.rowHeight);
            var end = Math.ceil(bottom / this.rowHeight) + 1;
            var range = this.visibleItems.slice(start, end);
            range.count = start;
            range.size = this.rowHeight * range.count;
            return range;
        };
        this.getTotalHeight = function(top, bottom) {
            return this.rowHeight * this.visibleItems.length;
        };
        this.getNodePosition = function(node) {
            var i = this.visibleItems.indexOf(node);
            if (i == -1 && node && node.parent) {
                i = this.visibleItems.indexOf(node.parent);
            }
            var top = i * this.rowHeight;
            var height = this.rowHeight;
            return {
                top: top,
                height: height
            };
        };
        this.findItemAtOffset = function(offset, clip) {
            var index = Math.floor(offset / this.rowHeight);
            if (clip) index = Math.min(Math.max(0, index), this.visibleItems.length - 1);
            return this.visibleItems[index];
        };
        this.getIconHTML = function(node) {
            return "";
        };
        this.getClassName = function(node) {
            return (node.className || "") + (node.status == "loading" ? " loading" : "");
        };
        this.setClass = function(node, name, include) {
            node.className = node.className || "";
            dom.setCssClass(node, name, include);
            this._signal("changeClass");
        };
        this.redrawNode = null;
        this.getCaptionHTML = function(node) {
            return escapeHTML(node.label || node.name || (typeof node == "string" ? node : ""));
        };
        this.getContentHTML = null;
        this.getEmptyMessage = function() {
            return this.emptyMessage || "";
        };
        this.getText = function(node) {
            return node.label || node.name || "";
        };
        this.getRowIndent = function(node) {
            return node.$depth;
        };
        this.hideAllNodes = function() {
            this.visibleItems = [];
            this.forceEmpty = true;
            this.setRoot(this.root);
        };
        this.showAllNodes = function() {
            this.forceEmpty = false;
            this.setRoot(this.root);
        };
    }).call(DataProvider.prototype);
    function alphanumCompare(a, b) {
        var caseOrder = 0;
        for(var x = 0, l = Math.min(a.length, b.length); x < l; x++){
            var ch1 = a.charCodeAt(x);
            var ch2 = b.charCodeAt(x);
            if (ch1 < 58 && ch2 < 58 && ch1 > 47 && ch2 > 47) {
                var num1 = 0, num2 = 0;
                var n = x;
                do {
                    num1 = 10 * num1 + (ch1 - 48);
                    ch1 = a.charCodeAt(++n);
                }while (ch1 > 47 && ch1 < 58)
                n = x;
                do {
                    num2 = 10 * num2 + (ch2 - 48);
                    ch2 = b.charCodeAt(++n);
                }while (ch2 > 47 && ch2 < 58)
                if (num1 === num2) x = n - 1;
                else return num1 - num2;
            } else if (ch1 !== ch2) {
                var ch1L = a[x].toLowerCase();
                var ch2L = b[x].toLowerCase();
                if (ch1L < ch2L) return -1;
                if (ch1L > ch2L) return 1;
                if (!caseOrder) caseOrder = ch2 - ch1;
            }
        }
        return caseOrder || a.length - b.length;
    }
    DataProvider.alphanumCompare = alphanumCompare;
    DataProvider.prototype.alphanumCompare = alphanumCompare;
    DataProvider.variableHeightRowMixin = function() {
        var reset = (function() {
            this.$cachedTotalHeight = 0;
        }).bind(this);
        this.on("collapse", reset);
        this.on("expand", reset);
        // this.rowCache 
        this.getNodePosition = function(node) {
            var i = this.visibleItems.indexOf(node);
            if (i == -1 && node && node.parent) {
                i = this.visibleItems.indexOf(node.parent);
            }
            var items = this.visibleItems;
            var top = 0, height = 0;
            for(var index = 0; index < i; index++){
                height = this.getItemHeight(items[index], index);
                top += height;
            }
            height = this.getItemHeight(items[i], i);
            return {
                top: top,
                height: height
            };
        };
        this.findIndexAtOffset = function(offset, clip) {
            var items = this.visibleItems;
            var top = 0, index = 0, l = items.length;
            while(index < l){
                var height = this.getItemHeight(items[index], index);
                top += height;
                index++;
                if (top >= offset) {
                    index--;
                    top -= height;
                    break;
                }
            }
            if (clip) index = Math.min(Math.max(0, index), items.length - 1);
            return index;
        };
        this.findItemAtOffset = function(offset, clip) {
            var index = this.findIndexAtOffset(offset, clip);
            return this.visibleItems[index];
        };
        this.getItemHeight = function(node, index) {
            return node.height || this.rowHeight;
        };
        this.getRange = function(top, bottom) {
            var items = this.visibleItems;
            var startH = 0, index = 0, l = items.length;
            while(index < l){
                var height = this.getItemHeight(items[index], index);
                startH += height;
                index++;
                if (startH >= top) {
                    index--;
                    startH -= height;
                    break;
                }
            }
            index = Math.min(Math.max(0, index), items.length - 1);
            var start = index;
            var end = this.findIndexAtOffset(bottom, true) + 1;
            var range = this.visibleItems.slice(start, end);
            range.count = start;
            range.size = startH;
            return range;
        };
        this.getTotalHeight = function() {
            if (!this.$cachedTotalHeight) {
                var items = this.visibleItems;
                var height = 0;
                for(var index = 0; index < items.length; index++){
                    height += this.getItemHeight(items[index], index);
                }
                this.$cachedTotalHeight = height;
            }
            return this.$cachedTotalHeight;
        };
    };
    module.exports = DataProvider;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 365:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var oop = __webpack_require__(645);
    var dom = __webpack_require__(435);
    var lang = __webpack_require__(955);
    var escapeHTML = lang.escapeHTML;
    var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);
    var Cells = function(parentEl) {
        this.element = dom.createElement("div");
        this.element.className = "ace_tree_layer ace_tree_cell-layer";
        parentEl.appendChild(this.element);
    };
    (function() {
        oop.implement(this, EventEmitter);
        this.config = {}, this.setDataProvider = function(provider) {
            this.provider = provider;
            if (provider) this.update = provider.renderRow ? this.$customUpdate : this.$treeModeUpdate;
        };
        this.update = function(config) {};
        this.measureSizes = function() {
            var domNode = this.element.firstChild;
            if (domNode) {
                this.provider.rowHeight = domNode.offsetHeight;
                this.provider.rowHeightInner = domNode.clientHeight;
            }
        };
        this.$treeModeUpdate = function(config) {
            this.config = config;
            var provider = this.provider;
            var row, html = [], view = config.view, datarow;
            var firstRow = config.firstRow, lastRow = config.lastRow + 1;
            var hsize = "auto;", vsize = provider.rowHeightInner || provider.rowHeight;
            for(row = firstRow; row < lastRow; row++){
                datarow = view[row - firstRow];
                if (provider.getItemHeight) vsize = provider.getItemHeight(datarow, row);
                this.$renderRow(html, datarow, vsize, hsize, row);
            }
            if (firstRow <= 0 && lastRow <= 0) {
                this.renderPlaceHolder(provider, html, config);
            }
            this.element.innerHTML = html.join("");
            if (!vsize) {
                this.measureSizes();
            }
        };
        this.columnNode = function(datarow, column) {
            return "<span class='tree-column " + (column.className || "") + "' style='" + (datarow.fullWidth ? "" : "width:" + column.$width + ";") + "'>";
        };
        this.getRowClass = function(datarow, row) {
            var provider = this.provider;
            return "tree-row " + (provider.isSelected(datarow) ? "selected " : '') + (provider.getClassName(datarow) || "") + (row & 1 ? " odd" : " even");
        };
        this.$renderRow = function(html, datarow, vsize, hsize, row) {
            var provider = this.provider;
            var columns = provider.columns;
            var indent = provider.$indentSize; // provider.getIndent(datarow);
            html.push("<div style='height:" + vsize + "px;" + (columns ? "padding-right:" + columns.$fixedWidth : "") + "' class='" + this.getRowClass(datarow, row) + "'>");
            if (!columns || columns[0].type == "tree") {
                if (columns) {
                    html.push(this.columnNode(datarow, columns[0], row));
                }
                var depth = provider.getRowIndent(datarow);
                html.push((depth ? "<span style='width:" + depth * indent + "px' class='tree-indent'></span>" : "") + "<span class='toggler " + (provider.hasChildren(datarow) ? provider.isOpen(datarow) ? "open" : "closed" : "empty") + "'></span>" + (provider.getCheckboxHTML ? provider.getCheckboxHTML(datarow) : "") + provider.getIconHTML(datarow) + (provider.getContentHTML ? provider.getContentHTML(datarow) : "<span class='caption' style='width: " + hsize + "px;height: " + vsize + "px'>" + provider.getCaptionHTML(datarow) + "</span>"));
            }
            if (columns) {
                for(var col = columns[0].type == "tree" ? 1 : 0; col < columns.length; col++){
                    var column = columns[col];
                    var rowStr = column.getHTML ? column.getHTML(datarow) : escapeHTML(column.getText(datarow) + "");
                    html.push("</span>" + this.columnNode(datarow, column, row) + rowStr);
                }
                html.push("</span>");
            }
            html.push("</div>");
        };
        this.$customUpdate = function(config) {
            this.config = config;
            var provider = this.provider;
            var html = [];
            var firstRow = config.firstRow, lastRow = config.lastRow + 1;
            for(var row = firstRow; row < lastRow; row++){
                provider.renderRow(row, html, config);
            }
            if (firstRow <= 0 && lastRow <= 0) {
                this.renderPlaceHolder(provider, html, config);
            }
            this.element.innerHTML = html.join("");
        };
        this.updateClasses = function(config) {
            // fallback to full redraw for customUpdate
            if (this.update == this.$customUpdate && !this.provider.updateNode) return this.update(config);
            this.config = config;
            var provider = this.provider;
            var row, view = config.view, datarow;
            var firstRow = config.firstRow, lastRow = config.lastRow + 1;
            var children = this.element.children;
            if (children.length != lastRow - firstRow) return this.update(config);
            for(row = firstRow; row < lastRow; row++){
                datarow = view[row - firstRow];
                var el = children[row - firstRow];
                el.className = this.getRowClass(datarow, row);
                if (provider.redrawNode) provider.redrawNode(el, datarow);
            }
        };
        this.scroll = function(config) {
            // not implemented
            return this.update(config);
            this.element.insertAdjacentHTML("afterBegin", "<span>a</span><s>r</s>");
            this.element.insertAdjacentHTML("beforeEnd", "<span>a</span><s>r</s>");
        };
        this.updateRows = function(config, firstRow, lastRow) {
        // not implemented
        };
        this.destroy = function() {};
        this.getDomNodeAtIndex = function(i) {
            return this.element.children[i - this.config.firstRow];
        };
        this.renderPlaceHolder = function(provider, html, config) {
            if (provider.renderEmptyMessage) {
                provider.renderEmptyMessage(html, config);
            } else if (provider.getEmptyMessage) {
                html.push("<div class='message empty'>", escapeHTML(provider.getEmptyMessage()), "</div>");
            }
        };
    }).call(Cells.prototype);
    exports.Cells = Cells;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 86:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var oop = __webpack_require__(645);
    var dom = __webpack_require__(435);
    var lang = __webpack_require__(955);
    var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);
    var RESIZER_WIDTH = 3;
    function getColumnText(node) {
        return node[this.value] || this.defaultValue || "";
    }
    function ColumnHeader(parentEl, renderer) {
        this.element = dom.createElement("div");
        parentEl.appendChild(this.element);
        this.element.className = "tree-headings";
        this.visible = false;
    }
    (function() {
        this.minWidth = 25;
        this.update = function() {
            if (!this.provider || !this.visible) return;
            var columns = this.provider.columns;
            var html = [];
            for(var i = 0; i < columns.length; i++){
                var col = columns[i];
                html.push("<span class='tree-column " + (col.className || "") + "' style='width:" + col.$width + ";height:'>" + col.caption + "</span>" + "<span class='tree-column-resizer' >" + "</span>");
            }
            this.element.style.paddingRight = columns.$fixedWidth;
            this.element.innerHTML = html.join("");
        };
        this.setDataProvider = function(provider) {
            this.provider = provider;
            if (!provider) return;
            var columns = this.provider.columns;
            if (!columns) {
                this.visible = false;
                return;
            }
            this.visible = true;
            var fixedWidth = 0;
            columns.forEach(function(col, i) {
                col.index = i;
                if (col.value && !col.getText) col.getText = getColumnText;
                var w = col.width;
                if (typeof w == "string" && w.slice(-1) == "%") {
                    col.flex = parseInt(w, 10) / 100;
                    col.$width = col.width;
                } else {
                    col.width = parseInt(w, 10) || this.minWidth;
                    fixedWidth += col.width;
                    col.$width = col.width + "px";
                }
                col.pixelWidth = 0;
            }, this);
            columns.fixedWidth = fixedWidth;
            columns.$fixedWidth = fixedWidth + "px";
            columns.width = null;
            provider.columns = columns;
        };
        this.updateWidth = function(width) {
            if (!this.provider || !this.visible) return;
            var columns = this.provider.columns;
            var fixedWidth = 0;
            columns.width = width;
            columns.forEach(function(col) {
                if (!col.flex) {
                    fixedWidth += col.width;
                }
            });
            var flexWidth = width - fixedWidth;
            columns.forEach(function(col) {
                if (col.flex) {
                    col.pixelWidth = flexWidth * col.flex;
                    col.$width = col.flex * 100 + "%";
                } else {
                    col.pixelWidth = col.width;
                    col.$width = col.width + "px";
                }
            });
            columns.fixedWidth = fixedWidth;
            columns.$fixedWidth = fixedWidth + "px";
        };
        this.changeColumnWidth = function(changedColumn, dw, total) {
            this.updateWidth(total);
            var columns = this.provider.columns;
            var minWidth = this.minWidth;
            if (!dw) return;
            var index = columns.indexOf(changedColumn);
            var col, nextCol, prevCol;
            for(var i = index + 1; i < columns.length; i++){
                col = columns[i];
                if (Math.floor(col.pixelWidth) > minWidth || dw < 0) {
                    if (col.flex) {
                        nextCol = col;
                        break;
                    } else if (!nextCol) {
                        nextCol = col;
                    }
                }
            }
            for(var i = index; i >= 0; i--){
                col = columns[i];
                if (Math.floor(col.pixelWidth) > minWidth || dw > 0) {
                    if (col.flex) {
                        prevCol = col;
                        break;
                    } else if (!prevCol) {
                        prevCol = col;
                        if (col == changedColumn) break;
                    }
                }
            }
            if (!prevCol || !nextCol) return;
            if (nextCol.pixelWidth - dw < minWidth) dw = nextCol.pixelWidth - minWidth;
            if (prevCol.pixelWidth + dw < minWidth) dw = minWidth - prevCol.pixelWidth;
            nextCol.pixelWidth -= dw;
            prevCol.pixelWidth += dw;
            if (!nextCol.flex) columns.fixedWidth -= dw;
            if (!prevCol.flex) columns.fixedWidth += dw;
            var flexWidth = total - columns.fixedWidth;
            columns.forEach(function(col) {
                if (col.flex) {
                    col.flex = col.pixelWidth / flexWidth;
                } else {
                    col.width = col.pixelWidth;
                }
            });
            this.updateWidth(total);
        };
        this.findColumn = function(x) {
            var columns = this.provider.columns;
            if (this.element.offsetWidth != columns.width) this.updateWidth(this.element.offsetWidth);
            var w = 0;
            for(var i = 0; i < columns.length; i++){
                var column = columns[i];
                w += column.pixelWidth;
                if (x < w + RESIZER_WIDTH) {
                    return {
                        index: i,
                        column: column,
                        overResizer: x > w - RESIZER_WIDTH
                    };
                }
            }
        };
    }).call(ColumnHeader.prototype);
    exports.ColumnHeader = ColumnHeader;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 611:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var dom = __webpack_require__(435);
    var Selection = function(parentEl, renderer) {
        this.element = dom.createElement("div");
        this.element.className = "ace_tree_layer ace_tree_selection-layer";
        parentEl.appendChild(this.element);
        this.renderer = renderer;
        this.markerEl = null;
        this.arrowEl = null;
    };
    (function() {
        this.setDataProvider = function(provider) {
            this.provider = provider;
        };
        this.update = function(config) {
            // markedFolderType: 0: folder, -1: before, 1: after
            if (!this.provider.markedFolder || this.provider.markedFolderType) {
                this.markerEl && this.clearFolderMarker();
            } else {
                this.showFolderMarker(config);
            }
            if (!this.provider.markedFolder || !this.provider.markedFolderType) {
                this.arrowEl && this.clearInsertionMarker();
            } else {
                this.showInsertionMarker(config);
            }
        };
        this.showFolderMarker = function(config) {
            this.config = config;
            var provider = this.provider;
            var node = provider.markedFolder;
            var start = provider.getIndexForNode(node);
            var items = provider.visibleItems;
            var end = start + 1;
            var depth = node.$depth;
            while(items[end] && items[end].$depth > depth){
                end++;
            }
            end--;
            if (start > config.lastRow || end < config.firstRow || start === end) {
                return this.clearFolderMarker();
            }
            start++;
            end++;
            var top = Math.max(start - config.firstRow, -1) * provider.rowHeight;
            var left = (depth + 1) * provider.$indentSize;
            var bottom = Math.min(end - config.firstRow, config.lastRow - config.firstRow + 2) * provider.rowHeight;
            if (!this.markerEl) {
                this.markerEl = dom.createElement("div");
                this.markerEl.className = "dragHighlight";
                this.element.appendChild(this.markerEl);
            }
            this.markerEl.style.top = top + "px";
            this.markerEl.style.left = left + "px";
            this.markerEl.style.right = "7px";
            this.markerEl.style.height = bottom - top + "px";
        };
        this.showInsertionMarker = function(config) {
            this.config = config;
            var provider = this.provider;
            var node = provider.markedFolder;
            var type = this.provider.markedFolderType;
            var start = provider.getIndexForNode(node);
            var depth = node.$depth;
            if (start > config.lastRow || start < config.firstRow) {
                return this.clearInsertionMarker();
            }
            if (type == 1) start++;
            var top = Math.max(start - config.firstRow, -1) * provider.rowHeight;
            var left = (depth + 1) * provider.$indentSize;
            if (!this.arrowEl) {
                this.arrowEl = dom.createElement("div");
                this.arrowEl.className = "dragArrow";
                this.element.appendChild(this.arrowEl);
            }
            this.arrowEl.style.top = top + "px";
            this.arrowEl.style.left = left + "px";
            this.arrowEl.style.right = "7px";
        };
        this.clearFolderMarker = function() {
            if (this.markerEl) {
                this.markerEl.parentNode.removeChild(this.markerEl);
                this.markerEl = null;
            }
        };
        this.clearInsertionMarker = function() {
            if (this.arrowEl) {
                this.arrowEl.parentNode.removeChild(this.arrowEl);
                this.arrowEl = null;
            }
        };
        this.clear = function() {
            this.clearFolderMarker();
            this.clearInsertMarker();
        };
        this.destroy = function() {};
    }).call(Selection.prototype);
    exports.Selection = Selection;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 127:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var dom = __webpack_require__(435);
    var DRAG_OFFSET = 5; // pixels
    function DefaultHandlers(mouseHandler) {
        mouseHandler.$clickSelection = null;
        var editor = mouseHandler.editor;
        editor.setDefaultHandler("mousedown", this.onMouseDown.bind(mouseHandler));
        editor.setDefaultHandler("dblclick", this.onDoubleClick.bind(mouseHandler));
        // editor.setDefaultHandler("tripleclick", this.onTripleClick.bind(mouseHandler));
        // editor.setDefaultHandler("quadclick", this.onQuadClick.bind(mouseHandler));
        editor.setDefaultHandler("mouseleave", this.onMouseLeave.bind(mouseHandler));
        editor.setDefaultHandler("mousemove", this.onMouseMove.bind(mouseHandler));
        editor.setDefaultHandler("mousewheel", this.onMouseWheel.bind(mouseHandler));
        editor.setDefaultHandler("mouseup", this.onMouseUp.bind(mouseHandler));
        editor.setDefaultHandler("click", this.onClick.bind(mouseHandler));
        var exports = [
            "dragMoveSelection",
            "dragWait",
            "dragWaitEnd",
            "getRegion",
            "updateHoverState"
        ];
        exports.forEach(function(x) {
            mouseHandler[x] = this[x];
        }, this);
    }
    (function() {
        function isTogglerClick(target) {
            return dom.hasCssClass(target, "toggler") && !dom.hasCssClass(target, "empty");
        }
        this.onMouseMove = function(e) {
            var editor = this.editor;
            var node = e.getNode();
            var title, provider = editor.provider;
            if (!node) {
                title = "";
            } else if (provider.columns) {
                var pos = e.getDocumentPosition();
                var columnData = editor.renderer.$headingLayer.findColumn(pos.x);
                title = columnData ? columnData.column.getText(node) : "";
            } else {
                title = provider.getTooltipText ? provider.getTooltipText(node) : provider.getText(node);
            }
            if (!editor.tooltip && editor.container.title != title) editor.container.title = title;
            this.updateHoverState(node);
        };
        this.onMouseLeave = function() {
            this.updateHoverState(null);
        };
        this.updateHoverState = function(node) {
            var provider = this.editor.provider;
            if (node !== this.node && provider) {
                if (this.node) provider.setClass(this.node, "hover", false);
                this.node = node;
                if (this.node) provider.setClass(this.node, "hover", true);
            }
        };
        this.onMouseDown = function(ev) {
            var editor = this.editor;
            var provider = editor.provider;
            ev.detail = 1;
            this.mousedownEvent = ev;
            this.delayedSelect = false;
            this.isMousePressed = true;
            var button = ev.getButton();
            var selectedNodes = editor.selection.getSelectedNodes();
            var isMultiSelect = selectedNodes.length > 1;
            if (button !== 0 && isMultiSelect) {
                return; // stopping event here breaks contextmenu on ff mac
            }
            var node = ev.getNode();
            this.$clickNode = node;
            if (!node) return; // Click outside cells
            var inSelection = provider.isSelected(node);
            var target = ev.domEvent.target;
            this.region = null;
            if (isTogglerClick(target) || node.clickAction == "toggle") {
                this.region = "toggler";
                var toggleChildren = ev.getShiftKey();
                var deep = ev.getAccelKey();
                if (button === 0) {
                    if (toggleChildren) {
                        if (deep) {
                            node = node.parent;
                        }
                        provider.close(node, true);
                        provider.open(node);
                    } else {
                        provider.toggleNode(node, deep);
                    }
                }
                this.$clickNode = null;
            } else if (dom.hasCssClass(target, "checkbox")) {
                var nodes = inSelection && editor.selection.getSelectedNodes();
                provider._signal("toggleCheckbox", {
                    target: node,
                    selectedNodes: nodes
                });
                // consider deprecating this
                node.isChecked = !node.isChecked;
                if (nodes) {
                    nodes.forEach(function(n) {
                        n.isChecked = node.isChecked;
                    });
                }
                provider._signal(node.isChecked ? "check" : "uncheck", nodes || [
                    node
                ]);
                provider._signal("change");
            } else if (dom.hasCssClass(target, "icon-ok")) {
                if (ev.getShiftKey()) {
                    editor.selection.expandSelection(node, null, true);
                } else {
                    editor.selection.toggleSelect(node);
                }
            } else if (ev.getAccelKey()) {
                if (inSelection && isMultiSelect) this.delayedSelect = "toggle";
                else if (!inSelection || isMultiSelect) editor.selection.toggleSelect(node);
            } else if (ev.getShiftKey()) {
                editor.selection.expandSelection(node);
            } else if (inSelection && isMultiSelect) {
                if (!editor.isFocused()) this.$clickNode = null;
                else this.delayedSelect = true;
            } else {
                editor.selection.setSelection(node);
            }
            if (this.$clickNode) editor.$mouseHandler.captureMouse(ev, "dragWait");
            return ev.preventDefault();
        };
        this.onMouseUp = function(ev) {
            if (this.isMousePressed == 2) return; // wait until release capture
            this.isMousePressed = false;
            var pos = ev.getDocumentPosition();
            var node = this.editor.provider.findItemAtOffset(pos.y);
            if (node && this.$clickNode && this.$clickNode == node) {
                ev.button = ev.getButton();
                ev.target = ev.domEvent.target;
                ev.detail = this.mousedownEvent.detail;
                this.onMouseEvent("click", ev);
            }
            this.$clickNode = this.mouseEvent = null;
        };
        this.onClick = function(ev) {
            if (this.mousedownEvent.detail === 2) {
                this.editor._emit("afterChoose");
            }
        };
        this.onDoubleClick = function(ev) {
            var provider = this.editor.provider;
            if (provider.toggleNode && !isTogglerClick(ev.domEvent.target)) {
                var node = ev.getNode();
                if (node) provider.toggleNode(node);
            }
            if (this.mousedownEvent) this.mousedownEvent.detail = 2;
        };
        this.dragMoveSelection = function() {
            var editor = this.editor;
            var ev = this.mouseEvent;
            ev.$pos = ev.node = null;
            var node = ev.getNode(true);
            if (node != editor.selection.getCursor() && node) {
                if (ev.getShiftKey()) {
                    editor.selection.expandSelection(node, null, true);
                } else {
                    editor.selection.selectNode(node);
                }
                editor.renderer.scrollCaretIntoView();
            }
        };
        this.dragWait = function() {
            var ev = this.mousedownEvent;
            if (Math.abs(this.x - ev.x) + Math.abs(this.y - ev.y) > DRAG_OFFSET) {
                this.delayedSelect = false;
                this.editor._emit("startDrag", ev);
                if (this.state == "dragWait" && ev.getButton() === 0) this.setState("dragMoveSelection");
            }
        };
        this.dragWaitEnd = function() {
            if (this.delayedSelect) {
                var selection = this.editor.selection;
                if (this.$clickNode) {
                    if (this.delayedSelect == "toggle") selection.toggleSelect(this.$clickNode);
                    else selection.setSelection(this.$clickNode);
                }
                this.delayedSelect = false;
            }
        };
        this.onMouseWheel = function(ev) {
            if (ev.getShiftKey() || ev.getAccelKey()) return;
            var t = ev.domEvent.timeStamp;
            var dt = t - (this.$lastScrollTime || 0);
            var editor = this.editor;
            var isScrolable = editor.renderer.isScrollableBy(ev.wheelX * ev.speed, ev.wheelY * ev.speed);
            if (isScrolable || dt < 200) {
                this.$lastScrollTime = t;
                editor.renderer.scrollBy(ev.wheelX * ev.speed, ev.wheelY * ev.speed);
                return ev.stop();
            }
        };
    }).call(DefaultHandlers.prototype);
    exports.DefaultHandlers = DefaultHandlers;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 513:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var event = __webpack_require__(631);
    var useragent = __webpack_require__(943);
    var DefaultHandlers = (__webpack_require__(127).DefaultHandlers);
    var MouseEvent = (__webpack_require__(118).MouseEvent);
    var config = __webpack_require__(614);
    var dom = __webpack_require__(435);
    function initDragHandlers(mouseHandler) {
        var tree = mouseHandler.editor;
        var UNFOLD_TIMEOUT = 500;
        var WIDGET_UNFOLD_TIMEOUT = 500;
        var AUTOSCROLL_DELAY = 300;
        var MIN_DRAG_T = 500;
        var dragInfo, x, y, dx, dy;
        var scrollerRect;
        mouseHandler.drag = function() {
            var ev = this.mouseEvent;
            if (!dragInfo || !ev) return;
            var node = ev.getNode();
            dx = ev.x - x;
            dy = ev.y - y;
            x = ev.x;
            y = ev.y;
            var isInTree = isInRect(x, y, scrollerRect);
            if (!isInTree) {
                node = null;
            }
            if (dragInfo.isInTree != isInTree && dragInfo.selectedNodes) {
                dragInfo.isInTree = isInTree;
                ev.dragInfo = dragInfo;
                tree._signal(isInTree ? "dragIn" : "dragOut", ev);
            }
            if (!isInTree) {
                ev.dragInfo = dragInfo;
                tree._signal("dragMoveOutside", ev);
            }
            if (dragInfo.el) {
                dragInfo.el.style.top = ev.y - dragInfo.offsetY + "px";
                dragInfo.el.style.left = ev.x - dragInfo.offsetX + "px";
            }
            var hoverNode = node;
            if (hoverNode) {
                var xOffset = x - scrollerRect.left;
                var depth = Math.max(0, Math.floor(xOffset / tree.provider.$indentSize));
                var depthDiff = hoverNode.$depth - depth;
                while(depthDiff > 0 && hoverNode.parent){
                    depthDiff--;
                    hoverNode = hoverNode.parent;
                }
                if (!hoverNode.isFolder && dragInfo.mode != "sort") {
                    hoverNode = hoverNode.parent;
                }
            }
            if (dragInfo.hoverNode !== hoverNode) {
                if (dragInfo.hoverNode) {
                    tree.provider.setClass(dragInfo.hoverNode, "dropTarget", false);
                    tree._signal("folderDragLeave", dragInfo);
                }
                if (hoverNode && dragInfo.selectedNodes && dragInfo.selectedNodes.indexOf(hoverNode) != -1) {
                    hoverNode = null;
                }
                dragInfo.hoverNode = hoverNode;
                if (dragInfo.hoverNode) {
                    tree._signal("folderDragEnter", dragInfo);
                    if (dragInfo.mode !== "sort") tree.provider.setClass(dragInfo.hoverNode, "dropTarget", true);
                }
                highlightFolder(tree, dragInfo.hoverNode, dragInfo.insertPos);
            }
            var now = Date.now();
            var target = ev.domEvent.target;
            var isFoldWidget = target && dom.hasCssClass(target, "toggler") && !dom.hasCssClass(target, "empty");
            var distance = Math.abs(dx) + Math.abs(dy);
            var pos = ev.y - scrollerRect.top;
            var rowHeight = tree.provider.rowHeight;
            var renderer = tree.renderer;
            var autoScrollMargin = 1.5 * rowHeight;
            var scroll = pos - autoScrollMargin;
            if (scroll > 0) {
                scroll += -renderer.$size.scrollerHeight + 2 * autoScrollMargin;
                if (scroll < 0) scroll = 0;
            }
            if (!scroll || !isInTree) dragInfo.autoScroll = false;
            if (distance <= 2) {
                if (!dragInfo.stopTime) dragInfo.stopTime = now;
            } else {
                if (!isFoldWidget) dragInfo.stopTime = undefined;
            }
            var dt = now - dragInfo.stopTime;
            if (scroll && isInTree) {
                if (dt > AUTOSCROLL_DELAY || dragInfo.autoScroll) {
                    tree.renderer.scrollBy(0, scroll / 2);
                    dragInfo.autoScroll = true;
                }
            } else if (node && dragInfo.mode === "move") {
                if (node.parent === tree.provider.root || node.isRoot || node.parent && node.parent.isRoot) isFoldWidget = false;
                if (isFoldWidget && dt > WIDGET_UNFOLD_TIMEOUT && dt < 2 * WIDGET_UNFOLD_TIMEOUT) {
                    tree.provider.toggleNode(node);
                    dragInfo.stopTime = Infinity;
                } else if (!isFoldWidget && dt > UNFOLD_TIMEOUT && dt < 2 * UNFOLD_TIMEOUT) {
                    tree.provider.open(node);
                    dragInfo.stopTime = Infinity;
                }
            }
        };
        mouseHandler.dragEnd = function(e, cancel) {
            if (dragInfo) {
                window.removeEventListener("mousedown", keyHandler, true);
                window.removeEventListener("keydown", keyHandler, true);
                window.removeEventListener("keyup", keyHandler, true);
                if (dragInfo.el && dragInfo.el.parentNode) dragInfo.el.parentNode.removeChild(dragInfo.el);
                if (dragInfo.hoverNode) {
                    tree.provider.setClass(dragInfo.hoverNode, "dropTarget", false);
                    tree._signal("folderDragLeave", dragInfo);
                }
                highlightFolder(tree, null);
                if (tree.isFocused()) tree.renderer.visualizeFocus();
                tree.renderer.setStyle("dragOver", false);
                dragInfo.target = dragInfo.hoverNode;
                if (!cancel && dragInfo.selectedNodes && Date.now() - dragInfo.startT > MIN_DRAG_T) tree._emit("drop", dragInfo);
                if (!dragInfo.isInTree) {
                    if (cancel) dragInfo.selectedNodes = null;
                    tree._signal("dropOutside", {
                        dragInfo: dragInfo
                    });
                }
                dragInfo = null;
            }
        };
        mouseHandler.dragStart = function() {
            if (dragInfo) this.dragEnd(null, true);
            mouseHandler.setState("drag");
            tree.renderer.visualizeBlur();
            tree.renderer.setStyle("dragOver", true);
            scrollerRect = tree.renderer.scroller.getBoundingClientRect();
            dragInfo = {};
        };
        tree.on("startDrag", function(ev) {
            if (!tree.getOption("enableDragDrop")) return;
            var node = ev.getNode();
            if (!node || ev.getButton()) return;
            mouseHandler.dragStart();
            window.addEventListener("mousedown", keyHandler, true);
            window.addEventListener("keydown", keyHandler, true);
            window.addEventListener("keyup", keyHandler, true);
            var selectedNodes = tree.selection.getSelectedNodes();
            var el = constructDragNode(node);
            dragInfo = {
                el: el,
                node: node,
                selectedNodes: selectedNodes,
                offsetX: 10,
                offsetY: 10,
                target: node,
                startT: Date.now(),
                isInTree: true,
                mode: "move"
            };
            ev.dragInfo = dragInfo;
            tree._signal("dragStarted", ev);
            if (mouseHandler.state == "drag") mouseHandler.drag();
        });
        function constructDragNode(node) {
            var i = tree.provider.getIndexForNode(node);
            var domNode = tree.renderer.$cellLayer.getDomNodeAtIndex(i);
            if (!domNode) return;
            var offset = domNode.offsetHeight;
            var selectedNodes = tree.selection.getSelectedNodes();
            var el = document.createElement("div");
            el.className = tree.container.className + " dragImage";
            var ch = el.appendChild(domNode.cloneNode(true));
            ch.removeChild(ch.firstChild);
            ch.style.paddingRight = "5px";
            ch.style.opacity = "0.8";
            el.style.position = "absolute";
            el.style.zIndex = "1000000";
            el.style.pointerEvents = "none";
            el.style.overflow = "visible";
            if (selectedNodes.length > 1) {
                ch.style.color = "transparent";
                ch = el.appendChild(domNode.cloneNode(true));
                ch.removeChild(ch.firstChild);
                ch.style.paddingRight = "5px";
                ch.style.top = -offset + 2 + "px";
                ch.style.left = "2px";
                ch.style.position = "relative";
                ch.style.opacity = "0.8";
            }
            document.body.appendChild(el);
            return el;
        }
        function keyHandler(e) {
            if (dragInfo) {
                if (e.keyCode === 27 || e.type == "mousedown") {
                    mouseHandler.dragEnd(null, true);
                    event.stopEvent(e);
                } else if (dragInfo && e.keyCode == 17 || e.keyCode == 18) {
                    dragInfo.isCopy = e.type == "keydown";
                    dom.setCssClass(dragInfo.el, "copy", dragInfo.isCopy);
                }
            }
        }
    }
    function highlightFolder(tree, node, type) {
        tree.provider.markedFolder = node;
        tree.provider.markedFolderType = type;
        tree.renderer.$loop.schedule(tree.renderer.CHANGE_MARKER);
    }
    function isInRect(x, y, rect) {
        if (x < rect.right && x > rect.left && y > rect.top && y < rect.bottom) return true;
    }
    module.exports = initDragHandlers;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 543:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var event = __webpack_require__(631);
    function HeadingHandler(mouseHandler) {
        var editor = mouseHandler.editor;
        var headingLayer = editor.renderer.$headingLayer;
        event.addListener(headingLayer.element, "mousedown", mouseHandler.onMouseEvent.bind(mouseHandler, "headerMouseDown"));
        event.addListener(headingLayer.element, "mousemove", mouseHandler.onMouseEvent.bind(mouseHandler, "headerMouseMove"));
        var overResizer, dragStartPos, columnData;
        editor.setDefaultHandler("headerMouseMove", function(e) {
            if (dragStartPos || !editor.provider || !editor.provider.columns) return;
            var pos = e.getDocumentPosition();
            var width = editor.renderer.$size.scrollerWidth;
            if (width != editor.provider.columns.width) headingLayer.updateWidth(width);
            columnData = headingLayer.findColumn(pos.x);
            overResizer = columnData && columnData.overResizer;
            headingLayer.element.style.cursor = overResizer ? "ew-resize" : "default";
        });
        editor.setDefaultHandler("headerMouseDown", function(e) {
            if (overResizer) {
                var pos = e.getDocumentPosition();
                dragStartPos = {
                    x: pos.x
                };
                mouseHandler.setState("headerResize");
                mouseHandler.captureMouse(e);
                mouseHandler.mouseEvent = e;
            }
            e.stop();
        });
        mouseHandler.headerResize = function() {
            if (this.mouseEvent && dragStartPos) {
                var pos = this.mouseEvent.getDocumentPosition();
                var dx = pos.x // - dragStartPos.x;
                ;
                var columns = editor.renderer.provider.columns;
                for(var i = 0; i < columns.length; i++){
                    var col = columns[i];
                    dx -= col.pixelWidth;
                    if (col === columnData.column) break;
                }
                var total = editor.renderer.$size.scrollerWidth;
                headingLayer.changeColumnWidth(columnData.column, dx, total);
                var renderer = editor.renderer;
                renderer.updateFull();
            }
        };
        mouseHandler.headerResizeEnd = function() {
            dragStartPos = null;
            headingLayer.element.style.cursor = "";
            overResizer = false;
        };
    }
    exports.HeadingHandler = HeadingHandler;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 118:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var event = __webpack_require__(631);
    var useragent = __webpack_require__(943);
    /*
 * Custom Ace mouse event
 */ var MouseEvent = exports.MouseEvent = function(domEvent, editor) {
        this.domEvent = domEvent;
        this.editor = editor;
        this.x = this.clientX = domEvent.clientX;
        this.y = this.clientY = domEvent.clientY;
        this.$pos = null;
        this.$inSelection = null;
        this.propagationStopped = false;
        this.defaultPrevented = false;
    };
    (function() {
        this.stopPropagation = function() {
            event.stopPropagation(this.domEvent);
            this.propagationStopped = true;
        };
        this.preventDefault = function() {
            event.preventDefault(this.domEvent);
            this.defaultPrevented = true;
        };
        this.stop = function() {
            this.stopPropagation();
            this.preventDefault();
        };
        /*
     * Get the document position below the mouse cursor
     * 
     * @return {Object} 'row' and 'column' of the document position
     */ this.getDocumentPosition = function() {
            if (this.$pos) return this.$pos;
            this.$pos = this.editor.renderer.screenToTextCoordinates(this.clientX, this.clientY);
            return this.$pos;
        };
        /*
     * Check if the mouse cursor is inside of the text selection
     * 
     * @return {Boolean} whether the mouse cursor is inside of the selection
     */ this.inSelection = function() {
            if (this.$inSelection !== null) return this.$inSelection;
            var node = this.getNode();
            this.$inSelection = !!(node && node.isSelected);
            return this.$inSelection;
        };
        this.node = null;
        this.getNode = function(clip) {
            if (this.node) return this.node;
            var pos = this.getDocumentPosition(clip);
            if (!pos || !this.editor.provider) return; // Click outside cells
            return this.node = this.editor.provider.findItemAtOffset(pos.y, clip);
        };
        /*
     * Get the clicked mouse button
     * 
     * @return {Number} 0 for left button, 1 for middle button, 2 for right button
     */ this.getButton = function() {
            return event.getButton(this.domEvent);
        };
        /*
     * @return {Boolean} whether the shift key was pressed when the event was emitted
     */ this.getShiftKey = function() {
            return this.domEvent.shiftKey;
        };
        this.getAccelKey = useragent.isMac ? function() {
            return this.domEvent.metaKey;
        } : function() {
            return this.domEvent.ctrlKey;
        };
    }).call(MouseEvent.prototype);
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 202:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var event = __webpack_require__(631);
    var useragent = __webpack_require__(943);
    var DefaultHandlers = (__webpack_require__(127).DefaultHandlers);
    var initDragHandlers = __webpack_require__(513);
    var HeadingHandler = (__webpack_require__(543).HeadingHandler);
    var MouseEvent = (__webpack_require__(118).MouseEvent);
    var config = __webpack_require__(614);
    var MouseHandler = function(editor) {
        this.editor = editor;
        new DefaultHandlers(this);
        new HeadingHandler(this);
        initDragHandlers(this);
        var mouseTarget = editor.renderer.getMouseEventTarget();
        event.addListener(mouseTarget, "mousedown", function(e) {
            editor.focus(true);
            return event.preventDefault(e);
        });
        event.addListener(mouseTarget, "mousemove", this.onMouseEvent.bind(this, "mousemove"));
        event.addListener(mouseTarget, "mouseup", this.onMouseEvent.bind(this, "mouseup"));
        event.addMultiMouseDownListener(mouseTarget, [
            300,
            300,
            250
        ], this, "onMouseEvent");
        event.addMultiMouseDownListener(editor.renderer.scrollBarV.inner, [
            300,
            300,
            250
        ], this, "onMouseEvent");
        event.addMultiMouseDownListener(editor.renderer.scrollBarH.inner, [
            300,
            300,
            250
        ], this, "onMouseEvent");
        event.addMouseWheelListener(editor.container, this.onMouseWheel.bind(this, "mousewheel"));
        event.addListener(mouseTarget, "mouseout", this.onMouseEvent.bind(this, "mouseleave"));
    };
    (function() {
        this.onMouseEvent = function(name, e) {
            this.editor._emit(name, new MouseEvent(e, this.editor));
        };
        this.onMouseWheel = function(name, e) {
            var mouseEvent = new MouseEvent(e, this.editor);
            mouseEvent.speed = this.$scrollSpeed * 2;
            mouseEvent.wheelX = e.wheelX;
            mouseEvent.wheelY = e.wheelY;
            this.editor._emit(name, mouseEvent);
        };
        this.setState = function(state) {
            this.state = state;
        };
        this.captureMouse = function(ev, state) {
            if (state) this.setState(state);
            this.x = ev.x;
            this.y = ev.y;
            this.isMousePressed = 2;
            // do not move textarea during selection
            var renderer = this.editor.renderer;
            if (renderer.$keepTextAreaAtCursor) renderer.$keepTextAreaAtCursor = null;
            var self = this;
            var onMouseMove = function(e) {
                self.x = e.clientX;
                self.y = e.clientY;
                self.mouseEvent = new MouseEvent(e, self.editor);
                self.$mouseMoved = true;
            };
            var onCaptureEnd = function(e) {
                clearInterval(timerId);
                onCaptureInterval();
                self[self.state + "End"] && self[self.state + "End"](e);
                self.$clickSelection = null;
                if (renderer.$keepTextAreaAtCursor == null) {
                    renderer.$keepTextAreaAtCursor = true;
                    renderer.$moveTextAreaToCursor();
                }
                self.isMousePressed = false;
                e && self.onMouseEvent("mouseup", e);
                self.$onCaptureMouseMove = self.releaseMouse = null;
            };
            var onCaptureInterval = function() {
                self[self.state] && self[self.state]();
                self.$mouseMoved = false;
            };
            if (useragent.isOldIE && ev.domEvent.type == "dblclick") {
                return setTimeout(function() {
                    onCaptureEnd(ev.domEvent);
                });
            }
            self.$onCaptureMouseMove = onMouseMove;
            self.releaseMouse = event.capture(this.editor.container, onMouseMove, onCaptureEnd);
            var timerId = setInterval(onCaptureInterval, 20);
        };
        this.releaseMouse = null;
    }).call(MouseHandler.prototype);
    config.defineOptions(MouseHandler.prototype, "mouseHandler", {
        scrollSpeed: {
            initialValue: 2
        },
        dragDelay: {
            initialValue: 150
        },
        focusTimeout: {
            initialValue: 0
        },
        enableDragDrop: {
            initialValue: false
        }
    });
    exports.MouseHandler = MouseHandler;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 277:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var quickSearch = function(tree, str) {
        var node = tree.selection.getCursor();
        var siblings = tree.provider.getChildren(node.parent);
        if (!siblings || siblings.length == 1) {
            return;
        }
        var index = siblings.indexOf(node);
        var newNode;
        for(var i = index + 1; i < siblings.length; i++){
            node = siblings[i];
            var label = node.label || node.name || "";
            if (label[0] == str) {
                newNode = node;
                break;
            }
        }
        if (!newNode) {
            for(var i = 0; i < index; i++){
                node = siblings[i];
                var label = node.label || node.name || "";
                if (label[0] == str) {
                    newNode = node;
                    break;
                }
            }
        }
        if (newNode) {
            tree.selection.selectNode(newNode);
            tree.renderer.scrollCaretIntoView(newNode, 0.5);
        }
    };
    module.exports = quickSearch;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 541:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * The main class required to set up a Tree instance in the browser.
 *
 * @class Tree
 **/ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var oop = __webpack_require__(645);
    var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);
    var scrollable = {};
    (function() {
        oop.implement(this, EventEmitter);
        this.$scrollTop = 0;
        this.getScrollTop = function() {
            return this.$scrollTop;
        };
        this.setScrollTop = function(scrollTop) {
            scrollTop = Math.round(scrollTop);
            if (this.$scrollTop === scrollTop || isNaN(scrollTop)) return;
            this.$scrollTop = scrollTop;
            this._signal("changeScrollTop", scrollTop);
        };
        this.$scrollLeft = 0;
        this.getScrollLeft = function() {
            return this.$scrollLeft;
        };
        this.setScrollLeft = function(scrollLeft) {
            scrollLeft = Math.round(scrollLeft);
            if (this.$scrollLeft === scrollLeft || isNaN(scrollLeft)) return;
            this.$scrollLeft = scrollLeft;
            this._signal("changeScrollLeft", scrollLeft);
        };
    }).call(scrollable);
    module.exports = scrollable;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 592:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var oop = __webpack_require__(645);
    var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);
    var Selection = function(provider) {
        this.provider = provider;
        if (this.provider && !this.provider.selectedItems) this.provider.selectedItems = [];
        this.provider.on("remove", this.unselectRemoved = this.unselectRemoved.bind(this));
    };
    (function() {
        oop.implement(this, EventEmitter);
        this.$wrapAround = false;
        this.getRange = function() {};
        this.selectAll = function() {
            var sel = this.provider.selectedItems;
            this.expandSelection(sel[0], sel[sel.length - 1]);
            this._signal("change");
        };
        this.moveSelection = function(dir, select, add) {
            var provider = this.provider;
            var cursor = this.getCursor();
            var anchor = this.getAnchor();
            var i = provider.getIndexForNode(cursor);
            if (!add) {
                this.clear(true);
            } else if (add && !select) {
                this.unselectNode(cursor);
            }
            var min = provider.getMinIndex();
            var max = provider.getMaxIndex();
            var wrapped = false;
            var newI = i;
            do {
                newI += dir;
                if (newI < min) {
                    newI = this.$wrapAround ? max : min;
                    wrapped = true;
                } else if (newI > max) {
                    newI = this.$wrapAround ? min : max;
                    wrapped = true;
                }
                var newNode = provider.getNodeAtIndex(newI);
            }while (!wrapped && newNode && !provider.isSelectable(newNode))
            if (!newNode || !provider.isSelectable(newNode)) newNode = cursor;
            if (select) {
                this.expandSelection(newNode, anchor, add);
            } else {
                this.selectNode(newNode, add);
            }
        };
        this.getCursor = function() {
            var sel = this.provider.selectedItems;
            return sel.cursor || sel[sel.length - 1];
        };
        this.getAnchor = function() {
            var sel = this.provider.selectedItems;
            return sel.anchor || sel.cursor || sel[0];
        };
        this.getSelectedNodes = function() {
            var sel = this.provider.selectedItems;
            return sel.slice();
        };
        this.getVisibleSelectedNodes = function() {
            var provider = this.provider;
            var sel = provider.selectedItems;
            return sel.filter(function(node) {
                return provider.isVisible(node);
            });
        };
        this.isEmpty = function() {
            var sel = this.provider.selectedItems;
            return sel.length === 0;
        };
        this.isMultiRow = function() {
            var sel = this.provider.selectedItems;
            return sel.length > 1;
        };
        this.toggleSelect = function(node) {
            var provider = this.provider;
            var sel = provider.selectedItems;
            var i = sel.indexOf(node);
            if (i != -1) sel.splice(i, 1);
            provider.setSelected(node, !provider.isSelected(node));
            if (provider.isSelected(node)) {
                sel.push(node);
                sel.anchor = sel.cursor = node;
            } else sel.anchor = sel.cursor = sel[sel.length - 1];
            this._signal("change");
        };
        this.selectNode = function(node, add, silent) {
            var provider = this.provider;
            var sel = provider.selectedItems;
            if (!provider.isSelectable(node)) return;
            if (!add) this.clear(true);
            if (node) {
                var i = sel.indexOf(node);
                if (i != -1) sel.splice(i, 1);
                provider.setSelected(node, true);
                if (provider.isSelected(node)) sel.push(node);
            }
            sel.anchor = sel.cursor = node;
            this._signal("change");
        };
        this.add = function(node) {
            this.selectNode(node, true);
        };
        this.remove = function(node) {
            if (this.provider.isSelected(node)) this.toggleSelect(node);
        };
        this.clear = this.clearSelection = function(silent) {
            var provider = this.provider;
            var sel = provider.selectedItems;
            sel.forEach(function(node) {
                provider.setSelected(node, false);
            });
            sel.splice(0, sel.length);
            sel.anchor = sel.cursor;
            silent || this._signal("change");
        };
        this.unselectNode = function(node, silent) {
            var provider = this.provider;
            var sel = provider.selectedItems;
            var i = sel.indexOf(node);
            if (i != -1) {
                sel.splice(i, 1);
                provider.setSelected(node, false);
                if (sel.anchor == node) sel.anchor = sel[i - 1] || sel[i];
                if (sel.cursor == node) sel.cursor = sel[i] || sel[i - 1];
                silent || this._signal("change");
            }
        };
        this.setSelection = function(nodes) {
            if (Array.isArray(nodes)) {
                this.clear(true);
                nodes.forEach(function(node) {
                    this.selectNode(node, true, true);
                }, this);
            } else this.selectNode(nodes, false, true);
        };
        this.expandSelection = function(cursor, anchor, additive) {
            anchor = anchor || this.getAnchor();
            if (!additive) this.clear(true);
            var provider = this.provider;
            var sel = provider.selectedItems;
            var end = provider.getIndexForNode(cursor);
            var start = provider.getIndexForNode(anchor || cursor);
            if (end > start) {
                for(var i = start; i <= end; i++){
                    var node = provider.getNodeAtIndex(i);
                    var index = sel.indexOf(node);
                    if (index != -1) sel.splice(index, 1);
                    if (provider.isSelectable(node)) provider.setSelected(node, true);
                    sel.push(node);
                }
            } else {
                for(var i = start; i >= end; i--){
                    var node = provider.getNodeAtIndex(i);
                    var index = sel.indexOf(node);
                    if (index != -1) sel.splice(index, 1);
                    if (provider.isSelectable(node)) provider.setSelected(node, true);
                    sel.push(node);
                }
            }
            sel.cursor = cursor;
            sel.anchor = anchor;
            this._signal("change");
        };
        this.unselectRemoved = function(toRemove) {
            var sel = this.getSelectedNodes();
            var provider = this.provider;
            var changed, cursor = this.getCursor();
            sel.forEach(function(n) {
                if (provider.isAncestor(toRemove, n)) {
                    changed = true;
                    this.unselectNode(n, true);
                }
            }, this);
            if (changed && !provider.isSelected(cursor)) {
                var parent = toRemove.parent;
                var ch = [];
                if (parent && provider.isOpen(parent)) {
                    ch = provider.getChildren(parent);
                    var i = ch.indexOf(toRemove);
                }
                if (i == -1) {
                    i = toRemove.index;
                    var node = ch[i] || ch[i - 1] || parent;
                } else {
                    node = ch[i + 1] || ch[i - 1] || parent;
                }
                if (node == provider.root) node = ch[0] || node;
                if (node) this.selectNode(node, true);
                this._signal("change");
            }
        };
    }).call(Selection.prototype);
    exports.Selection = Selection;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 336:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * The main class required to set up a Tree instance in the browser.
 *
 * @class Tree
 **/ !(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    // var UndoManager = require("./undomanager").UndoManager;
    var Renderer = (__webpack_require__(743).VirtualRenderer);
    // var MultiSelect = require("./multi_select").MultiSelect;
    exports.config = __webpack_require__(614);
    var oop = __webpack_require__(645);
    var lang = __webpack_require__(955);
    var useragent = __webpack_require__(943);
    var TextInput = (__webpack_require__(984)/* .TextInput */ .k);
    var MouseHandler = (__webpack_require__(202).MouseHandler);
    var KeyBinding = (__webpack_require__(957)/* .KeyBinding */ .$);
    var Selection = (__webpack_require__(592).Selection);
    var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);
    var CommandManager = (__webpack_require__(379)/* .CommandManager */ .F);
    var defaultCommands = (__webpack_require__(677).commands);
    var config = __webpack_require__(614);
    var quickSearch = __webpack_require__(277);
    /**
 * @class Tree
 **/ /**
 * Creates a new `Tree` object.
 * @param {Object} element The html element the Tree table renders in.
 *
 *
 * @constructor
 **/ var Tree = function(element, cellWidth, cellHeight) {
        this.$toDestroy = [];
        this.cellWidth = cellWidth || 80;
        this.cellHeight = cellHeight || 24;
        this.renderer = new Renderer(element, this.cellWidth, this.cellHeight);
        this.container = this.renderer.container;
        this.commands = new CommandManager(useragent.isMac ? "mac" : "win", defaultCommands);
        this.textInput = new TextInput(this.container, this);
        this.keyBinding = new KeyBinding(this);
        // TODO detect touch event support
        this.$mouseHandler = new MouseHandler(this);
        this.$blockScrolling = 0;
        var _self = this;
        this.renderer.on("edit", function(e) {
            _self._emit("edit", e);
        });
        this.commands.on("exec", (function() {
            this.selectionChanged = false;
        }).bind(this));
        this.commands.on("afterExec", (function() {
            if (this.selectionChanged) {
                this.selectionChanged = false;
                this.renderer.scrollCaretIntoView();
                this._signal("userSelect");
            }
        }).bind(this));
        this.on("changeSelection", (function() {
            if (this.$mouseHandler.isMousePressed) this._signal("userSelect");
        }).bind(this));
        // var Tooltip = require("./tooltip")
        // new Tooltip(this)
        config.resetOptions(this);
        config._emit("Tree", this);
    };
    (function() {
        oop.implement(this, EventEmitter);
        /**
     *
     **/ this.setDataProvider = function(provider) {
            if (this.provider) {
                var oldProvider = this.provider;
                // this.session.off("changeScrollLeft", this.$onScrollLeftChange);
                this.selection.off("changeCaret", this.$onCaretChange);
                this.selection.off("change", this.$onSelectionChange);
                oldProvider.off("changeClass", this.$onChangeClass);
                oldProvider.off("expand", this.$redraw);
                oldProvider.off("collapse", this.$redraw);
                oldProvider.off("change", this.$redraw);
                oldProvider.off("changeScrollTop", this.$onScrollTopChange);
                oldProvider.off("changeScrollLeft", this.$onScrollLeftChange);
            }
            this.provider = provider;
            this.model = provider; // TODO remove provider in favor of model
            if (provider) {
                this.renderer.setDataProvider(provider);
                // this.$onScrollLeftChange = this.onScrollLeftChange.bind(this);
                // this.session.on("changeScrollLeft", this.$onScrollLeftChange);
                if (!this.$redraw) this.$redraw = this.redraw.bind(this);
                this.provider.on("expand", this.$redraw);
                this.provider.on("collapse", this.$redraw);
                this.provider.on("change", this.$redraw);
                // FIXME
                if (!this.provider.selection) {
                    this.provider.selection = new Selection(this.provider);
                }
                this.selection = this.provider.selection;
                this.$onCaretChange = this.onCaretChange.bind(this);
                this.selection.on("changeCaret", this.$onCaretChange);
                this.$onChangeClass = this.$onChangeClass.bind(this);
                this.provider.on("changeClass", this.$onChangeClass);
                this.$onSelectionChange = this.onSelectionChange.bind(this);
                this.selection.on("change", this.$onSelectionChange);
                this.$onScrollTopChange = this.onScrollTopChange.bind(this);
                this.provider.on("changeScrollTop", this.$onScrollTopChange);
                this.$onScrollLeftChange = this.onScrollLeftChange.bind(this);
                this.provider.on("changeScrollLeft", this.$onScrollLeftChange);
                this.$blockScrolling += 1;
                this.onCaretChange();
                this.$blockScrolling -= 1;
                this.onScrollTopChange();
                this.onScrollLeftChange();
                this.onSelectionChange();
                this.renderer.updateFull();
            }
            this._emit("changeDataProvider", {
                provider: provider,
                oldProvider: oldProvider
            });
        };
        this.redraw = function() {
            this.renderer.updateFull();
        };
        this.getLength = function() {
            return 0; // this.renderer.$treeLayer.length;
        };
        this.getLine = function(row) {
            return {
                length: 0 // this.renderer.$horHeadingLayer.length - 1
            };
        };
        /**
     * Returns the current session being used.
     **/ this.getDataProvider = function() {
            return this.provider;
        };
        /**
     *
     * Returns the currently highlighted selection.
     * @returns {String} The highlighted selection
     **/ this.getSelection = function() {
            return this.selection;
        };
        /**
     * {:VirtualRenderer.onResize}
     * @param {Boolean} force If `true`, recomputes the size, even if the height and width haven't changed
     *
     *
     * @related VirtualRenderer.onResize
     **/ this.resize = function(force) {
            this.renderer.onResize(force);
        };
        /**
     *
     * Brings the current `textInput` into focus.
     **/ this.focus = function(once) {
            // Safari needs the timeout
            // iOS and Firefox need it called immediately
            // to be on the save side we do both
            var _self = this;
            once || setTimeout(function() {
                _self.textInput.focus();
            });
            this.textInput.focus();
        };
        /**
     * Returns `true` if the current `textInput` is in focus.
     * @return {Boolean}
     **/ this.isFocused = function() {
            return this.textInput.isFocused();
        };
        /**
     *
     * Blurs the current `textInput`.
     **/ this.blur = function() {
            this.textInput.blur();
        };
        /**
     * Emitted once the editor comes into focus.
     * @event focus
     *
     *
     **/ this.onFocus = function() {
            if (this.$isFocused) return;
            this.$isFocused = true;
            this.renderer.visualizeFocus();
            this._emit("focus");
        };
        /**
     * Emitted once the editor has been blurred.
     * @event blur
     *
     *
     **/ this.onBlur = function() {
            if (!this.$isFocused) return;
            this.$isFocused = false;
            this.renderer.visualizeBlur();
            this._emit("blur");
        };
        this.onScrollTopChange = function() {
            this.renderer.scrollToY(this.provider.getScrollTop());
        };
        this.onScrollLeftChange = function() {
            this.renderer.scrollToX(this.renderer.getScrollLeft());
        };
        this.$onChangeClass = function() {
            this.renderer.updateCaret();
        };
        /**
     * Emitted when the selection changes.
     *
     **/ this.onCaretChange = function() {
            this.$onChangeClass();
            if (!this.$blockScrolling) this.selectionChanged = true;
            this._emit("changeSelection");
        };
        this.onSelectionChange = function(e) {
            this.onCaretChange();
        };
        this.execCommand = function(command, args) {
            this.commands.exec(command, this, args);
        };
        this.onTextInput = function(text) {
            this.keyBinding.onTextInput(text);
        };
        this.onCommandKey = function(e, hashId, keyCode) {
            this.keyBinding.onCommandKey(e, hashId, keyCode);
        };
        this.insertSting = function(str) {
            if (this.startFilter) return this.startFilter(str);
            quickSearch(this, str);
        };
        this.setTheme = function(theme) {
            this.renderer.setTheme(theme);
        };
        /**
     * Returns an object indicating the currently selected rows. The object looks like this:
     *
     * ```json
     * { first: range.start.row, last: range.end.row }
     * ```
     *
     * @returns {Object}
     **/ this.$getSelectedRows = function() {
            var range = this.getSelectionRange().collapseRows();
            return {
                first: range.start.row,
                last: range.end.row
            };
        };
        /**
     * {:VirtualRenderer.getVisibleNodes}
     * @param {Number} tolerance fraction of the node allowed to be hidden while node still considered visible (default 1/3)
     * @returns {Array}
     * @related VirtualRenderer.getVisibleNodes
     **/ this.getVisibleNodes = function(tolerance) {
            return this.renderer.getVisibleNodes(tolerance);
        };
        /**
     * Indicates if the node is currently visible on the screen.
     * @param {Object} node The node to check
     * @param {Number} tolerance fraction of the node allowed to be hidden while node still considered visible (default 1/3)
     *
     * @returns {Boolean}
     **/ this.isNodeVisible = function(node, tolerance) {
            return this.renderer.isNodeVisible(node, tolerance);
        };
        this.$moveByPage = function(dir, select) {
            var renderer = this.renderer;
            var config = this.renderer.layerConfig;
            config.lineHeight = this.provider.rowHeight;
            var rows = dir * Math.floor(config.height / config.lineHeight);
            this.$blockScrolling++;
            this.selection.moveSelection(rows, select);
            this.$blockScrolling--;
            var scrollTop = renderer.scrollTop;
            renderer.scrollBy(0, rows * config.lineHeight);
            if (select != null) renderer.scrollCaretIntoView(null, 0.5);
            renderer.animateScrolling(scrollTop);
        };
        /**
     * Selects the text from the current position of the document until where a "page down" finishes.
     **/ this.selectPageDown = function() {
            this.$moveByPage(1, true);
        };
        /**
     * Selects the text from the current position of the document until where a "page up" finishes.
     **/ this.selectPageUp = function() {
            this.$moveByPage(-1, true);
        };
        /**
     * Shifts the document to wherever "page down" is, as well as moving the cursor position.
     **/ this.gotoPageDown = function() {
            this.$moveByPage(1, false);
        };
        /**
     * Shifts the document to wherever "page up" is, as well as moving the cursor position.
     **/ this.gotoPageUp = function() {
            this.$moveByPage(-1, false);
        };
        /**
     * Scrolls the document to wherever "page down" is, without changing the cursor position.
     **/ this.scrollPageDown = function() {
            this.$moveByPage(1);
        };
        /**
     * Scrolls the document to wherever "page up" is, without changing the cursor position.
     **/ this.scrollPageUp = function() {
            this.$moveByPage(-1);
        };
        /**
     * Scrolls to a row. If `center` is `true`, it puts the row in middle of screen (or attempts to).
     * @param {Number} row The row to scroll to
     * @param {Boolean} center If `true`
     * @param {Boolean} animate If `true` animates scrolling
     * @param {Function} callback Function to be called when the animation has finished
     *
     *
     * @related VirtualRenderer.scrollToRow
     **/ this.scrollToRow = function(row, center, animate, callback) {
            this.renderer.scrollToRow(row, center, animate, callback);
        };
        /**
     * Attempts to center the current selection on the screen.
     **/ this.centerSelection = function() {
            var range = this.getSelectionRange();
            var pos = {
                row: Math.floor(range.start.row + (range.end.row - range.start.row) / 2),
                column: Math.floor(range.start.column + (range.end.column - range.start.column) / 2)
            };
            this.renderer.alignCaret(pos, 0.5);
        };
        /**
     * Gets the current position of the Caret.
     * @returns {Object} An object that looks something like this:
     *
     * ```json
     * { row: currRow, column: currCol }
     * ```
     *
     * @related Selection.getCursor
     **/ this.getCursorPosition = function() {
            return this.selection.getCursor();
        };
        /**
     * Returns the screen position of the Caret.
     * @returns {Number}
     **/ this.getCursorPositionScreen = function() {
            return this.session.documentToScreenPosition(this.getCursorPosition());
        };
        /**
     * {:Selection.getRange}
     * @returns {Range}
     * @related Selection.getRange
     **/ this.getSelectionRange = function() {
            return this.selection.getRange();
        };
        /**
     * Selects all the text in editor.
     * @related Selection.selectAll
     **/ this.selectAll = function() {
            this.$blockScrolling += 1;
            this.selection.selectAll();
            this.$blockScrolling -= 1;
        };
        /**
     * {:Selection.clearSelection}
     * @related Selection.clearSelection
     **/ this.clearSelection = function() {
            this.selection.clearSelection();
        };
        /**
     * Moves the Caret to the specified row and column. Note that this does not de-select the current selection.
     * @param {Number} row The new row number
     * @param {Number} column The new column number
     *
     *
     * @related Selection.moveCaretTo
     **/ this.moveCaretTo = function(row, column) {
            this.selection.moveCaretTo(row, column);
        };
        /**
     * Moves the Caret to the position indicated by `pos.row` and `pos.column`.
     * @param {Object} pos An object with two properties, row and column
     *
     *
     * @related Selection.moveCaretToPosition
     **/ this.moveCaretToPosition = function(pos) {
            this.selection.moveCaretToPosition(pos);
        };
        /**
     * Moves the Caret to the specified row number, and also into the indiciated column.
     * @param {Number} rowNumber The row number to go to
     * @param {Number} column A column number to go to
     * @param {Boolean} animate If `true` animates scolling
     *
     **/ this.gotoRow = function(rowNumber, column, animate) {
            this.selection.clearSelection();
            if (column === undefined) column = this.selection.getCursor().column;
            this.$blockScrolling += 1;
            this.moveCaretTo(rowNumber - 1, column || 0);
            this.$blockScrolling -= 1;
            if (!this.isRowFullyVisible(rowNumber - 1)) this.scrollToRow(rowNumber - 1, true, animate);
        };
        /**
     * Moves the Caret to the specified row and column. Note that this does de-select the current selection.
     * @param {Number} row The new row number
     * @param {Number} column The new column number
     *
     *
     * @related Editor.moveCaretTo
     **/ this.navigateTo = function(row, column) {
            this.clearSelection();
            this.moveCaretTo(row, column);
        };
        /**
     * Moves the Caret up in the document the specified number of times. Note that this does de-select the current selection.
     * @param {Number} times The number of times to change navigation
     *
     *
     **/ this.navigateUp = function() {
            var node = this.provider.navigate("up");
            node && this.selection.setSelection(node);
            this.$scrollIntoView();
        };
        /**
     * Moves the Caret down in the document the specified number of times. Note that this does de-select the current selection.
     * @param {Number} times The number of times to change navigation
     *
     *
     **/ this.navigateDown = function() {
            var node = this.provider.navigate("down");
            node && this.selection.setSelection(node);
        };
        /**
     * Moves the Caret left in the document the specified number of times. Note that this does de-select the current selection.
     **/ this.navigateLevelUp = function(toggleNode) {
            var node = this.selection.getCursor();
            if (!node) {
            // continue
            } else if (toggleNode && this.provider.isOpen(node)) {
                this.provider.close(node);
            } else {
                this.selection.setSelection(node.parent);
            }
        };
        /**
     * Moves the Caret right in the document the specified number of times. Note that this does de-select the current selection.
     **/ this.navigateLevelDown = function() {
            var node = this.selection.getCursor();
            var hasChildren = this.provider.hasChildren(node);
            if (!hasChildren || this.provider.isOpen(node)) return this.selection.moveSelection(1);
            this.provider.open(node);
        };
        this.navigateStart = function() {
            var node = this.getFirstNode();
            this.selection.setSelection(node);
        };
        this.navigateEnd = function() {
            var node = this.getLastNode();
            this.selection.setSelection(node);
        };
        this.getFirstNode = function() {
            var index = this.provider.getMinIndex();
            return this.provider.getNodeAtIndex(index);
        };
        this.getLastNode = function() {
            var index = this.provider.getMaxIndex();
            return this.provider.getNodeAtIndex(index);
        };
        this.$scrollIntoView = function(node) {
            this.renderer.scrollCaretIntoView();
        };
        this.select = function(node) {
            this.selection.setSelection(node);
        };
        this.getCopyText = function(node) {
            return "";
        };
        this.onPaste = function(node) {
            return "";
        };
        this.reveal = function(node, animate) {
            var provider = this.provider;
            var parent = node.parent;
            while(parent){
                if (!provider.isOpen(parent)) provider.expand(parent);
                parent = parent.parent;
            }
            this.select(node);
            var scrollTop = this.renderer.scrollTop;
            this.renderer.scrollCaretIntoView(node, 0.5);
            if (animate !== false) this.renderer.animateScrolling(scrollTop);
        };
        /**
     * {:UndoManager.undo}
     * @related UndoManager.undo
     **/ this.undo = function() {
            this.$blockScrolling++;
            this.session.getUndoManager().undo();
            this.$blockScrolling--;
            this.renderer.scrollCaretIntoView(null, 0.5);
        };
        /**
     * {:UndoManager.redo}
     * @related UndoManager.redo
     **/ this.redo = function() {
            this.$blockScrolling++;
            this.session.getUndoManager().redo();
            this.$blockScrolling--;
            this.renderer.scrollCaretIntoView(null, 0.5);
        };
        /**
     * Returns `true` if the editor is set to read-only mode.
     * @returns {Boolean}
     **/ this.getReadOnly = function() {
            return this.getOption("readOnly");
        };
        /**
     *
     * Cleans up the entire editor.
     **/ this.destroy = function() {
            this.renderer.destroy();
            this._emit("destroy", this);
        };
        this.setHorHeadingVisible = function(value) {
            this.renderer.setHorHeadingVisible(value);
        };
        this.setVerHeadingVisible = function(value) {
            this.renderer.setVerHeadingVisible(value);
        };
        this.enable = function() {
            this.$disabled = false;
            this.container.style.pointerEvents = "";
            this.container.style.opacity = "";
        };
        this.disable = function() {
            this.$disabled = true;
            this.container.style.pointerEvents = "none";
            this.container.style.opacity = "0.9";
            if (this.isFocused()) this.blur();
        };
    }).call(Tree.prototype);
    config.defineOptions(Tree.prototype, "Tree", {
        toggle: {
            set: function(toggle) {},
            initialValue: false
        },
        readOnly: {
            set: function(readOnly) {
                this.textInput.setReadOnly(readOnly);
            },
            initialValue: false
        },
        animatedScroll: "renderer",
        maxLines: "renderer",
        minLines: "renderer",
        scrollSpeed: "$mouseHandler",
        enableDragDrop: "$mouseHandler"
    });
    module.exports = Tree;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 743:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(require, exports, module) {
    "use strict";
    var oop = __webpack_require__(645);
    var dom = __webpack_require__(435);
    var config = __webpack_require__(614);
    var CellLayer = (__webpack_require__(365).Cells);
    var MarkerLayer = (__webpack_require__(611).Selection);
    var HeaderLayer = (__webpack_require__(86).ColumnHeader);
    var ScrollBarH = (__webpack_require__(745)/* .ScrollBarH */ .zy);
    var ScrollBarV = (__webpack_require__(745)/* .ScrollBarV */ .lc);
    var RenderLoop = (__webpack_require__(481)/* .RenderLoop */ .x);
    var EventEmitter = (__webpack_require__(366)/* .EventEmitter */ .b);
    var pivotCss = __webpack_require__(268);
    dom.importCssString(pivotCss, "ace_tree");
    var defaultTheme = __webpack_require__(768);
    /**
 * The class that is responsible for drawing everything you see on the screen!
 * @class VirtualRenderer
 **/ /**
 * Constructs a new `VirtualRenderer` within the `container` specified, applying the given `theme`.
 * @param {DOMElement} container The root element of the editor
 * @param {Number} cellWidth The default width of a cell in pixels 
 * @param {Number} cellHeight The default height of a cell in pixels 
 *
 * @constructor
 **/ var VirtualRenderer = function(container, cellWidth, cellHeight) {
        var _self = this;
        this.container = container || dom.createElement("div");
        dom.addCssClass(this.container, "ace_tree");
        dom.addCssClass(this.container, "ace_tree");
        // this.setTheme(this.$theme);
        this.scroller = dom.createElement("div");
        this.scroller.className = "ace_tree_scroller";
        this.container.appendChild(this.scroller);
        this.cells = dom.createElement("div");
        this.cells.className = "ace_tree_cells";
        this.scroller.appendChild(this.cells);
        this.$headingLayer = new HeaderLayer(this.container, this);
        this.$markerLayer = new MarkerLayer(this.cells, this);
        this.$cellLayer = new CellLayer(this.cells);
        this.canvas = this.$cellLayer.element;
        // Indicates whether the horizontal scrollbarscrollbar is visible
        this.$horizScroll = false;
        this.scrollBarV = new ScrollBarV(this.container, this);
        this.scrollBarV.setVisible(true);
        this.scrollBarV.addEventListener("scroll", function(e) {
            if (!_self.$inScrollAnimation) _self.setScrollTop(e.data - _self.scrollMargin.top);
        });
        this.scrollBarH = new ScrollBarH(this.container, this);
        this.scrollBarH.addEventListener("scroll", function(e) {
            if (!_self.$inScrollAnimation) _self.setScrollLeft(e.data);
        });
        this.scrollTop = 0;
        this.scrollLeft = 0;
        this.caretPos = {
            row: 0,
            column: 0
        };
        this.$size = {
            width: 0,
            height: 0,
            scrollerHeight: 0,
            scrollerWidth: 0,
            headingHeight: 0
        };
        this.layerConfig = {
            width: 1,
            padding: 0,
            firstRow: 0,
            firstRowScreen: 0,
            lastRow: 0,
            lineHeight: 1,
            characterWidth: 1,
            minHeight: 1,
            maxHeight: 1,
            offset: 0,
            height: 1
        };
        this.scrollMargin = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            v: 0,
            h: 0
        };
        this.$scrollIntoView = null;
        this.$loop = new RenderLoop(this.$renderChanges.bind(this), this.container.ownerDocument.defaultView);
        this.$loop.schedule(this.CHANGE_FULL);
        this.setTheme(defaultTheme);
        this.$windowFocus = this.$windowFocus.bind(this);
        window.addEventListener("focus", this.$windowFocus);
    };
    (function() {
        this.CHANGE_SCROLL = 1;
        this.CHANGE_COLUMN = 2;
        this.CHANGE_ROW = 4;
        this.CHANGE_CELLS = 8;
        this.CHANGE_SIZE = 16;
        this.CHANGE_CLASS = 32;
        this.CHANGE_MARKER = 64;
        this.CHANGE_FULL = 128;
        this.CHANGE_H_SCROLL = 1024;
        oop.implement(this, EventEmitter);
        /**
     *
     * Associates the renderer with an DataProvider.
     **/ this.setDataProvider = function(provider) {
            this.provider = provider;
            this.model = provider;
            if (this.scrollMargin.top && provider && provider.getScrollTop() <= 0) provider.setScrollTop(-this.scrollMargin.top);
            this.scroller.className = "ace_tree_scroller";
            this.$cellLayer.setDataProvider(provider);
            this.$markerLayer.setDataProvider(provider);
            this.$headingLayer.setDataProvider(provider);
            this.$size.headingHeight = provider && provider.columns ? provider.headerHeight || provider.rowHeight : 0;
            this.$loop.schedule(this.CHANGE_FULL);
        };
        /**
     * Triggers a partial update of the text, from the range given by the two parameters.
     * @param {Number} firstRow The first row to update
     * @param {Number} lastRow The last row to update
     *
     *
     **/ this.updateRows = function(firstRow, lastRow) {
            if (lastRow === undefined) lastRow = Infinity;
            if (!this.$changedLines) {
                this.$changedLines = {
                    firstRow: firstRow,
                    lastRow: lastRow
                };
            } else {
                if (this.$changedLines.firstRow > firstRow) this.$changedLines.firstRow = firstRow;
                if (this.$changedLines.lastRow < lastRow) this.$changedLines.lastRow = lastRow;
            }
            if (this.$changedLines.firstRow > this.layerConfig.lastRow || this.$changedLines.lastRow < this.layerConfig.firstRow) return;
            this.$loop.schedule(this.CHANGE_ROW);
        };
        this.updateCaret = function() {
            this.$loop.schedule(this.CHANGE_CLASS);
        };
        /**
     * Triggers a full update of the text, for all the rows.
     **/ this.updateCells = function() {
            this.$loop.schedule(this.CHANGE_CELLS);
        };
        /**
     * Triggers a full update of all the layers, for all the rows.
     * @param {Boolean} force If `true`, forces the changes through
     *
     *
     **/ this.updateFull = function(force) {
            if (force) this.$renderChanges(this.CHANGE_FULL, true);
            else this.$loop.schedule(this.CHANGE_FULL);
        };
        this.updateHorizontalHeadings = function() {
            this.$loop.schedule(this.CHANGE_COLUMN);
        };
        this.updateVerticalHeadings = function() {
            this.$loop.schedule(this.CHANGE_ROW);
        };
        this.$changes = 0;
        /**
    * [Triggers a resize of the editor.]{: #VirtualRenderer.onResize}
    * @param {Boolean} force If `true`, recomputes the size, even if the height and width haven't changed
    * @param {Number} width The width of the editor in pixels
    * @param {Number} height The hiehgt of the editor, in pixels
    *
    *
    **/ this.onResize = function(force, width, height) {
            if (this.resizing > 2) return;
            else if (this.resizing > 0) this.resizing++;
            else this.resizing = force ? 1 : 0;
            // `|| el.scrollHeight` is required for outosizing editors on ie
            // where elements with clientHeight = 0 alsoe have clientWidth = 0
            var el = this.container;
            if (!height) height = el.clientHeight || el.scrollHeight;
            if (!width) width = el.clientWidth || el.scrollWidth;
            var changes = this.$updateCachedSize(force, width, height);
            if (!this.$size.scrollerHeight || !width && !height) return this.resizing = 0;
            if (force) this.$renderChanges(changes, true);
            else this.$loop.schedule(changes | this.$changes);
            if (this.resizing) this.resizing = 0;
        };
        this.$windowFocus = function() {
            this.onResize();
        };
        this.$updateCachedSize = function(force, width, height) {
            var changes = 0;
            var size = this.$size;
            var provider = this.provider;
            if (provider) {
                var headingHeight = provider.columns ? provider.headerHeight || provider.rowHeight : 0;
                if (headingHeight != size.headingHeight) {
                    size.headingHeight = headingHeight;
                    changes |= this.CHANGE_SIZE;
                }
            }
            if (height && (force || size.height != height)) {
                size.height = height;
                changes |= this.CHANGE_SIZE;
                size.scrollerHeight = size.height;
                if (this.$horizScroll) size.scrollerHeight -= this.scrollBarH.getHeight();
                //if (this.heading) {
                size.scrollerHeight -= size.headingHeight;
                // }
                this.$headingLayer.element.style.height = this.scroller.style.top = this.scrollBarV.element.style.top = size.headingHeight + "px";
                // this.scrollBarV.setHeight(size.scrollerHeight);
                this.scrollBarV.element.style.bottom = this.scrollBarH.getHeight() + "px";
                if (provider && provider.setScrollTop) {
                    // provider.setScrollTop(this.getScrollTop());
                    changes |= this.CHANGE_SCROLL;
                }
                if (this.$scrollIntoView) {
                    if (this.$scrollIntoView.model == this.model) {
                        this.scrollCaretIntoView(this.$scrollIntoView.caret, this.$scrollIntoView.offset);
                        this.$scrollIntoView = null;
                    }
                }
            }
            if (width && (force || size.width != width)) {
                changes |= this.CHANGE_SIZE;
                size.width = width;
                this.scrollBarH.element.style.left = this.scroller.style.left = 0 + "px";
                size.scrollerWidth = Math.max(0, width - this.scrollBarV.getWidth());
                this.$headingLayer.element.style.right = this.scrollBarH.element.style.right = this.scroller.style.right = this.scrollBarV.getWidth() + "px";
                this.scroller.style.bottom = this.scrollBarH.getHeight() + "px";
                // this.scrollBarH.element.style.setWidth(size.scrollerWidth);
                this.$headingLayer.updateWidth(size.scrollerWidth);
                if (provider && provider.columns) changes |= this.CHANGE_FULL;
            }
            if (changes) this._signal("resize");
            return changes;
        };
        this.setVerHeadingVisible = function(value) {
            this.$treeLayer.visible = value;
            if (this.layerConfig.vRange && this.layerConfig.hRange) {
                this.$renderChanges(this.CHANGE_FULL, true);
                this.onResize(true);
            }
        };
        /**
     *
     * Returns the root element containing this renderer.
     * @returns {DOMElement}
     **/ this.getContainerElement = function() {
            return this.container;
        };
        /**
     *
     * Returns the element that the mouse events are attached to
     * @returns {DOMElement}
     **/ this.getMouseEventTarget = function() {
            return this.scroller;
        };
        /**
     * [Returns array of nodes currently visible on the screen]{: #VirtualRenderer.getVisibleNodes}
     * @param {Object} node Tree node
     * @param {Number} tolerance fraction of the node allowed to be hidden while node still considered visible (default 1/3)
     * @returns {Array}
     **/ this.getVisibleNodes = function(tolerance) {
            var nodes = this.layerConfig.vRange;
            var first = 0;
            var last = nodes.length - 1;
            while(this.isNodeVisible(nodes[first], tolerance) && first < last)first++;
            while(!this.isNodeVisible(nodes[last], tolerance) && last > first)last--;
            return nodes.slice(first, last + 1);
        };
        /**
     * [Indicates if the node is currently visible on the screen]{: #VirtualRenderer.isNodeVisible}
     * @param {Object} node Tree node
     * @param {Number} tolerance fraction of the node allowed to be hidden while node still considered visible (default 1/3)
     * @returns {Boolean}
     **/ this.isNodeVisible = function(node, tolerance) {
            var layerConfig = this.layerConfig;
            if (!layerConfig.vRange) return;
            var provider = this.provider;
            var i = layerConfig.vRange.indexOf(node);
            if (i == -1) return false;
            var nodePos = provider.getNodePosition(node);
            var top = nodePos.top;
            var height = nodePos.height;
            if (tolerance === undefined) tolerance = 1 / 3;
            if (this.scrollTop > top + tolerance * height) return false;
            if (this.scrollTop + this.$size.scrollerHeight <= top + (1 - tolerance) * height) return false;
            return true;
        };
        this.$updateScrollBar = function() {
            // todo separate event for h v scroll
            this.$updateScrollBarH();
            this.$updateScrollBarV();
        };
        this.setScrollMargin = function(top, bottom, left, right) {
            var sm = this.scrollMargin;
            sm.top = top | 0;
            sm.bottom = bottom | 0;
            sm.right = right | 0;
            sm.left = left | 0;
            sm.v = sm.top + sm.bottom;
            sm.h = sm.left + sm.right;
            if (sm.top && this.scrollTop <= 0 && this.provider) this.provider.setScrollTop(-sm.top);
            this.updateFull();
        };
        this.$updateScrollBarV = function() {
            this.scrollBarV.setInnerHeight(this.layerConfig.maxHeight + this.scrollMargin.v);
            this.scrollBarV.setScrollTop(this.scrollTop + this.scrollMargin.top);
        };
        this.$updateScrollBarH = function() {
            this.scrollBarH.setInnerWidth(this.layerConfig.maxWidth + this.scrollMargin.h);
            this.scrollBarH.setScrollLeft(this.scrollLeft + this.scrollMargin.left);
        };
        this.$frozen = false;
        this.freeze = function() {
            this.$frozen = true;
        };
        this.unfreeze = function() {
            this.$frozen = false;
        };
        this.$renderChanges = function(changes, force) {
            if (this.$changes) {
                changes |= this.$changes;
                this.$changes = 0;
            }
            if (!this.provider || !this.container.offsetWidth || this.$frozen || !changes && !force) {
                this.$changes |= changes;
                return;
            }
            if (!this.$size.width) {
                this.$changes |= changes;
                return this.onResize(true);
            }
            // this.$logChanges(changes);
            this._signal("beforeRender");
            var config = this.layerConfig;
            // text, scrolling and resize changes can cause the view port size to change
            if (changes & this.CHANGE_FULL || changes & this.CHANGE_SIZE || changes & this.CHANGE_SCROLL || changes & this.CHANGE_H_SCROLL || changes & this.CHANGE_COLUMN || changes & this.CHANGE_ROW || changes & this.CHANGE_CELLS) {
                changes |= this.$computeLayerConfig();
                config = this.layerConfig;
                // update scrollbar first to not lose scroll position when gutter calls resize
                this.$updateScrollBar();
                this.cells.style.marginTop = -config.vOffset + "px";
                this.cells.style.marginLeft = -config.hOffset + "px";
                this.cells.style.width = config.width + "px";
                this.cells.style.height = config.height + config.rowHeight + "px";
            }
            // full
            if (changes & this.CHANGE_FULL) {
                this.$headingLayer.update(this.layerConfig);
                this.$cellLayer.update(this.layerConfig);
                this.$markerLayer.update(this.layerConfig);
                this._signal("afterRender");
                return;
            }
            // scrolling
            if (changes & this.CHANGE_SCROLL) {
                if (changes & this.CHANGE_ROW || changes & this.CHANGE_COLUMN || changes & this.CHANGE_CELLS) {
                    this.$headingLayer.update(this.layerConfig);
                    this.$cellLayer.update(this.layerConfig);
                } else {
                    this.$headingLayer.update(this.layerConfig);
                    this.$cellLayer.scroll(this.layerConfig);
                }
                this.$markerLayer.update(this.layerConfig);
                this.$updateScrollBar();
                this._signal("afterRender");
                return;
            }
            if (changes & this.CHANGE_CLASS) this.$cellLayer.updateClasses(this.layerConfig);
            if (changes & this.CHANGE_MARKER || changes & this.CHANGE_CELLS) this.$markerLayer.update(this.layerConfig);
            // if (changes & this.CHANGE_ROW)
            //     this.$treeLayer.update(this.layerConfig);
            //     this.$updateRows();
            //@todo analog to updateRows?
            if (changes & this.CHANGE_COLUMN) this.$horHeadingLayer.update(this.layerConfig);
            if (changes & this.CHANGE_CELLS) this.$cellLayer.update(this.layerConfig);
            if (changes & this.CHANGE_SIZE) this.$updateScrollBar();
            this._signal("afterRender");
            if (this.$scrollIntoView) this.$scrollIntoView = null;
        };
        this.$autosize = function() {
            var headingHeight = this.$size.headingHeight;
            var height = this.provider.getTotalHeight() + headingHeight;
            var maxHeight = this.getMaxHeight ? this.getMaxHeight() : this.$maxLines * this.provider.rowHeight + headingHeight;
            var desiredHeight = Math.max((this.$minLines || 1) * this.provider.rowHeight + headingHeight, Math.min(maxHeight, height)) + this.scrollMargin.v;
            var vScroll = height > maxHeight;
            if (desiredHeight != this.desiredHeight || this.$size.height != this.desiredHeight || vScroll != this.$vScroll) {
                if (vScroll != this.$vScroll) {
                    this.$vScroll = vScroll;
                    this.scrollBarV.setVisible(vScroll);
                }
                var w = this.container.clientWidth;
                this.container.style.height = desiredHeight + "px";
                this.$updateCachedSize(true, w, desiredHeight);
                // this.$loop.changes = 0;
                this.desiredHeight = desiredHeight;
                this._signal("autoresize");
            }
        };
        this.$computeLayerConfig = function() {
            if (this.$maxLines) this.$autosize();
            var provider = this.provider;
            var vertical = this.$treeLayer;
            var horizontal = this.$horHeadingLayer;
            var minHeight = this.$size.scrollerHeight;
            var maxHeight = provider.getTotalHeight();
            var minWidth = this.$size.scrollerWidth;
            var maxWidth = 0 //horizontal.size;
            ;
            var hideScrollbars = this.$size.height <= 2 * 10;
            var horizScroll = !hideScrollbars && (this.$hScrollBarAlwaysVisible || this.$size.scrollerWidth - maxWidth < 0);
            var hScrollChanged = this.$horizScroll !== horizScroll;
            if (hScrollChanged) {
                this.$horizScroll = horizScroll;
                this.scrollBarH.setVisible(horizScroll);
            }
            var vScroll = !hideScrollbars && (this.$vScrollBarAlwaysVisible || this.$size.scrollerHeight - maxHeight < 0);
            var vScrollChanged = this.$vScroll !== vScroll;
            if (vScrollChanged) {
                this.$vScroll = vScroll;
                this.scrollBarV.setVisible(vScroll);
            }
            this.provider.setScrollTop(Math.max(-this.scrollMargin.top, Math.min(this.scrollTop, maxHeight - this.$size.scrollerHeight + this.scrollMargin.bottom)));
            this.provider.setScrollLeft(Math.max(-this.scrollMargin.left, Math.min(this.scrollLeft, maxWidth - this.$size.scrollerWidth + this.scrollMargin.right)));
            if (this.provider.getScrollTop() != this.scrollTop) this.scrollTop = this.provider.getScrollTop();
            var top = Math.max(this.scrollTop, 0);
            var vRange = provider.getRange(top, top + this.$size.height);
            var hRange = {
                size: 0
            }; // horizontal.getRange(this.scrollLeft, this.scrollLeft + this.$size.width);
            var vOffset = this.scrollTop - vRange.size;
            var hOffset = this.scrollLeft - hRange.size;
            var rowCount = vRange.length;
            var firstRow = vRange.count;
            var lastRow = firstRow + rowCount - 1;
            var colCount = hRange.length;
            var firstCol = hRange.count;
            var lastCol = firstCol + colCount - 1;
            if (this.layerConfig) this.layerConfig.discard = true;
            var changes = 0;
            // Horizontal scrollbar visibility may have changed, which changes
            // the client height of the scroller
            if (hScrollChanged || vScrollChanged) {
                changes = this.$updateCachedSize(true, this.$size.width, this.$size.height);
                this._signal("scrollbarVisibilityChanged");
            //if (vScrollChanged)
            //    longestLine = this.$getLongestLine();
            }
            this.layerConfig = {
                vRange: vRange,
                hRange: hRange,
                width: minWidth,
                height: minHeight,
                firstRow: firstRow,
                lastRow: lastRow,
                firstCol: firstCol,
                lastCol: lastCol,
                minHeight: minHeight,
                maxHeight: maxHeight,
                minWidth: minWidth,
                maxWidth: maxWidth,
                vOffset: vOffset,
                hOffset: hOffset,
                rowHeight: provider.rowHeight
            };
            var config = this.layerConfig, renderer = this;
            if (vRange) {
                config.view = provider.getDataRange({
                    start: vRange.count,
                    length: vRange.length
                }, {
                    start: hRange.count,
                    length: hRange.length
                }, function(err, view, update) {
                    if (err) return false; //@todo
                    config.view = view;
                    if (update) renderer.$loop.schedule(renderer.CHANGE_CELLS);
                });
            }
            // For debugging.
            // console.log(JSON.stringify(this.layerConfig));
            return changes;
        };
        this.$updateRows = function() {
            var firstRow = this.$changedLines.firstRow;
            var lastRow = this.$changedLines.lastRow;
            this.$changedLines = null;
            var layerConfig = this.layerConfig;
            if (firstRow > layerConfig.lastRow + 1) {
                return;
            }
            if (lastRow < layerConfig.firstRow) {
                return;
            }
            // if the last row is unknown -> redraw everything
            if (lastRow === Infinity) {
                this.$cellLayer.update(layerConfig);
                return;
            }
            // else update only the changed rows
            this.$cellLayer.updateRows(layerConfig, firstRow, lastRow);
            return true;
        };
        this.scrollSelectionIntoView = function(anchor, lead, offset) {
            // first scroll anchor into view then scroll lead into view
            this.scrollCaretIntoView(anchor, offset);
            this.scrollCaretIntoView(lead, offset);
        };
        /**
     *
     * Scrolls the Caret into the first visible area of the editor
     **/ this.scrollCaretIntoView = function(caret, offset) {
            this.$scrollIntoView = {
                caret: caret,
                offset: offset,
                scrollTop: this.scrollTop,
                model: this.model,
                height: this.$size.scrollerHeight
            };
            // the editor is not visible
            if (this.$size.scrollerHeight === 0) return;
            var provider = this.provider;
            var node = caret || provider.selection.getCursor();
            if (!node) return;
            var nodePos = provider.getNodePosition(node);
            var top = nodePos.top;
            var height = nodePos.height;
            var left = 0;
            var width = 0;
            if (this.scrollTop > top) {
                if (offset) top -= offset * this.$size.scrollerHeight;
                if (top === 0) top = -this.scrollMargin.top;
                this.provider.setScrollTop(top);
            } else if (this.scrollTop + this.$size.scrollerHeight < top + height) {
                if (offset) top += offset * this.$size.scrollerHeight;
                this.provider.setScrollTop(top + height - this.$size.scrollerHeight);
            }
            var scrollLeft = this.scrollLeft;
            if (scrollLeft > left) {
                if (left < 0) left = 0;
                this.provider.setScrollLeft(left);
            } else if (scrollLeft + this.$size.scrollerWidth < left + width) {
                this.provider.setScrollLeft(Math.round(left + width - this.$size.scrollerWidth));
            }
            this.$scrollIntoView.scrollTop = this.scrollTop;
        };
        /**
     * @returns {Number}
     **/ this.getScrollTop = function() {
            return this.scrollTop;
        };
        /**
     * @returns {Number}
     **/ this.getScrollLeft = function() {
            return this.scrollLeft;
        };
        /**
     * This function sets the scroll top value. It also emits the `'changeScrollTop'` event.
     * @param {Number} scrollTop The new scroll top value
     *
     **/ this.setScrollTop = function(scrollTop) {
            scrollTop = Math.round(scrollTop);
            if (this.scrollTop === scrollTop || isNaN(scrollTop)) return;
            this.scrollToY(scrollTop);
        };
        /**
     * This function sets the scroll top value. It also emits the `'changeScrollLeft'` event.
     * @param {Number} scrollLeft The new scroll left value
     *
     **/ this.setScrollLeft = function(scrollLeft) {
            scrollLeft = Math.round(scrollLeft);
            if (this.scrollLeft === scrollLeft || isNaN(scrollLeft)) return;
            this.scrollToX(scrollLeft);
        };
        /**
     *
     * Returns the first visible row, regardless of whether it's fully visible or not.
     * @returns {Number}
     **/ this.getScrollTopRow = function() {
            return this.layerConfig.firstRow;
        };
        /**
     *
     * Returns the last visible row, regardless of whether it's fully visible or not.
     * @returns {Number}
     **/ this.getScrollBottomRow = function() {
            return this.layerConfig.lastRow;
        //return Math.max(0, Math.floor((this.scrollTop + this.$size.scrollerHeight) / this.lineHeight) - 1);
        };
        this.alignCaret = function(cursor, alignment) {
            if (typeof cursor == "number") cursor = {
                row: cursor,
                column: 0
            };
            var node = this.provider.findNodeByIndex(cursor.row);
            var pos = this.provider.findSizeAtIndex(cursor.row);
            var h = this.$size.scrollerHeight;
            var offset = pos - (h - node.size) * (alignment || 0);
            this.setScrollTop(offset);
            return offset;
        };
        this.STEPS = 8;
        this.$calcSteps = function(fromValue, toValue) {
            var i = 0;
            var l = this.STEPS;
            var steps = [];
            var func = function(t, x_min, dx) {
                return dx * (Math.pow(t - 1, 3) + 1) + x_min;
            };
            for(i = 0; i < l; ++i)steps.push(func(i / this.STEPS, fromValue, toValue - fromValue));
            return steps;
        };
        /**
     * Gracefully scrolls the editor to the row indicated.
     * @param {Number} line A line number
     * @param {Boolean} center If `true`, centers the editor the to indicated line
     * @param {Boolean} animate If `true` animates scrolling
     * @param {Function} callback Function to be called after the animation has finished
     *
     *
     **/ this.scrollToRow = function(row, center, animate, callback) {
            var node = this.provider.findNodeByIndex(row);
            var offset = this.provider.findSizeAtIndex(row);
            if (center) offset -= (this.$size.scrollerHeight - node.size) / 2;
            var initialScroll = this.scrollTop;
            this.setScrollTop(offset);
            if (animate !== false) this.animateScrolling(initialScroll, callback);
        };
        this.animateScrolling = function(fromValue, callback) {
            var toValue = this.scrollTop;
            if (!this.$animatedScroll) return;
            var _self = this;
            if (fromValue == toValue) return;
            if (this.$scrollAnimation) {
                var oldSteps = this.$scrollAnimation.steps;
                if (oldSteps.length) {
                    fromValue = oldSteps[0];
                    if (fromValue == toValue) return;
                }
            }
            var steps = _self.$calcSteps(fromValue, toValue);
            this.$scrollAnimation = {
                from: fromValue,
                to: toValue,
                steps: steps
            };
            clearInterval(this.$timer);
            _self.provider.setScrollTop(steps.shift());
            // trick provider to think it's already scrolled to not loose toValue
            _self.provider.$scrollTop = toValue;
            this.$timer = setInterval(function() {
                if (steps.length) {
                    _self.provider.setScrollTop(steps.shift());
                    _self.provider.$scrollTop = toValue;
                } else if (toValue != null) {
                    _self.provider.$scrollTop = -1;
                    _self.provider.setScrollTop(toValue);
                    toValue = null;
                } else {
                    // do this on separate step to not get spurious scroll event from scrollbar
                    _self.$timer = clearInterval(_self.$timer);
                    _self.$scrollAnimation = null;
                    callback && callback();
                }
            }, 10);
        };
        /**
     * Scrolls the editor to the y pixel indicated.
     * @param {Number} scrollTop The position to scroll to
     *
     *
     * @returns {Number}
     **/ this.scrollToY = function(scrollTop) {
            // after calling scrollBar.setScrollTop
            // scrollbar sends us event with same scrollTop. ignore it
            if (this.scrollTop !== scrollTop) {
                this.$loop.schedule(this.CHANGE_SCROLL);
                this.scrollTop = scrollTop;
            }
        };
        /**
     * Scrolls the editor across the x-axis to the pixel indicated.
     * @param {Number} scrollLeft The position to scroll to
     *
     *
     * @returns {Number}
     **/ this.scrollToX = function(scrollLeft) {
            if (scrollLeft < 0) scrollLeft = 0;
            if (this.scrollLeft !== scrollLeft) {
                this.$loop.schedule(this.CHANGE_SCROLL);
                this.scrollLeft = scrollLeft;
            }
        };
        /**
     * Scrolls the editor across both x- and y-axes.
     * @param {Number} deltaX The x value to scroll by
     * @param {Number} deltaY The y value to scroll by
     *
     *
     **/ this.scrollBy = function(deltaX, deltaY) {
            deltaY && this.provider.setScrollTop(this.provider.getScrollTop() + deltaY);
            deltaX && this.provider.setScrollLeft(this.provider.getScrollLeft() + deltaX);
        };
        /**
     * Returns `true` if you can still scroll by either parameter; in other words, you haven't reached the end of the file or line.
     * @param {Number} deltaX The x value to scroll by
     * @param {Number} deltaY The y value to scroll by
     *
     *
     * @returns {Boolean}
     **/ this.isScrollableBy = function(deltaX, deltaY) {
            if (deltaY < 0 && this.getScrollTop() >= 1 - this.scrollMargin.top) return true;
            if (deltaY > 0 && this.getScrollTop() + this.$size.scrollerHeight - this.layerConfig.maxHeight < -1 + this.scrollMargin.bottom) return true;
            if (deltaX < 0 && this.getScrollLeft() >= 1) return true;
            if (deltaX > 0 && this.getScrollLeft() + this.$size.scrollerWidth - this.layerConfig.maxWidth < -1) return true;
        };
        // @todo this code can be compressed
        this.screenToTextCoordinates = function(x, y) {
            var canvasPos = this.scroller.getBoundingClientRect();
            y -= canvasPos.top;
            x -= canvasPos.left;
            return {
                x: x + this.scrollLeft,
                y: y + this.scrollTop
            };
        };
        /**
     * Returns an object containing the `pageX` and `pageY` coordinates of the document position.
     * @param {Number} row The document row position
     * @param {Number} column The document column position
     *
     *
     *
     * @returns {Object}
     **/ this.textToScreenCoordinates = function(row, column) {
            throw new Error();
        };
        this.findNodeAt = function(x, y, coords) {};
        this.$moveTextAreaToCursor = function() {};
        /**
     *
     * Focuses the current container.
     **/ this.visualizeFocus = function() {
            dom.addCssClass(this.container, "ace_tree_focus");
        };
        /**
     *
     * Blurs the current container.
     **/ this.visualizeBlur = function() {
            dom.removeCssClass(this.container, "ace_tree_focus");
        };
        /**
    * [Sets a new theme for the editor. `theme` should exist, and be a directory path, like `ace/theme/textmate`.]{: #VirtualRenderer.setTheme}
    * @param {String} theme The path to a theme
    * @param {Function} cb optional callback
    *
    **/ this.setTheme = function(theme, cb) {
            var _self = this;
            this.$themeValue = theme;
            _self._dispatchEvent('themeChange', {
                theme: theme
            });
            if (!theme || typeof theme == "string") {
                var moduleName = theme || "ace/theme/textmate";
                config.loadModule([
                    "theme",
                    moduleName
                ], afterLoad);
            } else {
                afterLoad(theme);
            }
            function afterLoad(module) {
                if (_self.$themeValue != theme) return cb && cb();
                if (!module.cssClass) return;
                dom.importCssString(module.cssText, module.cssClass, _self.container.ownerDocument);
                if (_self.theme) dom.removeCssClass(_self.container, _self.theme.cssClass);
                // this is kept only for backwards compatibility
                _self.$theme = module.cssClass;
                _self.theme = module;
                dom.addCssClass(_self.container, module.cssClass);
                dom.setCssClass(_self.container, "ace_dark", module.isDark);
                var padding = module.padding || 4;
                if (_self.$padding && padding != _self.$padding) _self.setPadding(padding);
                // force re-measure of the gutter width
                if (_self.$size) {
                    _self.$size.width = 0;
                    _self.onResize();
                }
                _self._dispatchEvent('themeLoaded', {
                    theme: module
                });
                cb && cb();
            }
        };
        /**
    * [Returns the path of the current theme.]{: #VirtualRenderer.getTheme}
    * @returns {String}
    **/ this.getTheme = function() {
            return this.$themeValue;
        };
        // Methods allows to add / remove CSS classnames to the editor element.
        // This feature can be used by plug-ins to provide a visual indication of
        // a certain mode that editor is in.
        /**
     * [Adds a new class, `style`, to the editor.]{: #VirtualRenderer.setStyle}
     * @param {String} style A class name
     *
     *
     **/ this.setStyle = function setStyle(style, include) {
            dom.setCssClass(this.container, style, include !== false);
        };
        /**
     * [Removes the class `style` from the editor.]{: #VirtualRenderer.unsetStyle}
     * @param {String} style A class name
     *
     *
     **/ this.unsetStyle = function unsetStyle(style) {
            dom.removeCssClass(this.container, style);
        };
        /**
     *
     * Destroys the text and Caret layers for this renderer.
     **/ this.destroy = function() {
            window.removeEventListener("focus", this.$windowFocus);
            this.$cellLayer.destroy();
        };
    }).call(VirtualRenderer.prototype);
    config.defineOptions(VirtualRenderer.prototype, "renderer", {
        animatedScroll: {
            initialValue: true
        },
        showInvisibles: {
            set: function(value) {
                if (this.$cellLayer.setShowInvisibles(value)) this.$loop.schedule(this.CHANGE_TEXT);
            },
            initialValue: false
        },
        showPrintMargin: {
            set: function() {
                this.$updatePrintMargin();
            },
            initialValue: true
        },
        printMarginColumn: {
            set: function() {
                this.$updatePrintMargin();
            },
            initialValue: 80
        },
        printMargin: {
            set: function(val) {
                if (typeof val == "number") this.$printMarginColumn = val;
                this.$showPrintMargin = !!val;
                this.$updatePrintMargin();
            },
            get: function() {
                return this.$showPrintMargin && this.$printMarginColumn;
            }
        },
        displayIndentGuides: {
            set: function(show) {
                if (this.$cellLayer.setDisplayIndentGuides(show)) this.$loop.schedule(this.CHANGE_TEXT);
            },
            initialValue: true
        },
        hScrollBarAlwaysVisible: {
            set: function(alwaysVisible) {
                this.$hScrollBarAlwaysVisible = alwaysVisible;
                if (!this.$hScrollBarAlwaysVisible || !this.$horizScroll) this.$loop.schedule(this.CHANGE_SCROLL);
            },
            initialValue: false
        },
        vScrollBarAlwaysVisible: {
            set: function(val) {
                if (!this.$vScrollBarAlwaysVisible || !this.$vScroll) this.$loop.schedule(this.CHANGE_SCROLL);
            },
            initialValue: false
        },
        fontSize: {
            set: function(size) {
                if (typeof size == "number") size = size + "px";
                this.container.style.fontSize = size;
                this.updateFontSize();
            },
            initialValue: 12
        },
        fontFamily: {
            set: function(name) {
                this.container.style.fontFamily = name;
                this.updateFontSize();
            }
        },
        maxLines: {
            set: function(val) {
                this.updateFull();
            }
        },
        minLines: {
            set: function(val) {
                this.updateFull();
            }
        },
        scrollPastEnd: {
            set: function(val) {
                val = +val || 0;
                if (this.$scrollPastEnd == val) return;
                this.$scrollPastEnd = val;
                this.$loop.schedule(this.CHANGE_SCROLL);
            },
            initialValue: 0,
            handlesSet: true
        }
    });
    exports.VirtualRenderer = VirtualRenderer;
}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ 28:
/***/ ((module) => {

module.exports = ".ace_tree-light.ace_tree{\n    font: 12px Arial;\n}\n\n.ace_tree_selection_range{\n    background : rgba(0, 110, 255, 0.2);\n    border : 1px solid rgba(0,0,0,0.1);\n}\n.ace_tree_focus .ace_tree_selection_range{\n    \n}\n\n.ace_tree-light .toggler {\n    overflow: visible;\n    width: 10px;\n    height: 10px;\n}\n\n.ace_tree-light .tree-row .caption {\n    padding : 4px 5px;\n}\n.ace_tree-light .tree-row > .caption {\n    overflow: visible;\n    display: inline-block;\n}\n.ace_tree-light .tree-row {\n    border: 1px solid transparent;\n    -moz-box-sizing: border-box;\n    box-sizing: border-box;\n}\n.ace_tree-light .tree-row:hover,\n.ace_tree-light .tree-row.hover{\n    background: rgba(0, 0, 0, 0.03);\n}\n.ace_tree-light .tree-row.selected {\n    background: rgba(0, 0, 0, 0.04);\n}\n\n.ace_tree_focus.ace_tree-light .tree-row.selected {\n    background: -webkit-gradient(linear, left top, left bottom, from(#2890E5), color-stop(1, #1F82D2));\n    background: -moz-linear-gradient(center bottom, #1f82d2 0%, #2890e5 100%) repeat scroll 0 0 transparent;\n    background: linear-gradient(center bottom, #1f82d2 0%, #2890e5 100%) repeat scroll 0 0 transparent;\n    color: #f8f8f8;\n}\n\n\n/* datagrid */\n\n.ace_tree-light .tree-row>.tree-column {\n    border: 1px solid rgb(204, 204, 204);\n    border-width: 0 1px 1px 0;\n    padding: 4px 5px;\n}\n\n.ace_tree-light .tree-row.selected>.tree-column {\n    background: transparent;\n}\n.ace_tree-light .tree-headings {\n    background: rgb(253, 253, 253);\n}\n.ace_tree-light .tree-headings>.tree-column {\n    background: transparent;\n    padding: 5px 3px;\n}\n\n.ace_tree-light .tree-headings>.tree-column-resizer {\n    height: 100%;\n    background: rgb(182, 182, 182);\n    display: inline-block;\n    width: 1px;\n    z-index: 1000;\n    position: absolute;\n    margin-left: -1px;\n    border-left: 1px solid rgba(0, 0, 0, 0);\n}\n"

/***/ }),

/***/ 268:
/***/ ((module) => {

module.exports = ".ace_tree{\n    overflow : hidden;\n    font : 12px Tahoma, Arial;\n    cursor: default;\n    position: relative;\n    white-space: pre;\n}\n\n.ace_tree textarea{\n    position : absolute;\n    z-index : 0;\n}\n\n.ace_tree_scroller {\n    position: absolute;\n    overflow: hidden;\n    top: 0;\n    bottom: 0;\n    -webkit-user-select: none;\n       -moz-user-select: none;\n        -ms-user-select: none;\n         -o-user-select: none;\n            user-select: none;\n}\n\n.ace_tree_content {\n    position: absolute;\n    -moz-box-sizing: border-box;\n    -webkit-box-sizing: border-box;\n    box-sizing: border-box;\n}\n\n.ace_scrollbar {\n    position: absolute;\n    overflow-x: hidden;\n    overflow-y: auto;\n    right: 0;\n    bottom: 0;\n}\n\n.ace_scrollbar-inner {\n    position: absolute;\n    cursor: text;\n    left: 0;\n    top: 0;\n}\n\n.ace_scrollbar-h {\n    position: absolute;\n    overflow-x: auto;\n    overflow-y: hidden;\n    right: 0;\n    left: 0;\n    bottom: 0;\n}\n\n.ace_tree_horheading {\n    position : absolute;\n}\n\n.ace_tree_verheading{\n    bottom : 0;\n    position : absolute;\n}\n\n.ace_tree_heading {\n    z-index: 10;\n    position: relative;\n    white-space: nowrap;\n    -webkit-box-sizing: border-box;\n       -moz-box-sizing: border-box;\n            box-sizing: border-box;\n    pointer-events: none;\n}\n\n.ace_tree_layer {\n    z-index: 1;\n    position: absolute;\n    overflow: hidden;\n    white-space: nowrap;\n    -webkit-box-sizing: border-box;\n       -moz-box-sizing: border-box;\n            box-sizing: border-box;\n    pointer-events: none;\n}\n\n.ace_tree .tree-indent {\n    display : inline-block;\n}\n\n.ace_tree_selection_range{\n    position : absolute;\n    -webkit-box-sizing: border-box;\n       -moz-box-sizing: border-box;\n            box-sizing: border-box;\n}\n.ace_tree_focus .ace_tree_selection_range{\n    \n}\n\n.ace_tree-editor {\n    position : absolute;\n    z-index : 10000;\n    background : white;\n    padding : 3px 4px 3px 4px;\n    -moz-box-sizing : border-box;\n         box-sizing : border-box;\n    border : 1px dotted green;\n    left: 0;\n    right: 0\n}\n\n\n\n.ace_tree .toggler {\n    width: 10px;\n    height: 10px;\n    background-repeat: no-repeat;\n    background-position: 0px 0px;\n    background-repeat: no-repeat;\n    cursor: pointer;\n    display: inline-block;\n    pointer-events: auto;\n}\n\n.ace_tree .toggler.empty {\n    pointer-events: none;\n}\n\n.ace_tree .toggler.open {\n    background-position: -10px 0px;\n}\n\n.ace_tree .toggler.empty {\n    background-position: 50px 0px;\n    cursor: default;\n}\n\n.ace_tree_cells, .ace_tree_cell-layer {\n    width: 100%;\n}\n.ace_tree_selection-layer {\n    width: 100%;\n    height: 110%;\n}\n.ace_tree_cells .message.empty {\n    text-align: center;\n    opacity: 0.9;\n    cursor : default;\n}\n\n/* datagrid */\n\n.ace_tree .tree-row>.tree-column {\n    display: inline-block;\n    overflow: hidden;\n    -webkit-box-sizing: border-box;\n       -moz-box-sizing: border-box;\n            box-sizing: border-box;\n}\n\n\n.tree-headings {\n    white-space: nowrap;\n    position: absolute;\n    overflow: hidden;\n    top: 0;\n    left: 0;\n    right: 0;\n    -webkit-box-sizing: border-box;\n       -moz-box-sizing: border-box;\n            box-sizing: border-box;\n}\n.tree-headings>.tree-column {\n    display: inline-block;\n    -webkit-box-sizing: border-box;\n       -moz-box-sizing: border-box;\n            box-sizing: border-box;\n}\n\n.tree-headings>.tree-column-resizer {\n    height: 100%;\n    background: rgb(182, 182, 182);\n    display: inline-block;\n    width: 2px;\n    z-index: 1000;\n    position: absolute;\n    margin-left: -2px;\n    border-left: 1px solid rgba(0, 0, 0, 0);\n}\n"

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DataProvider: () => (/* reexport module object */ _src_data_provider__WEBPACK_IMPORTED_MODULE_1__),
/* harmony export */   Tree: () => (/* reexport module object */ _src_tree__WEBPACK_IMPORTED_MODULE_0__)
/* harmony export */ });
/* harmony import */ var _src_tree__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(336);
/* harmony import */ var _src_tree__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_src_tree__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _src_data_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(950);
/* harmony import */ var _src_data_provider__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_src_data_provider__WEBPACK_IMPORTED_MODULE_1__);





})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHlDQUF5QztBQUN6Qyx1Q0FBdUM7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHlDQUF5QywwQkFBMEI7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkRBQTZEO0FBQzdELDZDQUE2QztBQUM3QyxvSEFBb0g7O0FBRXBIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBLGNBQWM7QUFDZDtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxpREFBaUQ7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBaUI7QUFDakIseUJBQTZCO0FBQzdCO0FBQ0E7QUFDQTs7Ozs7Ozs7QUMxdUJBOztBQUVBLFVBQVUsbUJBQU8sQ0FBQyxHQUFPO0FBQ3pCLG1CQUFtQixnREFBdUM7O0FBRTFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsVUFBVTtBQUN0Qzs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCOztBQUV2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlGQUFpRjtBQUNqRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQsU0FBaUI7Ozs7Ozs7OztBQ3JJSjs7QUFFYixnQkFBZ0IsbUJBQU8sQ0FBQyxHQUFhO0FBQ3JDOztBQUVBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdCQUFnQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLGdCQUFnQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQSxjQUFjO0FBQ2Q7QUFDQSxjQUFjO0FBQ2Q7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsc0JBQXNCO0FBQ3RCO0FBQ0E7O0FBRUEsc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTs7QUFFQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBOztBQUVBLG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBLG9CQUFvQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUI7O0FBRXZCLDBCQUEwQjtBQUMxQiwrQkFBK0IsNkJBQTZCO0FBQzVEO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUEscUJBQXFCO0FBQ3JCO0FBQ0E7O0FBRUEsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEseUJBQXlCO0FBQ3pCLDBCQUEwQjtBQUMxQixjQUFjO0FBQ2Q7QUFDQTs7QUFFQSwwQkFBMEIsY0FBYzs7QUFFeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLDBCQUEwQjtBQUNsQztBQUNBLFFBQVEseUJBQXlCO0FBQ2pDO0FBQ0E7O0FBRUE7QUFDQSxJQUFJLGlCQUFpQjtBQUNyQjtBQUNBO0FBQ0EsRUFBRTtBQUNGLElBQUksaUJBQWlCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7QUN4U2E7O0FBRWIsV0FBVyxtQkFBTyxDQUFDLEdBQVE7QUFDM0IsZ0JBQWdCLG1CQUFPLENBQUMsR0FBYTs7QUFFckM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlFQUF5RTtBQUN6RTtBQUNBLHlDQUF5QztBQUN6QztBQUNBLFNBQVM7QUFDVCxNQUFNO0FBQ047O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsa0JBQWtCLG1CQUFtQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUIsc0JBQXNCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7O0FBRUEsc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFlBQVksUUFBUTtBQUNwQjtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsZUFBZTtBQUNmO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUEsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyxjQUFjOztBQUV6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHlCQUF5QjtBQUN6QjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVCxNQUFNO0FBQ047O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJLGdCQUFnQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsb0JBQW9CO0FBQ3BCLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQSxvQkFBb0I7QUFDcEIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLElBQUksb0JBQW9CO0FBQ3hCLElBQUksb0JBQW9CO0FBQ3hCLFFBQVEsb0JBQW9CO0FBQzVCLEtBQUs7QUFDTDs7QUFFQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxJQUFJLGlCQUFpQjtBQUNyQjtBQUNBLElBQUksaUJBQWlCO0FBQ3JCO0FBQ0E7Ozs7Ozs7OztBQzlVYTs7QUFFYjtBQUNBLG1DQUFtQztBQUNuQyxrQ0FBa0M7O0FBRWxDO0FBQ0E7QUFDQSxvREFBb0Q7QUFDcEQsd0RBQXdEOztBQUV4RDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGtCQUFrQixvQkFBb0I7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQSw4Q0FBOEM7QUFDOUM7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG9CQUFvQjtBQUN0QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFvQjs7Ozs7Ozs7O0FDaElwQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7O0FBR0E7QUFDQTs7QUFFQTs7QUFFYTs7QUFFYixVQUFVLG1CQUFPLENBQUMsR0FBTzs7QUFFekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0EseURBQXlEO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBK0MsSUFBSTtBQUNuRDtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0EsQ0FBQztBQUNEOztBQUVBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7OztBQy9KYTs7QUFFYixZQUFZO0FBQ1o7QUFDQTs7QUFFQSxxQkFBcUI7QUFDckI7QUFDQTs7QUFFQSxvQkFBb0I7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLHNCQUFzQjtBQUN0QjtBQUNBOztBQUVBLHVCQUF1QjtBQUN2QjtBQUNBOztBQUVBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCO0FBQ2pCO0FBQ0Esa0NBQWtDLEtBQUs7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsa0JBQWtCO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxrQkFBa0I7QUFDbEI7QUFDQSxrQkFBa0IsY0FBYztBQUNoQztBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkIsa0JBQWtCLG1CQUFtQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9CQUFvQjtBQUNwQixrQ0FBa0M7QUFDbEM7O0FBRUEsa0JBQWtCO0FBQ2xCLDBDQUEwQyx1QkFBdUIsdUJBQXVCLHVCQUF1QjtBQUMvRzs7QUFFQSx1QkFBdUI7QUFDdkI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7QUM5TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRWE7QUFDYixVQUFVLG1CQUFPLENBQUMsR0FBTzs7QUFFekIsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsa0JBQWtCO0FBQ2xCO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7QUNoRGE7O0FBRWIsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUEsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCO0FBQ2pCO0FBQ0E7Ozs7Ozs7OztBQ3ZCYTs7QUFFYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxhQUFhOztBQUViO0FBQ0EsYUFBYTs7QUFFYjtBQUNBLGVBQWU7O0FBRWY7QUFDQSxZQUFZO0FBQ1o7QUFDQSw2REFBNkQ7QUFDN0QsdURBQXVELG1DQUFtQztBQUMxRjtBQUNBLGVBQWU7O0FBRWY7QUFDQSxlQUFlLEdBQUcsaUJBQWlCOztBQUVuQztBQUNBLGVBQWU7O0FBRWY7QUFDQSxnQkFBZ0I7O0FBRWhCLGdCQUFnQjs7QUFFaEIsY0FBYzs7QUFFZCxhQUFhOztBQUViLGlCQUFpQjs7QUFFakIsa0JBQWtCOztBQUVsQixhQUFhOztBQUViLG1CQUFtQixhQUFhOztBQUVoQyxnQkFBZ0I7Ozs7Ozs7OztBQzNFSDs7QUFFYixZQUFZLG1CQUFPLENBQUMsR0FBYTs7QUFFakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxDQUFDOztBQUVELFNBQWtCOzs7Ozs7Ozs7O0FDeERMOztBQUViLFVBQVUsbUJBQU8sQ0FBQyxHQUFXO0FBQzdCLFVBQVUsbUJBQU8sQ0FBQyxHQUFXO0FBQzdCLFlBQVksbUJBQU8sQ0FBQyxHQUFhO0FBQ2pDLG1CQUFtQixnREFBMkM7QUFDOUQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFdBQVcsU0FBUztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxXQUFXLFNBQVM7QUFDcEIsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZUFBZSxRQUFRO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MscUJBQXFCO0FBQ3ZEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxlQUFlLFFBQVE7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxRQUFRO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsZUFBZSxRQUFRO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFdBQVcsU0FBUztBQUNwQixXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLFFBQVE7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0Msc0JBQXNCO0FBQ3hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxlQUFlLFFBQVE7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxlQUFlLFFBQVE7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsQ0FBQzs7O0FBR0QseUJBQWlCLGVBQWU7QUFDaEMsVUFBa0IsZUFBZTtBQUNqQyxVQUFrQixlQUFlOztBQUVqQyx5QkFBa0I7QUFDbEIseUJBQWtCOzs7Ozs7OztBQy9QbEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNBNEJpQyxHQUVqQ0EsbUNBQU8sU0FBU0MsT0FBTyxFQUFFQyxPQUFPLEVBQUVDLE1BQU07SUFDeEM7SUFFQSxTQUFTQyxRQUFRQyxHQUFHLEVBQUVDLEdBQUc7UUFDckIsT0FBTztZQUFDRCxLQUFLQTtZQUFLQyxLQUFLQTtRQUFHO0lBQzlCO0lBRUFKLGdCQUFnQixHQUFHO1FBQUM7WUFDaEJNLE1BQU07WUFDTkosU0FBU0EsUUFBUSxVQUFVO1lBQzNCSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9DLFNBQVM7WUFBSTtRQUNqRDtRQUFHO1lBQ0NILE1BQU07WUFDTkosU0FBU0EsUUFBUSxNQUFNO1lBQ3ZCSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9FLGVBQWU7WUFBSTtRQUN2RDtRQUFHO1lBQ0NKLE1BQU07WUFDTkosU0FBU0EsUUFBUSxRQUFRO1lBQ3pCSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9HLGVBQWUsQ0FBQztZQUFPO1FBQzNEOztRQUFLO1lBQ0RMLE1BQU07WUFDTkosU0FBU0EsUUFBUSxjQUFjO1lBQy9CSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9HLGVBQWU7WUFBSTtRQUN2RDtRQUFHO1lBQ0NMLE1BQU07WUFDTkosU0FBU0EsUUFBUSxTQUFTO1lBQzFCSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9JLGlCQUFpQjtZQUFJO1FBQ3pEO1FBQUc7WUFDQ04sTUFBTTtZQUNOTyxXQUFXWCxRQUFRLGFBQWE7WUFDaENBLFNBQVNBLFFBQVEsa0JBQWtCO1lBQ25DSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9NLGFBQWE7WUFBSTtRQUNyRDtRQUFHO1lBQ0NSLE1BQU07WUFDTk8sV0FBV1gsUUFBUSxZQUFZO1lBQy9CQSxTQUFTQSxRQUFRLGdCQUFnQjtZQUNqQ0ssTUFBTSxTQUFTQyxNQUFNO2dCQUFJQSxPQUFPTyxXQUFXO1lBQUk7UUFDbkQ7UUFBRztZQUNDVCxNQUFNO1lBQ05KLFNBQVNBLFFBQVEsYUFBYTtZQUM5QkssTUFBTSxTQUFTUyxFQUFFO2dCQUFJQSxHQUFHQyxRQUFRLENBQUNDLEtBQUssQ0FBQ0YsR0FBR0csU0FBUyxDQUFDQyxTQUFTLElBQUk7WUFBTztRQUM1RTtRQUFHO1lBQ0NkLE1BQU07WUFDTkosU0FBU0EsUUFBUSxjQUFjO1lBQy9CSyxNQUFNLFNBQVNTLEVBQUU7Z0JBQUlBLEdBQUdDLFFBQVEsQ0FBQ0ksSUFBSSxDQUFDTCxHQUFHRyxTQUFTLENBQUNDLFNBQVMsSUFBSTtZQUFPO1FBQzNFO1FBQUc7WUFDQ2QsTUFBTTtZQUNOSixTQUFTO1lBQ1RLLE1BQU0sU0FBU0MsTUFBTTtnQkFBSUEsT0FBT2MsWUFBWTtZQUFJO1FBQ3BEO1FBQUc7WUFDQ2hCLE1BQU07WUFDTkosU0FBUztZQUNUSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9lLFVBQVU7WUFBSTtRQUNsRDtRQUFHO1lBQ0NqQixNQUFNO1lBQ05KLFNBQVM7WUFDVEssTUFBTSxTQUFTQyxNQUFNO2dCQUFJQSxPQUFPZ0IsY0FBYztZQUFJO1FBQ3REO1FBQUc7WUFDQ2xCLE1BQU07WUFDTkosU0FBUztZQUNUSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9pQixZQUFZO1lBQUk7UUFDcEQ7UUFBRztZQUNDbkIsTUFBTTtZQUNOSixTQUFTQSxRQUFRLFdBQVc7WUFDNUJLLE1BQU0sU0FBU21CLENBQUM7Z0JBQUlBLEVBQUVDLFFBQVEsQ0FBQ0MsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJRixFQUFFQyxRQUFRLENBQUNFLFdBQVcsQ0FBQ0MsVUFBVTtZQUFHO1FBQ3hGO1FBQUc7WUFDQ3hCLE1BQU07WUFDTkosU0FBU0EsUUFBUSxhQUFhO1lBQzlCSyxNQUFNLFNBQVNtQixDQUFDO2dCQUFJQSxFQUFFQyxRQUFRLENBQUNDLFFBQVEsQ0FBQyxHQUFHLElBQUlGLEVBQUVDLFFBQVEsQ0FBQ0UsV0FBVyxDQUFDQyxVQUFVO1lBQUc7UUFDdkY7UUFBRztZQUNDeEIsTUFBTTtZQUNOQyxNQUFNLFNBQVNtQixDQUFDLEVBQUVLLElBQUk7Z0JBQUlMLEVBQUVNLFdBQVcsQ0FBQ0Q7WUFBTTtRQUNsRDtRQUFHO1lBQ0N6QixNQUFNO1lBQ05KLFNBQVNBLFFBQVEsTUFBTTtZQUN2QkssTUFBTSxTQUFTQyxNQUFNO2dCQUFJQSxPQUFPVyxTQUFTLENBQUNjLGFBQWEsQ0FBQyxDQUFDO1lBQUk7UUFDakU7UUFBRztZQUNDM0IsTUFBTTtZQUNOSixTQUFTQSxRQUFRLFFBQVE7WUFDekJLLE1BQU0sU0FBU0MsTUFBTTtnQkFBSUEsT0FBT1csU0FBUyxDQUFDYyxhQUFhLENBQUM7WUFBSTtRQUNoRTtRQUFHO1lBQ0MzQixNQUFNO1lBQ05KLFNBQVNBLFFBQVEsWUFBWTtZQUM3QkssTUFBTSxTQUFTQyxNQUFNO2dCQUFJQSxPQUFPVyxTQUFTLENBQUNjLGFBQWEsQ0FBQyxDQUFDLEdBQUc7WUFBTztRQUN2RTtRQUFHO1lBQ0MzQixNQUFNO1lBQ05KLFNBQVNBLFFBQVEsY0FBYztZQUMvQkssTUFBTSxTQUFTQyxNQUFNO2dCQUFJQSxPQUFPVyxTQUFTLENBQUNjLGFBQWEsQ0FBQyxHQUFHO1lBQU87UUFDdEU7UUFBRztZQUNDM0IsTUFBTTtZQUNOSixTQUFTQSxRQUFRLFdBQVc7WUFDNUJLLE1BQU0sU0FBU0MsTUFBTTtnQkFBSUEsT0FBT1csU0FBUyxDQUFDYyxhQUFhLENBQUMsQ0FBQyxHQUFHLE9BQU87WUFBTztRQUM5RTtRQUFHO1lBQ0MzQixNQUFNO1lBQ05KLFNBQVNBLFFBQVEsYUFBYTtZQUM5QkssTUFBTSxTQUFTQyxNQUFNO2dCQUFJQSxPQUFPVyxTQUFTLENBQUNjLGFBQWEsQ0FBQyxHQUFHLE9BQU87WUFBTztRQUM3RTtRQUFHO1lBQ0MzQixNQUFNO1lBQ05KLFNBQVNBLFFBQVEsaUJBQWlCO1lBQ2xDSyxNQUFNLFNBQVNDLE1BQU07Z0JBQUlBLE9BQU9XLFNBQVMsQ0FBQ2MsYUFBYSxDQUFDLENBQUMsR0FBRyxNQUFNO1lBQU87UUFDN0U7UUFBRztZQUNDM0IsTUFBTTtZQUNOSixTQUFTQSxRQUFRLG1CQUFtQjtZQUNwQ0ssTUFBTSxTQUFTQyxNQUFNO2dCQUFJQSxPQUFPVyxTQUFTLENBQUNjLGFBQWEsQ0FBQyxHQUFHLE1BQU07WUFBTztRQUM1RTtRQUFHO1lBQ0MzQixNQUFNO1lBQ05KLFNBQVM7WUFDVEssTUFBTSxTQUFTMkIsSUFBSTtnQkFBSUEsS0FBS0MsSUFBSSxJQUFJRCxLQUFLQyxJQUFJLENBQUNDLFdBQVc7WUFBSTtRQUNqRTtRQUFHO1lBQ0M5QixNQUFNO1lBQ05KLFNBQVM7WUFDVEssTUFBTSxTQUFTMkIsSUFBSTtnQkFBSUEsS0FBS0csS0FBSyxDQUFDO1lBQWdCO1FBQ3REO1FBQUc7WUFDQy9CLE1BQU07WUFDTkosU0FBUztZQUNUSyxNQUFNLFNBQVMyQixJQUFJO2dCQUFJQSxLQUFLRyxLQUFLLENBQUM7WUFBVztRQUNqRDtRQUFHO1lBQ0MvQixNQUFNO1lBQ05KLFNBQVNBLFFBQVEsU0FBUztZQUMxQkssTUFBTSxTQUFTMkIsSUFBSTtnQkFDZkEsS0FBS2pCLFFBQVEsQ0FBQ0MsS0FBSyxDQUFDZ0IsS0FBS2pCLFFBQVEsQ0FBQ3FCLElBQUksRUFBRTtnQkFDeENKLEtBQUtLLE1BQU0sQ0FBQ0wsS0FBS2YsU0FBUyxDQUFDQyxTQUFTO1lBQ3hDO1FBQ0o7S0FHQztBQUVELENBQUM7QUFBQSxrR0FBQzs7Ozs7Ozs7QUM5SkY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNBNEJpQyxHQUVqQ3RCLG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBQ3hDO0lBRUEsSUFBSXVDLE9BQU96QyxtQkFBT0EsQ0FBQyxHQUF1QjtJQUMxQyxJQUFJMEMsTUFBTTFDLG1CQUFPQSxDQUFDLEdBQXNCO0lBQ3hDLElBQUkyQyxNQUFNM0MsbUJBQU9BLENBQUMsR0FBc0I7SUFDeEMsSUFBSTRDLFlBQVk1Qyw2Q0FBZ0Q7SUFFaEVFLE9BQU9ELE9BQU8sR0FBR0EsVUFBVSxJQUFJMkM7SUFFL0IsSUFBSUMsU0FBUztRQUNULE9BQU8sSUFBSTtJQUNmO0lBRUEsSUFBSUMsVUFBVTtRQUNWQyxVQUFVO1FBQ1ZDLFlBQVk7UUFDWkMsVUFBVTtRQUNWQyxXQUFXO1FBQ1hDLFVBQVU7UUFDVkMsUUFBUTtRQUNSQyxhQUFhLENBQUM7SUFDbEI7SUFFQXBELFdBQVcsR0FBRyxTQUFTc0QsR0FBRztRQUN0QixJQUFJLENBQUNULFFBQVFVLGNBQWMsQ0FBQ0QsTUFDeEIsTUFBTSxJQUFJRSxNQUFNLHlCQUF5QkY7UUFFN0MsT0FBT1QsT0FBTyxDQUFDUyxJQUFJO0lBQ3ZCO0lBRUF0RCxXQUFXLEdBQUcsU0FBU3NELEdBQUcsRUFBRUksS0FBSztRQUM3QixJQUFJLENBQUNiLFFBQVFVLGNBQWMsQ0FBQ0QsTUFDeEIsTUFBTSxJQUFJRSxNQUFNLHlCQUF5QkY7UUFFN0NULE9BQU8sQ0FBQ1MsSUFBSSxHQUFHSTtJQUNuQjtJQUVBMUQsV0FBVyxHQUFHO1FBQ1YsT0FBT3dDLEtBQUtvQixVQUFVLENBQUNmO0lBQzNCO0lBRUE3QyxpQkFBaUIsR0FBRyxTQUFTTSxJQUFJLEVBQUV3RCxTQUFTO1FBQ3hDLElBQUlqQixRQUFRTyxXQUFXLENBQUM5QyxLQUFLLEVBQ3pCLE9BQU91QyxRQUFRTyxXQUFXLENBQUM5QyxLQUFLO1FBRXBDLElBQUl5RCxRQUFRekQsS0FBSzBELEtBQUssQ0FBQztRQUN2QkYsWUFBWUEsYUFBYUMsS0FBSyxDQUFDQSxNQUFNRSxNQUFNLEdBQUcsRUFBRSxJQUFJO1FBQ3BELElBQUlDLE9BQU9ILEtBQUssQ0FBQ0EsTUFBTUUsTUFBTSxHQUFHLEVBQUUsQ0FBQ0UsT0FBTyxDQUFDTCxXQUFXLElBQUlLLE9BQU8sQ0FBQyxxQkFBcUI7UUFFdkYsSUFBSSxDQUFDRCxRQUFRSCxNQUFNRSxNQUFNLEdBQUcsR0FDeEJDLE9BQU9ILEtBQUssQ0FBQ0EsTUFBTUUsTUFBTSxHQUFHLEVBQUU7UUFDbEMsSUFBSUcsT0FBT3ZCLE9BQU8sQ0FBQ2lCLFlBQVksT0FBTztRQUN0QyxJQUFJTSxRQUFRLE1BQ1JBLE9BQU92QixRQUFRSyxRQUFRO1FBQzNCLElBQUlrQixRQUFRQSxLQUFLQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEtBQzFCRCxRQUFRO1FBQ1osT0FBT0EsT0FBT04sWUFBWSxNQUFNSSxPQUFPLElBQUksQ0FBQ2IsR0FBRyxDQUFDO0lBQ3BEO0lBRUFyRCxvQkFBb0IsR0FBRyxTQUFTTSxJQUFJLEVBQUVpRSxLQUFLO1FBQ3ZDLE9BQU8xQixRQUFRTyxXQUFXLENBQUM5QyxLQUFLLEdBQUdpRTtJQUN2QztJQUVBdkUsZ0JBQWdCLEdBQUcsQ0FBQztJQUNwQkEsa0JBQWtCLEdBQUcsU0FBUzBFLFVBQVUsRUFBRUMsTUFBTTtRQUM1QyxRQUFRO0lBQ1o7QUFFQSxDQUFDO0FBQUEsa0dBQUM7Ozs7Ozs7O0FDbkdGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNBcUJpQyxHQUVqQzdFLG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBRXhDRCxjQUFjLEdBQUc7SUFDakJBLGdCQUFnQixHQUFHO0lBQ25CQSx5Q0FBMEU7SUFFMUUsSUFBSStFLE1BQU1oRixtQkFBT0EsQ0FBQyxHQUFzQjtJQUN4Q2dGLElBQUlDLGVBQWUsQ0FBQ2hGLFFBQVE4RSxPQUFPLEVBQUU5RSxRQUFRNkUsUUFBUTtBQUVyRCxDQUFDO0FBQUEsa0dBQUM7Ozs7Ozs7O0FDaENGOzs7O0VBSUUsR0FFRi9FLG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBQ3hDO0lBRUEsSUFBSXdDLE1BQU0xQyxtQkFBT0EsQ0FBQyxHQUFzQjtJQUN4QyxJQUFJa0YsYUFBYWxGLG1CQUFPQSxDQUFDLEdBQWM7SUFDdkMsSUFBSWdGLE1BQU1oRixtQkFBT0EsQ0FBQyxHQUFzQjtJQUN4QyxJQUFJbUYsYUFBYW5GLHFDQUEyQztJQUU1RCxJQUFJb0YsZUFBZSxTQUFTN0MsSUFBSTtRQUM1QixJQUFJLENBQUM4QyxTQUFTLEdBQUc7UUFDakIsSUFBSSxDQUFDQyxPQUFPLENBQUMvQztJQUNqQjtJQUVDO1FBQ0csSUFBSSxDQUFDOEMsU0FBUyxHQUFHRTtRQUNqQixJQUFJLENBQUNDLGNBQWMsR0FBR0Q7UUFDdEIsSUFBSSxDQUFDRSxXQUFXLEdBQUc7UUFFbkIvQyxJQUFJZ0QsU0FBUyxDQUFDLElBQUksRUFBRVI7UUFFcEIsSUFBSSxDQUFDUyxVQUFVLEdBQUc7UUFFbEIsSUFBSSxDQUFDTCxPQUFPLEdBQUcsU0FBUy9DLElBQUk7WUFDeEIsSUFBSXFELE1BQU1DLE9BQU8sQ0FBQ3RELE9BQ2RBLE9BQU87Z0JBQUN1RCxPQUFPdkQ7WUFBSTtZQUV2QixJQUFJLENBQUNBLElBQUksR0FBR0EsUUFBUSxDQUFDO1lBRXJCLElBQUksSUFBSSxDQUFDQSxJQUFJLENBQUN3RCxNQUFNLElBQUlSLFdBQVc7Z0JBQy9CLElBQUksQ0FBQ2hELElBQUksQ0FBQ3dELE1BQU0sR0FBRyxDQUFDO1lBQ3hCO1lBQ0EsSUFBSSxJQUFJLENBQUN4RCxJQUFJLENBQUN3RCxNQUFNLEdBQUcsR0FBRztnQkFDdEIsSUFBSSxDQUFDQyxZQUFZLEdBQUcsRUFBRTtnQkFDdEIsSUFBSSxDQUFDMUUsSUFBSSxDQUFDLElBQUksQ0FBQ2lCLElBQUk7Z0JBQ25CLElBQUksQ0FBQ3lELFlBQVksQ0FBQ0MsT0FBTztZQUM3QixPQUFPO2dCQUNILElBQUksQ0FBQ0QsWUFBWSxHQUFHO29CQUFDLElBQUksQ0FBQ3pELElBQUk7aUJBQUM7WUFDbkM7WUFDQSxJQUFJLENBQUMyRCxhQUFhLEdBQUcsSUFBSSxDQUFDM0QsSUFBSTtZQUU5QixJQUFJLENBQUM0RCxPQUFPLENBQUM7WUFDYixJQUFJLENBQUNBLE9BQU8sQ0FBQztRQUNqQjtRQUVBLElBQUksQ0FBQzdFLElBQUksR0FDVCxJQUFJLENBQUM4RSxNQUFNLEdBQUcsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLE1BQU07WUFDckMsSUFBSSxPQUFPRCxRQUFRLFVBQ2ZBLE9BQU9BLE9BQU8sTUFBTTtZQUN4QixJQUFJLENBQUNELE1BQ0Q7WUFFSixJQUFJUCxRQUFRLElBQUksQ0FBQ0UsWUFBWTtZQUM3QixJQUFJLElBQUksQ0FBQ1EsTUFBTSxDQUFDSCxTQUFVQSxDQUFBQSxTQUFTLElBQUksQ0FBQzlELElBQUksSUFBSXVELE1BQU01QixNQUFNLEdBQ3hEO1lBQ0osSUFBSXVDLEtBQUssSUFBSSxDQUFDQyxXQUFXLENBQUNMO1lBQzFCLElBQUksSUFBSSxDQUFDTSxZQUFZLElBQUksSUFBSSxDQUFDQyxrQkFBa0IsQ0FBQ1AsTUFBTUksS0FBSztnQkFDeEQsSUFBSUksUUFBUUMsV0FBVztvQkFDbkJULEtBQUtVLE1BQU0sR0FBRztvQkFDZCxJQUFJLENBQUNaLE9BQU8sQ0FBQyxVQUFVRTtnQkFDM0IsR0FBRVcsSUFBSSxDQUFDLElBQUksR0FBRztnQkFDZCxJQUFJLENBQUNMLFlBQVksQ0FBQ04sTUFBTSxVQUFTWSxHQUFHLEVBQUVSLEVBQUU7b0JBQ3BDUyxhQUFhTDtvQkFDYixJQUFJLENBQUNNLFFBQVEsQ0FBQ2QsTUFBTSxNQUFNO29CQUMxQkEsS0FBS1UsTUFBTSxHQUFHO29CQUNkLElBQUksQ0FBQ0UsS0FDRCxJQUFJLENBQUNiLE1BQU0sQ0FBQ0MsTUFBTSxNQUFNO2dCQUNoQyxHQUFFVyxJQUFJLENBQUMsSUFBSTtnQkFDWCxJQUFJLENBQUNJLE9BQU8sQ0FBQ2YsTUFBTTtnQkFDbkI7WUFDSjtZQUNBLElBQUksQ0FBQ2UsT0FBTyxDQUFDZixNQUFNO1lBQ25CLElBQUlnQixJQUFJdkIsTUFBTXdCLE9BQU8sQ0FBQ2pCO1lBQ3RCLElBQUksQ0FBQ0ksSUFBSTtnQkFDTCxJQUFJLENBQUNOLE9BQU8sQ0FBQyxVQUFVRTtnQkFDdkI7WUFDSjtZQUNBLElBQUlnQixNQUFNLENBQUMsS0FBS3ZCLE1BQU01QixNQUFNLElBQUksSUFBSSxDQUFDcUQsVUFBVSxFQUMzQztZQUNKZCxLQUFLO2dCQUFDWSxJQUFJO2dCQUFHO2FBQUUsQ0FBQ0csTUFBTSxDQUFDZjtZQUN2QlgsTUFBTTJCLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDNUIsT0FBT1c7WUFFMUIsSUFBSyxJQUFJa0IsSUFBSSxHQUFHQSxJQUFJbEIsR0FBR3ZDLE1BQU0sRUFBRXlELElBQUs7Z0JBQ2hDLElBQUlDLFlBQVluQixFQUFFLENBQUNrQixFQUFFO2dCQUNyQixJQUFJLElBQUksQ0FBQ25CLE1BQU0sQ0FBQ29CLFlBQVk7b0JBQ3hCLElBQUksQ0FBQ1IsT0FBTyxDQUFDUSxXQUFXO29CQUN4QixJQUFJLENBQUN0RyxJQUFJLENBQUNzRyxXQUFXdEIsT0FBTyxHQUFHQztnQkFDbkMsT0FBTyxJQUFJRCxPQUFPLEdBQUc7b0JBQ2pCLElBQUksQ0FBQ2hGLElBQUksQ0FBQ3NHLFdBQVd0QixPQUFPLEdBQUdDO2dCQUNuQztZQUNKO1lBRUEsSUFBSSxDQUFDc0IsSUFBSSxHQUFHL0IsTUFBTTVCLE1BQU07WUFDeEJxQyxVQUFVLElBQUksQ0FBQ0osT0FBTyxDQUFDLFVBQVVFO1FBQ3JDO1FBRUEsSUFBSSxDQUFDbEYsS0FBSyxHQUNWLElBQUksQ0FBQ2dHLFFBQVEsR0FBRyxTQUFTZCxJQUFJLEVBQUVDLElBQUksRUFBRUMsTUFBTTtZQUN2QyxJQUFJLE9BQU9ELFFBQVEsVUFDZkEsT0FBT0EsT0FBTyxPQUFPO1lBQ3pCLElBQUlSLFFBQVEsSUFBSSxDQUFDRSxZQUFZO1lBQzdCLElBQUk4QixTQUFTekIsU0FBUyxJQUFJLENBQUM5RCxJQUFJO1lBQy9CLElBQUl1RixRQUFRO2dCQUNSLElBQUksQ0FBQ1YsT0FBTyxDQUFDZixNQUFNO2dCQUNuQixJQUFJQyxNQUFNO29CQUNOLElBQUssSUFBSWUsSUFBSSxHQUFHQSxJQUFJdkIsTUFBTTVCLE1BQU0sRUFBRW1ELElBQUs7d0JBQ25DLElBQUlaLEtBQUtYLEtBQUssQ0FBQ3VCLEVBQUU7d0JBQ2pCLElBQUksQ0FBQ1osR0FBR3FCLE1BQU0sRUFDZDs0QkFBQSxJQUFJLElBQUksQ0FBQ3RCLE1BQU0sQ0FBQ0MsT0FBT0EsR0FBR1YsTUFBTSxHQUFHTSxLQUFLTixNQUFNLEdBQUdPLE1BQU07Z0NBQ25ELElBQUksQ0FBQ2MsT0FBTyxDQUFDWCxJQUFJO2dDQUNqQkYsVUFBVSxJQUFJLENBQUNKLE9BQU8sQ0FBQyxZQUFZTTs0QkFDdkM7d0JBQUE7b0JBQ0o7Z0JBQ0o7Z0JBQ0FYLE1BQU01QixNQUFNLEdBQUc7Z0JBQ2YsSUFBSTRELFFBQ0EsSUFBSSxDQUFDeEcsSUFBSSxDQUFDLElBQUksQ0FBQ2lCLElBQUksRUFBRSxHQUFHZ0U7Z0JBQzVCO1lBQ0o7WUFFQSxJQUFJLENBQUNGLFFBQVEsQ0FBQyxJQUFJLENBQUNHLE1BQU0sQ0FBQ0gsT0FDdEI7WUFDSixJQUFJZ0IsSUFBSXZCLE1BQU13QixPQUFPLENBQUNqQjtZQUN0QixJQUFJZ0IsTUFBTSxDQUFDLEdBQ1A7WUFDSixJQUFJVSxZQUFZMUIsS0FBS04sTUFBTTtZQUMzQixJQUFJaUMsY0FBYztZQUNsQixJQUFLLElBQUlDLElBQUlaLElBQUksR0FBR1ksSUFBSW5DLE1BQU01QixNQUFNLEVBQUUrRCxJQUFLO2dCQUN2QyxJQUFJbkMsS0FBSyxDQUFDbUMsRUFBRSxDQUFDbEMsTUFBTSxHQUFHZ0MsV0FDbEJDO3FCQUVBO1lBQ1I7WUFFQSxJQUFJMUIsTUFBTTtnQkFDTixJQUFLLElBQUlxQixJQUFJLEdBQUdBLElBQUlLLGFBQWFMLElBQUs7b0JBQ2xDLElBQUlsQixLQUFLWCxLQUFLLENBQUM2QixJQUFJTixFQUFFO29CQUNyQixJQUFJLElBQUksQ0FBQ2IsTUFBTSxDQUFDQyxPQUFPQSxHQUFHVixNQUFNLEdBQUdNLEtBQUtOLE1BQU0sR0FBR08sTUFBTTt3QkFDbkQsSUFBSSxDQUFDYyxPQUFPLENBQUNYLElBQUk7d0JBQ2pCRixVQUFVLElBQUksQ0FBQ0osT0FBTyxDQUFDLFlBQVlNO29CQUN2QztnQkFDSjtZQUNKO1lBQ0FYLE1BQU0yQixNQUFNLENBQUNKLElBQUksR0FBR1c7WUFDcEIsSUFBSSxDQUFDWixPQUFPLENBQUNmLE1BQU07WUFDbkJFLFVBQVUsSUFBSSxDQUFDSixPQUFPLENBQUMsWUFBWUU7WUFFbkMsSUFBSXlCLFFBQ0EsSUFBSSxDQUFDeEcsSUFBSSxDQUFDLElBQUksQ0FBQ2lCLElBQUksRUFBRSxHQUFHZ0U7UUFDaEM7UUFFQSxJQUFJLENBQUMyQixVQUFVLEdBQUcsU0FBUzdCLElBQUksRUFBRUMsSUFBSSxFQUFFQyxNQUFNO1lBQ3pDLElBQUlGLFFBQVEsSUFBSSxDQUFDRyxNQUFNLENBQUNILE9BQ3BCLElBQUksQ0FBQ2xGLEtBQUssQ0FBQ2tGLE1BQU1DLE1BQU1DO2lCQUV2QixJQUFJLENBQUNqRixJQUFJLENBQUMrRSxNQUFNQyxNQUFNQztRQUM5QjtRQUVBLElBQUksQ0FBQzRCLElBQUksR0FBRyxTQUFTQyxRQUFRLEVBQUVDLE9BQU87WUFDbEMsSUFBSSxDQUFDQSxTQUFTO2dCQUNWQSxVQUFVQztZQUNkO1lBQ0EsT0FBT0YsU0FBU0QsSUFBSSxDQUFDLFNBQVNJLENBQUMsRUFBRUMsQ0FBQztnQkFDOUIsSUFBSUMsWUFBWUYsRUFBRUgsUUFBUSxJQUFJRyxFQUFFRyxHQUFHO2dCQUNuQyxJQUFJQyxZQUFZSCxFQUFFSixRQUFRLElBQUlJLEVBQUVFLEdBQUc7Z0JBQ25DLElBQUlELGFBQWEsQ0FBQ0UsV0FBVyxPQUFPLENBQUM7Z0JBQ3JDLElBQUksQ0FBQ0YsYUFBYUUsV0FBVyxPQUFPO2dCQUVwQyxPQUFPTixRQUFRRSxFQUFFSyxLQUFLLElBQUksSUFBSUosRUFBRUksS0FBSyxJQUFJO1lBQzdDO1FBQ0o7UUFFQSxJQUFJLENBQUNDLFNBQVMsR0FBRyxTQUFTQyxFQUFFO1lBQ3hCLElBQUksQ0FBQ0MsU0FBUyxHQUFHRDtZQUNqQixJQUFJLENBQUN4RCxPQUFPLENBQUMsSUFBSSxDQUFDL0MsSUFBSTtRQUMxQjtRQUNBLElBQUksQ0FBQ21FLFdBQVcsR0FBRyxTQUFTTCxJQUFJO1lBQzVCLElBQUkrQixXQUFXL0IsS0FBSytCLFFBQVE7WUFDNUIsSUFBSSxDQUFDQSxVQUFVO2dCQUNYLElBQUkvQixLQUFLVSxNQUFNLEtBQUssV0FDaEI7Z0JBQ0osSUFBSVYsS0FBS3FDLEdBQUcsRUFBRTtvQkFDVk4sV0FBV1ksT0FBT0MsSUFBSSxDQUFDNUMsS0FBS3FDLEdBQUcsRUFBRUEsR0FBRyxDQUFDLFNBQVNuRixHQUFHO3dCQUM3QyxJQUFJa0QsS0FBS0osS0FBS3FDLEdBQUcsQ0FBQ25GLElBQUk7d0JBQ3RCa0QsR0FBR3lDLE1BQU0sR0FBRzdDO3dCQUNaLE9BQU9JO29CQUNYO2dCQUNKLE9BQU8sSUFBSUosS0FBS1AsS0FBSyxFQUFFO29CQUNuQnNDLFdBQVcvQixLQUFLUCxLQUFLO2dCQUN6QjtnQkFDQSxJQUFJc0MsVUFBVTtvQkFDVi9CLEtBQUsrQixRQUFRLEdBQUdBO2dCQUNwQjtZQUNKO1lBQ0EsSUFBSTNCLEtBQUsyQixZQUFZQSxRQUFRLENBQUMsRUFBRSxJQUFJQSxRQUFRLENBQUMsRUFBRTtZQUMvQyxJQUFJM0IsSUFBSTtnQkFDSixJQUFJMEMsSUFBSSxLQUFNcEQsTUFBTSxHQUFHLEtBQU07Z0JBQzdCcUMsU0FBU2dCLE9BQU8sQ0FBQyxTQUFTQyxDQUFDO29CQUN0QkEsRUFBRXRELE1BQU0sR0FBR29EO29CQUNYRSxFQUFFSCxNQUFNLEdBQUc3QztnQkFDaEI7WUFDSjtZQUVBLElBQUksSUFBSSxDQUFDMEMsU0FBUyxFQUFFO2dCQUNoQlgsV0FBV0EsWUFBWUEsU0FBU2tCLE1BQU0sQ0FBQyxJQUFJLENBQUNQLFNBQVM7WUFDekQ7WUFFQSxJQUFJLElBQUksQ0FBQ3BELFVBQVUsSUFBSSxDQUFDVSxLQUFLa0QsT0FBTyxFQUFFO2dCQUNsQ25CLFlBQVksSUFBSSxDQUFDRCxJQUFJLENBQUNDO1lBQzFCO1lBQ0EsT0FBT0E7UUFDWDtRQUNBLElBQUksQ0FBQ3pCLFlBQVksR0FBRztRQUNwQixJQUFJLENBQUNDLGtCQUFrQixHQUFHLFNBQVNQLElBQUksRUFBRUksRUFBRTtZQUN2QyxPQUFPSixLQUFLVSxNQUFNLEtBQUs7UUFDM0I7UUFFQSxJQUFJLENBQUN5QyxXQUFXLEdBQUcsU0FBU25ELElBQUk7WUFDNUIsSUFBSUEsS0FBSytCLFFBQVEsRUFDYixPQUFPL0IsS0FBSytCLFFBQVEsQ0FBQ2xFLE1BQU0sS0FBSztZQUNwQyxPQUFPbUMsS0FBS3FDLEdBQUcsSUFBSXJDLEtBQUtVLE1BQU0sS0FBSyxhQUM1QlYsS0FBS1AsS0FBSyxJQUFJTyxLQUFLUCxLQUFLLENBQUM1QixNQUFNO1FBQzFDO1FBRUEsSUFBSSxDQUFDdUYsY0FBYyxHQUFHLFlBRXRCO1FBRUEsSUFBSSxDQUFDQyxVQUFVLEdBQUcsU0FBU3JELElBQUksRUFBRXNELEdBQUc7WUFDaEMsSUFBSSxDQUFDQSxLQUFLQSxNQUFNO1lBQ2hCLElBQUlULFNBQVM3QyxLQUFLNkMsTUFBTTtZQUN4QixJQUFJekMsS0FBSyxJQUFJLENBQUNDLFdBQVcsQ0FBQ3dDO1lBQzFCLElBQUlVLE1BQU1uRCxHQUFHYSxPQUFPLENBQUNqQjtZQUNyQixPQUFPSSxFQUFFLENBQUNtRCxNQUFNRCxJQUFJO1FBQ3hCO1FBRUEsSUFBSSxDQUFDRSxjQUFjLEdBQUcsU0FBU3hDLENBQUM7WUFDNUIsT0FBTyxJQUFJLENBQUNyQixZQUFZLENBQUNxQixFQUFFO1FBQy9CO1FBRUEsSUFBSSxDQUFDeUMsZUFBZSxHQUFHLFNBQVN6RCxJQUFJO1lBQ2hDLE9BQU8sSUFBSSxDQUFDTCxZQUFZLENBQUNzQixPQUFPLENBQUNqQjtRQUNyQztRQUVBLElBQUksQ0FBQzBELFdBQVcsR0FBRztZQUFZLE9BQU87UUFBQztRQUN2QyxJQUFJLENBQUNDLFdBQVcsR0FBRztZQUFZLE9BQU8sSUFBSSxDQUFDaEUsWUFBWSxDQUFDOUIsTUFBTSxHQUFHO1FBQUM7UUFFbEUsSUFBSSxDQUFDa0QsT0FBTyxHQUFHLFNBQVNmLElBQUksRUFBRTRELEdBQUc7WUFDN0IsT0FBTzVELEtBQUtHLE1BQU0sR0FBR3lEO1FBQ3pCO1FBQ0EsSUFBSSxDQUFDekQsTUFBTSxHQUFHLFNBQVNILElBQUk7WUFDdkIsT0FBT0EsS0FBS0csTUFBTTtRQUN0QjtRQUNBLElBQUksQ0FBQzBELFNBQVMsR0FBRyxTQUFTN0QsSUFBSTtZQUMxQixPQUFPLElBQUksQ0FBQ0wsWUFBWSxDQUFDc0IsT0FBTyxDQUFDakIsVUFBVSxDQUFDO1FBQ2hEO1FBQ0EsSUFBSSxDQUFDOEQsVUFBVSxHQUFHLFNBQVM5RCxJQUFJO1lBQzNCLE9BQU9BLEtBQUs4RCxVQUFVO1FBQzFCO1FBQ0EsSUFBSSxDQUFDQyxXQUFXLEdBQUcsU0FBUy9ELElBQUksRUFBRTRELEdBQUc7WUFDakMsT0FBTzVELEtBQUs4RCxVQUFVLEdBQUcsQ0FBQyxDQUFDRjtRQUMvQjtRQUNBLElBQUksQ0FBQ0ksWUFBWSxHQUFHLFNBQVNoRSxJQUFJO1lBQzdCLE9BQU8sQ0FBQ0EsUUFBUSxDQUFFQSxDQUFBQSxLQUFLaUUsUUFBUSxJQUFJakUsS0FBS04sTUFBTSxHQUFHO1FBQ3JEO1FBRUEsSUFBSSxDQUFDd0UsVUFBVSxHQUFHLFNBQVNsRSxJQUFJLEVBQUVtRSxLQUFLO1lBQ2xDLEdBQUc7Z0JBQ0MsSUFBSUEsU0FBU25FLE1BQ1QsT0FBTztZQUNmLFFBQVNtRSxRQUFRQSxNQUFNdEIsTUFBTSxDQUFFO1lBQy9CLE9BQU87UUFDWDtRQUVBLElBQUksQ0FBQ3VCLFlBQVksR0FBRyxTQUFTcEUsSUFBSSxFQUFFOUYsSUFBSSxFQUFFb0QsS0FBSztZQUMxQzBDLElBQUksQ0FBQzlGLEtBQUssR0FBR29EO1lBQ2IsSUFBSSxDQUFDd0MsT0FBTyxDQUFDLFVBQVVFO1FBQzNCO1FBRUEsSUFBSSxDQUFDcUUsWUFBWSxHQUFHLFNBQVM3QyxJQUFJLEVBQUU4QyxPQUFPLEVBQUVDLFFBQVE7WUFDaEQsSUFBSUMsT0FBTyxJQUFJLENBQUM3RSxZQUFZLENBQUMxQixLQUFLLENBQUN1RCxLQUFLaUQsS0FBSyxFQUFFakQsS0FBS2lELEtBQUssR0FBR2pELEtBQUszRCxNQUFNO1lBQ3ZFMEcsU0FBUyxNQUFNQyxNQUFNO1lBQ3JCLE9BQU9BO1FBQ1g7UUFFQSxJQUFJLENBQUNFLFFBQVEsR0FBRyxTQUFTQyxHQUFHLEVBQUVDLE1BQU07WUFDaEMsSUFBSUgsUUFBUUksS0FBS0MsS0FBSyxDQUFDSCxNQUFNLElBQUksQ0FBQzNGLFNBQVM7WUFDM0MsSUFBSStGLE1BQU1GLEtBQUtHLElBQUksQ0FBQ0osU0FBUyxJQUFJLENBQUM1RixTQUFTLElBQUk7WUFDL0MsSUFBSWlHLFFBQVEsSUFBSSxDQUFDdEYsWUFBWSxDQUFDMUIsS0FBSyxDQUFDd0csT0FBT007WUFDM0NFLE1BQU1DLEtBQUssR0FBR1Q7WUFDZFEsTUFBTUUsSUFBSSxHQUFHLElBQUksQ0FBQ25HLFNBQVMsR0FBR2lHLE1BQU1DLEtBQUs7WUFDekMsT0FBT0Q7UUFDWDtRQUNBLElBQUksQ0FBQ0csY0FBYyxHQUFHLFNBQVNULEdBQUcsRUFBRUMsTUFBTTtZQUN0QyxPQUFPLElBQUksQ0FBQzVGLFNBQVMsR0FBRyxJQUFJLENBQUNXLFlBQVksQ0FBQzlCLE1BQU07UUFDcEQ7UUFFQSxJQUFJLENBQUN3SCxlQUFlLEdBQUcsU0FBU3JGLElBQUk7WUFDaEMsSUFBSWdCLElBQUksSUFBSSxDQUFDckIsWUFBWSxDQUFDc0IsT0FBTyxDQUFDakI7WUFDbEMsSUFBSWdCLEtBQUssQ0FBQyxLQUFLaEIsUUFBUUEsS0FBSzZDLE1BQU0sRUFBRTtnQkFDaEM3QixJQUFJLElBQUksQ0FBQ3JCLFlBQVksQ0FBQ3NCLE9BQU8sQ0FBQ2pCLEtBQUs2QyxNQUFNO1lBQzdDO1lBQ0EsSUFBSThCLE1BQU0zRCxJQUFJLElBQUksQ0FBQ2hDLFNBQVM7WUFDNUIsSUFBSXNHLFNBQVMsSUFBSSxDQUFDdEcsU0FBUztZQUMzQixPQUFPO2dCQUFDMkYsS0FBS0E7Z0JBQUtXLFFBQVFBO1lBQU07UUFDcEM7UUFFQSxJQUFJLENBQUNDLGdCQUFnQixHQUFHLFNBQVNDLE1BQU0sRUFBRUMsSUFBSTtZQUN6QyxJQUFJQyxRQUFRYixLQUFLQyxLQUFLLENBQUNVLFNBQVMsSUFBSSxDQUFDeEcsU0FBUztZQUM5QyxJQUFJeUcsTUFDQUMsUUFBUWIsS0FBS2MsR0FBRyxDQUFDZCxLQUFLZSxHQUFHLENBQUMsR0FBR0YsUUFBUSxJQUFJLENBQUMvRixZQUFZLENBQUM5QixNQUFNLEdBQUc7WUFDcEUsT0FBTyxJQUFJLENBQUM4QixZQUFZLENBQUMrRixNQUFNO1FBQ25DO1FBQ0EsSUFBSSxDQUFDRyxXQUFXLEdBQUcsU0FBUzdGLElBQUk7WUFDNUIsT0FBTztRQUNYO1FBQ0EsSUFBSSxDQUFDOEYsWUFBWSxHQUFHLFNBQVM5RixJQUFJO1lBQzdCLE9BQU8sQ0FBQ0EsS0FBSytGLFNBQVMsSUFBSSxFQUFDLElBQU0vRixDQUFBQSxLQUFLVSxNQUFNLElBQUksWUFBWSxhQUFhLEVBQUM7UUFDOUU7UUFDQSxJQUFJLENBQUNzRixRQUFRLEdBQUcsU0FBU2hHLElBQUksRUFBRTlGLElBQUksRUFBRStMLE9BQU87WUFDeENqRyxLQUFLK0YsU0FBUyxHQUFHL0YsS0FBSytGLFNBQVMsSUFBSTtZQUNuQ3BILElBQUl1SCxXQUFXLENBQUNsRyxNQUFNOUYsTUFBTStMO1lBQzVCLElBQUksQ0FBQ25HLE9BQU8sQ0FBQztRQUNqQjtRQUNBLElBQUksQ0FBQ3FHLFVBQVUsR0FBRztRQUNsQixJQUFJLENBQUNDLGNBQWMsR0FBRyxTQUFTcEcsSUFBSTtZQUMvQixPQUFPbEIsV0FBV2tCLEtBQUt1QyxLQUFLLElBQUl2QyxLQUFLOUYsSUFBSSxJQUFLLFFBQU84RixRQUFRLFdBQVdBLE9BQU8sRUFBQztRQUNwRjtRQUNBLElBQUksQ0FBQ3FHLGNBQWMsR0FBRztRQUN0QixJQUFJLENBQUNDLGVBQWUsR0FBRztZQUFhLE9BQU8sSUFBSSxDQUFDQyxZQUFZLElBQUk7UUFBRztRQUNuRSxJQUFJLENBQUNDLE9BQU8sR0FBRyxTQUFTeEcsSUFBSTtZQUN4QixPQUFPQSxLQUFLdUMsS0FBSyxJQUFJdkMsS0FBSzlGLElBQUksSUFBSTtRQUN0QztRQUNBLElBQUksQ0FBQ3VNLFlBQVksR0FBRyxTQUFTekcsSUFBSTtZQUM3QixPQUFPQSxLQUFLTixNQUFNO1FBQ3RCO1FBQ0EsSUFBSSxDQUFDZ0gsWUFBWSxHQUFHO1lBQ2hCLElBQUksQ0FBQy9HLFlBQVksR0FBRyxFQUFFO1lBQ3RCLElBQUksQ0FBQ3VCLFVBQVUsR0FBSztZQUNwQixJQUFJLENBQUNqQyxPQUFPLENBQUMsSUFBSSxDQUFDL0MsSUFBSTtRQUMxQjtRQUNBLElBQUksQ0FBQ3lLLFlBQVksR0FBRztZQUNoQixJQUFJLENBQUN6RixVQUFVLEdBQUs7WUFDcEIsSUFBSSxDQUFDakMsT0FBTyxDQUFDLElBQUksQ0FBQy9DLElBQUk7UUFDMUI7SUFFSixHQUFHMEssSUFBSSxDQUFDN0gsYUFBYThILFNBQVM7SUFFOUIsU0FBUzVFLGdCQUFnQkMsQ0FBQyxFQUFFQyxDQUFDO1FBQ3pCLElBQUkyRSxZQUFZO1FBQ2hCLElBQUssSUFBSUMsSUFBSSxHQUFHQyxJQUFJbkMsS0FBS2MsR0FBRyxDQUFDekQsRUFBRXJFLE1BQU0sRUFBRXNFLEVBQUV0RSxNQUFNLEdBQUdrSixJQUFJQyxHQUFHRCxJQUFLO1lBQzFELElBQUlFLE1BQU0vRSxFQUFFZ0YsVUFBVSxDQUFDSDtZQUN2QixJQUFJSSxNQUFNaEYsRUFBRStFLFVBQVUsQ0FBQ0g7WUFFdkIsSUFBSUUsTUFBTSxNQUFNRSxNQUFNLE1BQU1GLE1BQU0sTUFBTUUsTUFBTSxJQUFJO2dCQUM5QyxJQUFJQyxPQUFPLEdBQUdDLE9BQU87Z0JBQ3JCLElBQUlyRSxJQUFJK0Q7Z0JBQ1IsR0FBRztvQkFDQ0ssT0FBTyxLQUFLQSxPQUFRSCxDQUFBQSxNQUFNLEVBQUM7b0JBQzNCQSxNQUFNL0UsRUFBRWdGLFVBQVUsQ0FBQyxFQUFFbEU7Z0JBQ3pCLFFBQVFpRSxNQUFNLE1BQU1BLE1BQU0sR0FBSTtnQkFDOUJqRSxJQUFJK0Q7Z0JBQ0osR0FBRztvQkFDQ00sT0FBTyxLQUFLQSxPQUFRRixDQUFBQSxNQUFNLEVBQUM7b0JBQzNCQSxNQUFNaEYsRUFBRStFLFVBQVUsQ0FBQyxFQUFFbEU7Z0JBQ3pCLFFBQVFtRSxNQUFNLE1BQU1BLE1BQU0sR0FBSTtnQkFFOUIsSUFBSUMsU0FBU0MsTUFDVE4sSUFBSS9ELElBQUk7cUJBRVIsT0FBT29FLE9BQU9DO1lBQ3RCLE9BQU8sSUFBSUosUUFBUUUsS0FBSztnQkFDcEIsSUFBSUcsT0FBT3BGLENBQUMsQ0FBQzZFLEVBQUUsQ0FBQ1EsV0FBVztnQkFDM0IsSUFBSUMsT0FBT3JGLENBQUMsQ0FBQzRFLEVBQUUsQ0FBQ1EsV0FBVztnQkFDM0IsSUFBSUQsT0FBT0UsTUFBTSxPQUFPLENBQUM7Z0JBQ3pCLElBQUlGLE9BQU9FLE1BQU0sT0FBTztnQkFDeEIsSUFBSSxDQUFDVixXQUFXQSxZQUFZSyxNQUFNRjtZQUN0QztRQUNKO1FBQ0EsT0FBT0gsYUFBYTVFLEVBQUVyRSxNQUFNLEdBQUdzRSxFQUFFdEUsTUFBTTtJQUMzQztJQUVBa0IsYUFBYWtELGVBQWUsR0FBR0E7SUFDL0JsRCxhQUFhOEgsU0FBUyxDQUFDNUUsZUFBZSxHQUFHQTtJQUN6Q2xELGFBQWEwSSxzQkFBc0IsR0FBRztRQUNsQyxJQUFJQyxRQUFRO1lBQ1IsSUFBSSxDQUFDQyxrQkFBa0IsR0FBRztRQUM5QixHQUFFaEgsSUFBSSxDQUFDLElBQUk7UUFDWCxJQUFJLENBQUNpSCxFQUFFLENBQUMsWUFBWUY7UUFDcEIsSUFBSSxDQUFDRSxFQUFFLENBQUMsVUFBVUY7UUFDbEIsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQ3JDLGVBQWUsR0FBRyxTQUFTckYsSUFBSTtZQUNoQyxJQUFJZ0IsSUFBSSxJQUFJLENBQUNyQixZQUFZLENBQUNzQixPQUFPLENBQUNqQjtZQUNsQyxJQUFJZ0IsS0FBSyxDQUFDLEtBQUtoQixRQUFRQSxLQUFLNkMsTUFBTSxFQUFFO2dCQUNoQzdCLElBQUksSUFBSSxDQUFDckIsWUFBWSxDQUFDc0IsT0FBTyxDQUFDakIsS0FBSzZDLE1BQU07WUFDN0M7WUFFQSxJQUFJcEQsUUFBUSxJQUFJLENBQUNFLFlBQVk7WUFDN0IsSUFBSWdGLE1BQU0sR0FBR1csU0FBUztZQUN0QixJQUFLLElBQUlJLFFBQVEsR0FBR0EsUUFBUTFFLEdBQUcwRSxRQUFTO2dCQUNwQ0osU0FBUyxJQUFJLENBQUN1QyxhQUFhLENBQUNwSSxLQUFLLENBQUNpRyxNQUFNLEVBQUVBO2dCQUMxQ2YsT0FBT1c7WUFDWDtZQUNBQSxTQUFTLElBQUksQ0FBQ3VDLGFBQWEsQ0FBQ3BJLEtBQUssQ0FBQ3VCLEVBQUUsRUFBRUE7WUFDdEMsT0FBTztnQkFBQzJELEtBQUtBO2dCQUFLVyxRQUFRQTtZQUFNO1FBQ3BDO1FBRUEsSUFBSSxDQUFDd0MsaUJBQWlCLEdBQUcsU0FBU3RDLE1BQU0sRUFBRUMsSUFBSTtZQUMxQyxJQUFJaEcsUUFBUSxJQUFJLENBQUNFLFlBQVk7WUFDN0IsSUFBSWdGLE1BQU0sR0FBR2UsUUFBUSxHQUFHc0IsSUFBSXZILE1BQU01QixNQUFNO1lBQ3hDLE1BQU82SCxRQUFRc0IsRUFBRztnQkFDZCxJQUFJMUIsU0FBUyxJQUFJLENBQUN1QyxhQUFhLENBQUNwSSxLQUFLLENBQUNpRyxNQUFNLEVBQUVBO2dCQUM5Q2YsT0FBT1c7Z0JBQ1BJO2dCQUNBLElBQUlmLE9BQU9hLFFBQVE7b0JBQ2ZFO29CQUNBZixPQUFPVztvQkFDUDtnQkFDSjtZQUNKO1lBRUEsSUFBSUcsTUFDQUMsUUFBUWIsS0FBS2MsR0FBRyxDQUFDZCxLQUFLZSxHQUFHLENBQUMsR0FBR0YsUUFBUWpHLE1BQU01QixNQUFNLEdBQUc7WUFDeEQsT0FBTzZIO1FBQ1g7UUFFQSxJQUFJLENBQUNILGdCQUFnQixHQUFHLFNBQVNDLE1BQU0sRUFBRUMsSUFBSTtZQUN6QyxJQUFJQyxRQUFRLElBQUksQ0FBQ29DLGlCQUFpQixDQUFDdEMsUUFBUUM7WUFDM0MsT0FBTyxJQUFJLENBQUM5RixZQUFZLENBQUMrRixNQUFNO1FBQ25DO1FBRUEsSUFBSSxDQUFDbUMsYUFBYSxHQUFHLFNBQVM3SCxJQUFJLEVBQUUwRixLQUFLO1lBQ3JDLE9BQU8xRixLQUFLc0YsTUFBTSxJQUFJLElBQUksQ0FBQ3RHLFNBQVM7UUFDeEM7UUFFQSxJQUFJLENBQUMwRixRQUFRLEdBQUcsU0FBU0MsR0FBRyxFQUFFQyxNQUFNO1lBQ2hDLElBQUluRixRQUFRLElBQUksQ0FBQ0UsWUFBWTtZQUM3QixJQUFJb0ksU0FBUyxHQUFHckMsUUFBUSxHQUFHc0IsSUFBSXZILE1BQU01QixNQUFNO1lBQzNDLE1BQU82SCxRQUFRc0IsRUFBRztnQkFDZCxJQUFJMUIsU0FBUyxJQUFJLENBQUN1QyxhQUFhLENBQUNwSSxLQUFLLENBQUNpRyxNQUFNLEVBQUVBO2dCQUM5Q3FDLFVBQVV6QztnQkFDVkk7Z0JBQ0EsSUFBSXFDLFVBQVVwRCxLQUFLO29CQUNmZTtvQkFDQXFDLFVBQVV6QztvQkFDVjtnQkFDSjtZQUNKO1lBQ0FJLFFBQVFiLEtBQUtjLEdBQUcsQ0FBQ2QsS0FBS2UsR0FBRyxDQUFDLEdBQUdGLFFBQVFqRyxNQUFNNUIsTUFBTSxHQUFHO1lBRXBELElBQUk0RyxRQUFRaUI7WUFDWixJQUFJWCxNQUFNLElBQUksQ0FBQytDLGlCQUFpQixDQUFDbEQsUUFBUSxRQUFRO1lBQ2pELElBQUlLLFFBQVEsSUFBSSxDQUFDdEYsWUFBWSxDQUFDMUIsS0FBSyxDQUFDd0csT0FBT007WUFDM0NFLE1BQU1DLEtBQUssR0FBR1Q7WUFDZFEsTUFBTUUsSUFBSSxHQUFHNEM7WUFDYixPQUFPOUM7UUFDWDtRQUVBLElBQUksQ0FBQ0csY0FBYyxHQUFHO1lBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUN1QyxrQkFBa0IsRUFBRTtnQkFDMUIsSUFBSWxJLFFBQVEsSUFBSSxDQUFDRSxZQUFZO2dCQUM3QixJQUFJMkYsU0FBUztnQkFDYixJQUFLLElBQUlJLFFBQVEsR0FBR0EsUUFBUWpHLE1BQU01QixNQUFNLEVBQUU2SCxRQUFTO29CQUMvQ0osVUFBVSxJQUFJLENBQUN1QyxhQUFhLENBQUNwSSxLQUFLLENBQUNpRyxNQUFNLEVBQUVBO2dCQUMvQztnQkFDQSxJQUFJLENBQUNpQyxrQkFBa0IsR0FBR3JDO1lBQzlCO1lBQ0EsT0FBTyxJQUFJLENBQUNxQyxrQkFBa0I7UUFDbEM7SUFDSjtJQUNBOU4sT0FBT0QsT0FBTyxHQUFHbUY7QUFDakIsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7OztBQzVkRnJGLGtDQUFBQSxtQ0FBTyxTQUFTQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsTUFBTTtJQUN4QztJQUVBLElBQUl3QyxNQUFNMUMsbUJBQU9BLENBQUMsR0FBc0I7SUFDeEMsSUFBSWdGLE1BQU1oRixtQkFBT0EsQ0FBQyxHQUFzQjtJQUN4QyxJQUFJeUMsT0FBT3pDLG1CQUFPQSxDQUFDLEdBQXVCO0lBQzFDLElBQUltRixhQUFhMUMsS0FBSzBDLFVBQVU7SUFDaEMsSUFBSWtKLGVBQWVyTyxnREFBc0Q7SUFFekUsSUFBSXNPLFFBQVEsU0FBU0MsUUFBUTtRQUN6QixJQUFJLENBQUNDLE9BQU8sR0FBR3hKLElBQUl5SixhQUFhLENBQUM7UUFDakMsSUFBSSxDQUFDRCxPQUFPLENBQUNwQyxTQUFTLEdBQUc7UUFDekJtQyxTQUFTRyxXQUFXLENBQUMsSUFBSSxDQUFDRixPQUFPO0lBQ3JDO0lBRUM7UUFFRzlMLElBQUlnRCxTQUFTLENBQUMsSUFBSSxFQUFFMkk7UUFFcEIsSUFBSSxDQUFDTSxNQUFNLEdBQUcsQ0FBQyxHQUVmLElBQUksQ0FBQ0MsZUFBZSxHQUFHLFNBQVMxTixRQUFRO1lBQ3BDLElBQUksQ0FBQ0EsUUFBUSxHQUFHQTtZQUNoQixJQUFJQSxVQUNBLElBQUksQ0FBQzJOLE1BQU0sR0FBRzNOLFNBQVM0TixTQUFTLEdBQUcsSUFBSSxDQUFDQyxhQUFhLEdBQUcsSUFBSSxDQUFDQyxlQUFlO1FBQ3BGO1FBRUEsSUFBSSxDQUFDSCxNQUFNLEdBQUcsU0FBVUYsTUFBTSxHQUM5QjtRQUVBLElBQUksQ0FBQ00sWUFBWSxHQUFHO1lBQ2hCLElBQUlDLFVBQVUsSUFBSSxDQUFDVixPQUFPLENBQUNXLFVBQVU7WUFDckMsSUFBSUQsU0FBUztnQkFDVCxJQUFJLENBQUNoTyxRQUFRLENBQUNtRSxTQUFTLEdBQUc2SixRQUFRRSxZQUFZO2dCQUM5QyxJQUFJLENBQUNsTyxRQUFRLENBQUNzRSxjQUFjLEdBQUcwSixRQUFRRyxZQUFZO1lBQ3ZEO1FBQ0o7UUFFQSxJQUFJLENBQUNMLGVBQWUsR0FBRyxTQUFVTCxNQUFNO1lBQ25DLElBQUksQ0FBQ0EsTUFBTSxHQUFHQTtZQUVkLElBQUl6TixXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJb08sS0FBS0MsT0FBTyxFQUFFLEVBQUUxRSxPQUFPOEQsT0FBTzlELElBQUksRUFBRTJFO1lBQ3hDLElBQUlDLFdBQVdkLE9BQU9jLFFBQVEsRUFBRUMsVUFBVWYsT0FBT2UsT0FBTyxHQUFHO1lBQzNELElBQUlDLFFBQVEsU0FBU0MsUUFBUTFPLFNBQVNzRSxjQUFjLElBQUl0RSxTQUFTbUUsU0FBUztZQUUxRSxJQUFLaUssTUFBTUcsVUFBVUgsTUFBTUksU0FBU0osTUFBTztnQkFDdkNFLFVBQVUzRSxJQUFJLENBQUN5RSxNQUFNRyxTQUFTO2dCQUM5QixJQUFJdk8sU0FBU2dOLGFBQWEsRUFDdEIwQixRQUFRMU8sU0FBU2dOLGFBQWEsQ0FBQ3NCLFNBQVNGO2dCQUM1QyxJQUFJLENBQUNPLFVBQVUsQ0FBQ04sTUFBTUMsU0FBU0ksT0FBT0QsT0FBT0w7WUFDakQ7WUFFQSxJQUFJRyxZQUFZLEtBQUtDLFdBQVcsR0FBRztnQkFDL0IsSUFBSSxDQUFDSSxpQkFBaUIsQ0FBQzVPLFVBQVVxTyxNQUFNWjtZQUMzQztZQUVBLElBQUksQ0FBQ0gsT0FBTyxDQUFDdUIsU0FBUyxHQUFHUixLQUFLUyxJQUFJLENBQUM7WUFFbkMsSUFBSSxDQUFDSixPQUFPO2dCQUNSLElBQUksQ0FBQ1gsWUFBWTtZQUNyQjtRQUNKO1FBRUEsSUFBSSxDQUFDZ0IsVUFBVSxHQUFHLFNBQVNULE9BQU8sRUFBRVUsTUFBTTtZQUN0QyxPQUFPLDhCQUNKQSxDQUFBQSxPQUFPOUQsU0FBUyxJQUFJLEVBQUMsSUFDdEIsY0FDQ29ELENBQUFBLFFBQVFXLFNBQVMsR0FBRyxLQUFLLFdBQVdELE9BQU9FLE1BQU0sR0FBRyxHQUFFLElBQ3ZEO1FBQ047UUFFQSxJQUFJLENBQUNDLFdBQVcsR0FBRyxTQUFTYixPQUFPLEVBQUVGLEdBQUc7WUFDcEMsSUFBSXBPLFdBQVcsSUFBSSxDQUFDQSxRQUFRO1lBQzVCLE9BQU8sY0FDQUEsQ0FBQUEsU0FBU2lKLFVBQVUsQ0FBQ3FGLFdBQVcsY0FBYSxFQUFDLElBQzdDdE8sQ0FBQUEsU0FBU2lMLFlBQVksQ0FBQ3FELFlBQVksRUFBQyxJQUFNRixDQUFBQSxNQUFNLElBQUksU0FBUyxPQUFNO1FBQzdFO1FBRUEsSUFBSSxDQUFDTyxVQUFVLEdBQUcsU0FBU04sSUFBSSxFQUFFQyxPQUFPLEVBQUVJLEtBQUssRUFBRUQsS0FBSyxFQUFFTCxHQUFHO1lBQ3ZELElBQUlwTyxXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJeUosVUFBVXpKLFNBQVN5SixPQUFPO1lBQzlCLElBQUkyRixTQUFTcFAsU0FBU3VFLFdBQVcsRUFBQywrQkFBK0I7WUFDakU4SixLQUFLZ0IsSUFBSSxDQUFDLHdCQUF3QlgsUUFBUSxRQUNuQ2pGLENBQUFBLFVBQVUsbUJBQW1CQSxRQUFRNkYsV0FBVyxHQUFHLEVBQUMsSUFDckQsY0FDQSxJQUFJLENBQUNILFdBQVcsQ0FBQ2IsU0FBU0YsT0FDMUI7WUFFTixJQUFJLENBQUMzRSxXQUFXQSxPQUFPLENBQUMsRUFBRSxDQUFDOEYsSUFBSSxJQUFJLFFBQVE7Z0JBQ3ZDLElBQUk5RixTQUFTO29CQUNUNEUsS0FBS2dCLElBQUksQ0FBQyxJQUFJLENBQUNOLFVBQVUsQ0FBQ1QsU0FBUzdFLE9BQU8sQ0FBQyxFQUFFLEVBQUUyRTtnQkFDbkQ7Z0JBQ0EsSUFBSW9CLFFBQVF4UCxTQUFTNEwsWUFBWSxDQUFDMEM7Z0JBQ2xDRCxLQUFLZ0IsSUFBSSxDQUNMLENBQUNHLFFBQVEsd0JBQXdCQSxRQUFRSixTQUFTLG9DQUFvQyxFQUFDLElBQ3JGLDBCQUEyQnBQLENBQUFBLFNBQVNzSSxXQUFXLENBQUNnRyxXQUMzQ3RPLFNBQVNzRixNQUFNLENBQUNnSixXQUFXLFNBQVMsV0FDckMsT0FBTSxJQUNWLGNBQ0N0TyxDQUFBQSxTQUFTeVAsZUFBZSxHQUFHelAsU0FBU3lQLGVBQWUsQ0FBQ25CLFdBQVcsRUFBQyxJQUNqRXRPLFNBQVNnTCxXQUFXLENBQUNzRCxXQUNuQnRPLENBQUFBLFNBQVN3TCxjQUFjLEdBQUd4TCxTQUFTd0wsY0FBYyxDQUFDOEMsV0FDaEQseUNBQXlDRyxRQUFRLGdCQUFnQkMsUUFBUSxTQUN2RTFPLFNBQVN1TCxjQUFjLENBQUMrQyxXQUMxQixTQUFRO1lBR3RCO1lBQ0EsSUFBSTdFLFNBQVM7Z0JBQ1QsSUFBSyxJQUFJaUcsTUFBTWpHLE9BQU8sQ0FBQyxFQUFFLENBQUM4RixJQUFJLElBQUksU0FBUyxJQUFJLEdBQUdHLE1BQU1qRyxRQUFRekcsTUFBTSxFQUFFME0sTUFBTztvQkFDM0UsSUFBSVYsU0FBU3ZGLE9BQU8sQ0FBQ2lHLElBQUk7b0JBQ3pCLElBQUlDLFNBQVMsT0FBUUMsT0FBTyxHQUFJWixPQUFPWSxPQUFPLENBQUN0QixXQUFXckssV0FBVytLLE9BQU9yRCxPQUFPLENBQUMyQyxXQUFXO29CQUMvRkQsS0FBS2dCLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQ04sVUFBVSxDQUFDVCxTQUFTVSxRQUFRWixPQUFPdUI7Z0JBQ2xFO2dCQUNBdEIsS0FBS2dCLElBQUksQ0FBQztZQUNkO1lBRUFoQixLQUFLZ0IsSUFBSSxDQUFDO1FBQ2Q7UUFFQSxJQUFJLENBQUN4QixhQUFhLEdBQUcsU0FBU0osTUFBTTtZQUNoQyxJQUFJLENBQUNBLE1BQU0sR0FBR0E7WUFFZCxJQUFJek4sV0FBVyxJQUFJLENBQUNBLFFBQVE7WUFDNUIsSUFBSXFPLE9BQU8sRUFBRTtZQUNiLElBQUlFLFdBQVdkLE9BQU9jLFFBQVEsRUFBRUMsVUFBVWYsT0FBT2UsT0FBTyxHQUFHO1lBRTNELElBQUssSUFBSUosTUFBTUcsVUFBVUgsTUFBTUksU0FBU0osTUFBTztnQkFDNUNwTyxTQUFTNE4sU0FBUyxDQUFDUSxLQUFLQyxNQUFNWjtZQUNqQztZQUVBLElBQUljLFlBQVksS0FBS0MsV0FBVyxHQUFHO2dCQUMvQixJQUFJLENBQUNJLGlCQUFpQixDQUFDNU8sVUFBVXFPLE1BQU1aO1lBQzNDO1lBRUEsSUFBSSxDQUFDSCxPQUFPLENBQUN1QixTQUFTLEdBQUdSLEtBQUtTLElBQUksQ0FBQztRQUN2QztRQUVBLElBQUksQ0FBQ2UsYUFBYSxHQUFHLFNBQVNwQyxNQUFNO1lBQ2hDLDJDQUEyQztZQUMzQyxJQUFJLElBQUksQ0FBQ0UsTUFBTSxJQUFJLElBQUksQ0FBQ0UsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDN04sUUFBUSxDQUFDOFAsVUFBVSxFQUM5RCxPQUFPLElBQUksQ0FBQ25DLE1BQU0sQ0FBQ0Y7WUFFdkIsSUFBSSxDQUFDQSxNQUFNLEdBQUdBO1lBRWQsSUFBSXpOLFdBQVcsSUFBSSxDQUFDQSxRQUFRO1lBQzVCLElBQUlvTyxLQUFLekUsT0FBTzhELE9BQU85RCxJQUFJLEVBQUUyRTtZQUM3QixJQUFJQyxXQUFXZCxPQUFPYyxRQUFRLEVBQUVDLFVBQVVmLE9BQU9lLE9BQU8sR0FBRztZQUMzRCxJQUFJdEgsV0FBVyxJQUFJLENBQUNvRyxPQUFPLENBQUNwRyxRQUFRO1lBRXBDLElBQUlBLFNBQVNsRSxNQUFNLElBQUl3TCxVQUFVRCxVQUM3QixPQUFPLElBQUksQ0FBQ1osTUFBTSxDQUFDRjtZQUV2QixJQUFLVyxNQUFNRyxVQUFVSCxNQUFNSSxTQUFTSixNQUFPO2dCQUN2Q0UsVUFBVTNFLElBQUksQ0FBQ3lFLE1BQU1HLFNBQVM7Z0JBQzlCLElBQUl3QixLQUFLN0ksUUFBUSxDQUFDa0gsTUFBTUcsU0FBUztnQkFDakN3QixHQUFHN0UsU0FBUyxHQUFHLElBQUksQ0FBQ2lFLFdBQVcsQ0FBQ2IsU0FBU0Y7Z0JBQ3pDLElBQUlwTyxTQUFTc0wsVUFBVSxFQUNuQnRMLFNBQVNzTCxVQUFVLENBQUN5RSxJQUFJekI7WUFDaEM7UUFDSjtRQUVBLElBQUksQ0FBQzBCLE1BQU0sR0FBRyxTQUFTdkMsTUFBTTtZQUN6QixrQkFBa0I7WUFDbEIsT0FBTyxJQUFJLENBQUNFLE1BQU0sQ0FBQ0Y7WUFFbkIsSUFBSSxDQUFDSCxPQUFPLENBQUMyQyxrQkFBa0IsQ0FBQyxjQUFjO1lBQzlDLElBQUksQ0FBQzNDLE9BQU8sQ0FBQzJDLGtCQUFrQixDQUFDLGFBQWE7UUFDakQ7UUFFQSxJQUFJLENBQUNDLFVBQVUsR0FBRyxTQUFTekMsTUFBTSxFQUFFYyxRQUFRLEVBQUVDLE9BQU87UUFDaEQsa0JBQWtCO1FBQ3RCO1FBRUEsSUFBSSxDQUFDMkIsT0FBTyxHQUFHLFlBRWY7UUFFQSxJQUFJLENBQUNDLGlCQUFpQixHQUFHLFNBQVNqSyxDQUFDO1lBQy9CLE9BQU8sSUFBSSxDQUFDbUgsT0FBTyxDQUFDcEcsUUFBUSxDQUFDZixJQUFJLElBQUksQ0FBQ3NILE1BQU0sQ0FBQ2MsUUFBUSxDQUFDO1FBQzFEO1FBRUEsSUFBSSxDQUFDSyxpQkFBaUIsR0FBRyxTQUFTNU8sUUFBUSxFQUFFcU8sSUFBSSxFQUFFWixNQUFNO1lBQ3BELElBQUl6TixTQUFTcVEsa0JBQWtCLEVBQUU7Z0JBQzdCclEsU0FBU3FRLGtCQUFrQixDQUFDaEMsTUFBTVo7WUFDdEMsT0FBTyxJQUFJek4sU0FBU3lMLGVBQWUsRUFBRTtnQkFDakM0QyxLQUFLZ0IsSUFBSSxDQUNMLCtCQUNJcEwsV0FBV2pFLFNBQVN5TCxlQUFlLEtBQ3ZDO1lBRVI7UUFDSjtJQUVKLEdBQUdNLElBQUksQ0FBQ3FCLE1BQU1wQixTQUFTO0lBRXZCak4sYUFBYSxHQUFHcU87QUFFaEIsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7OztBQ3ZNRnZPLGtDQUFBQSxtQ0FBTyxTQUFTQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsTUFBTTtJQUN4QztJQUNBLElBQUl3QyxNQUFNMUMsbUJBQU9BLENBQUMsR0FBc0I7SUFDeEMsSUFBSWdGLE1BQU1oRixtQkFBT0EsQ0FBQyxHQUFzQjtJQUN4QyxJQUFJeUMsT0FBT3pDLG1CQUFPQSxDQUFDLEdBQXVCO0lBQzFDLElBQUlxTyxlQUFlck8sZ0RBQXNEO0lBRXpFLElBQUl3UixnQkFBZ0I7SUFFcEIsU0FBU0MsY0FBY3BMLElBQUk7UUFDdkIsT0FBT0EsSUFBSSxDQUFDLElBQUksQ0FBQzFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQytOLFlBQVksSUFBSTtJQUNwRDtJQUVBLFNBQVNDLGFBQWFwRCxRQUFRLEVBQUUzTSxRQUFRO1FBQ3BDLElBQUksQ0FBQzRNLE9BQU8sR0FBR3hKLElBQUl5SixhQUFhLENBQUM7UUFDakNGLFNBQVNHLFdBQVcsQ0FBQyxJQUFJLENBQUNGLE9BQU87UUFDakMsSUFBSSxDQUFDQSxPQUFPLENBQUNwQyxTQUFTLEdBQUc7UUFDekIsSUFBSSxDQUFDd0YsT0FBTyxHQUFHO0lBQ25CO0lBQ0M7UUFFRyxJQUFJLENBQUNDLFFBQVEsR0FBRztRQUVoQixJQUFJLENBQUNoRCxNQUFNLEdBQUc7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDM04sUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDMFEsT0FBTyxFQUMvQjtZQUNKLElBQUlqSCxVQUFVLElBQUksQ0FBQ3pKLFFBQVEsQ0FBQ3lKLE9BQU87WUFDbkMsSUFBSTRFLE9BQU8sRUFBRTtZQUNiLElBQUssSUFBSWxJLElBQUksR0FBR0EsSUFBSXNELFFBQVF6RyxNQUFNLEVBQUVtRCxJQUFLO2dCQUNyQyxJQUFJdUosTUFBTWpHLE9BQU8sQ0FBQ3RELEVBQUU7Z0JBQ3BCa0ksS0FBS2dCLElBQUksQ0FBQyw4QkFDSEssQ0FBQUEsSUFBSXhFLFNBQVMsSUFBSSxFQUFDLElBQ25CLG9CQUFvQndFLElBQUlSLE1BQU0sR0FBRyxlQUNqQ1EsSUFBSWtCLE9BQU8sR0FDWCxZQUNBLHdDQUNBO1lBRVY7WUFDQSxJQUFJLENBQUN0RCxPQUFPLENBQUN1RCxLQUFLLENBQUNDLFlBQVksR0FBR3JILFFBQVE2RixXQUFXO1lBQ3JELElBQUksQ0FBQ2hDLE9BQU8sQ0FBQ3VCLFNBQVMsR0FBR1IsS0FBS1MsSUFBSSxDQUFDO1FBQ3ZDO1FBRUEsSUFBSSxDQUFDcEIsZUFBZSxHQUFHLFNBQVMxTixRQUFRO1lBQ3BDLElBQUksQ0FBQ0EsUUFBUSxHQUFHQTtZQUNoQixJQUFJLENBQUNBLFVBQ0Q7WUFDSixJQUFJeUosVUFBVSxJQUFJLENBQUN6SixRQUFRLENBQUN5SixPQUFPO1lBQ25DLElBQUksQ0FBQ0EsU0FBUztnQkFDVixJQUFJLENBQUNpSCxPQUFPLEdBQUc7Z0JBQ2Y7WUFDSjtZQUNBLElBQUksQ0FBQ0EsT0FBTyxHQUFHO1lBQ2YsSUFBSUssYUFBYTtZQUVqQnRILFFBQVF2QixPQUFPLENBQUMsU0FBU3dILEdBQUcsRUFBRXZKLENBQUM7Z0JBQzNCdUosSUFBSTdFLEtBQUssR0FBRzFFO2dCQUNaLElBQUl1SixJQUFJak4sS0FBSyxJQUFJLENBQUNpTixJQUFJL0QsT0FBTyxFQUN6QitELElBQUkvRCxPQUFPLEdBQUc0RTtnQkFDbEIsSUFBSVMsSUFBSXRCLElBQUl1QixLQUFLO2dCQUNqQixJQUFJLE9BQU9ELEtBQUssWUFBWUEsRUFBRTVOLEtBQUssQ0FBQyxDQUFDLE1BQU0sS0FBSztvQkFDNUNzTSxJQUFJd0IsSUFBSSxHQUFHQyxTQUFTSCxHQUFHLE1BQU07b0JBQzdCdEIsSUFBSVIsTUFBTSxHQUFHUSxJQUFJdUIsS0FBSztnQkFDMUIsT0FBTztvQkFDSHZCLElBQUl1QixLQUFLLEdBQUdFLFNBQVNILEdBQUcsT0FBTyxJQUFJLENBQUNMLFFBQVE7b0JBQzVDSSxjQUFjckIsSUFBSXVCLEtBQUs7b0JBQ3ZCdkIsSUFBSVIsTUFBTSxHQUFHUSxJQUFJdUIsS0FBSyxHQUFHO2dCQUM3QjtnQkFDQXZCLElBQUkwQixVQUFVLEdBQUc7WUFDckIsR0FBRyxJQUFJO1lBQ1AzSCxRQUFRc0gsVUFBVSxHQUFHQTtZQUNyQnRILFFBQVE2RixXQUFXLEdBQUd5QixhQUFhO1lBQ25DdEgsUUFBUXdILEtBQUssR0FBRztZQUNoQmpSLFNBQVN5SixPQUFPLEdBQUdBO1FBQ3ZCO1FBRUEsSUFBSSxDQUFDNEgsV0FBVyxHQUFHLFNBQVNKLEtBQUs7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQ2pSLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQzBRLE9BQU8sRUFDL0I7WUFFSixJQUFJakgsVUFBVSxJQUFJLENBQUN6SixRQUFRLENBQUN5SixPQUFPO1lBQ25DLElBQUlzSCxhQUFhO1lBRWpCdEgsUUFBUXdILEtBQUssR0FBR0E7WUFHaEJ4SCxRQUFRdkIsT0FBTyxDQUFDLFNBQVN3SCxHQUFHO2dCQUN4QixJQUFJLENBQUNBLElBQUl3QixJQUFJLEVBQUU7b0JBQ1hILGNBQWNyQixJQUFJdUIsS0FBSztnQkFDM0I7WUFDSjtZQUVBLElBQUlLLFlBQVlMLFFBQVFGO1lBRXhCdEgsUUFBUXZCLE9BQU8sQ0FBQyxTQUFTd0gsR0FBRztnQkFDeEIsSUFBSUEsSUFBSXdCLElBQUksRUFBRTtvQkFDVnhCLElBQUkwQixVQUFVLEdBQUdFLFlBQVk1QixJQUFJd0IsSUFBSTtvQkFDckN4QixJQUFJUixNQUFNLEdBQUdRLElBQUl3QixJQUFJLEdBQUcsTUFBTTtnQkFDbEMsT0FBTztvQkFDSHhCLElBQUkwQixVQUFVLEdBQUcxQixJQUFJdUIsS0FBSztvQkFDMUJ2QixJQUFJUixNQUFNLEdBQUdRLElBQUl1QixLQUFLLEdBQUc7Z0JBQzdCO1lBQ0o7WUFDQXhILFFBQVFzSCxVQUFVLEdBQUdBO1lBQ3JCdEgsUUFBUTZGLFdBQVcsR0FBR3lCLGFBQWE7UUFDdkM7UUFFQSxJQUFJLENBQUNRLGlCQUFpQixHQUFHLFNBQVNDLGFBQWEsRUFBRUMsRUFBRSxFQUFFQyxLQUFLO1lBQ3RELElBQUksQ0FBQ0wsV0FBVyxDQUFDSztZQUVqQixJQUFJakksVUFBVSxJQUFJLENBQUN6SixRQUFRLENBQUN5SixPQUFPO1lBQ25DLElBQUlrSCxXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUU1QixJQUFJLENBQUNjLElBQ0Q7WUFFSixJQUFJNUcsUUFBUXBCLFFBQVFyRCxPQUFPLENBQUNvTDtZQUM1QixJQUFJOUIsS0FBS2lDLFNBQVNDO1lBQ2xCLElBQUssSUFBSXpMLElBQUkwRSxRQUFRLEdBQUcxRSxJQUFJc0QsUUFBUXpHLE1BQU0sRUFBRW1ELElBQUs7Z0JBQzdDdUosTUFBTWpHLE9BQU8sQ0FBQ3RELEVBQUU7Z0JBQ2hCLElBQUk2RCxLQUFLQyxLQUFLLENBQUN5RixJQUFJMEIsVUFBVSxJQUFJVCxZQUFZYyxLQUFLLEdBQUc7b0JBQ2pELElBQUkvQixJQUFJd0IsSUFBSSxFQUFFO3dCQUNWUyxVQUFVakM7d0JBQ1Y7b0JBQ0osT0FBTyxJQUFJLENBQUNpQyxTQUFTO3dCQUNqQkEsVUFBVWpDO29CQUNkO2dCQUNKO1lBQ0o7WUFDQSxJQUFLLElBQUl2SixJQUFJMEUsT0FBTzFFLEtBQUssR0FBR0EsSUFBSztnQkFDN0J1SixNQUFNakcsT0FBTyxDQUFDdEQsRUFBRTtnQkFDaEIsSUFBSTZELEtBQUtDLEtBQUssQ0FBQ3lGLElBQUkwQixVQUFVLElBQUlULFlBQVljLEtBQUssR0FBRztvQkFDakQsSUFBSS9CLElBQUl3QixJQUFJLEVBQUU7d0JBQ1ZVLFVBQVVsQzt3QkFDVjtvQkFDSixPQUFPLElBQUksQ0FBQ2tDLFNBQVM7d0JBQ2pCQSxVQUFVbEM7d0JBQ1YsSUFBSUEsT0FBTzhCLGVBQ1A7b0JBQ1I7Z0JBQ0o7WUFDSjtZQUNBLElBQUksQ0FBQ0ksV0FBVyxDQUFDRCxTQUNiO1lBRUosSUFBSUEsUUFBUVAsVUFBVSxHQUFHSyxLQUFLZCxVQUMxQmMsS0FBS0UsUUFBUVAsVUFBVSxHQUFHVDtZQUU5QixJQUFJaUIsUUFBUVIsVUFBVSxHQUFHSyxLQUFLZCxVQUMxQmMsS0FBS2QsV0FBV2lCLFFBQVFSLFVBQVU7WUFFdENPLFFBQVFQLFVBQVUsSUFBSUs7WUFDdEJHLFFBQVFSLFVBQVUsSUFBSUs7WUFFdEIsSUFBSSxDQUFDRSxRQUFRVCxJQUFJLEVBQ2J6SCxRQUFRc0gsVUFBVSxJQUFJVTtZQUMxQixJQUFJLENBQUNHLFFBQVFWLElBQUksRUFDYnpILFFBQVFzSCxVQUFVLElBQUlVO1lBQzFCLElBQUlILFlBQVlJLFFBQVFqSSxRQUFRc0gsVUFBVTtZQUUxQ3RILFFBQVF2QixPQUFPLENBQUMsU0FBU3dILEdBQUc7Z0JBQ3hCLElBQUlBLElBQUl3QixJQUFJLEVBQUU7b0JBQ1Z4QixJQUFJd0IsSUFBSSxHQUFHeEIsSUFBSTBCLFVBQVUsR0FBR0U7Z0JBQ2hDLE9BQU87b0JBQ0g1QixJQUFJdUIsS0FBSyxHQUFHdkIsSUFBSTBCLFVBQVU7Z0JBQzlCO1lBQ0o7WUFFQSxJQUFJLENBQUNDLFdBQVcsQ0FBQ0s7UUFDckI7UUFFQSxJQUFJLENBQUNHLFVBQVUsR0FBRyxTQUFTM0YsQ0FBQztZQUN4QixJQUFJekMsVUFBVSxJQUFJLENBQUN6SixRQUFRLENBQUN5SixPQUFPO1lBQ25DLElBQUksSUFBSSxDQUFDNkQsT0FBTyxDQUFDd0UsV0FBVyxJQUFJckksUUFBUXdILEtBQUssRUFDekMsSUFBSSxDQUFDSSxXQUFXLENBQUMsSUFBSSxDQUFDL0QsT0FBTyxDQUFDd0UsV0FBVztZQUM3QyxJQUFJZCxJQUFJO1lBQ1IsSUFBSyxJQUFJN0ssSUFBSSxHQUFHQSxJQUFJc0QsUUFBUXpHLE1BQU0sRUFBRW1ELElBQUs7Z0JBQ3JDLElBQUk2SSxTQUFTdkYsT0FBTyxDQUFDdEQsRUFBRTtnQkFDdkI2SyxLQUFLaEMsT0FBT29DLFVBQVU7Z0JBQ3RCLElBQUlsRixJQUFJOEUsSUFBSVYsZUFBZTtvQkFDdkIsT0FBTzt3QkFDSHpGLE9BQU8xRTt3QkFDUDZJLFFBQVFBO3dCQUNSK0MsYUFBYTdGLElBQUk4RSxJQUFJVjtvQkFDekI7Z0JBQ0o7WUFDSjtRQUNKO0lBRUosR0FBR3ZFLElBQUksQ0FBQzBFLGFBQWF6RSxTQUFTO0lBRzlCak4sb0JBQW9CLEdBQUcwUjtBQUV2QixDQUFDO0FBQUEsa0dBQUM7Ozs7Ozs7O0FDbE1GOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2lDQTRCaUMsR0FFakM1UixtQ0FBTyxTQUFTQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsTUFBTTtJQUN4QztJQUVBLElBQUk4RSxNQUFNaEYsbUJBQU9BLENBQUMsR0FBc0I7SUFFeEMsSUFBSWtULFlBQVksU0FBUzNFLFFBQVEsRUFBRTNNLFFBQVE7UUFDdkMsSUFBSSxDQUFDNE0sT0FBTyxHQUFHeEosSUFBSXlKLGFBQWEsQ0FBQztRQUNqQyxJQUFJLENBQUNELE9BQU8sQ0FBQ3BDLFNBQVMsR0FBRztRQUN6Qm1DLFNBQVNHLFdBQVcsQ0FBQyxJQUFJLENBQUNGLE9BQU87UUFFakMsSUFBSSxDQUFDNU0sUUFBUSxHQUFHQTtRQUNoQixJQUFJLENBQUN1UixRQUFRLEdBQUc7UUFDaEIsSUFBSSxDQUFDQyxPQUFPLEdBQUc7SUFDbkI7SUFFQztRQUVHLElBQUksQ0FBQ3hFLGVBQWUsR0FBRyxTQUFTMU4sUUFBUTtZQUNwQyxJQUFJLENBQUNBLFFBQVEsR0FBR0E7UUFDcEI7UUFFQSxJQUFJLENBQUMyTixNQUFNLEdBQUcsU0FBU0YsTUFBTTtZQUN6QixvREFBb0Q7WUFDcEQsSUFBSSxDQUFDLElBQUksQ0FBQ3pOLFFBQVEsQ0FBQ21TLFlBQVksSUFBSSxJQUFJLENBQUNuUyxRQUFRLENBQUNvUyxnQkFBZ0IsRUFBRTtnQkFDL0QsSUFBSSxDQUFDSCxRQUFRLElBQUksSUFBSSxDQUFDSSxpQkFBaUI7WUFDM0MsT0FBTztnQkFDSCxJQUFJLENBQUNDLGdCQUFnQixDQUFDN0U7WUFDMUI7WUFFQSxJQUFJLENBQUMsSUFBSSxDQUFDek4sUUFBUSxDQUFDbVMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDblMsUUFBUSxDQUFDb1MsZ0JBQWdCLEVBQUU7Z0JBQ2hFLElBQUksQ0FBQ0YsT0FBTyxJQUFJLElBQUksQ0FBQ0ssb0JBQW9CO1lBQzdDLE9BQU87Z0JBQ0gsSUFBSSxDQUFDQyxtQkFBbUIsQ0FBQy9FO1lBQzdCO1FBQ0o7UUFFQSxJQUFJLENBQUM2RSxnQkFBZ0IsR0FBRyxTQUFTN0UsTUFBTTtZQUNuQyxJQUFJLENBQUNBLE1BQU0sR0FBR0E7WUFDZCxJQUFJek4sV0FBVyxJQUFJLENBQUNBLFFBQVE7WUFDNUIsSUFBSW1GLE9BQU9uRixTQUFTbVMsWUFBWTtZQUVoQyxJQUFJdkksUUFBUTVKLFNBQVM0SSxlQUFlLENBQUN6RDtZQUNyQyxJQUFJUCxRQUFRNUUsU0FBUzhFLFlBQVk7WUFDakMsSUFBSW9GLE1BQU1OLFFBQVE7WUFDbEIsSUFBSTRGLFFBQVFySyxLQUFLTixNQUFNO1lBQ3ZCLE1BQU9ELEtBQUssQ0FBQ3NGLElBQUksSUFBSXRGLEtBQUssQ0FBQ3NGLElBQUksQ0FBQ3JGLE1BQU0sR0FBRzJLLE1BQU87Z0JBQzVDdEY7WUFDSjtZQUNBQTtZQUVBLElBQUlOLFFBQVE2RCxPQUFPZSxPQUFPLElBQUl0RSxNQUFNdUQsT0FBT2MsUUFBUSxJQUFJM0UsVUFBVU0sS0FBSztnQkFDbEUsT0FBTyxJQUFJLENBQUNtSSxpQkFBaUI7WUFDakM7WUFDQXpJO1lBQ0FNO1lBQ0EsSUFBSUosTUFBTUUsS0FBS2UsR0FBRyxDQUFDbkIsUUFBUTZELE9BQU9jLFFBQVEsRUFBRyxDQUFFLEtBQUt2TyxTQUFTbUUsU0FBUztZQUN0RSxJQUFJc08sT0FBTyxDQUFDakQsUUFBUSxLQUFLeFAsU0FBU3VFLFdBQVc7WUFDN0MsSUFBSXdGLFNBQVNDLEtBQUtjLEdBQUcsQ0FBQ1osTUFBTXVELE9BQU9jLFFBQVEsRUFBRWQsT0FBT2UsT0FBTyxHQUFHZixPQUFPYyxRQUFRLEdBQUcsS0FBS3ZPLFNBQVNtRSxTQUFTO1lBRXZHLElBQUksQ0FBQyxJQUFJLENBQUM4TixRQUFRLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQ0EsUUFBUSxHQUFHbk8sSUFBSXlKLGFBQWEsQ0FBQztnQkFDbEMsSUFBSSxDQUFDMEUsUUFBUSxDQUFDL0csU0FBUyxHQUFHO2dCQUMxQixJQUFJLENBQUNvQyxPQUFPLENBQUNFLFdBQVcsQ0FBQyxJQUFJLENBQUN5RSxRQUFRO1lBQzFDO1lBQ0EsSUFBSSxDQUFDQSxRQUFRLENBQUNwQixLQUFLLENBQUMvRyxHQUFHLEdBQUdBLE1BQU07WUFDaEMsSUFBSSxDQUFDbUksUUFBUSxDQUFDcEIsS0FBSyxDQUFDNEIsSUFBSSxHQUFHQSxPQUFPO1lBQ2xDLElBQUksQ0FBQ1IsUUFBUSxDQUFDcEIsS0FBSyxDQUFDNkIsS0FBSyxHQUFHO1lBQzVCLElBQUksQ0FBQ1QsUUFBUSxDQUFDcEIsS0FBSyxDQUFDcEcsTUFBTSxHQUFHVixTQUFTRCxNQUFNO1FBQ2hEO1FBQ0EsSUFBSSxDQUFDMEksbUJBQW1CLEdBQUcsU0FBUy9FLE1BQU07WUFDdEMsSUFBSSxDQUFDQSxNQUFNLEdBQUdBO1lBQ2QsSUFBSXpOLFdBQVcsSUFBSSxDQUFDQSxRQUFRO1lBQzVCLElBQUltRixPQUFPbkYsU0FBU21TLFlBQVk7WUFFaEMsSUFBSTVDLE9BQU8sSUFBSSxDQUFDdlAsUUFBUSxDQUFDb1MsZ0JBQWdCO1lBRXpDLElBQUl4SSxRQUFRNUosU0FBUzRJLGVBQWUsQ0FBQ3pEO1lBQ3JDLElBQUlxSyxRQUFRckssS0FBS04sTUFBTTtZQUV2QixJQUFJK0UsUUFBUTZELE9BQU9lLE9BQU8sSUFBSTVFLFFBQVE2RCxPQUFPYyxRQUFRLEVBQUU7Z0JBQ25ELE9BQU8sSUFBSSxDQUFDZ0Usb0JBQW9CO1lBQ3BDO1lBRUEsSUFBSWhELFFBQVEsR0FDUjNGO1lBRUosSUFBSUUsTUFBTUUsS0FBS2UsR0FBRyxDQUFDbkIsUUFBUTZELE9BQU9jLFFBQVEsRUFBRyxDQUFFLEtBQUt2TyxTQUFTbUUsU0FBUztZQUN0RSxJQUFJc08sT0FBTyxDQUFDakQsUUFBUSxLQUFLeFAsU0FBU3VFLFdBQVc7WUFFN0MsSUFBSSxDQUFDLElBQUksQ0FBQzJOLE9BQU8sRUFBRTtnQkFDZixJQUFJLENBQUNBLE9BQU8sR0FBR3BPLElBQUl5SixhQUFhLENBQUM7Z0JBQ2pDLElBQUksQ0FBQzJFLE9BQU8sQ0FBQ2hILFNBQVMsR0FBRztnQkFDekIsSUFBSSxDQUFDb0MsT0FBTyxDQUFDRSxXQUFXLENBQUMsSUFBSSxDQUFDMEUsT0FBTztZQUN6QztZQUNBLElBQUksQ0FBQ0EsT0FBTyxDQUFDckIsS0FBSyxDQUFDL0csR0FBRyxHQUFHQSxNQUFNO1lBQy9CLElBQUksQ0FBQ29JLE9BQU8sQ0FBQ3JCLEtBQUssQ0FBQzRCLElBQUksR0FBR0EsT0FBTztZQUNqQyxJQUFJLENBQUNQLE9BQU8sQ0FBQ3JCLEtBQUssQ0FBQzZCLEtBQUssR0FBRztRQUMvQjtRQUNBLElBQUksQ0FBQ0wsaUJBQWlCLEdBQUc7WUFDckIsSUFBSSxJQUFJLENBQUNKLFFBQVEsRUFBRTtnQkFDZixJQUFJLENBQUNBLFFBQVEsQ0FBQ1UsVUFBVSxDQUFDQyxXQUFXLENBQUMsSUFBSSxDQUFDWCxRQUFRO2dCQUNsRCxJQUFJLENBQUNBLFFBQVEsR0FBRztZQUNwQjtRQUNKO1FBQ0EsSUFBSSxDQUFDTSxvQkFBb0IsR0FBRztZQUN4QixJQUFJLElBQUksQ0FBQ0wsT0FBTyxFQUFFO2dCQUNkLElBQUksQ0FBQ0EsT0FBTyxDQUFDUyxVQUFVLENBQUNDLFdBQVcsQ0FBQyxJQUFJLENBQUNWLE9BQU87Z0JBQ2hELElBQUksQ0FBQ0EsT0FBTyxHQUFHO1lBQ25CO1FBQ0o7UUFDQSxJQUFJLENBQUNXLEtBQUssR0FBRztZQUNULElBQUksQ0FBQ1IsaUJBQWlCO1lBQ3RCLElBQUksQ0FBQ1MsaUJBQWlCO1FBQzFCO1FBQ0EsSUFBSSxDQUFDM0MsT0FBTyxHQUFHLFlBRWY7SUFFSixHQUFHcEUsSUFBSSxDQUFDaUcsVUFBVWhHLFNBQVM7SUFFM0JqTixpQkFBaUIsR0FBR2lUO0FBRXBCLENBQUM7QUFBQSxrR0FBQzs7Ozs7Ozs7QUN4SkY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNBNEJpQyxHQUVqQ25ULG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBQ3hDO0lBRUEsSUFBSThFLE1BQU1oRixtQkFBT0EsQ0FBQyxHQUFzQjtJQUV4QyxJQUFJaVUsY0FBYyxHQUFHLFNBQVM7SUFDOUIsU0FBU0MsZ0JBQWdCQyxZQUFZO1FBQ2pDQSxhQUFhQyxlQUFlLEdBQUc7UUFFL0IsSUFBSTNULFNBQVMwVCxhQUFhMVQsTUFBTTtRQUNoQ0EsT0FBTzRULGlCQUFpQixDQUFDLGFBQWEsSUFBSSxDQUFDQyxXQUFXLENBQUN0TixJQUFJLENBQUNtTjtRQUM1RDFULE9BQU80VCxpQkFBaUIsQ0FBQyxZQUFZLElBQUksQ0FBQ0UsYUFBYSxDQUFDdk4sSUFBSSxDQUFDbU47UUFDN0Qsa0ZBQWtGO1FBQ2xGLDhFQUE4RTtRQUM5RTFULE9BQU80VCxpQkFBaUIsQ0FBQyxjQUFjLElBQUksQ0FBQ0csWUFBWSxDQUFDeE4sSUFBSSxDQUFDbU47UUFDOUQxVCxPQUFPNFQsaUJBQWlCLENBQUMsYUFBYSxJQUFJLENBQUNJLFdBQVcsQ0FBQ3pOLElBQUksQ0FBQ21OO1FBQzVEMVQsT0FBTzRULGlCQUFpQixDQUFDLGNBQWMsSUFBSSxDQUFDSyxZQUFZLENBQUMxTixJQUFJLENBQUNtTjtRQUM5RDFULE9BQU80VCxpQkFBaUIsQ0FBQyxXQUFXLElBQUksQ0FBQ00sU0FBUyxDQUFDM04sSUFBSSxDQUFDbU47UUFDeEQxVCxPQUFPNFQsaUJBQWlCLENBQUMsU0FBUyxJQUFJLENBQUNPLE9BQU8sQ0FBQzVOLElBQUksQ0FBQ21OO1FBRXBELElBQUlsVSxVQUFVO1lBQUM7WUFBcUI7WUFBWTtZQUFlO1lBQWE7U0FBbUI7UUFFL0ZBLFFBQVFtSixPQUFPLENBQUMsU0FBU2dFLENBQUM7WUFDdEIrRyxZQUFZLENBQUMvRyxFQUFFLEdBQUcsSUFBSSxDQUFDQSxFQUFFO1FBQzdCLEdBQUcsSUFBSTtJQUNYO0lBRUM7UUFFRyxTQUFTeUgsZUFBZUMsTUFBTTtZQUMxQixPQUFPOVAsSUFBSStQLFdBQVcsQ0FBQ0QsUUFBUSxjQUFjLENBQUM5UCxJQUFJK1AsV0FBVyxDQUFDRCxRQUFRO1FBQzFFO1FBRUEsSUFBSSxDQUFDTCxXQUFXLEdBQUcsU0FBUzlTLENBQUM7WUFDekIsSUFBSWxCLFNBQVMsSUFBSSxDQUFDQSxNQUFNO1lBQ3hCLElBQUk0RixPQUFPMUUsRUFBRXFULE9BQU87WUFFcEIsSUFBSUMsT0FBTy9ULFdBQVdULE9BQU9TLFFBQVE7WUFDckMsSUFBSSxDQUFDbUYsTUFBTTtnQkFDUDRPLFFBQVE7WUFDWixPQUFPLElBQUkvVCxTQUFTeUosT0FBTyxFQUFFO2dCQUN6QixJQUFJZixNQUFNakksRUFBRXVULG1CQUFtQjtnQkFDL0IsSUFBSUMsYUFBYTFVLE9BQU9tQixRQUFRLENBQUN3VCxhQUFhLENBQUNyQyxVQUFVLENBQUNuSixJQUFJd0QsQ0FBQztnQkFDL0Q2SCxRQUFRRSxhQUFhQSxXQUFXakYsTUFBTSxDQUFDckQsT0FBTyxDQUFDeEcsUUFBUTtZQUMzRCxPQUFPO2dCQUNINE8sUUFBUS9ULFNBQVNtVSxjQUFjLEdBQUduVSxTQUFTbVUsY0FBYyxDQUFDaFAsUUFBUW5GLFNBQVMyTCxPQUFPLENBQUN4RztZQUN2RjtZQUVBLElBQUksQ0FBQzVGLE9BQU82VSxPQUFPLElBQUk3VSxPQUFPOFUsU0FBUyxDQUFDTixLQUFLLElBQUlBLE9BQzdDeFUsT0FBTzhVLFNBQVMsQ0FBQ04sS0FBSyxHQUFHQTtZQUM3QixJQUFJLENBQUNPLGdCQUFnQixDQUFDblA7UUFDMUI7UUFFQSxJQUFJLENBQUNtTyxZQUFZLEdBQUc7WUFDaEIsSUFBSSxDQUFDZ0IsZ0JBQWdCLENBQUM7UUFDMUI7UUFFQSxJQUFJLENBQUNBLGdCQUFnQixHQUFHLFNBQVNuUCxJQUFJO1lBQ2pDLElBQUluRixXQUFXLElBQUksQ0FBQ1QsTUFBTSxDQUFDUyxRQUFRO1lBQ25DLElBQUltRixTQUFTLElBQUksQ0FBQ0EsSUFBSSxJQUFJbkYsVUFBVTtnQkFDaEMsSUFBSSxJQUFJLENBQUNtRixJQUFJLEVBQ1RuRixTQUFTbUwsUUFBUSxDQUFDLElBQUksQ0FBQ2hHLElBQUksRUFBRSxTQUFTO2dCQUMxQyxJQUFJLENBQUNBLElBQUksR0FBR0E7Z0JBQ1osSUFBSSxJQUFJLENBQUNBLElBQUksRUFDVG5GLFNBQVNtTCxRQUFRLENBQUMsSUFBSSxDQUFDaEcsSUFBSSxFQUFFLFNBQVM7WUFDOUM7UUFDSjtRQUVBLElBQUksQ0FBQ2lPLFdBQVcsR0FBRyxTQUFTbUIsRUFBRTtZQUMxQixJQUFJaFYsU0FBUyxJQUFJLENBQUNBLE1BQU07WUFDeEIsSUFBSVMsV0FBV1QsT0FBT1MsUUFBUTtZQUU5QnVVLEdBQUdDLE1BQU0sR0FBRztZQUNaLElBQUksQ0FBQ0MsY0FBYyxHQUFHRjtZQUN0QixJQUFJLENBQUNHLGFBQWEsR0FBRztZQUNyQixJQUFJLENBQUNDLGNBQWMsR0FBRztZQUV0QixJQUFJQyxTQUFTTCxHQUFHTSxTQUFTO1lBQ3pCLElBQUlDLGdCQUFnQnZWLE9BQU9XLFNBQVMsQ0FBQzZVLGdCQUFnQjtZQUNyRCxJQUFJQyxnQkFBZ0JGLGNBQWM5UixNQUFNLEdBQUc7WUFDM0MsSUFBSTRSLFdBQVcsS0FBS0ksZUFBZTtnQkFDL0IsUUFBUSxtREFBbUQ7WUFDL0Q7WUFFQSxJQUFJN1AsT0FBT29QLEdBQUdULE9BQU87WUFDckIsSUFBSSxDQUFDbUIsVUFBVSxHQUFHOVA7WUFDbEIsSUFBSSxDQUFDQSxNQUFNLFFBQVEsc0JBQXNCO1lBRXpDLElBQUkrUCxjQUFjbFYsU0FBU2lKLFVBQVUsQ0FBQzlEO1lBRXRDLElBQUl5TyxTQUFTVyxHQUFHWSxRQUFRLENBQUN2QixNQUFNO1lBQy9CLElBQUksQ0FBQ3dCLE1BQU0sR0FBRztZQUNkLElBQUl6QixlQUFlQyxXQUFXek8sS0FBS2tRLFdBQVcsSUFBSSxVQUFVO2dCQUN4RCxJQUFJLENBQUNELE1BQU0sR0FBRztnQkFDZCxJQUFJRSxpQkFBaUJmLEdBQUdnQixXQUFXO2dCQUNuQyxJQUFJblEsT0FBT21QLEdBQUdpQixXQUFXO2dCQUN6QixJQUFJWixXQUFXLEdBQUc7b0JBQ2QsSUFBSVUsZ0JBQWdCO3dCQUNoQixJQUFJbFEsTUFBTTs0QkFDTkQsT0FBT0EsS0FBSzZDLE1BQU07d0JBQ3RCO3dCQUNBaEksU0FBU0MsS0FBSyxDQUFDa0YsTUFBTTt3QkFDckJuRixTQUFTSSxJQUFJLENBQUMrRTtvQkFDbEIsT0FBTzt3QkFDSG5GLFNBQVNnSCxVQUFVLENBQUM3QixNQUFNQztvQkFDOUI7Z0JBQ0o7Z0JBQ0EsSUFBSSxDQUFDNlAsVUFBVSxHQUFHO1lBQ3RCLE9BQU8sSUFBSW5SLElBQUkrUCxXQUFXLENBQUNELFFBQVEsYUFBYTtnQkFDNUMsSUFBSTZCLFFBQVFQLGVBQWUzVixPQUFPVyxTQUFTLENBQUM2VSxnQkFBZ0I7Z0JBQzVEL1UsU0FBU2lGLE9BQU8sQ0FBQyxrQkFBa0I7b0JBQUUyTyxRQUFRek87b0JBQU0yUCxlQUFlVztnQkFBTTtnQkFDeEUsNEJBQTRCO2dCQUM1QnRRLEtBQUt1USxTQUFTLEdBQUcsQ0FBQ3ZRLEtBQUt1USxTQUFTO2dCQUNoQyxJQUFJRCxPQUFPO29CQUNQQSxNQUFNdk4sT0FBTyxDQUFDLFNBQVNDLENBQUM7d0JBQUlBLEVBQUV1TixTQUFTLEdBQUd2USxLQUFLdVEsU0FBUztvQkFBQztnQkFDN0Q7Z0JBQ0ExVixTQUFTaUYsT0FBTyxDQUFDRSxLQUFLdVEsU0FBUyxHQUFHLFVBQVUsV0FBV0QsU0FBUztvQkFBQ3RRO2lCQUFLO2dCQUN0RW5GLFNBQVNpRixPQUFPLENBQUM7WUFDckIsT0FBTyxJQUFJbkIsSUFBSStQLFdBQVcsQ0FBQ0QsUUFBUSxZQUFZO2dCQUMzQyxJQUFJVyxHQUFHZ0IsV0FBVyxJQUFJO29CQUNsQmhXLE9BQU9XLFNBQVMsQ0FBQ3lWLGVBQWUsQ0FBQ3hRLE1BQU0sTUFBTTtnQkFDakQsT0FBTztvQkFDSDVGLE9BQU9XLFNBQVMsQ0FBQzBWLFlBQVksQ0FBQ3pRO2dCQUNsQztZQUNKLE9BQU8sSUFBSW9QLEdBQUdpQixXQUFXLElBQUk7Z0JBQ3pCLElBQUlOLGVBQWVGLGVBQ2YsSUFBSSxDQUFDTixhQUFhLEdBQUc7cUJBQ3BCLElBQUksQ0FBQ1EsZUFBZUYsZUFDckJ6VixPQUFPVyxTQUFTLENBQUMwVixZQUFZLENBQUN6UTtZQUN0QyxPQUFPLElBQUlvUCxHQUFHZ0IsV0FBVyxJQUFJO2dCQUN6QmhXLE9BQU9XLFNBQVMsQ0FBQ3lWLGVBQWUsQ0FBQ3hRO1lBQ3JDLE9BQU8sSUFBSStQLGVBQWVGLGVBQWU7Z0JBQ3JDLElBQUksQ0FBQ3pWLE9BQU9zVyxTQUFTLElBQ2pCLElBQUksQ0FBQ1osVUFBVSxHQUFHO3FCQUVsQixJQUFJLENBQUNQLGFBQWEsR0FBRztZQUM3QixPQUFPO2dCQUNIblYsT0FBT1csU0FBUyxDQUFDNFYsWUFBWSxDQUFDM1E7WUFDbEM7WUFDQSxJQUFJLElBQUksQ0FBQzhQLFVBQVUsRUFDZjFWLE9BQU93VyxhQUFhLENBQUNDLFlBQVksQ0FBQ3pCLElBQUk7WUFFMUMsT0FBT0EsR0FBRzBCLGNBQWM7UUFDNUI7UUFFQSxJQUFJLENBQUN4QyxTQUFTLEdBQUcsU0FBU2MsRUFBRTtZQUN4QixJQUFJLElBQUksQ0FBQ0ksY0FBYyxJQUFJLEdBQUcsUUFBUSw2QkFBNkI7WUFDbkUsSUFBSSxDQUFDQSxjQUFjLEdBQUc7WUFDdEIsSUFBSWpNLE1BQU02TCxHQUFHUCxtQkFBbUI7WUFDaEMsSUFBSTdPLE9BQU8sSUFBSSxDQUFDNUYsTUFBTSxDQUFDUyxRQUFRLENBQUMwSyxnQkFBZ0IsQ0FBQ2hDLElBQUl3TixDQUFDO1lBQ3RELElBQUkvUSxRQUFRLElBQUksQ0FBQzhQLFVBQVUsSUFBSSxJQUFJLENBQUNBLFVBQVUsSUFBSTlQLE1BQU07Z0JBQ3BEb1AsR0FBR0ssTUFBTSxHQUFHTCxHQUFHTSxTQUFTO2dCQUN4Qk4sR0FBR1gsTUFBTSxHQUFHVyxHQUFHWSxRQUFRLENBQUN2QixNQUFNO2dCQUM5QlcsR0FBR0MsTUFBTSxHQUFHLElBQUksQ0FBQ0MsY0FBYyxDQUFDRCxNQUFNO2dCQUN0QyxJQUFJLENBQUMyQixZQUFZLENBQUMsU0FBUzVCO1lBQy9CO1lBQ0EsSUFBSSxDQUFDVSxVQUFVLEdBQUcsSUFBSSxDQUFDbUIsVUFBVSxHQUFHO1FBQ3hDO1FBRUEsSUFBSSxDQUFDMUMsT0FBTyxHQUFHLFNBQVNhLEVBQUU7WUFDdEIsSUFBSSxJQUFJLENBQUNFLGNBQWMsQ0FBQ0QsTUFBTSxLQUFLLEdBQUc7Z0JBQ2xDLElBQUksQ0FBQ2pWLE1BQU0sQ0FBQzZCLEtBQUssQ0FBQztZQUN0QjtRQUNKO1FBRUEsSUFBSSxDQUFDaVMsYUFBYSxHQUFHLFNBQVNrQixFQUFFO1lBQzVCLElBQUl2VSxXQUFXLElBQUksQ0FBQ1QsTUFBTSxDQUFDUyxRQUFRO1lBQ25DLElBQUlBLFNBQVNnSCxVQUFVLElBQUksQ0FBQzJNLGVBQWVZLEdBQUdZLFFBQVEsQ0FBQ3ZCLE1BQU0sR0FBRztnQkFDNUQsSUFBSXpPLE9BQU9vUCxHQUFHVCxPQUFPO2dCQUNyQixJQUFJM08sTUFDQW5GLFNBQVNnSCxVQUFVLENBQUM3QjtZQUM1QjtZQUNBLElBQUksSUFBSSxDQUFDc1AsY0FBYyxFQUNuQixJQUFJLENBQUNBLGNBQWMsQ0FBQ0QsTUFBTSxHQUFHO1FBQ3JDO1FBRUEsSUFBSSxDQUFDNkIsaUJBQWlCLEdBQUc7WUFDckIsSUFBSTlXLFNBQVMsSUFBSSxDQUFDQSxNQUFNO1lBQ3hCLElBQUlnVixLQUFLLElBQUksQ0FBQzZCLFVBQVU7WUFDeEI3QixHQUFHK0IsSUFBSSxHQUFHL0IsR0FBR3BQLElBQUksR0FBRztZQUNwQixJQUFJQSxPQUFPb1AsR0FBR1QsT0FBTyxDQUFDO1lBQ3RCLElBQUkzTyxRQUFRNUYsT0FBT1csU0FBUyxDQUFDQyxTQUFTLE1BQU1nRixNQUFNO2dCQUM5QyxJQUFJb1AsR0FBR2dCLFdBQVcsSUFBSTtvQkFDbEJoVyxPQUFPVyxTQUFTLENBQUN5VixlQUFlLENBQUN4USxNQUFNLE1BQU07Z0JBQ2pELE9BQU87b0JBQ0g1RixPQUFPVyxTQUFTLENBQUNxVyxVQUFVLENBQUNwUjtnQkFDaEM7Z0JBQ0E1RixPQUFPbUIsUUFBUSxDQUFDOFYsbUJBQW1CO1lBQ3ZDO1FBQ0o7UUFFQSxJQUFJLENBQUNDLFFBQVEsR0FBRztZQUNaLElBQUlsQyxLQUFLLElBQUksQ0FBQ0UsY0FBYztZQUM1QixJQUFJekssS0FBSzBNLEdBQUcsQ0FBQyxJQUFJLENBQUN4SyxDQUFDLEdBQUdxSSxHQUFHckksQ0FBQyxJQUFJbEMsS0FBSzBNLEdBQUcsQ0FBQyxJQUFJLENBQUNSLENBQUMsR0FBRzNCLEdBQUcyQixDQUFDLElBQUluRCxhQUFhO2dCQUNqRSxJQUFJLENBQUMyQixhQUFhLEdBQUc7Z0JBQ3JCLElBQUksQ0FBQ25WLE1BQU0sQ0FBQzZCLEtBQUssQ0FBQyxhQUFhbVQ7Z0JBQy9CLElBQUksSUFBSSxDQUFDb0MsS0FBSyxJQUFJLGNBQWNwQyxHQUFHTSxTQUFTLE9BQU8sR0FDL0MsSUFBSSxDQUFDK0IsUUFBUSxDQUFDO1lBQ3RCO1FBQ0o7UUFFQSxJQUFJLENBQUNDLFdBQVcsR0FBRztZQUNmLElBQUksSUFBSSxDQUFDbkMsYUFBYSxFQUFFO2dCQUNwQixJQUFJeFUsWUFBWSxJQUFJLENBQUNYLE1BQU0sQ0FBQ1csU0FBUztnQkFDckMsSUFBSSxJQUFJLENBQUMrVSxVQUFVLEVBQUU7b0JBQ2pCLElBQUksSUFBSSxDQUFDUCxhQUFhLElBQUksVUFDdEJ4VSxVQUFVMFYsWUFBWSxDQUFDLElBQUksQ0FBQ1gsVUFBVTt5QkFFdEMvVSxVQUFVNFYsWUFBWSxDQUFDLElBQUksQ0FBQ2IsVUFBVTtnQkFDOUM7Z0JBQ0EsSUFBSSxDQUFDUCxhQUFhLEdBQUc7WUFDekI7UUFDSjtRQUdBLElBQUksQ0FBQ2xCLFlBQVksR0FBRyxTQUFTZSxFQUFFO1lBQzNCLElBQUlBLEdBQUdnQixXQUFXLE1BQU1oQixHQUFHaUIsV0FBVyxJQUNsQztZQUNKLElBQUl6TyxJQUFJd04sR0FBR1ksUUFBUSxDQUFDMkIsU0FBUztZQUM3QixJQUFJQyxLQUFLaFEsSUFBSyxLQUFJLENBQUNpUSxlQUFlLElBQUk7WUFFdEMsSUFBSXpYLFNBQVMsSUFBSSxDQUFDQSxNQUFNO1lBQ3hCLElBQUkwWCxjQUFjMVgsT0FBT21CLFFBQVEsQ0FBQ3dXLGNBQWMsQ0FBQzNDLEdBQUc0QyxNQUFNLEdBQUc1QyxHQUFHNkMsS0FBSyxFQUFFN0MsR0FBRzhDLE1BQU0sR0FBRzlDLEdBQUc2QyxLQUFLO1lBQzNGLElBQUlILGVBQWVGLEtBQUssS0FBSztnQkFDekIsSUFBSSxDQUFDQyxlQUFlLEdBQUdqUTtnQkFDdkJ4SCxPQUFPbUIsUUFBUSxDQUFDQyxRQUFRLENBQUM0VCxHQUFHNEMsTUFBTSxHQUFHNUMsR0FBRzZDLEtBQUssRUFBRTdDLEdBQUc4QyxNQUFNLEdBQUc5QyxHQUFHNkMsS0FBSztnQkFDbkUsT0FBTzdDLEdBQUcrQyxJQUFJO1lBQ2xCO1FBQ0o7SUFFSixHQUFHdkwsSUFBSSxDQUFDaUgsZ0JBQWdCaEgsU0FBUztJQUVqQ2pOLHVCQUF1QixHQUFHaVU7QUFFMUIsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7OztBQ3hRRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQ0E0QmlDLEdBRWpDblUsbUNBQU8sU0FBU0MsT0FBTyxFQUFFQyxPQUFPLEVBQUVDLE1BQU07SUFDeEM7SUFFQSxJQUFJdVksUUFBUXpZLG1CQUFPQSxDQUFDLEdBQXdCO0lBQzVDLElBQUkwWSxZQUFZMVksbUJBQU9BLENBQUMsR0FBNEI7SUFDcEQsSUFBSWtVLGtCQUFrQmxVLDBDQUE2QztJQUNuRSxJQUFJMlksYUFBYTNZLHFDQUFtQztJQUNwRCxJQUFJMk8sU0FBUzNPLG1CQUFPQSxDQUFDLEdBQVc7SUFDaEMsSUFBSWdGLE1BQU1oRixtQkFBT0EsQ0FBQyxHQUFzQjtJQUV4QyxTQUFTNFksaUJBQWlCekUsWUFBWTtRQUNsQyxJQUFJaFMsT0FBT2dTLGFBQWExVCxNQUFNO1FBQzlCLElBQUlvWSxpQkFBaUI7UUFDckIsSUFBSUMsd0JBQXdCO1FBQzVCLElBQUlDLG1CQUFtQjtRQUN2QixJQUFJQyxhQUFhO1FBQ2pCLElBQUlDLFVBQVU3TCxHQUFHZ0ssR0FBRzhCLElBQUlDO1FBQ3hCLElBQUlDO1FBRUpqRixhQUFha0YsSUFBSSxHQUFHO1lBQ2hCLElBQUk1RCxLQUFLLElBQUksQ0FBQzZCLFVBQVU7WUFDeEIsSUFBSSxDQUFDMkIsWUFBWSxDQUFDeEQsSUFBSTtZQUN0QixJQUFJcFAsT0FBT29QLEdBQUdULE9BQU87WUFDckJrRSxLQUFLekQsR0FBR3JJLENBQUMsR0FBR0E7WUFDWitMLEtBQUsxRCxHQUFHMkIsQ0FBQyxHQUFHQTtZQUNaaEssSUFBSXFJLEdBQUdySSxDQUFDO1lBQ1JnSyxJQUFJM0IsR0FBRzJCLENBQUM7WUFDUixJQUFJa0MsV0FBV0MsU0FBU25NLEdBQUdnSyxHQUFHZ0M7WUFDOUIsSUFBSSxDQUFDRSxVQUFVO2dCQUNYalQsT0FBTztZQUNYO1lBRUEsSUFBSTRTLFNBQVNLLFFBQVEsSUFBSUEsWUFBWUwsU0FBU2pELGFBQWEsRUFBRTtnQkFDekRpRCxTQUFTSyxRQUFRLEdBQUdBO2dCQUNwQjdELEdBQUd3RCxRQUFRLEdBQUdBO2dCQUNkOVcsS0FBS2dFLE9BQU8sQ0FBQ21ULFdBQVcsV0FBVyxXQUFZN0Q7WUFDbkQ7WUFDQSxJQUFJLENBQUM2RCxVQUFVO2dCQUNYN0QsR0FBR3dELFFBQVEsR0FBR0E7Z0JBQ2Q5VyxLQUFLZ0UsT0FBTyxDQUFDLG1CQUFtQnNQO1lBQ3BDO1lBRUEsSUFBSXdELFNBQVNoSSxFQUFFLEVBQUU7Z0JBQ2JnSSxTQUFTaEksRUFBRSxDQUFDYyxLQUFLLENBQUMvRyxHQUFHLEdBQUd5SyxHQUFHMkIsQ0FBQyxHQUFHNkIsU0FBU08sT0FBTyxHQUFHO2dCQUNsRFAsU0FBU2hJLEVBQUUsQ0FBQ2MsS0FBSyxDQUFDNEIsSUFBSSxHQUFHOEIsR0FBR3JJLENBQUMsR0FBRzZMLFNBQVNRLE9BQU8sR0FBRztZQUN2RDtZQUVBLElBQUlDLFlBQVlyVDtZQUNoQixJQUFJcVQsV0FBVztnQkFDWCxJQUFJQyxVQUFVdk0sSUFBSWdNLGFBQWF6RixJQUFJO2dCQUVuQyxJQUFJakQsUUFBUXhGLEtBQUtlLEdBQUcsQ0FBQyxHQUFHZixLQUFLQyxLQUFLLENBQUN3TyxVQUFVeFgsS0FBS2pCLFFBQVEsQ0FBQ3VFLFdBQVc7Z0JBQ3RFLElBQUltVSxZQUFZRixVQUFVM1QsTUFBTSxHQUFHMks7Z0JBQ25DLE1BQU9rSixZQUFZLEtBQUtGLFVBQVV4USxNQUFNLENBQUU7b0JBQ3RDMFE7b0JBQ0FGLFlBQVlBLFVBQVV4USxNQUFNO2dCQUNoQztnQkFFQSxJQUFJLENBQUN3USxVQUFVRyxRQUFRLElBQUlaLFNBQVNhLElBQUksSUFBSSxRQUFRO29CQUNoREosWUFBWUEsVUFBVXhRLE1BQU07Z0JBQ2hDO1lBQ0o7WUFFQSxJQUFJK1AsU0FBU1MsU0FBUyxLQUFLQSxXQUFXO2dCQUNsQyxJQUFJVCxTQUFTUyxTQUFTLEVBQUU7b0JBQ3BCdlgsS0FBS2pCLFFBQVEsQ0FBQ21MLFFBQVEsQ0FBQzRNLFNBQVNTLFNBQVMsRUFBRSxjQUFjO29CQUN6RHZYLEtBQUtnRSxPQUFPLENBQUMsbUJBQW1COFM7Z0JBQ3BDO2dCQUNBLElBQUlTLGFBQWFULFNBQVNqRCxhQUFhLElBQUlpRCxTQUFTakQsYUFBYSxDQUFDMU8sT0FBTyxDQUFDb1MsY0FBYyxDQUFDLEdBQUc7b0JBQ3hGQSxZQUFZO2dCQUNoQjtnQkFDQVQsU0FBU1MsU0FBUyxHQUFHQTtnQkFDckIsSUFBSVQsU0FBU1MsU0FBUyxFQUFFO29CQUNwQnZYLEtBQUtnRSxPQUFPLENBQUMsbUJBQW1COFM7b0JBQ2hDLElBQUlBLFNBQVNhLElBQUksS0FBSyxRQUNsQjNYLEtBQUtqQixRQUFRLENBQUNtTCxRQUFRLENBQUM0TSxTQUFTUyxTQUFTLEVBQUUsY0FBYztnQkFDakU7Z0JBQ0FLLGdCQUFnQjVYLE1BQU04VyxTQUFTUyxTQUFTLEVBQUVULFNBQVNlLFNBQVM7WUFDaEU7WUFFQSxJQUFJQyxNQUFNQyxLQUFLRCxHQUFHO1lBRWxCLElBQUluRixTQUFTVyxHQUFHWSxRQUFRLENBQUN2QixNQUFNO1lBQy9CLElBQUlxRixlQUFlckYsVUFBVzlQLElBQUkrUCxXQUFXLENBQUNELFFBQVEsY0FDL0MsQ0FBQzlQLElBQUkrUCxXQUFXLENBQUNELFFBQVE7WUFFaEMsSUFBSXNGLFdBQVdsUCxLQUFLME0sR0FBRyxDQUFDc0IsTUFBTWhPLEtBQUswTSxHQUFHLENBQUN1QjtZQUV2QyxJQUFJdlAsTUFBTTZMLEdBQUcyQixDQUFDLEdBQUdnQyxhQUFhcE8sR0FBRztZQUNqQyxJQUFJM0YsWUFBWWxELEtBQUtqQixRQUFRLENBQUNtRSxTQUFTO1lBQ3ZDLElBQUl6RCxXQUFXTyxLQUFLUCxRQUFRO1lBQzVCLElBQUl5WSxtQkFBbUIsTUFBTWhWO1lBQzdCLElBQUk2TCxTQUFTdEgsTUFBTXlRO1lBQ25CLElBQUluSixTQUFTLEdBQUc7Z0JBQ1pBLFVBQVUsQ0FBQ3RQLFNBQVMwWSxLQUFLLENBQUNDLGNBQWMsR0FBRyxJQUFJRjtnQkFDL0MsSUFBSW5KLFNBQVMsR0FDVEEsU0FBUztZQUNqQjtZQUNBLElBQUksQ0FBQ0EsVUFBVSxDQUFDb0ksVUFDWkwsU0FBU3VCLFVBQVUsR0FBRztZQUUxQixJQUFJSixZQUFZLEdBQUc7Z0JBQ2YsSUFBSSxDQUFDbkIsU0FBU3dCLFFBQVEsRUFDbEJ4QixTQUFTd0IsUUFBUSxHQUFHUjtZQUM1QixPQUFPO2dCQUNILElBQUksQ0FBQ0UsY0FDRGxCLFNBQVN3QixRQUFRLEdBQUdsVjtZQUM1QjtZQUNBLElBQUkwUyxLQUFLZ0MsTUFBTWhCLFNBQVN3QixRQUFRO1lBRWhDLElBQUl2SixVQUFVb0ksVUFBVTtnQkFDcEIsSUFBSXJCLEtBQUtjLG9CQUFvQkUsU0FBU3VCLFVBQVUsRUFBRTtvQkFDOUNyWSxLQUFLUCxRQUFRLENBQUNDLFFBQVEsQ0FBQyxHQUFHcVAsU0FBUztvQkFDbkMrSCxTQUFTdUIsVUFBVSxHQUFHO2dCQUMxQjtZQUNKLE9BQ0ssSUFBSW5VLFFBQVE0UyxTQUFTYSxJQUFJLEtBQUssUUFBUTtnQkFDdkMsSUFBSXpULEtBQUs2QyxNQUFNLEtBQUsvRyxLQUFLakIsUUFBUSxDQUFDcUIsSUFBSSxJQUFJOEQsS0FBS3lCLE1BQU0sSUFBSXpCLEtBQUs2QyxNQUFNLElBQUk3QyxLQUFLNkMsTUFBTSxDQUFDcEIsTUFBTSxFQUN0RnFTLGVBQWU7Z0JBRW5CLElBQUlBLGdCQUFnQmxDLEtBQUthLHlCQUF5QmIsS0FBSyxJQUFJYSx1QkFBdUI7b0JBQzlFM1csS0FBS2pCLFFBQVEsQ0FBQ2dILFVBQVUsQ0FBQzdCO29CQUN6QjRTLFNBQVN3QixRQUFRLEdBQUdDO2dCQUN4QixPQUNLLElBQUksQ0FBQ1AsZ0JBQWdCbEMsS0FBS1ksa0JBQWtCWixLQUFLLElBQUlZLGdCQUFnQjtvQkFDdEUxVyxLQUFLakIsUUFBUSxDQUFDSSxJQUFJLENBQUMrRTtvQkFDbkI0UyxTQUFTd0IsUUFBUSxHQUFHQztnQkFDeEI7WUFDSjtRQUNKO1FBRUF2RyxhQUFhd0csT0FBTyxHQUFHLFNBQVNoWixDQUFDLEVBQUVpWixNQUFNO1lBQ3JDLElBQUkzQixVQUFVO2dCQUNWNEIsT0FBT0MsbUJBQW1CLENBQUMsYUFBYUMsWUFBWTtnQkFDcERGLE9BQU9DLG1CQUFtQixDQUFDLFdBQVdDLFlBQVk7Z0JBQ2xERixPQUFPQyxtQkFBbUIsQ0FBQyxTQUFTQyxZQUFZO2dCQUNoRCxJQUFJOUIsU0FBU2hJLEVBQUUsSUFBSWdJLFNBQVNoSSxFQUFFLENBQUM0QyxVQUFVLEVBQ3JDb0YsU0FBU2hJLEVBQUUsQ0FBQzRDLFVBQVUsQ0FBQ0MsV0FBVyxDQUFDbUYsU0FBU2hJLEVBQUU7Z0JBQ2xELElBQUlnSSxTQUFTUyxTQUFTLEVBQUU7b0JBQ3BCdlgsS0FBS2pCLFFBQVEsQ0FBQ21MLFFBQVEsQ0FBQzRNLFNBQVNTLFNBQVMsRUFBRSxjQUFjO29CQUN6RHZYLEtBQUtnRSxPQUFPLENBQUMsbUJBQW1COFM7Z0JBQ3BDO2dCQUNBYyxnQkFBZ0I1WCxNQUFNO2dCQUV0QixJQUFJQSxLQUFLNFUsU0FBUyxJQUNkNVUsS0FBS1AsUUFBUSxDQUFDb1osY0FBYztnQkFDaEM3WSxLQUFLUCxRQUFRLENBQUNxWixRQUFRLENBQUMsWUFBWTtnQkFFbkNoQyxTQUFTbkUsTUFBTSxHQUFHbUUsU0FBU1MsU0FBUztnQkFFcEMsSUFBSSxDQUFDa0IsVUFBVTNCLFNBQVNqRCxhQUFhLElBQUlrRSxLQUFLRCxHQUFHLEtBQUtoQixTQUFTaUMsTUFBTSxHQUFHbEMsWUFDcEU3VyxLQUFLRyxLQUFLLENBQUMsUUFBUTJXO2dCQUV2QixJQUFJLENBQUNBLFNBQVNLLFFBQVEsRUFBRTtvQkFDcEIsSUFBSXNCLFFBQ0EzQixTQUFTakQsYUFBYSxHQUFHO29CQUM3QjdULEtBQUtnRSxPQUFPLENBQUMsZUFBZ0I7d0JBQUM4UyxVQUFVQTtvQkFBUTtnQkFDcEQ7Z0JBQ0FBLFdBQVc7WUFDZjtRQUNKO1FBRUE5RSxhQUFhZ0gsU0FBUyxHQUFHO1lBQ3JCLElBQUlsQyxVQUNBLElBQUksQ0FBQzBCLE9BQU8sQ0FBQyxNQUFNO1lBQ3ZCeEcsYUFBYTJELFFBQVEsQ0FBQztZQUN0QjNWLEtBQUtQLFFBQVEsQ0FBQ3daLGFBQWE7WUFDM0JqWixLQUFLUCxRQUFRLENBQUNxWixRQUFRLENBQUMsWUFBWTtZQUNuQzdCLGVBQWVqWCxLQUFLUCxRQUFRLENBQUN5WixRQUFRLENBQUNDLHFCQUFxQjtZQUMzRHJDLFdBQVcsQ0FBQztRQUNoQjtRQUVBOVcsS0FBSzhMLEVBQUUsQ0FBQyxhQUFhLFNBQVN3SCxFQUFFO1lBQzVCLElBQUksQ0FBQ3RULEtBQUtvWixTQUFTLENBQUMsbUJBQ2hCO1lBQ0osSUFBSWxWLE9BQU9vUCxHQUFHVCxPQUFPO1lBQ3JCLElBQUksQ0FBQzNPLFFBQVFvUCxHQUFHTSxTQUFTLElBQ3JCO1lBQ0o1QixhQUFhZ0gsU0FBUztZQUV0Qk4sT0FBT1csZ0JBQWdCLENBQUMsYUFBYVQsWUFBWTtZQUNqREYsT0FBT1csZ0JBQWdCLENBQUMsV0FBV1QsWUFBWTtZQUMvQ0YsT0FBT1csZ0JBQWdCLENBQUMsU0FBU1QsWUFBWTtZQUU3QyxJQUFJL0UsZ0JBQWdCN1QsS0FBS2YsU0FBUyxDQUFDNlUsZ0JBQWdCO1lBQ25ELElBQUloRixLQUFLd0ssa0JBQWtCcFY7WUFFM0I0UyxXQUFXO2dCQUNQaEksSUFBSUE7Z0JBQ0o1SyxNQUFNQTtnQkFDTjJQLGVBQWVBO2dCQUNmeUQsU0FBUztnQkFDVEQsU0FBUztnQkFDVDFFLFFBQVF6TztnQkFDUjZVLFFBQVFoQixLQUFLRCxHQUFHO2dCQUNoQlgsVUFBVTtnQkFDVlEsTUFBTTtZQUNWO1lBRUFyRSxHQUFHd0QsUUFBUSxHQUFHQTtZQUNkOVcsS0FBS2dFLE9BQU8sQ0FBQyxlQUFlc1A7WUFFNUIsSUFBSXRCLGFBQWEwRCxLQUFLLElBQUksUUFDdEIxRCxhQUFha0YsSUFBSTtRQUN6QjtRQUVBLFNBQVNvQyxrQkFBa0JwVixJQUFJO1lBQzNCLElBQUlnQixJQUFJbEYsS0FBS2pCLFFBQVEsQ0FBQzRJLGVBQWUsQ0FBQ3pEO1lBQ3RDLElBQUk2SSxVQUFVL00sS0FBS1AsUUFBUSxDQUFDOFosVUFBVSxDQUFDcEssaUJBQWlCLENBQUNqSztZQUN6RCxJQUFJLENBQUM2SCxTQUFTO1lBRWQsSUFBSXJELFNBQVNxRCxRQUFRRSxZQUFZO1lBRWpDLElBQUk0RyxnQkFBZ0I3VCxLQUFLZixTQUFTLENBQUM2VSxnQkFBZ0I7WUFDbkQsSUFBSWhGLEtBQUswSyxTQUFTbE4sYUFBYSxDQUFDO1lBQ2hDd0MsR0FBRzdFLFNBQVMsR0FBR2pLLEtBQUtvVCxTQUFTLENBQUNuSixTQUFTLEdBQUc7WUFDMUMsSUFBSTNGLEtBQUt3SyxHQUFHdkMsV0FBVyxDQUFDUSxRQUFRME0sU0FBUyxDQUFDO1lBQzFDblYsR0FBR3FOLFdBQVcsQ0FBQ3JOLEdBQUcwSSxVQUFVO1lBQzVCMUksR0FBR3NMLEtBQUssQ0FBQ0MsWUFBWSxHQUFHO1lBQ3hCdkwsR0FBR3NMLEtBQUssQ0FBQzhKLE9BQU8sR0FBRztZQUVuQjVLLEdBQUdjLEtBQUssQ0FBQytKLFFBQVEsR0FBRztZQUNwQjdLLEdBQUdjLEtBQUssQ0FBQ2dLLE1BQU0sR0FBRztZQUNsQjlLLEdBQUdjLEtBQUssQ0FBQ2lLLGFBQWEsR0FBRztZQUN6Qi9LLEdBQUdjLEtBQUssQ0FBQ2tLLFFBQVEsR0FBRztZQUVwQixJQUFJakcsY0FBYzlSLE1BQU0sR0FBRyxHQUFHO2dCQUMxQnVDLEdBQUdzTCxLQUFLLENBQUNtSyxLQUFLLEdBQUc7Z0JBQ2pCelYsS0FBS3dLLEdBQUd2QyxXQUFXLENBQUNRLFFBQVEwTSxTQUFTLENBQUM7Z0JBQ3RDblYsR0FBR3FOLFdBQVcsQ0FBQ3JOLEdBQUcwSSxVQUFVO2dCQUM1QjFJLEdBQUdzTCxLQUFLLENBQUNDLFlBQVksR0FBRztnQkFDeEJ2TCxHQUFHc0wsS0FBSyxDQUFDL0csR0FBRyxHQUFHLENBQUVhLFNBQVMsSUFBSTtnQkFDOUJwRixHQUFHc0wsS0FBSyxDQUFDNEIsSUFBSSxHQUFHO2dCQUNoQmxOLEdBQUdzTCxLQUFLLENBQUMrSixRQUFRLEdBQUc7Z0JBQ3BCclYsR0FBR3NMLEtBQUssQ0FBQzhKLE9BQU8sR0FBRztZQUN2QjtZQUVBRixTQUFTUSxJQUFJLENBQUN6TixXQUFXLENBQUN1QztZQUMxQixPQUFPQTtRQUNYO1FBRUEsU0FBUzhKLFdBQVdwWixDQUFDO1lBQ2pCLElBQUlzWCxVQUFVO2dCQUNWLElBQUl0WCxFQUFFeWEsT0FBTyxLQUFLLE1BQU16YSxFQUFFOE8sSUFBSSxJQUFJLGFBQWE7b0JBQzNDMEQsYUFBYXdHLE9BQU8sQ0FBQyxNQUFNO29CQUMzQmxDLE1BQU00RCxTQUFTLENBQUMxYTtnQkFDcEIsT0FBTyxJQUFJc1gsWUFBWXRYLEVBQUV5YSxPQUFPLElBQUksTUFBT3phLEVBQUV5YSxPQUFPLElBQUksSUFBSTtvQkFDeERuRCxTQUFTcUQsTUFBTSxHQUFHM2EsRUFBRThPLElBQUksSUFBSTtvQkFDNUJ6TCxJQUFJdUgsV0FBVyxDQUFDME0sU0FBU2hJLEVBQUUsRUFBRSxRQUFRZ0ksU0FBU3FELE1BQU07Z0JBQ3hEO1lBQ0o7UUFFSjtJQUNKO0lBRUEsU0FBU3ZDLGdCQUFnQjVYLElBQUksRUFBRWtFLElBQUksRUFBRW9LLElBQUk7UUFDckN0TyxLQUFLakIsUUFBUSxDQUFDbVMsWUFBWSxHQUFHaE47UUFDN0JsRSxLQUFLakIsUUFBUSxDQUFDb1MsZ0JBQWdCLEdBQUc3QztRQUNqQ3RPLEtBQUtQLFFBQVEsQ0FBQzJhLEtBQUssQ0FBQ0MsUUFBUSxDQUFDcmEsS0FBS1AsUUFBUSxDQUFDNmEsYUFBYTtJQUM1RDtJQUVBLFNBQVNsRCxTQUFTbk0sQ0FBQyxFQUFFZ0ssQ0FBQyxFQUFFc0YsSUFBSTtRQUN4QixJQUFJdFAsSUFBSXNQLEtBQUs5SSxLQUFLLElBQUl4RyxJQUFJc1AsS0FBSy9JLElBQUksSUFBSXlELElBQUlzRixLQUFLMVIsR0FBRyxJQUFJb00sSUFBSXNGLEtBQUt6UixNQUFNLEVBQ2xFLE9BQU87SUFDZjtJQUVBL0ssT0FBT0QsT0FBTyxHQUFHMlk7QUFDakIsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7OztBQ3pTRjdZLGtDQUFBQSxtQ0FBTyxTQUFTQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsTUFBTTtJQUN4QztJQUNBLElBQUl1WSxRQUFRelksbUJBQU9BLENBQUMsR0FBd0I7SUFFNUMsU0FBUzJjLGVBQWV4SSxZQUFZO1FBQ2hDLElBQUkxVCxTQUFlMFQsYUFBYTFULE1BQU07UUFDdEMsSUFBSW1jLGVBQWVuYyxPQUFPbUIsUUFBUSxDQUFDd1QsYUFBYTtRQUdoRHFELE1BQU1vRSxXQUFXLENBQUNELGFBQWFwTyxPQUFPLEVBQ2xDLGFBQ0EyRixhQUFha0QsWUFBWSxDQUFDclEsSUFBSSxDQUFDbU4sY0FBYztRQUVqRHNFLE1BQU1vRSxXQUFXLENBQUNELGFBQWFwTyxPQUFPLEVBQ2xDLGFBQ0EyRixhQUFha0QsWUFBWSxDQUFDclEsSUFBSSxDQUFDbU4sY0FBYztRQUVqRCxJQUFJbEIsYUFBYTZKLGNBQWMzSDtRQUMvQjFVLE9BQU80VCxpQkFBaUIsQ0FBQyxtQkFBbUIsU0FBUzFTLENBQUM7WUFDbEQsSUFBSW1iLGdCQUFnQixDQUFDcmMsT0FBT1MsUUFBUSxJQUFJLENBQUNULE9BQU9TLFFBQVEsQ0FBQ3lKLE9BQU8sRUFDNUQ7WUFDSixJQUFJZixNQUFNakksRUFBRXVULG1CQUFtQjtZQUMvQixJQUFJL0MsUUFBUTFSLE9BQU9tQixRQUFRLENBQUMwWSxLQUFLLENBQUN5QyxhQUFhO1lBQy9DLElBQUk1SyxTQUFTMVIsT0FBT1MsUUFBUSxDQUFDeUosT0FBTyxDQUFDd0gsS0FBSyxFQUN0Q3lLLGFBQWFySyxXQUFXLENBQUNKO1lBQzdCZ0QsYUFBYXlILGFBQWE3SixVQUFVLENBQUNuSixJQUFJd0QsQ0FBQztZQUUxQzZGLGNBQWNrQyxjQUFjQSxXQUFXbEMsV0FBVztZQUNsRDJKLGFBQWFwTyxPQUFPLENBQUN1RCxLQUFLLENBQUNpTCxNQUFNLEdBQUcvSixjQUM5QixjQUNBO1FBQ1Y7UUFHQXhTLE9BQU80VCxpQkFBaUIsQ0FBQyxtQkFBbUIsU0FBUzFTLENBQUM7WUFDbEQsSUFBSXNSLGFBQWE7Z0JBQ2IsSUFBSXJKLE1BQU1qSSxFQUFFdVQsbUJBQW1CO2dCQUMvQjRILGVBQWU7b0JBQUMxUCxHQUFHeEQsSUFBSXdELENBQUM7Z0JBQUE7Z0JBQ3hCK0csYUFBYTJELFFBQVEsQ0FBQztnQkFDdEIzRCxhQUFhK0MsWUFBWSxDQUFDdlY7Z0JBQzFCd1MsYUFBYW1ELFVBQVUsR0FBRzNWO1lBQzlCO1lBQ0FBLEVBQUU2VyxJQUFJO1FBQ1Y7UUFFQXJFLGFBQWE4SSxZQUFZLEdBQUc7WUFDeEIsSUFBSSxJQUFJLENBQUMzRixVQUFVLElBQUl3RixjQUFjO2dCQUNqQyxJQUFJbFQsTUFBTSxJQUFJLENBQUMwTixVQUFVLENBQUNwQyxtQkFBbUI7Z0JBQzdDLElBQUlnRSxLQUFLdFAsSUFBSXdELENBQUMsQ0FBQyxvQkFBb0I7O2dCQUNuQyxJQUFJekMsVUFBVWxLLE9BQU9tQixRQUFRLENBQUNWLFFBQVEsQ0FBQ3lKLE9BQU87Z0JBQzlDLElBQUssSUFBSXRELElBQUksR0FBR0EsSUFBSXNELFFBQVF6RyxNQUFNLEVBQUVtRCxJQUFLO29CQUNyQyxJQUFJdUosTUFBTWpHLE9BQU8sQ0FBQ3RELEVBQUU7b0JBQ3BCNlIsTUFBTXRJLElBQUkwQixVQUFVO29CQUNwQixJQUFJMUIsUUFBUXVFLFdBQVdqRixNQUFNLEVBQ3pCO2dCQUNSO2dCQUNBLElBQUkwQyxRQUFRblMsT0FBT21CLFFBQVEsQ0FBQzBZLEtBQUssQ0FBQ3lDLGFBQWE7Z0JBQy9DSCxhQUFhbkssaUJBQWlCLENBQUMwQyxXQUFXakYsTUFBTSxFQUFFZ0osSUFBSXRHO2dCQUV0RCxJQUFJaFIsV0FBV25CLE9BQU9tQixRQUFRO2dCQUM5QkEsU0FBU3NiLFVBQVU7WUFDdkI7UUFDSjtRQUNBL0ksYUFBYWdKLGVBQWUsR0FBRztZQUMzQkwsZUFBZTtZQUNmRixhQUFhcE8sT0FBTyxDQUFDdUQsS0FBSyxDQUFDaUwsTUFBTSxHQUFHO1lBQ3BDL0osY0FBYztRQUNsQjtJQUVKO0lBRUFoVCxzQkFBc0IsR0FBRzBjO0FBRXpCLENBQUM7QUFBQSxrR0FBQzs7Ozs7Ozs7QUN6RUY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNBNEJpQyxHQUVqQzVjLG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBQ3hDO0lBRUEsSUFBSXVZLFFBQVF6WSxtQkFBT0EsQ0FBQyxHQUF3QjtJQUM1QyxJQUFJMFksWUFBWTFZLG1CQUFPQSxDQUFDLEdBQTRCO0lBRXBEOztDQUVDLEdBQ0QsSUFBSTJZLGFBQWExWSxrQkFBa0IsR0FBRyxTQUFTb1csUUFBUSxFQUFFNVYsTUFBTTtRQUMzRCxJQUFJLENBQUM0VixRQUFRLEdBQUdBO1FBQ2hCLElBQUksQ0FBQzVWLE1BQU0sR0FBR0E7UUFFZCxJQUFJLENBQUMyTSxDQUFDLEdBQUcsSUFBSSxDQUFDZ1EsT0FBTyxHQUFHL0csU0FBUytHLE9BQU87UUFDeEMsSUFBSSxDQUFDaEcsQ0FBQyxHQUFHLElBQUksQ0FBQ2lHLE9BQU8sR0FBR2hILFNBQVNnSCxPQUFPO1FBRXhDLElBQUksQ0FBQzdGLElBQUksR0FBRztRQUNaLElBQUksQ0FBQzhGLFlBQVksR0FBRztRQUVwQixJQUFJLENBQUNDLGtCQUFrQixHQUFHO1FBQzFCLElBQUksQ0FBQ0MsZ0JBQWdCLEdBQUc7SUFDNUI7SUFFQztRQUVHLElBQUksQ0FBQ0MsZUFBZSxHQUFHO1lBQ25CaEYsTUFBTWdGLGVBQWUsQ0FBQyxJQUFJLENBQUNwSCxRQUFRO1lBQ25DLElBQUksQ0FBQ2tILGtCQUFrQixHQUFHO1FBQzlCO1FBRUEsSUFBSSxDQUFDcEcsY0FBYyxHQUFHO1lBQ2xCc0IsTUFBTXRCLGNBQWMsQ0FBQyxJQUFJLENBQUNkLFFBQVE7WUFDbEMsSUFBSSxDQUFDbUgsZ0JBQWdCLEdBQUc7UUFDNUI7UUFFQSxJQUFJLENBQUNoRixJQUFJLEdBQUc7WUFDUixJQUFJLENBQUNpRixlQUFlO1lBQ3BCLElBQUksQ0FBQ3RHLGNBQWM7UUFDdkI7UUFFQTs7OztLQUlDLEdBQ0QsSUFBSSxDQUFDakMsbUJBQW1CLEdBQUc7WUFDdkIsSUFBSSxJQUFJLENBQUNzQyxJQUFJLEVBQ1QsT0FBTyxJQUFJLENBQUNBLElBQUk7WUFFcEIsSUFBSSxDQUFDQSxJQUFJLEdBQUcsSUFBSSxDQUFDL1csTUFBTSxDQUFDbUIsUUFBUSxDQUFDOGIsdUJBQXVCLENBQUMsSUFBSSxDQUFDTixPQUFPLEVBQUUsSUFBSSxDQUFDQyxPQUFPO1lBQ25GLE9BQU8sSUFBSSxDQUFDN0YsSUFBSTtRQUNwQjtRQUVBOzs7O0tBSUMsR0FDRCxJQUFJLENBQUNwQixXQUFXLEdBQUc7WUFDZixJQUFJLElBQUksQ0FBQ2tILFlBQVksS0FBSyxNQUN0QixPQUFPLElBQUksQ0FBQ0EsWUFBWTtZQUU1QixJQUFJalgsT0FBTyxJQUFJLENBQUMyTyxPQUFPO1lBQ3ZCLElBQUksQ0FBQ3NJLFlBQVksR0FBRyxDQUFDLENBQUVqWCxDQUFBQSxRQUFRQSxLQUFLOEQsVUFBVTtZQUM5QyxPQUFPLElBQUksQ0FBQ21ULFlBQVk7UUFDNUI7UUFFQSxJQUFJLENBQUNqWCxJQUFJLEdBQUc7UUFDWixJQUFJLENBQUMyTyxPQUFPLEdBQUcsU0FBU2xKLElBQUk7WUFDeEIsSUFBSSxJQUFJLENBQUN6RixJQUFJLEVBQ1QsT0FBTyxJQUFJLENBQUNBLElBQUk7WUFDcEIsSUFBSXVELE1BQU0sSUFBSSxDQUFDc0wsbUJBQW1CLENBQUNwSjtZQUNuQyxJQUFJLENBQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDbkosTUFBTSxDQUFDUyxRQUFRLEVBQUUsUUFBUSxzQkFBc0I7WUFDakUsT0FBTyxJQUFJLENBQUNtRixJQUFJLEdBQUcsSUFBSSxDQUFDNUYsTUFBTSxDQUFDUyxRQUFRLENBQUMwSyxnQkFBZ0IsQ0FBQ2hDLElBQUl3TixDQUFDLEVBQUV0TDtRQUNwRTtRQUVBOzs7O0tBSUMsR0FDRCxJQUFJLENBQUNpSyxTQUFTLEdBQUc7WUFDYixPQUFPMEMsTUFBTTFDLFNBQVMsQ0FBQyxJQUFJLENBQUNNLFFBQVE7UUFDeEM7UUFFQTs7S0FFQyxHQUNELElBQUksQ0FBQ0ksV0FBVyxHQUFHO1lBQ2YsT0FBTyxJQUFJLENBQUNKLFFBQVEsQ0FBQ3NILFFBQVE7UUFDakM7UUFFQSxJQUFJLENBQUNqSCxXQUFXLEdBQUdnQyxVQUFVa0YsS0FBSyxHQUM1QjtZQUFhLE9BQU8sSUFBSSxDQUFDdkgsUUFBUSxDQUFDd0gsT0FBTztRQUFFLElBQzNDO1lBQWEsT0FBTyxJQUFJLENBQUN4SCxRQUFRLENBQUN5SCxPQUFPO1FBQUU7SUFFckQsR0FBRzdRLElBQUksQ0FBQzBMLFdBQVd6TCxTQUFTO0FBRTVCLENBQUM7QUFBQSxrR0FBQzs7Ozs7Ozs7QUNoSUY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNBNEJpQyxHQUVqQ25OLG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBQ3hDO0lBRUEsSUFBSXVZLFFBQVF6WSxtQkFBT0EsQ0FBQyxHQUF3QjtJQUM1QyxJQUFJMFksWUFBWTFZLG1CQUFPQSxDQUFDLEdBQTRCO0lBQ3BELElBQUlrVSxrQkFBa0JsVSwwQ0FBNkM7SUFDbkUsSUFBSTRZLG1CQUFtQjVZLG1CQUFPQSxDQUFDLEdBQWdCO0lBQy9DLElBQUkyYyxpQkFBaUIzYyx5Q0FBMkM7SUFDaEUsSUFBSTJZLGFBQWEzWSxxQ0FBbUM7SUFDcEQsSUFBSTJPLFNBQVMzTyxtQkFBT0EsQ0FBQyxHQUFXO0lBRWhDLElBQUkrZCxlQUFlLFNBQVN0ZCxNQUFNO1FBQzlCLElBQUksQ0FBQ0EsTUFBTSxHQUFHQTtRQUVkLElBQUl5VCxnQkFBZ0IsSUFBSTtRQUN4QixJQUFJeUksZUFBZSxJQUFJO1FBQ3ZCL0QsaUJBQWlCLElBQUk7UUFHckIsSUFBSW9GLGNBQWN2ZCxPQUFPbUIsUUFBUSxDQUFDcWMsbUJBQW1CO1FBQ3JEeEYsTUFBTW9FLFdBQVcsQ0FBQ21CLGFBQWEsYUFBYSxTQUFTcmMsQ0FBQztZQUNsRGxCLE9BQU95ZCxLQUFLLENBQUM7WUFDYixPQUFPekYsTUFBTXRCLGNBQWMsQ0FBQ3hWO1FBQ2hDO1FBRUE4VyxNQUFNb0UsV0FBVyxDQUFDbUIsYUFBYSxhQUFhLElBQUksQ0FBQzNHLFlBQVksQ0FBQ3JRLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDekV5UixNQUFNb0UsV0FBVyxDQUFDbUIsYUFBYSxXQUFXLElBQUksQ0FBQzNHLFlBQVksQ0FBQ3JRLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDdkV5UixNQUFNMEYseUJBQXlCLENBQUNILGFBQWE7WUFBQztZQUFLO1lBQUs7U0FBSSxFQUFFLElBQUksRUFBRTtRQUNwRXZGLE1BQU0wRix5QkFBeUIsQ0FBQzFkLE9BQU9tQixRQUFRLENBQUN3YyxVQUFVLENBQUNDLEtBQUssRUFBRTtZQUFDO1lBQUs7WUFBSztTQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ3pGNUYsTUFBTTBGLHlCQUF5QixDQUFDMWQsT0FBT21CLFFBQVEsQ0FBQzBjLFVBQVUsQ0FBQ0QsS0FBSyxFQUFFO1lBQUM7WUFBSztZQUFLO1NBQUksRUFBRSxJQUFJLEVBQUU7UUFDekY1RixNQUFNOEYscUJBQXFCLENBQUM5ZCxPQUFPOFUsU0FBUyxFQUFFLElBQUksQ0FBQ2IsWUFBWSxDQUFDMU4sSUFBSSxDQUFDLElBQUksRUFBRTtRQUMzRXlSLE1BQU1vRSxXQUFXLENBQUNtQixhQUFhLFlBQVksSUFBSSxDQUFDM0csWUFBWSxDQUFDclEsSUFBSSxDQUFDLElBQUksRUFBRTtJQUM1RTtJQUVDO1FBQ0csSUFBSSxDQUFDcVEsWUFBWSxHQUFHLFNBQVM5VyxJQUFJLEVBQUVvQixDQUFDO1lBQ2hDLElBQUksQ0FBQ2xCLE1BQU0sQ0FBQzZCLEtBQUssQ0FBQy9CLE1BQU0sSUFBSW9ZLFdBQVdoWCxHQUFHLElBQUksQ0FBQ2xCLE1BQU07UUFDekQ7UUFFQSxJQUFJLENBQUNpVSxZQUFZLEdBQUcsU0FBU25VLElBQUksRUFBRW9CLENBQUM7WUFDaEMsSUFBSTJWLGFBQWEsSUFBSXFCLFdBQVdoWCxHQUFHLElBQUksQ0FBQ2xCLE1BQU07WUFDOUM2VyxXQUFXZ0IsS0FBSyxHQUFHLElBQUksQ0FBQ2tHLFlBQVksR0FBRztZQUN2Q2xILFdBQVdlLE1BQU0sR0FBRzFXLEVBQUUwVyxNQUFNO1lBQzVCZixXQUFXaUIsTUFBTSxHQUFHNVcsRUFBRTRXLE1BQU07WUFFNUIsSUFBSSxDQUFDOVgsTUFBTSxDQUFDNkIsS0FBSyxDQUFDL0IsTUFBTStXO1FBQzVCO1FBRUEsSUFBSSxDQUFDUSxRQUFRLEdBQUcsU0FBU0QsS0FBSztZQUMxQixJQUFJLENBQUNBLEtBQUssR0FBR0E7UUFDakI7UUFFQSxJQUFJLENBQUNYLFlBQVksR0FBRyxTQUFTekIsRUFBRSxFQUFFb0MsS0FBSztZQUNsQyxJQUFJQSxPQUNBLElBQUksQ0FBQ0MsUUFBUSxDQUFDRDtZQUVsQixJQUFJLENBQUN6SyxDQUFDLEdBQUdxSSxHQUFHckksQ0FBQztZQUNiLElBQUksQ0FBQ2dLLENBQUMsR0FBRzNCLEdBQUcyQixDQUFDO1lBRWIsSUFBSSxDQUFDdkIsY0FBYyxHQUFHO1lBRXRCLHdDQUF3QztZQUN4QyxJQUFJalUsV0FBVyxJQUFJLENBQUNuQixNQUFNLENBQUNtQixRQUFRO1lBQ25DLElBQUlBLFNBQVM2YyxxQkFBcUIsRUFDOUI3YyxTQUFTNmMscUJBQXFCLEdBQUc7WUFFckMsSUFBSUMsT0FBTyxJQUFJO1lBQ2YsSUFBSWpLLGNBQWMsU0FBUzlTLENBQUM7Z0JBQ3hCK2MsS0FBS3RSLENBQUMsR0FBR3pMLEVBQUV5YixPQUFPO2dCQUNsQnNCLEtBQUt0SCxDQUFDLEdBQUd6VixFQUFFMGIsT0FBTztnQkFDbEJxQixLQUFLcEgsVUFBVSxHQUFHLElBQUlxQixXQUFXaFgsR0FBRytjLEtBQUtqZSxNQUFNO2dCQUMvQ2llLEtBQUtDLFdBQVcsR0FBRztZQUN2QjtZQUVBLElBQUlDLGVBQWUsU0FBU2pkLENBQUM7Z0JBQ3pCa2QsY0FBY0M7Z0JBQ2RDO2dCQUNBTCxJQUFJLENBQUNBLEtBQUs3RyxLQUFLLEdBQUcsTUFBTSxJQUFJNkcsSUFBSSxDQUFDQSxLQUFLN0csS0FBSyxHQUFHLE1BQU0sQ0FBQ2xXO2dCQUNyRCtjLEtBQUt0SyxlQUFlLEdBQUc7Z0JBQ3ZCLElBQUl4UyxTQUFTNmMscUJBQXFCLElBQUksTUFBTTtvQkFDeEM3YyxTQUFTNmMscUJBQXFCLEdBQUc7b0JBQ2pDN2MsU0FBU29kLHFCQUFxQjtnQkFDbEM7Z0JBQ0FOLEtBQUs3SSxjQUFjLEdBQUc7Z0JBQ3RCbFUsS0FBSytjLEtBQUtySCxZQUFZLENBQUMsV0FBVzFWO2dCQUNsQytjLEtBQUtPLG1CQUFtQixHQUFHUCxLQUFLUSxZQUFZLEdBQUc7WUFDbkQ7WUFFQSxJQUFJSCxvQkFBb0I7Z0JBQ3BCTCxJQUFJLENBQUNBLEtBQUs3RyxLQUFLLENBQUMsSUFBSTZHLElBQUksQ0FBQ0EsS0FBSzdHLEtBQUssQ0FBQztnQkFDcEM2RyxLQUFLQyxXQUFXLEdBQUc7WUFDdkI7WUFFQSxJQUFJakcsVUFBVXlHLE9BQU8sSUFBSTFKLEdBQUdZLFFBQVEsQ0FBQzVGLElBQUksSUFBSSxZQUFZO2dCQUNyRCxPQUFPM0osV0FBVztvQkFBWThYLGFBQWFuSixHQUFHWSxRQUFRO2dCQUFFO1lBQzVEO1lBRUFxSSxLQUFLTyxtQkFBbUIsR0FBR3hLO1lBQzNCaUssS0FBS1EsWUFBWSxHQUFHekcsTUFBTTJHLE9BQU8sQ0FBQyxJQUFJLENBQUMzZSxNQUFNLENBQUM4VSxTQUFTLEVBQUVkLGFBQWFtSztZQUN0RSxJQUFJRSxVQUFVTyxZQUFZTixtQkFBbUI7UUFDakQ7UUFDQSxJQUFJLENBQUNHLFlBQVksR0FBRztJQUN4QixHQUFHalMsSUFBSSxDQUFDOFEsYUFBYTdRLFNBQVM7SUFFOUJ5QixPQUFPMlEsYUFBYSxDQUFDdkIsYUFBYTdRLFNBQVMsRUFBRSxnQkFBZ0I7UUFDekRxUyxhQUFhO1lBQUNDLGNBQWM7UUFBQztRQUM3QkMsV0FBVztZQUFDRCxjQUFjO1FBQUc7UUFDN0JFLGNBQWM7WUFBQ0YsY0FBYztRQUFDO1FBQzlCRyxnQkFBZ0I7WUFBQ0gsY0FBYztRQUFLO0lBQ3hDO0lBR0F2ZixvQkFBb0IsR0FBRzhkO0FBQ3ZCLENBQUM7QUFBQSxrR0FBQzs7Ozs7Ozs7QUMvSUZoZSxrQ0FBQUEsbUNBQU8sU0FBU0MsT0FBTyxFQUFFQyxPQUFPLEVBQUVDLE1BQU07SUFDeEM7SUFFQSxJQUFJMGYsY0FBYyxTQUFTemQsSUFBSSxFQUFFMGQsR0FBRztRQUNoQyxJQUFJeFosT0FBT2xFLEtBQUtmLFNBQVMsQ0FBQ0MsU0FBUztRQUNuQyxJQUFJeWUsV0FBVzNkLEtBQUtqQixRQUFRLENBQUN3RixXQUFXLENBQUNMLEtBQUs2QyxNQUFNO1FBRXBELElBQUksQ0FBQzRXLFlBQVlBLFNBQVM1YixNQUFNLElBQUksR0FBRztZQUNuQztRQUNKO1FBRUEsSUFBSTZILFFBQVErVCxTQUFTeFksT0FBTyxDQUFDakI7UUFDN0IsSUFBSTBaO1FBQ0osSUFBSyxJQUFJMVksSUFBSTBFLFFBQVEsR0FBRzFFLElBQUl5WSxTQUFTNWIsTUFBTSxFQUFFbUQsSUFBSztZQUM5Q2hCLE9BQU95WixRQUFRLENBQUN6WSxFQUFFO1lBQ2xCLElBQUl1QixRQUFRdkMsS0FBS3VDLEtBQUssSUFBSXZDLEtBQUs5RixJQUFJLElBQUk7WUFDdkMsSUFBSXFJLEtBQUssQ0FBQyxFQUFFLElBQUlpWCxLQUFLO2dCQUNqQkUsVUFBVTFaO2dCQUNWO1lBQ0o7UUFDSjtRQUNBLElBQUksQ0FBQzBaLFNBQVM7WUFDVixJQUFLLElBQUkxWSxJQUFJLEdBQUdBLElBQUkwRSxPQUFPMUUsSUFBSztnQkFDNUJoQixPQUFPeVosUUFBUSxDQUFDelksRUFBRTtnQkFDbEIsSUFBSXVCLFFBQVF2QyxLQUFLdUMsS0FBSyxJQUFJdkMsS0FBSzlGLElBQUksSUFBSTtnQkFDdkMsSUFBSXFJLEtBQUssQ0FBQyxFQUFFLElBQUlpWCxLQUFLO29CQUNqQkUsVUFBVTFaO29CQUNWO2dCQUNKO1lBQ0o7UUFDSjtRQUVBLElBQUkwWixTQUFTO1lBQ1Q1ZCxLQUFLZixTQUFTLENBQUNxVyxVQUFVLENBQUNzSTtZQUMxQjVkLEtBQUtQLFFBQVEsQ0FBQzhWLG1CQUFtQixDQUFDcUksU0FBUztRQUMvQztJQUNKO0lBRUE3ZixPQUFPRCxPQUFPLEdBQUcyZjtBQUNqQixDQUFDO0FBQUEsa0dBQUM7Ozs7Ozs7O0FDdkNGOzs7O0VBSUUsR0FFRjdmLG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBQ3hDO0lBRUEsSUFBSXdDLE1BQU0xQyxtQkFBT0EsQ0FBQyxHQUFzQjtJQUN4QyxJQUFJcU8sZUFBZXJPLGdEQUFzRDtJQUd6RSxJQUFJZ2dCLGFBQWEsQ0FBQztJQUVqQjtRQUNHdGQsSUFBSWdELFNBQVMsQ0FBQyxJQUFJLEVBQUUySTtRQUVwQixJQUFJLENBQUM0UixVQUFVLEdBQUc7UUFDbEIsSUFBSSxDQUFDQyxZQUFZLEdBQUc7WUFBYSxPQUFPLElBQUksQ0FBQ0QsVUFBVTtRQUFFO1FBQ3pELElBQUksQ0FBQ0UsWUFBWSxHQUFHLFNBQVNDLFNBQVM7WUFDbENBLFlBQVlsVixLQUFLbVYsS0FBSyxDQUFDRDtZQUN2QixJQUFJLElBQUksQ0FBQ0gsVUFBVSxLQUFLRyxhQUFhRSxNQUFNRixZQUN2QztZQUVKLElBQUksQ0FBQ0gsVUFBVSxHQUFHRztZQUNsQixJQUFJLENBQUNqYSxPQUFPLENBQUMsbUJBQW1CaWE7UUFDcEM7UUFFQSxJQUFJLENBQUNHLFdBQVcsR0FBRztRQUNuQixJQUFJLENBQUNDLGFBQWEsR0FBRztZQUFhLE9BQU8sSUFBSSxDQUFDRCxXQUFXO1FBQUU7UUFDM0QsSUFBSSxDQUFDRSxhQUFhLEdBQUcsU0FBU0MsVUFBVTtZQUNwQ0EsYUFBYXhWLEtBQUttVixLQUFLLENBQUNLO1lBQ3hCLElBQUksSUFBSSxDQUFDSCxXQUFXLEtBQUtHLGNBQWNKLE1BQU1JLGFBQ3pDO1lBRUosSUFBSSxDQUFDSCxXQUFXLEdBQUdHO1lBQ25CLElBQUksQ0FBQ3ZhLE9BQU8sQ0FBQyxvQkFBb0J1YTtRQUNyQztJQUdKLEdBQUd6VCxJQUFJLENBQUMrUztJQUVSOWYsT0FBT0QsT0FBTyxHQUFHK2Y7QUFDakIsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7OztBQzVDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQ0E0QmlDLEdBRWpDamdCLG1DQUFPLFNBQVNDLE9BQU8sRUFBRUMsT0FBTyxFQUFFQyxNQUFNO0lBQ3hDO0lBRUEsSUFBSXdDLE1BQU0xQyxtQkFBT0EsQ0FBQyxHQUFzQjtJQUN4QyxJQUFJcU8sZUFBZXJPLGdEQUFzRDtJQUV6RSxJQUFJa1QsWUFBWSxTQUFTaFMsUUFBUTtRQUM3QixJQUFJLENBQUNBLFFBQVEsR0FBR0E7UUFDaEIsSUFBSSxJQUFJLENBQUNBLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQ0EsUUFBUSxDQUFDeWYsYUFBYSxFQUM3QyxJQUFJLENBQUN6ZixRQUFRLENBQUN5ZixhQUFhLEdBQUcsRUFBRTtRQUNwQyxJQUFJLENBQUN6ZixRQUFRLENBQUMrTSxFQUFFLENBQUMsVUFBVSxJQUFJLENBQUMyUyxlQUFlLEdBQUcsSUFBSSxDQUFDQSxlQUFlLENBQUM1WixJQUFJLENBQUMsSUFBSTtJQUNwRjtJQUVDO1FBRUd0RSxJQUFJZ0QsU0FBUyxDQUFDLElBQUksRUFBRTJJO1FBRXBCLElBQUksQ0FBQ3dTLFdBQVcsR0FBRztRQUNuQixJQUFJLENBQUM5VixRQUFRLEdBQUcsWUFBWTtRQUU1QixJQUFJLENBQUNySyxTQUFTLEdBQUc7WUFDYixJQUFJb2dCLE1BQU0sSUFBSSxDQUFDNWYsUUFBUSxDQUFDeWYsYUFBYTtZQUNyQyxJQUFJLENBQUM5SixlQUFlLENBQUNpSyxHQUFHLENBQUMsRUFBRSxFQUFFQSxHQUFHLENBQUNBLElBQUk1YyxNQUFNLEdBQUUsRUFBRTtZQUUvQyxJQUFJLENBQUNpQyxPQUFPLENBQUM7UUFDakI7UUFFQSxJQUFJLENBQUNqRSxhQUFhLEdBQUcsU0FBU3lILEdBQUcsRUFBRW9YLE1BQU0sRUFBRUMsR0FBRztZQUMxQyxJQUFJOWYsV0FBVyxJQUFJLENBQUNBLFFBQVE7WUFDNUIsSUFBSThiLFNBQVMsSUFBSSxDQUFDM2IsU0FBUztZQUMzQixJQUFJNGYsU0FBUyxJQUFJLENBQUNDLFNBQVM7WUFDM0IsSUFBSTdaLElBQUluRyxTQUFTNEksZUFBZSxDQUFDa1Q7WUFDakMsSUFBSSxDQUFDZ0UsS0FBSztnQkFDTixJQUFJLENBQUNqTixLQUFLLENBQUM7WUFDZixPQUFPLElBQUlpTixPQUFPLENBQUNELFFBQVE7Z0JBQ3ZCLElBQUksQ0FBQ0ksWUFBWSxDQUFDbkU7WUFDdEI7WUFFQSxJQUFJaFIsTUFBTTlLLFNBQVM2SSxXQUFXO1lBQzlCLElBQUlrQyxNQUFNL0ssU0FBUzhJLFdBQVc7WUFDOUIsSUFBSW9YLFVBQVU7WUFDZCxJQUFJQyxPQUFPaGE7WUFDWCxHQUFHO2dCQUNDZ2EsUUFBUTFYO2dCQUNSLElBQUkwWCxPQUFPclYsS0FBSztvQkFDWnFWLE9BQU8sSUFBSSxDQUFDUixXQUFXLEdBQUc1VSxNQUFNRDtvQkFDaENvVixVQUFVO2dCQUNkLE9BQU8sSUFBSUMsT0FBT3BWLEtBQUs7b0JBQ25Cb1YsT0FBTyxJQUFJLENBQUNSLFdBQVcsR0FBRzdVLE1BQU1DO29CQUNoQ21WLFVBQVU7Z0JBQ2Q7Z0JBQ0EsSUFBSXJCLFVBQVU3ZSxTQUFTMkksY0FBYyxDQUFDd1g7WUFFMUMsUUFBUyxDQUFDRCxXQUFXckIsV0FBVyxDQUFDN2UsU0FBU21KLFlBQVksQ0FBQzBWLFNBQVU7WUFFakUsSUFBSSxDQUFDQSxXQUFXLENBQUM3ZSxTQUFTbUosWUFBWSxDQUFDMFYsVUFDbkNBLFVBQVUvQztZQUVkLElBQUkrRCxRQUFRO2dCQUNSLElBQUksQ0FBQ2xLLGVBQWUsQ0FBQ2tKLFNBQVNrQixRQUFRRDtZQUMxQyxPQUFPO2dCQUNILElBQUksQ0FBQ3ZKLFVBQVUsQ0FBQ3NJLFNBQVNpQjtZQUM3QjtRQUNKO1FBRUEsSUFBSSxDQUFDM2YsU0FBUyxHQUFHO1lBQ2IsSUFBSXlmLE1BQU0sSUFBSSxDQUFDNWYsUUFBUSxDQUFDeWYsYUFBYTtZQUNyQyxPQUFPRyxJQUFJOUQsTUFBTSxJQUFJOEQsR0FBRyxDQUFDQSxJQUFJNWMsTUFBTSxHQUFHLEVBQUU7UUFDNUM7UUFDQSxJQUFJLENBQUNnZCxTQUFTLEdBQUc7WUFDYixJQUFJSixNQUFNLElBQUksQ0FBQzVmLFFBQVEsQ0FBQ3lmLGFBQWE7WUFDckMsT0FBT0csSUFBSUcsTUFBTSxJQUFJSCxJQUFJOUQsTUFBTSxJQUFJOEQsR0FBRyxDQUFDLEVBQUU7UUFDN0M7UUFDQSxJQUFJLENBQUM3SyxnQkFBZ0IsR0FBRztZQUNwQixJQUFJNkssTUFBTSxJQUFJLENBQUM1ZixRQUFRLENBQUN5ZixhQUFhO1lBQ3JDLE9BQU9HLElBQUl4YyxLQUFLO1FBQ3BCO1FBQ0EsSUFBSSxDQUFDZ2QsdUJBQXVCLEdBQUc7WUFDM0IsSUFBSXBnQixXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJNGYsTUFBTTVmLFNBQVN5ZixhQUFhO1lBQ2hDLE9BQU9HLElBQUl4WCxNQUFNLENBQUMsU0FBU2pELElBQUk7Z0JBQzNCLE9BQU9uRixTQUFTZ0osU0FBUyxDQUFDN0Q7WUFDOUI7UUFDSjtRQUVBLElBQUksQ0FBQ2tiLE9BQU8sR0FBRztZQUNYLElBQUlULE1BQU0sSUFBSSxDQUFDNWYsUUFBUSxDQUFDeWYsYUFBYTtZQUNyQyxPQUFPRyxJQUFJNWMsTUFBTSxLQUFLO1FBQzFCO1FBQ0EsSUFBSSxDQUFDc2QsVUFBVSxHQUFHO1lBQ2QsSUFBSVYsTUFBTSxJQUFJLENBQUM1ZixRQUFRLENBQUN5ZixhQUFhO1lBQ3JDLE9BQU9HLElBQUk1YyxNQUFNLEdBQUc7UUFDeEI7UUFDQSxJQUFJLENBQUM0UyxZQUFZLEdBQUcsU0FBU3pRLElBQUk7WUFDN0IsSUFBSW5GLFdBQVcsSUFBSSxDQUFDQSxRQUFRO1lBQzVCLElBQUk0ZixNQUFNNWYsU0FBU3lmLGFBQWE7WUFDaEMsSUFBSXRaLElBQUl5WixJQUFJeFosT0FBTyxDQUFDakI7WUFDcEIsSUFBSWdCLEtBQUssQ0FBQyxHQUNOeVosSUFBSXJaLE1BQU0sQ0FBQ0osR0FBRztZQUNsQm5HLFNBQVNrSixXQUFXLENBQUMvRCxNQUFNLENBQUNuRixTQUFTaUosVUFBVSxDQUFDOUQ7WUFDaEQsSUFBSW5GLFNBQVNpSixVQUFVLENBQUM5RCxPQUFPO2dCQUMzQnlhLElBQUl2USxJQUFJLENBQUNsSztnQkFDVHlhLElBQUlHLE1BQU0sR0FBR0gsSUFBSTlELE1BQU0sR0FBRzNXO1lBQzlCLE9BQ0l5YSxJQUFJRyxNQUFNLEdBQUdILElBQUk5RCxNQUFNLEdBQUc4RCxHQUFHLENBQUNBLElBQUk1YyxNQUFNLEdBQUcsRUFBRTtZQUVqRCxJQUFJLENBQUNpQyxPQUFPLENBQUM7UUFDakI7UUFDQSxJQUFJLENBQUNzUixVQUFVLEdBQUcsU0FBU3BSLElBQUksRUFBRTJhLEdBQUcsRUFBRXphLE1BQU07WUFDeEMsSUFBSXJGLFdBQVcsSUFBSSxDQUFDQSxRQUFRO1lBQzVCLElBQUk0ZixNQUFNNWYsU0FBU3lmLGFBQWE7WUFDaEMsSUFBSSxDQUFDemYsU0FBU21KLFlBQVksQ0FBQ2hFLE9BQ3ZCO1lBQ0osSUFBSSxDQUFDMmEsS0FDRCxJQUFJLENBQUNqTixLQUFLLENBQUM7WUFDZixJQUFJMU4sTUFBTTtnQkFDTixJQUFJZ0IsSUFBSXlaLElBQUl4WixPQUFPLENBQUNqQjtnQkFDcEIsSUFBSWdCLEtBQUssQ0FBQyxHQUNOeVosSUFBSXJaLE1BQU0sQ0FBQ0osR0FBRztnQkFDbEJuRyxTQUFTa0osV0FBVyxDQUFDL0QsTUFBTTtnQkFDM0IsSUFBSW5GLFNBQVNpSixVQUFVLENBQUM5RCxPQUNwQnlhLElBQUl2USxJQUFJLENBQUNsSztZQUNqQjtZQUNBeWEsSUFBSUcsTUFBTSxHQUFHSCxJQUFJOUQsTUFBTSxHQUFHM1c7WUFDMUIsSUFBSSxDQUFDRixPQUFPLENBQUM7UUFDakI7UUFDQSxJQUFJLENBQUM2YSxHQUFHLEdBQUcsU0FBUzNhLElBQUk7WUFDcEIsSUFBSSxDQUFDb1IsVUFBVSxDQUFDcFIsTUFBTTtRQUMxQjtRQUNBLElBQUksQ0FBQ29iLE1BQU0sR0FBRyxTQUFTcGIsSUFBSTtZQUN2QixJQUFJLElBQUksQ0FBQ25GLFFBQVEsQ0FBQ2lKLFVBQVUsQ0FBQzlELE9BQ3pCLElBQUksQ0FBQ3lRLFlBQVksQ0FBQ3pRO1FBQzFCO1FBQ0EsSUFBSSxDQUFDME4sS0FBSyxHQUNWLElBQUksQ0FBQzJOLGNBQWMsR0FBRyxTQUFTbmIsTUFBTTtZQUNqQyxJQUFJckYsV0FBVyxJQUFJLENBQUNBLFFBQVE7WUFDNUIsSUFBSTRmLE1BQU01ZixTQUFTeWYsYUFBYTtZQUNoQ0csSUFBSTFYLE9BQU8sQ0FBQyxTQUFTL0MsSUFBSTtnQkFBSW5GLFNBQVNrSixXQUFXLENBQUMvRCxNQUFNO1lBQVE7WUFDaEV5YSxJQUFJclosTUFBTSxDQUFDLEdBQUdxWixJQUFJNWMsTUFBTTtZQUN4QjRjLElBQUlHLE1BQU0sR0FBR0gsSUFBSTlELE1BQU07WUFFdkJ6VyxVQUFVLElBQUksQ0FBQ0osT0FBTyxDQUFDO1FBQzNCO1FBQ0EsSUFBSSxDQUFDZ2IsWUFBWSxHQUFHLFNBQVM5YSxJQUFJLEVBQUVFLE1BQU07WUFDckMsSUFBSXJGLFdBQVcsSUFBSSxDQUFDQSxRQUFRO1lBQzVCLElBQUk0ZixNQUFNNWYsU0FBU3lmLGFBQWE7WUFDaEMsSUFBSXRaLElBQUl5WixJQUFJeFosT0FBTyxDQUFDakI7WUFDcEIsSUFBSWdCLEtBQUssQ0FBQyxHQUFHO2dCQUNUeVosSUFBSXJaLE1BQU0sQ0FBQ0osR0FBRztnQkFDZG5HLFNBQVNrSixXQUFXLENBQUMvRCxNQUFNO2dCQUMzQixJQUFJeWEsSUFBSUcsTUFBTSxJQUFJNWEsTUFDZHlhLElBQUlHLE1BQU0sR0FBR0gsR0FBRyxDQUFDelosSUFBRSxFQUFFLElBQUl5WixHQUFHLENBQUN6WixFQUFFO2dCQUNuQyxJQUFJeVosSUFBSTlELE1BQU0sSUFBSTNXLE1BQ2R5YSxJQUFJOUQsTUFBTSxHQUFHOEQsR0FBRyxDQUFDelosRUFBRSxJQUFJeVosR0FBRyxDQUFDelosSUFBRSxFQUFFO2dCQUNuQ2QsVUFBVSxJQUFJLENBQUNKLE9BQU8sQ0FBQztZQUMzQjtRQUNKO1FBQ0EsSUFBSSxDQUFDNlEsWUFBWSxHQUFHLFNBQVNMLEtBQUs7WUFDOUIsSUFBSS9RLE1BQU1DLE9BQU8sQ0FBQzhRLFFBQVE7Z0JBQ3RCLElBQUksQ0FBQzVDLEtBQUssQ0FBQztnQkFDWDRDLE1BQU12TixPQUFPLENBQUMsU0FBUy9DLElBQUk7b0JBQ3ZCLElBQUksQ0FBQ29SLFVBQVUsQ0FBQ3BSLE1BQU0sTUFBTTtnQkFDaEMsR0FBRyxJQUFJO1lBQ1gsT0FDSSxJQUFJLENBQUNvUixVQUFVLENBQUNkLE9BQU8sT0FBTztRQUN0QztRQUNBLElBQUksQ0FBQ0UsZUFBZSxHQUFHLFNBQVNtRyxNQUFNLEVBQUVpRSxNQUFNLEVBQUVVLFFBQVE7WUFDcERWLFNBQVNBLFVBQVUsSUFBSSxDQUFDQyxTQUFTO1lBRWpDLElBQUksQ0FBQ1MsVUFDRCxJQUFJLENBQUM1TixLQUFLLENBQUM7WUFDZixJQUFJN1MsV0FBVyxJQUFJLENBQUNBLFFBQVE7WUFDNUIsSUFBSTRmLE1BQU01ZixTQUFTeWYsYUFBYTtZQUVoQyxJQUFJdlYsTUFBTWxLLFNBQVM0SSxlQUFlLENBQUNrVDtZQUNuQyxJQUFJbFMsUUFBUTVKLFNBQVM0SSxlQUFlLENBQUNtWCxVQUFVakU7WUFFL0MsSUFBSTVSLE1BQU1OLE9BQU87Z0JBQ2IsSUFBSyxJQUFJekQsSUFBSXlELE9BQU96RCxLQUFLK0QsS0FBSy9ELElBQUs7b0JBQy9CLElBQUloQixPQUFPbkYsU0FBUzJJLGNBQWMsQ0FBQ3hDO29CQUNuQyxJQUFJMEUsUUFBUStVLElBQUl4WixPQUFPLENBQUNqQjtvQkFDeEIsSUFBSTBGLFNBQVMsQ0FBQyxHQUNWK1UsSUFBSXJaLE1BQU0sQ0FBQ3NFLE9BQU87b0JBQ3RCLElBQUk3SyxTQUFTbUosWUFBWSxDQUFDaEUsT0FDdEJuRixTQUFTa0osV0FBVyxDQUFDL0QsTUFBTTtvQkFDL0J5YSxJQUFJdlEsSUFBSSxDQUFDbEs7Z0JBQ2I7WUFDSixPQUFPO2dCQUNILElBQUssSUFBSWdCLElBQUl5RCxPQUFPekQsS0FBSytELEtBQUsvRCxJQUFLO29CQUMvQixJQUFJaEIsT0FBT25GLFNBQVMySSxjQUFjLENBQUN4QztvQkFDbkMsSUFBSTBFLFFBQVErVSxJQUFJeFosT0FBTyxDQUFDakI7b0JBQ3hCLElBQUkwRixTQUFTLENBQUMsR0FDVitVLElBQUlyWixNQUFNLENBQUNzRSxPQUFPO29CQUN0QixJQUFJN0ssU0FBU21KLFlBQVksQ0FBQ2hFLE9BQ3RCbkYsU0FBU2tKLFdBQVcsQ0FBQy9ELE1BQU07b0JBQy9CeWEsSUFBSXZRLElBQUksQ0FBQ2xLO2dCQUNiO1lBQ0o7WUFFQXlhLElBQUk5RCxNQUFNLEdBQUdBO1lBQ2I4RCxJQUFJRyxNQUFNLEdBQUdBO1lBRWIsSUFBSSxDQUFDOWEsT0FBTyxDQUFDO1FBQ2pCO1FBRUEsSUFBSSxDQUFDeWEsZUFBZSxHQUFHLFNBQVNnQixRQUFRO1lBQ3BDLElBQUlkLE1BQU0sSUFBSSxDQUFDN0ssZ0JBQWdCO1lBQy9CLElBQUkvVSxXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJMmdCLFNBQVM3RSxTQUFTLElBQUksQ0FBQzNiLFNBQVM7WUFDcEN5ZixJQUFJMVgsT0FBTyxDQUFDLFNBQVNDLENBQUM7Z0JBQ2xCLElBQUluSSxTQUFTcUosVUFBVSxDQUFDcVgsVUFBVXZZLElBQUk7b0JBQ2xDd1ksVUFBVTtvQkFDVixJQUFJLENBQUNWLFlBQVksQ0FBQzlYLEdBQUc7Z0JBQ3pCO1lBQ0osR0FBRyxJQUFJO1lBQ1AsSUFBSXdZLFdBQVcsQ0FBQzNnQixTQUFTaUosVUFBVSxDQUFDNlMsU0FBUztnQkFDekMsSUFBSTlULFNBQVMwWSxTQUFTMVksTUFBTTtnQkFDNUIsSUFBSXpDLEtBQUssRUFBRTtnQkFDWCxJQUFJeUMsVUFBVWhJLFNBQVNzRixNQUFNLENBQUMwQyxTQUFTO29CQUNuQ3pDLEtBQUt2RixTQUFTd0YsV0FBVyxDQUFDd0M7b0JBQzFCLElBQUk3QixJQUFJWixHQUFHYSxPQUFPLENBQUNzYTtnQkFDdkI7Z0JBQ0EsSUFBSXZhLEtBQUssQ0FBQyxHQUFHO29CQUNUQSxJQUFJdWEsU0FBUzdWLEtBQUs7b0JBQ2xCLElBQUkxRixPQUFPSSxFQUFFLENBQUNZLEVBQUUsSUFBSVosRUFBRSxDQUFDWSxJQUFJLEVBQUUsSUFBSTZCO2dCQUNyQyxPQUFPO29CQUNIN0MsT0FBT0ksRUFBRSxDQUFDWSxJQUFJLEVBQUUsSUFBSVosRUFBRSxDQUFDWSxJQUFJLEVBQUUsSUFBSTZCO2dCQUNyQztnQkFDQSxJQUFJN0MsUUFBUW5GLFNBQVNxQixJQUFJLEVBQ3JCOEQsT0FBT0ksRUFBRSxDQUFDLEVBQUUsSUFBSUo7Z0JBQ3BCLElBQUlBLE1BQ0EsSUFBSSxDQUFDb1IsVUFBVSxDQUFDcFIsTUFBTTtnQkFDMUIsSUFBSSxDQUFDRixPQUFPLENBQUM7WUFDakI7UUFDSjtJQUNKLEdBQUc4RyxJQUFJLENBQUNpRyxVQUFVaEcsU0FBUztJQUUzQmpOLGlCQUFpQixHQUFHaVQ7QUFDcEIsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7OztBQzVRRjs7OztFQUlFLEdBRUZuVCxtQ0FBTyxTQUFTQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsTUFBTTtJQUN4QztJQUVBLDBEQUEwRDtJQUMxRCxJQUFJNGhCLFdBQVc5aEIsMENBQTZDO0lBQzVELDJEQUEyRDtJQUUzREMseUNBQW9DO0lBRXBDLElBQUl5QyxNQUFNMUMsbUJBQU9BLENBQUMsR0FBc0I7SUFDeEMsSUFBSXlDLE9BQU96QyxtQkFBT0EsQ0FBQyxHQUF1QjtJQUMxQyxJQUFJMFksWUFBWTFZLG1CQUFPQSxDQUFDLEdBQTRCO0lBQ3BELElBQUlnaUIsWUFBWWhpQiw2Q0FBb0Q7SUFDcEUsSUFBSStkLGVBQWUvZCx1Q0FBNkM7SUFDaEUsSUFBSWlpQixhQUFhamlCLDhDQUFzRDtJQUN2RSxJQUFJa1QsWUFBWWxULG9DQUFnQztJQUNoRCxJQUFJcU8sZUFBZXJPLGdEQUFzRDtJQUN6RSxJQUFJa2lCLGlCQUFpQmxpQixrREFBK0Q7SUFDcEYsSUFBSW1pQixrQkFBa0JuaUIsbUNBQStDO0lBQ3JFLElBQUkyTyxTQUFTM08sbUJBQU9BLENBQUMsR0FBVTtJQUUvQixJQUFJNGYsY0FBYzVmLG1CQUFPQSxDQUFDLEdBQWU7SUFDekM7O0VBRUUsR0FFRjs7Ozs7O0VBTUUsR0FDRixJQUFJb2lCLE9BQU8sU0FBUzVULE9BQU8sRUFBRTZULFNBQVMsRUFBRUMsVUFBVTtRQUM5QyxJQUFJLENBQUNDLFVBQVUsR0FBRyxFQUFFO1FBQ3BCLElBQUksQ0FBQ0YsU0FBUyxHQUFJQSxhQUFhO1FBQy9CLElBQUksQ0FBQ0MsVUFBVSxHQUFHQSxjQUFjO1FBRWhDLElBQUksQ0FBQzFnQixRQUFRLEdBQUcsSUFBSWtnQixTQUFTdFQsU0FBUyxJQUFJLENBQUM2VCxTQUFTLEVBQUUsSUFBSSxDQUFDQyxVQUFVO1FBQ3JFLElBQUksQ0FBQy9NLFNBQVMsR0FBRyxJQUFJLENBQUMzVCxRQUFRLENBQUMyVCxTQUFTO1FBRXhDLElBQUksQ0FBQ2pWLFFBQVEsR0FBRyxJQUFJNGhCLGVBQWV4SixVQUFVa0YsS0FBSyxHQUFHLFFBQVEsT0FBT3VFO1FBQ3BFLElBQUksQ0FBQ0ssU0FBUyxHQUFJLElBQUlSLFVBQVUsSUFBSSxDQUFDek0sU0FBUyxFQUFFLElBQUk7UUFDcEQsSUFBSSxDQUFDa04sVUFBVSxHQUFHLElBQUlSLFdBQVcsSUFBSTtRQUVyQyxrQ0FBa0M7UUFDbEMsSUFBSSxDQUFDaEwsYUFBYSxHQUFHLElBQUk4RyxhQUFhLElBQUk7UUFFMUMsSUFBSSxDQUFDMkUsZUFBZSxHQUFHO1FBRXZCLElBQUlDLFFBQVEsSUFBSTtRQUNoQixJQUFJLENBQUMvZ0IsUUFBUSxDQUFDcU0sRUFBRSxDQUFDLFFBQVEsU0FBU3RNLENBQUM7WUFDL0JnaEIsTUFBTXJnQixLQUFLLENBQUMsUUFBUVg7UUFDeEI7UUFFQSxJQUFJLENBQUNyQixRQUFRLENBQUMyTixFQUFFLENBQUMsUUFBUTtZQUNyQixJQUFJLENBQUMyVSxnQkFBZ0IsR0FBRztRQUM1QixHQUFFNWIsSUFBSSxDQUFDLElBQUk7UUFDWCxJQUFJLENBQUMxRyxRQUFRLENBQUMyTixFQUFFLENBQUMsYUFBYTtZQUMxQixJQUFJLElBQUksQ0FBQzJVLGdCQUFnQixFQUFFO2dCQUN2QixJQUFJLENBQUNBLGdCQUFnQixHQUFHO2dCQUN4QixJQUFJLENBQUNoaEIsUUFBUSxDQUFDOFYsbUJBQW1CO2dCQUNqQyxJQUFJLENBQUN2UixPQUFPLENBQUM7WUFDakI7UUFDSixHQUFFYSxJQUFJLENBQUMsSUFBSTtRQUNYLElBQUksQ0FBQ2lILEVBQUUsQ0FBQyxtQkFBbUI7WUFDdkIsSUFBSSxJQUFJLENBQUNnSixhQUFhLENBQUNwQixjQUFjLEVBQ2pDLElBQUksQ0FBQzFQLE9BQU8sQ0FBQztRQUNyQixHQUFFYSxJQUFJLENBQUMsSUFBSTtRQUdYLHFDQUFxQztRQUNyQyxvQkFBb0I7UUFFcEIySCxPQUFPa1UsWUFBWSxDQUFDLElBQUk7UUFDeEJsVSxPQUFPck0sS0FBSyxDQUFDLFFBQVEsSUFBSTtJQUM3QjtJQUVDO1FBRUdJLElBQUlnRCxTQUFTLENBQUMsSUFBSSxFQUFFMkk7UUFFcEI7O01BRUUsR0FDRixJQUFJLENBQUNPLGVBQWUsR0FBRyxTQUFTMU4sUUFBUTtZQUNwQyxJQUFJLElBQUksQ0FBQ0EsUUFBUSxFQUFFO2dCQUNmLElBQUk0aEIsY0FBYyxJQUFJLENBQUM1aEIsUUFBUTtnQkFDL0Isa0VBQWtFO2dCQUVsRSxJQUFJLENBQUNFLFNBQVMsQ0FBQzJoQixHQUFHLENBQUMsZUFBZSxJQUFJLENBQUNDLGNBQWM7Z0JBQ3JELElBQUksQ0FBQzVoQixTQUFTLENBQUMyaEIsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDRSxrQkFBa0I7Z0JBRXBESCxZQUFZQyxHQUFHLENBQUMsZUFBZSxJQUFJLENBQUNHLGNBQWM7Z0JBQ2xESixZQUFZQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUNJLE9BQU87Z0JBQ3RDTCxZQUFZQyxHQUFHLENBQUMsWUFBWSxJQUFJLENBQUNJLE9BQU87Z0JBQ3hDTCxZQUFZQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUNJLE9BQU87Z0JBQ3RDTCxZQUFZQyxHQUFHLENBQUMsbUJBQW1CLElBQUksQ0FBQ0ssa0JBQWtCO2dCQUMxRE4sWUFBWUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLENBQUNNLG1CQUFtQjtZQUNoRTtZQUVBLElBQUksQ0FBQ25pQixRQUFRLEdBQUdBO1lBQ2hCLElBQUksQ0FBQ29pQixLQUFLLEdBQUdwaUIsVUFBVSx5Q0FBeUM7WUFDaEUsSUFBSUEsVUFBVTtnQkFDVixJQUFJLENBQUNVLFFBQVEsQ0FBQ2dOLGVBQWUsQ0FBQzFOO2dCQUU5QixpRUFBaUU7Z0JBQ2pFLGlFQUFpRTtnQkFFakUsSUFBSSxDQUFDLElBQUksQ0FBQ2lpQixPQUFPLEVBQUUsSUFBSSxDQUFDQSxPQUFPLEdBQUcsSUFBSSxDQUFDSSxNQUFNLENBQUN2YyxJQUFJLENBQUMsSUFBSTtnQkFFdkQsSUFBSSxDQUFDOUYsUUFBUSxDQUFDK00sRUFBRSxDQUFDLFVBQVUsSUFBSSxDQUFDa1YsT0FBTztnQkFDdkMsSUFBSSxDQUFDamlCLFFBQVEsQ0FBQytNLEVBQUUsQ0FBQyxZQUFZLElBQUksQ0FBQ2tWLE9BQU87Z0JBQ3pDLElBQUksQ0FBQ2ppQixRQUFRLENBQUMrTSxFQUFFLENBQUMsVUFBVSxJQUFJLENBQUNrVixPQUFPO2dCQUV2QyxRQUFRO2dCQUNSLElBQUksQ0FBQyxJQUFJLENBQUNqaUIsUUFBUSxDQUFDRSxTQUFTLEVBQUU7b0JBQzFCLElBQUksQ0FBQ0YsUUFBUSxDQUFDRSxTQUFTLEdBQUcsSUFBSThSLFVBQVUsSUFBSSxDQUFDaFMsUUFBUTtnQkFDekQ7Z0JBRUEsSUFBSSxDQUFDRSxTQUFTLEdBQUcsSUFBSSxDQUFDRixRQUFRLENBQUNFLFNBQVM7Z0JBRXhDLElBQUksQ0FBQzRoQixjQUFjLEdBQUcsSUFBSSxDQUFDUSxhQUFhLENBQUN4YyxJQUFJLENBQUMsSUFBSTtnQkFDbEQsSUFBSSxDQUFDNUYsU0FBUyxDQUFDNk0sRUFBRSxDQUFDLGVBQWUsSUFBSSxDQUFDK1UsY0FBYztnQkFDcEQsSUFBSSxDQUFDRSxjQUFjLEdBQUcsSUFBSSxDQUFDQSxjQUFjLENBQUNsYyxJQUFJLENBQUMsSUFBSTtnQkFDbkQsSUFBSSxDQUFDOUYsUUFBUSxDQUFDK00sRUFBRSxDQUFDLGVBQWUsSUFBSSxDQUFDaVYsY0FBYztnQkFFbkQsSUFBSSxDQUFDRCxrQkFBa0IsR0FBRyxJQUFJLENBQUNRLGlCQUFpQixDQUFDemMsSUFBSSxDQUFDLElBQUk7Z0JBQzFELElBQUksQ0FBQzVGLFNBQVMsQ0FBQzZNLEVBQUUsQ0FBQyxVQUFVLElBQUksQ0FBQ2dWLGtCQUFrQjtnQkFHbkQsSUFBSSxDQUFDRyxrQkFBa0IsR0FBRyxJQUFJLENBQUNNLGlCQUFpQixDQUFDMWMsSUFBSSxDQUFDLElBQUk7Z0JBQzFELElBQUksQ0FBQzlGLFFBQVEsQ0FBQytNLEVBQUUsQ0FBQyxtQkFBbUIsSUFBSSxDQUFDbVYsa0JBQWtCO2dCQUUzRCxJQUFJLENBQUNDLG1CQUFtQixHQUFHLElBQUksQ0FBQ00sa0JBQWtCLENBQUMzYyxJQUFJLENBQUMsSUFBSTtnQkFDNUQsSUFBSSxDQUFDOUYsUUFBUSxDQUFDK00sRUFBRSxDQUFDLG9CQUFvQixJQUFJLENBQUNvVixtQkFBbUI7Z0JBRTdELElBQUksQ0FBQ1gsZUFBZSxJQUFJO2dCQUN4QixJQUFJLENBQUNjLGFBQWE7Z0JBQ2xCLElBQUksQ0FBQ2QsZUFBZSxJQUFJO2dCQUV4QixJQUFJLENBQUNnQixpQkFBaUI7Z0JBQ3RCLElBQUksQ0FBQ0Msa0JBQWtCO2dCQUN2QixJQUFJLENBQUNGLGlCQUFpQjtnQkFDdEIsSUFBSSxDQUFDN2hCLFFBQVEsQ0FBQ3NiLFVBQVU7WUFDNUI7WUFFQSxJQUFJLENBQUM1YSxLQUFLLENBQUMsc0JBQXNCO2dCQUM3QnBCLFVBQVVBO2dCQUNWNGhCLGFBQWFBO1lBQ2pCO1FBQ0o7UUFFQSxJQUFJLENBQUNTLE1BQU0sR0FBRztZQUNWLElBQUksQ0FBQzNoQixRQUFRLENBQUNzYixVQUFVO1FBQzVCO1FBRUEsSUFBSSxDQUFDMEcsU0FBUyxHQUFHO1lBQ2IsT0FBTyxHQUFHLG1DQUFtQztRQUNqRDtRQUVBLElBQUksQ0FBQ0MsT0FBTyxHQUFHLFNBQVN2VSxHQUFHO1lBQ3ZCLE9BQU87Z0JBQ0hwTCxRQUFTLEVBQUUsNENBQTRDO1lBQzNEO1FBQ0o7UUFFQTs7TUFFRSxHQUNGLElBQUksQ0FBQzRmLGVBQWUsR0FBRztZQUNuQixPQUFPLElBQUksQ0FBQzVpQixRQUFRO1FBQ3hCO1FBRUE7Ozs7TUFJRSxHQUNGLElBQUksQ0FBQzZpQixZQUFZLEdBQUc7WUFDaEIsT0FBTyxJQUFJLENBQUMzaUIsU0FBUztRQUN6QjtRQUVBOzs7Ozs7TUFNRSxHQUNGLElBQUksQ0FBQzRpQixNQUFNLEdBQUcsU0FBU0MsS0FBSztZQUN4QixJQUFJLENBQUNyaUIsUUFBUSxDQUFDc2lCLFFBQVEsQ0FBQ0Q7UUFDM0I7UUFFQTs7O01BR0UsR0FDRixJQUFJLENBQUMvRixLQUFLLEdBQUcsU0FBU2lHLElBQUk7WUFDdEIsMkJBQTJCO1lBQzNCLDZDQUE2QztZQUM3QyxvQ0FBb0M7WUFDcEMsSUFBSXhCLFFBQVEsSUFBSTtZQUNoQndCLFFBQVFyZCxXQUFXO2dCQUNmNmIsTUFBTUgsU0FBUyxDQUFDdEUsS0FBSztZQUN6QjtZQUNBLElBQUksQ0FBQ3NFLFNBQVMsQ0FBQ3RFLEtBQUs7UUFDeEI7UUFFQTs7O01BR0UsR0FDRixJQUFJLENBQUNuSCxTQUFTLEdBQUc7WUFDYixPQUFPLElBQUksQ0FBQ3lMLFNBQVMsQ0FBQ3pMLFNBQVM7UUFDbkM7UUFFQTs7O01BR0UsR0FDRixJQUFJLENBQUNxTixJQUFJLEdBQUc7WUFDUixJQUFJLENBQUM1QixTQUFTLENBQUM0QixJQUFJO1FBQ3ZCO1FBRUE7Ozs7O01BS0UsR0FDRixJQUFJLENBQUNDLE9BQU8sR0FBRztZQUNYLElBQUksSUFBSSxDQUFDQyxVQUFVLEVBQ2Y7WUFDSixJQUFJLENBQUNBLFVBQVUsR0FBRztZQUNsQixJQUFJLENBQUMxaUIsUUFBUSxDQUFDb1osY0FBYztZQUM1QixJQUFJLENBQUMxWSxLQUFLLENBQUM7UUFDZjtRQUVBOzs7OztNQUtFLEdBQ0YsSUFBSSxDQUFDaWlCLE1BQU0sR0FBRztZQUNWLElBQUksQ0FBQyxJQUFJLENBQUNELFVBQVUsRUFDaEI7WUFDSixJQUFJLENBQUNBLFVBQVUsR0FBRztZQUNsQixJQUFJLENBQUMxaUIsUUFBUSxDQUFDd1osYUFBYTtZQUMzQixJQUFJLENBQUM5WSxLQUFLLENBQUM7UUFDZjtRQUVBLElBQUksQ0FBQ29oQixpQkFBaUIsR0FBRztZQUNyQixJQUFJLENBQUM5aEIsUUFBUSxDQUFDNGlCLFNBQVMsQ0FBQyxJQUFJLENBQUN0akIsUUFBUSxDQUFDZ2YsWUFBWTtRQUN0RDtRQUVBLElBQUksQ0FBQ3lELGtCQUFrQixHQUFHO1lBQ3RCLElBQUksQ0FBQy9oQixRQUFRLENBQUM2aUIsU0FBUyxDQUFDLElBQUksQ0FBQzdpQixRQUFRLENBQUM0ZSxhQUFhO1FBQ3ZEO1FBRUEsSUFBSSxDQUFDMEMsY0FBYyxHQUFHO1lBQ2xCLElBQUksQ0FBQ3RoQixRQUFRLENBQUM4aUIsV0FBVztRQUM3QjtRQUVBOzs7TUFHRSxHQUNGLElBQUksQ0FBQ2xCLGFBQWEsR0FBRztZQUNqQixJQUFJLENBQUNOLGNBQWM7WUFFbkIsSUFBSSxDQUFDLElBQUksQ0FBQ1IsZUFBZSxFQUNyQixJQUFJLENBQUNFLGdCQUFnQixHQUFHO1lBRTVCLElBQUksQ0FBQ3RnQixLQUFLLENBQUM7UUFDZjtRQUVBLElBQUksQ0FBQ21oQixpQkFBaUIsR0FBRyxTQUFTOWhCLENBQUM7WUFDL0IsSUFBSSxDQUFDNmhCLGFBQWE7UUFDdEI7UUFFQSxJQUFJLENBQUNtQixXQUFXLEdBQUcsU0FBU0MsT0FBTyxFQUFFNWlCLElBQUk7WUFDckMsSUFBSSxDQUFDMUIsUUFBUSxDQUFDRSxJQUFJLENBQUNva0IsU0FBUyxJQUFJLEVBQUU1aUI7UUFDdEM7UUFFQSxJQUFJLENBQUM2aUIsV0FBVyxHQUFHLFNBQVNDLElBQUk7WUFDNUIsSUFBSSxDQUFDckMsVUFBVSxDQUFDb0MsV0FBVyxDQUFDQztRQUNoQztRQUVBLElBQUksQ0FBQ0MsWUFBWSxHQUFHLFNBQVNwakIsQ0FBQyxFQUFFcWpCLE1BQU0sRUFBRTVJLE9BQU87WUFDM0MsSUFBSSxDQUFDcUcsVUFBVSxDQUFDc0MsWUFBWSxDQUFDcGpCLEdBQUdxakIsUUFBUTVJO1FBQzVDO1FBRUEsSUFBSSxDQUFDbmEsV0FBVyxHQUFHLFNBQVM0ZCxHQUFHO1lBQzNCLElBQUksSUFBSSxDQUFDb0YsV0FBVyxFQUNoQixPQUFPLElBQUksQ0FBQ0EsV0FBVyxDQUFDcEY7WUFFNUJELFlBQVksSUFBSSxFQUFFQztRQUN0QjtRQUVBLElBQUksQ0FBQ3FGLFFBQVEsR0FBRyxTQUFTQyxLQUFLO1lBQzFCLElBQUksQ0FBQ3ZqQixRQUFRLENBQUNzakIsUUFBUSxDQUFDQztRQUMzQjtRQUVBOzs7Ozs7OztNQVFFLEdBQ0YsSUFBSSxDQUFDQyxnQkFBZ0IsR0FBRztZQUNwQixJQUFJOVosUUFBUSxJQUFJLENBQUMrWixpQkFBaUIsR0FBR0MsWUFBWTtZQUVqRCxPQUFPO2dCQUNIQyxPQUFPamEsTUFBTVIsS0FBSyxDQUFDd0UsR0FBRztnQkFDdEJrVyxNQUFNbGEsTUFBTUYsR0FBRyxDQUFDa0UsR0FBRztZQUN2QjtRQUNKO1FBRUE7Ozs7O01BS0UsR0FDRixJQUFJLENBQUNtVyxlQUFlLEdBQUcsU0FBU0MsU0FBUztZQUNyQyxPQUFPLElBQUksQ0FBQzlqQixRQUFRLENBQUM2akIsZUFBZSxDQUFDQztRQUN6QztRQUNBOzs7Ozs7TUFNRSxHQUNGLElBQUksQ0FBQ0MsYUFBYSxHQUFHLFNBQVN0ZixJQUFJLEVBQUVxZixTQUFTO1lBQ3pDLE9BQU8sSUFBSSxDQUFDOWpCLFFBQVEsQ0FBQytqQixhQUFhLENBQUN0ZixNQUFNcWY7UUFDN0M7UUFFQSxJQUFJLENBQUNFLFdBQVcsR0FBRyxTQUFTamMsR0FBRyxFQUFFb1gsTUFBTTtZQUNuQyxJQUFJbmYsV0FBVyxJQUFJLENBQUNBLFFBQVE7WUFDNUIsSUFBSStNLFNBQVMsSUFBSSxDQUFDL00sUUFBUSxDQUFDRSxXQUFXO1lBQ3RDNk0sT0FBTzVNLFVBQVUsR0FBRyxJQUFJLENBQUNiLFFBQVEsQ0FBQ21FLFNBQVM7WUFDM0MsSUFBSXdDLE9BQU84QixNQUFNdUIsS0FBS0MsS0FBSyxDQUFDd0QsT0FBT2hELE1BQU0sR0FBR2dELE9BQU81TSxVQUFVO1lBRTdELElBQUksQ0FBQzJnQixlQUFlO1lBQ3BCLElBQUksQ0FBQ3RoQixTQUFTLENBQUNjLGFBQWEsQ0FBQzJGLE1BQU1rWjtZQUNuQyxJQUFJLENBQUMyQixlQUFlO1lBRXBCLElBQUl0QyxZQUFZeGUsU0FBU3dlLFNBQVM7WUFFbEN4ZSxTQUFTQyxRQUFRLENBQUMsR0FBR2dHLE9BQU84RyxPQUFPNU0sVUFBVTtZQUM3QyxJQUFJZ2YsVUFBVSxNQUNWbmYsU0FBUzhWLG1CQUFtQixDQUFDLE1BQU07WUFFdkM5VixTQUFTaWtCLGdCQUFnQixDQUFDekY7UUFDOUI7UUFFQTs7TUFFRSxHQUNGLElBQUksQ0FBQzBGLGNBQWMsR0FBRztZQUNsQixJQUFJLENBQUNGLFdBQVcsQ0FBQyxHQUFHO1FBQ3hCO1FBRUE7O01BRUUsR0FDRixJQUFJLENBQUNHLFlBQVksR0FBRztZQUNoQixJQUFJLENBQUNILFdBQVcsQ0FBQyxDQUFDLEdBQUc7UUFDekI7UUFFQTs7TUFFRSxHQUNGLElBQUksQ0FBQ2xrQixZQUFZLEdBQUc7WUFDakIsSUFBSSxDQUFDa2tCLFdBQVcsQ0FBQyxHQUFHO1FBQ3ZCO1FBRUE7O01BRUUsR0FDRixJQUFJLENBQUNwa0IsVUFBVSxHQUFHO1lBQ2QsSUFBSSxDQUFDb2tCLFdBQVcsQ0FBQyxDQUFDLEdBQUc7UUFDekI7UUFFQTs7TUFFRSxHQUNGLElBQUksQ0FBQ25rQixjQUFjLEdBQUc7WUFDbEIsSUFBSSxDQUFDbWtCLFdBQVcsQ0FBQztRQUNyQjtRQUVBOztNQUVFLEdBQ0YsSUFBSSxDQUFDcmtCLFlBQVksR0FBRztZQUNoQixJQUFJLENBQUNxa0IsV0FBVyxDQUFDLENBQUM7UUFDdEI7UUFFQTs7Ozs7Ozs7O01BU0UsR0FDRixJQUFJLENBQUNJLFdBQVcsR0FBRyxTQUFTMVcsR0FBRyxFQUFFMlcsTUFBTSxFQUFFQyxPQUFPLEVBQUV0YixRQUFRO1lBQ3RELElBQUksQ0FBQ2hKLFFBQVEsQ0FBQ29rQixXQUFXLENBQUMxVyxLQUFLMlcsUUFBUUMsU0FBU3RiO1FBQ3BEO1FBRUE7O01BRUUsR0FDRixJQUFJLENBQUNqSyxlQUFlLEdBQUc7WUFDbkIsSUFBSTJLLFFBQVEsSUFBSSxDQUFDK1osaUJBQWlCO1lBQ2xDLElBQUl6YixNQUFNO2dCQUNOMEYsS0FBS3BFLEtBQUtDLEtBQUssQ0FBQ0csTUFBTVIsS0FBSyxDQUFDd0UsR0FBRyxHQUFHLENBQUNoRSxNQUFNRixHQUFHLENBQUNrRSxHQUFHLEdBQUdoRSxNQUFNUixLQUFLLENBQUN3RSxHQUFHLElBQUk7Z0JBQ3RFWSxRQUFRaEYsS0FBS0MsS0FBSyxDQUFDRyxNQUFNUixLQUFLLENBQUNvRixNQUFNLEdBQUcsQ0FBQzVFLE1BQU1GLEdBQUcsQ0FBQzhFLE1BQU0sR0FBRzVFLE1BQU1SLEtBQUssQ0FBQ29GLE1BQU0sSUFBSTtZQUN0RjtZQUNBLElBQUksQ0FBQ3RPLFFBQVEsQ0FBQ3VrQixVQUFVLENBQUN2YyxLQUFLO1FBQ2xDO1FBRUE7Ozs7Ozs7OztNQVNFLEdBQ0YsSUFBSSxDQUFDd2MsaUJBQWlCLEdBQUc7WUFDckIsT0FBTyxJQUFJLENBQUNobEIsU0FBUyxDQUFDQyxTQUFTO1FBQ25DO1FBRUE7OztNQUdFLEdBQ0YsSUFBSSxDQUFDZ2xCLHVCQUF1QixHQUFHO1lBQzNCLE9BQU8sSUFBSSxDQUFDQyxPQUFPLENBQUNDLHdCQUF3QixDQUFDLElBQUksQ0FBQ0gsaUJBQWlCO1FBQ3ZFO1FBRUE7Ozs7TUFJRSxHQUNGLElBQUksQ0FBQ2YsaUJBQWlCLEdBQUc7WUFDckIsT0FBTyxJQUFJLENBQUNqa0IsU0FBUyxDQUFDMkosUUFBUTtRQUNsQztRQUdBOzs7TUFHRSxHQUNGLElBQUksQ0FBQ3JLLFNBQVMsR0FBRztZQUNiLElBQUksQ0FBQ2dpQixlQUFlLElBQUk7WUFDeEIsSUFBSSxDQUFDdGhCLFNBQVMsQ0FBQ1YsU0FBUztZQUN4QixJQUFJLENBQUNnaUIsZUFBZSxJQUFJO1FBQzVCO1FBRUE7OztNQUdFLEdBQ0YsSUFBSSxDQUFDaEIsY0FBYyxHQUFHO1lBQ2xCLElBQUksQ0FBQ3RnQixTQUFTLENBQUNzZ0IsY0FBYztRQUNqQztRQUVBOzs7Ozs7O01BT0UsR0FDRixJQUFJLENBQUM4RSxXQUFXLEdBQUcsU0FBU2xYLEdBQUcsRUFBRVksTUFBTTtZQUNuQyxJQUFJLENBQUM5TyxTQUFTLENBQUNvbEIsV0FBVyxDQUFDbFgsS0FBS1k7UUFDcEM7UUFFQTs7Ozs7O01BTUUsR0FDRixJQUFJLENBQUN1VyxtQkFBbUIsR0FBRyxTQUFTN2MsR0FBRztZQUNuQyxJQUFJLENBQUN4SSxTQUFTLENBQUNxbEIsbUJBQW1CLENBQUM3YztRQUN2QztRQUVBOzs7Ozs7TUFNRSxHQUNGLElBQUksQ0FBQzhjLE9BQU8sR0FBRyxTQUFTQyxTQUFTLEVBQUV6VyxNQUFNLEVBQUVnVyxPQUFPO1lBQzlDLElBQUksQ0FBQzlrQixTQUFTLENBQUNzZ0IsY0FBYztZQUU3QixJQUFJeFIsV0FBVzNLLFdBQ1gySyxTQUFTLElBQUksQ0FBQzlPLFNBQVMsQ0FBQ0MsU0FBUyxHQUFHNk8sTUFBTTtZQUU5QyxJQUFJLENBQUN3UyxlQUFlLElBQUk7WUFDeEIsSUFBSSxDQUFDOEQsV0FBVyxDQUFDRyxZQUFZLEdBQUd6VyxVQUFVO1lBQzFDLElBQUksQ0FBQ3dTLGVBQWUsSUFBSTtZQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDa0UsaUJBQWlCLENBQUNELFlBQVksSUFDcEMsSUFBSSxDQUFDWCxXQUFXLENBQUNXLFlBQVksR0FBRyxNQUFNVDtRQUM5QztRQUVBOzs7Ozs7O01BT0UsR0FDRixJQUFJLENBQUNXLFVBQVUsR0FBRyxTQUFTdlgsR0FBRyxFQUFFWSxNQUFNO1lBQ2xDLElBQUksQ0FBQ3dSLGNBQWM7WUFDbkIsSUFBSSxDQUFDOEUsV0FBVyxDQUFDbFgsS0FBS1k7UUFDMUI7UUFFQTs7Ozs7TUFLRSxHQUNGLElBQUksQ0FBQzRXLFVBQVUsR0FBRztZQUNkLElBQUl6Z0IsT0FBTyxJQUFJLENBQUNuRixRQUFRLENBQUM2bEIsUUFBUSxDQUFDO1lBQ2xDMWdCLFFBQVEsSUFBSSxDQUFDakYsU0FBUyxDQUFDNFYsWUFBWSxDQUFDM1E7WUFDcEMsSUFBSSxDQUFDMmdCLGVBQWU7UUFDeEI7UUFFQTs7Ozs7TUFLRSxHQUNGLElBQUksQ0FBQ0MsWUFBWSxHQUFHO1lBQ2hCLElBQUk1Z0IsT0FBTyxJQUFJLENBQUNuRixRQUFRLENBQUM2bEIsUUFBUSxDQUFDO1lBQ2xDMWdCLFFBQVEsSUFBSSxDQUFDakYsU0FBUyxDQUFDNFYsWUFBWSxDQUFDM1E7UUFDeEM7UUFFQTs7TUFFRSxHQUNGLElBQUksQ0FBQ3pGLGVBQWUsR0FBRyxTQUFTc0gsVUFBVTtZQUN0QyxJQUFJN0IsT0FBTyxJQUFJLENBQUNqRixTQUFTLENBQUNDLFNBQVM7WUFDbkMsSUFBSSxDQUFDZ0YsTUFBTTtZQUNQLFdBQVc7WUFDZixPQUFPLElBQUk2QixjQUFjLElBQUksQ0FBQ2hILFFBQVEsQ0FBQ3NGLE1BQU0sQ0FBQ0gsT0FBTztnQkFDakQsSUFBSSxDQUFDbkYsUUFBUSxDQUFDQyxLQUFLLENBQUNrRjtZQUN4QixPQUFPO2dCQUNILElBQUksQ0FBQ2pGLFNBQVMsQ0FBQzRWLFlBQVksQ0FBQzNRLEtBQUs2QyxNQUFNO1lBQzNDO1FBQ0o7UUFFQTs7TUFFRSxHQUNGLElBQUksQ0FBQ3JJLGlCQUFpQixHQUFHO1lBQ3JCLElBQUl3RixPQUFPLElBQUksQ0FBQ2pGLFNBQVMsQ0FBQ0MsU0FBUztZQUNuQyxJQUFJbUksY0FBYyxJQUFJLENBQUN0SSxRQUFRLENBQUNzSSxXQUFXLENBQUNuRDtZQUM1QyxJQUFJLENBQUNtRCxlQUFlLElBQUksQ0FBQ3RJLFFBQVEsQ0FBQ3NGLE1BQU0sQ0FBQ0gsT0FDckMsT0FBTyxJQUFJLENBQUNqRixTQUFTLENBQUNjLGFBQWEsQ0FBQztZQUV4QyxJQUFJLENBQUNoQixRQUFRLENBQUNJLElBQUksQ0FBQytFO1FBQ3ZCO1FBRUEsSUFBSSxDQUFDdEYsYUFBYSxHQUFHO1lBQ2pCLElBQUlzRixPQUFPLElBQUksQ0FBQzZnQixZQUFZO1lBQzVCLElBQUksQ0FBQzlsQixTQUFTLENBQUM0VixZQUFZLENBQUMzUTtRQUNoQztRQUVBLElBQUksQ0FBQ3JGLFdBQVcsR0FBRztZQUNmLElBQUlxRixPQUFPLElBQUksQ0FBQzhnQixXQUFXO1lBQzNCLElBQUksQ0FBQy9sQixTQUFTLENBQUM0VixZQUFZLENBQUMzUTtRQUNoQztRQUNBLElBQUksQ0FBQzZnQixZQUFZLEdBQUc7WUFDaEIsSUFBSW5iLFFBQVEsSUFBSSxDQUFDN0ssUUFBUSxDQUFDNkksV0FBVztZQUNyQyxPQUFPLElBQUksQ0FBQzdJLFFBQVEsQ0FBQzJJLGNBQWMsQ0FBQ2tDO1FBQ3hDO1FBQ0EsSUFBSSxDQUFDb2IsV0FBVyxHQUFHO1lBQ2YsSUFBSXBiLFFBQVEsSUFBSSxDQUFDN0ssUUFBUSxDQUFDOEksV0FBVztZQUNyQyxPQUFPLElBQUksQ0FBQzlJLFFBQVEsQ0FBQzJJLGNBQWMsQ0FBQ2tDO1FBQ3hDO1FBRUEsSUFBSSxDQUFDaWIsZUFBZSxHQUFHLFNBQVMzZ0IsSUFBSTtZQUNoQyxJQUFJLENBQUN6RSxRQUFRLENBQUM4VixtQkFBbUI7UUFDckM7UUFFQSxJQUFJLENBQUNxSixNQUFNLEdBQUcsU0FBUzFhLElBQUk7WUFDdkIsSUFBSSxDQUFDakYsU0FBUyxDQUFDNFYsWUFBWSxDQUFDM1E7UUFDaEM7UUFFQSxJQUFJLENBQUMrZ0IsV0FBVyxHQUFHLFNBQVMvZ0IsSUFBSTtZQUM1QixPQUFPO1FBQ1g7UUFDQSxJQUFJLENBQUNnaEIsT0FBTyxHQUFHLFNBQVNoaEIsSUFBSTtZQUN4QixPQUFPO1FBQ1g7UUFFQSxJQUFJLENBQUM3RCxNQUFNLEdBQUcsU0FBUzZELElBQUksRUFBRTZmLE9BQU87WUFDaEMsSUFBSWhsQixXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJZ0ksU0FBUzdDLEtBQUs2QyxNQUFNO1lBQ3hCLE1BQU9BLE9BQVE7Z0JBQ1gsSUFBSSxDQUFDaEksU0FBU3NGLE1BQU0sQ0FBQzBDLFNBQ2pCaEksU0FBU2tGLE1BQU0sQ0FBQzhDO2dCQUNwQkEsU0FBU0EsT0FBT0EsTUFBTTtZQUMxQjtZQUVBLElBQUksQ0FBQzZYLE1BQU0sQ0FBQzFhO1lBQ1osSUFBSStaLFlBQVksSUFBSSxDQUFDeGUsUUFBUSxDQUFDd2UsU0FBUztZQUN2QyxJQUFJLENBQUN4ZSxRQUFRLENBQUM4VixtQkFBbUIsQ0FBQ3JSLE1BQU07WUFDeEMsSUFBSTZmLFlBQVksT0FDWixJQUFJLENBQUN0a0IsUUFBUSxDQUFDaWtCLGdCQUFnQixDQUFDekY7UUFDdkM7UUFFQTs7O01BR0UsR0FDRixJQUFJLENBQUNrSCxJQUFJLEdBQUc7WUFDUixJQUFJLENBQUM1RSxlQUFlO1lBQ3BCLElBQUksQ0FBQzRELE9BQU8sQ0FBQ2lCLGNBQWMsR0FBR0QsSUFBSTtZQUNsQyxJQUFJLENBQUM1RSxlQUFlO1lBQ3BCLElBQUksQ0FBQzlnQixRQUFRLENBQUM4VixtQkFBbUIsQ0FBQyxNQUFNO1FBQzVDO1FBRUE7OztNQUdFLEdBQ0YsSUFBSSxDQUFDOFAsSUFBSSxHQUFHO1lBQ1IsSUFBSSxDQUFDOUUsZUFBZTtZQUNwQixJQUFJLENBQUM0RCxPQUFPLENBQUNpQixjQUFjLEdBQUdDLElBQUk7WUFDbEMsSUFBSSxDQUFDOUUsZUFBZTtZQUNwQixJQUFJLENBQUM5Z0IsUUFBUSxDQUFDOFYsbUJBQW1CLENBQUMsTUFBTTtRQUM1QztRQUVBOzs7TUFHRSxHQUNGLElBQUksQ0FBQytQLFdBQVcsR0FBRztZQUNmLE9BQU8sSUFBSSxDQUFDbE0sU0FBUyxDQUFDO1FBQzFCO1FBRUE7OztNQUdFLEdBQ0YsSUFBSSxDQUFDbEssT0FBTyxHQUFHO1lBQ1gsSUFBSSxDQUFDelAsUUFBUSxDQUFDeVAsT0FBTztZQUNyQixJQUFJLENBQUMvTyxLQUFLLENBQUMsV0FBVyxJQUFJO1FBQzlCO1FBRUEsSUFBSSxDQUFDb2xCLG9CQUFvQixHQUFHLFNBQVMvakIsS0FBSztZQUN0QyxJQUFJLENBQUMvQixRQUFRLENBQUM4bEIsb0JBQW9CLENBQUMvakI7UUFDdkM7UUFFQSxJQUFJLENBQUNna0Isb0JBQW9CLEdBQUcsU0FBU2hrQixLQUFLO1lBQ3RDLElBQUksQ0FBQy9CLFFBQVEsQ0FBQytsQixvQkFBb0IsQ0FBQ2hrQjtRQUN2QztRQUVBLElBQUksQ0FBQ2lrQixNQUFNLEdBQUc7WUFDVixJQUFJLENBQUNDLFNBQVMsR0FBRztZQUNqQixJQUFJLENBQUN0UyxTQUFTLENBQUN4RCxLQUFLLENBQUNpSyxhQUFhLEdBQUc7WUFDckMsSUFBSSxDQUFDekcsU0FBUyxDQUFDeEQsS0FBSyxDQUFDOEosT0FBTyxHQUFHO1FBQ25DO1FBRUEsSUFBSSxDQUFDaU0sT0FBTyxHQUFHO1lBQ1gsSUFBSSxDQUFDRCxTQUFTLEdBQUc7WUFDakIsSUFBSSxDQUFDdFMsU0FBUyxDQUFDeEQsS0FBSyxDQUFDaUssYUFBYSxHQUFHO1lBQ3JDLElBQUksQ0FBQ3pHLFNBQVMsQ0FBQ3hELEtBQUssQ0FBQzhKLE9BQU8sR0FBRztZQUMvQixJQUFJLElBQUksQ0FBQzlFLFNBQVMsSUFDZCxJQUFJLENBQUNxTixJQUFJO1FBQ2pCO0lBRUosR0FBR25YLElBQUksQ0FBQ21WLEtBQUtsVixTQUFTO0lBRXRCeUIsT0FBTzJRLGFBQWEsQ0FBQzhDLEtBQUtsVixTQUFTLEVBQUUsUUFBUTtRQUN6QzZhLFFBQVE7WUFDSnJrQixLQUFLLFNBQVNxa0IsTUFBTSxHQUVwQjtZQUNBdkksY0FBYztRQUNsQjtRQUNBd0ksVUFBVTtZQUNOdGtCLEtBQUssU0FBU3NrQixRQUFRO2dCQUNsQixJQUFJLENBQUN4RixTQUFTLENBQUN5RixXQUFXLENBQUNEO1lBQy9CO1lBQ0F4SSxjQUFjO1FBQ2xCO1FBRUEwSSxnQkFBZ0I7UUFDaEJDLFVBQVU7UUFDVkMsVUFBVTtRQUVWN0ksYUFBYTtRQUNiSSxnQkFBZ0I7SUFDcEI7SUFFQXpmLE9BQU9ELE9BQU8sR0FBR21pQjtBQUNqQixDQUFDO0FBQUEsa0dBQUM7Ozs7Ozs7O0FDdnRCRnJpQixrQ0FBQUEsbUNBQU8sU0FBU0MsT0FBTyxFQUFFQyxPQUFPLEVBQUVDLE1BQU07SUFDeEM7SUFFQSxJQUFJd0MsTUFBTTFDLG1CQUFPQSxDQUFDLEdBQXNCO0lBQ3hDLElBQUlnRixNQUFNaEYsbUJBQU9BLENBQUMsR0FBc0I7SUFDeEMsSUFBSTJPLFNBQVMzTyxtQkFBT0EsQ0FBQyxHQUFVO0lBRS9CLElBQUlxb0IsWUFBWXJvQixnQ0FBOEI7SUFDOUMsSUFBSXNvQixjQUFjdG9CLG9DQUFvQztJQUN0RCxJQUFJdW9CLGNBQWN2b0Isc0NBQXVDO0lBRXpELElBQUl3b0IsYUFBYXhvQiwrQ0FBNEM7SUFDN0QsSUFBSXlvQixhQUFhem9CLCtDQUE0QztJQUM3RCxJQUFJMG9CLGFBQWExb0IsOENBQTZDO0lBQzlELElBQUlxTyxlQUFlck8sZ0RBQXNEO0lBQ3pFLElBQUkyb0IsV0FBVzNvQixtQkFBT0EsQ0FBQyxHQUE0QztJQUVuRWdGLElBQUlDLGVBQWUsQ0FBQzBqQixVQUFVO0lBRTlCLElBQUlDLGVBQWU1b0IsbUJBQU9BLENBQUMsR0FBbUI7SUFDOUM7OztFQUdFLEdBRUY7Ozs7Ozs7RUFPRSxHQUVGLElBQUkraEIsa0JBQWtCLFNBQVN4TSxTQUFTLEVBQUU4TSxTQUFTLEVBQUVDLFVBQVU7UUFDM0QsSUFBSUssUUFBUSxJQUFJO1FBRWhCLElBQUksQ0FBQ3BOLFNBQVMsR0FBR0EsYUFBYXZRLElBQUl5SixhQUFhLENBQUM7UUFFaER6SixJQUFJNmpCLFdBQVcsQ0FBQyxJQUFJLENBQUN0VCxTQUFTLEVBQUU7UUFDaEN2USxJQUFJNmpCLFdBQVcsQ0FBQyxJQUFJLENBQUN0VCxTQUFTLEVBQUU7UUFFaEMsOEJBQThCO1FBQzlCLElBQUksQ0FBQzhGLFFBQVEsR0FBR3JXLElBQUl5SixhQUFhLENBQUM7UUFDbEMsSUFBSSxDQUFDNE0sUUFBUSxDQUFDalAsU0FBUyxHQUFHO1FBQzFCLElBQUksQ0FBQ21KLFNBQVMsQ0FBQzdHLFdBQVcsQ0FBQyxJQUFJLENBQUMyTSxRQUFRO1FBRXhDLElBQUksQ0FBQ3lOLEtBQUssR0FBRzlqQixJQUFJeUosYUFBYSxDQUFDO1FBQy9CLElBQUksQ0FBQ3FhLEtBQUssQ0FBQzFjLFNBQVMsR0FBRztRQUN2QixJQUFJLENBQUNpUCxRQUFRLENBQUMzTSxXQUFXLENBQUMsSUFBSSxDQUFDb2EsS0FBSztRQUVwQyxJQUFJLENBQUMxVCxhQUFhLEdBQUcsSUFBSW1ULFlBQVksSUFBSSxDQUFDaFQsU0FBUyxFQUFFLElBQUk7UUFDekQsSUFBSSxDQUFDd1QsWUFBWSxHQUFHLElBQUlULFlBQVksSUFBSSxDQUFDUSxLQUFLLEVBQUUsSUFBSTtRQUVwRCxJQUFJLENBQUNwTixVQUFVLEdBQUcsSUFBSTJNLFVBQVUsSUFBSSxDQUFDUyxLQUFLO1FBQzFDLElBQUksQ0FBQ0UsTUFBTSxHQUFHLElBQUksQ0FBQ3ROLFVBQVUsQ0FBQ2xOLE9BQU87UUFFckMsaUVBQWlFO1FBQ2pFLElBQUksQ0FBQ3lhLFlBQVksR0FBRztRQUVwQixJQUFJLENBQUM3SyxVQUFVLEdBQUcsSUFBSXFLLFdBQVcsSUFBSSxDQUFDbFQsU0FBUyxFQUFFLElBQUk7UUFDckQsSUFBSSxDQUFDNkksVUFBVSxDQUFDOEssVUFBVSxDQUFDO1FBQzNCLElBQUksQ0FBQzlLLFVBQVUsQ0FBQzVDLGdCQUFnQixDQUFDLFVBQVUsU0FBUzdaLENBQUM7WUFDakQsSUFBSSxDQUFDZ2hCLE1BQU13RyxrQkFBa0IsRUFDekJ4RyxNQUFNeEMsWUFBWSxDQUFDeGUsRUFBRXluQixJQUFJLEdBQUd6RyxNQUFNMEcsWUFBWSxDQUFDcmUsR0FBRztRQUMxRDtRQUVBLElBQUksQ0FBQ3NULFVBQVUsR0FBRyxJQUFJa0ssV0FBVyxJQUFJLENBQUNqVCxTQUFTLEVBQUUsSUFBSTtRQUNyRCxJQUFJLENBQUMrSSxVQUFVLENBQUM5QyxnQkFBZ0IsQ0FBQyxVQUFVLFNBQVM3WixDQUFDO1lBQ2pELElBQUksQ0FBQ2doQixNQUFNd0csa0JBQWtCLEVBQ3pCeEcsTUFBTWxDLGFBQWEsQ0FBQzllLEVBQUV5bkIsSUFBSTtRQUNsQztRQUVBLElBQUksQ0FBQ2hKLFNBQVMsR0FBRztRQUNqQixJQUFJLENBQUNNLFVBQVUsR0FBRztRQUVsQixJQUFJLENBQUM0SSxRQUFRLEdBQUc7WUFDWmhhLEtBQU07WUFDTlksUUFBUztRQUNiO1FBRUEsSUFBSSxDQUFDb0ssS0FBSyxHQUFHO1lBQ1RuSSxPQUFPO1lBQ1B4RyxRQUFRO1lBQ1I0TyxnQkFBZ0I7WUFDaEJ3QyxlQUFlO1lBQ2Z3TSxlQUFlO1FBQ25CO1FBRUEsSUFBSSxDQUFDem5CLFdBQVcsR0FBRztZQUNmcVEsT0FBUTtZQUNScVgsU0FBVTtZQUNWL1osVUFBVztZQUNYZ2EsZ0JBQWdCO1lBQ2hCL1osU0FBVTtZQUNWM04sWUFBYTtZQUNiMm5CLGdCQUFpQjtZQUNqQkMsV0FBWTtZQUNaQyxXQUFZO1lBQ1ovZCxRQUFTO1lBQ1RGLFFBQVM7UUFDYjtRQUVBLElBQUksQ0FBQzBkLFlBQVksR0FBRztZQUNoQjFWLE1BQU07WUFDTkMsT0FBTztZQUNQNUksS0FBSztZQUNMQyxRQUFRO1lBQ1I0ZSxHQUFHO1lBQ0hDLEdBQUc7UUFDUDtRQUVBLElBQUksQ0FBQzlDLGVBQWUsR0FBRztRQUV2QixJQUFJLENBQUN6SyxLQUFLLEdBQUcsSUFBSW1NLFdBQ2IsSUFBSSxDQUFDcUIsY0FBYyxDQUFDL2lCLElBQUksQ0FBQyxJQUFJLEdBQzdCLElBQUksQ0FBQ3VPLFNBQVMsQ0FBQ3lVLGFBQWEsQ0FBQ0MsV0FBVztRQUU1QyxJQUFJLENBQUMxTixLQUFLLENBQUNDLFFBQVEsQ0FBQyxJQUFJLENBQUMwTixXQUFXO1FBQ3BDLElBQUksQ0FBQ2hGLFFBQVEsQ0FBQzBEO1FBRWQsSUFBSSxDQUFDdUIsWUFBWSxHQUFHLElBQUksQ0FBQ0EsWUFBWSxDQUFDbmpCLElBQUksQ0FBQyxJQUFJO1FBQy9DNlQsT0FBT1csZ0JBQWdCLENBQUMsU0FBUyxJQUFJLENBQUMyTyxZQUFZO0lBQ3REO0lBRUM7UUFDRyxJQUFJLENBQUNDLGFBQWEsR0FBTTtRQUN4QixJQUFJLENBQUNDLGFBQWEsR0FBTTtRQUN4QixJQUFJLENBQUNDLFVBQVUsR0FBUztRQUN4QixJQUFJLENBQUNDLFlBQVksR0FBTztRQUN4QixJQUFJLENBQUNDLFdBQVcsR0FBUTtRQUN4QixJQUFJLENBQUNDLFlBQVksR0FBTztRQUN4QixJQUFJLENBQUNoTyxhQUFhLEdBQU07UUFDeEIsSUFBSSxDQUFDeU4sV0FBVyxHQUFRO1FBRXhCLElBQUksQ0FBQ1EsZUFBZSxHQUFHO1FBRXZCaG9CLElBQUlnRCxTQUFTLENBQUMsSUFBSSxFQUFFMkk7UUFFcEI7OztNQUdFLEdBQ0YsSUFBSSxDQUFDTyxlQUFlLEdBQUcsU0FBUzFOLFFBQVE7WUFDcEMsSUFBSSxDQUFDQSxRQUFRLEdBQUdBO1lBQ2hCLElBQUksQ0FBQ29pQixLQUFLLEdBQUdwaUI7WUFFYixJQUFJLElBQUksQ0FBQ21vQixZQUFZLENBQUNyZSxHQUFHLElBQUk5SixZQUFZQSxTQUFTZ2YsWUFBWSxNQUFNLEdBQ2hFaGYsU0FBU2lmLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQ2tKLFlBQVksQ0FBQ3JlLEdBQUc7WUFFaEQsSUFBSSxDQUFDcVEsUUFBUSxDQUFDalAsU0FBUyxHQUFHO1lBRTFCLElBQUksQ0FBQ3NQLFVBQVUsQ0FBQzlNLGVBQWUsQ0FBQzFOO1lBQ2hDLElBQUksQ0FBQzZuQixZQUFZLENBQUNuYSxlQUFlLENBQUMxTjtZQUNsQyxJQUFJLENBQUNrVSxhQUFhLENBQUN4RyxlQUFlLENBQUMxTjtZQUVuQyxJQUFJLENBQUNvWixLQUFLLENBQUNpUCxhQUFhLEdBQUdyb0IsWUFBWUEsU0FBU3lKLE9BQU8sR0FDakR6SixTQUFTeXBCLFlBQVksSUFBSXpwQixTQUFTbUUsU0FBUyxHQUMzQztZQUVOLElBQUksQ0FBQ2tYLEtBQUssQ0FBQ0MsUUFBUSxDQUFDLElBQUksQ0FBQzBOLFdBQVc7UUFDeEM7UUFFQTs7Ozs7O01BTUUsR0FDRixJQUFJLENBQUM5WSxVQUFVLEdBQUcsU0FBUzNCLFFBQVEsRUFBRUMsT0FBTztZQUN4QyxJQUFJQSxZQUFZbkssV0FDWm1LLFVBQVVnTDtZQUVkLElBQUksQ0FBQyxJQUFJLENBQUNrUSxhQUFhLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQ0EsYUFBYSxHQUFHO29CQUNqQm5iLFVBQVVBO29CQUNWQyxTQUFTQTtnQkFDYjtZQUNKLE9BQ0s7Z0JBQ0QsSUFBSSxJQUFJLENBQUNrYixhQUFhLENBQUNuYixRQUFRLEdBQUdBLFVBQzlCLElBQUksQ0FBQ21iLGFBQWEsQ0FBQ25iLFFBQVEsR0FBR0E7Z0JBRWxDLElBQUksSUFBSSxDQUFDbWIsYUFBYSxDQUFDbGIsT0FBTyxHQUFHQSxTQUM3QixJQUFJLENBQUNrYixhQUFhLENBQUNsYixPQUFPLEdBQUdBO1lBQ3JDO1lBRUEsSUFBSSxJQUFJLENBQUNrYixhQUFhLENBQUNuYixRQUFRLEdBQUcsSUFBSSxDQUFDM04sV0FBVyxDQUFDNE4sT0FBTyxJQUN0RCxJQUFJLENBQUNrYixhQUFhLENBQUNsYixPQUFPLEdBQUcsSUFBSSxDQUFDNU4sV0FBVyxDQUFDMk4sUUFBUSxFQUN0RDtZQUNKLElBQUksQ0FBQzhNLEtBQUssQ0FBQ0MsUUFBUSxDQUFDLElBQUksQ0FBQzhOLFVBQVU7UUFDdkM7UUFFQSxJQUFJLENBQUM1RixXQUFXLEdBQUc7WUFDZixJQUFJLENBQUNuSSxLQUFLLENBQUNDLFFBQVEsQ0FBQyxJQUFJLENBQUNpTyxZQUFZO1FBQ3pDO1FBRUE7O01BRUUsR0FDRixJQUFJLENBQUNJLFdBQVcsR0FBRztZQUNmLElBQUksQ0FBQ3RPLEtBQUssQ0FBQ0MsUUFBUSxDQUFDLElBQUksQ0FBQytOLFlBQVk7UUFDekM7UUFFQTs7Ozs7TUFLRSxHQUNGLElBQUksQ0FBQ3JOLFVBQVUsR0FBRyxTQUFTK0csS0FBSztZQUM1QixJQUFJQSxPQUNBLElBQUksQ0FBQzhGLGNBQWMsQ0FBQyxJQUFJLENBQUNHLFdBQVcsRUFBRTtpQkFFdEMsSUFBSSxDQUFDM04sS0FBSyxDQUFDQyxRQUFRLENBQUMsSUFBSSxDQUFDME4sV0FBVztRQUM1QztRQUVBLElBQUksQ0FBQ1ksd0JBQXdCLEdBQUc7WUFDNUIsSUFBSSxDQUFDdk8sS0FBSyxDQUFDQyxRQUFRLENBQUMsSUFBSSxDQUFDNk4sYUFBYTtRQUMxQztRQUVBLElBQUksQ0FBQ1Usc0JBQXNCLEdBQUc7WUFDMUIsSUFBSSxDQUFDeE8sS0FBSyxDQUFDQyxRQUFRLENBQUMsSUFBSSxDQUFDOE4sVUFBVTtRQUN2QztRQUdBLElBQUksQ0FBQ1UsUUFBUSxHQUFHO1FBQ2hCOzs7Ozs7O0tBT0MsR0FDRCxJQUFJLENBQUM5RyxRQUFRLEdBQUcsU0FBU0QsS0FBSyxFQUFFOVIsS0FBSyxFQUFFeEcsTUFBTTtZQUN6QyxJQUFJLElBQUksQ0FBQ3NmLFFBQVEsR0FBRyxHQUNoQjtpQkFDQyxJQUFJLElBQUksQ0FBQ0EsUUFBUSxHQUFHLEdBQ3JCLElBQUksQ0FBQ0EsUUFBUTtpQkFFYixJQUFJLENBQUNBLFFBQVEsR0FBR2hILFFBQVEsSUFBSTtZQUNoQyxnRUFBZ0U7WUFDaEUsa0VBQWtFO1lBQ2xFLElBQUloVCxLQUFLLElBQUksQ0FBQ3NFLFNBQVM7WUFDdkIsSUFBSSxDQUFDNUosUUFDREEsU0FBU3NGLEdBQUc1QixZQUFZLElBQUk0QixHQUFHaWEsWUFBWTtZQUMvQyxJQUFJLENBQUMvWSxPQUNEQSxRQUFRbEIsR0FBR2thLFdBQVcsSUFBSWxhLEdBQUdtYSxXQUFXO1lBQzVDLElBQUlDLFVBQVUsSUFBSSxDQUFDQyxpQkFBaUIsQ0FBQ3JILE9BQU85UixPQUFPeEc7WUFFbkQsSUFBSSxDQUFDLElBQUksQ0FBQzJPLEtBQUssQ0FBQ0MsY0FBYyxJQUFLLENBQUNwSSxTQUFTLENBQUN4RyxRQUMxQyxPQUFPLElBQUksQ0FBQ3NmLFFBQVEsR0FBRztZQUUzQixJQUFJaEgsT0FDQSxJQUFJLENBQUM4RixjQUFjLENBQUNzQixTQUFTO2lCQUU3QixJQUFJLENBQUM5TyxLQUFLLENBQUNDLFFBQVEsQ0FBQzZPLFVBQVUsSUFBSSxDQUFDTCxRQUFRO1lBRS9DLElBQUksSUFBSSxDQUFDQyxRQUFRLEVBQ2IsSUFBSSxDQUFDQSxRQUFRLEdBQUc7UUFDeEI7UUFFQSxJQUFJLENBQUNkLFlBQVksR0FBRztZQUNoQixJQUFJLENBQUNqRyxRQUFRO1FBQ2pCO1FBRUEsSUFBSSxDQUFDb0gsaUJBQWlCLEdBQUcsU0FBU3JILEtBQUssRUFBRTlSLEtBQUssRUFBRXhHLE1BQU07WUFDbEQsSUFBSTBmLFVBQVU7WUFDZCxJQUFJN2YsT0FBTyxJQUFJLENBQUM4TyxLQUFLO1lBQ3JCLElBQUlwWixXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJQSxVQUFVO2dCQUNWLElBQUlxb0IsZ0JBQWdCcm9CLFNBQVN5SixPQUFPLEdBQzlCekosU0FBU3lwQixZQUFZLElBQUl6cEIsU0FBU21FLFNBQVMsR0FDM0M7Z0JBQ04sSUFBSWtrQixpQkFBaUIvZCxLQUFLK2QsYUFBYSxFQUFFO29CQUNyQy9kLEtBQUsrZCxhQUFhLEdBQUdBO29CQUNyQjhCLFdBQVcsSUFBSSxDQUFDYixXQUFXO2dCQUMvQjtZQUNKO1lBRUEsSUFBSTdlLFVBQVdzWSxDQUFBQSxTQUFTelksS0FBS0csTUFBTSxJQUFJQSxNQUFLLEdBQUk7Z0JBQzVDSCxLQUFLRyxNQUFNLEdBQUdBO2dCQUNkMGYsV0FBVyxJQUFJLENBQUNiLFdBQVc7Z0JBRTNCaGYsS0FBSytPLGNBQWMsR0FBRy9PLEtBQUtHLE1BQU07Z0JBQ2pDLElBQUksSUFBSSxDQUFDc2QsWUFBWSxFQUNqQnpkLEtBQUsrTyxjQUFjLElBQUksSUFBSSxDQUFDK0QsVUFBVSxDQUFDaU4sU0FBUztnQkFFcEQscUJBQXFCO2dCQUNqQi9mLEtBQUsrTyxjQUFjLElBQUkvTyxLQUFLK2QsYUFBYTtnQkFDN0MsSUFBSTtnQkFFSixJQUFJLENBQUNuVSxhQUFhLENBQUM1RyxPQUFPLENBQUN1RCxLQUFLLENBQUNwRyxNQUFNLEdBQ3ZDLElBQUksQ0FBQzBQLFFBQVEsQ0FBQ3RKLEtBQUssQ0FBQy9HLEdBQUcsR0FDdkIsSUFBSSxDQUFDb1QsVUFBVSxDQUFDNVAsT0FBTyxDQUFDdUQsS0FBSyxDQUFDL0csR0FBRyxHQUFHUSxLQUFLK2QsYUFBYSxHQUFHO2dCQUN6RCxrREFBa0Q7Z0JBQ2xELElBQUksQ0FBQ25MLFVBQVUsQ0FBQzVQLE9BQU8sQ0FBQ3VELEtBQUssQ0FBQzlHLE1BQU0sR0FBRyxJQUFJLENBQUNxVCxVQUFVLENBQUNpTixTQUFTLEtBQUs7Z0JBRXJFLElBQUlycUIsWUFBWUEsU0FBU2lmLFlBQVksRUFBRTtvQkFDbkMsOENBQThDO29CQUM5Q2tMLFdBQVcsSUFBSSxDQUFDakIsYUFBYTtnQkFDakM7Z0JBRUEsSUFBSSxJQUFJLENBQUNwRCxlQUFlLEVBQ3hCO29CQUFBLElBQUksSUFBSSxDQUFDQSxlQUFlLENBQUMxRCxLQUFLLElBQUksSUFBSSxDQUFDQSxLQUFLLEVBQUU7d0JBQzFDLElBQUksQ0FBQzVMLG1CQUFtQixDQUFDLElBQUksQ0FBQ3NQLGVBQWUsQ0FBQ3dFLEtBQUssRUFBRSxJQUFJLENBQUN4RSxlQUFlLENBQUNuYixNQUFNO3dCQUNoRixJQUFJLENBQUNtYixlQUFlLEdBQUc7b0JBQzNCO2dCQUFBO1lBQ0o7WUFFQSxJQUFJN1UsU0FBVThSLENBQUFBLFNBQVN6WSxLQUFLMkcsS0FBSyxJQUFJQSxLQUFJLEdBQUk7Z0JBQ3pDa1osV0FBVyxJQUFJLENBQUNiLFdBQVc7Z0JBQzNCaGYsS0FBSzJHLEtBQUssR0FBR0E7Z0JBRWIsSUFBSSxDQUFDbU0sVUFBVSxDQUFDOVAsT0FBTyxDQUFDdUQsS0FBSyxDQUFDNEIsSUFBSSxHQUNsQyxJQUFJLENBQUMwSCxRQUFRLENBQUN0SixLQUFLLENBQUM0QixJQUFJLEdBQUcsSUFBSTtnQkFDL0JuSSxLQUFLdVIsYUFBYSxHQUFHN1IsS0FBS2UsR0FBRyxDQUFDLEdBQUdrRyxRQUFTLElBQUksQ0FBQ2lNLFVBQVUsQ0FBQ3FOLFFBQVE7Z0JBRWxFLElBQUksQ0FBQ3JXLGFBQWEsQ0FBQzVHLE9BQU8sQ0FBQ3VELEtBQUssQ0FBQzZCLEtBQUssR0FDdEMsSUFBSSxDQUFDMEssVUFBVSxDQUFDOVAsT0FBTyxDQUFDdUQsS0FBSyxDQUFDNkIsS0FBSyxHQUNuQyxJQUFJLENBQUN5SCxRQUFRLENBQUN0SixLQUFLLENBQUM2QixLQUFLLEdBQUcsSUFBSSxDQUFDd0ssVUFBVSxDQUFDcU4sUUFBUSxLQUFLO2dCQUN6RCxJQUFJLENBQUNwUSxRQUFRLENBQUN0SixLQUFLLENBQUM5RyxNQUFNLEdBQUcsSUFBSSxDQUFDcVQsVUFBVSxDQUFDaU4sU0FBUyxLQUFLO2dCQUUzRCw4REFBOEQ7Z0JBRTlELElBQUksQ0FBQ25XLGFBQWEsQ0FBQzdDLFdBQVcsQ0FBQy9HLEtBQUt1UixhQUFhO2dCQUVqRCxJQUFJN2IsWUFBWUEsU0FBU3lKLE9BQU8sRUFDNUIwZ0IsV0FBVyxJQUFJLENBQUNuQixXQUFXO1lBQ25DO1lBRUEsSUFBSW1CLFNBQ0EsSUFBSSxDQUFDbGxCLE9BQU8sQ0FBQztZQUVqQixPQUFPa2xCO1FBQ1g7UUFFQSxJQUFJLENBQUMxRCxvQkFBb0IsR0FBRyxTQUFTaGtCLEtBQUs7WUFDdEMsSUFBSSxDQUFDK25CLFVBQVUsQ0FBQzlaLE9BQU8sR0FBR2pPO1lBQzFCLElBQUksSUFBSSxDQUFDN0IsV0FBVyxDQUFDNnBCLE1BQU0sSUFBSSxJQUFJLENBQUM3cEIsV0FBVyxDQUFDOHBCLE1BQU0sRUFBRTtnQkFDcEQsSUFBSSxDQUFDN0IsY0FBYyxDQUFDLElBQUksQ0FBQ0csV0FBVyxFQUFFO2dCQUN0QyxJQUFJLENBQUNoRyxRQUFRLENBQUM7WUFDbEI7UUFDSjtRQUVBOzs7O01BSUUsR0FDRixJQUFJLENBQUMySCxtQkFBbUIsR0FBRztZQUN2QixPQUFPLElBQUksQ0FBQ3RXLFNBQVM7UUFDekI7UUFFQTs7OztNQUlFLEdBQ0YsSUFBSSxDQUFDMEksbUJBQW1CLEdBQUc7WUFDdkIsT0FBTyxJQUFJLENBQUM1QyxRQUFRO1FBQ3hCO1FBQ0E7Ozs7O01BS0UsR0FDRixJQUFJLENBQUNvSyxlQUFlLEdBQUcsU0FBU0MsU0FBUztZQUNyQyxJQUFJL08sUUFBUSxJQUFJLENBQUM3VSxXQUFXLENBQUM2cEIsTUFBTTtZQUNuQyxJQUFJcEcsUUFBUTtZQUNaLElBQUlDLE9BQU83TyxNQUFNelMsTUFBTSxHQUFHO1lBQzFCLE1BQU8sSUFBSSxDQUFDeWhCLGFBQWEsQ0FBQ2hQLEtBQUssQ0FBQzRPLE1BQU0sRUFBRUcsY0FBY0gsUUFBUUMsS0FDMUREO1lBQ0osTUFBTyxDQUFDLElBQUksQ0FBQ0ksYUFBYSxDQUFDaFAsS0FBSyxDQUFDNk8sS0FBSyxFQUFFRSxjQUFjRixPQUFPRCxNQUN6REM7WUFDSixPQUFPN08sTUFBTXJTLEtBQUssQ0FBQ2loQixPQUFPQyxPQUFPO1FBQ3JDO1FBQ0E7Ozs7O01BS0UsR0FDRixJQUFJLENBQUNHLGFBQWEsR0FBRyxTQUFTdGYsSUFBSSxFQUFFcWYsU0FBUztZQUMxQyxJQUFJNWpCLGNBQWMsSUFBSSxDQUFDQSxXQUFXO1lBQ2xDLElBQUksQ0FBQ0EsWUFBWTZwQixNQUFNLEVBQUU7WUFDekIsSUFBSXpxQixXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJbUcsSUFBSXZGLFlBQVk2cEIsTUFBTSxDQUFDcmtCLE9BQU8sQ0FBQ2pCO1lBRW5DLElBQUlnQixLQUFLLENBQUMsR0FBRyxPQUFPO1lBQ3BCLElBQUl5a0IsVUFBVTVxQixTQUFTd0ssZUFBZSxDQUFDckY7WUFFdkMsSUFBSTJFLE1BQU04Z0IsUUFBUTlnQixHQUFHO1lBQ3JCLElBQUlXLFNBQVNtZ0IsUUFBUW5nQixNQUFNO1lBQzNCLElBQUkrWixjQUFjbmdCLFdBQ2RtZ0IsWUFBWSxJQUFJO1lBQ3BCLElBQUksSUFBSSxDQUFDdEYsU0FBUyxHQUFHcFYsTUFBTTBhLFlBQVkvWixRQUNuQyxPQUFPO1lBQ1gsSUFBSSxJQUFJLENBQUN5VSxTQUFTLEdBQUcsSUFBSSxDQUFDOUYsS0FBSyxDQUFDQyxjQUFjLElBQUl2UCxNQUFPLENBQUMsSUFBSTBhLFNBQVEsSUFBSy9aLFFBQ3ZFLE9BQU87WUFDWCxPQUFPO1FBQ1Y7UUFFQSxJQUFJLENBQUNvZ0IsZ0JBQWdCLEdBQUc7WUFDcEIscUNBQXFDO1lBQ3JDLElBQUksQ0FBQ0MsaUJBQWlCO1lBQ3RCLElBQUksQ0FBQ0MsaUJBQWlCO1FBQzFCO1FBRUEsSUFBSSxDQUFDQyxlQUFlLEdBQUcsU0FBU2xoQixHQUFHLEVBQUVDLE1BQU0sRUFBRTBJLElBQUksRUFBRUMsS0FBSztZQUNwRCxJQUFJdVksS0FBSyxJQUFJLENBQUM5QyxZQUFZO1lBQzFCOEMsR0FBR25oQixHQUFHLEdBQUdBLE1BQUk7WUFDYm1oQixHQUFHbGhCLE1BQU0sR0FBR0EsU0FBTztZQUNuQmtoQixHQUFHdlksS0FBSyxHQUFHQSxRQUFNO1lBQ2pCdVksR0FBR3hZLElBQUksR0FBR0EsT0FBSztZQUNmd1ksR0FBR3RDLENBQUMsR0FBR3NDLEdBQUduaEIsR0FBRyxHQUFHbWhCLEdBQUdsaEIsTUFBTTtZQUN6QmtoQixHQUFHckMsQ0FBQyxHQUFHcUMsR0FBR3hZLElBQUksR0FBR3dZLEdBQUd2WSxLQUFLO1lBQ3pCLElBQUl1WSxHQUFHbmhCLEdBQUcsSUFBSSxJQUFJLENBQUNvVixTQUFTLElBQUksS0FBSyxJQUFJLENBQUNsZixRQUFRLEVBQzlDLElBQUksQ0FBQ0EsUUFBUSxDQUFDaWYsWUFBWSxDQUFDLENBQUNnTSxHQUFHbmhCLEdBQUc7WUFDdEMsSUFBSSxDQUFDa1MsVUFBVTtRQUNuQjtRQUNBLElBQUksQ0FBQytPLGlCQUFpQixHQUFHO1lBQ3JCLElBQUksQ0FBQzdOLFVBQVUsQ0FBQ2dPLGNBQWMsQ0FBQyxJQUFJLENBQUN0cUIsV0FBVyxDQUFDOG5CLFNBQVMsR0FBRyxJQUFJLENBQUNQLFlBQVksQ0FBQ1EsQ0FBQztZQUMvRSxJQUFJLENBQUN6TCxVQUFVLENBQUMrQixZQUFZLENBQUMsSUFBSSxDQUFDQyxTQUFTLEdBQUcsSUFBSSxDQUFDaUosWUFBWSxDQUFDcmUsR0FBRztRQUN2RTtRQUNBLElBQUksQ0FBQ2doQixpQkFBaUIsR0FBRztZQUNyQixJQUFJLENBQUMxTixVQUFVLENBQUMrTixhQUFhLENBQUMsSUFBSSxDQUFDdnFCLFdBQVcsQ0FBQ3dxQixRQUFRLEdBQUcsSUFBSSxDQUFDakQsWUFBWSxDQUFDUyxDQUFDO1lBQzdFLElBQUksQ0FBQ3hMLFVBQVUsQ0FBQ21DLGFBQWEsQ0FBQyxJQUFJLENBQUNDLFVBQVUsR0FBRyxJQUFJLENBQUMySSxZQUFZLENBQUMxVixJQUFJO1FBQzFFO1FBRUEsSUFBSSxDQUFDNFksT0FBTyxHQUFHO1FBQ2YsSUFBSSxDQUFDQyxNQUFNLEdBQUc7WUFDVixJQUFJLENBQUNELE9BQU8sR0FBRztRQUNuQjtRQUVBLElBQUksQ0FBQ0UsUUFBUSxHQUFHO1lBQ1osSUFBSSxDQUFDRixPQUFPLEdBQUc7UUFDbkI7UUFFQSxJQUFJLENBQUN4QyxjQUFjLEdBQUcsU0FBU3NCLE9BQU8sRUFBRXBILEtBQUs7WUFDekMsSUFBSSxJQUFJLENBQUMrRyxRQUFRLEVBQUU7Z0JBQ2ZLLFdBQVcsSUFBSSxDQUFDTCxRQUFRO2dCQUN4QixJQUFJLENBQUNBLFFBQVEsR0FBRztZQUNwQjtZQUNBLElBQUksQ0FBRSxJQUFJLENBQUM5cEIsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDcVUsU0FBUyxDQUFDdkMsV0FBVyxJQUFJLElBQUksQ0FBQ3VaLE9BQU8sSUFBTSxDQUFDbEIsV0FBVyxDQUFDcEgsT0FBUTtnQkFDekYsSUFBSSxDQUFDK0csUUFBUSxJQUFJSztnQkFDakI7WUFDSjtZQUNBLElBQUksQ0FBQyxJQUFJLENBQUMvUSxLQUFLLENBQUNuSSxLQUFLLEVBQUU7Z0JBQ25CLElBQUksQ0FBQzZZLFFBQVEsSUFBSUs7Z0JBQ2pCLE9BQU8sSUFBSSxDQUFDbkgsUUFBUSxDQUFDO1lBQ3pCO1lBRUEsNkJBQTZCO1lBRTdCLElBQUksQ0FBQy9kLE9BQU8sQ0FBQztZQUNiLElBQUl3SSxTQUFTLElBQUksQ0FBQzdNLFdBQVc7WUFDN0IsNEVBQTRFO1lBQzVFLElBQUl1cEIsVUFBVSxJQUFJLENBQUNuQixXQUFXLElBQzFCbUIsVUFBVSxJQUFJLENBQUNiLFdBQVcsSUFDMUJhLFVBQVUsSUFBSSxDQUFDakIsYUFBYSxJQUM1QmlCLFVBQVUsSUFBSSxDQUFDWCxlQUFlLElBQzlCVyxVQUFVLElBQUksQ0FBQ2hCLGFBQWEsSUFDNUJnQixVQUFVLElBQUksQ0FBQ2YsVUFBVSxJQUN6QmUsVUFBVSxJQUFJLENBQUNkLFlBQVksRUFDN0I7Z0JBQ0VjLFdBQVUsSUFBSSxDQUFDcUIsbUJBQW1CO2dCQUVsQy9kLFNBQVMsSUFBSSxDQUFDN00sV0FBVztnQkFDekIsOEVBQThFO2dCQUM5RSxJQUFJLENBQUNpcUIsZ0JBQWdCO2dCQUNyQixJQUFJLENBQUNqRCxLQUFLLENBQUMvVyxLQUFLLENBQUM0YSxTQUFTLEdBQUksQ0FBQ2hlLE9BQU9pZSxPQUFPLEdBQUc7Z0JBQ2hELElBQUksQ0FBQzlELEtBQUssQ0FBQy9XLEtBQUssQ0FBQzhhLFVBQVUsR0FBRyxDQUFDbGUsT0FBT21lLE9BQU8sR0FBRztnQkFDaEQsSUFBSSxDQUFDaEUsS0FBSyxDQUFDL1csS0FBSyxDQUFDSSxLQUFLLEdBQUd4RCxPQUFPd0QsS0FBSyxHQUFHO2dCQUN4QyxJQUFJLENBQUMyVyxLQUFLLENBQUMvVyxLQUFLLENBQUNwRyxNQUFNLEdBQUdnRCxPQUFPaEQsTUFBTSxHQUFHZ0QsT0FBT3RKLFNBQVMsR0FBRztZQUNqRTtZQUNBLE9BQU87WUFDUCxJQUFJZ21CLFVBQVUsSUFBSSxDQUFDbkIsV0FBVyxFQUFFO2dCQUM1QixJQUFJLENBQUM5VSxhQUFhLENBQUN2RyxNQUFNLENBQUMsSUFBSSxDQUFDL00sV0FBVztnQkFDMUMsSUFBSSxDQUFDNFosVUFBVSxDQUFDN00sTUFBTSxDQUFDLElBQUksQ0FBQy9NLFdBQVc7Z0JBQ3ZDLElBQUksQ0FBQ2luQixZQUFZLENBQUNsYSxNQUFNLENBQUMsSUFBSSxDQUFDL00sV0FBVztnQkFDekMsSUFBSSxDQUFDcUUsT0FBTyxDQUFDO2dCQUNiO1lBQ0o7WUFFQSxZQUFZO1lBQ1osSUFBSWtsQixVQUFVLElBQUksQ0FBQ2pCLGFBQWEsRUFBRTtnQkFDOUIsSUFBSWlCLFVBQVUsSUFBSSxDQUFDZixVQUFVLElBQ3pCZSxVQUFVLElBQUksQ0FBQ2hCLGFBQWEsSUFDNUJnQixVQUFVLElBQUksQ0FBQ2QsWUFBWSxFQUM3QjtvQkFDRSxJQUFJLENBQUNuVixhQUFhLENBQUN2RyxNQUFNLENBQUMsSUFBSSxDQUFDL00sV0FBVztvQkFDMUMsSUFBSSxDQUFDNFosVUFBVSxDQUFDN00sTUFBTSxDQUFDLElBQUksQ0FBQy9NLFdBQVc7Z0JBQzNDLE9BQ0s7b0JBQ0QsSUFBSSxDQUFDc1QsYUFBYSxDQUFDdkcsTUFBTSxDQUFDLElBQUksQ0FBQy9NLFdBQVc7b0JBQzFDLElBQUksQ0FBQzRaLFVBQVUsQ0FBQ3hLLE1BQU0sQ0FBQyxJQUFJLENBQUNwUCxXQUFXO2dCQUMzQztnQkFFQSxJQUFJLENBQUNpbkIsWUFBWSxDQUFDbGEsTUFBTSxDQUFDLElBQUksQ0FBQy9NLFdBQVc7Z0JBQ3pDLElBQUksQ0FBQ2lxQixnQkFBZ0I7Z0JBQ3JCLElBQUksQ0FBQzVsQixPQUFPLENBQUM7Z0JBQ2I7WUFDSjtZQUVBLElBQUlrbEIsVUFBVSxJQUFJLENBQUNaLFlBQVksRUFDM0IsSUFBSSxDQUFDL08sVUFBVSxDQUFDM0ssYUFBYSxDQUFDLElBQUksQ0FBQ2pQLFdBQVc7WUFFbEQsSUFBSXVwQixVQUFVLElBQUksQ0FBQzVPLGFBQWEsSUFBSTRPLFVBQVUsSUFBSSxDQUFDZCxZQUFZLEVBQzNELElBQUksQ0FBQ3hCLFlBQVksQ0FBQ2xhLE1BQU0sQ0FBQyxJQUFJLENBQUMvTSxXQUFXO1lBRTdDLGlDQUFpQztZQUNqQyxnREFBZ0Q7WUFDaEQsMEJBQTBCO1lBQzFCLDZCQUE2QjtZQUM3QixJQUFJdXBCLFVBQVUsSUFBSSxDQUFDaEIsYUFBYSxFQUM1QixJQUFJLENBQUMwQyxnQkFBZ0IsQ0FBQ2xlLE1BQU0sQ0FBQyxJQUFJLENBQUMvTSxXQUFXO1lBQ2pELElBQUl1cEIsVUFBVSxJQUFJLENBQUNkLFlBQVksRUFDM0IsSUFBSSxDQUFDN08sVUFBVSxDQUFDN00sTUFBTSxDQUFDLElBQUksQ0FBQy9NLFdBQVc7WUFFM0MsSUFBSXVwQixVQUFVLElBQUksQ0FBQ2IsV0FBVyxFQUMxQixJQUFJLENBQUN1QixnQkFBZ0I7WUFFekIsSUFBSSxDQUFDNWxCLE9BQU8sQ0FBQztZQUViLElBQUksSUFBSSxDQUFDNmdCLGVBQWUsRUFDcEIsSUFBSSxDQUFDQSxlQUFlLEdBQUc7UUFDL0I7UUFHQSxJQUFJLENBQUNnRyxTQUFTLEdBQUc7WUFDYixJQUFJekQsZ0JBQWdCLElBQUksQ0FBQ2pQLEtBQUssQ0FBQ2lQLGFBQWE7WUFDNUMsSUFBSTVkLFNBQVMsSUFBSSxDQUFDekssUUFBUSxDQUFDdUssY0FBYyxLQUFLOGQ7WUFDOUMsSUFBSUssWUFBWSxJQUFJLENBQUNxRCxZQUFZLEdBQzNCLElBQUksQ0FBQ0EsWUFBWSxLQUNqQixJQUFJLENBQUNDLFNBQVMsR0FBRyxJQUFJLENBQUNoc0IsUUFBUSxDQUFDbUUsU0FBUyxHQUFHa2tCO1lBQ2pELElBQUk0RCxnQkFBZ0JqaUIsS0FBS2UsR0FBRyxDQUN4QixDQUFDLElBQUksQ0FBQ21oQixTQUFTLElBQUksS0FBSyxJQUFJLENBQUNsc0IsUUFBUSxDQUFDbUUsU0FBUyxHQUFHa2tCLGVBQ2xEcmUsS0FBS2MsR0FBRyxDQUFDNGQsV0FBV2plLFdBQ3BCLElBQUksQ0FBQzBkLFlBQVksQ0FBQ1EsQ0FBQztZQUN2QixJQUFJd0QsVUFBVTFoQixTQUFTaWU7WUFFdkIsSUFBSXVELGlCQUFpQixJQUFJLENBQUNBLGFBQWEsSUFDbkMsSUFBSSxDQUFDN1MsS0FBSyxDQUFDM08sTUFBTSxJQUFJLElBQUksQ0FBQ3doQixhQUFhLElBQUlFLFdBQVcsSUFBSSxDQUFDQyxRQUFRLEVBQUU7Z0JBQ3JFLElBQUlELFdBQVcsSUFBSSxDQUFDQyxRQUFRLEVBQUU7b0JBQzFCLElBQUksQ0FBQ0EsUUFBUSxHQUFHRDtvQkFDaEIsSUFBSSxDQUFDalAsVUFBVSxDQUFDOEssVUFBVSxDQUFDbUU7Z0JBQy9CO2dCQUVBLElBQUluYixJQUFJLElBQUksQ0FBQ3FELFNBQVMsQ0FBQzRWLFdBQVc7Z0JBQ2xDLElBQUksQ0FBQzVWLFNBQVMsQ0FBQ3hELEtBQUssQ0FBQ3BHLE1BQU0sR0FBR3doQixnQkFBZ0I7Z0JBQzlDLElBQUksQ0FBQzdCLGlCQUFpQixDQUFDLE1BQU1wWixHQUFHaWI7Z0JBQ2hDLDBCQUEwQjtnQkFDMUIsSUFBSSxDQUFDQSxhQUFhLEdBQUdBO2dCQUNyQixJQUFJLENBQUNobkIsT0FBTyxDQUFDO1lBQ2pCO1FBQ0o7UUFFQSxJQUFJLENBQUN1bUIsbUJBQW1CLEdBQUc7WUFDdkIsSUFBSSxJQUFJLENBQUNRLFNBQVMsRUFDZCxJQUFJLENBQUNGLFNBQVM7WUFFbEIsSUFBSTlyQixXQUFhLElBQUksQ0FBQ0EsUUFBUTtZQUM5QixJQUFJcXNCLFdBQWEsSUFBSSxDQUFDN0IsVUFBVTtZQUNoQyxJQUFJOEIsYUFBYSxJQUFJLENBQUNULGdCQUFnQjtZQUV0QyxJQUFJcEQsWUFBWSxJQUFJLENBQUNyUCxLQUFLLENBQUNDLGNBQWM7WUFDekMsSUFBSXFQLFlBQVkxb0IsU0FBU3VLLGNBQWM7WUFFdkMsSUFBSW9HLFdBQVksSUFBSSxDQUFDeUksS0FBSyxDQUFDeUMsYUFBYTtZQUN4QyxJQUFJdVAsV0FBWSxFQUFFLGtCQUFrQjs7WUFFcEMsSUFBSW1CLGlCQUFpQixJQUFJLENBQUNuVCxLQUFLLENBQUMzTyxNQUFNLElBQUksSUFBSTtZQUM5QyxJQUFJK2hCLGNBQWMsQ0FBQ0Qsa0JBQW1CLEtBQUksQ0FBQ0Usd0JBQXdCLElBQy9ELElBQUksQ0FBQ3JULEtBQUssQ0FBQ3lDLGFBQWEsR0FBR3VQLFdBQVc7WUFFMUMsSUFBSXNCLGlCQUFpQixJQUFJLENBQUMzRSxZQUFZLEtBQUt5RTtZQUMzQyxJQUFJRSxnQkFBZ0I7Z0JBQ2hCLElBQUksQ0FBQzNFLFlBQVksR0FBR3lFO2dCQUNwQixJQUFJLENBQUNwUCxVQUFVLENBQUM0SyxVQUFVLENBQUN3RTtZQUMvQjtZQUVBLElBQUlMLFVBQVUsQ0FBQ0ksa0JBQW1CLEtBQUksQ0FBQ0ksd0JBQXdCLElBQzNELElBQUksQ0FBQ3ZULEtBQUssQ0FBQ0MsY0FBYyxHQUFHcVAsWUFBWTtZQUM1QyxJQUFJa0UsaUJBQWlCLElBQUksQ0FBQ1IsUUFBUSxLQUFLRDtZQUN2QyxJQUFJUyxnQkFBZ0I7Z0JBQ2hCLElBQUksQ0FBQ1IsUUFBUSxHQUFHRDtnQkFDaEIsSUFBSSxDQUFDalAsVUFBVSxDQUFDOEssVUFBVSxDQUFDbUU7WUFDL0I7WUFFQSxJQUFJLENBQUNuc0IsUUFBUSxDQUFDaWYsWUFBWSxDQUFDalYsS0FBS2UsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDb2QsWUFBWSxDQUFDcmUsR0FBRyxFQUN0REUsS0FBS2MsR0FBRyxDQUFDLElBQUksQ0FBQ29VLFNBQVMsRUFBRXdKLFlBQVksSUFBSSxDQUFDdFAsS0FBSyxDQUFDQyxjQUFjLEdBQUcsSUFBSSxDQUFDOE8sWUFBWSxDQUFDcGUsTUFBTTtZQUU3RixJQUFJLENBQUMvSixRQUFRLENBQUN1ZixhQUFhLENBQUN2VixLQUFLZSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUNvZCxZQUFZLENBQUMxVixJQUFJLEVBQUV6SSxLQUFLYyxHQUFHLENBQUMsSUFBSSxDQUFDMFUsVUFBVSxFQUNsRjRMLFdBQVcsSUFBSSxDQUFDaFMsS0FBSyxDQUFDeUMsYUFBYSxHQUFHLElBQUksQ0FBQ3NNLFlBQVksQ0FBQ3pWLEtBQUs7WUFHakUsSUFBSSxJQUFJLENBQUMxUyxRQUFRLENBQUNnZixZQUFZLE1BQU0sSUFBSSxDQUFDRSxTQUFTLEVBQzlDLElBQUksQ0FBQ0EsU0FBUyxHQUFHLElBQUksQ0FBQ2xmLFFBQVEsQ0FBQ2dmLFlBQVk7WUFFL0MsSUFBSWxWLE1BQU1FLEtBQUtlLEdBQUcsQ0FBQyxJQUFJLENBQUNtVSxTQUFTLEVBQUU7WUFDbkMsSUFBSXVMLFNBQVN6cUIsU0FBUzZKLFFBQVEsQ0FBQ0MsS0FBS0EsTUFBTSxJQUFJLENBQUNzUCxLQUFLLENBQUMzTyxNQUFNO1lBQzNELElBQUlpZ0IsU0FBUztnQkFBRXBnQixNQUFNO1lBQUUsR0FBRSw0RUFBNEU7WUFHckcsSUFBSW9oQixVQUFXLElBQUksQ0FBQ3hNLFNBQVMsR0FBR3VMLE9BQU9uZ0IsSUFBSTtZQUMzQyxJQUFJc2hCLFVBQVcsSUFBSSxDQUFDcE0sVUFBVSxHQUFHa0wsT0FBT3BnQixJQUFJO1lBRTVDLElBQUl1aUIsV0FBV3BDLE9BQU96bkIsTUFBTTtZQUM1QixJQUFJdUwsV0FBV2tjLE9BQU9wZ0IsS0FBSztZQUMzQixJQUFJbUUsVUFBV0QsV0FBV3NlLFdBQVc7WUFFckMsSUFBSUMsV0FBV3BDLE9BQU8xbkIsTUFBTTtZQUM1QixJQUFJK3BCLFdBQVdyQyxPQUFPcmdCLEtBQUs7WUFDM0IsSUFBSTJpQixVQUFXRCxXQUFXRCxXQUFXO1lBRXJDLElBQUksSUFBSSxDQUFDbHNCLFdBQVcsRUFDaEIsSUFBSSxDQUFDQSxXQUFXLENBQUNxc0IsT0FBTyxHQUFHO1lBRS9CLElBQUk5QyxVQUFVO1lBQ2Qsa0VBQWtFO1lBQ2xFLG9DQUFvQztZQUNwQyxJQUFJdUMsa0JBQWtCRSxnQkFBZ0I7Z0JBQ2xDekMsVUFBVSxJQUFJLENBQUNDLGlCQUFpQixDQUFDLE1BQU0sSUFBSSxDQUFDaFIsS0FBSyxDQUFDbkksS0FBSyxFQUFFLElBQUksQ0FBQ21JLEtBQUssQ0FBQzNPLE1BQU07Z0JBQzFFLElBQUksQ0FBQ3hGLE9BQU8sQ0FBQztZQUNiLHFCQUFxQjtZQUNyQiwyQ0FBMkM7WUFDL0M7WUFFQSxJQUFJLENBQUNyRSxXQUFXLEdBQUc7Z0JBQ2Y2cEIsUUFBU0E7Z0JBQ1RDLFFBQVNBO2dCQUNUelosT0FBUU47Z0JBQ1JsRyxRQUFTZ2U7Z0JBQ1RsYSxVQUFXQTtnQkFDWEMsU0FBVUE7Z0JBQ1Z1ZSxVQUFXQTtnQkFDWEMsU0FBVUE7Z0JBQ1Z2RSxXQUFZQTtnQkFDWkMsV0FBWUE7Z0JBQ1ovWCxVQUFXQTtnQkFDWHlhLFVBQVdBO2dCQUNYTSxTQUFVQTtnQkFDVkUsU0FBVUE7Z0JBQ1Z6bkIsV0FBV25FLFNBQVNtRSxTQUFTO1lBQ2pDO1lBRUEsSUFBSXNKLFNBQVMsSUFBSSxDQUFDN00sV0FBVyxFQUFFRixXQUFXLElBQUk7WUFDOUMsSUFBSStwQixRQUFRO2dCQUNSaGQsT0FBTzlELElBQUksR0FBRzNKLFNBQVN3SixZQUFZLENBQy9CO29CQUFDSSxPQUFPNmdCLE9BQU9wZ0IsS0FBSztvQkFBRXJILFFBQVF5bkIsT0FBT3puQixNQUFNO2dCQUFBLEdBQzNDO29CQUFDNEcsT0FBTzhnQixPQUFPcmdCLEtBQUs7b0JBQUVySCxRQUFRMG5CLE9BQU8xbkIsTUFBTTtnQkFBQSxHQUMzQyxTQUFTK0MsR0FBRyxFQUFFNEQsSUFBSSxFQUFFZ0UsTUFBTTtvQkFDdEIsSUFBSTVILEtBQUssT0FBTyxPQUFPLE9BQU87b0JBQzlCMEgsT0FBTzlELElBQUksR0FBR0E7b0JBRWQsSUFBSWdFLFFBQ0FqTixTQUFTMmEsS0FBSyxDQUFDQyxRQUFRLENBQUM1YSxTQUFTMm9CLFlBQVk7Z0JBQ3JEO1lBQ1I7WUFFQSxpQkFBaUI7WUFDakIsaURBQWlEO1lBRWpELE9BQU9jO1FBQ1g7UUFFQSxJQUFJLENBQUMrQyxXQUFXLEdBQUc7WUFDZixJQUFJM2UsV0FBVyxJQUFJLENBQUNtYixhQUFhLENBQUNuYixRQUFRO1lBQzFDLElBQUlDLFVBQVUsSUFBSSxDQUFDa2IsYUFBYSxDQUFDbGIsT0FBTztZQUN4QyxJQUFJLENBQUNrYixhQUFhLEdBQUc7WUFFckIsSUFBSTlvQixjQUFjLElBQUksQ0FBQ0EsV0FBVztZQUVsQyxJQUFJMk4sV0FBVzNOLFlBQVk0TixPQUFPLEdBQUcsR0FBRztnQkFBRTtZQUFRO1lBQ2xELElBQUlBLFVBQVU1TixZQUFZMk4sUUFBUSxFQUFFO2dCQUFFO1lBQVE7WUFFOUMsa0RBQWtEO1lBQ2xELElBQUlDLFlBQVlnTCxVQUFVO2dCQUN0QixJQUFJLENBQUNnQixVQUFVLENBQUM3TSxNQUFNLENBQUMvTTtnQkFDdkI7WUFDSjtZQUVBLG9DQUFvQztZQUNwQyxJQUFJLENBQUM0WixVQUFVLENBQUN0SyxVQUFVLENBQUN0UCxhQUFhMk4sVUFBVUM7WUFDbEQsT0FBTztRQUNYO1FBRUEsSUFBSSxDQUFDMmUsdUJBQXVCLEdBQUcsU0FBU3BOLE1BQU0sRUFBRXFOLElBQUksRUFBRXppQixNQUFNO1lBQ3hELDJEQUEyRDtZQUMzRCxJQUFJLENBQUM2TCxtQkFBbUIsQ0FBQ3VKLFFBQVFwVjtZQUNqQyxJQUFJLENBQUM2TCxtQkFBbUIsQ0FBQzRXLE1BQU16aUI7UUFDbkM7UUFFQTs7O01BR0UsR0FDRixJQUFJLENBQUM2TCxtQkFBbUIsR0FBRyxTQUFTOFQsS0FBSyxFQUFFM2YsTUFBTTtZQUM3QyxJQUFJLENBQUNtYixlQUFlLEdBQUc7Z0JBQ25Cd0UsT0FBT0E7Z0JBQ1AzZixRQUFRQTtnQkFDUnVVLFdBQVcsSUFBSSxDQUFDQSxTQUFTO2dCQUN6QmtELE9BQU8sSUFBSSxDQUFDQSxLQUFLO2dCQUNqQjNYLFFBQVEsSUFBSSxDQUFDMk8sS0FBSyxDQUFDQyxjQUFjO1lBQ3JDO1lBRUEsNEJBQTRCO1lBQzVCLElBQUksSUFBSSxDQUFDRCxLQUFLLENBQUNDLGNBQWMsS0FBSyxHQUM5QjtZQUVKLElBQUlyWixXQUFXLElBQUksQ0FBQ0EsUUFBUTtZQUM1QixJQUFJbUYsT0FBT21sQixTQUFTdHFCLFNBQVNFLFNBQVMsQ0FBQ0MsU0FBUztZQUNoRCxJQUFJLENBQUNnRixNQUNEO1lBRUosSUFBSXlsQixVQUFVNXFCLFNBQVN3SyxlQUFlLENBQUNyRjtZQUV2QyxJQUFJMkUsTUFBTThnQixRQUFROWdCLEdBQUc7WUFDckIsSUFBSVcsU0FBU21nQixRQUFRbmdCLE1BQU07WUFDM0IsSUFBSWdJLE9BQU87WUFDWCxJQUFJeEIsUUFBUTtZQUVaLElBQUksSUFBSSxDQUFDaU8sU0FBUyxHQUFHcFYsS0FBSztnQkFDdEIsSUFBSWEsUUFDQWIsT0FBT2EsU0FBUyxJQUFJLENBQUN5TyxLQUFLLENBQUNDLGNBQWM7Z0JBQzdDLElBQUl2UCxRQUFRLEdBQ1JBLE1BQU0sQ0FBQyxJQUFJLENBQUNxZSxZQUFZLENBQUNyZSxHQUFHO2dCQUNoQyxJQUFJLENBQUM5SixRQUFRLENBQUNpZixZQUFZLENBQUNuVjtZQUMvQixPQUFPLElBQUksSUFBSSxDQUFDb1YsU0FBUyxHQUFHLElBQUksQ0FBQzlGLEtBQUssQ0FBQ0MsY0FBYyxHQUFHdlAsTUFBTVcsUUFBUTtnQkFDbEUsSUFBSUUsUUFDQWIsT0FBT2EsU0FBUyxJQUFJLENBQUN5TyxLQUFLLENBQUNDLGNBQWM7Z0JBQzdDLElBQUksQ0FBQ3JaLFFBQVEsQ0FBQ2lmLFlBQVksQ0FBQ25WLE1BQU1XLFNBQVMsSUFBSSxDQUFDMk8sS0FBSyxDQUFDQyxjQUFjO1lBQ3ZFO1lBRUEsSUFBSW1HLGFBQWEsSUFBSSxDQUFDQSxVQUFVO1lBRWhDLElBQUlBLGFBQWEvTSxNQUFNO2dCQUNuQixJQUFJQSxPQUFPLEdBQ1BBLE9BQU87Z0JBQ1gsSUFBSSxDQUFDelMsUUFBUSxDQUFDdWYsYUFBYSxDQUFDOU07WUFDaEMsT0FBTyxJQUFJK00sYUFBYSxJQUFJLENBQUNwRyxLQUFLLENBQUN5QyxhQUFhLEdBQUdwSixPQUFPeEIsT0FBTztnQkFDN0QsSUFBSSxDQUFDalIsUUFBUSxDQUFDdWYsYUFBYSxDQUFDdlYsS0FBS21WLEtBQUssQ0FBQzFNLE9BQU94QixRQUFRLElBQUksQ0FBQ21JLEtBQUssQ0FBQ3lDLGFBQWE7WUFDbEY7WUFFQSxJQUFJLENBQUNpSyxlQUFlLENBQUM1RyxTQUFTLEdBQUcsSUFBSSxDQUFDQSxTQUFTO1FBQ25EO1FBRUE7O01BRUUsR0FDRixJQUFJLENBQUNGLFlBQVksR0FBRztZQUNoQixPQUFPLElBQUksQ0FBQ0UsU0FBUztRQUN6QjtRQUVBOztNQUVFLEdBQ0YsSUFBSSxDQUFDSSxhQUFhLEdBQUc7WUFDakIsT0FBTyxJQUFJLENBQUNFLFVBQVU7UUFDMUI7UUFFQTs7OztNQUlFLEdBQ0YsSUFBSSxDQUFDUCxZQUFZLEdBQUcsU0FBU0MsU0FBUztZQUNsQ0EsWUFBWWxWLEtBQUttVixLQUFLLENBQUNEO1lBQ3ZCLElBQUksSUFBSSxDQUFDQSxTQUFTLEtBQUtBLGFBQWFFLE1BQU1GLFlBQ3RDO1lBRUosSUFBSSxDQUFDb0UsU0FBUyxDQUFDcEU7UUFDbkI7UUFFQTs7OztNQUlFLEdBQ0YsSUFBSSxDQUFDSyxhQUFhLEdBQUcsU0FBU0MsVUFBVTtZQUNwQ0EsYUFBYXhWLEtBQUttVixLQUFLLENBQUNLO1lBQ3hCLElBQUksSUFBSSxDQUFDQSxVQUFVLEtBQUtBLGNBQWNKLE1BQU1JLGFBQ3hDO1lBRUosSUFBSSxDQUFDK0QsU0FBUyxDQUFDL0Q7UUFDbkI7UUFFQTs7OztNQUlFLEdBQ0YsSUFBSSxDQUFDNk4sZUFBZSxHQUFHO1lBQ25CLE9BQU8sSUFBSSxDQUFDenNCLFdBQVcsQ0FBQzJOLFFBQVE7UUFDcEM7UUFFQTs7OztNQUlFLEdBQ0YsSUFBSSxDQUFDK2Usa0JBQWtCLEdBQUc7WUFDdEIsT0FBTyxJQUFJLENBQUMxc0IsV0FBVyxDQUFDNE4sT0FBTztRQUMvQixxR0FBcUc7UUFDekc7UUFFQSxJQUFJLENBQUN5VyxVQUFVLEdBQUcsU0FBU25KLE1BQU0sRUFBRXlSLFNBQVM7WUFDeEMsSUFBSSxPQUFPelIsVUFBVSxVQUNqQkEsU0FBUztnQkFBQzFOLEtBQUswTjtnQkFBUTlNLFFBQVE7WUFBQztZQUVwQyxJQUFJN0osT0FBTyxJQUFJLENBQUNuRixRQUFRLENBQUN3dEIsZUFBZSxDQUFDMVIsT0FBTzFOLEdBQUc7WUFDbkQsSUFBSTFGLE1BQU0sSUFBSSxDQUFDMUksUUFBUSxDQUFDeXRCLGVBQWUsQ0FBQzNSLE9BQU8xTixHQUFHO1lBQ2xELElBQUl3YSxJQUFJLElBQUksQ0FBQ3hQLEtBQUssQ0FBQ0MsY0FBYztZQUNqQyxJQUFJMU8sU0FBU2pDLE1BQU8sQ0FBQ2tnQixJQUFJempCLEtBQUttRixJQUFJLElBQUtpakIsQ0FBQUEsYUFBYTtZQUVwRCxJQUFJLENBQUN0TyxZQUFZLENBQUN0VTtZQUNsQixPQUFPQTtRQUNYO1FBRUEsSUFBSSxDQUFDK2lCLEtBQUssR0FBRztRQUNiLElBQUksQ0FBQ0MsVUFBVSxHQUFHLFNBQVNDLFNBQVMsRUFBRUMsT0FBTztZQUN6QyxJQUFJMW5CLElBQUk7WUFDUixJQUFJZ0csSUFBSSxJQUFJLENBQUN1aEIsS0FBSztZQUNsQixJQUFJSSxRQUFRLEVBQUU7WUFFZCxJQUFJQyxPQUFRLFNBQVNobkIsQ0FBQyxFQUFFaW5CLEtBQUssRUFBRWhXLEVBQUU7Z0JBQzdCLE9BQU9BLEtBQU1oTyxDQUFBQSxLQUFLaWtCLEdBQUcsQ0FBQ2xuQixJQUFJLEdBQUcsS0FBSyxLQUFLaW5CO1lBQzNDO1lBRUEsSUFBSzduQixJQUFJLEdBQUdBLElBQUlnRyxHQUFHLEVBQUVoRyxFQUNqQjJuQixNQUFNemUsSUFBSSxDQUFDMGUsS0FBSzVuQixJQUFJLElBQUksQ0FBQ3VuQixLQUFLLEVBQUVFLFdBQVdDLFVBQVVEO1lBRXpELE9BQU9FO1FBQ1g7UUFFQTs7Ozs7Ozs7TUFRRSxHQUNGLElBQUksQ0FBQ2hKLFdBQVcsR0FBRyxTQUFTMVcsR0FBRyxFQUFFMlcsTUFBTSxFQUFFQyxPQUFPLEVBQUV0YixRQUFRO1lBQ3RELElBQUl2RSxPQUFPLElBQUksQ0FBQ25GLFFBQVEsQ0FBQ3d0QixlQUFlLENBQUNwZjtZQUN6QyxJQUFJekQsU0FBUyxJQUFJLENBQUMzSyxRQUFRLENBQUN5dEIsZUFBZSxDQUFDcmY7WUFDM0MsSUFBSTJXLFFBQ0FwYSxVQUFVLENBQUMsSUFBSSxDQUFDeU8sS0FBSyxDQUFDQyxjQUFjLEdBQUdsVSxLQUFLbUYsSUFBSSxJQUFJO1lBRXhELElBQUk0akIsZ0JBQWdCLElBQUksQ0FBQ2hQLFNBQVM7WUFDbEMsSUFBSSxDQUFDRCxZQUFZLENBQUN0VTtZQUNsQixJQUFJcWEsWUFBWSxPQUNaLElBQUksQ0FBQ0wsZ0JBQWdCLENBQUN1SixlQUFleGtCO1FBQzdDO1FBRUEsSUFBSSxDQUFDaWIsZ0JBQWdCLEdBQUcsU0FBU2lKLFNBQVMsRUFBRWxrQixRQUFRO1lBQ2hELElBQUlta0IsVUFBVSxJQUFJLENBQUMzTyxTQUFTO1lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUNpUCxlQUFlLEVBQ3JCO1lBQ0osSUFBSTFNLFFBQVEsSUFBSTtZQUVoQixJQUFJbU0sYUFBYUMsU0FDYjtZQUVKLElBQUksSUFBSSxDQUFDTyxnQkFBZ0IsRUFBRTtnQkFDdkIsSUFBSUMsV0FBVyxJQUFJLENBQUNELGdCQUFnQixDQUFDTixLQUFLO2dCQUMxQyxJQUFJTyxTQUFTcnJCLE1BQU0sRUFBRTtvQkFDakI0cUIsWUFBWVMsUUFBUSxDQUFDLEVBQUU7b0JBQ3ZCLElBQUlULGFBQWFDLFNBQ2I7Z0JBQ1I7WUFDSjtZQUVBLElBQUlDLFFBQVFyTSxNQUFNa00sVUFBVSxDQUFDQyxXQUFXQztZQUN4QyxJQUFJLENBQUNPLGdCQUFnQixHQUFHO2dCQUFDRSxNQUFNVjtnQkFBV1csSUFBSVY7Z0JBQVNDLE9BQU9BO1lBQUs7WUFFbkVuUSxjQUFjLElBQUksQ0FBQzZRLE1BQU07WUFFekIvTSxNQUFNemhCLFFBQVEsQ0FBQ2lmLFlBQVksQ0FBQzZPLE1BQU1XLEtBQUs7WUFDdkMscUVBQXFFO1lBQ3JFaE4sTUFBTXpoQixRQUFRLENBQUMrZSxVQUFVLEdBQUc4TztZQUM1QixJQUFJLENBQUNXLE1BQU0sR0FBR3JRLFlBQVk7Z0JBQ3RCLElBQUkyUCxNQUFNOXFCLE1BQU0sRUFBRTtvQkFDZHllLE1BQU16aEIsUUFBUSxDQUFDaWYsWUFBWSxDQUFDNk8sTUFBTVcsS0FBSztvQkFDdkNoTixNQUFNemhCLFFBQVEsQ0FBQytlLFVBQVUsR0FBRzhPO2dCQUNoQyxPQUFPLElBQUlBLFdBQVcsTUFBTTtvQkFDeEJwTSxNQUFNemhCLFFBQVEsQ0FBQytlLFVBQVUsR0FBRyxDQUFDO29CQUM3QjBDLE1BQU16aEIsUUFBUSxDQUFDaWYsWUFBWSxDQUFDNE87b0JBQzVCQSxVQUFVO2dCQUNkLE9BQU87b0JBQ0gsMkVBQTJFO29CQUMzRXBNLE1BQU0rTSxNQUFNLEdBQUc3USxjQUFjOEQsTUFBTStNLE1BQU07b0JBQ3pDL00sTUFBTTJNLGdCQUFnQixHQUFHO29CQUN6QjFrQixZQUFZQTtnQkFDaEI7WUFDSixHQUFHO1FBQ1A7UUFFQTs7Ozs7O01BTUUsR0FDRixJQUFJLENBQUM0WixTQUFTLEdBQUcsU0FBU3BFLFNBQVM7WUFDL0IsdUNBQXVDO1lBQ3ZDLDBEQUEwRDtZQUMxRCxJQUFJLElBQUksQ0FBQ0EsU0FBUyxLQUFLQSxXQUFXO2dCQUM5QixJQUFJLENBQUM3RCxLQUFLLENBQUNDLFFBQVEsQ0FBQyxJQUFJLENBQUM0TixhQUFhO2dCQUN0QyxJQUFJLENBQUNoSyxTQUFTLEdBQUdBO1lBQ3JCO1FBQ0o7UUFFQTs7Ozs7O01BTUUsR0FDRixJQUFJLENBQUNxRSxTQUFTLEdBQUcsU0FBUy9ELFVBQVU7WUFDaEMsSUFBSUEsYUFBYSxHQUNiQSxhQUFhO1lBRWpCLElBQUksSUFBSSxDQUFDQSxVQUFVLEtBQUtBLFlBQVk7Z0JBQ2hDLElBQUksQ0FBQ25FLEtBQUssQ0FBQ0MsUUFBUSxDQUFDLElBQUksQ0FBQzROLGFBQWE7Z0JBQ3RDLElBQUksQ0FBQzFKLFVBQVUsR0FBR0E7WUFDdEI7UUFDSjtRQUVBOzs7Ozs7TUFNRSxHQUNGLElBQUksQ0FBQzdlLFFBQVEsR0FBRyxTQUFTK3RCLE1BQU0sRUFBRUMsTUFBTTtZQUNuQ0EsVUFBVSxJQUFJLENBQUMzdUIsUUFBUSxDQUFDaWYsWUFBWSxDQUFDLElBQUksQ0FBQ2pmLFFBQVEsQ0FBQ2dmLFlBQVksS0FBSzJQO1lBQ3BFRCxVQUFVLElBQUksQ0FBQzF1QixRQUFRLENBQUN1ZixhQUFhLENBQUMsSUFBSSxDQUFDdmYsUUFBUSxDQUFDc2YsYUFBYSxLQUFLb1A7UUFDMUU7UUFFQTs7Ozs7OztNQU9FLEdBQ0YsSUFBSSxDQUFDeFgsY0FBYyxHQUFHLFNBQVN3WCxNQUFNLEVBQUVDLE1BQU07WUFDekMsSUFBSUEsU0FBUyxLQUFLLElBQUksQ0FBQzNQLFlBQVksTUFBTSxJQUFJLElBQUksQ0FBQ21KLFlBQVksQ0FBQ3JlLEdBQUcsRUFDL0QsT0FBTztZQUNWLElBQUk2a0IsU0FBUyxLQUFLLElBQUksQ0FBQzNQLFlBQVksS0FBSyxJQUFJLENBQUM1RixLQUFLLENBQUNDLGNBQWMsR0FBRyxJQUFJLENBQUN6WSxXQUFXLENBQUM4bkIsU0FBUyxHQUN4RixDQUFDLElBQUksSUFBSSxDQUFDUCxZQUFZLENBQUNwZSxNQUFNLEVBQ2hDLE9BQU87WUFDVixJQUFJMmtCLFNBQVMsS0FBSyxJQUFJLENBQUNwUCxhQUFhLE1BQU0sR0FDdkMsT0FBTztZQUNWLElBQUlvUCxTQUFTLEtBQUssSUFBSSxDQUFDcFAsYUFBYSxLQUFLLElBQUksQ0FBQ2xHLEtBQUssQ0FBQ3lDLGFBQWEsR0FBRyxJQUFJLENBQUNqYixXQUFXLENBQUN3cUIsUUFBUSxHQUFHLENBQUMsR0FDOUYsT0FBTztRQUNkO1FBRUEsb0NBQW9DO1FBQ3BDLElBQUksQ0FBQzVPLHVCQUF1QixHQUFHLFNBQVN0USxDQUFDLEVBQUVnSyxDQUFDO1lBQ3hDLElBQUkwWSxZQUFZLElBQUksQ0FBQ3pVLFFBQVEsQ0FBQ0MscUJBQXFCO1lBQ25EbEUsS0FBSzBZLFVBQVU5a0IsR0FBRztZQUNsQm9DLEtBQUswaUIsVUFBVW5jLElBQUk7WUFFbkIsT0FBTztnQkFDSHZHLEdBQUlBLElBQUksSUFBSSxDQUFDc1QsVUFBVTtnQkFDdkJ0SixHQUFJQSxJQUFJLElBQUksQ0FBQ2dKLFNBQVM7WUFDMUI7UUFDSjtRQUVBOzs7Ozs7OztNQVFFLEdBQ0YsSUFBSSxDQUFDMlAsdUJBQXVCLEdBQUcsU0FBU3pnQixHQUFHLEVBQUVZLE1BQU07WUFDL0MsTUFBTSxJQUFJek07UUFFZDtRQUVBLElBQUksQ0FBQ3VzQixVQUFVLEdBQUcsU0FBUzVpQixDQUFDLEVBQUVnSyxDQUFDLEVBQUU2WSxNQUFNLEdBRXZDO1FBRUEsSUFBSSxDQUFDalIscUJBQXFCLEdBQUcsWUFBVztRQUV4Qzs7O01BR0UsR0FDRixJQUFJLENBQUNoRSxjQUFjLEdBQUc7WUFDbEJoVyxJQUFJNmpCLFdBQVcsQ0FBQyxJQUFJLENBQUN0VCxTQUFTLEVBQUU7UUFDcEM7UUFFQTs7O01BR0UsR0FDRixJQUFJLENBQUM2RixhQUFhLEdBQUc7WUFDakJwVyxJQUFJa3JCLGNBQWMsQ0FBQyxJQUFJLENBQUMzYSxTQUFTLEVBQUU7UUFDdkM7UUFFQTs7Ozs7S0FLQyxHQUNELElBQUksQ0FBQzJQLFFBQVEsR0FBRyxTQUFTQyxLQUFLLEVBQUVnTCxFQUFFO1lBQzlCLElBQUl4TixRQUFRLElBQUk7WUFDaEIsSUFBSSxDQUFDeU4sV0FBVyxHQUFHakw7WUFDbkJ4QyxNQUFNME4sY0FBYyxDQUFDLGVBQWM7Z0JBQUNsTCxPQUFNQTtZQUFLO1lBRS9DLElBQUksQ0FBQ0EsU0FBUyxPQUFPQSxTQUFTLFVBQVU7Z0JBQ3BDLElBQUl4Z0IsYUFBYXdnQixTQUFTO2dCQUMxQnhXLE9BQU9qSyxVQUFVLENBQUM7b0JBQUM7b0JBQVNDO2lCQUFXLEVBQUUyckI7WUFDN0MsT0FBTztnQkFDSEEsVUFBVW5MO1lBQ2Q7WUFFQSxTQUFTbUwsVUFBVXB3QixNQUFNO2dCQUNyQixJQUFJeWlCLE1BQU15TixXQUFXLElBQUlqTCxPQUNyQixPQUFPZ0wsTUFBTUE7Z0JBQ2pCLElBQUksQ0FBQ2p3QixPQUFPNEUsUUFBUSxFQUNoQjtnQkFDSkUsSUFBSUMsZUFBZSxDQUNmL0UsT0FBTzZFLE9BQU8sRUFDZDdFLE9BQU80RSxRQUFRLEVBQ2Y2ZCxNQUFNcE4sU0FBUyxDQUFDeVUsYUFBYTtnQkFHakMsSUFBSXJILE1BQU13QyxLQUFLLEVBQ1huZ0IsSUFBSWtyQixjQUFjLENBQUN2TixNQUFNcE4sU0FBUyxFQUFFb04sTUFBTXdDLEtBQUssQ0FBQ3JnQixRQUFRO2dCQUU1RCxnREFBZ0Q7Z0JBQ2hENmQsTUFBTTROLE1BQU0sR0FBR3J3QixPQUFPNEUsUUFBUTtnQkFFOUI2ZCxNQUFNd0MsS0FBSyxHQUFHamxCO2dCQUNkOEUsSUFBSTZqQixXQUFXLENBQUNsRyxNQUFNcE4sU0FBUyxFQUFFclYsT0FBTzRFLFFBQVE7Z0JBQ2hERSxJQUFJdUgsV0FBVyxDQUFDb1csTUFBTXBOLFNBQVMsRUFBRSxZQUFZclYsT0FBTzJFLE1BQU07Z0JBRTFELElBQUkya0IsVUFBVXRwQixPQUFPc3BCLE9BQU8sSUFBSTtnQkFDaEMsSUFBSTdHLE1BQU02TixRQUFRLElBQUloSCxXQUFXN0csTUFBTTZOLFFBQVEsRUFDM0M3TixNQUFNOE4sVUFBVSxDQUFDakg7Z0JBRXJCLHVDQUF1QztnQkFDdkMsSUFBSTdHLE1BQU1ySSxLQUFLLEVBQUU7b0JBQ2JxSSxNQUFNckksS0FBSyxDQUFDbkksS0FBSyxHQUFHO29CQUNwQndRLE1BQU11QixRQUFRO2dCQUNsQjtnQkFFQXZCLE1BQU0wTixjQUFjLENBQUMsZUFBZTtvQkFBQ2xMLE9BQU1qbEI7Z0JBQU07Z0JBQ2pEaXdCLE1BQU1BO1lBQ1Y7UUFDSjtRQUVBOzs7S0FHQyxHQUNELElBQUksQ0FBQ08sUUFBUSxHQUFHO1lBQ1osT0FBTyxJQUFJLENBQUNOLFdBQVc7UUFDM0I7UUFFQSx1RUFBdUU7UUFDdkUseUVBQXlFO1FBQ3pFLG9DQUFvQztRQUVwQzs7Ozs7TUFLRSxHQUNGLElBQUksQ0FBQ25WLFFBQVEsR0FBRyxTQUFTQSxTQUFTbEosS0FBSyxFQUFFekYsT0FBTztZQUM1Q3RILElBQUl1SCxXQUFXLENBQUMsSUFBSSxDQUFDZ0osU0FBUyxFQUFFeEQsT0FBT3pGLFlBQVk7UUFDdkQ7UUFFQTs7Ozs7TUFLRSxHQUNGLElBQUksQ0FBQ3FrQixVQUFVLEdBQUcsU0FBU0EsV0FBVzVlLEtBQUs7WUFDdkMvTSxJQUFJa3JCLGNBQWMsQ0FBQyxJQUFJLENBQUMzYSxTQUFTLEVBQUV4RDtRQUN2QztRQUVBOzs7TUFHRSxHQUNGLElBQUksQ0FBQ1YsT0FBTyxHQUFHO1lBQ1h3SixPQUFPQyxtQkFBbUIsQ0FBQyxTQUFTLElBQUksQ0FBQ3FQLFlBQVk7WUFFckQsSUFBSSxDQUFDek8sVUFBVSxDQUFDckssT0FBTztRQUMzQjtJQUVKLEdBQUdwRSxJQUFJLENBQUM4VSxnQkFBZ0I3VSxTQUFTO0lBRWpDeUIsT0FBTzJRLGFBQWEsQ0FBQ3lDLGdCQUFnQjdVLFNBQVMsRUFBRSxZQUFZO1FBQ3hEZ2IsZ0JBQWdCO1lBQUMxSSxjQUFjO1FBQUk7UUFDbkNvUixnQkFBZ0I7WUFDWmx0QixLQUFLLFNBQVNDLEtBQUs7Z0JBQ2YsSUFBSSxJQUFJLENBQUMrWCxVQUFVLENBQUNtVixpQkFBaUIsQ0FBQ2x0QixRQUNsQyxJQUFJLENBQUM0WSxLQUFLLENBQUNDLFFBQVEsQ0FBQyxJQUFJLENBQUNzVSxXQUFXO1lBQzVDO1lBQ0F0UixjQUFjO1FBQ2xCO1FBQ0F1UixpQkFBaUI7WUFDYnJ0QixLQUFLO2dCQUFhLElBQUksQ0FBQ3N0QixrQkFBa0I7WUFBSTtZQUM3Q3hSLGNBQWM7UUFDbEI7UUFDQXlSLG1CQUFtQjtZQUNmdnRCLEtBQUs7Z0JBQWEsSUFBSSxDQUFDc3RCLGtCQUFrQjtZQUFJO1lBQzdDeFIsY0FBYztRQUNsQjtRQUNBMFIsYUFBYTtZQUNUeHRCLEtBQUssU0FBU3VHLEdBQUc7Z0JBQ2IsSUFBSSxPQUFPQSxPQUFPLFVBQ2QsSUFBSSxDQUFDa25CLGtCQUFrQixHQUFHbG5CO2dCQUM5QixJQUFJLENBQUNtbkIsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDbm5CO2dCQUMxQixJQUFJLENBQUMrbUIsa0JBQWtCO1lBQzNCO1lBQ0ExdEIsS0FBSztnQkFDRCxPQUFPLElBQUksQ0FBQzh0QixnQkFBZ0IsSUFBSSxJQUFJLENBQUNELGtCQUFrQjtZQUMzRDtRQUNKO1FBQ0FFLHFCQUFxQjtZQUNqQjN0QixLQUFLLFNBQVM0dEIsSUFBSTtnQkFDZCxJQUFJLElBQUksQ0FBQzVWLFVBQVUsQ0FBQzZWLHNCQUFzQixDQUFDRCxPQUN2QyxJQUFJLENBQUMvVSxLQUFLLENBQUNDLFFBQVEsQ0FBQyxJQUFJLENBQUNzVSxXQUFXO1lBQzVDO1lBQ0F0UixjQUFjO1FBQ2xCO1FBQ0FnUyx5QkFBeUI7WUFDckI5dEIsS0FBSyxTQUFTK3RCLGFBQWE7Z0JBQ3ZCLElBQUksQ0FBQzlELHdCQUF3QixHQUFHOEQ7Z0JBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUM5RCx3QkFBd0IsSUFBSSxDQUFDLElBQUksQ0FBQzFFLFlBQVksRUFDcEQsSUFBSSxDQUFDMU0sS0FBSyxDQUFDQyxRQUFRLENBQUMsSUFBSSxDQUFDNE4sYUFBYTtZQUM5QztZQUNBNUssY0FBYztRQUNsQjtRQUNBa1MseUJBQXlCO1lBQ3JCaHVCLEtBQUssU0FBU3VHLEdBQUc7Z0JBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQzRqQix3QkFBd0IsSUFBSSxDQUFDLElBQUksQ0FBQ1AsUUFBUSxFQUNoRCxJQUFJLENBQUMvUSxLQUFLLENBQUNDLFFBQVEsQ0FBQyxJQUFJLENBQUM0TixhQUFhO1lBQzlDO1lBQ0E1SyxjQUFjO1FBQ2xCO1FBQ0FtUyxVQUFXO1lBQ1BqdUIsS0FBSyxTQUFTOEgsSUFBSTtnQkFDZCxJQUFJLE9BQU9BLFFBQVEsVUFDZkEsT0FBT0EsT0FBTztnQkFDbEIsSUFBSSxDQUFDK0osU0FBUyxDQUFDeEQsS0FBSyxDQUFDNGYsUUFBUSxHQUFHbm1CO2dCQUNoQyxJQUFJLENBQUNvbUIsY0FBYztZQUN2QjtZQUNBcFMsY0FBYztRQUNsQjtRQUNBcVMsWUFBWTtZQUNSbnVCLEtBQUssU0FBU25ELElBQUk7Z0JBQ2QsSUFBSSxDQUFDZ1YsU0FBUyxDQUFDeEQsS0FBSyxDQUFDOGYsVUFBVSxHQUFHdHhCO2dCQUNsQyxJQUFJLENBQUNxeEIsY0FBYztZQUN2QjtRQUNKO1FBQ0F6SixVQUFVO1lBQ056a0IsS0FBSyxTQUFTdUcsR0FBRztnQkFDYixJQUFJLENBQUNpVCxVQUFVO1lBQ25CO1FBQ0o7UUFDQWtMLFVBQVU7WUFDTjFrQixLQUFLLFNBQVN1RyxHQUFHO2dCQUNiLElBQUksQ0FBQ2lULFVBQVU7WUFDbkI7UUFDSjtRQUNBNFUsZUFBZTtZQUNYcHVCLEtBQUssU0FBU3VHLEdBQUc7Z0JBQ2JBLE1BQU0sQ0FBQ0EsT0FBTztnQkFDZCxJQUFJLElBQUksQ0FBQzhuQixjQUFjLElBQUk5bkIsS0FDdkI7Z0JBQ0osSUFBSSxDQUFDOG5CLGNBQWMsR0FBRzluQjtnQkFDdEIsSUFBSSxDQUFDc1MsS0FBSyxDQUFDQyxRQUFRLENBQUMsSUFBSSxDQUFDNE4sYUFBYTtZQUMxQztZQUNBNUssY0FBYztZQUNkd1MsWUFBWTtRQUNoQjtJQUNKO0lBRUEveEIsdUJBQXVCLEdBQUc4aEI7QUFDMUIsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7OztBQ25yQ0YsMkNBQTJDLHVCQUF1QixHQUFHLDhCQUE4QiwwQ0FBMEMseUNBQXlDLEdBQUcsNENBQTRDLFNBQVMsOEJBQThCLHdCQUF3QixrQkFBa0IsbUJBQW1CLEdBQUcsd0NBQXdDLHdCQUF3QixHQUFHLHdDQUF3Qyx3QkFBd0IsNEJBQTRCLEdBQUcsNkJBQTZCLG9DQUFvQyxrQ0FBa0MsNkJBQTZCLEdBQUcsb0VBQW9FLHNDQUFzQyxHQUFHLHNDQUFzQyxzQ0FBc0MsR0FBRyx1REFBdUQseUdBQXlHLDhHQUE4Ryx5R0FBeUcscUJBQXFCLEdBQUcsZ0VBQWdFLDJDQUEyQyxnQ0FBZ0MsdUJBQXVCLEdBQUcscURBQXFELDhCQUE4QixHQUFHLGtDQUFrQyxxQ0FBcUMsR0FBRywrQ0FBK0MsOEJBQThCLHVCQUF1QixHQUFHLHlEQUF5RCxtQkFBbUIscUNBQXFDLDRCQUE0QixpQkFBaUIsb0JBQW9CLHlCQUF5Qix3QkFBd0IsOENBQThDLEdBQUc7Ozs7Ozs7QUNBNTNELDRCQUE0Qix3QkFBd0IsZ0NBQWdDLHNCQUFzQix5QkFBeUIsdUJBQXVCLEdBQUcsdUJBQXVCLDBCQUEwQixrQkFBa0IsR0FBRyx3QkFBd0IseUJBQXlCLHVCQUF1QixhQUFhLGdCQUFnQixnQ0FBZ0MsZ0NBQWdDLGdDQUFnQyxnQ0FBZ0MsZ0NBQWdDLEdBQUcsdUJBQXVCLHlCQUF5QixrQ0FBa0MscUNBQXFDLDZCQUE2QixHQUFHLG9CQUFvQix5QkFBeUIseUJBQXlCLHVCQUF1QixlQUFlLGdCQUFnQixHQUFHLDBCQUEwQix5QkFBeUIsbUJBQW1CLGNBQWMsYUFBYSxHQUFHLHNCQUFzQix5QkFBeUIsdUJBQXVCLHlCQUF5QixlQUFlLGNBQWMsZ0JBQWdCLEdBQUcsMEJBQTBCLDBCQUEwQixHQUFHLHlCQUF5QixpQkFBaUIsMEJBQTBCLEdBQUcsdUJBQXVCLGtCQUFrQix5QkFBeUIsMEJBQTBCLHFDQUFxQyxxQ0FBcUMscUNBQXFDLDJCQUEyQixHQUFHLHFCQUFxQixpQkFBaUIseUJBQXlCLHVCQUF1QiwwQkFBMEIscUNBQXFDLHFDQUFxQyxxQ0FBcUMsMkJBQTJCLEdBQUcsNEJBQTRCLDZCQUE2QixHQUFHLDhCQUE4QiwwQkFBMEIscUNBQXFDLHFDQUFxQyxxQ0FBcUMsR0FBRyw0Q0FBNEMsU0FBUyxzQkFBc0IsMEJBQTBCLHNCQUFzQix5QkFBeUIsZ0NBQWdDLG1DQUFtQyxtQ0FBbUMsZ0NBQWdDLGNBQWMsaUJBQWlCLDRCQUE0QixrQkFBa0IsbUJBQW1CLG1DQUFtQyxtQ0FBbUMsbUNBQW1DLHNCQUFzQiw0QkFBNEIsMkJBQTJCLEdBQUcsOEJBQThCLDJCQUEyQixHQUFHLDZCQUE2QixxQ0FBcUMsR0FBRyw4QkFBOEIsb0NBQW9DLHNCQUFzQixHQUFHLDJDQUEyQyxrQkFBa0IsR0FBRyw2QkFBNkIsa0JBQWtCLG1CQUFtQixHQUFHLGtDQUFrQyx5QkFBeUIsbUJBQW1CLHVCQUF1QixHQUFHLHdEQUF3RCw0QkFBNEIsdUJBQXVCLHFDQUFxQyxxQ0FBcUMscUNBQXFDLEdBQUcsc0JBQXNCLDBCQUEwQix5QkFBeUIsdUJBQXVCLGFBQWEsY0FBYyxlQUFlLHFDQUFxQyxxQ0FBcUMscUNBQXFDLEdBQUcsK0JBQStCLDRCQUE0QixxQ0FBcUMscUNBQXFDLHFDQUFxQyxHQUFHLHlDQUF5QyxtQkFBbUIscUNBQXFDLDRCQUE0QixpQkFBaUIsb0JBQW9CLHlCQUF5Qix3QkFBd0IsOENBQThDLEdBQUc7Ozs7OztVQ0Fwc0g7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGlDQUFpQyxXQUFXO1dBQzVDO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDTm1DO0FBQUE7QUFDaUI7QUFBQSIsInNvdXJjZXMiOlsid2VicGFjazovL2FjZS10cmVlL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL25vZGVfbW9kdWxlcy9hY2UtY29kZS9zcmMvY2xpcGJvYXJkLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9jb21tYW5kcy9jb21tYW5kX21hbmFnZXIuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9ub2RlX21vZHVsZXMvYWNlLWNvZGUvc3JjL2tleWJvYXJkL2hhc2hfaGFuZGxlci5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL25vZGVfbW9kdWxlcy9hY2UtY29kZS9zcmMva2V5Ym9hcmQva2V5YmluZGluZy5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL25vZGVfbW9kdWxlcy9hY2UtY29kZS9zcmMva2V5Ym9hcmQvdGV4dGlucHV0LmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9saWIvYXBwX2NvbmZpZy5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL25vZGVfbW9kdWxlcy9hY2UtY29kZS9zcmMvbGliL2RvbS5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL25vZGVfbW9kdWxlcy9hY2UtY29kZS9zcmMvbGliL2V2ZW50LmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9saWIvZXZlbnRfZW1pdHRlci5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL25vZGVfbW9kdWxlcy9hY2UtY29kZS9zcmMvbGliL2tleXMuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9ub2RlX21vZHVsZXMvYWNlLWNvZGUvc3JjL2xpYi9sYW5nLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9saWIvbmV0LmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9saWIvb29wLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9saWIvdXNlcmFnZW50LmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9yZW5kZXJsb29wLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vbm9kZV9tb2R1bGVzL2FjZS1jb2RlL3NyYy9zY3JvbGxiYXIuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9zcmMvY29tbWFuZHMvZGVmYXVsdF9jb21tYW5kcy5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL3NyYy9jb25maWcuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9zcmMvY3NzL2xpZ2h0X3RoZW1lLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vc3JjL2RhdGFfcHJvdmlkZXIuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9zcmMvbGF5ZXIvY2VsbHMuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9zcmMvbGF5ZXIvaGVhZGluZy5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL3NyYy9sYXllci9tYXJrZXJzLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vc3JjL21vdXNlL2RlZmF1bHRfaGFuZGxlcnMuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9zcmMvbW91c2UvZHJhZ19oYW5kbGVyLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vc3JjL21vdXNlL2hlYWRpbmdfaGFuZGxlci5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL3NyYy9tb3VzZS9tb3VzZV9ldmVudC5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL3NyYy9tb3VzZS9tb3VzZV9oYW5kbGVyLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vc3JjL3F1aWNrc2VhcmNoLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vc3JjL3Njcm9sbGFibGUuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9zcmMvc2VsZWN0aW9uLmpzIiwid2VicGFjazovL2FjZS10cmVlLy4vc3JjL3RyZWUuanMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvLi9zcmMvdmlydHVhbF9yZW5kZXJlci5qcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS8uL3NyYy9jc3MvbGlnaHRfdGhlbWUuY3NzIiwid2VicGFjazovL2FjZS10cmVlLy4vc3JjL2Nzcy90cmVlLmNzcyIsIndlYnBhY2s6Ly9hY2UtdHJlZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9hY2UtdHJlZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9hY2UtdHJlZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vYWNlLXRyZWUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9hY2UtdHJlZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2FjZS10cmVlLy4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIHtcblx0XHR2YXIgYSA9IGZhY3RvcnkoKTtcblx0XHRmb3IodmFyIGkgaW4gYSkgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyA/IGV4cG9ydHMgOiByb290KVtpXSA9IGFbaV07XG5cdH1cbn0pKHRoaXMsICgpID0+IHtcbnJldHVybiAiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyICRjYW5jZWxUO1xubW9kdWxlLmV4cG9ydHMgPSB7IFxuICAgIGxpbmVNb2RlOiBmYWxzZSxcbiAgICBwYXN0ZUNhbmNlbGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICgkY2FuY2VsVCAmJiAkY2FuY2VsVCA+IERhdGUubm93KCkgLSA1MClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gJGNhbmNlbFQgPSBmYWxzZTtcbiAgICB9LFxuICAgIGNhbmNlbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICRjYW5jZWxUID0gRGF0ZS5ub3coKTtcbiAgICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiLi4vbGliL29vcFwiKTtcbnZhciBNdWx0aUhhc2hIYW5kbGVyID0gcmVxdWlyZShcIi4uL2tleWJvYXJkL2hhc2hfaGFuZGxlclwiKS5NdWx0aUhhc2hIYW5kbGVyO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCIuLi9saWIvZXZlbnRfZW1pdHRlclwiKS5FdmVudEVtaXR0ZXI7XG5cbi8qKlxuICogQGNsYXNzIENvbW1hbmRNYW5hZ2VyXG4gKlxuICoqL1xuXG4vKipcbiAqIG5ldyBDb21tYW5kTWFuYWdlcihwbGF0Zm9ybSwgY29tbWFuZHMpXG4gKiBAcGFyYW0ge1N0cmluZ30gcGxhdGZvcm0gSWRlbnRpZmllciBmb3IgdGhlIHBsYXRmb3JtOyBtdXN0IGJlIGVpdGhlciBgXCJtYWNcImAgb3IgYFwid2luXCJgXG4gKiBAcGFyYW0ge0FycmF5fSBjb21tYW5kcyBBIGxpc3Qgb2YgY29tbWFuZHNcbiAqXG4gKiovXG5cbnZhciBDb21tYW5kTWFuYWdlciA9IGZ1bmN0aW9uKHBsYXRmb3JtLCBjb21tYW5kcykge1xuICAgIE11bHRpSGFzaEhhbmRsZXIuY2FsbCh0aGlzLCBjb21tYW5kcywgcGxhdGZvcm0pO1xuICAgIHRoaXMuYnlOYW1lID0gdGhpcy5jb21tYW5kcztcbiAgICB0aGlzLnNldERlZmF1bHRIYW5kbGVyKFwiZXhlY1wiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICghZS5hcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gZS5jb21tYW5kLmV4ZWMoZS5lZGl0b3IsIHt9LCBlLmV2ZW50LCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZS5jb21tYW5kLmV4ZWMoZS5lZGl0b3IsIGUuYXJncywgZS5ldmVudCwgZmFsc2UpO1xuICAgIH0pO1xufTtcblxub29wLmluaGVyaXRzKENvbW1hbmRNYW5hZ2VyLCBNdWx0aUhhc2hIYW5kbGVyKTtcblxuKGZ1bmN0aW9uKCkge1xuXG4gICAgb29wLmltcGxlbWVudCh0aGlzLCBFdmVudEVtaXR0ZXIpO1xuXG4gICAgdGhpcy5leGVjID0gZnVuY3Rpb24oY29tbWFuZCwgZWRpdG9yLCBhcmdzKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbW1hbmQpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gY29tbWFuZC5sZW5ndGg7IGktLTsgKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZXhlYyhjb21tYW5kW2ldLCBlZGl0b3IsIGFyZ3MpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY29tbWFuZCA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgIGNvbW1hbmQgPSB0aGlzLmNvbW1hbmRzW2NvbW1hbmRdO1xuXG4gICAgICAgIGlmICghY29tbWFuZClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoZWRpdG9yICYmIGVkaXRvci4kcmVhZE9ubHkgJiYgIWNvbW1hbmQucmVhZE9ubHkpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKHRoaXMuJGNoZWNrQ29tbWFuZFN0YXRlICE9IGZhbHNlICYmIGNvbW1hbmQuaXNBdmFpbGFibGUgJiYgIWNvbW1hbmQuaXNBdmFpbGFibGUoZWRpdG9yKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICB2YXIgZSA9IHtlZGl0b3I6IGVkaXRvciwgY29tbWFuZDogY29tbWFuZCwgYXJnczogYXJnc307XG4gICAgICAgIGUucmV0dXJuVmFsdWUgPSB0aGlzLl9lbWl0KFwiZXhlY1wiLCBlKTtcbiAgICAgICAgdGhpcy5fc2lnbmFsKFwiYWZ0ZXJFeGVjXCIsIGUpO1xuXG4gICAgICAgIHJldHVybiBlLnJldHVyblZhbHVlID09PSBmYWxzZSA/IGZhbHNlIDogdHJ1ZTtcbiAgICB9O1xuXG4gICAgdGhpcy50b2dnbGVSZWNvcmRpbmcgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgICAgICAgaWYgKHRoaXMuJGluUmVwbGF5KVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGVkaXRvciAmJiBlZGl0b3IuX2VtaXQoXCJjaGFuZ2VTdGF0dXNcIik7XG4gICAgICAgIGlmICh0aGlzLnJlY29yZGluZykge1xuICAgICAgICAgICAgdGhpcy5tYWNyby5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKFwiZXhlY1wiLCB0aGlzLiRhZGRDb21tYW5kVG9NYWNybyk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5tYWNyby5sZW5ndGgpXG4gICAgICAgICAgICAgICAgdGhpcy5tYWNybyA9IHRoaXMub2xkTWFjcm87XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlY29yZGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy4kYWRkQ29tbWFuZFRvTWFjcm8pIHtcbiAgICAgICAgICAgIHRoaXMuJGFkZENvbW1hbmRUb01hY3JvID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHRoaXMubWFjcm8ucHVzaChbZS5jb21tYW5kLCBlLmFyZ3NdKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub2xkTWFjcm8gPSB0aGlzLm1hY3JvO1xuICAgICAgICB0aGlzLm1hY3JvID0gW107XG4gICAgICAgIHRoaXMub24oXCJleGVjXCIsIHRoaXMuJGFkZENvbW1hbmRUb01hY3JvKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjb3JkaW5nID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZXBsYXkgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgICAgICAgaWYgKHRoaXMuJGluUmVwbGF5IHx8ICF0aGlzLm1hY3JvKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0aGlzLnJlY29yZGluZylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvZ2dsZVJlY29yZGluZyhlZGl0b3IpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLiRpblJlcGxheSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLm1hY3JvLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgeCA9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4ZWMoeCwgZWRpdG9yKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhlYyh4WzBdLCBlZGl0b3IsIHhbMV0pO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLiRpblJlcGxheSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMudHJpbU1hY3JvID0gZnVuY3Rpb24obSkge1xuICAgICAgICByZXR1cm4gbS5tYXAoZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHhbMF0gIT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgICAgICB4WzBdID0geFswXS5uYW1lO1xuICAgICAgICAgICAgaWYgKCF4WzFdKVxuICAgICAgICAgICAgICAgIHggPSB4WzBdO1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbn0pLmNhbGwoQ29tbWFuZE1hbmFnZXIucHJvdG90eXBlKTtcblxuZXhwb3J0cy5Db21tYW5kTWFuYWdlciA9IENvbW1hbmRNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBrZXlVdGlsID0gcmVxdWlyZShcIi4uL2xpYi9rZXlzXCIpO1xudmFyIHVzZXJhZ2VudCA9IHJlcXVpcmUoXCIuLi9saWIvdXNlcmFnZW50XCIpO1xudmFyIEtFWV9NT0RTID0ga2V5VXRpbC5LRVlfTU9EUztcblxuZnVuY3Rpb24gSGFzaEhhbmRsZXIoY29uZmlnLCBwbGF0Zm9ybSkge1xuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybSB8fCAodXNlcmFnZW50LmlzTWFjID8gXCJtYWNcIiA6IFwid2luXCIpO1xuICAgIHRoaXMuY29tbWFuZHMgPSB7fTtcbiAgICB0aGlzLmNvbW1hbmRLZXlCaW5kaW5nID0ge307XG4gICAgdGhpcy5hZGRDb21tYW5kcyhjb25maWcpO1xuICAgIHRoaXMuJHNpbmdsZUNvbW1hbmQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBNdWx0aUhhc2hIYW5kbGVyKGNvbmZpZywgcGxhdGZvcm0pIHtcbiAgICBIYXNoSGFuZGxlci5jYWxsKHRoaXMsIGNvbmZpZywgcGxhdGZvcm0pO1xuICAgIHRoaXMuJHNpbmdsZUNvbW1hbmQgPSBmYWxzZTtcbn1cblxuTXVsdGlIYXNoSGFuZGxlci5wcm90b3R5cGUgPSBIYXNoSGFuZGxlci5wcm90b3R5cGU7XG5cbihmdW5jdGlvbigpIHtcbiAgICBcblxuICAgIHRoaXMuYWRkQ29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICAgICAgaWYgKHRoaXMuY29tbWFuZHNbY29tbWFuZC5uYW1lXSlcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29tbWFuZChjb21tYW5kKTtcblxuICAgICAgICB0aGlzLmNvbW1hbmRzW2NvbW1hbmQubmFtZV0gPSBjb21tYW5kO1xuXG4gICAgICAgIGlmIChjb21tYW5kLmJpbmRLZXkpXG4gICAgICAgICAgICB0aGlzLl9idWlsZEtleUhhc2goY29tbWFuZCk7XG4gICAgfTtcblxuICAgIHRoaXMucmVtb3ZlQ29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQsIGtlZXBDb21tYW5kKSB7XG4gICAgICAgIHZhciBuYW1lID0gY29tbWFuZCAmJiAodHlwZW9mIGNvbW1hbmQgPT09ICdzdHJpbmcnID8gY29tbWFuZCA6IGNvbW1hbmQubmFtZSk7XG4gICAgICAgIGNvbW1hbmQgPSB0aGlzLmNvbW1hbmRzW25hbWVdO1xuICAgICAgICBpZiAoIWtlZXBDb21tYW5kKVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY29tbWFuZHNbbmFtZV07XG5cbiAgICAgICAgLy8gZXhoYXVzdGl2ZSBzZWFyY2ggaXMgYnJ1dGUgZm9yY2UgYnV0IHNpbmNlIHJlbW92ZUNvbW1hbmQgaXNcbiAgICAgICAgLy8gbm90IGEgcGVyZm9ybWFuY2UgY3JpdGljYWwgb3BlcmF0aW9uIHRoaXMgc2hvdWxkIGJlIE9LXG4gICAgICAgIHZhciBja2IgPSB0aGlzLmNvbW1hbmRLZXlCaW5kaW5nO1xuICAgICAgICBmb3IgKHZhciBrZXlJZCBpbiBja2IpIHtcbiAgICAgICAgICAgIHZhciBjbWRHcm91cCA9IGNrYltrZXlJZF07XG4gICAgICAgICAgICBpZiAoY21kR3JvdXAgPT0gY29tbWFuZCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBja2Jba2V5SWRdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNtZEdyb3VwKSkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gY21kR3JvdXAuaW5kZXhPZihjb21tYW5kKTtcbiAgICAgICAgICAgICAgICBpZiAoaSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjbWRHcm91cC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbWRHcm91cC5sZW5ndGggPT0gMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNrYltrZXlJZF0gPSBjbWRHcm91cFswXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5iaW5kS2V5ID0gZnVuY3Rpb24oa2V5LCBjb21tYW5kLCBwb3NpdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIGtleSA9PSBcIm9iamVjdFwiICYmIGtleSkge1xuICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IGtleS5wb3NpdGlvbjtcbiAgICAgICAgICAgIGtleSA9IGtleVt0aGlzLnBsYXRmb3JtXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWtleSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21tYW5kID09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZENvbW1hbmQoe2V4ZWM6IGNvbW1hbmQsIGJpbmRLZXk6IGtleSwgbmFtZTogY29tbWFuZC5uYW1lIHx8IGtleX0pO1xuICAgICAgICBcbiAgICAgICAga2V5LnNwbGl0KFwifFwiKS5mb3JFYWNoKGZ1bmN0aW9uKGtleVBhcnQpIHtcbiAgICAgICAgICAgIHZhciBjaGFpbiA9IFwiXCI7XG4gICAgICAgICAgICBpZiAoa2V5UGFydC5pbmRleE9mKFwiIFwiKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IGtleVBhcnQuc3BsaXQoL1xccysvKTtcbiAgICAgICAgICAgICAgICBrZXlQYXJ0ID0gcGFydHMucG9wKCk7XG4gICAgICAgICAgICAgICAgcGFydHMuZm9yRWFjaChmdW5jdGlvbihrZXlQYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nID0gdGhpcy5wYXJzZUtleXMoa2V5UGFydCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IEtFWV9NT0RTW2JpbmRpbmcuaGFzaElkXSArIGJpbmRpbmcua2V5O1xuICAgICAgICAgICAgICAgICAgICBjaGFpbiArPSAoY2hhaW4gPyBcIiBcIiA6IFwiXCIpICsgaWQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FkZENvbW1hbmRUb0JpbmRpbmcoY2hhaW4sIFwiY2hhaW5LZXlzXCIpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgICAgIGNoYWluICs9IFwiIFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSB0aGlzLnBhcnNlS2V5cyhrZXlQYXJ0KTtcbiAgICAgICAgICAgIHZhciBpZCA9IEtFWV9NT0RTW2JpbmRpbmcuaGFzaElkXSArIGJpbmRpbmcua2V5O1xuICAgICAgICAgICAgdGhpcy5fYWRkQ29tbWFuZFRvQmluZGluZyhjaGFpbiArIGlkLCBjb21tYW5kLCBwb3NpdGlvbik7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH07XG4gICAgXG4gICAgZnVuY3Rpb24gZ2V0UG9zaXRpb24oY29tbWFuZCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGNvbW1hbmQgPT0gXCJvYmplY3RcIiAmJiBjb21tYW5kLmJpbmRLZXlcbiAgICAgICAgICAgICYmIGNvbW1hbmQuYmluZEtleS5wb3NpdGlvbiBcbiAgICAgICAgICAgIHx8IChjb21tYW5kLmlzRGVmYXVsdCA/IC0xMDAgOiAwKTtcbiAgICB9XG4gICAgdGhpcy5fYWRkQ29tbWFuZFRvQmluZGluZyA9IGZ1bmN0aW9uKGtleUlkLCBjb21tYW5kLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgY2tiID0gdGhpcy5jb21tYW5kS2V5QmluZGluZywgaTtcbiAgICAgICAgaWYgKCFjb21tYW5kKSB7XG4gICAgICAgICAgICBkZWxldGUgY2tiW2tleUlkXTtcbiAgICAgICAgfSBlbHNlIGlmICghY2tiW2tleUlkXSB8fCB0aGlzLiRzaW5nbGVDb21tYW5kKSB7XG4gICAgICAgICAgICBja2Jba2V5SWRdID0gY29tbWFuZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShja2Jba2V5SWRdKSkge1xuICAgICAgICAgICAgICAgIGNrYltrZXlJZF0gPSBbY2tiW2tleUlkXV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChpID0gY2tiW2tleUlkXS5pbmRleE9mKGNvbW1hbmQpKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIGNrYltrZXlJZF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvc2l0aW9uICE9IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKGNvbW1hbmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY29tbWFuZHMgPSBja2Jba2V5SWRdO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbW1hbmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyID0gY29tbWFuZHNbaV07XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyUG9zID0gZ2V0UG9zaXRpb24ob3RoZXIpO1xuICAgICAgICAgICAgICAgIGlmIChvdGhlclBvcyA+IHBvc2l0aW9uKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbW1hbmRzLnNwbGljZShpLCAwLCBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmFkZENvbW1hbmRzID0gZnVuY3Rpb24oY29tbWFuZHMpIHtcbiAgICAgICAgY29tbWFuZHMgJiYgT2JqZWN0LmtleXMoY29tbWFuZHMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgdmFyIGNvbW1hbmQgPSBjb21tYW5kc1tuYW1lXTtcbiAgICAgICAgICAgIGlmICghY29tbWFuZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tbWFuZCA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5iaW5kS2V5KGNvbW1hbmQsIG5hbWUpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbW1hbmQgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICBjb21tYW5kID0geyBleGVjOiBjb21tYW5kIH07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tbWFuZCAhPT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICghY29tbWFuZC5uYW1lKVxuICAgICAgICAgICAgICAgIGNvbW1hbmQubmFtZSA9IG5hbWU7XG5cbiAgICAgICAgICAgIHRoaXMuYWRkQ29tbWFuZChjb21tYW5kKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfTtcblxuICAgIHRoaXMucmVtb3ZlQ29tbWFuZHMgPSBmdW5jdGlvbihjb21tYW5kcykge1xuICAgICAgICBPYmplY3Qua2V5cyhjb21tYW5kcykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNvbW1hbmQoY29tbWFuZHNbbmFtZV0pO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9O1xuXG4gICAgdGhpcy5iaW5kS2V5cyA9IGZ1bmN0aW9uKGtleUxpc3QpIHtcbiAgICAgICAgT2JqZWN0LmtleXMoa2V5TGlzdCkuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZEtleShrZXksIGtleUxpc3Rba2V5XSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH07XG5cbiAgICB0aGlzLl9idWlsZEtleUhhc2ggPSBmdW5jdGlvbihjb21tYW5kKSB7XG4gICAgICAgIHRoaXMuYmluZEtleShjb21tYW5kLmJpbmRLZXksIGNvbW1hbmQpO1xuICAgIH07XG5cbiAgICAvLyBhY2NlcHRzIGtleXMgaW4gdGhlIGZvcm0gY3RybCtFbnRlciBvciBjdHJsLUVudGVyXG4gICAgLy8ga2V5cyB3aXRob3V0IG1vZGlmaWVycyBvciBzaGlmdCBvbmx5IFxuICAgIHRoaXMucGFyc2VLZXlzID0gZnVuY3Rpb24oa2V5cykge1xuICAgICAgICB2YXIgcGFydHMgPSBrZXlzLnRvTG93ZXJDYXNlKCkuc3BsaXQoL1tcXC1cXCtdKFtcXC1cXCtdKT8vKS5maWx0ZXIoZnVuY3Rpb24oeCl7cmV0dXJuIHg7fSk7XG4gICAgICAgIHZhciBrZXkgPSBwYXJ0cy5wb3AoKTtcblxuICAgICAgICB2YXIga2V5Q29kZSA9IGtleVV0aWxba2V5XTtcbiAgICAgICAgaWYgKGtleVV0aWwuRlVOQ1RJT05fS0VZU1trZXlDb2RlXSlcbiAgICAgICAgICAgIGtleSA9IGtleVV0aWwuRlVOQ1RJT05fS0VZU1trZXlDb2RlXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBlbHNlIGlmICghcGFydHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHtrZXk6IGtleSwgaGFzaElkOiAtMX07XG4gICAgICAgIGVsc2UgaWYgKHBhcnRzLmxlbmd0aCA9PSAxICYmIHBhcnRzWzBdID09IFwic2hpZnRcIilcbiAgICAgICAgICAgIHJldHVybiB7a2V5OiBrZXkudG9VcHBlckNhc2UoKSwgaGFzaElkOiAtMX07XG5cbiAgICAgICAgdmFyIGhhc2hJZCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGg7IGktLTspIHtcbiAgICAgICAgICAgIHZhciBtb2RpZmllciA9IGtleVV0aWwuS0VZX01PRFNbcGFydHNbaV1dO1xuICAgICAgICAgICAgaWYgKG1vZGlmaWVyID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImludmFsaWQgbW9kaWZpZXIgXCIgKyBwYXJ0c1tpXSArIFwiIGluIFwiICsga2V5cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGFzaElkIHw9IG1vZGlmaWVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7a2V5OiBrZXksIGhhc2hJZDogaGFzaElkfTtcbiAgICB9O1xuXG4gICAgdGhpcy5maW5kS2V5Q29tbWFuZCA9IGZ1bmN0aW9uIGZpbmRLZXlDb21tYW5kKGhhc2hJZCwga2V5U3RyaW5nKSB7XG4gICAgICAgIHZhciBrZXkgPSBLRVlfTU9EU1toYXNoSWRdICsga2V5U3RyaW5nO1xuICAgICAgICByZXR1cm4gdGhpcy5jb21tYW5kS2V5QmluZGluZ1trZXldO1xuICAgIH07XG5cbiAgICB0aGlzLmhhbmRsZUtleWJvYXJkID0gZnVuY3Rpb24oZGF0YSwgaGFzaElkLCBrZXlTdHJpbmcsIGtleUNvZGUpIHtcbiAgICAgICAgaWYgKGtleUNvZGUgPCAwKSByZXR1cm47XG4gICAgICAgIHZhciBrZXkgPSBLRVlfTU9EU1toYXNoSWRdICsga2V5U3RyaW5nO1xuICAgICAgICB2YXIgY29tbWFuZCA9IHRoaXMuY29tbWFuZEtleUJpbmRpbmdba2V5XTtcbiAgICAgICAgaWYgKGRhdGEuJGtleUNoYWluKSB7XG4gICAgICAgICAgICBkYXRhLiRrZXlDaGFpbiArPSBcIiBcIiArIGtleTtcbiAgICAgICAgICAgIGNvbW1hbmQgPSB0aGlzLmNvbW1hbmRLZXlCaW5kaW5nW2RhdGEuJGtleUNoYWluXSB8fCBjb21tYW5kO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT0gXCJjaGFpbktleXNcIiB8fCBjb21tYW5kW2NvbW1hbmQubGVuZ3RoIC0gMV0gPT0gXCJjaGFpbktleXNcIikge1xuICAgICAgICAgICAgICAgIGRhdGEuJGtleUNoYWluID0gZGF0YS4ka2V5Q2hhaW4gfHwga2V5O1xuICAgICAgICAgICAgICAgIHJldHVybiB7Y29tbWFuZDogXCJudWxsXCJ9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoZGF0YS4ka2V5Q2hhaW4pIHtcbiAgICAgICAgICAgIGlmICgoIWhhc2hJZCB8fCBoYXNoSWQgPT0gNCkgJiYga2V5U3RyaW5nLmxlbmd0aCA9PSAxKVxuICAgICAgICAgICAgICAgIGRhdGEuJGtleUNoYWluID0gZGF0YS4ka2V5Q2hhaW4uc2xpY2UoMCwgLWtleS5sZW5ndGggLSAxKTsgLy8gd2FpdCBmb3IgaW5wdXRcbiAgICAgICAgICAgIGVsc2UgaWYgKGhhc2hJZCA9PSAtMSB8fCBrZXlDb2RlID4gMClcbiAgICAgICAgICAgICAgICBkYXRhLiRrZXlDaGFpbiA9IFwiXCI7IC8vIHJlc2V0IGtleUNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtjb21tYW5kOiBjb21tYW5kfTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuZ2V0U3RhdHVzVGV4dCA9IGZ1bmN0aW9uKGVkaXRvciwgZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YS4ka2V5Q2hhaW4gfHwgXCJcIjtcbiAgICB9O1xuXG59KS5jYWxsKEhhc2hIYW5kbGVyLnByb3RvdHlwZSk7XG5cbmV4cG9ydHMuSGFzaEhhbmRsZXIgPSBIYXNoSGFuZGxlcjtcbmV4cG9ydHMuTXVsdGlIYXNoSGFuZGxlciA9IE11bHRpSGFzaEhhbmRsZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGtleVV0aWwgID0gcmVxdWlyZShcIi4uL2xpYi9rZXlzXCIpO1xudmFyIGV2ZW50ID0gcmVxdWlyZShcIi4uL2xpYi9ldmVudFwiKTtcblxudmFyIEtleUJpbmRpbmcgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgICB0aGlzLiRlZGl0b3IgPSBlZGl0b3I7XG4gICAgdGhpcy4kZGF0YSA9IHtlZGl0b3I6IGVkaXRvcn07XG4gICAgdGhpcy4kaGFuZGxlcnMgPSBbXTtcbiAgICB0aGlzLnNldERlZmF1bHRIYW5kbGVyKGVkaXRvci5jb21tYW5kcyk7XG59O1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXREZWZhdWx0SGFuZGxlciA9IGZ1bmN0aW9uKGtiKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlS2V5Ym9hcmRIYW5kbGVyKHRoaXMuJGRlZmF1bHRIYW5kbGVyKTtcbiAgICAgICAgdGhpcy4kZGVmYXVsdEhhbmRsZXIgPSBrYjtcbiAgICAgICAgdGhpcy5hZGRLZXlib2FyZEhhbmRsZXIoa2IsIDApO1xuICAgIH07XG5cbiAgICB0aGlzLnNldEtleWJvYXJkSGFuZGxlciA9IGZ1bmN0aW9uKGtiKSB7XG4gICAgICAgIHZhciBoID0gdGhpcy4kaGFuZGxlcnM7XG4gICAgICAgIGlmIChoW2gubGVuZ3RoIC0gMV0gPT0ga2IpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgd2hpbGUgKGhbaC5sZW5ndGggLSAxXSAmJiBoW2gubGVuZ3RoIC0gMV0gIT0gdGhpcy4kZGVmYXVsdEhhbmRsZXIpXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUtleWJvYXJkSGFuZGxlcihoW2gubGVuZ3RoIC0gMV0pO1xuXG4gICAgICAgIHRoaXMuYWRkS2V5Ym9hcmRIYW5kbGVyKGtiLCAxKTtcbiAgICB9O1xuXG4gICAgdGhpcy5hZGRLZXlib2FyZEhhbmRsZXIgPSBmdW5jdGlvbihrYiwgcG9zKSB7XG4gICAgICAgIGlmICgha2IpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh0eXBlb2Yga2IgPT0gXCJmdW5jdGlvblwiICYmICFrYi5oYW5kbGVLZXlib2FyZClcbiAgICAgICAgICAgIGtiLmhhbmRsZUtleWJvYXJkID0ga2I7XG4gICAgICAgIHZhciBpID0gdGhpcy4kaGFuZGxlcnMuaW5kZXhPZihrYik7XG4gICAgICAgIGlmIChpICE9IC0xKVxuICAgICAgICAgICAgdGhpcy4kaGFuZGxlcnMuc3BsaWNlKGksIDEpO1xuXG4gICAgICAgIGlmIChwb3MgPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgdGhpcy4kaGFuZGxlcnMucHVzaChrYik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMuJGhhbmRsZXJzLnNwbGljZShwb3MsIDAsIGtiKTtcblxuICAgICAgICBpZiAoaSA9PSAtMSAmJiBrYi5hdHRhY2gpXG4gICAgICAgICAgICBrYi5hdHRhY2godGhpcy4kZWRpdG9yKTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZW1vdmVLZXlib2FyZEhhbmRsZXIgPSBmdW5jdGlvbihrYikge1xuICAgICAgICB2YXIgaSA9IHRoaXMuJGhhbmRsZXJzLmluZGV4T2Yoa2IpO1xuICAgICAgICBpZiAoaSA9PSAtMSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgdGhpcy4kaGFuZGxlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBrYi5kZXRhY2ggJiYga2IuZGV0YWNoKHRoaXMuJGVkaXRvcik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICB0aGlzLmdldEtleWJvYXJkSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kaGFuZGxlcnNbdGhpcy4kaGFuZGxlcnMubGVuZ3RoIC0gMV07XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmdldFN0YXR1c1RleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLiRkYXRhO1xuICAgICAgICB2YXIgZWRpdG9yID0gZGF0YS5lZGl0b3I7XG4gICAgICAgIHJldHVybiB0aGlzLiRoYW5kbGVycy5tYXAoZnVuY3Rpb24oaCkge1xuICAgICAgICAgICAgcmV0dXJuIGguZ2V0U3RhdHVzVGV4dCAmJiBoLmdldFN0YXR1c1RleHQoZWRpdG9yLCBkYXRhKSB8fCBcIlwiO1xuICAgICAgICB9KS5maWx0ZXIoQm9vbGVhbikuam9pbihcIiBcIik7XG4gICAgfTtcblxuICAgIHRoaXMuJGNhbGxLZXlib2FyZEhhbmRsZXJzID0gZnVuY3Rpb24oaGFzaElkLCBrZXlTdHJpbmcsIGtleUNvZGUsIGUpIHtcbiAgICAgICAgdmFyIHRvRXhlY3V0ZTtcbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgdmFyIGNvbW1hbmRzID0gdGhpcy4kZWRpdG9yLmNvbW1hbmRzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLiRoYW5kbGVycy5sZW5ndGg7IGktLTspIHtcbiAgICAgICAgICAgIHRvRXhlY3V0ZSA9IHRoaXMuJGhhbmRsZXJzW2ldLmhhbmRsZUtleWJvYXJkKFxuICAgICAgICAgICAgICAgIHRoaXMuJGRhdGEsIGhhc2hJZCwga2V5U3RyaW5nLCBrZXlDb2RlLCBlXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKCF0b0V4ZWN1dGUgfHwgIXRvRXhlY3V0ZS5jb21tYW5kKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBhbGxvdyBrZXlib2FyZEhhbmRsZXIgdG8gY29uc3VtZSBrZXlzXG4gICAgICAgICAgICBpZiAodG9FeGVjdXRlLmNvbW1hbmQgPT0gXCJudWxsXCIpIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3VjY2VzcyA9IGNvbW1hbmRzLmV4ZWModG9FeGVjdXRlLmNvbW1hbmQsIHRoaXMuJGVkaXRvciwgdG9FeGVjdXRlLmFyZ3MsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZG8gbm90IHN0b3AgaW5wdXQgZXZlbnRzIHRvIG5vdCBicmVhayByZXBlYXRpbmdcbiAgICAgICAgICAgIGlmIChzdWNjZXNzICYmIGUgJiYgaGFzaElkICE9IC0xICYmIFxuICAgICAgICAgICAgICAgIHRvRXhlY3V0ZS5wYXNzRXZlbnQgIT0gdHJ1ZSAmJiB0b0V4ZWN1dGUuY29tbWFuZC5wYXNzRXZlbnQgIT0gdHJ1ZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcEV2ZW50KGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghc3VjY2VzcyAmJiBoYXNoSWQgPT0gLTEpIHtcbiAgICAgICAgICAgIHRvRXhlY3V0ZSA9IHtjb21tYW5kOiBcImluc2VydHN0cmluZ1wifTtcbiAgICAgICAgICAgIHN1Y2Nlc3MgPSBjb21tYW5kcy5leGVjKFwiaW5zZXJ0c3RyaW5nXCIsIHRoaXMuJGVkaXRvciwga2V5U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHN1Y2Nlc3MgJiYgdGhpcy4kZWRpdG9yLl9zaWduYWwpXG4gICAgICAgICAgICB0aGlzLiRlZGl0b3IuX3NpZ25hbChcImtleWJvYXJkQWN0aXZpdHlcIiwgdG9FeGVjdXRlKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzdWNjZXNzO1xuICAgIH07XG5cbiAgICB0aGlzLm9uQ29tbWFuZEtleSA9IGZ1bmN0aW9uKGUsIGhhc2hJZCwga2V5Q29kZSkge1xuICAgICAgICB2YXIga2V5U3RyaW5nID0ga2V5VXRpbC5rZXlDb2RlVG9TdHJpbmcoa2V5Q29kZSk7XG4gICAgICAgIHJldHVybiB0aGlzLiRjYWxsS2V5Ym9hcmRIYW5kbGVycyhoYXNoSWQsIGtleVN0cmluZywga2V5Q29kZSwgZSk7XG4gICAgfTtcblxuICAgIHRoaXMub25UZXh0SW5wdXQgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRjYWxsS2V5Ym9hcmRIYW5kbGVycygtMSwgdGV4dCk7XG4gICAgfTtcblxufSkuY2FsbChLZXlCaW5kaW5nLnByb3RvdHlwZSk7XG5cbmV4cG9ydHMuS2V5QmluZGluZyA9IEtleUJpbmRpbmc7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGV2ZW50ID0gcmVxdWlyZShcIi4uL2xpYi9ldmVudFwiKTtcbnZhciB1c2VyYWdlbnQgPSByZXF1aXJlKFwiLi4vbGliL3VzZXJhZ2VudFwiKTtcbnZhciBkb20gPSByZXF1aXJlKFwiLi4vbGliL2RvbVwiKTtcbnZhciBsYW5nID0gcmVxdWlyZShcIi4uL2xpYi9sYW5nXCIpO1xudmFyIGNsaXBib2FyZCA9IHJlcXVpcmUoXCIuLi9jbGlwYm9hcmRcIik7XG52YXIgQlJPS0VOX1NFVERBVEEgPSB1c2VyYWdlbnQuaXNDaHJvbWUgPCAxODtcbnZhciBVU0VfSUVfTUlNRV9UWVBFID0gIHVzZXJhZ2VudC5pc0lFO1xudmFyIEhBU19GT0NVU19BUkdTID0gdXNlcmFnZW50LmlzQ2hyb21lID4gNjM7XG52YXIgTUFYX0xJTkVfTEVOR1RIID0gNDAwO1xuXG52YXIgS0VZUyA9IHJlcXVpcmUoXCIuLi9saWIva2V5c1wiKTtcbnZhciBNT0RTID0gS0VZUy5LRVlfTU9EUztcbnZhciBpc0lPUyA9IHVzZXJhZ2VudC5pc0lPUztcbnZhciB2YWx1ZVJlc2V0UmVnZXggPSBpc0lPUyA/IC9cXHMvIDogL1xcbi87XG52YXIgaXNNb2JpbGUgPSB1c2VyYWdlbnQuaXNNb2JpbGU7XG5cbnZhciBUZXh0SW5wdXQgPSBmdW5jdGlvbihwYXJlbnROb2RlLCBob3N0KSB7XG4gICAgdmFyIHRleHQgPSBkb20uY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xuICAgIHRleHQuY2xhc3NOYW1lID0gXCJhY2VfdGV4dC1pbnB1dFwiO1xuXG4gICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ3cmFwXCIsIFwib2ZmXCIpO1xuICAgIHRleHQuc2V0QXR0cmlidXRlKFwiYXV0b2NvcnJlY3RcIiwgXCJvZmZcIik7XG4gICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJhdXRvY2FwaXRhbGl6ZVwiLCBcIm9mZlwiKTtcbiAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInNwZWxsY2hlY2tcIiwgZmFsc2UpO1xuXG4gICAgdGV4dC5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG4gICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGV4dCwgcGFyZW50Tm9kZS5maXJzdENoaWxkKTtcblxuICAgIHZhciBjb3BpZWQgPSBmYWxzZTtcbiAgICB2YXIgcGFzdGVkID0gZmFsc2U7XG4gICAgdmFyIGluQ29tcG9zaXRpb24gPSBmYWxzZTtcbiAgICB2YXIgc2VuZGluZ1RleHQgPSBmYWxzZTtcbiAgICB2YXIgdGVtcFN0eWxlID0gJyc7XG4gICAgXG4gICAgaWYgKCFpc01vYmlsZSlcbiAgICAgICAgdGV4dC5zdHlsZS5mb250U2l6ZSA9IFwiMXB4XCI7XG5cbiAgICB2YXIgY29tbWFuZE1vZGUgPSBmYWxzZTtcbiAgICB2YXIgaWdub3JlRm9jdXNFdmVudHMgPSBmYWxzZTtcbiAgICBcbiAgICB2YXIgbGFzdFZhbHVlID0gXCJcIjtcbiAgICB2YXIgbGFzdFNlbGVjdGlvblN0YXJ0ID0gMDtcbiAgICB2YXIgbGFzdFNlbGVjdGlvbkVuZCA9IDA7XG4gICAgdmFyIGxhc3RSZXN0b3JlRW5kID0gMDtcbiAgICBcbiAgICAvLyBGT0NVU1xuICAgIC8vIGllOSB0aHJvd3MgZXJyb3IgaWYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBpcyBhY2Nlc3NlZCB0b28gc29vblxuICAgIHRyeSB7IHZhciBpc0ZvY3VzZWQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSB0ZXh0OyB9IGNhdGNoKGUpIHt9XG5cbiAgICB0aGlzLnNldEFyaWFPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5hY3RpdmVEZXNjZW5kYW50KSB7XG4gICAgICAgICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImFyaWEtaGFzcG9wdXBcIiwgXCJ0cnVlXCIpO1xuICAgICAgICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWF1dG9jb21wbGV0ZVwiLCBcImxpc3RcIik7XG4gICAgICAgICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImFyaWEtYWN0aXZlZGVzY2VuZGFudFwiLCBvcHRpb25zLmFjdGl2ZURlc2NlbmRhbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhhc3BvcHVwXCIsIFwiZmFsc2VcIik7XG4gICAgICAgICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImFyaWEtYXV0b2NvbXBsZXRlXCIsIFwiYm90aFwiKTtcbiAgICAgICAgICAgIHRleHQucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1hY3RpdmVkZXNjZW5kYW50XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnJvbGUpIHtcbiAgICAgICAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBvcHRpb25zLnJvbGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNldEFyaWFPcHRpb25zKHtyb2xlOiBcInRleHRib3hcIn0pO1xuXG4gICAgZXZlbnQuYWRkTGlzdGVuZXIodGV4dCwgXCJibHVyXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGlnbm9yZUZvY3VzRXZlbnRzKSByZXR1cm47XG4gICAgICAgIGhvc3Qub25CbHVyKGUpO1xuICAgICAgICBpc0ZvY3VzZWQgPSBmYWxzZTtcbiAgICB9LCBob3N0KTtcbiAgICBldmVudC5hZGRMaXN0ZW5lcih0ZXh0LCBcImZvY3VzXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGlnbm9yZUZvY3VzRXZlbnRzKSByZXR1cm47XG4gICAgICAgIGlzRm9jdXNlZCA9IHRydWU7XG4gICAgICAgIGlmICh1c2VyYWdlbnQuaXNFZGdlKSB7XG4gICAgICAgICAgICAvLyBvbiBlZGdlIGZvY3VzIGV2ZW50IGlzIGZpcmVkIGV2ZW4gaWYgZG9jdW1lbnQgaXRzZWxmIGlzIG5vdCBmb2N1c2VkXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghZG9jdW1lbnQuaGFzRm9jdXMoKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICB9XG4gICAgICAgIGhvc3Qub25Gb2N1cyhlKTtcbiAgICAgICAgaWYgKHVzZXJhZ2VudC5pc0VkZ2UpXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHJlc2V0U2VsZWN0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzZXRTZWxlY3Rpb24oKTtcbiAgICB9LCBob3N0KTtcbiAgICB0aGlzLiRmb2N1c1Njcm9sbCA9IGZhbHNlO1xuICAgIHRoaXMuZm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRlbXBTdHlsZSB8fCBIQVNfRk9DVVNfQVJHUyB8fCB0aGlzLiRmb2N1c1Njcm9sbCA9PSBcImJyb3dzZXJcIilcbiAgICAgICAgICAgIHJldHVybiB0ZXh0LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcblxuICAgICAgICB2YXIgdG9wID0gdGV4dC5zdHlsZS50b3A7XG4gICAgICAgIHRleHQuc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gICAgICAgIHRleHQuc3R5bGUudG9wID0gXCIwcHhcIjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBpc1RyYW5zZm9ybWVkID0gdGV4dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgIT0gMDtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3Qgb24gSUUgdGhyb3dzIGVycm9yIGlmIGVsZW1lbnQgaXMgbm90IGluIHRoZSBkb20gdHJlZVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcbiAgICAgICAgaWYgKGlzVHJhbnNmb3JtZWQpIHtcbiAgICAgICAgICAgIHZhciB0ID0gdGV4dC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgd2hpbGUgKHQgJiYgdC5ub2RlVHlwZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgYW5jZXN0b3JzLnB1c2godCk7XG4gICAgICAgICAgICAgICAgdC5zZXRBdHRyaWJ1dGUoXCJhY2Vfbm9jb250ZXh0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGlmICghdC5wYXJlbnRFbGVtZW50ICYmIHQuZ2V0Um9vdE5vZGUpXG4gICAgICAgICAgICAgICAgICAgIHQgPSB0LmdldFJvb3ROb2RlKCkuaG9zdDtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHQgPSB0LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGV4dC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG4gICAgICAgIGlmIChpc1RyYW5zZm9ybWVkKSB7XG4gICAgICAgICAgICBhbmNlc3RvcnMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICAgICAgcC5yZW1vdmVBdHRyaWJ1dGUoXCJhY2Vfbm9jb250ZXh0XCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRleHQuc3R5bGUucG9zaXRpb24gPSBcIlwiO1xuICAgICAgICAgICAgaWYgKHRleHQuc3R5bGUudG9wID09IFwiMHB4XCIpXG4gICAgICAgICAgICAgICAgdGV4dC5zdHlsZS50b3AgPSB0b3A7XG4gICAgICAgIH0sIDApO1xuICAgIH07XG4gICAgdGhpcy5ibHVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRleHQuYmx1cigpO1xuICAgIH07XG4gICAgdGhpcy5pc0ZvY3VzZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGlzRm9jdXNlZDtcbiAgICB9O1xuICAgIFxuICAgIGhvc3Qub24oXCJiZWZvcmVFbmRPcGVyYXRpb25cIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjdXJPcCA9IGhvc3QuY3VyT3A7XG4gICAgICAgIHZhciBjb21tYW5kTmFtZSA9IGN1ck9wICYmIGN1ck9wLmNvbW1hbmQgJiYgY3VyT3AuY29tbWFuZC5uYW1lO1xuICAgICAgICBpZiAoY29tbWFuZE5hbWUgPT0gXCJpbnNlcnRzdHJpbmdcIilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGlzVXNlckFjdGlvbiA9IGNvbW1hbmROYW1lICYmIChjdXJPcC5kb2NDaGFuZ2VkIHx8IGN1ck9wLnNlbGVjdGlvbkNoYW5nZWQpO1xuICAgICAgICBpZiAoaW5Db21wb3NpdGlvbiAmJiBpc1VzZXJBY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIGV4aXQgY29tcG9zaXRpb24gZnJvbSBjb21tYW5kcyBvdGhlciB0aGFuIGluc2VydHN0cmluZ1xuICAgICAgICAgICAgbGFzdFZhbHVlID0gdGV4dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3luYyB2YWx1ZSBvZiB0ZXh0YXJlYVxuICAgICAgICByZXNldFNlbGVjdGlvbigpO1xuICAgIH0pO1xuICAgIFxuICAgIHZhciByZXNldFNlbGVjdGlvbiA9IGlzSU9TXG4gICAgPyBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIWlzRm9jdXNlZCB8fCAoY29waWVkICYmICF2YWx1ZSkgfHwgc2VuZGluZ1RleHQpIHJldHVybjtcbiAgICAgICAgaWYgKCF2YWx1ZSkgXG4gICAgICAgICAgICB2YWx1ZSA9IFwiXCI7XG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IFwiXFxuIGFiXCIgKyB2YWx1ZSArIFwiY2RlIGZnXFxuXCI7XG4gICAgICAgIGlmIChuZXdWYWx1ZSAhPSB0ZXh0LnZhbHVlKVxuICAgICAgICAgICAgdGV4dC52YWx1ZSA9IGxhc3RWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGVjdGlvblN0YXJ0ID0gNDtcbiAgICAgICAgdmFyIHNlbGVjdGlvbkVuZCA9IDQgKyAodmFsdWUubGVuZ3RoIHx8IChob3N0LnNlbGVjdGlvbi5pc0VtcHR5KCkgPyAwIDogMSkpO1xuXG4gICAgICAgIGlmIChsYXN0U2VsZWN0aW9uU3RhcnQgIT0gc2VsZWN0aW9uU3RhcnQgfHwgbGFzdFNlbGVjdGlvbkVuZCAhPSBzZWxlY3Rpb25FbmQpIHtcbiAgICAgICAgICAgIHRleHQuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdFNlbGVjdGlvblN0YXJ0ID0gc2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgIGxhc3RTZWxlY3Rpb25FbmQgPSBzZWxlY3Rpb25FbmQ7XG4gICAgfVxuICAgIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpbkNvbXBvc2l0aW9uIHx8IHNlbmRpbmdUZXh0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyBtb2RpZnlpbmcgc2VsZWN0aW9uIG9mIGJsdXJlZCB0ZXh0YXJlYSBjYW4gZm9jdXMgaXQgKGNocm9tZSBtYWMvbGludXgpXG4gICAgICAgIGlmICghaXNGb2N1c2VkICYmICFhZnRlckNvbnRleHRNZW51KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyB0aGlzIHByZXZlbnRzIGluZmluaXRlIHJlY3Vyc2lvbiBvbiBzYWZhcmkgOCBcbiAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hamF4b3JnL2FjZS9pc3N1ZXMvMjExNFxuICAgICAgICBpbkNvbXBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxlY3Rpb25TdGFydCA9IDA7XG4gICAgICAgIHZhciBzZWxlY3Rpb25FbmQgPSAwO1xuICAgICAgICB2YXIgbGluZSA9IFwiXCI7XG5cbiAgICAgICAgaWYgKGhvc3Quc2Vzc2lvbikge1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGhvc3Quc2VsZWN0aW9uO1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlKCk7XG4gICAgICAgICAgICB2YXIgcm93ID0gc2VsZWN0aW9uLmN1cnNvci5yb3c7XG4gICAgICAgICAgICBzZWxlY3Rpb25TdGFydCA9IHJhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgICAgIHNlbGVjdGlvbkVuZCA9IHJhbmdlLmVuZC5jb2x1bW47XG4gICAgICAgICAgICBsaW5lID0gaG9zdC5zZXNzaW9uLmdldExpbmUocm93KTtcblxuICAgICAgICAgICAgaWYgKHJhbmdlLnN0YXJ0LnJvdyAhPSByb3cpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJldkxpbmUgPSBob3N0LnNlc3Npb24uZ2V0TGluZShyb3cgLSAxKTtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25TdGFydCA9IHJhbmdlLnN0YXJ0LnJvdyA8IHJvdyAtIDEgPyAwIDogc2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uRW5kICs9IHByZXZMaW5lLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgbGluZSA9IHByZXZMaW5lICsgXCJcXG5cIiArIGxpbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChyYW5nZS5lbmQucm93ICE9IHJvdykge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0TGluZSA9IGhvc3Quc2Vzc2lvbi5nZXRMaW5lKHJvdyArIDEpO1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbkVuZCA9IHJhbmdlLmVuZC5yb3cgPiByb3cgICsgMSA/IG5leHRMaW5lLmxlbmd0aCA6IHNlbGVjdGlvbkVuZDtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25FbmQgKz0gbGluZS5sZW5ndGggKyAxO1xuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lICsgXCJcXG5cIiArIG5leHRMaW5lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNNb2JpbGUgJiYgcm93ID4gMCkge1xuICAgICAgICAgICAgICAgIGxpbmUgPSBcIlxcblwiICsgbGluZTtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25FbmQgKz0gMTtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25TdGFydCArPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGluZS5sZW5ndGggPiBNQVhfTElORV9MRU5HVEgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0aW9uU3RhcnQgPCBNQVhfTElORV9MRU5HVEggJiYgc2VsZWN0aW9uRW5kIDwgTUFYX0xJTkVfTEVOR1RIKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnNsaWNlKDAsIE1BWF9MSU5FX0xFTkdUSCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IFwiXFxuXCI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3Rpb25TdGFydCA9PSBzZWxlY3Rpb25FbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YXJ0ID0gc2VsZWN0aW9uRW5kID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YXJ0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbkVuZCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmV3VmFsdWUgPSBsaW5lICsgXCJcXG5cXG5cIjtcbiAgICAgICAgaWYgKG5ld1ZhbHVlICE9IGxhc3RWYWx1ZSkge1xuICAgICAgICAgICAgdGV4dC52YWx1ZSA9IGxhc3RWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgbGFzdFNlbGVjdGlvblN0YXJ0ID0gbGFzdFNlbGVjdGlvbkVuZCA9IG5ld1ZhbHVlLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gY29udGV4dG1lbnUgb24gbWFjIG1heSBjaGFuZ2UgdGhlIHNlbGVjdGlvblxuICAgICAgICBpZiAoYWZ0ZXJDb250ZXh0TWVudSkge1xuICAgICAgICAgICAgbGFzdFNlbGVjdGlvblN0YXJ0ID0gdGV4dC5zZWxlY3Rpb25TdGFydDtcbiAgICAgICAgICAgIGxhc3RTZWxlY3Rpb25FbmQgPSB0ZXh0LnNlbGVjdGlvbkVuZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvbiBmaXJlZm94IHRoaXMgdGhyb3dzIGlmIHRleHRhcmVhIGlzIGhpZGRlblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBsYXN0U2VsZWN0aW9uRW5kICE9IHNlbGVjdGlvbkVuZCBcbiAgICAgICAgICAgIHx8IGxhc3RTZWxlY3Rpb25TdGFydCAhPSBzZWxlY3Rpb25TdGFydCBcbiAgICAgICAgICAgIHx8IHRleHQuc2VsZWN0aW9uRW5kICE9IGxhc3RTZWxlY3Rpb25FbmQgLy8gb24gaWUgZWRnZSBzZWxlY3Rpb25FbmQgY2hhbmdlcyBzaWxlbnRseSBhZnRlciB0aGUgaW5pdGlhbGl6YXRpb25cbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRleHQuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZCk7XG4gICAgICAgICAgICAgICAgbGFzdFNlbGVjdGlvblN0YXJ0ID0gc2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgICAgICAgICAgbGFzdFNlbGVjdGlvbkVuZCA9IHNlbGVjdGlvbkVuZDtcbiAgICAgICAgICAgIH0gY2F0Y2goZSl7fVxuICAgICAgICB9XG4gICAgICAgIGluQ29tcG9zaXRpb24gPSBmYWxzZTtcbiAgICB9O1xuICAgIHRoaXMucmVzZXRTZWxlY3Rpb24gPSByZXNldFNlbGVjdGlvbjtcblxuICAgIGlmIChpc0ZvY3VzZWQpXG4gICAgICAgIGhvc3Qub25Gb2N1cygpO1xuXG5cbiAgICB2YXIgaXNBbGxTZWxlY3RlZCA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRleHQuc2VsZWN0aW9uU3RhcnQgPT09IDAgJiYgdGV4dC5zZWxlY3Rpb25FbmQgPj0gbGFzdFZhbHVlLmxlbmd0aFxuICAgICAgICAgICAgJiYgdGV4dC52YWx1ZSA9PT0gbGFzdFZhbHVlICYmIGxhc3RWYWx1ZVxuICAgICAgICAgICAgJiYgdGV4dC5zZWxlY3Rpb25FbmQgIT09IGxhc3RTZWxlY3Rpb25FbmQ7XG4gICAgfTtcblxuICAgIHZhciBvblNlbGVjdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGluQ29tcG9zaXRpb24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChjb3BpZWQpIHtcbiAgICAgICAgICAgIGNvcGllZCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGlzQWxsU2VsZWN0ZWQodGV4dCkpIHtcbiAgICAgICAgICAgIGhvc3Quc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICByZXNldFNlbGVjdGlvbigpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTW9iaWxlICYmIHRleHQuc2VsZWN0aW9uU3RhcnQgIT0gbGFzdFNlbGVjdGlvblN0YXJ0KSB7XG4gICAgICAgICAgICByZXNldFNlbGVjdGlvbigpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBpbnB1dEhhbmRsZXIgPSBudWxsO1xuICAgIHRoaXMuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24oY2IpIHtpbnB1dEhhbmRsZXIgPSBjYjt9O1xuICAgIHRoaXMuZ2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24oKSB7cmV0dXJuIGlucHV0SGFuZGxlcjt9O1xuICAgIHZhciBhZnRlckNvbnRleHRNZW51ID0gZmFsc2U7XG4gICAgXG4gICAgdmFyIHNlbmRUZXh0ID0gZnVuY3Rpb24odmFsdWUsIGZyb21JbnB1dCkge1xuICAgICAgICBpZiAoYWZ0ZXJDb250ZXh0TWVudSlcbiAgICAgICAgICAgIGFmdGVyQ29udGV4dE1lbnUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHBhc3RlZCkge1xuICAgICAgICAgICAgcmVzZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICBob3N0Lm9uUGFzdGUodmFsdWUpO1xuICAgICAgICAgICAgcGFzdGVkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3Rpb25TdGFydCA9IHRleHQuc2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uRW5kID0gdGV4dC5zZWxlY3Rpb25FbmQ7XG4gICAgICAgIFxuICAgICAgICAgICAgdmFyIGV4dGVuZExlZnQgPSBsYXN0U2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgICAgICB2YXIgZXh0ZW5kUmlnaHQgPSBsYXN0VmFsdWUubGVuZ3RoIC0gbGFzdFNlbGVjdGlvbkVuZDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGluc2VydGVkID0gdmFsdWU7XG4gICAgICAgICAgICB2YXIgcmVzdG9yZVN0YXJ0ID0gdmFsdWUubGVuZ3RoIC0gc2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgICAgICB2YXIgcmVzdG9yZUVuZCA9IHZhbHVlLmxlbmd0aCAtIHNlbGVjdGlvbkVuZDtcbiAgICAgICAgXG4gICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoZXh0ZW5kTGVmdCA+IDAgJiYgbGFzdFZhbHVlW2ldID09IHZhbHVlW2ldKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGV4dGVuZExlZnQtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluc2VydGVkID0gaW5zZXJ0ZWQuc2xpY2UoaSk7XG4gICAgICAgICAgICBpID0gMTtcbiAgICAgICAgICAgIHdoaWxlIChleHRlbmRSaWdodCA+IDAgJiYgbGFzdFZhbHVlLmxlbmd0aCAtIGkgPiBsYXN0U2VsZWN0aW9uU3RhcnQgLSAxICAmJiBsYXN0VmFsdWVbbGFzdFZhbHVlLmxlbmd0aCAtIGldID09IHZhbHVlW3ZhbHVlLmxlbmd0aCAtIGldKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGV4dGVuZFJpZ2h0LS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN0b3JlU3RhcnQgLT0gaS0xO1xuICAgICAgICAgICAgcmVzdG9yZUVuZCAtPSBpLTE7XG4gICAgICAgICAgICB2YXIgZW5kSW5kZXggPSBpbnNlcnRlZC5sZW5ndGggLSBpICsgMTtcbiAgICAgICAgICAgIGlmIChlbmRJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBleHRlbmRMZWZ0ID0gLWVuZEluZGV4O1xuICAgICAgICAgICAgICAgIGVuZEluZGV4ID0gMDtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICBpbnNlcnRlZCA9IGluc2VydGVkLnNsaWNlKDAsIGVuZEluZGV4KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY29tcG9zaXRpb24gdXBkYXRlIGNhbiBiZSBjYWxsZWQgd2l0aG91dCBhbnkgY2hhbmdlXG4gICAgICAgICAgICBpZiAoIWZyb21JbnB1dCAmJiAhaW5zZXJ0ZWQgJiYgIXJlc3RvcmVTdGFydCAmJiAhZXh0ZW5kTGVmdCAmJiAhZXh0ZW5kUmlnaHQgJiYgIXJlc3RvcmVFbmQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICBzZW5kaW5nVGV4dCA9IHRydWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHNvbWUgYW5kcm9pZCBrZXlib2FyZHMgY29udmVydHMgdHdvIHNwYWNlcyBpbnRvIHNlbnRlbmNlIGVuZCwgd2hpY2ggaXMgbm90IHVzZWZ1bCBmb3IgY29kZVxuICAgICAgICAgICAgdmFyIHNob3VsZFJlc2V0ID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodXNlcmFnZW50LmlzQW5kcm9pZCAmJiBpbnNlcnRlZCA9PSBcIi4gXCIpIHtcbiAgICAgICAgICAgICAgICBpbnNlcnRlZCA9IFwiICBcIjtcbiAgICAgICAgICAgICAgICBzaG91bGRSZXNldCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpbnNlcnRlZCAmJiAhZXh0ZW5kTGVmdCAmJiAhZXh0ZW5kUmlnaHQgJiYgIXJlc3RvcmVTdGFydCAmJiAhcmVzdG9yZUVuZCB8fCBjb21tYW5kTW9kZSkge1xuICAgICAgICAgICAgICAgIGhvc3Qub25UZXh0SW5wdXQoaW5zZXJ0ZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBob3N0Lm9uVGV4dElucHV0KGluc2VydGVkLCB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZExlZnQ6IGV4dGVuZExlZnQsXG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZFJpZ2h0OiBleHRlbmRSaWdodCxcbiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZVN0YXJ0OiByZXN0b3JlU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIHJlc3RvcmVFbmQ6IHJlc3RvcmVFbmRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbmRpbmdUZXh0ID0gZmFsc2U7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxhc3RWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgbGFzdFNlbGVjdGlvblN0YXJ0ID0gc2VsZWN0aW9uU3RhcnQ7XG4gICAgICAgICAgICBsYXN0U2VsZWN0aW9uRW5kID0gc2VsZWN0aW9uRW5kO1xuICAgICAgICAgICAgbGFzdFJlc3RvcmVFbmQgPSByZXN0b3JlRW5kO1xuICAgICAgICAgICAgcmV0dXJuIHNob3VsZFJlc2V0ID8gXCJcXG5cIiA6IGluc2VydGVkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgb25JbnB1dCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGluQ29tcG9zaXRpb24pXG4gICAgICAgICAgICByZXR1cm4gb25Db21wb3NpdGlvblVwZGF0ZSgpO1xuICAgICAgICBpZiAoZSAmJiBlLmlucHV0VHlwZSkge1xuICAgICAgICAgICAgaWYgKGUuaW5wdXRUeXBlID09IFwiaGlzdG9yeVVuZG9cIikgcmV0dXJuIGhvc3QuZXhlY0NvbW1hbmQoXCJ1bmRvXCIpO1xuICAgICAgICAgICAgaWYgKGUuaW5wdXRUeXBlID09IFwiaGlzdG9yeVJlZG9cIikgcmV0dXJuIGhvc3QuZXhlY0NvbW1hbmQoXCJyZWRvXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0gdGV4dC52YWx1ZTtcbiAgICAgICAgdmFyIGluc2VydGVkID0gc2VuZFRleHQoZGF0YSwgdHJ1ZSk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGRhdGEubGVuZ3RoID4gTUFYX0xJTkVfTEVOR1RIICsgMTAwIFxuICAgICAgICAgICAgfHwgdmFsdWVSZXNldFJlZ2V4LnRlc3QoaW5zZXJ0ZWQpXG4gICAgICAgICAgICB8fCBpc01vYmlsZSAmJiBsYXN0U2VsZWN0aW9uU3RhcnQgPCAxICYmIGxhc3RTZWxlY3Rpb25TdGFydCA9PSBsYXN0U2VsZWN0aW9uRW5kXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmVzZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgdmFyIGhhbmRsZUNsaXBib2FyZERhdGEgPSBmdW5jdGlvbihlLCBkYXRhLCBmb3JjZUlFTWltZSkge1xuICAgICAgICB2YXIgY2xpcGJvYXJkRGF0YSA9IGUuY2xpcGJvYXJkRGF0YSB8fCB3aW5kb3cuY2xpcGJvYXJkRGF0YTtcbiAgICAgICAgaWYgKCFjbGlwYm9hcmREYXRhIHx8IEJST0tFTl9TRVREQVRBKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyB1c2luZyBcIlRleHRcIiBkb2Vzbid0IHdvcmsgb24gb2xkIHdlYmtpdCBidXQgaWUgbmVlZHMgaXRcbiAgICAgICAgdmFyIG1pbWUgPSBVU0VfSUVfTUlNRV9UWVBFIHx8IGZvcmNlSUVNaW1lID8gXCJUZXh0XCIgOiBcInRleHQvcGxhaW5cIjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDUgaGFzIGNsaXBib2FyZERhdGEgb2JqZWN0LCBidXQgZG9lcyBub3QgaGFuZGxlIHNldERhdGEoKVxuICAgICAgICAgICAgICAgIHJldHVybiBjbGlwYm9hcmREYXRhLnNldERhdGEobWltZSwgZGF0YSkgIT09IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xpcGJvYXJkRGF0YS5nZXREYXRhKG1pbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIGlmICghZm9yY2VJRU1pbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZUNsaXBib2FyZERhdGEoZSwgZGF0YSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGRvQ29weSA9IGZ1bmN0aW9uKGUsIGlzQ3V0KSB7XG4gICAgICAgIHZhciBkYXRhID0gaG9zdC5nZXRDb3B5VGV4dCgpO1xuICAgICAgICBpZiAoIWRhdGEpXG4gICAgICAgICAgICByZXR1cm4gZXZlbnQucHJldmVudERlZmF1bHQoZSk7XG5cbiAgICAgICAgaWYgKGhhbmRsZUNsaXBib2FyZERhdGEoZSwgZGF0YSkpIHtcbiAgICAgICAgICAgIGlmIChpc0lPUykge1xuICAgICAgICAgICAgICAgIHJlc2V0U2VsZWN0aW9uKGRhdGEpO1xuICAgICAgICAgICAgICAgIGNvcGllZCA9IGRhdGE7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcGllZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlzQ3V0ID8gaG9zdC5vbkN1dCgpIDogaG9zdC5vbkNvcHkoKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29waWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRleHQudmFsdWUgPSBkYXRhO1xuICAgICAgICAgICAgdGV4dC5zZWxlY3QoKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBjb3BpZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXNldFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIGlzQ3V0ID8gaG9zdC5vbkN1dCgpIDogaG9zdC5vbkNvcHkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB2YXIgb25DdXQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGRvQ29weShlLCB0cnVlKTtcbiAgICB9O1xuICAgIFxuICAgIHZhciBvbkNvcHkgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGRvQ29weShlLCBmYWxzZSk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgb25QYXN0ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBoYW5kbGVDbGlwYm9hcmREYXRhKGUpO1xuICAgICAgICBpZiAoY2xpcGJvYXJkLnBhc3RlQ2FuY2VsbGVkKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAoZGF0YSlcbiAgICAgICAgICAgICAgICBob3N0Lm9uUGFzdGUoZGF0YSwgZSk7XG4gICAgICAgICAgICBpZiAodXNlcmFnZW50LmlzSUUpXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNldFNlbGVjdGlvbik7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdChlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRleHQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgcGFzdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBldmVudC5hZGRDb21tYW5kS2V5TGlzdGVuZXIodGV4dCwgaG9zdC5vbkNvbW1hbmRLZXkuYmluZChob3N0KSwgaG9zdCk7XG5cbiAgICBldmVudC5hZGRMaXN0ZW5lcih0ZXh0LCBcInNlbGVjdFwiLCBvblNlbGVjdCwgaG9zdCk7XG4gICAgZXZlbnQuYWRkTGlzdGVuZXIodGV4dCwgXCJpbnB1dFwiLCBvbklucHV0LCBob3N0KTtcblxuICAgIGV2ZW50LmFkZExpc3RlbmVyKHRleHQsIFwiY3V0XCIsIG9uQ3V0LCBob3N0KTtcbiAgICBldmVudC5hZGRMaXN0ZW5lcih0ZXh0LCBcImNvcHlcIiwgb25Db3B5LCBob3N0KTtcbiAgICBldmVudC5hZGRMaXN0ZW5lcih0ZXh0LCBcInBhc3RlXCIsIG9uUGFzdGUsIGhvc3QpO1xuXG5cbiAgICAvLyBPcGVyYSBoYXMgbm8gY2xpcGJvYXJkIGV2ZW50c1xuICAgIGlmICghKCdvbmN1dCcgaW4gdGV4dCkgfHwgISgnb25jb3B5JyBpbiB0ZXh0KSB8fCAhKCdvbnBhc3RlJyBpbiB0ZXh0KSkge1xuICAgICAgICBldmVudC5hZGRMaXN0ZW5lcihwYXJlbnROb2RlLCBcImtleWRvd25cIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKCh1c2VyYWdlbnQuaXNNYWMgJiYgIWUubWV0YUtleSkgfHwgIWUuY3RybEtleSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSA2NzpcbiAgICAgICAgICAgICAgICAgICAgb25Db3B5KGUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDg2OlxuICAgICAgICAgICAgICAgICAgICBvblBhc3RlKGUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDg4OlxuICAgICAgICAgICAgICAgICAgICBvbkN1dChlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGhvc3QpO1xuICAgIH1cblxuXG4gICAgLy8gQ09NUE9TSVRJT05cbiAgICB2YXIgb25Db21wb3NpdGlvblN0YXJ0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoaW5Db21wb3NpdGlvbiB8fCAhaG9zdC5vbkNvbXBvc2l0aW9uU3RhcnQgfHwgaG9zdC4kcmVhZE9ubHkpIFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaW5Db21wb3NpdGlvbiA9IHt9O1xuXG4gICAgICAgIGlmIChjb21tYW5kTW9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGlmIChlLmRhdGEpXG4gICAgICAgICAgICBpbkNvbXBvc2l0aW9uLnVzZVRleHRhcmVhRm9ySU1FID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KG9uQ29tcG9zaXRpb25VcGRhdGUsIDApO1xuICAgICAgICBob3N0Ll9zaWduYWwoXCJjb21wb3NpdGlvblN0YXJ0XCIpO1xuICAgICAgICBob3N0Lm9uKFwibW91c2Vkb3duXCIsIGNhbmNlbENvbXBvc2l0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHZhciByYW5nZSA9IGhvc3QuZ2V0U2VsZWN0aW9uUmFuZ2UoKTtcbiAgICAgICAgcmFuZ2UuZW5kLnJvdyA9IHJhbmdlLnN0YXJ0LnJvdztcbiAgICAgICAgcmFuZ2UuZW5kLmNvbHVtbiA9IHJhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgaW5Db21wb3NpdGlvbi5tYXJrZXJSYW5nZSA9IHJhbmdlO1xuICAgICAgICBpbkNvbXBvc2l0aW9uLnNlbGVjdGlvblN0YXJ0ID0gbGFzdFNlbGVjdGlvblN0YXJ0O1xuICAgICAgICBob3N0Lm9uQ29tcG9zaXRpb25TdGFydChpbkNvbXBvc2l0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbkNvbXBvc2l0aW9uLnVzZVRleHRhcmVhRm9ySU1FKSB7XG4gICAgICAgICAgICBsYXN0VmFsdWUgPSB0ZXh0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgICAgIGxhc3RTZWxlY3Rpb25TdGFydCA9IDA7XG4gICAgICAgICAgICBsYXN0U2VsZWN0aW9uRW5kID0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0ZXh0Lm1zR2V0SW5wdXRDb250ZXh0KVxuICAgICAgICAgICAgICAgIGluQ29tcG9zaXRpb24uY29udGV4dCA9IHRleHQubXNHZXRJbnB1dENvbnRleHQoKTtcbiAgICAgICAgICAgIGlmICh0ZXh0LmdldElucHV0Q29udGV4dClcbiAgICAgICAgICAgICAgICBpbkNvbXBvc2l0aW9uLmNvbnRleHQgPSB0ZXh0LmdldElucHV0Q29udGV4dCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBvbkNvbXBvc2l0aW9uVXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghaW5Db21wb3NpdGlvbiB8fCAhaG9zdC5vbkNvbXBvc2l0aW9uVXBkYXRlIHx8IGhvc3QuJHJlYWRPbmx5KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoY29tbWFuZE1vZGUpXG4gICAgICAgICAgICByZXR1cm4gY2FuY2VsQ29tcG9zaXRpb24oKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbkNvbXBvc2l0aW9uLnVzZVRleHRhcmVhRm9ySU1FKSB7XG4gICAgICAgICAgICBob3N0Lm9uQ29tcG9zaXRpb25VcGRhdGUodGV4dC52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHRleHQudmFsdWU7XG4gICAgICAgICAgICBzZW5kVGV4dChkYXRhKTtcbiAgICAgICAgICAgIGlmIChpbkNvbXBvc2l0aW9uLm1hcmtlclJhbmdlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluQ29tcG9zaXRpb24uY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBpbkNvbXBvc2l0aW9uLm1hcmtlclJhbmdlLnN0YXJ0LmNvbHVtbiA9IGluQ29tcG9zaXRpb24uc2VsZWN0aW9uU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgID0gaW5Db21wb3NpdGlvbi5jb250ZXh0LmNvbXBvc2l0aW9uU3RhcnRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluQ29tcG9zaXRpb24ubWFya2VyUmFuZ2UuZW5kLmNvbHVtbiA9IGluQ29tcG9zaXRpb24ubWFya2VyUmFuZ2Uuc3RhcnQuY29sdW1uXG4gICAgICAgICAgICAgICAgICAgICsgbGFzdFNlbGVjdGlvbkVuZCAtIGluQ29tcG9zaXRpb24uc2VsZWN0aW9uU3RhcnQgKyBsYXN0UmVzdG9yZUVuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgb25Db21wb3NpdGlvbkVuZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFob3N0Lm9uQ29tcG9zaXRpb25FbmQgfHwgaG9zdC4kcmVhZE9ubHkpIHJldHVybjtcbiAgICAgICAgaW5Db21wb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICBob3N0Lm9uQ29tcG9zaXRpb25FbmQoKTtcbiAgICAgICAgaG9zdC5vZmYoXCJtb3VzZWRvd25cIiwgY2FuY2VsQ29tcG9zaXRpb24pO1xuICAgICAgICAvLyBub3RlIHRoYXQgcmVzZXR0aW5nIHZhbHVlIG9mIHRleHRhcmVhIGF0IHRoaXMgcG9pbnQgZG9lc24ndCBhbHdheXMgd29ya1xuICAgICAgICAvLyBiZWNhdXNlIHRleHRhcmVhIHZhbHVlIGNhbiBiZSBzaWxlbnRseSByZXN0b3JlZFxuICAgICAgICBpZiAoZSkgb25JbnB1dCgpO1xuICAgIH07XG4gICAgXG5cbiAgICBmdW5jdGlvbiBjYW5jZWxDb21wb3NpdGlvbigpIHtcbiAgICAgICAgLy8gZm9yY2UgZW5kIGNvbXBvc2l0aW9uXG4gICAgICAgIGlnbm9yZUZvY3VzRXZlbnRzID0gdHJ1ZTtcbiAgICAgICAgdGV4dC5ibHVyKCk7XG4gICAgICAgIHRleHQuZm9jdXMoKTtcbiAgICAgICAgaWdub3JlRm9jdXNFdmVudHMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3luY0NvbXBvc2l0aW9uID0gbGFuZy5kZWxheWVkQ2FsbChvbkNvbXBvc2l0aW9uVXBkYXRlLCA1MCkuc2NoZWR1bGUuYmluZChudWxsLCBudWxsKTtcbiAgICBcbiAgICBmdW5jdGlvbiBvbktleXVwKGUpIHtcbiAgICAgICAgLy8gd29ya2Fyb3VuZCBmb3IgYSBidWcgaW4gaWUgd2hlcmUgcHJlc3NpbmcgZXNjIHNpbGVudGx5IG1vdmVzIHNlbGVjdGlvbiBvdXQgb2YgdGV4dGFyZWFcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNyAmJiB0ZXh0LnZhbHVlLmxlbmd0aCA8IHRleHQuc2VsZWN0aW9uU3RhcnQpIHtcbiAgICAgICAgICAgIGlmICghaW5Db21wb3NpdGlvbilcbiAgICAgICAgICAgICAgICBsYXN0VmFsdWUgPSB0ZXh0LnZhbHVlO1xuICAgICAgICAgICAgbGFzdFNlbGVjdGlvblN0YXJ0ID0gbGFzdFNlbGVjdGlvbkVuZCA9IC0xO1xuICAgICAgICAgICAgcmVzZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBzeW5jQ29tcG9zaXRpb24oKTtcbiAgICB9XG5cbiAgICBldmVudC5hZGRMaXN0ZW5lcih0ZXh0LCBcImNvbXBvc2l0aW9uc3RhcnRcIiwgb25Db21wb3NpdGlvblN0YXJ0LCBob3N0KTtcbiAgICBldmVudC5hZGRMaXN0ZW5lcih0ZXh0LCBcImNvbXBvc2l0aW9udXBkYXRlXCIsIG9uQ29tcG9zaXRpb25VcGRhdGUsIGhvc3QpO1xuICAgIGV2ZW50LmFkZExpc3RlbmVyKHRleHQsIFwia2V5dXBcIiwgb25LZXl1cCwgaG9zdCk7XG4gICAgZXZlbnQuYWRkTGlzdGVuZXIodGV4dCwgXCJrZXlkb3duXCIsIHN5bmNDb21wb3NpdGlvbiwgaG9zdCk7XG4gICAgZXZlbnQuYWRkTGlzdGVuZXIodGV4dCwgXCJjb21wb3NpdGlvbmVuZFwiLCBvbkNvbXBvc2l0aW9uRW5kLCBob3N0KTtcblxuICAgIHRoaXMuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9O1xuICAgIFxuICAgIC8vIGFsbG93cyB0byBpZ25vcmUgY29tcG9zaXRpb24gKHVzZWQgYnkgdmltIGtleWJvYXJkIGhhbmRsZXIgaW4gdGhlIG5vcm1hbCBtb2RlKVxuICAgIC8vIHRoaXMgaXMgdXNlZnVsIG9uIG1hYywgd2hlcmUgd2l0aCBzb21lIGtleWJvYXJkIGxheW91dHMgKGUuZyBzd2VkaXNoKSBeIHN0YXJ0cyBjb21wb3NpdGlvblxuICAgIHRoaXMuc2V0Q29tbWFuZE1vZGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBjb21tYW5kTW9kZSA9IHZhbHVlO1xuICAgICAgICB0ZXh0LnJlYWRPbmx5ID0gZmFsc2U7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnNldFJlYWRPbmx5ID0gZnVuY3Rpb24ocmVhZE9ubHkpIHtcbiAgICAgICAgaWYgKCFjb21tYW5kTW9kZSlcbiAgICAgICAgICAgIHRleHQucmVhZE9ubHkgPSByZWFkT25seTtcbiAgICB9O1xuXG4gICAgdGhpcy5zZXRDb3B5V2l0aEVtcHR5U2VsZWN0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkNvbnRleHRNZW51ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBhZnRlckNvbnRleHRNZW51ID0gdHJ1ZTtcbiAgICAgICAgcmVzZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgaG9zdC5fZW1pdChcIm5hdGl2ZWNvbnRleHRtZW51XCIsIHt0YXJnZXQ6IGhvc3QsIGRvbUV2ZW50OiBlfSk7XG4gICAgICAgIHRoaXMubW92ZVRvTW91c2UoZSwgdHJ1ZSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLm1vdmVUb01vdXNlID0gZnVuY3Rpb24oZSwgYnJpbmdUb0Zyb250KSB7XG4gICAgICAgIGlmICghdGVtcFN0eWxlKVxuICAgICAgICAgICAgdGVtcFN0eWxlID0gdGV4dC5zdHlsZS5jc3NUZXh0O1xuICAgICAgICB0ZXh0LnN0eWxlLmNzc1RleHQgPSAoYnJpbmdUb0Zyb250ID8gXCJ6LWluZGV4OjEwMDAwMDtcIiA6IFwiXCIpXG4gICAgICAgICAgICArICh1c2VyYWdlbnQuaXNJRSA/IFwib3BhY2l0eTowLjE7XCIgOiBcIlwiKVxuICAgICAgICAgICAgKyBcInRleHQtaW5kZW50OiAtXCIgKyAobGFzdFNlbGVjdGlvblN0YXJ0ICsgbGFzdFNlbGVjdGlvbkVuZCkgKiBob3N0LnJlbmRlcmVyLmNoYXJhY3RlcldpZHRoICogMC41ICsgXCJweDtcIjtcblxuICAgICAgICB2YXIgcmVjdCA9IGhvc3QuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgc3R5bGUgPSBkb20uY29tcHV0ZWRTdHlsZShob3N0LmNvbnRhaW5lcik7XG4gICAgICAgIHZhciB0b3AgPSByZWN0LnRvcCArIChwYXJzZUludChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgfHwgMCk7XG4gICAgICAgIHZhciBsZWZ0ID0gcmVjdC5sZWZ0ICsgKHBhcnNlSW50KHJlY3QuYm9yZGVyTGVmdFdpZHRoKSB8fCAwKTtcbiAgICAgICAgdmFyIG1heFRvcCA9IHJlY3QuYm90dG9tIC0gdG9wIC0gdGV4dC5jbGllbnRIZWlnaHQgLTI7XG4gICAgICAgIHZhciBtb3ZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZG9tLnRyYW5zbGF0ZSh0ZXh0LCBlLmNsaWVudFggLSBsZWZ0IC0gMiwgTWF0aC5taW4oZS5jbGllbnRZIC0gdG9wIC0gMiwgbWF4VG9wKSk7XG4gICAgICAgIH07IFxuICAgICAgICBtb3ZlKGUpO1xuXG4gICAgICAgIGlmIChlLnR5cGUgIT0gXCJtb3VzZWRvd25cIilcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBob3N0LnJlbmRlcmVyLiRpc01vdXNlUHJlc3NlZCA9IHRydWU7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZW91dCk7XG4gICAgICAgIC8vIG9uIHdpbmRvd3MgY29udGV4dCBtZW51IGlzIG9wZW5lZCBhZnRlciBtb3VzZXVwXG4gICAgICAgIGlmICh1c2VyYWdlbnQuaXNXaW4pXG4gICAgICAgICAgICBldmVudC5jYXB0dXJlKGhvc3QuY29udGFpbmVyLCBtb3ZlLCBvbkNvbnRleHRNZW51Q2xvc2UpO1xuICAgIH07XG5cbiAgICB0aGlzLm9uQ29udGV4dE1lbnVDbG9zZSA9IG9uQ29udGV4dE1lbnVDbG9zZTtcbiAgICB2YXIgY2xvc2VUaW1lb3V0O1xuICAgIGZ1bmN0aW9uIG9uQ29udGV4dE1lbnVDbG9zZSgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZW91dCk7XG4gICAgICAgIGNsb3NlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRlbXBTdHlsZSkge1xuICAgICAgICAgICAgICAgIHRleHQuc3R5bGUuY3NzVGV4dCA9IHRlbXBTdHlsZTtcbiAgICAgICAgICAgICAgICB0ZW1wU3R5bGUgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhvc3QucmVuZGVyZXIuJGlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoaG9zdC5yZW5kZXJlci4ka2VlcFRleHRBcmVhQXRDdXJzb3IpXG4gICAgICAgICAgICAgICAgaG9zdC5yZW5kZXJlci4kbW92ZVRleHRBcmVhVG9DdXJzb3IoKTtcbiAgICAgICAgfSwgMCk7XG4gICAgfVxuXG4gICAgdmFyIG9uQ29udGV4dE1lbnUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGhvc3QudGV4dElucHV0Lm9uQ29udGV4dE1lbnUoZSk7XG4gICAgICAgIG9uQ29udGV4dE1lbnVDbG9zZSgpO1xuICAgIH07XG4gICAgZXZlbnQuYWRkTGlzdGVuZXIodGV4dCwgXCJtb3VzZXVwXCIsIG9uQ29udGV4dE1lbnUsIGhvc3QpO1xuICAgIGV2ZW50LmFkZExpc3RlbmVyKHRleHQsIFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBvbkNvbnRleHRNZW51Q2xvc2UoKTtcbiAgICB9LCBob3N0KTtcbiAgICBldmVudC5hZGRMaXN0ZW5lcihob3N0LnJlbmRlcmVyLnNjcm9sbGVyLCBcImNvbnRleHRtZW51XCIsIG9uQ29udGV4dE1lbnUsIGhvc3QpO1xuICAgIGV2ZW50LmFkZExpc3RlbmVyKHRleHQsIFwiY29udGV4dG1lbnVcIiwgb25Db250ZXh0TWVudSwgaG9zdCk7XG4gICAgXG4gICAgaWYgKGlzSU9TKVxuICAgICAgICBhZGRJb3NTZWxlY3Rpb25IYW5kbGVyKHBhcmVudE5vZGUsIGhvc3QsIHRleHQpO1xuXG4gICAgZnVuY3Rpb24gYWRkSW9zU2VsZWN0aW9uSGFuZGxlcihwYXJlbnROb2RlLCBob3N0LCB0ZXh0KSB7XG4gICAgICAgIHZhciB0eXBpbmdSZXNldFRpbWVvdXQgPSBudWxsO1xuICAgICAgICB2YXIgdHlwaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGV4dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKHR5cGluZ1Jlc2V0VGltZW91dCkgY2xlYXJUaW1lb3V0KHR5cGluZ1Jlc2V0VGltZW91dCk7XG4gICAgICAgICAgICB0eXBpbmcgPSB0cnVlO1xuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICB0ZXh0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdHlwaW5nUmVzZXRUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9LCB0cnVlKTtcbiAgICBcbiAgICAgICAgLy8gSU9TIGRvZXNuJ3QgZmlyZSBldmVudHMgZm9yIGFycm93IGtleXMsIGJ1dCB0aGlzIHVuaXF1ZSBoYWNrIGNoYW5nZXMgZXZlcnl0aGluZyFcbiAgICAgICAgdmFyIGRldGVjdEFycm93S2V5cyA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0ZXh0KSByZXR1cm47XG4gICAgICAgICAgICBpZiAodHlwaW5nIHx8IGluQ29tcG9zaXRpb24gfHwgaG9zdC4kbW91c2VIYW5kbGVyLmlzTW91c2VQcmVzc2VkKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChjb3BpZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uU3RhcnQgPSB0ZXh0LnNlbGVjdGlvblN0YXJ0O1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbkVuZCA9IHRleHQuc2VsZWN0aW9uRW5kO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIga2V5ID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBtb2RpZmllciA9IDA7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25TdGFydCA9PSAwKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gS0VZUy51cDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0aW9uU3RhcnQgPT0gMSkge1xuICAgICAgICAgICAgICAgIGtleSA9IEtFWVMuaG9tZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0aW9uRW5kID4gbGFzdFNlbGVjdGlvbkVuZCAmJiBsYXN0VmFsdWVbc2VsZWN0aW9uRW5kXSA9PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gS0VZUy5lbmQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlbGVjdGlvblN0YXJ0IDwgbGFzdFNlbGVjdGlvblN0YXJ0ICYmIGxhc3RWYWx1ZVtzZWxlY3Rpb25TdGFydCAtIDFdID09IFwiIFwiKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gS0VZUy5sZWZ0O1xuICAgICAgICAgICAgICAgIG1vZGlmaWVyID0gTU9EUy5vcHRpb247XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YXJ0IDwgbGFzdFNlbGVjdGlvblN0YXJ0XG4gICAgICAgICAgICAgICAgfHwgKFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25TdGFydCA9PSBsYXN0U2VsZWN0aW9uU3RhcnQgXG4gICAgICAgICAgICAgICAgICAgICYmIGxhc3RTZWxlY3Rpb25FbmQgIT0gbGFzdFNlbGVjdGlvblN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICYmIHNlbGVjdGlvblN0YXJ0ID09IHNlbGVjdGlvbkVuZFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGtleSA9IEtFWVMubGVmdDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0aW9uRW5kID4gbGFzdFNlbGVjdGlvbkVuZCAmJiBsYXN0VmFsdWUuc2xpY2UoMCwgc2VsZWN0aW9uRW5kKS5zcGxpdChcIlxcblwiKS5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gS0VZUy5kb3duO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzZWxlY3Rpb25FbmQgPiBsYXN0U2VsZWN0aW9uRW5kICYmIGxhc3RWYWx1ZVtzZWxlY3Rpb25FbmQgLSAxXSA9PSBcIiBcIikge1xuICAgICAgICAgICAgICAgIGtleSA9IEtFWVMucmlnaHQ7XG4gICAgICAgICAgICAgICAgbW9kaWZpZXIgPSBNT0RTLm9wdGlvbjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uRW5kID4gbGFzdFNlbGVjdGlvbkVuZFxuICAgICAgICAgICAgICAgIHx8IChcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uRW5kID09IGxhc3RTZWxlY3Rpb25FbmQgXG4gICAgICAgICAgICAgICAgICAgICYmIGxhc3RTZWxlY3Rpb25FbmQgIT0gbGFzdFNlbGVjdGlvblN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICYmIHNlbGVjdGlvblN0YXJ0ID09IHNlbGVjdGlvbkVuZFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGtleSA9IEtFWVMucmlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25TdGFydCAhPT0gc2VsZWN0aW9uRW5kKVxuICAgICAgICAgICAgICAgIG1vZGlmaWVyIHw9IE1PRFMuc2hpZnQ7XG5cbiAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gaG9zdC5vbkNvbW1hbmRLZXkoe30sIG1vZGlmaWVyLCBrZXkpO1xuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0ICYmIGhvc3QuY29tbWFuZHMpIHtcbiAgICAgICAgICAgICAgICAgICAga2V5ID0gS0VZUy5rZXlDb2RlVG9TdHJpbmcoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1hbmQgPSBob3N0LmNvbW1hbmRzLmZpbmRLZXlDb21tYW5kKG1vZGlmaWVyLCBrZXkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWFuZClcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvc3QuZXhlY0NvbW1hbmQoY29tbWFuZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3RTZWxlY3Rpb25TdGFydCA9IHNlbGVjdGlvblN0YXJ0O1xuICAgICAgICAgICAgICAgIGxhc3RTZWxlY3Rpb25FbmQgPSBzZWxlY3Rpb25FbmQ7XG4gICAgICAgICAgICAgICAgcmVzZXRTZWxlY3Rpb24oXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIE9uIGlPUywgXCJzZWxlY3Rpb25jaGFuZ2VcIiBjYW4gb25seSBiZSBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgb2JqZWN0Li4uXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJzZWxlY3Rpb25jaGFuZ2VcIiwgZGV0ZWN0QXJyb3dLZXlzKTtcbiAgICAgICAgaG9zdC5vbihcImRlc3Ryb3lcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwic2VsZWN0aW9uY2hhbmdlXCIsIGRldGVjdEFycm93S2V5cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGV4dC5wYXJlbnRFbGVtZW50KVxuICAgICAgICAgICAgdGV4dC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRleHQpO1xuICAgIH07XG59O1xuXG5leHBvcnRzLlRleHRJbnB1dCA9IFRleHRJbnB1dDtcbmV4cG9ydHMuJHNldFVzZXJBZ2VudEZvclRlc3RzID0gZnVuY3Rpb24oX2lzTW9iaWxlLCBfaXNJT1MpIHtcbiAgICBpc01vYmlsZSA9IF9pc01vYmlsZTtcbiAgICBpc0lPUyA9IF9pc0lPUztcbn07XG4iLCJcIm5vIHVzZSBzdHJpY3RcIjtcblxudmFyIG9vcCA9IHJlcXVpcmUoXCIuL29vcFwiKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiLi9ldmVudF9lbWl0dGVyXCIpLkV2ZW50RW1pdHRlcjtcblxudmFyIG9wdGlvbnNQcm92aWRlciA9IHtcbiAgICBzZXRPcHRpb25zOiBmdW5jdGlvbihvcHRMaXN0KSB7XG4gICAgICAgIE9iamVjdC5rZXlzKG9wdExpc3QpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICB0aGlzLnNldE9wdGlvbihrZXksIG9wdExpc3Rba2V5XSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG4gICAgZ2V0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9uTmFtZXMpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICBpZiAoIW9wdGlvbk5hbWVzKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuJG9wdGlvbnM7XG4gICAgICAgICAgICBvcHRpb25OYW1lcyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpLmZpbHRlcihmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIW9wdGlvbnNba2V5XS5oaWRkZW47XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShvcHRpb25OYW1lcykpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IG9wdGlvbk5hbWVzO1xuICAgICAgICAgICAgb3B0aW9uTmFtZXMgPSBPYmplY3Qua2V5cyhyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbk5hbWVzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHRoaXMuZ2V0T3B0aW9uKGtleSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgc2V0T3B0aW9uOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgICBpZiAodGhpc1tcIiRcIiArIG5hbWVdID09PSB2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIG9wdCA9IHRoaXMuJG9wdGlvbnNbbmFtZV07XG4gICAgICAgIGlmICghb3B0KSB7XG4gICAgICAgICAgICByZXR1cm4gd2FybignbWlzc3BlbGxlZCBvcHRpb24gXCInICsgbmFtZSArICdcIicpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHQuZm9yd2FyZFRvKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbb3B0LmZvcndhcmRUb10gJiYgdGhpc1tvcHQuZm9yd2FyZFRvXS5zZXRPcHRpb24obmFtZSwgdmFsdWUpO1xuXG4gICAgICAgIGlmICghb3B0LmhhbmRsZXNTZXQpXG4gICAgICAgICAgICB0aGlzW1wiJFwiICsgbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgaWYgKG9wdCAmJiBvcHQuc2V0KVxuICAgICAgICAgICAgb3B0LnNldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICB9LFxuICAgIGdldE9wdGlvbjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB2YXIgb3B0ID0gdGhpcy4kb3B0aW9uc1tuYW1lXTtcbiAgICAgICAgaWYgKCFvcHQpIHtcbiAgICAgICAgICAgIHJldHVybiB3YXJuKCdtaXNzcGVsbGVkIG9wdGlvbiBcIicgKyBuYW1lICsgJ1wiJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdC5mb3J3YXJkVG8pXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tvcHQuZm9yd2FyZFRvXSAmJiB0aGlzW29wdC5mb3J3YXJkVG9dLmdldE9wdGlvbihuYW1lKTtcbiAgICAgICAgcmV0dXJuIG9wdCAmJiBvcHQuZ2V0ID8gb3B0LmdldC5jYWxsKHRoaXMpIDogdGhpc1tcIiRcIiArIG5hbWVdO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHdhcm4obWVzc2FnZSkge1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUud2FybilcbiAgICAgICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbmZ1bmN0aW9uIHJlcG9ydEVycm9yKG1zZywgZGF0YSkge1xuICAgIHZhciBlID0gbmV3IEVycm9yKG1zZyk7XG4gICAgZS5kYXRhID0gZGF0YTtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT0gXCJvYmplY3RcIiAmJiBjb25zb2xlLmVycm9yKVxuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGU7IH0pO1xufVxuXG52YXIgQXBwQ29uZmlnID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kZGVmYXVsdE9wdGlvbnMgPSB7fTtcbn07XG5cbihmdW5jdGlvbigpIHtcbiAgICAvLyBtb2R1bGUgbG9hZGluZ1xuICAgIG9vcC5pbXBsZW1lbnQodGhpcywgRXZlbnRFbWl0dGVyKTtcbiAgICAvKlxuICAgICAqIG9wdGlvbiB7bmFtZSwgdmFsdWUsIGluaXRpYWxWYWx1ZSwgc2V0dGVyTmFtZSwgc2V0LCBnZXQgfVxuICAgICAqL1xuICAgIHRoaXMuZGVmaW5lT3B0aW9ucyA9IGZ1bmN0aW9uKG9iaiwgcGF0aCwgb3B0aW9ucykge1xuICAgICAgICBpZiAoIW9iai4kb3B0aW9ucylcbiAgICAgICAgICAgIHRoaXMuJGRlZmF1bHRPcHRpb25zW3BhdGhdID0gb2JqLiRvcHRpb25zID0ge307XG5cbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIHZhciBvcHQgPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdCA9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgICAgIG9wdCA9IHtmb3J3YXJkVG86IG9wdH07XG5cbiAgICAgICAgICAgIG9wdC5uYW1lIHx8IChvcHQubmFtZSA9IGtleSk7XG4gICAgICAgICAgICBvYmouJG9wdGlvbnNbb3B0Lm5hbWVdID0gb3B0O1xuICAgICAgICAgICAgaWYgKFwiaW5pdGlhbFZhbHVlXCIgaW4gb3B0KVxuICAgICAgICAgICAgICAgIG9ialtcIiRcIiArIG9wdC5uYW1lXSA9IG9wdC5pbml0aWFsVmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGltcGxlbWVudCBvcHRpb24gcHJvdmlkZXIgaW50ZXJmYWNlXG4gICAgICAgIG9vcC5pbXBsZW1lbnQob2JqLCBvcHRpb25zUHJvdmlkZXIpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB0aGlzLnJlc2V0T3B0aW9ucyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICBPYmplY3Qua2V5cyhvYmouJG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICB2YXIgb3B0ID0gb2JqLiRvcHRpb25zW2tleV07XG4gICAgICAgICAgICBpZiAoXCJ2YWx1ZVwiIGluIG9wdClcbiAgICAgICAgICAgICAgICBvYmouc2V0T3B0aW9uKGtleSwgb3B0LnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuc2V0RGVmYXVsdFZhbHVlID0gZnVuY3Rpb24ocGF0aCwgbmFtZSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICBmb3IgKHBhdGggaW4gdGhpcy4kZGVmYXVsdE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuJGRlZmF1bHRPcHRpb25zW3BhdGhdW25hbWVdKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGlmICghdGhpcy4kZGVmYXVsdE9wdGlvbnNbcGF0aF1bbmFtZV0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRzID0gdGhpcy4kZGVmYXVsdE9wdGlvbnNbcGF0aF0gfHwgKHRoaXMuJGRlZmF1bHRPcHRpb25zW3BhdGhdID0ge30pO1xuICAgICAgICBpZiAob3B0c1tuYW1lXSkge1xuICAgICAgICAgICAgaWYgKG9wdHMuZm9yd2FyZFRvKVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0RGVmYXVsdFZhbHVlKG9wdHMuZm9yd2FyZFRvLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb3B0c1tuYW1lXS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuc2V0RGVmYXVsdFZhbHVlcyA9IGZ1bmN0aW9uKHBhdGgsIG9wdGlvbkhhc2gpIHtcbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9uSGFzaCkuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGVmYXVsdFZhbHVlKHBhdGgsIGtleSwgb3B0aW9uSGFzaFtrZXldKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLndhcm4gPSB3YXJuO1xuICAgIHRoaXMucmVwb3J0RXJyb3IgPSByZXBvcnRFcnJvcjtcbiAgICBcbn0pLmNhbGwoQXBwQ29uZmlnLnByb3RvdHlwZSk7XG5cbmV4cG9ydHMuQXBwQ29uZmlnID0gQXBwQ29uZmlnO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciB1c2VyYWdlbnQgPSByZXF1aXJlKFwiLi91c2VyYWdlbnRcIik7IFxudmFyIFhIVE1MX05TID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI7XG5cbmV4cG9ydHMuYnVpbGREb20gPSBmdW5jdGlvbiBidWlsZERvbShhcnIsIHBhcmVudCwgcmVmcykge1xuICAgIGlmICh0eXBlb2YgYXJyID09IFwic3RyaW5nXCIgJiYgYXJyKSB7XG4gICAgICAgIHZhciB0eHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShhcnIpO1xuICAgICAgICBpZiAocGFyZW50KVxuICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKHR4dCk7XG4gICAgICAgIHJldHVybiB0eHQ7XG4gICAgfVxuICAgIFxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgICAgIGlmIChhcnIgJiYgYXJyLmFwcGVuZENoaWxkICYmIHBhcmVudClcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChhcnIpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGFyclswXSAhPSBcInN0cmluZ1wiIHx8ICFhcnJbMF0pIHtcbiAgICAgICAgdmFyIGVscyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoID0gYnVpbGREb20oYXJyW2ldLCBwYXJlbnQsIHJlZnMpO1xuICAgICAgICAgICAgY2ggJiYgZWxzLnB1c2goY2gpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbHM7XG4gICAgfVxuICAgIFxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoYXJyWzBdKTtcbiAgICB2YXIgb3B0aW9ucyA9IGFyclsxXTtcbiAgICB2YXIgY2hpbGRJbmRleCA9IDE7XG4gICAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMgPT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShvcHRpb25zKSlcbiAgICAgICAgY2hpbGRJbmRleCA9IDI7XG4gICAgZm9yICh2YXIgaSA9IGNoaWxkSW5kZXg7IGkgPCBhcnIubGVuZ3RoOyBpKyspXG4gICAgICAgIGJ1aWxkRG9tKGFycltpXSwgZWwsIHJlZnMpO1xuICAgIGlmIChjaGlsZEluZGV4ID09IDIpIHtcbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gb3B0aW9uc1tuXTtcbiAgICAgICAgICAgIGlmIChuID09PSBcImNsYXNzXCIpIHtcbiAgICAgICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBBcnJheS5pc0FycmF5KHZhbCkgPyB2YWwuam9pbihcIiBcIikgOiB2YWw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT0gXCJmdW5jdGlvblwiIHx8IG4gPT0gXCJ2YWx1ZVwiIHx8IG5bMF0gPT0gXCIkXCIpIHtcbiAgICAgICAgICAgICAgICBlbFtuXSA9IHZhbDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobiA9PT0gXCJyZWZcIikge1xuICAgICAgICAgICAgICAgIGlmIChyZWZzKSByZWZzW3ZhbF0gPSBlbDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobiA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT0gXCJzdHJpbmdcIikgZWwuc3R5bGUuY3NzVGV4dCA9IHZhbDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUobiwgdmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYXJlbnQpXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gICAgcmV0dXJuIGVsO1xufTtcblxuZXhwb3J0cy5nZXREb2N1bWVudEhlYWQgPSBmdW5jdGlvbihkb2MpIHtcbiAgICBpZiAoIWRvYylcbiAgICAgICAgZG9jID0gZG9jdW1lbnQ7XG4gICAgcmV0dXJuIGRvYy5oZWFkIHx8IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0gfHwgZG9jLmRvY3VtZW50RWxlbWVudDtcbn07XG5cbmV4cG9ydHMuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHRhZywgbnMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TID9cbiAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucyB8fCBYSFRNTF9OUywgdGFnKSA6XG4gICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG59O1xuXG5leHBvcnRzLnJlbW92ZUNoaWxkcmVuID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gXCJcIjtcbn07XG5cbmV4cG9ydHMuY3JlYXRlVGV4dE5vZGUgPSBmdW5jdGlvbih0ZXh0Q29udGVudCwgZWxlbWVudCkge1xuICAgIHZhciBkb2MgPSBlbGVtZW50ID8gZWxlbWVudC5vd25lckRvY3VtZW50IDogZG9jdW1lbnQ7XG4gICAgcmV0dXJuIGRvYy5jcmVhdGVUZXh0Tm9kZSh0ZXh0Q29udGVudCk7XG59O1xuXG5leHBvcnRzLmNyZWF0ZUZyYWdtZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhciBkb2MgPSBlbGVtZW50ID8gZWxlbWVudC5vd25lckRvY3VtZW50IDogZG9jdW1lbnQ7XG4gICAgcmV0dXJuIGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG59O1xuXG5leHBvcnRzLmhhc0Nzc0NsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NlcyA9IChlbC5jbGFzc05hbWUgKyBcIlwiKS5zcGxpdCgvXFxzKy9nKTtcbiAgICByZXR1cm4gY2xhc3Nlcy5pbmRleE9mKG5hbWUpICE9PSAtMTtcbn07XG5cbi8qXG4qIEFkZCBhIENTUyBjbGFzcyB0byB0aGUgbGlzdCBvZiBjbGFzc2VzIG9uIHRoZSBnaXZlbiBub2RlXG4qL1xuZXhwb3J0cy5hZGRDc3NDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgaWYgKCFleHBvcnRzLmhhc0Nzc0NsYXNzKGVsLCBuYW1lKSkge1xuICAgICAgICBlbC5jbGFzc05hbWUgKz0gXCIgXCIgKyBuYW1lO1xuICAgIH1cbn07XG5cbi8qXG4qIFJlbW92ZSBhIENTUyBjbGFzcyBmcm9tIHRoZSBsaXN0IG9mIGNsYXNzZXMgb24gdGhlIGdpdmVuIG5vZGVcbiovXG5leHBvcnRzLnJlbW92ZUNzc0NsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NlcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy9nKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBjbGFzc2VzLmluZGV4T2YobmFtZSk7XG4gICAgICAgIGlmIChpbmRleCA9PSAtMSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2xhc3Nlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICBlbC5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oXCIgXCIpO1xufTtcblxuZXhwb3J0cy50b2dnbGVDc3NDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgdmFyIGNsYXNzZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoL1xccysvZyksIGFkZCA9IHRydWU7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gY2xhc3Nlcy5pbmRleE9mKG5hbWUpO1xuICAgICAgICBpZiAoaW5kZXggPT0gLTEpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGFkZCA9IGZhbHNlO1xuICAgICAgICBjbGFzc2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIGlmIChhZGQpXG4gICAgICAgIGNsYXNzZXMucHVzaChuYW1lKTtcblxuICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbihcIiBcIik7XG4gICAgcmV0dXJuIGFkZDtcbn07XG5cblxuLypcbiAgICAqIEFkZCBvciByZW1vdmUgYSBDU1MgY2xhc3MgZnJvbSB0aGUgbGlzdCBvZiBjbGFzc2VzIG9uIHRoZSBnaXZlbiBub2RlXG4gICAgKiBkZXBlbmRpbmcgb24gdGhlIHZhbHVlIG9mIDx0dD5pbmNsdWRlPC90dD5cbiAgICAqL1xuZXhwb3J0cy5zZXRDc3NDbGFzcyA9IGZ1bmN0aW9uKG5vZGUsIGNsYXNzTmFtZSwgaW5jbHVkZSkge1xuICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICAgIGV4cG9ydHMuYWRkQ3NzQ2xhc3Mobm9kZSwgY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBleHBvcnRzLnJlbW92ZUNzc0NsYXNzKG5vZGUsIGNsYXNzTmFtZSk7XG4gICAgfVxufTtcblxuZXhwb3J0cy5oYXNDc3NTdHJpbmcgPSBmdW5jdGlvbihpZCwgZG9jKSB7XG4gICAgdmFyIGluZGV4ID0gMCwgc2hlZXRzO1xuICAgIGRvYyA9IGRvYyB8fCBkb2N1bWVudDtcbiAgICBpZiAoKHNoZWV0cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKFwic3R5bGVcIikpKSB7XG4gICAgICAgIHdoaWxlIChpbmRleCA8IHNoZWV0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChzaGVldHNbaW5kZXgrK10uaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnRzLnJlbW92ZUVsZW1lbnRCeUlkID0gZnVuY3Rpb24oaWQsIGRvYykge1xuICAgIGRvYyA9IGRvYyB8fCBkb2N1bWVudDtcbiAgICBpZihkb2MuZ2V0RWxlbWVudEJ5SWQoaWQpKSB7XG4gICAgICAgIGRvYy5nZXRFbGVtZW50QnlJZChpZCkucmVtb3ZlKCk7XG4gICAgfVxufTtcblxudmFyIHN0cmljdENTUDtcbnZhciBjc3NDYWNoZSA9IFtdO1xuZXhwb3J0cy51c2VTdHJpY3RDU1AgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHN0cmljdENTUCA9IHZhbHVlO1xuICAgIGlmICh2YWx1ZSA9PSBmYWxzZSkgaW5zZXJ0UGVuZGluZ1N0eWxlcygpO1xuICAgIGVsc2UgaWYgKCFjc3NDYWNoZSkgY3NzQ2FjaGUgPSBbXTtcbn07XG5cbmZ1bmN0aW9uIGluc2VydFBlbmRpbmdTdHlsZXMoKSB7XG4gICAgdmFyIGNhY2hlID0gY3NzQ2FjaGU7XG4gICAgY3NzQ2FjaGUgPSBudWxsO1xuICAgIGNhY2hlICYmIGNhY2hlLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBpbXBvcnRDc3NTdHJpbmcoaXRlbVswXSwgaXRlbVsxXSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGltcG9ydENzc1N0cmluZyhjc3NUZXh0LCBpZCwgdGFyZ2V0KSB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKGNzc0NhY2hlKSB7XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgIGluc2VydFBlbmRpbmdTdHlsZXMoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gY3NzQ2FjaGUucHVzaChbY3NzVGV4dCwgaWRdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RyaWN0Q1NQKSByZXR1cm47XG5cbiAgICB2YXIgY29udGFpbmVyID0gdGFyZ2V0O1xuICAgIGlmICghdGFyZ2V0IHx8ICF0YXJnZXQuZ2V0Um9vdE5vZGUpIHtcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29udGFpbmVyID0gdGFyZ2V0LmdldFJvb3ROb2RlKCk7XG4gICAgICAgIGlmICghY29udGFpbmVyIHx8IGNvbnRhaW5lciA9PSB0YXJnZXQpXG4gICAgICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudDtcbiAgICB9XG4gICAgXG4gICAgdmFyIGRvYyA9IGNvbnRhaW5lci5vd25lckRvY3VtZW50IHx8IGNvbnRhaW5lcjtcbiAgICBcbiAgICAvLyBJZiBzdHlsZSBpcyBhbHJlYWR5IGltcG9ydGVkIHJldHVybiBpbW1lZGlhdGVseS5cbiAgICBpZiAoaWQgJiYgZXhwb3J0cy5oYXNDc3NTdHJpbmcoaWQsIGNvbnRhaW5lcikpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIFxuICAgIGlmIChpZClcbiAgICAgICAgY3NzVGV4dCArPSBcIlxcbi8qIyBzb3VyY2VVUkw9YWNlL2Nzcy9cIiArIGlkICsgXCIgKi9cIjtcbiAgICBcbiAgICB2YXIgc3R5bGUgPSBleHBvcnRzLmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICBzdHlsZS5hcHBlbmRDaGlsZChkb2MuY3JlYXRlVGV4dE5vZGUoY3NzVGV4dCkpO1xuICAgIGlmIChpZClcbiAgICAgICAgc3R5bGUuaWQgPSBpZDtcblxuICAgIGlmIChjb250YWluZXIgPT0gZG9jKVxuICAgICAgICBjb250YWluZXIgPSBleHBvcnRzLmdldERvY3VtZW50SGVhZChkb2MpO1xuICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoc3R5bGUsIGNvbnRhaW5lci5maXJzdENoaWxkKTtcbn1cbmV4cG9ydHMuaW1wb3J0Q3NzU3RyaW5nID0gaW1wb3J0Q3NzU3RyaW5nO1xuXG5leHBvcnRzLmltcG9ydENzc1N0eWxzaGVldCA9IGZ1bmN0aW9uKHVyaSwgZG9jKSB7XG4gICAgZXhwb3J0cy5idWlsZERvbShbXCJsaW5rXCIsIHtyZWw6IFwic3R5bGVzaGVldFwiLCBocmVmOiB1cml9XSwgZXhwb3J0cy5nZXREb2N1bWVudEhlYWQoZG9jKSk7XG59O1xuZXhwb3J0cy5zY3JvbGxiYXJXaWR0aCA9IGZ1bmN0aW9uKGRvYykge1xuICAgIHZhciBpbm5lciA9IGV4cG9ydHMuY3JlYXRlRWxlbWVudChcImFjZV9pbm5lclwiKTtcbiAgICBpbm5lci5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xuICAgIGlubmVyLnN0eWxlLm1pbldpZHRoID0gXCIwcHhcIjtcbiAgICBpbm5lci5zdHlsZS5oZWlnaHQgPSBcIjIwMHB4XCI7XG4gICAgaW5uZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblxuICAgIHZhciBvdXRlciA9IGV4cG9ydHMuY3JlYXRlRWxlbWVudChcImFjZV9vdXRlclwiKTtcbiAgICB2YXIgc3R5bGUgPSBvdXRlci5zdHlsZTtcblxuICAgIHN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgIHN0eWxlLmxlZnQgPSBcIi0xMDAwMHB4XCI7XG4gICAgc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgIHN0eWxlLndpZHRoID0gXCIyMDBweFwiO1xuICAgIHN0eWxlLm1pbldpZHRoID0gXCIwcHhcIjtcbiAgICBzdHlsZS5oZWlnaHQgPSBcIjE1MHB4XCI7XG4gICAgc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblxuICAgIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcblxuICAgIHZhciBib2R5ID0gKGRvYyAmJiBkb2MuZG9jdW1lbnRFbGVtZW50KSB8fCAoZG9jdW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KTtcbiAgICBpZiAoIWJvZHkpIHJldHVybiAwO1xuXG4gICAgYm9keS5hcHBlbmRDaGlsZChvdXRlcik7XG5cbiAgICB2YXIgbm9TY3JvbGxiYXIgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuICAgIHN0eWxlLm92ZXJmbG93ID0gXCJzY3JvbGxcIjtcbiAgICB2YXIgd2l0aFNjcm9sbGJhciA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG4gICAgaWYgKG5vU2Nyb2xsYmFyID09PSB3aXRoU2Nyb2xsYmFyKSB7XG4gICAgICAgIHdpdGhTY3JvbGxiYXIgPSBvdXRlci5jbGllbnRXaWR0aDtcbiAgICB9XG5cbiAgICBib2R5LnJlbW92ZUNoaWxkKG91dGVyKTtcblxuICAgIHJldHVybiBub1Njcm9sbGJhciAtIHdpdGhTY3JvbGxiYXI7XG59O1xuXG5leHBvcnRzLmNvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbihlbGVtZW50LCBzdHlsZSkge1xuICAgIHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBcIlwiKSB8fCB7fTtcbn07XG5cbmV4cG9ydHMuc2V0U3R5bGUgPSBmdW5jdGlvbihzdHlsZXMsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIGlmIChzdHlsZXNbcHJvcGVydHldICE9PSB2YWx1ZSkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwic2V0IHN0eWxlXCIsIHByb3BlcnR5LCBzdHlsZXNbcHJvcGVydHldLCB2YWx1ZSk7XG4gICAgICAgIHN0eWxlc1twcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICB9XG59O1xuXG5leHBvcnRzLkhBU19DU1NfQU5JTUFUSU9OID0gZmFsc2U7XG5leHBvcnRzLkhBU19DU1NfVFJBTlNGT1JNUyA9IGZhbHNlO1xuZXhwb3J0cy5ISV9EUEkgPSB1c2VyYWdlbnQuaXNXaW5cbiAgICA/IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMS41XG4gICAgOiB0cnVlO1xuXG5pZiAodXNlcmFnZW50LmlzQ2hyb21lT1MpIGV4cG9ydHMuSElfRFBJID0gZmFsc2U7XG5cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBkZXRlY3QgQ1NTIHRyYW5zZm9ybWF0aW9uIHN1cHBvcnRcbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBpZiAoZXhwb3J0cy5ISV9EUEkgJiYgZGl2LnN0eWxlLnRyYW5zZm9ybSAgIT09IHVuZGVmaW5lZClcbiAgICAgICAgZXhwb3J0cy5IQVNfQ1NTX1RSQU5TRk9STVMgPSB0cnVlO1xuICAgIGlmICghdXNlcmFnZW50LmlzRWRnZSAmJiB0eXBlb2YgZGl2LnN0eWxlLmFuaW1hdGlvbk5hbWUgIT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgIGV4cG9ydHMuSEFTX0NTU19BTklNQVRJT04gPSB0cnVlO1xuICAgIGRpdiA9IG51bGw7XG59XG5cbmlmIChleHBvcnRzLkhBU19DU1NfVFJBTlNGT1JNUykge1xuICAgIGV4cG9ydHMudHJhbnNsYXRlID0gZnVuY3Rpb24oZWxlbWVudCwgdHgsIHR5KSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBNYXRoLnJvdW5kKHR4KSArIFwicHgsIFwiICsgTWF0aC5yb3VuZCh0eSkgK1wicHgpXCI7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgZXhwb3J0cy50cmFuc2xhdGUgPSBmdW5jdGlvbihlbGVtZW50LCB0eCwgdHkpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSBNYXRoLnJvdW5kKHR5KSArIFwicHhcIjtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gTWF0aC5yb3VuZCh0eCkgKyBcInB4XCI7XG4gICAgfTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIga2V5cyA9IHJlcXVpcmUoXCIuL2tleXNcIik7XG52YXIgdXNlcmFnZW50ID0gcmVxdWlyZShcIi4vdXNlcmFnZW50XCIpO1xuXG52YXIgcHJlc3NlZEtleXMgPSBudWxsO1xudmFyIHRzID0gMDtcblxudmFyIGFjdGl2ZUxpc3RlbmVyT3B0aW9ucztcbmZ1bmN0aW9uIGRldGVjdExpc3RlbmVyT3B0aW9uc1N1cHBvcnQoKSB7XG4gICAgYWN0aXZlTGlzdGVuZXJPcHRpb25zID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgZG9jdW1lbnQuY3JlYXRlQ29tbWVudChcIlwiKS5hZGRFdmVudExpc3RlbmVyKFwidGVzdFwiLCBmdW5jdGlvbigpIHt9LCB7IFxuICAgICAgICAgICAgZ2V0IHBhc3NpdmUoKSB7IFxuICAgICAgICAgICAgICAgIGFjdGl2ZUxpc3RlbmVyT3B0aW9ucyA9IHtwYXNzaXZlOiBmYWxzZX07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2goZSkge31cbn1cblxuZnVuY3Rpb24gZ2V0TGlzdGVuZXJPcHRpb25zKCkge1xuICAgIGlmIChhY3RpdmVMaXN0ZW5lck9wdGlvbnMgPT0gdW5kZWZpbmVkKVxuICAgICAgICBkZXRlY3RMaXN0ZW5lck9wdGlvbnNTdXBwb3J0KCk7XG4gICAgcmV0dXJuIGFjdGl2ZUxpc3RlbmVyT3B0aW9ucztcbn1cblxuZnVuY3Rpb24gRXZlbnRMaXN0ZW5lcihlbGVtLCB0eXBlLCBjYWxsYmFjaykge1xuICAgIHRoaXMuZWxlbSA9IGVsZW07XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG59XG5FdmVudExpc3RlbmVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgcmVtb3ZlTGlzdGVuZXIodGhpcy5lbGVtLCB0aGlzLnR5cGUsIHRoaXMuY2FsbGJhY2spO1xuICAgIHRoaXMuZWxlbSA9IHRoaXMudHlwZSA9IHRoaXMuY2FsbGJhY2sgPSB1bmRlZmluZWQ7XG59O1xuXG52YXIgYWRkTGlzdGVuZXIgPSBleHBvcnRzLmFkZExpc3RlbmVyID0gZnVuY3Rpb24oZWxlbSwgdHlwZSwgY2FsbGJhY2ssIGRlc3Ryb3llcikge1xuICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgZ2V0TGlzdGVuZXJPcHRpb25zKCkpO1xuICAgIGlmIChkZXN0cm95ZXIpXG4gICAgICAgIGRlc3Ryb3llci4kdG9EZXN0cm95LnB1c2gobmV3IEV2ZW50TGlzdGVuZXIoZWxlbSwgdHlwZSwgY2FsbGJhY2spKTtcbn07XG5cbnZhciByZW1vdmVMaXN0ZW5lciA9IGV4cG9ydHMucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbihlbGVtLCB0eXBlLCBjYWxsYmFjaykge1xuICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgZ2V0TGlzdGVuZXJPcHRpb25zKCkpO1xufTtcblxuLypcbiogUHJldmVudHMgcHJvcGFnYXRpb24gYW5kIGNsb2JiZXJzIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGUgcGFzc2VkIGV2ZW50XG4qL1xuZXhwb3J0cy5zdG9wRXZlbnQgPSBmdW5jdGlvbihlKSB7XG4gICAgZXhwb3J0cy5zdG9wUHJvcGFnYXRpb24oZSk7XG4gICAgZXhwb3J0cy5wcmV2ZW50RGVmYXVsdChlKTtcbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5leHBvcnRzLnN0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5zdG9wUHJvcGFnYXRpb24pXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG59O1xuXG5leHBvcnRzLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLnByZXZlbnREZWZhdWx0KVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKlxuICogQHJldHVybiB7TnVtYmVyfSAwIGZvciBsZWZ0IGJ1dHRvbiwgMSBmb3IgbWlkZGxlIGJ1dHRvbiwgMiBmb3IgcmlnaHQgYnV0dG9uXG4gKi9cbmV4cG9ydHMuZ2V0QnV0dG9uID0gZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLnR5cGUgPT0gXCJkYmxjbGlja1wiKVxuICAgICAgICByZXR1cm4gMDtcbiAgICBpZiAoZS50eXBlID09IFwiY29udGV4dG1lbnVcIiB8fCAodXNlcmFnZW50LmlzTWFjICYmIChlLmN0cmxLZXkgJiYgIWUuYWx0S2V5ICYmICFlLnNoaWZ0S2V5KSkpXG4gICAgICAgIHJldHVybiAyO1xuXG4gICAgLy8gRE9NIEV2ZW50XG4gICAgcmV0dXJuIGUuYnV0dG9uO1xufTtcblxuZXhwb3J0cy5jYXB0dXJlID0gZnVuY3Rpb24oZWwsIGV2ZW50SGFuZGxlciwgcmVsZWFzZUNhcHR1cmVIYW5kbGVyKSB7XG4gICAgdmFyIG93bmVyRG9jdW1lbnQgPSBlbCAmJiBlbC5vd25lckRvY3VtZW50IHx8IGRvY3VtZW50O1xuICAgIGZ1bmN0aW9uIG9uTW91c2VVcChlKSB7XG4gICAgICAgIGV2ZW50SGFuZGxlciAmJiBldmVudEhhbmRsZXIoZSk7XG4gICAgICAgIHJlbGVhc2VDYXB0dXJlSGFuZGxlciAmJiByZWxlYXNlQ2FwdHVyZUhhbmRsZXIoZSk7XG5cbiAgICAgICAgcmVtb3ZlTGlzdGVuZXIob3duZXJEb2N1bWVudCwgXCJtb3VzZW1vdmVcIiwgZXZlbnRIYW5kbGVyKTtcbiAgICAgICAgcmVtb3ZlTGlzdGVuZXIob3duZXJEb2N1bWVudCwgXCJtb3VzZXVwXCIsIG9uTW91c2VVcCk7XG4gICAgICAgIHJlbW92ZUxpc3RlbmVyKG93bmVyRG9jdW1lbnQsIFwiZHJhZ3N0YXJ0XCIsIG9uTW91c2VVcCk7XG4gICAgfVxuXG4gICAgYWRkTGlzdGVuZXIob3duZXJEb2N1bWVudCwgXCJtb3VzZW1vdmVcIiwgZXZlbnRIYW5kbGVyKTtcbiAgICBhZGRMaXN0ZW5lcihvd25lckRvY3VtZW50LCBcIm1vdXNldXBcIiwgb25Nb3VzZVVwKTtcbiAgICBhZGRMaXN0ZW5lcihvd25lckRvY3VtZW50LCBcImRyYWdzdGFydFwiLCBvbk1vdXNlVXApO1xuICAgIFxuICAgIHJldHVybiBvbk1vdXNlVXA7XG59O1xuXG5leHBvcnRzLmFkZE1vdXNlV2hlZWxMaXN0ZW5lciA9IGZ1bmN0aW9uKGVsLCBjYWxsYmFjaywgZGVzdHJveWVyKSB7XG4gICAgYWRkTGlzdGVuZXIoZWwsIFwid2hlZWxcIiwgIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGZhY3RvciA9IDAuMTU7XG4gICAgICAgIC8vIHdvcmthcm91bmQgZm9yIGZpcmVmb3ggY2hhbmdpbmcgZGVsdGFNb2RlIGJhc2VkIG9uIHdoaWNoIHByb3BlcnR5IGlzIGFjY2Vzc2VkIGZpcnN0XG4gICAgICAgIHZhciBkZWx0YVggPSBlLmRlbHRhWCB8fCAwO1xuICAgICAgICB2YXIgZGVsdGFZID0gZS5kZWx0YVkgfHwgMDtcbiAgICAgICAgc3dpdGNoIChlLmRlbHRhTW9kZSkge1xuICAgICAgICAgICAgY2FzZSBlLkRPTV9ERUxUQV9QSVhFTDpcbiAgICAgICAgICAgICAgICBlLndoZWVsWCA9IGRlbHRhWCAqIGZhY3RvcjtcbiAgICAgICAgICAgICAgICBlLndoZWVsWSA9IGRlbHRhWSAqIGZhY3RvcjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgZS5ET01fREVMVEFfTElORTpcbiAgICAgICAgICAgICAgICB2YXIgbGluZVBpeGVscyA9IDE1O1xuICAgICAgICAgICAgICAgIGUud2hlZWxYID0gZGVsdGFYICogbGluZVBpeGVscztcbiAgICAgICAgICAgICAgICBlLndoZWVsWSA9IGRlbHRhWSAqIGxpbmVQaXhlbHM7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGUuRE9NX0RFTFRBX1BBR0U6XG4gICAgICAgICAgICAgICAgdmFyIHBhZ2VQaXhlbHMgPSAxNTA7XG4gICAgICAgICAgICAgICAgZS53aGVlbFggPSBkZWx0YVggKiBwYWdlUGl4ZWxzO1xuICAgICAgICAgICAgICAgIGUud2hlZWxZID0gZGVsdGFZICogcGFnZVBpeGVscztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhlKTtcbiAgICB9LCBkZXN0cm95ZXIpO1xufTtcblxuZXhwb3J0cy5hZGRNdWx0aU1vdXNlRG93bkxpc3RlbmVyID0gZnVuY3Rpb24oZWxlbWVudHMsIHRpbWVvdXRzLCBldmVudEhhbmRsZXIsIGNhbGxiYWNrTmFtZSwgZGVzdHJveWVyKSB7XG4gICAgdmFyIGNsaWNrcyA9IDA7XG4gICAgdmFyIHN0YXJ0WCwgc3RhcnRZLCB0aW1lcjsgXG4gICAgdmFyIGV2ZW50TmFtZXMgPSB7XG4gICAgICAgIDI6IFwiZGJsY2xpY2tcIixcbiAgICAgICAgMzogXCJ0cmlwbGVjbGlja1wiLFxuICAgICAgICA0OiBcInF1YWRjbGlja1wiXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG9uTW91c2Vkb3duKGUpIHtcbiAgICAgICAgaWYgKGV4cG9ydHMuZ2V0QnV0dG9uKGUpICE9PSAwKSB7XG4gICAgICAgICAgICBjbGlja3MgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKGUuZGV0YWlsID4gMSkge1xuICAgICAgICAgICAgY2xpY2tzKys7XG4gICAgICAgICAgICBpZiAoY2xpY2tzID4gNClcbiAgICAgICAgICAgICAgICBjbGlja3MgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xpY2tzID0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXNlcmFnZW50LmlzSUUpIHtcbiAgICAgICAgICAgIHZhciBpc05ld0NsaWNrID0gTWF0aC5hYnMoZS5jbGllbnRYIC0gc3RhcnRYKSA+IDUgfHwgTWF0aC5hYnMoZS5jbGllbnRZIC0gc3RhcnRZKSA+IDU7XG4gICAgICAgICAgICBpZiAoIXRpbWVyIHx8IGlzTmV3Q2xpY2spXG4gICAgICAgICAgICAgICAgY2xpY2tzID0gMTtcbiAgICAgICAgICAgIGlmICh0aW1lcilcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge3RpbWVyID0gbnVsbDt9LCB0aW1lb3V0c1tjbGlja3MgLSAxXSB8fCA2MDApO1xuXG4gICAgICAgICAgICBpZiAoY2xpY2tzID09IDEpIHtcbiAgICAgICAgICAgICAgICBzdGFydFggPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgc3RhcnRZID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBlLl9jbGlja3MgPSBjbGlja3M7XG5cbiAgICAgICAgZXZlbnRIYW5kbGVyW2NhbGxiYWNrTmFtZV0oXCJtb3VzZWRvd25cIiwgZSk7XG5cbiAgICAgICAgaWYgKGNsaWNrcyA+IDQpXG4gICAgICAgICAgICBjbGlja3MgPSAwO1xuICAgICAgICBlbHNlIGlmIChjbGlja3MgPiAxKVxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50SGFuZGxlcltjYWxsYmFja05hbWVdKGV2ZW50TmFtZXNbY2xpY2tzXSwgZSk7XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShlbGVtZW50cykpXG4gICAgICAgIGVsZW1lbnRzID0gW2VsZW1lbnRzXTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIGFkZExpc3RlbmVyKGVsLCBcIm1vdXNlZG93blwiLCBvbk1vdXNlZG93biwgZGVzdHJveWVyKTtcbiAgICB9KTtcbn07XG5cbnZhciBnZXRNb2RpZmllckhhc2ggPSBmdW5jdGlvbihlKSB7XG4gICAgcmV0dXJuIDAgfCAoZS5jdHJsS2V5ID8gMSA6IDApIHwgKGUuYWx0S2V5ID8gMiA6IDApIHwgKGUuc2hpZnRLZXkgPyA0IDogMCkgfCAoZS5tZXRhS2V5ID8gOCA6IDApO1xufTtcblxuZXhwb3J0cy5nZXRNb2RpZmllclN0cmluZyA9IGZ1bmN0aW9uKGUpIHtcbiAgICByZXR1cm4ga2V5cy5LRVlfTU9EU1tnZXRNb2RpZmllckhhc2goZSldO1xufTtcblxuZnVuY3Rpb24gbm9ybWFsaXplQ29tbWFuZEtleXMoY2FsbGJhY2ssIGUsIGtleUNvZGUpIHtcbiAgICB2YXIgaGFzaElkID0gZ2V0TW9kaWZpZXJIYXNoKGUpO1xuXG4gICAgaWYgKCF1c2VyYWdlbnQuaXNNYWMgJiYgcHJlc3NlZEtleXMpIHtcbiAgICAgICAgaWYgKGUuZ2V0TW9kaWZpZXJTdGF0ZSAmJiAoZS5nZXRNb2RpZmllclN0YXRlKFwiT1NcIikgfHwgZS5nZXRNb2RpZmllclN0YXRlKFwiV2luXCIpKSlcbiAgICAgICAgICAgIGhhc2hJZCB8PSA4O1xuICAgICAgICBpZiAocHJlc3NlZEtleXMuYWx0R3IpIHtcbiAgICAgICAgICAgIGlmICgoMyAmIGhhc2hJZCkgIT0gMylcbiAgICAgICAgICAgICAgICBwcmVzc2VkS2V5cy5hbHRHciA9IDA7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXlDb2RlID09PSAxOCB8fCBrZXlDb2RlID09PSAxNykge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gXCJsb2NhdGlvblwiIGluIGUgPyBlLmxvY2F0aW9uIDogZS5rZXlMb2NhdGlvbjtcbiAgICAgICAgICAgIGlmIChrZXlDb2RlID09PSAxNyAmJiBsb2NhdGlvbiA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGlmIChwcmVzc2VkS2V5c1trZXlDb2RlXSA9PSAxKVxuICAgICAgICAgICAgICAgICAgICB0cyA9IGUudGltZVN0YW1wO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSAxOCAmJiBoYXNoSWQgPT09IDMgJiYgbG9jYXRpb24gPT09IDIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZHQgPSBlLnRpbWVTdGFtcCAtIHRzO1xuICAgICAgICAgICAgICAgIGlmIChkdCA8IDUwKVxuICAgICAgICAgICAgICAgICAgICBwcmVzc2VkS2V5cy5hbHRHciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKGtleUNvZGUgaW4ga2V5cy5NT0RJRklFUl9LRVlTKSB7XG4gICAgICAgIGtleUNvZGUgPSAtMTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFoYXNoSWQgJiYga2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgdmFyIGxvY2F0aW9uID0gXCJsb2NhdGlvblwiIGluIGUgPyBlLmxvY2F0aW9uIDogZS5rZXlMb2NhdGlvbjtcbiAgICAgICAgaWYgKGxvY2F0aW9uID09PSAzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlLCBoYXNoSWQsIC1rZXlDb2RlKTtcbiAgICAgICAgICAgIGlmIChlLmRlZmF1bHRQcmV2ZW50ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmICh1c2VyYWdlbnQuaXNDaHJvbWVPUyAmJiBoYXNoSWQgJiA4KSB7XG4gICAgICAgIGNhbGxiYWNrKGUsIGhhc2hJZCwga2V5Q29kZSk7XG4gICAgICAgIGlmIChlLmRlZmF1bHRQcmV2ZW50ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGhhc2hJZCAmPSB+ODtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBubyBoYXNoSWQgYW5kIHRoZSBrZXlDb2RlIGlzIG5vdCBhIGZ1bmN0aW9uIGtleSwgdGhlblxuICAgIC8vIHdlIGRvbid0IGNhbGwgdGhlIGNhbGxiYWNrIGFzIHdlIGRvbid0IGhhbmRsZSBhIGNvbW1hbmQga2V5IGhlcmVcbiAgICAvLyAoaXQncyBhIG5vcm1hbCBrZXkvY2hhcmFjdGVyIGlucHV0KS5cbiAgICBpZiAoIWhhc2hJZCAmJiAhKGtleUNvZGUgaW4ga2V5cy5GVU5DVElPTl9LRVlTKSAmJiAhKGtleUNvZGUgaW4ga2V5cy5QUklOVEFCTEVfS0VZUykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gY2FsbGJhY2soZSwgaGFzaElkLCBrZXlDb2RlKTtcbn1cblxuXG5leHBvcnRzLmFkZENvbW1hbmRLZXlMaXN0ZW5lciA9IGZ1bmN0aW9uKGVsLCBjYWxsYmFjaywgZGVzdHJveWVyKSB7XG4gICAgaWYgKHVzZXJhZ2VudC5pc09sZEdlY2tvIHx8ICh1c2VyYWdlbnQuaXNPcGVyYSAmJiAhKFwiS2V5Ym9hcmRFdmVudFwiIGluIHdpbmRvdykpKSB7XG4gICAgICAgIC8vIE9sZCB2ZXJzaW9ucyBvZiBHZWNrbyBha2EuIEZpcmVmb3ggPCA0LjAgZGlkbid0IHJlcGVhdCB0aGUga2V5ZG93blxuICAgICAgICAvLyBldmVudCBpZiB0aGUgdXNlciBwcmVzc2VkIHRoZSBrZXkgZm9yIGEgbG9uZ2VyIHRpbWUuIEluc3RlYWQsIHRoZVxuICAgICAgICAvLyBrZXlkb3duIGV2ZW50IHdhcyBmaXJlZCBvbmNlIGFuZCBsYXRlciBvbiBvbmx5IHRoZSBrZXlwcmVzcyBldmVudC5cbiAgICAgICAgLy8gVG8gZW11bGF0ZSB0aGUgJ3JpZ2h0JyBrZXlkb3duIGJlaGF2aW9yLCB0aGUga2V5Q29kZSBvZiB0aGUgaW5pdGlhbFxuICAgICAgICAvLyBrZXlEb3duIGV2ZW50IGlzIHN0b3JlZCBhbmQgaW4gdGhlIGZvbGxvd2luZyBrZXlwcmVzcyBldmVudHMgdGhlXG4gICAgICAgIC8vIHN0b3JlcyBrZXlDb2RlIGlzIHVzZWQgdG8gZW11bGF0ZSBhIGtleURvd24gZXZlbnQuXG4gICAgICAgIHZhciBsYXN0S2V5RG93bktleUNvZGUgPSBudWxsO1xuICAgICAgICBhZGRMaXN0ZW5lcihlbCwgXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGxhc3RLZXlEb3duS2V5Q29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgfSwgZGVzdHJveWVyKTtcbiAgICAgICAgYWRkTGlzdGVuZXIoZWwsIFwia2V5cHJlc3NcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZUNvbW1hbmRLZXlzKGNhbGxiYWNrLCBlLCBsYXN0S2V5RG93bktleUNvZGUpO1xuICAgICAgICB9LCBkZXN0cm95ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBsYXN0RGVmYXVsdFByZXZlbnRlZCA9IG51bGw7XG5cbiAgICAgICAgYWRkTGlzdGVuZXIoZWwsIFwia2V5ZG93blwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBwcmVzc2VkS2V5c1tlLmtleUNvZGVdID0gKHByZXNzZWRLZXlzW2Uua2V5Q29kZV0gfHwgMCkgKyAxO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5vcm1hbGl6ZUNvbW1hbmRLZXlzKGNhbGxiYWNrLCBlLCBlLmtleUNvZGUpO1xuICAgICAgICAgICAgbGFzdERlZmF1bHRQcmV2ZW50ZWQgPSBlLmRlZmF1bHRQcmV2ZW50ZWQ7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LCBkZXN0cm95ZXIpO1xuXG4gICAgICAgIGFkZExpc3RlbmVyKGVsLCBcImtleXByZXNzXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmIChsYXN0RGVmYXVsdFByZXZlbnRlZCAmJiAoZS5jdHJsS2V5IHx8IGUuYWx0S2V5IHx8IGUuc2hpZnRLZXkgfHwgZS5tZXRhS2V5KSkge1xuICAgICAgICAgICAgICAgIGV4cG9ydHMuc3RvcEV2ZW50KGUpO1xuICAgICAgICAgICAgICAgIGxhc3REZWZhdWx0UHJldmVudGVkID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZGVzdHJveWVyKTtcblxuICAgICAgICBhZGRMaXN0ZW5lcihlbCwgXCJrZXl1cFwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBwcmVzc2VkS2V5c1tlLmtleUNvZGVdID0gbnVsbDtcbiAgICAgICAgfSwgZGVzdHJveWVyKTtcblxuICAgICAgICBpZiAoIXByZXNzZWRLZXlzKSB7XG4gICAgICAgICAgICByZXNldFByZXNzZWRLZXlzKCk7XG4gICAgICAgICAgICBhZGRMaXN0ZW5lcih3aW5kb3csIFwiZm9jdXNcIiwgcmVzZXRQcmVzc2VkS2V5cyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuZnVuY3Rpb24gcmVzZXRQcmVzc2VkS2V5cygpIHtcbiAgICBwcmVzc2VkS2V5cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5cbmlmICh0eXBlb2Ygd2luZG93ID09IFwib2JqZWN0XCIgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmICF1c2VyYWdlbnQuaXNPbGRJRSkge1xuICAgIHZhciBwb3N0TWVzc2FnZUlkID0gMTtcbiAgICBleHBvcnRzLm5leHRUaWNrID0gZnVuY3Rpb24oY2FsbGJhY2ssIHdpbikge1xuICAgICAgICB3aW4gPSB3aW4gfHwgd2luZG93O1xuICAgICAgICB2YXIgbWVzc2FnZU5hbWUgPSBcInplcm8tdGltZW91dC1tZXNzYWdlLVwiICsgKHBvc3RNZXNzYWdlSWQrKyk7XG4gICAgICAgIFxuICAgICAgICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5kYXRhID09IG1lc3NhZ2VOYW1lKSB7XG4gICAgICAgICAgICAgICAgZXhwb3J0cy5zdG9wUHJvcGFnYXRpb24oZSk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIod2luLCBcIm1lc3NhZ2VcIiwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBhZGRMaXN0ZW5lcih3aW4sIFwibWVzc2FnZVwiLCBsaXN0ZW5lcik7XG4gICAgICAgIHdpbi5wb3N0TWVzc2FnZShtZXNzYWdlTmFtZSwgXCIqXCIpO1xuICAgIH07XG59XG5cbmV4cG9ydHMuJGlkbGVCbG9ja2VkID0gZmFsc2U7XG5leHBvcnRzLm9uSWRsZSA9IGZ1bmN0aW9uKGNiLCB0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgaWYgKCFleHBvcnRzLiRpZGxlQmxvY2tlZCkge1xuICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoaGFuZGxlciwgMTAwKTtcbiAgICAgICAgfVxuICAgIH0sIHRpbWVvdXQpO1xufTtcblxuZXhwb3J0cy4kaWRsZUJsb2NrSWQgPSBudWxsO1xuZXhwb3J0cy5ibG9ja0lkbGUgPSBmdW5jdGlvbihkZWxheSkge1xuICAgIGlmIChleHBvcnRzLiRpZGxlQmxvY2tJZClcbiAgICAgICAgY2xlYXJUaW1lb3V0KGV4cG9ydHMuJGlkbGVCbG9ja0lkKTtcbiAgICAgICAgXG4gICAgZXhwb3J0cy4kaWRsZUJsb2NrZWQgPSB0cnVlO1xuICAgIGV4cG9ydHMuJGlkbGVCbG9ja0lkID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy4kaWRsZUJsb2NrZWQgPSBmYWxzZTtcbiAgICB9LCBkZWxheSB8fCAxMDApO1xufTtcblxuZXhwb3J0cy5uZXh0RnJhbWUgPSB0eXBlb2Ygd2luZG93ID09IFwib2JqZWN0XCIgJiYgKHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHx8IHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcblxuaWYgKGV4cG9ydHMubmV4dEZyYW1lKVxuICAgIGV4cG9ydHMubmV4dEZyYW1lID0gZXhwb3J0cy5uZXh0RnJhbWUuYmluZCh3aW5kb3cpO1xuZWxzZVxuICAgIGV4cG9ydHMubmV4dEZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgc2V0VGltZW91dChjYWxsYmFjaywgMTcpO1xuICAgIH07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIEV2ZW50RW1pdHRlciA9IHt9O1xudmFyIHN0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uKCkgeyB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7IH07XG52YXIgcHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHsgdGhpcy5kZWZhdWx0UHJldmVudGVkID0gdHJ1ZTsgfTtcblxuRXZlbnRFbWl0dGVyLl9lbWl0ID1cbkV2ZW50RW1pdHRlci5fZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZSkge1xuICAgIHRoaXMuX2V2ZW50UmVnaXN0cnkgfHwgKHRoaXMuX2V2ZW50UmVnaXN0cnkgPSB7fSk7XG4gICAgdGhpcy5fZGVmYXVsdEhhbmRsZXJzIHx8ICh0aGlzLl9kZWZhdWx0SGFuZGxlcnMgPSB7fSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRSZWdpc3RyeVtldmVudE5hbWVdIHx8IFtdO1xuICAgIHZhciBkZWZhdWx0SGFuZGxlciA9IHRoaXMuX2RlZmF1bHRIYW5kbGVyc1tldmVudE5hbWVdO1xuICAgIGlmICghbGlzdGVuZXJzLmxlbmd0aCAmJiAhZGVmYXVsdEhhbmRsZXIpXG4gICAgICAgIHJldHVybjtcblxuICAgIGlmICh0eXBlb2YgZSAhPSBcIm9iamVjdFwiIHx8ICFlKVxuICAgICAgICBlID0ge307XG5cbiAgICBpZiAoIWUudHlwZSlcbiAgICAgICAgZS50eXBlID0gZXZlbnROYW1lO1xuICAgIGlmICghZS5zdG9wUHJvcGFnYXRpb24pXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gc3RvcFByb3BhZ2F0aW9uO1xuICAgIGlmICghZS5wcmV2ZW50RGVmYXVsdClcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA9IHByZXZlbnREZWZhdWx0O1xuXG4gICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgZm9yICh2YXIgaT0wOyBpPGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaXN0ZW5lcnNbaV0oZSwgdGhpcyk7XG4gICAgICAgIGlmIChlLnByb3BhZ2F0aW9uU3RvcHBlZClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBpZiAoZGVmYXVsdEhhbmRsZXIgJiYgIWUuZGVmYXVsdFByZXZlbnRlZClcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRIYW5kbGVyKGUsIHRoaXMpO1xufTtcblxuXG5FdmVudEVtaXR0ZXIuX3NpZ25hbCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZSkge1xuICAgIHZhciBsaXN0ZW5lcnMgPSAodGhpcy5fZXZlbnRSZWdpc3RyeSB8fCB7fSlbZXZlbnROYW1lXTtcbiAgICBpZiAoIWxpc3RlbmVycylcbiAgICAgICAgcmV0dXJuO1xuICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5zbGljZSgpO1xuICAgIGZvciAodmFyIGk9MDsgaTxsaXN0ZW5lcnMubGVuZ3RoOyBpKyspXG4gICAgICAgIGxpc3RlbmVyc1tpXShlLCB0aGlzKTtcbn07XG5cbkV2ZW50RW1pdHRlci5vbmNlID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgIHZhciBfc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5vbihldmVudE5hbWUsIGZ1bmN0aW9uIG5ld0NhbGxiYWNrKCkge1xuICAgICAgICBfc2VsZi5vZmYoZXZlbnROYW1lLCBuZXdDYWxsYmFjayk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfSk7XG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICAvKmdsb2JhbCBQcm9taXNlKi9cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gcmVzb2x2ZTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuXG5FdmVudEVtaXR0ZXIuc2V0RGVmYXVsdEhhbmRsZXIgPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5fZGVmYXVsdEhhbmRsZXJzO1xuICAgIGlmICghaGFuZGxlcnMpXG4gICAgICAgIGhhbmRsZXJzID0gdGhpcy5fZGVmYXVsdEhhbmRsZXJzID0ge19kaXNhYmxlZF86IHt9fTtcbiAgICBcbiAgICBpZiAoaGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgICB2YXIgb2xkID0gaGFuZGxlcnNbZXZlbnROYW1lXTtcbiAgICAgICAgdmFyIGRpc2FibGVkID0gaGFuZGxlcnMuX2Rpc2FibGVkX1tldmVudE5hbWVdO1xuICAgICAgICBpZiAoIWRpc2FibGVkKVxuICAgICAgICAgICAgaGFuZGxlcnMuX2Rpc2FibGVkX1tldmVudE5hbWVdID0gZGlzYWJsZWQgPSBbXTtcbiAgICAgICAgZGlzYWJsZWQucHVzaChvbGQpO1xuICAgICAgICB2YXIgaSA9IGRpc2FibGVkLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICBpZiAoaSAhPSAtMSkgXG4gICAgICAgICAgICBkaXNhYmxlZC5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICAgIGhhbmRsZXJzW2V2ZW50TmFtZV0gPSBjYWxsYmFjaztcbn07XG5FdmVudEVtaXR0ZXIucmVtb3ZlRGVmYXVsdEhhbmRsZXIgPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5fZGVmYXVsdEhhbmRsZXJzO1xuICAgIGlmICghaGFuZGxlcnMpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgZGlzYWJsZWQgPSBoYW5kbGVycy5fZGlzYWJsZWRfW2V2ZW50TmFtZV07XG4gICAgXG4gICAgaWYgKGhhbmRsZXJzW2V2ZW50TmFtZV0gPT0gY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGRpc2FibGVkKVxuICAgICAgICAgICAgdGhpcy5zZXREZWZhdWx0SGFuZGxlcihldmVudE5hbWUsIGRpc2FibGVkLnBvcCgpKTtcbiAgICB9IGVsc2UgaWYgKGRpc2FibGVkKSB7XG4gICAgICAgIHZhciBpID0gZGlzYWJsZWQuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgIGlmIChpICE9IC0xKVxuICAgICAgICAgICAgZGlzYWJsZWQuc3BsaWNlKGksIDEpO1xuICAgIH1cbn07XG5cbkV2ZW50RW1pdHRlci5vbiA9XG5FdmVudEVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2ssIGNhcHR1cmluZykge1xuICAgIHRoaXMuX2V2ZW50UmVnaXN0cnkgPSB0aGlzLl9ldmVudFJlZ2lzdHJ5IHx8IHt9O1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50UmVnaXN0cnlbZXZlbnROYW1lXTtcbiAgICBpZiAoIWxpc3RlbmVycylcbiAgICAgICAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRSZWdpc3RyeVtldmVudE5hbWVdID0gW107XG5cbiAgICBpZiAobGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spID09IC0xKVxuICAgICAgICBsaXN0ZW5lcnNbY2FwdHVyaW5nID8gXCJ1bnNoaWZ0XCIgOiBcInB1c2hcIl0oY2FsbGJhY2spO1xuICAgIHJldHVybiBjYWxsYmFjaztcbn07XG5cbkV2ZW50RW1pdHRlci5vZmYgPVxuRXZlbnRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyID1cbkV2ZW50RW1pdHRlci5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgIHRoaXMuX2V2ZW50UmVnaXN0cnkgPSB0aGlzLl9ldmVudFJlZ2lzdHJ5IHx8IHt9O1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50UmVnaXN0cnlbZXZlbnROYW1lXTtcbiAgICBpZiAoIWxpc3RlbmVycylcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xufTtcblxuRXZlbnRFbWl0dGVyLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50TmFtZSkge1xuICAgIGlmICghZXZlbnROYW1lKSB0aGlzLl9ldmVudFJlZ2lzdHJ5ID0gdGhpcy5fZGVmYXVsdEhhbmRsZXJzID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLl9ldmVudFJlZ2lzdHJ5KSB0aGlzLl9ldmVudFJlZ2lzdHJ5W2V2ZW50TmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMuX2RlZmF1bHRIYW5kbGVycykgdGhpcy5fZGVmYXVsdEhhbmRsZXJzW2V2ZW50TmFtZV0gPSB1bmRlZmluZWQ7XG59O1xuXG5leHBvcnRzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcbiIsIi8qISBAbGljZW5zZVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblNwcm91dENvcmUgLS0gSmF2YVNjcmlwdCBBcHBsaWNhdGlvbiBGcmFtZXdvcmtcbmNvcHlyaWdodCAyMDA2LTIwMDksIFNwcm91dCBTeXN0ZW1zIEluYy4sIEFwcGxlIEluYy4gYW5kIGNvbnRyaWJ1dG9ycy5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbmNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSxcbnRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb25cbnRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLFxuYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlXG5Tb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lOR1xuRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUlxuREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5TcHJvdXRDb3JlIGFuZCB0aGUgU3Byb3V0Q29yZSBsb2dvIGFyZSB0cmFkZW1hcmtzIG9mIFNwcm91dCBTeXN0ZW1zLCBJbmMuXG5cbkZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IFNwcm91dENvcmUsIHZpc2l0IGh0dHA6Ly93d3cuc3Byb3V0Y29yZS5jb21cblxuXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQGxpY2Vuc2UgKi9cblxuLy8gTW9zdCBvZiB0aGUgZm9sbG93aW5nIGNvZGUgaXMgdGFrZW4gZnJvbSBTcHJvdXRDb3JlIHdpdGggYSBmZXcgY2hhbmdlcy5cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiLi9vb3BcIik7XG5cbi8qXG4gKiBIZWxwZXIgZnVuY3Rpb25zIGFuZCBoYXNoZXMgZm9yIGtleSBoYW5kbGluZy5cbiAqL1xudmFyIEtleXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJldCA9IHtcbiAgICAgICAgTU9ESUZJRVJfS0VZUzoge1xuICAgICAgICAgICAgMTY6ICdTaGlmdCcsIDE3OiAnQ3RybCcsIDE4OiAnQWx0JywgMjI0OiAnTWV0YScsXG4gICAgICAgICAgICA5MTogJ01ldGFMZWZ0JywgOTI6ICdNZXRhUmlnaHQnLCA5MzogJ0NvbnRleHRNZW51J1xuICAgICAgICB9LFxuXG4gICAgICAgIEtFWV9NT0RTOiB7XG4gICAgICAgICAgICBcImN0cmxcIjogMSwgXCJhbHRcIjogMiwgXCJvcHRpb25cIiA6IDIsIFwic2hpZnRcIjogNCxcbiAgICAgICAgICAgIFwic3VwZXJcIjogOCwgXCJtZXRhXCI6IDgsIFwiY29tbWFuZFwiOiA4LCBcImNtZFwiOiA4LCBcbiAgICAgICAgICAgIFwiY29udHJvbFwiOiAxXG4gICAgICAgIH0sXG5cbiAgICAgICAgRlVOQ1RJT05fS0VZUyA6IHtcbiAgICAgICAgICAgIDggIDogXCJCYWNrc3BhY2VcIixcbiAgICAgICAgICAgIDkgIDogXCJUYWJcIixcbiAgICAgICAgICAgIDEzIDogXCJSZXR1cm5cIixcbiAgICAgICAgICAgIDE5IDogXCJQYXVzZVwiLFxuICAgICAgICAgICAgMjcgOiBcIkVzY1wiLFxuICAgICAgICAgICAgMzIgOiBcIlNwYWNlXCIsXG4gICAgICAgICAgICAzMyA6IFwiUGFnZVVwXCIsXG4gICAgICAgICAgICAzNCA6IFwiUGFnZURvd25cIixcbiAgICAgICAgICAgIDM1IDogXCJFbmRcIixcbiAgICAgICAgICAgIDM2IDogXCJIb21lXCIsXG4gICAgICAgICAgICAzNyA6IFwiTGVmdFwiLFxuICAgICAgICAgICAgMzggOiBcIlVwXCIsXG4gICAgICAgICAgICAzOSA6IFwiUmlnaHRcIixcbiAgICAgICAgICAgIDQwIDogXCJEb3duXCIsXG4gICAgICAgICAgICA0NCA6IFwiUHJpbnRcIixcbiAgICAgICAgICAgIDQ1IDogXCJJbnNlcnRcIixcbiAgICAgICAgICAgIDQ2IDogXCJEZWxldGVcIixcbiAgICAgICAgICAgIDk2IDogXCJOdW1wYWQwXCIsXG4gICAgICAgICAgICA5NyA6IFwiTnVtcGFkMVwiLFxuICAgICAgICAgICAgOTggOiBcIk51bXBhZDJcIixcbiAgICAgICAgICAgIDk5IDogXCJOdW1wYWQzXCIsXG4gICAgICAgICAgICAxMDA6IFwiTnVtcGFkNFwiLFxuICAgICAgICAgICAgMTAxOiBcIk51bXBhZDVcIixcbiAgICAgICAgICAgIDEwMjogXCJOdW1wYWQ2XCIsXG4gICAgICAgICAgICAxMDM6IFwiTnVtcGFkN1wiLFxuICAgICAgICAgICAgMTA0OiBcIk51bXBhZDhcIixcbiAgICAgICAgICAgIDEwNTogXCJOdW1wYWQ5XCIsXG4gICAgICAgICAgICAnLTEzJzogXCJOdW1wYWRFbnRlclwiLFxuICAgICAgICAgICAgMTEyOiBcIkYxXCIsXG4gICAgICAgICAgICAxMTM6IFwiRjJcIixcbiAgICAgICAgICAgIDExNDogXCJGM1wiLFxuICAgICAgICAgICAgMTE1OiBcIkY0XCIsXG4gICAgICAgICAgICAxMTY6IFwiRjVcIixcbiAgICAgICAgICAgIDExNzogXCJGNlwiLFxuICAgICAgICAgICAgMTE4OiBcIkY3XCIsXG4gICAgICAgICAgICAxMTk6IFwiRjhcIixcbiAgICAgICAgICAgIDEyMDogXCJGOVwiLFxuICAgICAgICAgICAgMTIxOiBcIkYxMFwiLFxuICAgICAgICAgICAgMTIyOiBcIkYxMVwiLFxuICAgICAgICAgICAgMTIzOiBcIkYxMlwiLFxuICAgICAgICAgICAgMTQ0OiBcIk51bWxvY2tcIixcbiAgICAgICAgICAgIDE0NTogXCJTY3JvbGxsb2NrXCJcbiAgICAgICAgfSxcblxuICAgICAgICBQUklOVEFCTEVfS0VZUzoge1xuICAgICAgICAgICAzMjogJyAnLCAgNDg6ICcwJywgIDQ5OiAnMScsICA1MDogJzInLCAgNTE6ICczJywgIDUyOiAnNCcsIDUzOiAgJzUnLFxuICAgICAgICAgICA1NDogJzYnLCAgNTU6ICc3JywgIDU2OiAnOCcsICA1NzogJzknLCAgNTk6ICc7JywgIDYxOiAnPScsIDY1OiAgJ2EnLFxuICAgICAgICAgICA2NjogJ2InLCAgNjc6ICdjJywgIDY4OiAnZCcsICA2OTogJ2UnLCAgNzA6ICdmJywgIDcxOiAnZycsIDcyOiAgJ2gnLFxuICAgICAgICAgICA3MzogJ2knLCAgNzQ6ICdqJywgIDc1OiAnaycsICA3NjogJ2wnLCAgNzc6ICdtJywgIDc4OiAnbicsIDc5OiAgJ28nLFxuICAgICAgICAgICA4MDogJ3AnLCAgODE6ICdxJywgIDgyOiAncicsICA4MzogJ3MnLCAgODQ6ICd0JywgIDg1OiAndScsIDg2OiAgJ3YnLFxuICAgICAgICAgICA4NzogJ3cnLCAgODg6ICd4JywgIDg5OiAneScsICA5MDogJ3onLCAxMDc6ICcrJywgMTA5OiAnLScsIDExMDogJy4nLFxuICAgICAgICAgIDE4NjogJzsnLCAxODc6ICc9JywgMTg4OiAnLCcsIDE4OTogJy0nLCAxOTA6ICcuJywgMTkxOiAnLycsIDE5MjogJ2AnLFxuICAgICAgICAgIDIxOTogJ1snLCAyMjA6ICdcXFxcJywyMjE6ICddJywgMjIyOiBcIidcIiwgMTExOiAnLycsIDEwNjogJyonXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gd29ya2Fyb3VuZCBmb3IgZmlyZWZveCBidWdcbiAgICByZXQuUFJJTlRBQkxFX0tFWVNbMTczXSA9ICctJztcblxuICAgIC8vIEEgcmV2ZXJzZSBtYXAgb2YgRlVOQ1RJT05fS0VZU1xuICAgIHZhciBuYW1lLCBpO1xuICAgIGZvciAoaSBpbiByZXQuRlVOQ1RJT05fS0VZUykge1xuICAgICAgICBuYW1lID0gcmV0LkZVTkNUSU9OX0tFWVNbaV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0W25hbWVdID0gcGFyc2VJbnQoaSwgMTApO1xuICAgIH1cblxuICAgIC8vIEEgcmV2ZXJzZSBtYXAgb2YgUFJJTlRBQkxFX0tFWVNcbiAgICBmb3IgKGkgaW4gcmV0LlBSSU5UQUJMRV9LRVlTKSB7XG4gICAgICAgIG5hbWUgPSByZXQuUFJJTlRBQkxFX0tFWVNbaV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0W25hbWVdID0gcGFyc2VJbnQoaSwgMTApO1xuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgTU9ESUZJRVJfS0VZUywgRlVOQ1RJT05fS0VZUyBhbmQgUFJJTlRBQkxFX0tFWVMgdG8gdGhlIEtFWVxuICAgIC8vIHZhcmlhYmxlcyBhcyB3ZWxsLlxuICAgIG9vcC5taXhpbihyZXQsIHJldC5NT0RJRklFUl9LRVlTKTtcbiAgICBvb3AubWl4aW4ocmV0LCByZXQuUFJJTlRBQkxFX0tFWVMpO1xuICAgIG9vcC5taXhpbihyZXQsIHJldC5GVU5DVElPTl9LRVlTKTtcblxuICAgIC8vIGFsaWFzZXNcbiAgICByZXQuZW50ZXIgPSByZXRbXCJyZXR1cm5cIl07XG4gICAgcmV0LmVzY2FwZSA9IHJldC5lc2M7XG4gICAgcmV0LmRlbCA9IHJldFtcImRlbGV0ZVwiXTtcbiAgICBcbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtb2RzID0gW1wiY21kXCIsIFwiY3RybFwiLCBcImFsdFwiLCBcInNoaWZ0XCJdO1xuICAgICAgICBmb3IgKHZhciBpID0gTWF0aC5wb3coMiwgbW9kcy5sZW5ndGgpOyBpLS07KSB7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXQuS0VZX01PRFNbaV0gPSBtb2RzLmZpbHRlcihmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgJiByZXQuS0VZX01PRFNbeF07XG4gICAgICAgICAgICB9KS5qb2luKFwiLVwiKSArIFwiLVwiO1xuICAgICAgICB9XG4gICAgfSkoKTtcblxuICAgIHJldC5LRVlfTU9EU1swXSA9IFwiXCI7XG4gICAgcmV0LktFWV9NT0RTWy0xXSA9IFwiaW5wdXQtXCI7XG5cbiAgICByZXR1cm4gcmV0O1xufSkoKTtcbm9vcC5taXhpbihleHBvcnRzLCBLZXlzKTtcblxuZXhwb3J0cy5rZXlDb2RlVG9TdHJpbmcgPSBmdW5jdGlvbihrZXlDb2RlKSB7XG4gICAgLy8gTGFuZ3VhZ2Utc3dpdGNoaW5nIGtleXN0cm9rZSBpbiBDaHJvbWUvTGludXggZW1pdHMga2V5Q29kZSAwLlxuICAgIHZhciBrZXlTdHJpbmcgPSBLZXlzW2tleUNvZGVdO1xuICAgIGlmICh0eXBlb2Yga2V5U3RyaW5nICE9IFwic3RyaW5nXCIpXG4gICAgICAgIGtleVN0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoa2V5Q29kZSk7XG4gICAgcmV0dXJuIGtleVN0cmluZy50b0xvd2VyQ2FzZSgpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLmxhc3QgPSBmdW5jdGlvbihhKSB7XG4gICAgcmV0dXJuIGFbYS5sZW5ndGggLSAxXTtcbn07XG5cbmV4cG9ydHMuc3RyaW5nUmV2ZXJzZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcuc3BsaXQoXCJcIikucmV2ZXJzZSgpLmpvaW4oXCJcIik7XG59O1xuXG5leHBvcnRzLnN0cmluZ1JlcGVhdCA9IGZ1bmN0aW9uIChzdHJpbmcsIGNvdW50KSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIHdoaWxlIChjb3VudCA+IDApIHtcbiAgICAgICAgaWYgKGNvdW50ICYgMSlcbiAgICAgICAgICAgIHJlc3VsdCArPSBzdHJpbmc7XG5cbiAgICAgICAgaWYgKGNvdW50ID4+PSAxKVxuICAgICAgICAgICAgc3RyaW5nICs9IHN0cmluZztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbnZhciB0cmltQmVnaW5SZWdleHAgPSAvXlxcc1xccyovO1xudmFyIHRyaW1FbmRSZWdleHAgPSAvXFxzXFxzKiQvO1xuXG5leHBvcnRzLnN0cmluZ1RyaW1MZWZ0ID0gZnVuY3Rpb24gKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSh0cmltQmVnaW5SZWdleHAsICcnKTtcbn07XG5cbmV4cG9ydHMuc3RyaW5nVHJpbVJpZ2h0ID0gZnVuY3Rpb24gKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSh0cmltRW5kUmVnZXhwLCAnJyk7XG59O1xuXG5leHBvcnRzLmNvcHlPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xufTtcblxuZXhwb3J0cy5jb3B5QXJyYXkgPSBmdW5jdGlvbihhcnJheSl7XG4gICAgdmFyIGNvcHkgPSBbXTtcbiAgICBmb3IgKHZhciBpPTAsIGw9YXJyYXkubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICBpZiAoYXJyYXlbaV0gJiYgdHlwZW9mIGFycmF5W2ldID09IFwib2JqZWN0XCIpXG4gICAgICAgICAgICBjb3B5W2ldID0gdGhpcy5jb3B5T2JqZWN0KGFycmF5W2ldKTtcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIGNvcHlbaV0gPSBhcnJheVtpXTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG59O1xuXG5leHBvcnRzLmRlZXBDb3B5ID0gZnVuY3Rpb24gZGVlcENvcHkob2JqKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIgfHwgIW9iailcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB2YXIgY29weTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgIGNvcHkgPSBbXTtcbiAgICAgICAgZm9yICh2YXIga2V5ID0gMDsga2V5IDwgb2JqLmxlbmd0aDsga2V5KyspIHtcbiAgICAgICAgICAgIGNvcHlba2V5XSA9IGRlZXBDb3B5KG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29weTtcbiAgICB9XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopICE9PSBcIltvYmplY3QgT2JqZWN0XVwiKVxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIFxuICAgIGNvcHkgPSB7fTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKVxuICAgICAgICBjb3B5W2tleV0gPSBkZWVwQ29weShvYmpba2V5XSk7XG4gICAgcmV0dXJuIGNvcHk7XG59O1xuXG5leHBvcnRzLmFycmF5VG9NYXAgPSBmdW5jdGlvbihhcnIpIHtcbiAgICB2YXIgbWFwID0ge307XG4gICAgZm9yICh2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBtYXBbYXJyW2ldXSA9IDE7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG5cbn07XG5cbmV4cG9ydHMuY3JlYXRlTWFwID0gZnVuY3Rpb24ocHJvcHMpIHtcbiAgICB2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBmb3IgKHZhciBpIGluIHByb3BzKSB7XG4gICAgICAgIG1hcFtpXSA9IHByb3BzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbWFwO1xufTtcblxuLypcbiAqIHNwbGljZSBvdXQgb2YgJ2FycmF5JyBhbnl0aGluZyB0aGF0ID09PSAndmFsdWUnXG4gKi9cbmV4cG9ydHMuYXJyYXlSZW1vdmUgPSBmdW5jdGlvbihhcnJheSwgdmFsdWUpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPD0gYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodmFsdWUgPT09IGFycmF5W2ldKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnRzLmVzY2FwZVJlZ0V4cCA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsuKis/XiR7fSgpfFtcXF1cXC9cXFxcXSkvZywgJ1xcXFwkMScpO1xufTtcblxuZXhwb3J0cy5lc2NhcGVIVE1MID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgcmV0dXJuIChcIlwiICsgc3RyKS5yZXBsYWNlKC8mL2csIFwiJiMzODtcIikucmVwbGFjZSgvXCIvZywgXCImIzM0O1wiKS5yZXBsYWNlKC8nL2csIFwiJiMzOTtcIikucmVwbGFjZSgvPC9nLCBcIiYjNjA7XCIpO1xufTtcblxuZXhwb3J0cy5nZXRNYXRjaE9mZnNldHMgPSBmdW5jdGlvbihzdHJpbmcsIHJlZ0V4cCkge1xuICAgIHZhciBtYXRjaGVzID0gW107XG5cbiAgICBzdHJpbmcucmVwbGFjZShyZWdFeHAsIGZ1bmN0aW9uKHN0cikge1xuICAgICAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgICAgICAgb2Zmc2V0OiBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aC0yXSxcbiAgICAgICAgICAgIGxlbmd0aDogc3RyLmxlbmd0aFxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBtYXRjaGVzO1xufTtcblxuLyogZGVwcmVjYXRlZCAqL1xuZXhwb3J0cy5kZWZlcnJlZENhbGwgPSBmdW5jdGlvbihmY24pIHtcbiAgICB2YXIgdGltZXIgPSBudWxsO1xuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aW1lciA9IG51bGw7XG4gICAgICAgIGZjbigpO1xuICAgIH07XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBmdW5jdGlvbih0aW1lb3V0KSB7XG4gICAgICAgIGRlZmVycmVkLmNhbmNlbCgpO1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoY2FsbGJhY2ssIHRpbWVvdXQgfHwgMCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICB9O1xuXG4gICAgZGVmZXJyZWQuc2NoZWR1bGUgPSBkZWZlcnJlZDtcblxuICAgIGRlZmVycmVkLmNhbGwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICAgICAgZmNuKCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICB9O1xuXG4gICAgZGVmZXJyZWQuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgIH07XG4gICAgXG4gICAgZGVmZXJyZWQuaXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aW1lcjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmVycmVkO1xufTtcblxuXG5leHBvcnRzLmRlbGF5ZWRDYWxsID0gZnVuY3Rpb24oZmNuLCBkZWZhdWx0VGltZW91dCkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG4gICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgZmNuKCk7XG4gICAgfTtcblxuICAgIHZhciBfc2VsZiA9IGZ1bmN0aW9uKHRpbWVvdXQpIHtcbiAgICAgICAgaWYgKHRpbWVyID09IG51bGwpXG4gICAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoY2FsbGJhY2ssIHRpbWVvdXQgfHwgZGVmYXVsdFRpbWVvdXQpO1xuICAgIH07XG5cbiAgICBfc2VsZi5kZWxheSA9IGZ1bmN0aW9uKHRpbWVvdXQpIHtcbiAgICAgICAgdGltZXIgJiYgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGNhbGxiYWNrLCB0aW1lb3V0IHx8IGRlZmF1bHRUaW1lb3V0KTtcbiAgICB9O1xuICAgIF9zZWxmLnNjaGVkdWxlID0gX3NlbGY7XG5cbiAgICBfc2VsZi5jYWxsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgICAgIGZjbigpO1xuICAgIH07XG5cbiAgICBfc2VsZi5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGltZXIgJiYgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgdGltZXIgPSBudWxsO1xuICAgIH07XG5cbiAgICBfc2VsZi5pc1BlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRpbWVyO1xuICAgIH07XG5cbiAgICByZXR1cm4gX3NlbGY7XG59O1xuIiwiLypcbiAqIGJhc2VkIG9uIGNvZGUgZnJvbTpcbiAqXG4gKiBAbGljZW5zZSBSZXF1aXJlSlMgdGV4dCAwLjI1LjAgQ29weXJpZ2h0IChjKSAyMDEwLTIwMTEsIFRoZSBEb2pvIEZvdW5kYXRpb24gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIEF2YWlsYWJsZSB2aWEgdGhlIE1JVCBvciBuZXcgQlNEIGxpY2Vuc2UuXG4gKiBzZWU6IGh0dHA6Ly9naXRodWIuY29tL2pyYnVya2UvcmVxdWlyZWpzIGZvciBkZXRhaWxzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZG9tID0gcmVxdWlyZShcIi4vZG9tXCIpO1xuXG5leHBvcnRzLmdldCA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vRG8gbm90IGV4cGxpY2l0bHkgaGFuZGxlIGVycm9ycywgdGhvc2Ugc2hvdWxkIGJlXG4gICAgICAgIC8vdmlzaWJsZSB2aWEgY29uc29sZSBvdXRwdXQgaW4gdGhlIGJyb3dzZXIuXG4gICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgY2FsbGJhY2soeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHhoci5zZW5kKG51bGwpO1xufTtcblxuZXhwb3J0cy5sb2FkU2NyaXB0ID0gZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvbS5nZXREb2N1bWVudEhlYWQoKTtcbiAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgcy5zcmMgPSBwYXRoO1xuICAgIGhlYWQuYXBwZW5kQ2hpbGQocyk7XG5cbiAgICBzLm9ubG9hZCA9IHMub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oXywgaXNBYm9ydCkge1xuICAgICAgICBpZiAoaXNBYm9ydCB8fCAhcy5yZWFkeVN0YXRlIHx8IHMucmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiIHx8IHMucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgIHMgPSBzLm9ubG9hZCA9IHMub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghaXNBYm9ydClcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qXG4gKiBDb252ZXJ0IGEgdXJsIGludG8gYSBmdWxseSBxdWFsaWZpZWQgYWJzb2x1dGUgVVJMXG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXMgbm90IHdvcmsgaW4gSUU2XG4gKi9cbmV4cG9ydHMucXVhbGlmeVVSTCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGEuaHJlZiA9IHVybDtcbiAgICByZXR1cm4gYS5ocmVmO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3I7XG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG5leHBvcnRzLm1peGluID0gZnVuY3Rpb24ob2JqLCBtaXhpbikge1xuICAgIGZvciAodmFyIGtleSBpbiBtaXhpbikge1xuICAgICAgICBvYmpba2V5XSA9IG1peGluW2tleV07XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG59O1xuXG5leHBvcnRzLmltcGxlbWVudCA9IGZ1bmN0aW9uKHByb3RvLCBtaXhpbikge1xuICAgIGV4cG9ydHMubWl4aW4ocHJvdG8sIG1peGluKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLypcbiAqIEkgaGF0ZSBkb2luZyB0aGlzLCBidXQgd2UgbmVlZCBzb21lIHdheSB0byBkZXRlcm1pbmUgaWYgdGhlIHVzZXIgaXMgb24gYSBNYWNcbiAqIFRoZSByZWFzb24gaXMgdGhhdCB1c2VycyBoYXZlIGRpZmZlcmVudCBleHBlY3RhdGlvbnMgb2YgdGhlaXIga2V5IGNvbWJpbmF0aW9ucy5cbiAqXG4gKiBUYWtlIGNvcHkgYXMgYW4gZXhhbXBsZSwgTWFjIHBlb3BsZSBleHBlY3QgdG8gdXNlIENNRCBvciBBUFBMRSArIENcbiAqIFdpbmRvd3MgZm9sa3MgZXhwZWN0IHRvIHVzZSBDVFJMICsgQ1xuICovXG5leHBvcnRzLk9TID0ge1xuICAgIExJTlVYOiBcIkxJTlVYXCIsXG4gICAgTUFDOiBcIk1BQ1wiLFxuICAgIFdJTkRPV1M6IFwiV0lORE9XU1wiXG59O1xuXG4vKlxuICogUmV0dXJuIGFuIGV4cG9ydHMuT1MgY29uc3RhbnRcbiAqL1xuZXhwb3J0cy5nZXRPUyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChleHBvcnRzLmlzTWFjKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRzLk9TLk1BQztcbiAgICB9IGVsc2UgaWYgKGV4cG9ydHMuaXNMaW51eCkge1xuICAgICAgICByZXR1cm4gZXhwb3J0cy5PUy5MSU5VWDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZXhwb3J0cy5PUy5XSU5ET1dTO1xuICAgIH1cbn07XG5cbi8vIHRoaXMgY2FuIGJlIGNhbGxlZCBpbiBub24gYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gZnJvbSBhY2UvcmVxdWlyZWpzL3RleHQpXG52YXIgX25hdmlnYXRvciA9IHR5cGVvZiBuYXZpZ2F0b3IgPT0gXCJvYmplY3RcIiA/IG5hdmlnYXRvciA6IHt9O1xuXG52YXIgb3MgPSAoL21hY3x3aW58bGludXgvaS5leGVjKF9uYXZpZ2F0b3IucGxhdGZvcm0pIHx8IFtcIm90aGVyXCJdKVswXS50b0xvd2VyQ2FzZSgpO1xudmFyIHVhID0gX25hdmlnYXRvci51c2VyQWdlbnQgfHwgXCJcIjtcbnZhciBhcHBOYW1lID0gX25hdmlnYXRvci5hcHBOYW1lIHx8IFwiXCI7XG5cbi8vIElzIHRoZSB1c2VyIHVzaW5nIGEgYnJvd3NlciB0aGF0IGlkZW50aWZpZXMgaXRzZWxmIGFzIFdpbmRvd3NcbmV4cG9ydHMuaXNXaW4gPSAob3MgPT0gXCJ3aW5cIik7XG5cbi8vIElzIHRoZSB1c2VyIHVzaW5nIGEgYnJvd3NlciB0aGF0IGlkZW50aWZpZXMgaXRzZWxmIGFzIE1hYyBPU1xuZXhwb3J0cy5pc01hYyA9IChvcyA9PSBcIm1hY1wiKTtcblxuLy8gSXMgdGhlIHVzZXIgdXNpbmcgYSBicm93c2VyIHRoYXQgaWRlbnRpZmllcyBpdHNlbGYgYXMgTGludXhcbmV4cG9ydHMuaXNMaW51eCA9IChvcyA9PSBcImxpbnV4XCIpO1xuXG4vLyBXaW5kb3dzIFN0b3JlIEphdmFTY3JpcHQgYXBwcyAoYWthIE1ldHJvIGFwcHMgd3JpdHRlbiBpbiBIVE1MNSBhbmQgSmF2YVNjcmlwdCkgZG8gbm90IHVzZSB0aGUgXCJNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXJcIiBzdHJpbmcgaW4gdGhlaXIgdXNlciBhZ2VudCwgYnV0IFwiTVNBcHBIb3N0XCIgaW5zdGVhZC5cbmV4cG9ydHMuaXNJRSA9IFxuICAgIChhcHBOYW1lID09IFwiTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyXCIgfHwgYXBwTmFtZS5pbmRleE9mKFwiTVNBcHBIb3N0XCIpID49IDApXG4gICAgPyBwYXJzZUZsb2F0KCh1YS5tYXRjaCgvKD86TVNJRSB8VHJpZGVudFxcL1swLTldK1tcXC4wLTldKzsuKnJ2OikoWzAtOV0rW1xcLjAtOV0rKS8pfHxbXSlbMV0pXG4gICAgOiBwYXJzZUZsb2F0KCh1YS5tYXRjaCgvKD86VHJpZGVudFxcL1swLTldK1tcXC4wLTldKzsuKnJ2OikoWzAtOV0rW1xcLjAtOV0rKS8pfHxbXSlbMV0pOyAvLyBmb3IgaWVcbiAgICBcbmV4cG9ydHMuaXNPbGRJRSA9IGV4cG9ydHMuaXNJRSAmJiBleHBvcnRzLmlzSUUgPCA5O1xuXG4vLyBJcyB0aGlzIEZpcmVmb3ggb3IgcmVsYXRlZD9cbmV4cG9ydHMuaXNHZWNrbyA9IGV4cG9ydHMuaXNNb3ppbGxhID0gdWEubWF0Y2goLyBHZWNrb1xcL1xcZCsvKTtcblxuLy8gSXMgdGhpcyBPcGVyYSBcbmV4cG9ydHMuaXNPcGVyYSA9IHR5cGVvZiBvcGVyYSA9PSBcIm9iamVjdFwiICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh3aW5kb3cub3BlcmEpID09IFwiW29iamVjdCBPcGVyYV1cIjtcblxuLy8gSXMgdGhlIHVzZXIgdXNpbmcgYSBicm93c2VyIHRoYXQgaWRlbnRpZmllcyBpdHNlbGYgYXMgV2ViS2l0IFxuZXhwb3J0cy5pc1dlYktpdCA9IHBhcnNlRmxvYXQodWEuc3BsaXQoXCJXZWJLaXQvXCIpWzFdKSB8fCB1bmRlZmluZWQ7XG5cbmV4cG9ydHMuaXNDaHJvbWUgPSBwYXJzZUZsb2F0KHVhLnNwbGl0KFwiIENocm9tZS9cIilbMV0pIHx8IHVuZGVmaW5lZDtcblxuZXhwb3J0cy5pc0VkZ2UgPSBwYXJzZUZsb2F0KHVhLnNwbGl0KFwiIEVkZ2UvXCIpWzFdKSB8fCB1bmRlZmluZWQ7XG5cbmV4cG9ydHMuaXNBSVIgPSB1YS5pbmRleE9mKFwiQWRvYmVBSVJcIikgPj0gMDtcblxuZXhwb3J0cy5pc0FuZHJvaWQgPSB1YS5pbmRleE9mKFwiQW5kcm9pZFwiKSA+PSAwO1xuXG5leHBvcnRzLmlzQ2hyb21lT1MgPSB1YS5pbmRleE9mKFwiIENyT1MgXCIpID49IDA7XG5cbmV4cG9ydHMuaXNJT1MgPSAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdCh1YSkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcblxuaWYgKGV4cG9ydHMuaXNJT1MpIGV4cG9ydHMuaXNNYWMgPSB0cnVlO1xuXG5leHBvcnRzLmlzTW9iaWxlID0gZXhwb3J0cy5pc0lPUyB8fCBleHBvcnRzLmlzQW5kcm9pZDtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZXZlbnQgPSByZXF1aXJlKFwiLi9saWIvZXZlbnRcIik7XG5cbi8qKiBcbiAqXG4gKlxuICogQmF0Y2hlcyBjaGFuZ2VzICh0aGF0IGZvcmNlIHNvbWV0aGluZyB0byBiZSByZWRyYXduKSBpbiB0aGUgYmFja2dyb3VuZC5cbiAqIEBjbGFzcyBSZW5kZXJMb29wXG4gKiovXG5cblxudmFyIFJlbmRlckxvb3AgPSBmdW5jdGlvbihvblJlbmRlciwgd2luKSB7XG4gICAgdGhpcy5vblJlbmRlciA9IG9uUmVuZGVyO1xuICAgIHRoaXMucGVuZGluZyA9IGZhbHNlO1xuICAgIHRoaXMuY2hhbmdlcyA9IDA7XG4gICAgdGhpcy4kcmVjdXJzaW9uTGltaXQgPSAyO1xuICAgIHRoaXMud2luZG93ID0gd2luIHx8IHdpbmRvdztcbiAgICB2YXIgX3NlbGYgPSB0aGlzO1xuICAgIHRoaXMuX2ZsdXNoID0gZnVuY3Rpb24odHMpIHtcbiAgICAgICAgX3NlbGYucGVuZGluZyA9IGZhbHNlO1xuICAgICAgICB2YXIgY2hhbmdlcyA9IF9zZWxmLmNoYW5nZXM7XG5cbiAgICAgICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgICAgICAgIGV2ZW50LmJsb2NrSWRsZSgxMDApO1xuICAgICAgICAgICAgX3NlbGYuY2hhbmdlcyA9IDA7XG4gICAgICAgICAgICBfc2VsZi5vblJlbmRlcihjaGFuZ2VzKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKF9zZWxmLmNoYW5nZXMpIHtcbiAgICAgICAgICAgIGlmIChfc2VsZi4kcmVjdXJzaW9uTGltaXQtLSA8IDApIHJldHVybjtcbiAgICAgICAgICAgIF9zZWxmLnNjaGVkdWxlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfc2VsZi4kcmVjdXJzaW9uTGltaXQgPSAyO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbihmdW5jdGlvbigpIHtcblxuICAgIHRoaXMuc2NoZWR1bGUgPSBmdW5jdGlvbihjaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5jaGFuZ2VzID0gdGhpcy5jaGFuZ2VzIHwgY2hhbmdlO1xuICAgICAgICBpZiAodGhpcy5jaGFuZ2VzICYmICF0aGlzLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIGV2ZW50Lm5leHRGcmFtZSh0aGlzLl9mbHVzaCk7XG4gICAgICAgICAgICB0aGlzLnBlbmRpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuY2xlYXIgPSBmdW5jdGlvbihjaGFuZ2UpIHtcbiAgICAgICAgdmFyIGNoYW5nZXMgPSB0aGlzLmNoYW5nZXM7XG4gICAgICAgIHRoaXMuY2hhbmdlcyA9IDA7XG4gICAgICAgIHJldHVybiBjaGFuZ2VzO1xuICAgIH07XG5cbn0pLmNhbGwoUmVuZGVyTG9vcC5wcm90b3R5cGUpO1xuXG5leHBvcnRzLlJlbmRlckxvb3AgPSBSZW5kZXJMb29wO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiLi9saWIvb29wXCIpO1xudmFyIGRvbSA9IHJlcXVpcmUoXCIuL2xpYi9kb21cIik7XG52YXIgZXZlbnQgPSByZXF1aXJlKFwiLi9saWIvZXZlbnRcIik7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcIi4vbGliL2V2ZW50X2VtaXR0ZXJcIikuRXZlbnRFbWl0dGVyO1xuLy8gb24gaWUgbWF4aW1hbCBlbGVtZW50IGhlaWdodCBpcyBzbWFsbGVyIHRoYW4gd2hhdCB3ZSBnZXQgZnJvbSA0LTVLIGxpbmUgZG9jdW1lbnRcbi8vIHNvIHNjcm9sbGJhciBkb2Vzbid0IHdvcmssIGFzIGEgd29ya2Fyb3VuZCB3ZSBkbyBub3Qgc2V0IGhlaWdodCBoaWdoZXIgdGhhbiBNQVhfU0NST0xMX0hcbi8vIGFuZCByZXNjYWxlIHNjcm9sbHRvcFxudmFyIE1BWF9TQ1JPTExfSCA9IDB4ODAwMDtcblxuLyoqXG4gKiBBbiBhYnN0cmFjdCBjbGFzcyByZXByZXNlbnRpbmcgYSBuYXRpdmUgc2Nyb2xsYmFyIGNvbnRyb2wuXG4gKiBAY2xhc3MgU2Nyb2xsQmFyXG4gKiovXG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgU2Nyb2xsQmFyYC4gYHBhcmVudGAgaXMgdGhlIG93bmVyIG9mIHRoZSBzY3JvbGwgYmFyLlxuICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnQgQSBET00gZWxlbWVudFxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICoqL1xudmFyIFNjcm9sbEJhciA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGRvbS5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBcImFjZV9zY3JvbGxiYXIgYWNlX3Njcm9sbGJhclwiICsgdGhpcy5jbGFzc1N1ZmZpeDtcblxuICAgIHRoaXMuaW5uZXIgPSBkb20uY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSA9IFwiYWNlX3Njcm9sbGJhci1pbm5lclwiO1xuICAgIC8vIG9uIHNhZmFyaSBzY3JvbGxiYXIgaXMgbm90IHNob3duIGZvciBlbXB0eSBlbGVtZW50c1xuICAgIHRoaXMuaW5uZXIudGV4dENvbnRlbnQgPSBcIlxceGEwXCI7XG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuaW5uZXIpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG5cbiAgICB0aGlzLnNldFZpc2libGUoZmFsc2UpO1xuICAgIHRoaXMuc2tpcEV2ZW50ID0gZmFsc2U7XG5cbiAgICBldmVudC5hZGRMaXN0ZW5lcih0aGlzLmVsZW1lbnQsIFwic2Nyb2xsXCIsIHRoaXMub25TY3JvbGwuYmluZCh0aGlzKSk7XG4gICAgZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5lbGVtZW50LCBcIm1vdXNlZG93blwiLCBldmVudC5wcmV2ZW50RGVmYXVsdCk7XG59O1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgb29wLmltcGxlbWVudCh0aGlzLCBFdmVudEVtaXR0ZXIpO1xuXG4gICAgdGhpcy5zZXRWaXNpYmxlID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gXCJcIiA6IFwibm9uZVwiO1xuICAgICAgICB0aGlzLmlzVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgICAgICAgdGhpcy5jb2VmZiA9IDE7XG4gICAgfTtcbn0pLmNhbGwoU2Nyb2xsQmFyLnByb3RvdHlwZSk7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHZlcnRpY2FsIHNjcm9sbCBiYXIuXG4gKiBAY2xhc3MgVlNjcm9sbEJhclxuICoqL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYFZTY3JvbGxCYXJgLiBgcGFyZW50YCBpcyB0aGUgb3duZXIgb2YgdGhlIHNjcm9sbCBiYXIuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHBhcmVudCBBIERPTSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gcmVuZGVyZXIgQW4gZWRpdG9yIHJlbmRlcmVyXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiovXG52YXIgVlNjcm9sbEJhciA9IGZ1bmN0aW9uKHBhcmVudCwgcmVuZGVyZXIpIHtcbiAgICBTY3JvbGxCYXIuY2FsbCh0aGlzLCBwYXJlbnQpO1xuICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcbiAgICB0aGlzLnNjcm9sbEhlaWdodCA9IDA7XG5cbiAgICAvLyBpbiBPU1ggbGlvbiB0aGUgc2Nyb2xsYmFycyBhcHBlYXIgdG8gaGF2ZSBubyB3aWR0aC4gSW4gdGhpcyBjYXNlIHJlc2l6ZSB0aGVcbiAgICAvLyBlbGVtZW50IHRvIHNob3cgdGhlIHNjcm9sbGJhciBidXQgc3RpbGwgcHJldGVuZCB0aGF0IHRoZSBzY3JvbGxiYXIgaGFzIGEgd2lkdGhcbiAgICAvLyBvZiAwcHhcbiAgICAvLyBpbiBGaXJlZm94IDYrIHNjcm9sbGJhciBpcyBoaWRkZW4gaWYgZWxlbWVudCBoYXMgdGhlIHNhbWUgd2lkdGggYXMgc2Nyb2xsYmFyXG4gICAgLy8gbWFrZSBlbGVtZW50IGEgbGl0dGxlIGJpdCB3aWRlciB0byByZXRhaW4gc2Nyb2xsYmFyIHdoZW4gcGFnZSBpcyB6b29tZWQgXG4gICAgcmVuZGVyZXIuJHNjcm9sbGJhcldpZHRoID0gXG4gICAgdGhpcy53aWR0aCA9IGRvbS5zY3JvbGxiYXJXaWR0aChwYXJlbnQub3duZXJEb2N1bWVudCk7XG4gICAgdGhpcy5pbm5lci5zdHlsZS53aWR0aCA9XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gKHRoaXMud2lkdGggfHwgMTUpICsgNSArIFwicHhcIjtcbiAgICB0aGlzLiRtaW5XaWR0aCA9IDA7XG59O1xuXG5vb3AuaW5oZXJpdHMoVlNjcm9sbEJhciwgU2Nyb2xsQmFyKTtcblxuKGZ1bmN0aW9uKCkge1xuXG4gICAgdGhpcy5jbGFzc1N1ZmZpeCA9ICctdic7XG5cbiAgICAvKipcbiAgICAgKiBFbWl0dGVkIHdoZW4gdGhlIHNjcm9sbCBiYXIsIHdlbGwsIHNjcm9sbHMuXG4gICAgICogQGV2ZW50IHNjcm9sbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlIENvbnRhaW5zIG9uZSBwcm9wZXJ0eSwgYFwiZGF0YVwiYCwgd2hpY2ggaW5kaWNhdGVzIHRoZSBjdXJyZW50IHNjcm9sbCB0b3AgcG9zaXRpb25cbiAgICAgKiovXG4gICAgdGhpcy5vblNjcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuc2tpcEV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IHRoaXMuZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgICAgICAgICBpZiAodGhpcy5jb2VmZiAhPSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIGggPSB0aGlzLmVsZW1lbnQuY2xpZW50SGVpZ2h0IC8gdGhpcy5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcCAqICgxIC0gaCkgLyAodGhpcy5jb2VmZiAtIGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZW1pdChcInNjcm9sbFwiLCB7ZGF0YTogdGhpcy5zY3JvbGxUb3B9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNraXBFdmVudCA9IGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB3aWR0aCBvZiB0aGUgc2Nyb2xsIGJhci5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqKi9cbiAgICB0aGlzLmdldFdpZHRoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCh0aGlzLmlzVmlzaWJsZSA/IHRoaXMud2lkdGggOiAwLCB0aGlzLiRtaW5XaWR0aCB8fCAwKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgaGVpZ2h0IG9mIHRoZSBzY3JvbGwgYmFyLCBpbiBwaXhlbHMuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCBUaGUgbmV3IGhlaWdodFxuICAgICAqKi9cbiAgICB0aGlzLnNldEhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgXCJweFwiO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBpbm5lciBoZWlnaHQgb2YgdGhlIHNjcm9sbCBiYXIsIGluIHBpeGVscy5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0IFRoZSBuZXcgaW5uZXIgaGVpZ2h0XG4gICAgICogQGRlcHJlY2F0ZWQgVXNlIHNldFNjcm9sbEhlaWdodCBpbnN0ZWFkXG4gICAgICoqL1xuICAgIHRoaXMuc2V0SW5uZXJIZWlnaHQgPSBcbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBzY3JvbGwgaGVpZ2h0IG9mIHRoZSBzY3JvbGwgYmFyLCBpbiBwaXhlbHMuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCBUaGUgbmV3IHNjcm9sbCBoZWlnaHRcbiAgICAgKiovXG4gICAgdGhpcy5zZXRTY3JvbGxIZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGlmIChoZWlnaHQgPiBNQVhfU0NST0xMX0gpIHtcbiAgICAgICAgICAgIHRoaXMuY29lZmYgPSBNQVhfU0NST0xMX0ggLyBoZWlnaHQ7XG4gICAgICAgICAgICBoZWlnaHQgPSBNQVhfU0NST0xMX0g7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb2VmZiAhPSAxKSB7XG4gICAgICAgICAgICB0aGlzLmNvZWZmID0gMTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFwicHhcIjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgc2Nyb2xsIHRvcCBvZiB0aGUgc2Nyb2xsIGJhci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gc2Nyb2xsVG9wIFRoZSBuZXcgc2Nyb2xsIHRvcFxuICAgICAqKi9cbiAgICB0aGlzLnNldFNjcm9sbFRvcCA9IGZ1bmN0aW9uKHNjcm9sbFRvcCkge1xuICAgICAgICAvLyBvbiBjaHJvbWUgMTcrIGZvciBzbWFsbCB6b29tIGxldmVscyBhZnRlciBjYWxsaW5nIHRoaXMgZnVuY3Rpb25cbiAgICAgICAgLy8gdGhpcy5lbGVtZW50LnNjcm9sbFRvcCAhPSBzY3JvbGxUb3Agd2hpY2ggbWFrZXMgcGFnZSB0byBzY3JvbGwgdXAuXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvcCAhPSBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIHRoaXMuc2tpcEV2ZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gc2Nyb2xsVG9wO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnNjcm9sbFRvcCA9IHNjcm9sbFRvcCAqIHRoaXMuY29lZmY7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KS5jYWxsKFZTY3JvbGxCYXIucHJvdG90eXBlKTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgaG9yaXNvbnRhbCBzY3JvbGwgYmFyLlxuICogQGNsYXNzIEhTY3JvbGxCYXJcbiAqKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBIU2Nyb2xsQmFyYC4gYHBhcmVudGAgaXMgdGhlIG93bmVyIG9mIHRoZSBzY3JvbGwgYmFyLlxuICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnQgQSBET00gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IHJlbmRlcmVyIEFuIGVkaXRvciByZW5kZXJlclxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICoqL1xudmFyIEhTY3JvbGxCYXIgPSBmdW5jdGlvbihwYXJlbnQsIHJlbmRlcmVyKSB7XG4gICAgU2Nyb2xsQmFyLmNhbGwodGhpcywgcGFyZW50KTtcbiAgICB0aGlzLnNjcm9sbExlZnQgPSAwO1xuXG4gICAgLy8gaW4gT1NYIGxpb24gdGhlIHNjcm9sbGJhcnMgYXBwZWFyIHRvIGhhdmUgbm8gd2lkdGguIEluIHRoaXMgY2FzZSByZXNpemUgdGhlXG4gICAgLy8gZWxlbWVudCB0byBzaG93IHRoZSBzY3JvbGxiYXIgYnV0IHN0aWxsIHByZXRlbmQgdGhhdCB0aGUgc2Nyb2xsYmFyIGhhcyBhIHdpZHRoXG4gICAgLy8gb2YgMHB4XG4gICAgLy8gaW4gRmlyZWZveCA2KyBzY3JvbGxiYXIgaXMgaGlkZGVuIGlmIGVsZW1lbnQgaGFzIHRoZSBzYW1lIHdpZHRoIGFzIHNjcm9sbGJhclxuICAgIC8vIG1ha2UgZWxlbWVudCBhIGxpdHRsZSBiaXQgd2lkZXIgdG8gcmV0YWluIHNjcm9sbGJhciB3aGVuIHBhZ2UgaXMgem9vbWVkIFxuICAgIHRoaXMuaGVpZ2h0ID0gcmVuZGVyZXIuJHNjcm9sbGJhcldpZHRoO1xuICAgIHRoaXMuaW5uZXIuc3R5bGUuaGVpZ2h0ID1cbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKHRoaXMuaGVpZ2h0IHx8IDE1KSArIDUgKyBcInB4XCI7XG59O1xuXG5vb3AuaW5oZXJpdHMoSFNjcm9sbEJhciwgU2Nyb2xsQmFyKTtcblxuKGZ1bmN0aW9uKCkge1xuXG4gICAgdGhpcy5jbGFzc1N1ZmZpeCA9ICctaCc7XG5cbiAgICAvKipcbiAgICAgKiBFbWl0dGVkIHdoZW4gdGhlIHNjcm9sbCBiYXIsIHdlbGwsIHNjcm9sbHMuXG4gICAgICogQGV2ZW50IHNjcm9sbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlIENvbnRhaW5zIG9uZSBwcm9wZXJ0eSwgYFwiZGF0YVwiYCwgd2hpY2ggaW5kaWNhdGVzIHRoZSBjdXJyZW50IHNjcm9sbCBsZWZ0IHBvc2l0aW9uXG4gICAgICoqL1xuICAgIHRoaXMub25TY3JvbGwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNraXBFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxMZWZ0ID0gdGhpcy5lbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICB0aGlzLl9lbWl0KFwic2Nyb2xsXCIsIHtkYXRhOiB0aGlzLnNjcm9sbExlZnR9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNraXBFdmVudCA9IGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoZWlnaHQgb2YgdGhlIHNjcm9sbCBiYXIuXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKiovXG4gICAgdGhpcy5nZXRIZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWaXNpYmxlID8gdGhpcy5oZWlnaHQgOiAwO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSB3aWR0aCBvZiB0aGUgc2Nyb2xsIGJhciwgaW4gcGl4ZWxzLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB3aWR0aCBUaGUgbmV3IHdpZHRoXG4gICAgICoqL1xuICAgIHRoaXMuc2V0V2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArIFwicHhcIjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgaW5uZXIgd2lkdGggb2YgdGhlIHNjcm9sbCBiYXIsIGluIHBpeGVscy5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gd2lkdGggVGhlIG5ldyBpbm5lciB3aWR0aFxuICAgICAqIEBkZXByZWNhdGVkIFVzZSBzZXRTY3JvbGxXaWR0aCBpbnN0ZWFkXG4gICAgICoqL1xuICAgIHRoaXMuc2V0SW5uZXJXaWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XG4gICAgICAgIHRoaXMuaW5uZXIuc3R5bGUud2lkdGggPSB3aWR0aCArIFwicHhcIjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgc2Nyb2xsIHdpZHRoIG9mIHRoZSBzY3JvbGwgYmFyLCBpbiBwaXhlbHMuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIFRoZSBuZXcgc2Nyb2xsIHdpZHRoXG4gICAgICoqL1xuICAgIHRoaXMuc2V0U2Nyb2xsV2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xuICAgICAgICB0aGlzLmlubmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyBcInB4XCI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHNjcm9sbCBsZWZ0IG9mIHRoZSBzY3JvbGwgYmFyLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGxMZWZ0IFRoZSBuZXcgc2Nyb2xsIGxlZnRcbiAgICAgKiovXG4gICAgdGhpcy5zZXRTY3JvbGxMZWZ0ID0gZnVuY3Rpb24oc2Nyb2xsTGVmdCkge1xuICAgICAgICAvLyBvbiBjaHJvbWUgMTcrIGZvciBzbWFsbCB6b29tIGxldmVscyBhZnRlciBjYWxsaW5nIHRoaXMgZnVuY3Rpb25cbiAgICAgICAgLy8gdGhpcy5lbGVtZW50LnNjcm9sbFRvcCAhPSBzY3JvbGxUb3Agd2hpY2ggbWFrZXMgcGFnZSB0byBzY3JvbGwgdXAuXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbExlZnQgIT0gc2Nyb2xsTGVmdCkge1xuICAgICAgICAgICAgdGhpcy5za2lwRXZlbnQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxMZWZ0ID0gdGhpcy5lbGVtZW50LnNjcm9sbExlZnQgPSBzY3JvbGxMZWZ0O1xuICAgICAgICB9XG4gICAgfTtcblxufSkuY2FsbChIU2Nyb2xsQmFyLnByb3RvdHlwZSk7XG5cblxuZXhwb3J0cy5TY3JvbGxCYXIgPSBWU2Nyb2xsQmFyOyAvLyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5leHBvcnRzLlNjcm9sbEJhclYgPSBWU2Nyb2xsQmFyOyAvLyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5leHBvcnRzLlNjcm9sbEJhckggPSBIU2Nyb2xsQmFyOyAvLyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5cbmV4cG9ydHMuVlNjcm9sbEJhciA9IFZTY3JvbGxCYXI7XG5leHBvcnRzLkhTY3JvbGxCYXIgPSBIU2Nyb2xsQmFyO1xuIiwiLyogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEJTRCBsaWNlbnNlOlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMCwgQWpheC5vcmcgQi5WLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gKiBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiAgICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICogICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAgICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgQWpheC5vcmcgQi5WLiBub3IgdGhlXG4gKiAgICAgICBuYW1lcyBvZiBpdHMgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0c1xuICogICAgICAgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKiBcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuICogQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEFKQVguT1JHIEIuVi4gQkUgTElBQkxFIEZPUiBBTllcbiAqIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gKiAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG4gKiBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAqIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKiAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJU1xuICogU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKiogKi9cblxuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIGJpbmRLZXkod2luLCBtYWMpIHtcbiAgICByZXR1cm4ge3dpbjogd2luLCBtYWM6IG1hY307XG59XG5cbmV4cG9ydHMuY29tbWFuZHMgPSBbe1xuICAgIG5hbWU6IFwic2VsZWN0QWxsXCIsXG4gICAgYmluZEtleTogYmluZEtleShcIkN0cmwtQVwiLCBcIkNvbW1hbmQtQVwiKSxcbiAgICBleGVjOiBmdW5jdGlvbihlZGl0b3IpIHsgZWRpdG9yLnNlbGVjdEFsbCgpOyB9XG59LCB7XG4gICAgbmFtZTogXCJjZW50ZXJzZWxlY3Rpb25cIixcbiAgICBiaW5kS2V5OiBiaW5kS2V5KG51bGwsIFwiQ3RybC1MXCIpLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikgeyBlZGl0b3IuY2VudGVyU2VsZWN0aW9uKCk7IH1cbn0sIHtcbiAgICBuYW1lOiBcImNsb3NlT3JsZXZlbFVwXCIsXG4gICAgYmluZEtleTogYmluZEtleShcIkxlZnRcIiwgXCJMZWZ0fEN0cmwtQlwiKSxcbiAgICBleGVjOiBmdW5jdGlvbihlZGl0b3IpIHsgZWRpdG9yLm5hdmlnYXRlTGV2ZWxVcCh0cnVlKTsgfVxufSwgLCB7XG4gICAgbmFtZTogXCJsZXZlbFVwXCIsXG4gICAgYmluZEtleTogYmluZEtleShcIlNoaWZ0LUxlZnRcIiwgXCJTaGlmdC1MZWZ0fEN0cmwtQlwiKSxcbiAgICBleGVjOiBmdW5jdGlvbihlZGl0b3IpIHsgZWRpdG9yLm5hdmlnYXRlTGV2ZWxVcCgpOyB9XG59LCB7XG4gICAgbmFtZTogXCJsZXZlbERvd25cIixcbiAgICBiaW5kS2V5OiBiaW5kS2V5KFwiUmlnaHRcIiwgXCJSaWdodHxDdHJsLUZcIiksXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5uYXZpZ2F0ZUxldmVsRG93bigpOyB9XG59LCB7XG4gICAgbmFtZTogXCJnb1RvU3RhcnRcIixcbiAgICBlZGl0b3JLZXk6IGJpbmRLZXkoXCJDdHJsLUhvbWVcIiwgXCJDdHJsLUhvbWVcIiksXG4gICAgYmluZEtleTogYmluZEtleShcIkhvbWV8Q3RybC1Ib21lXCIsIFwiSG9tZXxDdHJsLUhvbWVcIiksXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5uYXZpZ2F0ZVN0YXJ0KCk7IH1cbn0sIHtcbiAgICBuYW1lOiBcImdvVG9FbmRcIixcbiAgICBlZGl0b3JLZXk6IGJpbmRLZXkoXCJDdHJsLUVuZFwiLCBcIkN0cmwtRW5kXCIpLFxuICAgIGJpbmRLZXk6IGJpbmRLZXkoXCJFbmR8Q3RybC1FbmRcIiwgXCJFbmR8Q3RybC1FbmRcIiksXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5uYXZpZ2F0ZUVuZCgpOyB9XG59LCB7XG4gICAgbmFtZTogXCJjbG9zZUFsbEZyb21TZWxlY3RlZFwiLFxuICAgIGJpbmRLZXk6IGJpbmRLZXkoXCJDdHJsLUxlZnRcIiwgXCJDdHJsLUxlZnRcIiksXG4gICAgZXhlYzogZnVuY3Rpb24oZWQpIHsgZWQucHJvdmlkZXIuY2xvc2UoZWQuc2VsZWN0aW9uLmdldEN1cnNvcigpLCB0cnVlKTsgfVxufSwge1xuICAgIG5hbWU6IFwib3BlbkFsbEZyb21TZWxlY3RlZFwiLFxuICAgIGJpbmRLZXk6IGJpbmRLZXkoXCJDdHJsLVJpZ2h0XCIsIFwiQ3RybC1SaWdodFwiKSxcbiAgICBleGVjOiBmdW5jdGlvbihlZCkgeyBlZC5wcm92aWRlci5vcGVuKGVkLnNlbGVjdGlvbi5nZXRDdXJzb3IoKSwgdHJ1ZSk7IH1cbn0sIHtcbiAgICBuYW1lOiBcInBhZ2V1cFwiLFxuICAgIGJpbmRLZXk6IFwiT3B0aW9uLVBhZ2VVcFwiLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikgeyBlZGl0b3Iuc2Nyb2xsUGFnZVVwKCk7IH1cbn0sIHtcbiAgICBuYW1lOiBcImdvdG9wYWdldXBcIixcbiAgICBiaW5kS2V5OiBcIlBhZ2VVcFwiLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikgeyBlZGl0b3IuZ290b1BhZ2VVcCgpOyB9XG59LCB7XG4gICAgbmFtZTogXCJwYWdlZG93blwiLFxuICAgIGJpbmRLZXk6IFwiT3B0aW9uLVBhZ2VEb3duXCIsXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5zY3JvbGxQYWdlRG93bigpOyB9XG59LCB7XG4gICAgbmFtZTogXCJnb3RvcGFnZURvd25cIixcbiAgICBiaW5kS2V5OiBcIlBhZ2VEb3duXCIsXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5nb3RvUGFnZURvd24oKTsgfVxufSwge1xuICAgIG5hbWU6IFwic2Nyb2xsdXBcIixcbiAgICBiaW5kS2V5OiBiaW5kS2V5KFwiQ3RybC1VcFwiLCBudWxsKSxcbiAgICBleGVjOiBmdW5jdGlvbihlKSB7IGUucmVuZGVyZXIuc2Nyb2xsQnkoMCwgLTIgKiBlLnJlbmRlcmVyLmxheWVyQ29uZmlnLmxpbmVIZWlnaHQpOyB9XG59LCB7XG4gICAgbmFtZTogXCJzY3JvbGxkb3duXCIsXG4gICAgYmluZEtleTogYmluZEtleShcIkN0cmwtRG93blwiLCBudWxsKSxcbiAgICBleGVjOiBmdW5jdGlvbihlKSB7IGUucmVuZGVyZXIuc2Nyb2xsQnkoMCwgMiAqIGUucmVuZGVyZXIubGF5ZXJDb25maWcubGluZUhlaWdodCk7IH1cbn0sIHtcbiAgICBuYW1lOiBcImluc2VydHN0cmluZ1wiLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKGUsIGFyZ3MpIHsgZS5pbnNlcnRTdGluZyhhcmdzKSB9XG59LCB7XG4gICAgbmFtZTogXCJnb1VwXCIsXG4gICAgYmluZEtleTogYmluZEtleShcIlVwXCIsIFwiVXB8Q3RybC1QXCIpLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikgeyBlZGl0b3Iuc2VsZWN0aW9uLm1vdmVTZWxlY3Rpb24oLTEpOyB9XG59LCB7XG4gICAgbmFtZTogXCJnb0Rvd25cIixcbiAgICBiaW5kS2V5OiBiaW5kS2V5KFwiRG93blwiLCBcIkRvd258Q3RybC1OXCIpLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikgeyBlZGl0b3Iuc2VsZWN0aW9uLm1vdmVTZWxlY3Rpb24oMSk7IH1cbn0sIHtcbiAgICBuYW1lOiBcInNlbGVjdFVwXCIsXG4gICAgYmluZEtleTogYmluZEtleShcIlNoaWZ0LVVwXCIsIFwiU2hpZnQtVXBcIiksXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5zZWxlY3Rpb24ubW92ZVNlbGVjdGlvbigtMSwgdHJ1ZSk7IH1cbn0sIHtcbiAgICBuYW1lOiBcInNlbGVjdERvd25cIixcbiAgICBiaW5kS2V5OiBiaW5kS2V5KFwiU2hpZnQtRG93blwiLCBcIlNoaWZ0LURvd25cIiksXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5zZWxlY3Rpb24ubW92ZVNlbGVjdGlvbigxLCB0cnVlKTsgfVxufSwge1xuICAgIG5hbWU6IFwic2VsZWN0VG9VcFwiLFxuICAgIGJpbmRLZXk6IGJpbmRLZXkoXCJDdHJsLVVwXCIsIFwiQ3RybC1VcFwiKSxcbiAgICBleGVjOiBmdW5jdGlvbihlZGl0b3IpIHsgZWRpdG9yLnNlbGVjdGlvbi5tb3ZlU2VsZWN0aW9uKC0xLCBmYWxzZSwgdHJ1ZSk7IH1cbn0sIHtcbiAgICBuYW1lOiBcInNlbGVjdFRvRG93blwiLFxuICAgIGJpbmRLZXk6IGJpbmRLZXkoXCJDdHJsLURvd25cIiwgXCJDdHJsLURvd25cIiksXG4gICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7IGVkaXRvci5zZWxlY3Rpb24ubW92ZVNlbGVjdGlvbigxLCBmYWxzZSwgdHJ1ZSk7IH1cbn0sIHtcbiAgICBuYW1lOiBcInNlbGVjdE1vcmVVcFwiLFxuICAgIGJpbmRLZXk6IGJpbmRLZXkoXCJDdHJsLVNoaWZ0LVVwXCIsIFwiQ3RybC1TaGlmdC1VcFwiKSxcbiAgICBleGVjOiBmdW5jdGlvbihlZGl0b3IpIHsgZWRpdG9yLnNlbGVjdGlvbi5tb3ZlU2VsZWN0aW9uKC0xLCB0cnVlLCB0cnVlKTsgfVxufSwge1xuICAgIG5hbWU6IFwic2VsZWN0TW9yZURvd25cIixcbiAgICBiaW5kS2V5OiBiaW5kS2V5KFwiQ3RybC1TaGlmdC1Eb3duXCIsIFwiQ3RybC1TaGlmdC1Eb3duXCIpLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikgeyBlZGl0b3Iuc2VsZWN0aW9uLm1vdmVTZWxlY3Rpb24oMSwgdHJ1ZSwgdHJ1ZSk7IH1cbn0sIHtcbiAgICBuYW1lOiBcInJlbmFtZVwiLFxuICAgIGJpbmRLZXk6IFwiRjJcIixcbiAgICBleGVjOiBmdW5jdGlvbih0cmVlKSB7IHRyZWUuZWRpdCAmJiB0cmVlLmVkaXQuc3RhcnRSZW5hbWUoKTsgfVxufSwge1xuICAgIG5hbWU6IFwiY2hvc2VcIixcbiAgICBiaW5kS2V5OiBcIkVudGVyXCIsXG4gICAgZXhlYzogZnVuY3Rpb24odHJlZSkgeyB0cmVlLl9lbWl0KFwiYWZ0ZXJDaG9vc2VcIik7IH1cbn0sIHtcbiAgICBuYW1lOiBcImRlbGV0ZVwiLFxuICAgIGJpbmRLZXk6IFwiRGVsZXRlXCIsXG4gICAgZXhlYzogZnVuY3Rpb24odHJlZSkgeyB0cmVlLl9lbWl0KFwiZGVsZXRlXCIpOyB9XG59LCB7XG4gICAgbmFtZTogXCJmb2xkT3RoZXJcIixcbiAgICBiaW5kS2V5OiBiaW5kS2V5KFwiQWx0LTBcIiwgXCJDb21tYW5kLU9wdGlvbi0wXCIpLFxuICAgIGV4ZWM6IGZ1bmN0aW9uKHRyZWUpIHtcbiAgICAgICAgdHJlZS5wcm92aWRlci5jbG9zZSh0cmVlLnByb3ZpZGVyLnJvb3QsIHRydWUpOyBcbiAgICAgICAgdHJlZS5yZXZlYWwodHJlZS5zZWxlY3Rpb24uZ2V0Q3Vyc29yKCkpO1xuICAgIH1cbn1cblxuXG5dO1xuXG59KTtcbiIsIi8qICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgbGljZW5zZTpcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAsIEFqYXgub3JnIEIuVi5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAqICAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgICAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIEFqYXgub3JnIEIuVi4gbm9yIHRoZVxuICogICAgICAgbmFtZXMgb2YgaXRzIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHNcbiAqICAgICAgIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICogXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIiBBTkRcbiAqIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG4gKiBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBBSkFYLk9SRyBCLlYuIEJFIExJQUJMRSBGT1IgQU5ZXG4gKiBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuICogKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICogTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gKiBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICogKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcbiAqIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICpcbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqICovXG5cbmRlZmluZShmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblwibm8gdXNlIHN0cmljdFwiO1xuXG52YXIgbGFuZyA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL2xhbmdcIik7XG52YXIgb29wID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvb29wXCIpO1xudmFyIG5ldCA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL25ldFwiKTtcbnZhciBBcHBDb25maWcgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9hcHBfY29uZmlnXCIpLkFwcENvbmZpZztcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbmV3IEFwcENvbmZpZygpO1xuXG52YXIgZ2xvYmFsID0gKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufSkoKTtcblxudmFyIG9wdGlvbnMgPSB7XG4gICAgcGFja2FnZWQ6IGZhbHNlLFxuICAgIHdvcmtlclBhdGg6IG51bGwsXG4gICAgbW9kZVBhdGg6IG51bGwsXG4gICAgdGhlbWVQYXRoOiBudWxsLFxuICAgIGJhc2VQYXRoOiBcIlwiLFxuICAgIHN1ZmZpeDogXCIuanNcIixcbiAgICAkbW9kdWxlVXJsczoge31cbn07XG5cbmV4cG9ydHMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gY29uZmlnIGtleTogXCIgKyBrZXkpO1xuXG4gICAgcmV0dXJuIG9wdGlvbnNba2V5XTtcbn07XG5cbmV4cG9ydHMuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgIGlmICghb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIGNvbmZpZyBrZXk6IFwiICsga2V5KTtcblxuICAgIG9wdGlvbnNba2V5XSA9IHZhbHVlO1xufTtcblxuZXhwb3J0cy5hbGwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbGFuZy5jb3B5T2JqZWN0KG9wdGlvbnMpO1xufTtcblxuZXhwb3J0cy5tb2R1bGVVcmwgPSBmdW5jdGlvbihuYW1lLCBjb21wb25lbnQpIHtcbiAgICBpZiAob3B0aW9ucy4kbW9kdWxlVXJsc1tuYW1lXSlcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuJG1vZHVsZVVybHNbbmFtZV07XG5cbiAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KFwiL1wiKTtcbiAgICBjb21wb25lbnQgPSBjb21wb25lbnQgfHwgcGFydHNbcGFydHMubGVuZ3RoIC0gMl0gfHwgXCJcIjtcbiAgICB2YXIgYmFzZSA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdLnJlcGxhY2UoY29tcG9uZW50LCBcIlwiKS5yZXBsYWNlKC8oXltcXC1fXSl8KFtcXC1fXSQpLywgXCJcIik7XG5cbiAgICBpZiAoIWJhc2UgJiYgcGFydHMubGVuZ3RoID4gMSlcbiAgICAgICAgYmFzZSA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDJdO1xuICAgIHZhciBwYXRoID0gb3B0aW9uc1tjb21wb25lbnQgKyBcIlBhdGhcIl07XG4gICAgaWYgKHBhdGggPT0gbnVsbClcbiAgICAgICAgcGF0aCA9IG9wdGlvbnMuYmFzZVBhdGg7XG4gICAgaWYgKHBhdGggJiYgcGF0aC5zbGljZSgtMSkgIT0gXCIvXCIpXG4gICAgICAgIHBhdGggKz0gXCIvXCI7XG4gICAgcmV0dXJuIHBhdGggKyBjb21wb25lbnQgKyBcIi1cIiArIGJhc2UgKyB0aGlzLmdldChcInN1ZmZpeFwiKTtcbn07XG5cbmV4cG9ydHMuc2V0TW9kdWxlVXJsID0gZnVuY3Rpb24obmFtZSwgc3Vic3QpIHtcbiAgICByZXR1cm4gb3B0aW9ucy4kbW9kdWxlVXJsc1tuYW1lXSA9IHN1YnN0O1xufTtcblxuZXhwb3J0cy4kbG9hZGluZyA9IHt9O1xuZXhwb3J0cy5sb2FkTW9kdWxlID0gZnVuY3Rpb24obW9kdWxlTmFtZSwgb25Mb2FkKSB7XG4gICAgZGVidWdnZXJcbn07XG5cbn0pO1xuIiwiLyogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEJTRCBsaWNlbnNlOlxuICogXG4gKiBDb3B5cmlnaHQgMjAxMSBJcmFrbGkgR296YWxpc2h2aWxpLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG9cbiAqIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4gKiByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3JcbiAqIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkdcbiAqIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1NcbiAqIElOIFRIRSBTT0ZUV0FSRS5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqICovXG5cbmRlZmluZShmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuZXhwb3J0cy5pc0RhcmsgPSBmYWxzZTtcbmV4cG9ydHMuY3NzQ2xhc3MgPSBcImFjZV90cmVlLWxpZ2h0XCI7XG5leHBvcnRzLmNzc1RleHQgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL3JlcXVpcmVqcy90ZXh0IS4vbGlnaHRfdGhlbWUuY3NzXCIpO1xuXG52YXIgZG9tID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZG9tXCIpO1xuZG9tLmltcG9ydENzc1N0cmluZyhleHBvcnRzLmNzc1RleHQsIGV4cG9ydHMuY3NzQ2xhc3MpO1xuXG59KTsiLCIvKipcbiAqIFRoZSBtYWluIGNsYXNzIHJlcXVpcmVkIHRvIHNldCB1cCBhIFRyZWUgaW5zdGFuY2UgaW4gdGhlIGJyb3dzZXIuXG4gKlxuICogQGNsYXNzIFRyZWVcbiAqKi9cblxuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9vb3BcIik7XG52YXIgU2Nyb2xsYWJsZSA9IHJlcXVpcmUoXCIuL3Njcm9sbGFibGVcIik7XG52YXIgZG9tID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZG9tXCIpO1xudmFyIGVzY2FwZUhUTUwgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9sYW5nXCIpLmVzY2FwZUhUTUw7XG5cbnZhciBEYXRhUHJvdmlkZXIgPSBmdW5jdGlvbihyb290KSB7XG4gICAgdGhpcy5yb3dIZWlnaHQgPSAyNTtcbiAgICB0aGlzLnNldFJvb3Qocm9vdCk7XG59O1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yb3dIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5yb3dIZWlnaHRJbm5lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLiRpbmRlbnRTaXplID0gMTA7XG4gICAgXG4gICAgb29wLmltcGxlbWVudCh0aGlzLCBTY3JvbGxhYmxlKTtcblxuICAgIHRoaXMuJHNvcnROb2RlcyA9IHRydWU7XG4gICAgXG4gICAgdGhpcy5zZXRSb290ID0gZnVuY3Rpb24ocm9vdCl7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJvb3QpKVxuICAgICAgICAgICAgcm9vdCA9IHtpdGVtczogcm9vdH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJvb3QgPSByb290IHx8IHt9O1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMucm9vdC4kZGVwdGggPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QuJGRlcHRoID0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucm9vdC4kZGVwdGggPCAwKSB7XG4gICAgICAgICAgICB0aGlzLnZpc2libGVJdGVtcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5vcGVuKHRoaXMucm9vdCk7XG4gICAgICAgICAgICB0aGlzLnZpc2libGVJdGVtcy51bnNoaWZ0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnZpc2libGVJdGVtcyA9IFt0aGlzLnJvb3RdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkTm9kZSA9IHRoaXMucm9vdDtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3NpZ25hbChcInNldFJvb3RcIik7XG4gICAgICAgIHRoaXMuX3NpZ25hbChcImNoYW5nZVwiKTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMub3BlbiA9IFxuICAgIHRoaXMuZXhwYW5kID0gZnVuY3Rpb24obm9kZSwgZGVlcCwgc2lsZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGVlcCAhPSBcIm51bWJlclwiKVxuICAgICAgICAgICAgZGVlcCA9IGRlZXAgPyAxMDAgOiAwO1xuICAgICAgICBpZiAoIW5vZGUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIFxuICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLnZpc2libGVJdGVtcztcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKG5vZGUpICYmIChub2RlICE9PSB0aGlzLnJvb3QgfHwgaXRlbXMubGVuZ3RoKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGNoID0gdGhpcy5nZXRDaGlsZHJlbihub2RlKTtcbiAgICAgICAgaWYgKHRoaXMubG9hZENoaWxkcmVuICYmIHRoaXMuc2hvdWxkTG9hZENoaWxkcmVuKG5vZGUsIGNoKSkge1xuICAgICAgICAgICAgdmFyIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBub2RlLnN0YXR1cyA9IFwibG9hZGluZ1wiO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NpZ25hbChcImNoYW5nZVwiLCBub2RlKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgMTAwKTtcbiAgICAgICAgICAgIHRoaXMubG9hZENoaWxkcmVuKG5vZGUsIGZ1bmN0aW9uKGVyciwgY2gpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29sbGFwc2Uobm9kZSwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgbm9kZS5zdGF0dXMgPSBcImxvYWRlZFwiO1xuICAgICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZChub2RlLCBudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy5zZXRPcGVuKG5vZGUsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0T3Blbihub2RlLCB0cnVlKTtcbiAgICAgICAgdmFyIGkgPSBpdGVtcy5pbmRleE9mKG5vZGUpO1xuICAgICAgICBpZiAoIWNoKSB7XG4gICAgICAgICAgICB0aGlzLl9zaWduYWwoXCJjaGFuZ2VcIiwgbm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGkgPT09IC0xICYmIGl0ZW1zLmxlbmd0aCB8fCB0aGlzLmZvcmNlRW1wdHkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNoID0gW2kgKyAxLCAwXS5jb25jYXQoY2gpO1xuICAgICAgICBpdGVtcy5zcGxpY2UuYXBwbHkoaXRlbXMsIGNoKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGogPSAyOyBqIDwgY2gubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZE5vZGUgPSBjaFtqXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzT3BlbihjaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRPcGVuKGNoaWxkTm9kZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMub3BlbihjaGlsZE5vZGUsIGRlZXAgLSAxLCBzaWxlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkZWVwID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMub3BlbihjaGlsZE5vZGUsIGRlZXAgLSAxLCBzaWxlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJvd3MgPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgIHNpbGVudCB8fCB0aGlzLl9zaWduYWwoXCJleHBhbmRcIiwgbm9kZSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmNsb3NlID1cbiAgICB0aGlzLmNvbGxhcHNlID0gZnVuY3Rpb24obm9kZSwgZGVlcCwgc2lsZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGVlcCAhPSBcIm51bWJlclwiKVxuICAgICAgICAgICAgZGVlcCA9IGRlZXAgPyAxMDAwIDogMDtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy52aXNpYmxlSXRlbXM7XG4gICAgICAgIHZhciBpc1Jvb3QgPSBub2RlID09PSB0aGlzLnJvb3Q7XG4gICAgICAgIGlmIChpc1Jvb3QpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0T3Blbihub2RlLCBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoZGVlcCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoID0gaXRlbXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghY2guaXNSb290KVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc09wZW4oY2gpICYmIGNoLiRkZXB0aCAtIG5vZGUuJGRlcHRoIDwgZGVlcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRPcGVuKGNoLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWxlbnQgfHwgdGhpcy5fc2lnbmFsKFwiY29sbGFwc2VcIiwgY2gpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlbXMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGlmIChpc1Jvb3QpXG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuKHRoaXMucm9vdCwgMCwgc2lsZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbm9kZSB8fCAhdGhpcy5pc09wZW4obm9kZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBpID0gaXRlbXMuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGkgPT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgdGhpc0RlcHRoID0gbm9kZS4kZGVwdGg7XG4gICAgICAgIHZhciBkZWxldGVjb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIHQgPSBpICsgMTsgdCA8IGl0ZW1zLmxlbmd0aDsgdCsrKSB7XG4gICAgICAgICAgICBpZiAoaXRlbXNbdF0uJGRlcHRoID4gdGhpc0RlcHRoKVxuICAgICAgICAgICAgICAgIGRlbGV0ZWNvdW50Kys7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChkZWVwKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRlbGV0ZWNvdW50OyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY2ggPSBpdGVtc1tqICsgaV07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNPcGVuKGNoKSAmJiBjaC4kZGVwdGggLSBub2RlLiRkZXB0aCA8IGRlZXApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRPcGVuKGNoLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHNpbGVudCB8fCB0aGlzLl9zaWduYWwoXCJjb2xsYXBzZVwiLCBjaCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZW1zLnNwbGljZShpICsgMSwgZGVsZXRlY291bnQpO1xuICAgICAgICB0aGlzLnNldE9wZW4obm9kZSwgZmFsc2UpO1xuICAgICAgICBzaWxlbnQgfHwgdGhpcy5fc2lnbmFsKFwiY29sbGFwc2VcIiwgbm9kZSk7XG4gICAgICAgIFxuICAgICAgICBpZiAoaXNSb290KVxuICAgICAgICAgICAgdGhpcy5vcGVuKHRoaXMucm9vdCwgMCwgc2lsZW50KTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMudG9nZ2xlTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGRlZXAsIHNpbGVudCkge1xuICAgICAgICBpZiAobm9kZSAmJiB0aGlzLmlzT3Blbihub2RlKSlcbiAgICAgICAgICAgIHRoaXMuY2xvc2Uobm9kZSwgZGVlcCwgc2lsZW50KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5vcGVuKG5vZGUsIGRlZXAsIHNpbGVudCk7XG4gICAgfTtcbiAgICAgICAgXG4gICAgdGhpcy5zb3J0ID0gZnVuY3Rpb24oY2hpbGRyZW4sIGNvbXBhcmUpIHtcbiAgICAgICAgaWYgKCFjb21wYXJlKSB7XG4gICAgICAgICAgICBjb21wYXJlID0gYWxwaGFudW1Db21wYXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGlsZHJlbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHZhciBhQ2hpbGRyZW4gPSBhLmNoaWxkcmVuIHx8IGEubWFwO1xuICAgICAgICAgICAgdmFyIGJDaGlsZHJlbiA9IGIuY2hpbGRyZW4gfHwgYi5tYXA7XG4gICAgICAgICAgICBpZiAoYUNoaWxkcmVuICYmICFiQ2hpbGRyZW4pIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICghYUNoaWxkcmVuICYmIGJDaGlsZHJlbikgcmV0dXJuIDE7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJlKGEubGFiZWwgfHwgXCJcIiwgYi5sYWJlbCB8fCBcIlwiKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnNldEZpbHRlciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIHRoaXMuJGZpbHRlckZuID0gZm47XG4gICAgICAgIHRoaXMuc2V0Um9vdCh0aGlzLnJvb3QpO1xuICAgIH07XG4gICAgdGhpcy5nZXRDaGlsZHJlbiA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKCFjaGlsZHJlbikge1xuICAgICAgICAgICAgaWYgKG5vZGUuc3RhdHVzID09PSBcInBlbmRpbmdcIilcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAobm9kZS5tYXApIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA9IE9iamVjdC5rZXlzKG5vZGUubWFwKS5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaCA9IG5vZGUubWFwW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGNoLnBhcmVudCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5pdGVtcykge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuID0gbm9kZS5pdGVtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgY2ggPSBjaGlsZHJlbiAmJiBjaGlsZHJlblswXSAmJiBjaGlsZHJlblswXTtcbiAgICAgICAgaWYgKGNoKSB7XG4gICAgICAgICAgICB2YXIgZCA9IChub2RlLiRkZXB0aCArIDEpIHx8IDA7XG4gICAgICAgICAgICBjaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgICAgbi4kZGVwdGggPSBkO1xuICAgICAgICAgICAgICAgICBuLnBhcmVudCA9IG5vZGU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuJGZpbHRlckZuKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuICYmIGNoaWxkcmVuLmZpbHRlcih0aGlzLiRmaWx0ZXJGbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy4kc29ydE5vZGVzICYmICFub2RlLiRzb3J0ZWQpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuICYmIHRoaXMuc29ydChjaGlsZHJlbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuO1xuICAgIH07XG4gICAgdGhpcy5sb2FkQ2hpbGRyZW4gPSBudWxsO1xuICAgIHRoaXMuc2hvdWxkTG9hZENoaWxkcmVuID0gZnVuY3Rpb24obm9kZSwgY2gpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuc3RhdHVzID09PSBcInBlbmRpbmdcIjtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuaGFzQ2hpbGRyZW4gPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuKVxuICAgICAgICAgICAgcmV0dXJuIG5vZGUuY2hpbGRyZW4ubGVuZ3RoICE9PSAwO1xuICAgICAgICByZXR1cm4gbm9kZS5tYXAgfHwgbm9kZS5zdGF0dXMgPT09IFwicGVuZGluZ1wiXG4gICAgICAgICAgICB8fCBub2RlLml0ZW1zICYmIG5vZGUuaXRlbXMubGVuZ3RoO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5maW5kTm9kZUJ5UGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIFxuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXRTaWJsaW5nID0gZnVuY3Rpb24obm9kZSwgZGlyKSB7XG4gICAgICAgIGlmICghZGlyKSBkaXIgPSAxO1xuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgIHZhciBjaCA9IHRoaXMuZ2V0Q2hpbGRyZW4ocGFyZW50KTtcbiAgICAgICAgdmFyIHBvcyA9IGNoLmluZGV4T2Yobm9kZSk7XG4gICAgICAgIHJldHVybiBjaFtwb3MgKyBkaXJdO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXROb2RlQXRJbmRleCA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlzaWJsZUl0ZW1zW2ldO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXRJbmRleEZvck5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpc2libGVJdGVtcy5pbmRleE9mKG5vZGUpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXRNaW5JbmRleCA9IGZ1bmN0aW9uKCkge3JldHVybiAwfTtcbiAgICB0aGlzLmdldE1heEluZGV4ID0gZnVuY3Rpb24oKSB7cmV0dXJuIHRoaXMudmlzaWJsZUl0ZW1zLmxlbmd0aCAtIDF9O1xuICAgIFxuICAgIHRoaXMuc2V0T3BlbiA9IGZ1bmN0aW9uKG5vZGUsIHZhbCkge1xuICAgICAgICByZXR1cm4gbm9kZS5pc09wZW4gPSB2YWw7XG4gICAgfTtcbiAgICB0aGlzLmlzT3BlbiA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuaXNPcGVuO1xuICAgIH07XG4gICAgdGhpcy5pc1Zpc2libGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpc2libGVJdGVtcy5pbmRleE9mKG5vZGUpICE9PSAtMTtcbiAgICB9O1xuICAgIHRoaXMuaXNTZWxlY3RlZCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuaXNTZWxlY3RlZDtcbiAgICB9O1xuICAgIHRoaXMuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbihub2RlLCB2YWwpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuaXNTZWxlY3RlZCA9ICEhdmFsO1xuICAgIH07XG4gICAgdGhpcy5pc1NlbGVjdGFibGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiAhbm9kZSB8fCAhKG5vZGUubm9TZWxlY3QgfHwgbm9kZS4kZGVwdGggPCAwKTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuaXNBbmNlc3RvciA9IGZ1bmN0aW9uKG5vZGUsIGNoaWxkKSB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PSBub2RlKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IHdoaWxlIChjaGlsZCA9IGNoaWxkLnBhcmVudCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24obm9kZSwgbmFtZSwgdmFsdWUpIHtcbiAgICAgICAgbm9kZVtuYW1lXSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9zaWduYWwoXCJjaGFuZ2VcIiwgbm9kZSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmdldERhdGFSYW5nZSA9IGZ1bmN0aW9uKHJvd3MsIGNvbHVtbnMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB2aWV3ID0gdGhpcy52aXNpYmxlSXRlbXMuc2xpY2Uocm93cy5zdGFydCwgcm93cy5zdGFydCArIHJvd3MubGVuZ3RoKTsgICAgICAgIFxuICAgICAgICBjYWxsYmFjayhudWxsLCB2aWV3LCBmYWxzZSk7XG4gICAgICAgIHJldHVybiB2aWV3O1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXRSYW5nZSA9IGZ1bmN0aW9uKHRvcCwgYm90dG9tKSB7XG4gICAgICAgIHZhciBzdGFydCA9IE1hdGguZmxvb3IodG9wIC8gdGhpcy5yb3dIZWlnaHQpO1xuICAgICAgICB2YXIgZW5kID0gTWF0aC5jZWlsKGJvdHRvbSAvIHRoaXMucm93SGVpZ2h0KSArIDE7XG4gICAgICAgIHZhciByYW5nZSA9IHRoaXMudmlzaWJsZUl0ZW1zLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgICAgICByYW5nZS5jb3VudCA9IHN0YXJ0O1xuICAgICAgICByYW5nZS5zaXplID0gdGhpcy5yb3dIZWlnaHQgKiByYW5nZS5jb3VudDtcbiAgICAgICAgcmV0dXJuIHJhbmdlO1xuICAgIH07XG4gICAgdGhpcy5nZXRUb3RhbEhlaWdodCA9IGZ1bmN0aW9uKHRvcCwgYm90dG9tKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvd0hlaWdodCAqIHRoaXMudmlzaWJsZUl0ZW1zLmxlbmd0aDtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuZ2V0Tm9kZVBvc2l0aW9uID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgaSA9IHRoaXMudmlzaWJsZUl0ZW1zLmluZGV4T2Yobm9kZSk7XG4gICAgICAgIGlmIChpID09IC0xICYmIG5vZGUgJiYgbm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIGkgPSB0aGlzLnZpc2libGVJdGVtcy5pbmRleE9mKG5vZGUucGFyZW50KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdG9wID0gaSAqIHRoaXMucm93SGVpZ2h0O1xuICAgICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5yb3dIZWlnaHQ7XG4gICAgICAgIHJldHVybiB7dG9wOiB0b3AsIGhlaWdodDogaGVpZ2h0fTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuZmluZEl0ZW1BdE9mZnNldCA9IGZ1bmN0aW9uKG9mZnNldCwgY2xpcCkge1xuICAgICAgICB2YXIgaW5kZXggPSBNYXRoLmZsb29yKG9mZnNldCAvIHRoaXMucm93SGVpZ2h0KTtcbiAgICAgICAgaWYgKGNsaXApIFxuICAgICAgICAgICAgaW5kZXggPSBNYXRoLm1pbihNYXRoLm1heCgwLCBpbmRleCksIHRoaXMudmlzaWJsZUl0ZW1zLmxlbmd0aCAtIDEpO1xuICAgICAgICByZXR1cm4gdGhpcy52aXNpYmxlSXRlbXNbaW5kZXhdO1xuICAgIH07XG4gICAgdGhpcy5nZXRJY29uSFRNTCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfTtcbiAgICB0aGlzLmdldENsYXNzTmFtZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIChub2RlLmNsYXNzTmFtZSB8fCBcIlwiKSArIChub2RlLnN0YXR1cyA9PSBcImxvYWRpbmdcIiA/IFwiIGxvYWRpbmdcIiA6IFwiXCIpO1xuICAgIH07XG4gICAgdGhpcy5zZXRDbGFzcyA9IGZ1bmN0aW9uKG5vZGUsIG5hbWUsIGluY2x1ZGUpIHtcbiAgICAgICAgbm9kZS5jbGFzc05hbWUgPSBub2RlLmNsYXNzTmFtZSB8fCBcIlwiO1xuICAgICAgICBkb20uc2V0Q3NzQ2xhc3Mobm9kZSwgbmFtZSwgaW5jbHVkZSk7XG4gICAgICAgIHRoaXMuX3NpZ25hbChcImNoYW5nZUNsYXNzXCIpO1xuICAgIH07XG4gICAgdGhpcy5yZWRyYXdOb2RlID0gbnVsbDtcbiAgICB0aGlzLmdldENhcHRpb25IVE1MID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICByZXR1cm4gZXNjYXBlSFRNTChub2RlLmxhYmVsIHx8IG5vZGUubmFtZSB8fCAodHlwZW9mIG5vZGUgPT0gXCJzdHJpbmdcIiA/IG5vZGUgOiBcIlwiKSk7XG4gICAgfTtcbiAgICB0aGlzLmdldENvbnRlbnRIVE1MID0gbnVsbDtcbiAgICB0aGlzLmdldEVtcHR5TWVzc2FnZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5lbXB0eU1lc3NhZ2UgfHwgXCJcIiB9O1xuICAgIHRoaXMuZ2V0VGV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUubGFiZWwgfHwgbm9kZS5uYW1lIHx8IFwiXCI7XG4gICAgfTtcbiAgICB0aGlzLmdldFJvd0luZGVudCA9IGZ1bmN0aW9uKG5vZGUpe1xuICAgICAgICByZXR1cm4gbm9kZS4kZGVwdGg7XG4gICAgfTtcbiAgICB0aGlzLmhpZGVBbGxOb2RlcyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMudmlzaWJsZUl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yY2VFbXB0eSAgID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zZXRSb290KHRoaXMucm9vdCk7XG4gICAgfTtcbiAgICB0aGlzLnNob3dBbGxOb2RlcyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZm9yY2VFbXB0eSAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2V0Um9vdCh0aGlzLnJvb3QpO1xuICAgIH07XG4gICAgXG59KS5jYWxsKERhdGFQcm92aWRlci5wcm90b3R5cGUpO1xuXG5mdW5jdGlvbiBhbHBoYW51bUNvbXBhcmUoYSwgYikge1xuICAgIHZhciBjYXNlT3JkZXIgPSAwO1xuICAgIGZvciAodmFyIHggPSAwLCBsID0gTWF0aC5taW4oYS5sZW5ndGgsIGIubGVuZ3RoKTsgeCA8IGw7IHgrKykge1xuICAgICAgICB2YXIgY2gxID0gYS5jaGFyQ29kZUF0KHgpO1xuICAgICAgICB2YXIgY2gyID0gYi5jaGFyQ29kZUF0KHgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNoMSA8IDU4ICYmIGNoMiA8IDU4ICYmIGNoMSA+IDQ3ICYmIGNoMiA+IDQ3KSB7XG4gICAgICAgICAgICB2YXIgbnVtMSA9IDAsIG51bTIgPSAwO1xuICAgICAgICAgICAgdmFyIG4gPSB4O1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIG51bTEgPSAxMCAqIG51bTEgKyAoY2gxIC0gNDgpO1xuICAgICAgICAgICAgICAgIGNoMSA9IGEuY2hhckNvZGVBdCgrK24pO1xuICAgICAgICAgICAgfSB3aGlsZShjaDEgPiA0NyAmJiBjaDEgPCA1OCk7XG4gICAgICAgICAgICBuID0geDtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBudW0yID0gMTAgKiBudW0yICsgKGNoMiAtIDQ4KTtcbiAgICAgICAgICAgICAgICBjaDIgPSBiLmNoYXJDb2RlQXQoKytuKTtcbiAgICAgICAgICAgIH0gd2hpbGUoY2gyID4gNDcgJiYgY2gyIDwgNTgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobnVtMSA9PT0gbnVtMilcbiAgICAgICAgICAgICAgICB4ID0gbiAtIDE7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bTEgLSBudW0yO1xuICAgICAgICB9IGVsc2UgaWYgKGNoMSAhPT0gY2gyKSB7XG4gICAgICAgICAgICB2YXIgY2gxTCA9IGFbeF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHZhciBjaDJMID0gYlt4XS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGNoMUwgPCBjaDJMKSByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAoY2gxTCA+IGNoMkwpIHJldHVybiAxO1xuICAgICAgICAgICAgaWYgKCFjYXNlT3JkZXIpIGNhc2VPcmRlciA9IGNoMiAtIGNoMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2FzZU9yZGVyIHx8IGEubGVuZ3RoIC0gYi5sZW5ndGg7XG59XG5cbkRhdGFQcm92aWRlci5hbHBoYW51bUNvbXBhcmUgPSBhbHBoYW51bUNvbXBhcmU7XG5EYXRhUHJvdmlkZXIucHJvdG90eXBlLmFscGhhbnVtQ29tcGFyZSA9IGFscGhhbnVtQ29tcGFyZTtcbkRhdGFQcm92aWRlci52YXJpYWJsZUhlaWdodFJvd01peGluID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRjYWNoZWRUb3RhbEhlaWdodCA9IDA7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub24oXCJjb2xsYXBzZVwiLCByZXNldCk7XG4gICAgdGhpcy5vbihcImV4cGFuZFwiLCByZXNldCk7XG4gICAgLy8gdGhpcy5yb3dDYWNoZSBcbiAgICB0aGlzLmdldE5vZGVQb3NpdGlvbiA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnZpc2libGVJdGVtcy5pbmRleE9mKG5vZGUpO1xuICAgICAgICBpZiAoaSA9PSAtMSAmJiBub2RlICYmIG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICBpID0gdGhpcy52aXNpYmxlSXRlbXMuaW5kZXhPZihub2RlLnBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMudmlzaWJsZUl0ZW1zO1xuICAgICAgICB2YXIgdG9wID0gMCwgaGVpZ2h0ID0gMDtcbiAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGk7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGhlaWdodCA9IHRoaXMuZ2V0SXRlbUhlaWdodChpdGVtc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgaGVpZ2h0ID0gdGhpcy5nZXRJdGVtSGVpZ2h0KGl0ZW1zW2ldLCBpKTtcbiAgICAgICAgcmV0dXJuIHt0b3A6IHRvcCwgaGVpZ2h0OiBoZWlnaHR9O1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5maW5kSW5kZXhBdE9mZnNldCA9IGZ1bmN0aW9uKG9mZnNldCwgY2xpcCkge1xuICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLnZpc2libGVJdGVtcztcbiAgICAgICAgdmFyIHRvcCA9IDAsIGluZGV4ID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbCkge1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRoaXMuZ2V0SXRlbUhlaWdodChpdGVtc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgaWYgKHRvcCA+PSBvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICBpbmRleC0tO1xuICAgICAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjbGlwKSBcbiAgICAgICAgICAgIGluZGV4ID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgaW5kZXgpLCBpdGVtcy5sZW5ndGggLSAxKTtcbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH07IFxuICAgIFxuICAgIHRoaXMuZmluZEl0ZW1BdE9mZnNldCA9IGZ1bmN0aW9uKG9mZnNldCwgY2xpcCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmZpbmRJbmRleEF0T2Zmc2V0KG9mZnNldCwgY2xpcCk7XG4gICAgICAgIHJldHVybiB0aGlzLnZpc2libGVJdGVtc1tpbmRleF07XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmdldEl0ZW1IZWlnaHQgPSBmdW5jdGlvbihub2RlLCBpbmRleCkge1xuICAgICAgICByZXR1cm4gbm9kZS5oZWlnaHQgfHwgdGhpcy5yb3dIZWlnaHQ7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmdldFJhbmdlID0gZnVuY3Rpb24odG9wLCBib3R0b20pIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy52aXNpYmxlSXRlbXM7XG4gICAgICAgIHZhciBzdGFydEggPSAwLCBpbmRleCA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpbmRleCA8IGwpIHtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSB0aGlzLmdldEl0ZW1IZWlnaHQoaXRlbXNbaW5kZXhdLCBpbmRleCk7XG4gICAgICAgICAgICBzdGFydEggKz0gaGVpZ2h0O1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIGlmIChzdGFydEggPj0gdG9wKSB7XG4gICAgICAgICAgICAgICAgaW5kZXgtLTtcbiAgICAgICAgICAgICAgICBzdGFydEggLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGluZGV4ID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgaW5kZXgpLCBpdGVtcy5sZW5ndGggLSAxKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBzdGFydCA9IGluZGV4O1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5maW5kSW5kZXhBdE9mZnNldChib3R0b20sIHRydWUpICsgMTtcbiAgICAgICAgdmFyIHJhbmdlID0gdGhpcy52aXNpYmxlSXRlbXMuc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgICAgIHJhbmdlLmNvdW50ID0gc3RhcnQ7XG4gICAgICAgIHJhbmdlLnNpemUgPSBzdGFydEg7XG4gICAgICAgIHJldHVybiByYW5nZTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuZ2V0VG90YWxIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy4kY2FjaGVkVG90YWxIZWlnaHQpIHtcbiAgICAgICAgICAgIHZhciBpdGVtcyA9IHRoaXMudmlzaWJsZUl0ZW1zO1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgaXRlbXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IHRoaXMuZ2V0SXRlbUhlaWdodChpdGVtc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuJGNhY2hlZFRvdGFsSGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLiRjYWNoZWRUb3RhbEhlaWdodDtcbiAgICB9O1xufTtcbm1vZHVsZS5leHBvcnRzID0gRGF0YVByb3ZpZGVyO1xufSk7XG4iLCJkZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIG9vcCA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL29vcFwiKTtcbnZhciBkb20gPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9kb21cIik7XG52YXIgbGFuZyA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL2xhbmdcIik7XG52YXIgZXNjYXBlSFRNTCA9IGxhbmcuZXNjYXBlSFRNTDtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9ldmVudF9lbWl0dGVyXCIpLkV2ZW50RW1pdHRlcjtcblxudmFyIENlbGxzID0gZnVuY3Rpb24ocGFyZW50RWwpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBkb20uY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gXCJhY2VfdHJlZV9sYXllciBhY2VfdHJlZV9jZWxsLWxheWVyXCI7XG4gICAgcGFyZW50RWwuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcbn07XG5cbihmdW5jdGlvbigpIHtcblxuICAgIG9vcC5pbXBsZW1lbnQodGhpcywgRXZlbnRFbWl0dGVyKTtcbiAgICBcbiAgICB0aGlzLmNvbmZpZyA9IHt9LFxuXG4gICAgdGhpcy5zZXREYXRhUHJvdmlkZXIgPSBmdW5jdGlvbihwcm92aWRlcikge1xuICAgICAgICB0aGlzLnByb3ZpZGVyID0gcHJvdmlkZXI7XG4gICAgICAgIGlmIChwcm92aWRlcilcbiAgICAgICAgICAgIHRoaXMudXBkYXRlID0gcHJvdmlkZXIucmVuZGVyUm93ID8gdGhpcy4kY3VzdG9tVXBkYXRlIDogdGhpcy4kdHJlZU1vZGVVcGRhdGU7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMubWVhc3VyZVNpemVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkb21Ob2RlID0gdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgICAgIGlmIChkb21Ob2RlKSB7XG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLnJvd0hlaWdodCA9IGRvbU5vZGUub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci5yb3dIZWlnaHRJbm5lciA9IGRvbU5vZGUuY2xpZW50SGVpZ2h0O1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLiR0cmVlTW9kZVVwZGF0ZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIFxuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICB2YXIgcm93LCBodG1sID0gW10sIHZpZXcgPSBjb25maWcudmlldywgZGF0YXJvdztcbiAgICAgICAgdmFyIGZpcnN0Um93ID0gY29uZmlnLmZpcnN0Um93LCBsYXN0Um93ID0gY29uZmlnLmxhc3RSb3cgKyAxO1xuICAgICAgICB2YXIgaHNpemUgPSBcImF1dG87XCIsIHZzaXplID0gcHJvdmlkZXIucm93SGVpZ2h0SW5uZXIgfHwgcHJvdmlkZXIucm93SGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgZm9yIChyb3cgPSBmaXJzdFJvdzsgcm93IDwgbGFzdFJvdzsgcm93KyspIHtcbiAgICAgICAgICAgIGRhdGFyb3cgPSB2aWV3W3JvdyAtIGZpcnN0Um93XTtcbiAgICAgICAgICAgIGlmIChwcm92aWRlci5nZXRJdGVtSGVpZ2h0KVxuICAgICAgICAgICAgICAgIHZzaXplID0gcHJvdmlkZXIuZ2V0SXRlbUhlaWdodChkYXRhcm93LCByb3cpO1xuICAgICAgICAgICAgdGhpcy4kcmVuZGVyUm93KGh0bWwsIGRhdGFyb3csIHZzaXplLCBoc2l6ZSwgcm93KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGZpcnN0Um93IDw9IDAgJiYgbGFzdFJvdyA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlclBsYWNlSG9sZGVyKHByb3ZpZGVyLCBodG1sLCBjb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gaHRtbC5qb2luKFwiXCIpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCF2c2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5tZWFzdXJlU2l6ZXMoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgdGhpcy5jb2x1bW5Ob2RlID0gZnVuY3Rpb24oZGF0YXJvdywgY29sdW1uKSB7XG4gICAgICAgIHJldHVybiBcIjxzcGFuIGNsYXNzPSd0cmVlLWNvbHVtbiBcIiBcbiAgICAgICAgKyAoY29sdW1uLmNsYXNzTmFtZSB8fCBcIlwiKVxuICAgICAgICArIFwiJyBzdHlsZT0nXCJcbiAgICAgICAgKyAoZGF0YXJvdy5mdWxsV2lkdGggPyBcIlwiIDogXCJ3aWR0aDpcIiArIGNvbHVtbi4kd2lkdGggKyBcIjtcIilcbiAgICAgICAgKyBcIic+XCI7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmdldFJvd0NsYXNzID0gZnVuY3Rpb24oZGF0YXJvdywgcm93KSB7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIHJldHVybiBcInRyZWUtcm93IFwiIFxuICAgICAgICAgICAgKyAocHJvdmlkZXIuaXNTZWxlY3RlZChkYXRhcm93KSA/IFwic2VsZWN0ZWQgXCI6ICcnKSAgXG4gICAgICAgICAgICArIChwcm92aWRlci5nZXRDbGFzc05hbWUoZGF0YXJvdykgfHwgXCJcIikgKyAocm93ICYgMSA/IFwiIG9kZFwiIDogXCIgZXZlblwiKTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuJHJlbmRlclJvdyA9IGZ1bmN0aW9uKGh0bWwsIGRhdGFyb3csIHZzaXplLCBoc2l6ZSwgcm93KSB7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIHZhciBjb2x1bW5zID0gcHJvdmlkZXIuY29sdW1ucztcbiAgICAgICAgdmFyIGluZGVudCA9IHByb3ZpZGVyLiRpbmRlbnRTaXplOy8vIHByb3ZpZGVyLmdldEluZGVudChkYXRhcm93KTtcbiAgICAgICAgaHRtbC5wdXNoKFwiPGRpdiBzdHlsZT0naGVpZ2h0OlwiICsgdnNpemUgKyBcInB4O1wiXG4gICAgICAgICAgICArIChjb2x1bW5zID8gXCJwYWRkaW5nLXJpZ2h0OlwiICsgY29sdW1ucy4kZml4ZWRXaWR0aCA6IFwiXCIpXG4gICAgICAgICAgICArIFwiJyBjbGFzcz0nXCJcbiAgICAgICAgICAgICsgdGhpcy5nZXRSb3dDbGFzcyhkYXRhcm93LCByb3cpXG4gICAgICAgICAgICArIFwiJz5cIik7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWNvbHVtbnMgfHwgY29sdW1uc1swXS50eXBlID09IFwidHJlZVwiKSB7XG4gICAgICAgICAgICBpZiAoY29sdW1ucykge1xuICAgICAgICAgICAgICAgIGh0bWwucHVzaCh0aGlzLmNvbHVtbk5vZGUoZGF0YXJvdywgY29sdW1uc1swXSwgcm93KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZGVwdGggPSBwcm92aWRlci5nZXRSb3dJbmRlbnQoZGF0YXJvdyk7XG4gICAgICAgICAgICBodG1sLnB1c2goXG4gICAgICAgICAgICAgICAgKGRlcHRoID8gXCI8c3BhbiBzdHlsZT0nd2lkdGg6XCIgKyBkZXB0aCAqIGluZGVudCArIFwicHgnIGNsYXNzPSd0cmVlLWluZGVudCc+PC9zcGFuPlwiIDogXCJcIiApXG4gICAgICAgICAgICAgICAgKyBcIjxzcGFuIGNsYXNzPSd0b2dnbGVyIFwiICsgKHByb3ZpZGVyLmhhc0NoaWxkcmVuKGRhdGFyb3cpXG4gICAgICAgICAgICAgICAgICAgID8gKHByb3ZpZGVyLmlzT3BlbihkYXRhcm93KSA/IFwib3BlblwiIDogXCJjbG9zZWRcIilcbiAgICAgICAgICAgICAgICAgICAgOiBcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgKyBcIic+PC9zcGFuPlwiXG4gICAgICAgICAgICAgICAgKyAocHJvdmlkZXIuZ2V0Q2hlY2tib3hIVE1MID8gcHJvdmlkZXIuZ2V0Q2hlY2tib3hIVE1MKGRhdGFyb3cpIDogXCJcIilcbiAgICAgICAgICAgICAgICArIHByb3ZpZGVyLmdldEljb25IVE1MKGRhdGFyb3cpXG4gICAgICAgICAgICAgICAgKyAoIHByb3ZpZGVyLmdldENvbnRlbnRIVE1MID8gcHJvdmlkZXIuZ2V0Q29udGVudEhUTUwoZGF0YXJvdylcbiAgICAgICAgICAgICAgICAgICAgOiBcIjxzcGFuIGNsYXNzPSdjYXB0aW9uJyBzdHlsZT0nd2lkdGg6IFwiICsgaHNpemUgKyBcInB4O2hlaWdodDogXCIgKyB2c2l6ZSArIFwicHgnPlwiXG4gICAgICAgICAgICAgICAgICAgICsgICBwcm92aWRlci5nZXRDYXB0aW9uSFRNTChkYXRhcm93KVxuICAgICAgICAgICAgICAgICAgICArIFwiPC9zcGFuPlwiXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sdW1ucykge1xuICAgICAgICAgICAgZm9yICh2YXIgY29sID0gY29sdW1uc1swXS50eXBlID09IFwidHJlZVwiID8gMSA6IDA7IGNvbCA8IGNvbHVtbnMubGVuZ3RoOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb2x1bW4gPSBjb2x1bW5zW2NvbF07XG4gICAgICAgICAgICAgICAgdmFyIHJvd1N0ciA9IChjb2x1bW4uZ2V0SFRNTCkgPyBjb2x1bW4uZ2V0SFRNTChkYXRhcm93KSA6IGVzY2FwZUhUTUwoY29sdW1uLmdldFRleHQoZGF0YXJvdykgKyBcIlwiKTtcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goXCI8L3NwYW4+XCIgKyB0aGlzLmNvbHVtbk5vZGUoZGF0YXJvdywgY29sdW1uLCByb3cpICsgcm93U3RyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGh0bWwucHVzaChcIjwvc3Bhbj5cIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGh0bWwucHVzaChcIjwvZGl2PlwiKTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuJGN1c3RvbVVwZGF0ZSA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgXG4gICAgICAgIHZhciBwcm92aWRlciA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIHZhciBodG1sID0gW107XG4gICAgICAgIHZhciBmaXJzdFJvdyA9IGNvbmZpZy5maXJzdFJvdywgbGFzdFJvdyA9IGNvbmZpZy5sYXN0Um93ICsgMTtcblxuICAgICAgICBmb3IgKHZhciByb3cgPSBmaXJzdFJvdzsgcm93IDwgbGFzdFJvdzsgcm93KyspIHtcbiAgICAgICAgICAgcHJvdmlkZXIucmVuZGVyUm93KHJvdywgaHRtbCwgY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGZpcnN0Um93IDw9IDAgJiYgbGFzdFJvdyA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlclBsYWNlSG9sZGVyKHByb3ZpZGVyLCBodG1sLCBjb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gaHRtbC5qb2luKFwiXCIpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy51cGRhdGVDbGFzc2VzID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGZ1bGwgcmVkcmF3IGZvciBjdXN0b21VcGRhdGVcbiAgICAgICAgaWYgKHRoaXMudXBkYXRlID09IHRoaXMuJGN1c3RvbVVwZGF0ZSAmJiAhdGhpcy5wcm92aWRlci51cGRhdGVOb2RlKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlKGNvbmZpZyk7XG4gICAgICAgICAgICBcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIFxuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICB2YXIgcm93LCB2aWV3ID0gY29uZmlnLnZpZXcsIGRhdGFyb3c7XG4gICAgICAgIHZhciBmaXJzdFJvdyA9IGNvbmZpZy5maXJzdFJvdywgbGFzdFJvdyA9IGNvbmZpZy5sYXN0Um93ICsgMTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5lbGVtZW50LmNoaWxkcmVuO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCAhPSBsYXN0Um93IC0gZmlyc3RSb3cpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUoY29uZmlnKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAocm93ID0gZmlyc3RSb3c7IHJvdyA8IGxhc3RSb3c7IHJvdysrKSB7XG4gICAgICAgICAgICBkYXRhcm93ID0gdmlld1tyb3cgLSBmaXJzdFJvd107XG4gICAgICAgICAgICB2YXIgZWwgPSBjaGlsZHJlbltyb3cgLSBmaXJzdFJvd107XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSB0aGlzLmdldFJvd0NsYXNzKGRhdGFyb3csIHJvdyk7XG4gICAgICAgICAgICBpZiAocHJvdmlkZXIucmVkcmF3Tm9kZSlcbiAgICAgICAgICAgICAgICBwcm92aWRlci5yZWRyYXdOb2RlKGVsLCBkYXRhcm93KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnNjcm9sbCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICAvLyBub3QgaW1wbGVtZW50ZWRcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlKGNvbmZpZyk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYWZ0ZXJCZWdpblwiLCBcIjxzcGFuPmE8L3NwYW4+PHM+cjwvcz5cIik7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVFbmRcIiwgXCI8c3Bhbj5hPC9zcGFuPjxzPnI8L3M+XCIpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy51cGRhdGVSb3dzID0gZnVuY3Rpb24oY29uZmlnLCBmaXJzdFJvdywgbGFzdFJvdykge1xuICAgICAgICAvLyBub3QgaW1wbGVtZW50ZWRcbiAgICB9O1xuXG4gICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXREb21Ob2RlQXRJbmRleCA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jaGlsZHJlbltpIC0gdGhpcy5jb25maWcuZmlyc3RSb3ddO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5yZW5kZXJQbGFjZUhvbGRlciA9IGZ1bmN0aW9uKHByb3ZpZGVyLCBodG1sLCBjb25maWcpIHtcbiAgICAgICAgaWYgKHByb3ZpZGVyLnJlbmRlckVtcHR5TWVzc2FnZSkge1xuICAgICAgICAgICAgcHJvdmlkZXIucmVuZGVyRW1wdHlNZXNzYWdlKGh0bWwsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIuZ2V0RW1wdHlNZXNzYWdlKSB7XG4gICAgICAgICAgICBodG1sLnB1c2goXG4gICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdtZXNzYWdlIGVtcHR5Jz5cIixcbiAgICAgICAgICAgICAgICAgICAgZXNjYXBlSFRNTChwcm92aWRlci5nZXRFbXB0eU1lc3NhZ2UoKSksXG4gICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pLmNhbGwoQ2VsbHMucHJvdG90eXBlKTtcblxuZXhwb3J0cy5DZWxscyA9IENlbGxzO1xuXG59KTtcbiIsImRlZmluZShmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblwidXNlIHN0cmljdFwiO1xudmFyIG9vcCA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL29vcFwiKTtcbnZhciBkb20gPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9kb21cIik7XG52YXIgbGFuZyA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL2xhbmdcIik7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZXZlbnRfZW1pdHRlclwiKS5FdmVudEVtaXR0ZXI7XG5cbnZhciBSRVNJWkVSX1dJRFRIID0gMztcblxuZnVuY3Rpb24gZ2V0Q29sdW1uVGV4dChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGVbdGhpcy52YWx1ZV0gfHwgdGhpcy5kZWZhdWx0VmFsdWUgfHwgXCJcIjtcbn1cblxuZnVuY3Rpb24gQ29sdW1uSGVhZGVyKHBhcmVudEVsLCByZW5kZXJlcikge1xuICAgIHRoaXMuZWxlbWVudCA9IGRvbS5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHBhcmVudEVsLmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IFwidHJlZS1oZWFkaW5nc1wiO1xuICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xufVxuKGZ1bmN0aW9uKCkge1xuICAgIFxuICAgIHRoaXMubWluV2lkdGggPSAyNTtcbiAgICBcbiAgICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMucHJvdmlkZXIgfHwgIXRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSB0aGlzLnByb3ZpZGVyLmNvbHVtbnM7XG4gICAgICAgIHZhciBodG1sID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvbCA9IGNvbHVtbnNbaV07XG4gICAgICAgICAgICBodG1sLnB1c2goXCI8c3BhbiBjbGFzcz0ndHJlZS1jb2x1bW4gXCIgXG4gICAgICAgICAgICAgICAgKyAoY29sLmNsYXNzTmFtZSB8fCBcIlwiKVxuICAgICAgICAgICAgICAgICsgXCInIHN0eWxlPSd3aWR0aDpcIiArIGNvbC4kd2lkdGggKyBcIjtoZWlnaHQ6Jz5cIlxuICAgICAgICAgICAgICAgICsgY29sLmNhcHRpb25cbiAgICAgICAgICAgICAgICArIFwiPC9zcGFuPlwiXG4gICAgICAgICAgICAgICAgKyBcIjxzcGFuIGNsYXNzPSd0cmVlLWNvbHVtbi1yZXNpemVyJyA+XCJcbiAgICAgICAgICAgICAgICArIFwiPC9zcGFuPlwiXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5wYWRkaW5nUmlnaHQgPSBjb2x1bW5zLiRmaXhlZFdpZHRoO1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gaHRtbC5qb2luKFwiXCIpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5zZXREYXRhUHJvdmlkZXIgPSBmdW5jdGlvbihwcm92aWRlcikge1xuICAgICAgICB0aGlzLnByb3ZpZGVyID0gcHJvdmlkZXI7XG4gICAgICAgIGlmICghcHJvdmlkZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBjb2x1bW5zID0gdGhpcy5wcm92aWRlci5jb2x1bW5zO1xuICAgICAgICBpZiAoIWNvbHVtbnMpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XG4gICAgICAgIHZhciBmaXhlZFdpZHRoID0gMDtcbiAgICAgICAgXG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbihjb2wsIGkpIHtcbiAgICAgICAgICAgIGNvbC5pbmRleCA9IGk7XG4gICAgICAgICAgICBpZiAoY29sLnZhbHVlICYmICFjb2wuZ2V0VGV4dClcbiAgICAgICAgICAgICAgICBjb2wuZ2V0VGV4dCA9IGdldENvbHVtblRleHQ7XG4gICAgICAgICAgICB2YXIgdyA9IGNvbC53aWR0aDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdyA9PSBcInN0cmluZ1wiICYmIHcuc2xpY2UoLTEpID09IFwiJVwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmZsZXggPSBwYXJzZUludCh3LCAxMCkgLyAxMDA7XG4gICAgICAgICAgICAgICAgY29sLiR3aWR0aCA9IGNvbC53aWR0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29sLndpZHRoID0gcGFyc2VJbnQodywgMTApIHx8IHRoaXMubWluV2lkdGg7XG4gICAgICAgICAgICAgICAgZml4ZWRXaWR0aCArPSBjb2wud2lkdGg7XG4gICAgICAgICAgICAgICAgY29sLiR3aWR0aCA9IGNvbC53aWR0aCArIFwicHhcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbC5waXhlbFdpZHRoID0gMDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGNvbHVtbnMuZml4ZWRXaWR0aCA9IGZpeGVkV2lkdGg7XG4gICAgICAgIGNvbHVtbnMuJGZpeGVkV2lkdGggPSBmaXhlZFdpZHRoICsgXCJweFwiO1xuICAgICAgICBjb2x1bW5zLndpZHRoID0gbnVsbDtcbiAgICAgICAgcHJvdmlkZXIuY29sdW1ucyA9IGNvbHVtbnM7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnVwZGF0ZVdpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb3ZpZGVyIHx8ICF0aGlzLnZpc2libGUpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbHVtbnMgPSB0aGlzLnByb3ZpZGVyLmNvbHVtbnM7XG4gICAgICAgIHZhciBmaXhlZFdpZHRoID0gMDtcbiAgICAgICAgXG4gICAgICAgIGNvbHVtbnMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBjb2x1bW5zLmZvckVhY2goZnVuY3Rpb24oY29sKSB7XG4gICAgICAgICAgICBpZiAoIWNvbC5mbGV4KSB7XG4gICAgICAgICAgICAgICAgZml4ZWRXaWR0aCArPSBjb2wud2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgdmFyIGZsZXhXaWR0aCA9IHdpZHRoIC0gZml4ZWRXaWR0aDtcbiAgICAgICAgXG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbihjb2wpIHtcbiAgICAgICAgICAgIGlmIChjb2wuZmxleCkge1xuICAgICAgICAgICAgICAgIGNvbC5waXhlbFdpZHRoID0gZmxleFdpZHRoICogY29sLmZsZXg7XG4gICAgICAgICAgICAgICAgY29sLiR3aWR0aCA9IGNvbC5mbGV4ICogMTAwICsgXCIlXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbC5waXhlbFdpZHRoID0gY29sLndpZHRoO1xuICAgICAgICAgICAgICAgIGNvbC4kd2lkdGggPSBjb2wud2lkdGggKyBcInB4XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb2x1bW5zLmZpeGVkV2lkdGggPSBmaXhlZFdpZHRoO1xuICAgICAgICBjb2x1bW5zLiRmaXhlZFdpZHRoID0gZml4ZWRXaWR0aCArIFwicHhcIjtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuY2hhbmdlQ29sdW1uV2lkdGggPSBmdW5jdGlvbihjaGFuZ2VkQ29sdW1uLCBkdywgdG90YWwpIHtcbiAgICAgICAgdGhpcy51cGRhdGVXaWR0aCh0b3RhbCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgY29sdW1ucyA9IHRoaXMucHJvdmlkZXIuY29sdW1ucztcbiAgICAgICAgdmFyIG1pbldpZHRoID0gdGhpcy5taW5XaWR0aDtcbiAgICAgICAgXG4gICAgICAgIGlmICghZHcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBcbiAgICAgICAgdmFyIGluZGV4ID0gY29sdW1ucy5pbmRleE9mKGNoYW5nZWRDb2x1bW4pO1xuICAgICAgICB2YXIgY29sLCBuZXh0Q29sLCBwcmV2Q29sO1xuICAgICAgICBmb3IgKHZhciBpID0gaW5kZXggKyAxOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29sID0gY29sdW1uc1tpXTtcbiAgICAgICAgICAgIGlmIChNYXRoLmZsb29yKGNvbC5waXhlbFdpZHRoKSA+IG1pbldpZHRoIHx8IGR3IDwgMCkge1xuICAgICAgICAgICAgICAgIGlmIChjb2wuZmxleCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0Q29sID0gY29sO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFuZXh0Q29sKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRDb2wgPSBjb2w7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSBpbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbCA9IGNvbHVtbnNbaV07XG4gICAgICAgICAgICBpZiAoTWF0aC5mbG9vcihjb2wucGl4ZWxXaWR0aCkgPiBtaW5XaWR0aCB8fCBkdyA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoY29sLmZsZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldkNvbCA9IGNvbDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghcHJldkNvbCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2Q29sID0gY29sO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29sID09IGNoYW5nZWRDb2x1bW4pXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcmV2Q29sIHx8ICFuZXh0Q29sKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKG5leHRDb2wucGl4ZWxXaWR0aCAtIGR3IDwgbWluV2lkdGgpXG4gICAgICAgICAgICBkdyA9IG5leHRDb2wucGl4ZWxXaWR0aCAtIG1pbldpZHRoO1xuICAgICAgICBcbiAgICAgICAgaWYgKHByZXZDb2wucGl4ZWxXaWR0aCArIGR3IDwgbWluV2lkdGgpXG4gICAgICAgICAgICBkdyA9IG1pbldpZHRoIC0gcHJldkNvbC5waXhlbFdpZHRoO1xuICAgICAgICBcbiAgICAgICAgbmV4dENvbC5waXhlbFdpZHRoIC09IGR3O1xuICAgICAgICBwcmV2Q29sLnBpeGVsV2lkdGggKz0gZHc7XG4gICAgICAgIFxuICAgICAgICBpZiAoIW5leHRDb2wuZmxleClcbiAgICAgICAgICAgIGNvbHVtbnMuZml4ZWRXaWR0aCAtPSBkdztcbiAgICAgICAgaWYgKCFwcmV2Q29sLmZsZXgpXG4gICAgICAgICAgICBjb2x1bW5zLmZpeGVkV2lkdGggKz0gZHc7XG4gICAgICAgIHZhciBmbGV4V2lkdGggPSB0b3RhbCAtIGNvbHVtbnMuZml4ZWRXaWR0aDtcbiAgICAgICAgXG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbihjb2wpIHtcbiAgICAgICAgICAgIGlmIChjb2wuZmxleCkge1xuICAgICAgICAgICAgICAgIGNvbC5mbGV4ID0gY29sLnBpeGVsV2lkdGggLyBmbGV4V2lkdGg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbC53aWR0aCA9IGNvbC5waXhlbFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMudXBkYXRlV2lkdGgodG90YWwpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5maW5kQ29sdW1uID0gZnVuY3Rpb24oeCkge1xuICAgICAgICB2YXIgY29sdW1ucyA9IHRoaXMucHJvdmlkZXIuY29sdW1ucztcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCAhPSBjb2x1bW5zLndpZHRoKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVXaWR0aCh0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGgpO1xuICAgICAgICB2YXIgdyA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvbHVtbiA9IGNvbHVtbnNbaV07XG4gICAgICAgICAgICB3ICs9IGNvbHVtbi5waXhlbFdpZHRoO1xuICAgICAgICAgICAgaWYgKHggPCB3ICsgUkVTSVpFUl9XSURUSCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBpLCBcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBjb2x1bW4sXG4gICAgICAgICAgICAgICAgICAgIG92ZXJSZXNpemVyOiB4ID4gdyAtIFJFU0laRVJfV0lEVEhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBcbn0pLmNhbGwoQ29sdW1uSGVhZGVyLnByb3RvdHlwZSk7XG5cblxuZXhwb3J0cy5Db2x1bW5IZWFkZXIgPSBDb2x1bW5IZWFkZXI7XG5cbn0pO1xuIiwiLyogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEJTRCBsaWNlbnNlOlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMCwgQWpheC5vcmcgQi5WLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gKiBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiAgICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICogICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAgICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgQWpheC5vcmcgQi5WLiBub3IgdGhlXG4gKiAgICAgICBuYW1lcyBvZiBpdHMgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0c1xuICogICAgICAgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKiBcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuICogQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEFKQVguT1JHIEIuVi4gQkUgTElBQkxFIEZPUiBBTllcbiAqIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gKiAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG4gKiBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAqIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKiAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJU1xuICogU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKiogKi9cblxuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBkb20gPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9kb21cIik7XG5cbnZhciBTZWxlY3Rpb24gPSBmdW5jdGlvbihwYXJlbnRFbCwgcmVuZGVyZXIpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBkb20uY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gXCJhY2VfdHJlZV9sYXllciBhY2VfdHJlZV9zZWxlY3Rpb24tbGF5ZXJcIjtcbiAgICBwYXJlbnRFbC5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgIFxuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLm1hcmtlckVsID0gbnVsbDtcbiAgICB0aGlzLmFycm93RWwgPSBudWxsO1xufTtcblxuKGZ1bmN0aW9uKCkge1xuXG4gICAgdGhpcy5zZXREYXRhUHJvdmlkZXIgPSBmdW5jdGlvbihwcm92aWRlcikge1xuICAgICAgICB0aGlzLnByb3ZpZGVyID0gcHJvdmlkZXI7XG4gICAgfTtcblxuICAgIHRoaXMudXBkYXRlID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIC8vIG1hcmtlZEZvbGRlclR5cGU6IDA6IGZvbGRlciwgLTE6IGJlZm9yZSwgMTogYWZ0ZXJcbiAgICAgICAgaWYgKCF0aGlzLnByb3ZpZGVyLm1hcmtlZEZvbGRlciB8fCB0aGlzLnByb3ZpZGVyLm1hcmtlZEZvbGRlclR5cGUpIHtcbiAgICAgICAgICAgIHRoaXMubWFya2VyRWwgJiYgdGhpcy5jbGVhckZvbGRlck1hcmtlcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaG93Rm9sZGVyTWFya2VyKGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5wcm92aWRlci5tYXJrZWRGb2xkZXIgfHwgIXRoaXMucHJvdmlkZXIubWFya2VkRm9sZGVyVHlwZSkge1xuICAgICAgICAgICAgdGhpcy5hcnJvd0VsICYmIHRoaXMuY2xlYXJJbnNlcnRpb25NYXJrZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0luc2VydGlvbk1hcmtlcihjb25maWcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnNob3dGb2xkZXJNYXJrZXIgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIHZhciBub2RlID0gcHJvdmlkZXIubWFya2VkRm9sZGVyO1xuICAgICAgICBcbiAgICAgICAgdmFyIHN0YXJ0ID0gcHJvdmlkZXIuZ2V0SW5kZXhGb3JOb2RlKG5vZGUpO1xuICAgICAgICB2YXIgaXRlbXMgPSBwcm92aWRlci52aXNpYmxlSXRlbXM7XG4gICAgICAgIHZhciBlbmQgPSBzdGFydCArIDE7XG4gICAgICAgIHZhciBkZXB0aCA9IG5vZGUuJGRlcHRoO1xuICAgICAgICB3aGlsZSAoaXRlbXNbZW5kXSAmJiBpdGVtc1tlbmRdLiRkZXB0aCA+IGRlcHRoKSB7XG4gICAgICAgICAgICBlbmQrKztcbiAgICAgICAgfVxuICAgICAgICBlbmQgLS07XG4gICAgICAgIFxuICAgICAgICBpZiAoc3RhcnQgPiBjb25maWcubGFzdFJvdyB8fCBlbmQgPCBjb25maWcuZmlyc3RSb3cgfHwgc3RhcnQgPT09IGVuZCkgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xlYXJGb2xkZXJNYXJrZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGFydCsrO1xuICAgICAgICBlbmQrKztcbiAgICAgICAgdmFyIHRvcCA9IE1hdGgubWF4KHN0YXJ0IC0gY29uZmlnLmZpcnN0Um93LCAgLSAxKSAqIHByb3ZpZGVyLnJvd0hlaWdodDtcbiAgICAgICAgdmFyIGxlZnQgPSAoZGVwdGggKyAxKSAqIHByb3ZpZGVyLiRpbmRlbnRTaXplO1xuICAgICAgICB2YXIgYm90dG9tID0gTWF0aC5taW4oZW5kIC0gY29uZmlnLmZpcnN0Um93LCBjb25maWcubGFzdFJvdyAtIGNvbmZpZy5maXJzdFJvdyArIDIpICogcHJvdmlkZXIucm93SGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLm1hcmtlckVsKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtlckVsID0gZG9tLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICB0aGlzLm1hcmtlckVsLmNsYXNzTmFtZSA9IFwiZHJhZ0hpZ2hsaWdodFwiO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMubWFya2VyRWwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya2VyRWwuc3R5bGUudG9wID0gdG9wICsgXCJweFwiO1xuICAgICAgICB0aGlzLm1hcmtlckVsLnN0eWxlLmxlZnQgPSBsZWZ0ICsgXCJweFwiO1xuICAgICAgICB0aGlzLm1hcmtlckVsLnN0eWxlLnJpZ2h0ID0gXCI3cHhcIjtcbiAgICAgICAgdGhpcy5tYXJrZXJFbC5zdHlsZS5oZWlnaHQgPSBib3R0b20gLSB0b3AgKyBcInB4XCI7XG4gICAgfTtcbiAgICB0aGlzLnNob3dJbnNlcnRpb25NYXJrZXIgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIHZhciBub2RlID0gcHJvdmlkZXIubWFya2VkRm9sZGVyO1xuICAgICAgICBcbiAgICAgICAgdmFyIHR5cGUgPSB0aGlzLnByb3ZpZGVyLm1hcmtlZEZvbGRlclR5cGU7XG4gICAgICAgIFxuICAgICAgICB2YXIgc3RhcnQgPSBwcm92aWRlci5nZXRJbmRleEZvck5vZGUobm9kZSk7XG4gICAgICAgIHZhciBkZXB0aCA9IG5vZGUuJGRlcHRoO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0YXJ0ID4gY29uZmlnLmxhc3RSb3cgfHwgc3RhcnQgPCBjb25maWcuZmlyc3RSb3cpIHsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNsZWFySW5zZXJ0aW9uTWFya2VyKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlID09IDEpXG4gICAgICAgICAgICBzdGFydCsrO1xuICAgICAgICBcbiAgICAgICAgdmFyIHRvcCA9IE1hdGgubWF4KHN0YXJ0IC0gY29uZmlnLmZpcnN0Um93LCAgLSAxKSAqIHByb3ZpZGVyLnJvd0hlaWdodDtcbiAgICAgICAgdmFyIGxlZnQgPSAoZGVwdGggKyAxKSAqIHByb3ZpZGVyLiRpbmRlbnRTaXplO1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmFycm93RWwpIHtcbiAgICAgICAgICAgIHRoaXMuYXJyb3dFbCA9IGRvbS5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgdGhpcy5hcnJvd0VsLmNsYXNzTmFtZSA9IFwiZHJhZ0Fycm93XCI7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5hcnJvd0VsKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFycm93RWwuc3R5bGUudG9wID0gdG9wICsgXCJweFwiO1xuICAgICAgICB0aGlzLmFycm93RWwuc3R5bGUubGVmdCA9IGxlZnQgKyBcInB4XCI7XG4gICAgICAgIHRoaXMuYXJyb3dFbC5zdHlsZS5yaWdodCA9IFwiN3B4XCI7XG4gICAgfTtcbiAgICB0aGlzLmNsZWFyRm9sZGVyTWFya2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLm1hcmtlckVsKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtlckVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5tYXJrZXJFbCk7XG4gICAgICAgICAgICB0aGlzLm1hcmtlckVsID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5jbGVhckluc2VydGlvbk1hcmtlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5hcnJvd0VsKSB7XG4gICAgICAgICAgICB0aGlzLmFycm93RWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmFycm93RWwpO1xuICAgICAgICAgICAgdGhpcy5hcnJvd0VsID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNsZWFyRm9sZGVyTWFya2VyKCk7XG4gICAgICAgIHRoaXMuY2xlYXJJbnNlcnRNYXJrZXIoKTtcbiAgICB9O1xuICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICB9O1xuXG59KS5jYWxsKFNlbGVjdGlvbi5wcm90b3R5cGUpO1xuXG5leHBvcnRzLlNlbGVjdGlvbiA9IFNlbGVjdGlvbjtcblxufSk7XG4iLCIvKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBEaXN0cmlidXRlZCB1bmRlciB0aGUgQlNEIGxpY2Vuc2U6XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLCBBamF4Lm9yZyBCLlYuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAqICAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgICAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIEFqYXgub3JnIEIuVi4gbm9yIHRoZVxuICogICAgICAgbmFtZXMgb2YgaXRzIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHNcbiAqICAgICAgIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuICogQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEFKQVguT1JHIEIuVi4gQkUgTElBQkxFIEZPUiBBTllcbiAqIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gKiAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG4gKiBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAqIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKiAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJU1xuICogU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKiogKi9cblxuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBkb20gPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9kb21cIik7XG5cbnZhciBEUkFHX09GRlNFVCA9IDU7IC8vIHBpeGVsc1xuZnVuY3Rpb24gRGVmYXVsdEhhbmRsZXJzKG1vdXNlSGFuZGxlcikge1xuICAgIG1vdXNlSGFuZGxlci4kY2xpY2tTZWxlY3Rpb24gPSBudWxsO1xuXG4gICAgdmFyIGVkaXRvciA9IG1vdXNlSGFuZGxlci5lZGl0b3I7XG4gICAgZWRpdG9yLnNldERlZmF1bHRIYW5kbGVyKFwibW91c2Vkb3duXCIsIHRoaXMub25Nb3VzZURvd24uYmluZChtb3VzZUhhbmRsZXIpKTtcbiAgICBlZGl0b3Iuc2V0RGVmYXVsdEhhbmRsZXIoXCJkYmxjbGlja1wiLCB0aGlzLm9uRG91YmxlQ2xpY2suYmluZChtb3VzZUhhbmRsZXIpKTtcbiAgICAvLyBlZGl0b3Iuc2V0RGVmYXVsdEhhbmRsZXIoXCJ0cmlwbGVjbGlja1wiLCB0aGlzLm9uVHJpcGxlQ2xpY2suYmluZChtb3VzZUhhbmRsZXIpKTtcbiAgICAvLyBlZGl0b3Iuc2V0RGVmYXVsdEhhbmRsZXIoXCJxdWFkY2xpY2tcIiwgdGhpcy5vblF1YWRDbGljay5iaW5kKG1vdXNlSGFuZGxlcikpO1xuICAgIGVkaXRvci5zZXREZWZhdWx0SGFuZGxlcihcIm1vdXNlbGVhdmVcIiwgdGhpcy5vbk1vdXNlTGVhdmUuYmluZChtb3VzZUhhbmRsZXIpKTtcbiAgICBlZGl0b3Iuc2V0RGVmYXVsdEhhbmRsZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZS5iaW5kKG1vdXNlSGFuZGxlcikpO1xuICAgIGVkaXRvci5zZXREZWZhdWx0SGFuZGxlcihcIm1vdXNld2hlZWxcIiwgdGhpcy5vbk1vdXNlV2hlZWwuYmluZChtb3VzZUhhbmRsZXIpKTtcbiAgICBlZGl0b3Iuc2V0RGVmYXVsdEhhbmRsZXIoXCJtb3VzZXVwXCIsIHRoaXMub25Nb3VzZVVwLmJpbmQobW91c2VIYW5kbGVyKSk7XG4gICAgZWRpdG9yLnNldERlZmF1bHRIYW5kbGVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrLmJpbmQobW91c2VIYW5kbGVyKSk7XG5cbiAgICB2YXIgZXhwb3J0cyA9IFtcImRyYWdNb3ZlU2VsZWN0aW9uXCIsIFwiZHJhZ1dhaXRcIiwgXCJkcmFnV2FpdEVuZFwiLCBcImdldFJlZ2lvblwiLCBcInVwZGF0ZUhvdmVyU3RhdGVcIl07XG5cbiAgICBleHBvcnRzLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICBtb3VzZUhhbmRsZXJbeF0gPSB0aGlzW3hdO1xuICAgIH0sIHRoaXMpO1xufVxuXG4oZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgZnVuY3Rpb24gaXNUb2dnbGVyQ2xpY2sodGFyZ2V0KSB7XG4gICAgICAgIHJldHVybiBkb20uaGFzQ3NzQ2xhc3ModGFyZ2V0LCBcInRvZ2dsZXJcIikgJiYgIWRvbS5oYXNDc3NDbGFzcyh0YXJnZXQsIFwiZW1wdHlcIik7XG4gICAgfVxuICAgIFxuICAgIHRoaXMub25Nb3VzZU1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcbiAgICAgICAgdmFyIG5vZGUgPSBlLmdldE5vZGUoKTtcbiAgICAgICAgXG4gICAgICAgIHZhciB0aXRsZSwgcHJvdmlkZXIgPSBlZGl0b3IucHJvdmlkZXI7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgdGl0bGUgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgIHZhciBwb3MgPSBlLmdldERvY3VtZW50UG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBjb2x1bW5EYXRhID0gZWRpdG9yLnJlbmRlcmVyLiRoZWFkaW5nTGF5ZXIuZmluZENvbHVtbihwb3MueCk7XG4gICAgICAgICAgICB0aXRsZSA9IGNvbHVtbkRhdGEgPyBjb2x1bW5EYXRhLmNvbHVtbi5nZXRUZXh0KG5vZGUpIDogXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRpdGxlID0gcHJvdmlkZXIuZ2V0VG9vbHRpcFRleHQgPyBwcm92aWRlci5nZXRUb29sdGlwVGV4dChub2RlKSA6IHByb3ZpZGVyLmdldFRleHQobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghZWRpdG9yLnRvb2x0aXAgJiYgZWRpdG9yLmNvbnRhaW5lci50aXRsZSAhPSB0aXRsZSlcbiAgICAgICAgICAgIGVkaXRvci5jb250YWluZXIudGl0bGUgPSB0aXRsZTtcbiAgICAgICAgdGhpcy51cGRhdGVIb3ZlclN0YXRlKG5vZGUpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5vbk1vdXNlTGVhdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51cGRhdGVIb3ZlclN0YXRlKG51bGwpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy51cGRhdGVIb3ZlclN0YXRlID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLmVkaXRvci5wcm92aWRlcjtcbiAgICAgICAgaWYgKG5vZGUgIT09IHRoaXMubm9kZSAmJiBwcm92aWRlcikge1xuICAgICAgICAgICAgaWYgKHRoaXMubm9kZSlcbiAgICAgICAgICAgICAgICBwcm92aWRlci5zZXRDbGFzcyh0aGlzLm5vZGUsIFwiaG92ZXJcIiwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUpXG4gICAgICAgICAgICAgICAgcHJvdmlkZXIuc2V0Q2xhc3ModGhpcy5ub2RlLCBcImhvdmVyXCIsIHRydWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMub25Nb3VzZURvd24gPSBmdW5jdGlvbihldikge1xuICAgICAgICB2YXIgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG4gICAgICAgIHZhciBwcm92aWRlciA9IGVkaXRvci5wcm92aWRlcjtcblxuICAgICAgICBldi5kZXRhaWwgPSAxO1xuICAgICAgICB0aGlzLm1vdXNlZG93bkV2ZW50ID0gZXY7XG4gICAgICAgIHRoaXMuZGVsYXllZFNlbGVjdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBidXR0b24gPSBldi5nZXRCdXR0b24oKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkTm9kZXMgPSBlZGl0b3Iuc2VsZWN0aW9uLmdldFNlbGVjdGVkTm9kZXMoKTtcbiAgICAgICAgdmFyIGlzTXVsdGlTZWxlY3QgPSBzZWxlY3RlZE5vZGVzLmxlbmd0aCA+IDE7XG4gICAgICAgIGlmIChidXR0b24gIT09IDAgJiYgaXNNdWx0aVNlbGVjdCkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBzdG9wcGluZyBldmVudCBoZXJlIGJyZWFrcyBjb250ZXh0bWVudSBvbiBmZiBtYWNcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIG5vZGUgPSBldi5nZXROb2RlKCk7XG4gICAgICAgIHRoaXMuJGNsaWNrTm9kZSA9IG5vZGU7XG4gICAgICAgIGlmICghbm9kZSkgcmV0dXJuOyAvLyBDbGljayBvdXRzaWRlIGNlbGxzXG4gICAgICAgIFxuICAgICAgICB2YXIgaW5TZWxlY3Rpb24gPSBwcm92aWRlci5pc1NlbGVjdGVkKG5vZGUpO1xuXG4gICAgICAgIHZhciB0YXJnZXQgPSBldi5kb21FdmVudC50YXJnZXQ7XG4gICAgICAgIHRoaXMucmVnaW9uID0gbnVsbDtcbiAgICAgICAgaWYgKGlzVG9nZ2xlckNsaWNrKHRhcmdldCkgfHwgbm9kZS5jbGlja0FjdGlvbiA9PSBcInRvZ2dsZVwiKSB7XG4gICAgICAgICAgICB0aGlzLnJlZ2lvbiA9IFwidG9nZ2xlclwiO1xuICAgICAgICAgICAgdmFyIHRvZ2dsZUNoaWxkcmVuID0gZXYuZ2V0U2hpZnRLZXkoKTtcbiAgICAgICAgICAgIHZhciBkZWVwID0gZXYuZ2V0QWNjZWxLZXkoKTtcbiAgICAgICAgICAgIGlmIChidXR0b24gPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAodG9nZ2xlQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlZXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm92aWRlci5jbG9zZShub2RlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXIub3Blbihub2RlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlci50b2dnbGVOb2RlKG5vZGUsIGRlZXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuJGNsaWNrTm9kZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tLmhhc0Nzc0NsYXNzKHRhcmdldCwgXCJjaGVja2JveFwiKSkge1xuICAgICAgICAgICAgdmFyIG5vZGVzID0gaW5TZWxlY3Rpb24gJiYgZWRpdG9yLnNlbGVjdGlvbi5nZXRTZWxlY3RlZE5vZGVzKCk7XG4gICAgICAgICAgICBwcm92aWRlci5fc2lnbmFsKFwidG9nZ2xlQ2hlY2tib3hcIiwgeyB0YXJnZXQ6IG5vZGUsIHNlbGVjdGVkTm9kZXM6IG5vZGVzIH0pO1xuICAgICAgICAgICAgLy8gY29uc2lkZXIgZGVwcmVjYXRpbmcgdGhpc1xuICAgICAgICAgICAgbm9kZS5pc0NoZWNrZWQgPSAhbm9kZS5pc0NoZWNrZWQ7XG4gICAgICAgICAgICBpZiAobm9kZXMpIHtcbiAgICAgICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG4pIHsgbi5pc0NoZWNrZWQgPSBub2RlLmlzQ2hlY2tlZCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb3ZpZGVyLl9zaWduYWwobm9kZS5pc0NoZWNrZWQgPyBcImNoZWNrXCIgOiBcInVuY2hlY2tcIiwgbm9kZXMgfHwgW25vZGVdKTtcbiAgICAgICAgICAgIHByb3ZpZGVyLl9zaWduYWwoXCJjaGFuZ2VcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tLmhhc0Nzc0NsYXNzKHRhcmdldCwgXCJpY29uLW9rXCIpKSB7XG4gICAgICAgICAgICBpZiAoZXYuZ2V0U2hpZnRLZXkoKSkge1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZWxlY3Rpb24uZXhwYW5kU2VsZWN0aW9uKG5vZGUsIG51bGwsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uLnRvZ2dsZVNlbGVjdChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChldi5nZXRBY2NlbEtleSgpKSB7XG4gICAgICAgICAgICBpZiAoaW5TZWxlY3Rpb24gJiYgaXNNdWx0aVNlbGVjdClcbiAgICAgICAgICAgICAgICB0aGlzLmRlbGF5ZWRTZWxlY3QgPSBcInRvZ2dsZVwiO1xuICAgICAgICAgICAgZWxzZSBpZiAoIWluU2VsZWN0aW9uIHx8IGlzTXVsdGlTZWxlY3QpXG4gICAgICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi50b2dnbGVTZWxlY3Qobm9kZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXYuZ2V0U2hpZnRLZXkoKSkge1xuICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5leHBhbmRTZWxlY3Rpb24obm9kZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5TZWxlY3Rpb24gJiYgaXNNdWx0aVNlbGVjdCkge1xuICAgICAgICAgICAgaWYgKCFlZGl0b3IuaXNGb2N1c2VkKCkpXG4gICAgICAgICAgICAgICAgdGhpcy4kY2xpY2tOb2RlID0gbnVsbDtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aGlzLmRlbGF5ZWRTZWxlY3QgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5zZXRTZWxlY3Rpb24obm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuJGNsaWNrTm9kZSlcbiAgICAgICAgICAgIGVkaXRvci4kbW91c2VIYW5kbGVyLmNhcHR1cmVNb3VzZShldiwgXCJkcmFnV2FpdFwiKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5vbk1vdXNlVXAgPSBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAodGhpcy5pc01vdXNlUHJlc3NlZCA9PSAyKSByZXR1cm47IC8vIHdhaXQgdW50aWwgcmVsZWFzZSBjYXB0dXJlXG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIHBvcyA9IGV2LmdldERvY3VtZW50UG9zaXRpb24oKTtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmVkaXRvci5wcm92aWRlci5maW5kSXRlbUF0T2Zmc2V0KHBvcy55KTtcbiAgICAgICAgaWYgKG5vZGUgJiYgdGhpcy4kY2xpY2tOb2RlICYmIHRoaXMuJGNsaWNrTm9kZSA9PSBub2RlKSB7XG4gICAgICAgICAgICBldi5idXR0b24gPSBldi5nZXRCdXR0b24oKTtcbiAgICAgICAgICAgIGV2LnRhcmdldCA9IGV2LmRvbUV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIGV2LmRldGFpbCA9IHRoaXMubW91c2Vkb3duRXZlbnQuZGV0YWlsO1xuICAgICAgICAgICAgdGhpcy5vbk1vdXNlRXZlbnQoXCJjbGlja1wiLCBldik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4kY2xpY2tOb2RlID0gdGhpcy5tb3VzZUV2ZW50ID0gbnVsbDtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMub25DbGljayA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICh0aGlzLm1vdXNlZG93bkV2ZW50LmRldGFpbCA9PT0gMikge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IuX2VtaXQoXCJhZnRlckNob29zZVwiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLm9uRG91YmxlQ2xpY2sgPSBmdW5jdGlvbihldikge1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLmVkaXRvci5wcm92aWRlcjtcbiAgICAgICAgaWYgKHByb3ZpZGVyLnRvZ2dsZU5vZGUgJiYgIWlzVG9nZ2xlckNsaWNrKGV2LmRvbUV2ZW50LnRhcmdldCkpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gZXYuZ2V0Tm9kZSgpO1xuICAgICAgICAgICAgaWYgKG5vZGUpXG4gICAgICAgICAgICAgICAgcHJvdmlkZXIudG9nZ2xlTm9kZShub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5tb3VzZWRvd25FdmVudClcbiAgICAgICAgICAgIHRoaXMubW91c2Vkb3duRXZlbnQuZGV0YWlsID0gMjtcbiAgICB9O1xuXG4gICAgdGhpcy5kcmFnTW92ZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG4gICAgICAgIHZhciBldiA9IHRoaXMubW91c2VFdmVudDtcbiAgICAgICAgZXYuJHBvcyA9IGV2Lm5vZGUgPSBudWxsO1xuICAgICAgICB2YXIgbm9kZSA9IGV2LmdldE5vZGUodHJ1ZSk7XG4gICAgICAgIGlmIChub2RlICE9IGVkaXRvci5zZWxlY3Rpb24uZ2V0Q3Vyc29yKCkgJiYgbm9kZSkge1xuICAgICAgICAgICAgaWYgKGV2LmdldFNoaWZ0S2V5KCkpIHtcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uLmV4cGFuZFNlbGVjdGlvbihub2RlLCBudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5zZWxlY3ROb2RlKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWRpdG9yLnJlbmRlcmVyLnNjcm9sbENhcmV0SW50b1ZpZXcoKTtcbiAgICAgICAgfSAgICAgICAgXG4gICAgfTtcblxuICAgIHRoaXMuZHJhZ1dhaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV2ID0gdGhpcy5tb3VzZWRvd25FdmVudDtcbiAgICAgICAgaWYgKE1hdGguYWJzKHRoaXMueCAtIGV2LngpICsgTWF0aC5hYnModGhpcy55IC0gZXYueSkgPiBEUkFHX09GRlNFVCkge1xuICAgICAgICAgICAgdGhpcy5kZWxheWVkU2VsZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5fZW1pdChcInN0YXJ0RHJhZ1wiLCBldik7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBcImRyYWdXYWl0XCIgJiYgZXYuZ2V0QnV0dG9uKCkgPT09IDApXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShcImRyYWdNb3ZlU2VsZWN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmRyYWdXYWl0RW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmRlbGF5ZWRTZWxlY3QpIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3Rpb24gPSB0aGlzLmVkaXRvci5zZWxlY3Rpb247XG4gICAgICAgICAgICBpZiAodGhpcy4kY2xpY2tOb2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGVsYXllZFNlbGVjdCA9PSBcInRvZ2dsZVwiKVxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24udG9nZ2xlU2VsZWN0KHRoaXMuJGNsaWNrTm9kZSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24uc2V0U2VsZWN0aW9uKHRoaXMuJGNsaWNrTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRlbGF5ZWRTZWxlY3QgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgICAgIFxuICAgICAgICBcbiAgICB0aGlzLm9uTW91c2VXaGVlbCA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmIChldi5nZXRTaGlmdEtleSgpIHx8IGV2LmdldEFjY2VsS2V5KCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciB0ID0gZXYuZG9tRXZlbnQudGltZVN0YW1wO1xuICAgICAgICB2YXIgZHQgPSB0IC0gKHRoaXMuJGxhc3RTY3JvbGxUaW1lIHx8IDApO1xuICAgICAgICBcbiAgICAgICAgdmFyIGVkaXRvciA9IHRoaXMuZWRpdG9yO1xuICAgICAgICB2YXIgaXNTY3JvbGFibGUgPSBlZGl0b3IucmVuZGVyZXIuaXNTY3JvbGxhYmxlQnkoZXYud2hlZWxYICogZXYuc3BlZWQsIGV2LndoZWVsWSAqIGV2LnNwZWVkKTtcbiAgICAgICAgaWYgKGlzU2Nyb2xhYmxlIHx8IGR0IDwgMjAwKSB7XG4gICAgICAgICAgICB0aGlzLiRsYXN0U2Nyb2xsVGltZSA9IHQ7XG4gICAgICAgICAgICBlZGl0b3IucmVuZGVyZXIuc2Nyb2xsQnkoZXYud2hlZWxYICogZXYuc3BlZWQsIGV2LndoZWVsWSAqIGV2LnNwZWVkKTtcbiAgICAgICAgICAgIHJldHVybiBldi5zdG9wKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KS5jYWxsKERlZmF1bHRIYW5kbGVycy5wcm90b3R5cGUpO1xuXG5leHBvcnRzLkRlZmF1bHRIYW5kbGVycyA9IERlZmF1bHRIYW5kbGVycztcblxufSk7XG4iLCIvKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBEaXN0cmlidXRlZCB1bmRlciB0aGUgQlNEIGxpY2Vuc2U6XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLCBBamF4Lm9yZyBCLlYuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICogICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiAgICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gKiAgICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogICAgICogTmVpdGhlciB0aGUgbmFtZSBvZiBBamF4Lm9yZyBCLlYuIG5vciB0aGVcbiAqICAgICAgIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzXG4gKiAgICAgICBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqIFxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EXG4gKiBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRVxuICogRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgQUpBWC5PUkcgQi5WLiBCRSBMSUFCTEUgRk9SIEFOWVxuICogRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAqIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbiAqIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORFxuICogT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAqIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTXG4gKiBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKiAqL1xuXG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGV2ZW50ID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZXZlbnRcIik7XG52YXIgdXNlcmFnZW50ID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvdXNlcmFnZW50XCIpO1xudmFyIERlZmF1bHRIYW5kbGVycyA9IHJlcXVpcmUoXCIuL2RlZmF1bHRfaGFuZGxlcnNcIikuRGVmYXVsdEhhbmRsZXJzO1xudmFyIE1vdXNlRXZlbnQgPSByZXF1aXJlKFwiLi9tb3VzZV9ldmVudFwiKS5Nb3VzZUV2ZW50O1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoXCIuLi9jb25maWdcIik7XG52YXIgZG9tID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZG9tXCIpO1xuXG5mdW5jdGlvbiBpbml0RHJhZ0hhbmRsZXJzKG1vdXNlSGFuZGxlcikge1xuICAgIHZhciB0cmVlID0gbW91c2VIYW5kbGVyLmVkaXRvcjtcbiAgICB2YXIgVU5GT0xEX1RJTUVPVVQgPSA1MDA7XG4gICAgdmFyIFdJREdFVF9VTkZPTERfVElNRU9VVCA9IDUwMDtcbiAgICB2YXIgQVVUT1NDUk9MTF9ERUxBWSA9IDMwMDtcbiAgICB2YXIgTUlOX0RSQUdfVCA9IDUwMDtcbiAgICB2YXIgZHJhZ0luZm8sIHgsIHksIGR4LCBkeTtcbiAgICB2YXIgc2Nyb2xsZXJSZWN0O1xuICAgIFxuICAgIG1vdXNlSGFuZGxlci5kcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBldiA9IHRoaXMubW91c2VFdmVudDtcbiAgICAgICAgaWYgKCFkcmFnSW5mbyB8fCAhZXYpIHJldHVybjtcbiAgICAgICAgdmFyIG5vZGUgPSBldi5nZXROb2RlKCk7XG4gICAgICAgIGR4ID0gZXYueCAtIHg7XG4gICAgICAgIGR5ID0gZXYueSAtIHk7XG4gICAgICAgIHggPSBldi54O1xuICAgICAgICB5ID0gZXYueTtcbiAgICAgICAgdmFyIGlzSW5UcmVlID0gaXNJblJlY3QoeCwgeSwgc2Nyb2xsZXJSZWN0KTtcbiAgICAgICAgaWYgKCFpc0luVHJlZSkge1xuICAgICAgICAgICAgbm9kZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChkcmFnSW5mby5pc0luVHJlZSAhPSBpc0luVHJlZSAmJiBkcmFnSW5mby5zZWxlY3RlZE5vZGVzKSB7XG4gICAgICAgICAgICBkcmFnSW5mby5pc0luVHJlZSA9IGlzSW5UcmVlO1xuICAgICAgICAgICAgZXYuZHJhZ0luZm8gPSBkcmFnSW5mbztcbiAgICAgICAgICAgIHRyZWUuX3NpZ25hbChpc0luVHJlZSA/IFwiZHJhZ0luXCIgOiBcImRyYWdPdXRcIiAsIGV2KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzSW5UcmVlKSB7XG4gICAgICAgICAgICBldi5kcmFnSW5mbyA9IGRyYWdJbmZvO1xuICAgICAgICAgICAgdHJlZS5fc2lnbmFsKFwiZHJhZ01vdmVPdXRzaWRlXCIsIGV2KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGRyYWdJbmZvLmVsKSB7XG4gICAgICAgICAgICBkcmFnSW5mby5lbC5zdHlsZS50b3AgPSBldi55IC0gZHJhZ0luZm8ub2Zmc2V0WSArIFwicHhcIjtcbiAgICAgICAgICAgIGRyYWdJbmZvLmVsLnN0eWxlLmxlZnQgPSBldi54IC0gZHJhZ0luZm8ub2Zmc2V0WCArIFwicHhcIjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGhvdmVyTm9kZSA9IG5vZGU7XG4gICAgICAgIGlmIChob3Zlck5vZGUpIHtcbiAgICAgICAgICAgIHZhciB4T2Zmc2V0ID0geCAtIHNjcm9sbGVyUmVjdC5sZWZ0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZGVwdGggPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKHhPZmZzZXQgLyB0cmVlLnByb3ZpZGVyLiRpbmRlbnRTaXplKSk7XG4gICAgICAgICAgICB2YXIgZGVwdGhEaWZmID0gaG92ZXJOb2RlLiRkZXB0aCAtIGRlcHRoO1xuICAgICAgICAgICAgd2hpbGUgKGRlcHRoRGlmZiA+IDAgJiYgaG92ZXJOb2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIGRlcHRoRGlmZi0tO1xuICAgICAgICAgICAgICAgIGhvdmVyTm9kZSA9IGhvdmVyTm9kZS5wYXJlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghaG92ZXJOb2RlLmlzRm9sZGVyICYmIGRyYWdJbmZvLm1vZGUgIT0gXCJzb3J0XCIpIHtcbiAgICAgICAgICAgICAgICBob3Zlck5vZGUgPSBob3Zlck5vZGUucGFyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoZHJhZ0luZm8uaG92ZXJOb2RlICE9PSBob3Zlck5vZGUpIHtcbiAgICAgICAgICAgIGlmIChkcmFnSW5mby5ob3Zlck5vZGUpIHtcbiAgICAgICAgICAgICAgICB0cmVlLnByb3ZpZGVyLnNldENsYXNzKGRyYWdJbmZvLmhvdmVyTm9kZSwgXCJkcm9wVGFyZ2V0XCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB0cmVlLl9zaWduYWwoXCJmb2xkZXJEcmFnTGVhdmVcIiwgZHJhZ0luZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhvdmVyTm9kZSAmJiBkcmFnSW5mby5zZWxlY3RlZE5vZGVzICYmIGRyYWdJbmZvLnNlbGVjdGVkTm9kZXMuaW5kZXhPZihob3Zlck5vZGUpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgaG92ZXJOb2RlID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRyYWdJbmZvLmhvdmVyTm9kZSA9IGhvdmVyTm9kZTtcbiAgICAgICAgICAgIGlmIChkcmFnSW5mby5ob3Zlck5vZGUpIHtcbiAgICAgICAgICAgICAgICB0cmVlLl9zaWduYWwoXCJmb2xkZXJEcmFnRW50ZXJcIiwgZHJhZ0luZm8pO1xuICAgICAgICAgICAgICAgIGlmIChkcmFnSW5mby5tb2RlICE9PSBcInNvcnRcIilcbiAgICAgICAgICAgICAgICAgICAgdHJlZS5wcm92aWRlci5zZXRDbGFzcyhkcmFnSW5mby5ob3Zlck5vZGUsIFwiZHJvcFRhcmdldFwiLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhpZ2hsaWdodEZvbGRlcih0cmVlLCBkcmFnSW5mby5ob3Zlck5vZGUsIGRyYWdJbmZvLmluc2VydFBvcyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIHZhciB0YXJnZXQgPSBldi5kb21FdmVudC50YXJnZXQ7XG4gICAgICAgIHZhciBpc0ZvbGRXaWRnZXQgPSB0YXJnZXQgJiYgKGRvbS5oYXNDc3NDbGFzcyh0YXJnZXQsIFwidG9nZ2xlclwiKSBcbiAgICAgICAgICAgICYmICFkb20uaGFzQ3NzQ2xhc3ModGFyZ2V0LCBcImVtcHR5XCIpKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBkaXN0YW5jZSA9IE1hdGguYWJzKGR4KSArIE1hdGguYWJzKGR5KTtcbiAgICAgICAgXG4gICAgICAgIHZhciBwb3MgPSBldi55IC0gc2Nyb2xsZXJSZWN0LnRvcDtcbiAgICAgICAgdmFyIHJvd0hlaWdodCA9IHRyZWUucHJvdmlkZXIucm93SGVpZ2h0O1xuICAgICAgICB2YXIgcmVuZGVyZXIgPSB0cmVlLnJlbmRlcmVyO1xuICAgICAgICB2YXIgYXV0b1Njcm9sbE1hcmdpbiA9IDEuNSAqIHJvd0hlaWdodDtcbiAgICAgICAgdmFyIHNjcm9sbCA9IHBvcyAtIGF1dG9TY3JvbGxNYXJnaW47XG4gICAgICAgIGlmIChzY3JvbGwgPiAwKSB7XG4gICAgICAgICAgICBzY3JvbGwgKz0gLXJlbmRlcmVyLiRzaXplLnNjcm9sbGVySGVpZ2h0ICsgMiAqIGF1dG9TY3JvbGxNYXJnaW47XG4gICAgICAgICAgICBpZiAoc2Nyb2xsIDwgMClcbiAgICAgICAgICAgICAgICBzY3JvbGwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2Nyb2xsIHx8ICFpc0luVHJlZSlcbiAgICAgICAgICAgIGRyYWdJbmZvLmF1dG9TY3JvbGwgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIGlmIChkaXN0YW5jZSA8PSAyKSB7XG4gICAgICAgICAgICBpZiAoIWRyYWdJbmZvLnN0b3BUaW1lKVxuICAgICAgICAgICAgICAgIGRyYWdJbmZvLnN0b3BUaW1lID0gbm93O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFpc0ZvbGRXaWRnZXQpXG4gICAgICAgICAgICAgICAgZHJhZ0luZm8uc3RvcFRpbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGR0ID0gbm93IC0gZHJhZ0luZm8uc3RvcFRpbWU7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2Nyb2xsICYmIGlzSW5UcmVlKSB7XG4gICAgICAgICAgICBpZiAoZHQgPiBBVVRPU0NST0xMX0RFTEFZIHx8IGRyYWdJbmZvLmF1dG9TY3JvbGwpIHtcbiAgICAgICAgICAgICAgICB0cmVlLnJlbmRlcmVyLnNjcm9sbEJ5KDAsIHNjcm9sbCAvIDIpO1xuICAgICAgICAgICAgICAgIGRyYWdJbmZvLmF1dG9TY3JvbGwgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5vZGUgJiYgZHJhZ0luZm8ubW9kZSA9PT0gXCJtb3ZlXCIpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnBhcmVudCA9PT0gdHJlZS5wcm92aWRlci5yb290IHx8IG5vZGUuaXNSb290IHx8IG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50LmlzUm9vdClcbiAgICAgICAgICAgICAgICBpc0ZvbGRXaWRnZXQgPSBmYWxzZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlzRm9sZFdpZGdldCAmJiBkdCA+IFdJREdFVF9VTkZPTERfVElNRU9VVCAmJiBkdCA8IDIgKiBXSURHRVRfVU5GT0xEX1RJTUVPVVQpIHtcbiAgICAgICAgICAgICAgICB0cmVlLnByb3ZpZGVyLnRvZ2dsZU5vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgZHJhZ0luZm8uc3RvcFRpbWUgPSBJbmZpbml0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCFpc0ZvbGRXaWRnZXQgJiYgZHQgPiBVTkZPTERfVElNRU9VVCAmJiBkdCA8IDIgKiBVTkZPTERfVElNRU9VVCkge1xuICAgICAgICAgICAgICAgIHRyZWUucHJvdmlkZXIub3Blbihub2RlKTtcbiAgICAgICAgICAgICAgICBkcmFnSW5mby5zdG9wVGltZSA9IEluZmluaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBtb3VzZUhhbmRsZXIuZHJhZ0VuZCA9IGZ1bmN0aW9uKGUsIGNhbmNlbCkge1xuICAgICAgICBpZiAoZHJhZ0luZm8pIHtcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGtleUhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGtleUhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBrZXlIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIGlmIChkcmFnSW5mby5lbCAmJiBkcmFnSW5mby5lbC5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAgIGRyYWdJbmZvLmVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZHJhZ0luZm8uZWwpO1xuICAgICAgICAgICAgaWYgKGRyYWdJbmZvLmhvdmVyTm9kZSkge1xuICAgICAgICAgICAgICAgIHRyZWUucHJvdmlkZXIuc2V0Q2xhc3MoZHJhZ0luZm8uaG92ZXJOb2RlLCBcImRyb3BUYXJnZXRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRyZWUuX3NpZ25hbChcImZvbGRlckRyYWdMZWF2ZVwiLCBkcmFnSW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoaWdobGlnaHRGb2xkZXIodHJlZSwgbnVsbCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0cmVlLmlzRm9jdXNlZCgpKVxuICAgICAgICAgICAgICAgIHRyZWUucmVuZGVyZXIudmlzdWFsaXplRm9jdXMoKTtcbiAgICAgICAgICAgIHRyZWUucmVuZGVyZXIuc2V0U3R5bGUoXCJkcmFnT3ZlclwiLCBmYWxzZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRyYWdJbmZvLnRhcmdldCA9IGRyYWdJbmZvLmhvdmVyTm9kZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFjYW5jZWwgJiYgZHJhZ0luZm8uc2VsZWN0ZWROb2RlcyAmJiBEYXRlLm5vdygpIC0gZHJhZ0luZm8uc3RhcnRUID4gTUlOX0RSQUdfVClcbiAgICAgICAgICAgICAgICB0cmVlLl9lbWl0KFwiZHJvcFwiLCBkcmFnSW5mbyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghZHJhZ0luZm8uaXNJblRyZWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FuY2VsKVxuICAgICAgICAgICAgICAgICAgICBkcmFnSW5mby5zZWxlY3RlZE5vZGVzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0cmVlLl9zaWduYWwoXCJkcm9wT3V0c2lkZVwiICwge2RyYWdJbmZvOiBkcmFnSW5mb30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZHJhZ0luZm8gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBtb3VzZUhhbmRsZXIuZHJhZ1N0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChkcmFnSW5mbylcbiAgICAgICAgICAgIHRoaXMuZHJhZ0VuZChudWxsLCB0cnVlKTtcbiAgICAgICAgbW91c2VIYW5kbGVyLnNldFN0YXRlKFwiZHJhZ1wiKTtcbiAgICAgICAgdHJlZS5yZW5kZXJlci52aXN1YWxpemVCbHVyKCk7XG4gICAgICAgIHRyZWUucmVuZGVyZXIuc2V0U3R5bGUoXCJkcmFnT3ZlclwiLCB0cnVlKTtcbiAgICAgICAgc2Nyb2xsZXJSZWN0ID0gdHJlZS5yZW5kZXJlci5zY3JvbGxlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgZHJhZ0luZm8gPSB7fTtcbiAgICB9O1xuICAgIFxuICAgIHRyZWUub24oXCJzdGFydERyYWdcIiwgZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKCF0cmVlLmdldE9wdGlvbihcImVuYWJsZURyYWdEcm9wXCIpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgbm9kZSA9IGV2LmdldE5vZGUoKTtcbiAgICAgICAgaWYgKCFub2RlIHx8IGV2LmdldEJ1dHRvbigpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBtb3VzZUhhbmRsZXIuZHJhZ1N0YXJ0KCk7XG4gICAgICAgIFxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBrZXlIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGtleUhhbmRsZXIsIHRydWUpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGtleUhhbmRsZXIsIHRydWUpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGVjdGVkTm9kZXMgPSB0cmVlLnNlbGVjdGlvbi5nZXRTZWxlY3RlZE5vZGVzKCk7XG4gICAgICAgIHZhciBlbCA9IGNvbnN0cnVjdERyYWdOb2RlKG5vZGUpO1xuICAgICAgICBcbiAgICAgICAgZHJhZ0luZm8gPSB7XG4gICAgICAgICAgICBlbDogZWwsXG4gICAgICAgICAgICBub2RlOiBub2RlLFxuICAgICAgICAgICAgc2VsZWN0ZWROb2Rlczogc2VsZWN0ZWROb2RlcyxcbiAgICAgICAgICAgIG9mZnNldFg6IDEwLFxuICAgICAgICAgICAgb2Zmc2V0WTogMTAsXG4gICAgICAgICAgICB0YXJnZXQ6IG5vZGUsXG4gICAgICAgICAgICBzdGFydFQ6IERhdGUubm93KCksXG4gICAgICAgICAgICBpc0luVHJlZTogdHJ1ZSxcbiAgICAgICAgICAgIG1vZGU6IFwibW92ZVwiXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBldi5kcmFnSW5mbyA9IGRyYWdJbmZvO1xuICAgICAgICB0cmVlLl9zaWduYWwoXCJkcmFnU3RhcnRlZFwiLCBldik7XG4gICAgICAgIFxuICAgICAgICBpZiAobW91c2VIYW5kbGVyLnN0YXRlID09IFwiZHJhZ1wiKVxuICAgICAgICAgICAgbW91c2VIYW5kbGVyLmRyYWcoKTtcbiAgICB9KTtcbiAgICBcbiAgICBmdW5jdGlvbiBjb25zdHJ1Y3REcmFnTm9kZShub2RlKSB7XG4gICAgICAgIHZhciBpID0gdHJlZS5wcm92aWRlci5nZXRJbmRleEZvck5vZGUobm9kZSk7XG4gICAgICAgIHZhciBkb21Ob2RlID0gdHJlZS5yZW5kZXJlci4kY2VsbExheWVyLmdldERvbU5vZGVBdEluZGV4KGkpO1xuICAgICAgICBpZiAoIWRvbU5vZGUpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHZhciBvZmZzZXQgPSBkb21Ob2RlLm9mZnNldEhlaWdodDtcbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxlY3RlZE5vZGVzID0gdHJlZS5zZWxlY3Rpb24uZ2V0U2VsZWN0ZWROb2RlcygpO1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSB0cmVlLmNvbnRhaW5lci5jbGFzc05hbWUgKyBcIiBkcmFnSW1hZ2VcIjtcbiAgICAgICAgdmFyIGNoID0gZWwuYXBwZW5kQ2hpbGQoZG9tTm9kZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICBjaC5yZW1vdmVDaGlsZChjaC5maXJzdENoaWxkKTtcbiAgICAgICAgY2guc3R5bGUucGFkZGluZ1JpZ2h0ID0gXCI1cHhcIjtcbiAgICAgICAgY2guc3R5bGUub3BhY2l0eSA9IFwiMC44XCI7XG4gICAgICAgIFxuICAgICAgICBlbC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgZWwuc3R5bGUuekluZGV4ID0gXCIxMDAwMDAwXCI7XG4gICAgICAgIGVsLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICAgZWwuc3R5bGUub3ZlcmZsb3cgPSBcInZpc2libGVcIjtcbiAgICAgICAgXG4gICAgICAgIGlmIChzZWxlY3RlZE5vZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNoLnN0eWxlLmNvbG9yID0gXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgICAgICAgY2ggPSBlbC5hcHBlbmRDaGlsZChkb21Ob2RlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgICAgICBjaC5yZW1vdmVDaGlsZChjaC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIGNoLnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiNXB4XCI7XG4gICAgICAgICAgICBjaC5zdHlsZS50b3AgPSAtIG9mZnNldCArIDIgKyBcInB4XCI7XG4gICAgICAgICAgICBjaC5zdHlsZS5sZWZ0ID0gXCIycHhcIjtcbiAgICAgICAgICAgIGNoLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICAgICAgY2guc3R5bGUub3BhY2l0eSA9IFwiMC44XCI7XG4gICAgICAgIH1cblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBrZXlIYW5kbGVyKGUpe1xuICAgICAgICBpZiAoZHJhZ0luZm8pIHtcbiAgICAgICAgICAgIGlmIChlLmtleUNvZGUgPT09IDI3IHx8IGUudHlwZSA9PSBcIm1vdXNlZG93blwiKSB7XG4gICAgICAgICAgICAgICAgbW91c2VIYW5kbGVyLmRyYWdFbmQobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcEV2ZW50KGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkcmFnSW5mbyAmJiBlLmtleUNvZGUgPT0gMTcgfHwgIGUua2V5Q29kZSA9PSAxOCkge1xuICAgICAgICAgICAgICAgIGRyYWdJbmZvLmlzQ29weSA9IGUudHlwZSA9PSBcImtleWRvd25cIjtcbiAgICAgICAgICAgICAgICBkb20uc2V0Q3NzQ2xhc3MoZHJhZ0luZm8uZWwsIFwiY29weVwiLCBkcmFnSW5mby5pc0NvcHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0Rm9sZGVyKHRyZWUsIG5vZGUsIHR5cGUpIHtcbiAgICB0cmVlLnByb3ZpZGVyLm1hcmtlZEZvbGRlciA9IG5vZGU7XG4gICAgdHJlZS5wcm92aWRlci5tYXJrZWRGb2xkZXJUeXBlID0gdHlwZTtcbiAgICB0cmVlLnJlbmRlcmVyLiRsb29wLnNjaGVkdWxlKHRyZWUucmVuZGVyZXIuQ0hBTkdFX01BUktFUik7XG59XG5cbmZ1bmN0aW9uIGlzSW5SZWN0KHgsIHksIHJlY3QpIHtcbiAgICBpZiAoeCA8IHJlY3QucmlnaHQgJiYgeCA+IHJlY3QubGVmdCAmJiB5ID4gcmVjdC50b3AgJiYgeSA8IHJlY3QuYm90dG9tKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbml0RHJhZ0hhbmRsZXJzO1xufSk7XG4iLCJkZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cInVzZSBzdHJpY3RcIjtcbnZhciBldmVudCA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL2V2ZW50XCIpO1xuXG5mdW5jdGlvbiBIZWFkaW5nSGFuZGxlcihtb3VzZUhhbmRsZXIpIHtcbiAgICB2YXIgZWRpdG9yICAgICAgID0gbW91c2VIYW5kbGVyLmVkaXRvcjtcbiAgICB2YXIgaGVhZGluZ0xheWVyID0gZWRpdG9yLnJlbmRlcmVyLiRoZWFkaW5nTGF5ZXI7XG4gICAgXG5cbiAgICBldmVudC5hZGRMaXN0ZW5lcihoZWFkaW5nTGF5ZXIuZWxlbWVudCwgXG4gICAgICAgIFwibW91c2Vkb3duXCIsIFxuICAgICAgICBtb3VzZUhhbmRsZXIub25Nb3VzZUV2ZW50LmJpbmQobW91c2VIYW5kbGVyLCBcImhlYWRlck1vdXNlRG93blwiKSk7XG4gICAgICAgIFxuICAgIGV2ZW50LmFkZExpc3RlbmVyKGhlYWRpbmdMYXllci5lbGVtZW50LCBcbiAgICAgICAgXCJtb3VzZW1vdmVcIixcbiAgICAgICAgbW91c2VIYW5kbGVyLm9uTW91c2VFdmVudC5iaW5kKG1vdXNlSGFuZGxlciwgXCJoZWFkZXJNb3VzZU1vdmVcIikpO1xuICAgICAgICBcbiAgICB2YXIgb3ZlclJlc2l6ZXIsIGRyYWdTdGFydFBvcywgY29sdW1uRGF0YTtcbiAgICBlZGl0b3Iuc2V0RGVmYXVsdEhhbmRsZXIoXCJoZWFkZXJNb3VzZU1vdmVcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZHJhZ1N0YXJ0UG9zIHx8ICFlZGl0b3IucHJvdmlkZXIgfHwgIWVkaXRvci5wcm92aWRlci5jb2x1bW5zKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgcG9zID0gZS5nZXREb2N1bWVudFBvc2l0aW9uKCk7XG4gICAgICAgIHZhciB3aWR0aCA9IGVkaXRvci5yZW5kZXJlci4kc2l6ZS5zY3JvbGxlcldpZHRoO1xuICAgICAgICBpZiAod2lkdGggIT0gZWRpdG9yLnByb3ZpZGVyLmNvbHVtbnMud2lkdGgpXG4gICAgICAgICAgICBoZWFkaW5nTGF5ZXIudXBkYXRlV2lkdGgod2lkdGgpO1xuICAgICAgICBjb2x1bW5EYXRhID0gaGVhZGluZ0xheWVyLmZpbmRDb2x1bW4ocG9zLngpO1xuICAgICAgICBcbiAgICAgICAgb3ZlclJlc2l6ZXIgPSBjb2x1bW5EYXRhICYmIGNvbHVtbkRhdGEub3ZlclJlc2l6ZXI7XG4gICAgICAgIGhlYWRpbmdMYXllci5lbGVtZW50LnN0eWxlLmN1cnNvciA9IG92ZXJSZXNpemVyXG4gICAgICAgICAgICA/IFwiZXctcmVzaXplXCJcbiAgICAgICAgICAgIDogXCJkZWZhdWx0XCI7XG4gICAgfSk7XG4gICAgXG4gICAgXG4gICAgZWRpdG9yLnNldERlZmF1bHRIYW5kbGVyKFwiaGVhZGVyTW91c2VEb3duXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKG92ZXJSZXNpemVyKSB7XG4gICAgICAgICAgICB2YXIgcG9zID0gZS5nZXREb2N1bWVudFBvc2l0aW9uKCk7XG4gICAgICAgICAgICBkcmFnU3RhcnRQb3MgPSB7eDogcG9zLnh9O1xuICAgICAgICAgICAgbW91c2VIYW5kbGVyLnNldFN0YXRlKFwiaGVhZGVyUmVzaXplXCIpO1xuICAgICAgICAgICAgbW91c2VIYW5kbGVyLmNhcHR1cmVNb3VzZShlKTtcbiAgICAgICAgICAgIG1vdXNlSGFuZGxlci5tb3VzZUV2ZW50ID0gZTtcbiAgICAgICAgfVxuICAgICAgICBlLnN0b3AoKTtcbiAgICB9KTtcbiAgICBcbiAgICBtb3VzZUhhbmRsZXIuaGVhZGVyUmVzaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLm1vdXNlRXZlbnQgJiYgZHJhZ1N0YXJ0UG9zKSB7XG4gICAgICAgICAgICB2YXIgcG9zID0gdGhpcy5tb3VzZUV2ZW50LmdldERvY3VtZW50UG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBkeCA9IHBvcy54IC8vIC0gZHJhZ1N0YXJ0UG9zLng7XG4gICAgICAgICAgICB2YXIgY29sdW1ucyA9IGVkaXRvci5yZW5kZXJlci5wcm92aWRlci5jb2x1bW5zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbCA9IGNvbHVtbnNbaV07XG4gICAgICAgICAgICAgICAgZHggLT0gY29sLnBpeGVsV2lkdGg7XG4gICAgICAgICAgICAgICAgaWYgKGNvbCA9PT0gY29sdW1uRGF0YS5jb2x1bW4pXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRvdGFsID0gZWRpdG9yLnJlbmRlcmVyLiRzaXplLnNjcm9sbGVyV2lkdGg7XG4gICAgICAgICAgICBoZWFkaW5nTGF5ZXIuY2hhbmdlQ29sdW1uV2lkdGgoY29sdW1uRGF0YS5jb2x1bW4sIGR4LCB0b3RhbCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciByZW5kZXJlciA9IGVkaXRvci5yZW5kZXJlcjtcbiAgICAgICAgICAgIHJlbmRlcmVyLnVwZGF0ZUZ1bGwoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbW91c2VIYW5kbGVyLmhlYWRlclJlc2l6ZUVuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBkcmFnU3RhcnRQb3MgPSBudWxsO1xuICAgICAgICBoZWFkaW5nTGF5ZXIuZWxlbWVudC5zdHlsZS5jdXJzb3IgPSBcIlwiO1xuICAgICAgICBvdmVyUmVzaXplciA9IGZhbHNlO1xuICAgIH07XG5cbn1cblxuZXhwb3J0cy5IZWFkaW5nSGFuZGxlciA9IEhlYWRpbmdIYW5kbGVyO1xuXG59KTtcbiIsIi8qICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgbGljZW5zZTpcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAsIEFqYXgub3JnIEIuVi5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAqICAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgICAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIEFqYXgub3JnIEIuVi4gbm9yIHRoZVxuICogICAgICAgbmFtZXMgb2YgaXRzIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHNcbiAqICAgICAgIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICogXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIiBBTkRcbiAqIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG4gKiBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBBSkFYLk9SRyBCLlYuIEJFIExJQUJMRSBGT1IgQU5ZXG4gKiBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuICogKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICogTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gKiBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICogKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcbiAqIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICpcbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqICovXG5cbmRlZmluZShmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgZXZlbnQgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9ldmVudFwiKTtcbnZhciB1c2VyYWdlbnQgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi91c2VyYWdlbnRcIik7XG5cbi8qXG4gKiBDdXN0b20gQWNlIG1vdXNlIGV2ZW50XG4gKi9cbnZhciBNb3VzZUV2ZW50ID0gZXhwb3J0cy5Nb3VzZUV2ZW50ID0gZnVuY3Rpb24oZG9tRXZlbnQsIGVkaXRvcikge1xuICAgIHRoaXMuZG9tRXZlbnQgPSBkb21FdmVudDtcbiAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICBcbiAgICB0aGlzLnggPSB0aGlzLmNsaWVudFggPSBkb21FdmVudC5jbGllbnRYO1xuICAgIHRoaXMueSA9IHRoaXMuY2xpZW50WSA9IGRvbUV2ZW50LmNsaWVudFk7XG5cbiAgICB0aGlzLiRwb3MgPSBudWxsO1xuICAgIHRoaXMuJGluU2VsZWN0aW9uID0gbnVsbDtcbiAgICBcbiAgICB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IGZhbHNlO1xuICAgIHRoaXMuZGVmYXVsdFByZXZlbnRlZCA9IGZhbHNlO1xufTtcblxuKGZ1bmN0aW9uKCkgeyAgXG4gICAgXG4gICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKHRoaXMuZG9tRXZlbnQpO1xuICAgICAgICB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KHRoaXMuZG9tRXZlbnQpO1xuICAgICAgICB0aGlzLmRlZmF1bHRQcmV2ZW50ZWQgPSB0cnVlO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMucHJldmVudERlZmF1bHQoKTtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBHZXQgdGhlIGRvY3VtZW50IHBvc2l0aW9uIGJlbG93IHRoZSBtb3VzZSBjdXJzb3JcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9ICdyb3cnIGFuZCAnY29sdW1uJyBvZiB0aGUgZG9jdW1lbnQgcG9zaXRpb25cbiAgICAgKi9cbiAgICB0aGlzLmdldERvY3VtZW50UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuJHBvcylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRwb3M7XG4gICAgICAgIFxuICAgICAgICB0aGlzLiRwb3MgPSB0aGlzLmVkaXRvci5yZW5kZXJlci5zY3JlZW5Ub1RleHRDb29yZGluYXRlcyh0aGlzLmNsaWVudFgsIHRoaXMuY2xpZW50WSk7XG4gICAgICAgIHJldHVybiB0aGlzLiRwb3M7XG4gICAgfTtcbiAgICBcbiAgICAvKlxuICAgICAqIENoZWNrIGlmIHRoZSBtb3VzZSBjdXJzb3IgaXMgaW5zaWRlIG9mIHRoZSB0ZXh0IHNlbGVjdGlvblxuICAgICAqIFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgdGhlIG1vdXNlIGN1cnNvciBpcyBpbnNpZGUgb2YgdGhlIHNlbGVjdGlvblxuICAgICAqL1xuICAgIHRoaXMuaW5TZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuJGluU2VsZWN0aW9uICE9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuJGluU2VsZWN0aW9uO1xuICAgICAgICAgICAgXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlKCk7XG4gICAgICAgIHRoaXMuJGluU2VsZWN0aW9uID0gISEobm9kZSAmJiBub2RlLmlzU2VsZWN0ZWQpO1xuICAgICAgICByZXR1cm4gdGhpcy4kaW5TZWxlY3Rpb247XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLm5vZGUgPSBudWxsO1xuICAgIHRoaXMuZ2V0Tm9kZSA9IGZ1bmN0aW9uKGNsaXApIHtcbiAgICAgICAgaWYgKHRoaXMubm9kZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vZGU7XG4gICAgICAgIHZhciBwb3MgPSB0aGlzLmdldERvY3VtZW50UG9zaXRpb24oY2xpcCk7XG4gICAgICAgIGlmICghcG9zIHx8ICF0aGlzLmVkaXRvci5wcm92aWRlcikgcmV0dXJuOyAvLyBDbGljayBvdXRzaWRlIGNlbGxzXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUgPSB0aGlzLmVkaXRvci5wcm92aWRlci5maW5kSXRlbUF0T2Zmc2V0KHBvcy55LCBjbGlwKTtcbiAgICB9O1xuICAgIFxuICAgIC8qXG4gICAgICogR2V0IHRoZSBjbGlja2VkIG1vdXNlIGJ1dHRvblxuICAgICAqIFxuICAgICAqIEByZXR1cm4ge051bWJlcn0gMCBmb3IgbGVmdCBidXR0b24sIDEgZm9yIG1pZGRsZSBidXR0b24sIDIgZm9yIHJpZ2h0IGJ1dHRvblxuICAgICAqL1xuICAgIHRoaXMuZ2V0QnV0dG9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBldmVudC5nZXRCdXR0b24odGhpcy5kb21FdmVudCk7XG4gICAgfTtcbiAgICBcbiAgICAvKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgdGhlIHNoaWZ0IGtleSB3YXMgcHJlc3NlZCB3aGVuIHRoZSBldmVudCB3YXMgZW1pdHRlZFxuICAgICAqL1xuICAgIHRoaXMuZ2V0U2hpZnRLZXkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9tRXZlbnQuc2hpZnRLZXk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmdldEFjY2VsS2V5ID0gdXNlcmFnZW50LmlzTWFjXG4gICAgICAgID8gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmRvbUV2ZW50Lm1ldGFLZXk7IH1cbiAgICAgICAgOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuZG9tRXZlbnQuY3RybEtleTsgfTtcbiAgICBcbn0pLmNhbGwoTW91c2VFdmVudC5wcm90b3R5cGUpO1xuXG59KTtcbiIsIi8qICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgbGljZW5zZTpcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAsIEFqYXgub3JnIEIuVi5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAqICAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgICAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIEFqYXgub3JnIEIuVi4gbm9yIHRoZVxuICogICAgICAgbmFtZXMgb2YgaXRzIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHNcbiAqICAgICAgIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICogXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIiBBTkRcbiAqIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG4gKiBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBBSkFYLk9SRyBCLlYuIEJFIExJQUJMRSBGT1IgQU5ZXG4gKiBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuICogKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICogTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gKiBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICogKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcbiAqIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLiBcbiAqXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKiAqL1xuXG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGV2ZW50ID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZXZlbnRcIik7XG52YXIgdXNlcmFnZW50ID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvdXNlcmFnZW50XCIpO1xudmFyIERlZmF1bHRIYW5kbGVycyA9IHJlcXVpcmUoXCIuL2RlZmF1bHRfaGFuZGxlcnNcIikuRGVmYXVsdEhhbmRsZXJzO1xudmFyIGluaXREcmFnSGFuZGxlcnMgPSByZXF1aXJlKFwiLi9kcmFnX2hhbmRsZXJcIik7XG52YXIgSGVhZGluZ0hhbmRsZXIgPSByZXF1aXJlKFwiLi9oZWFkaW5nX2hhbmRsZXJcIikuSGVhZGluZ0hhbmRsZXI7XG52YXIgTW91c2VFdmVudCA9IHJlcXVpcmUoXCIuL21vdXNlX2V2ZW50XCIpLk1vdXNlRXZlbnQ7XG52YXIgY29uZmlnID0gcmVxdWlyZShcIi4uL2NvbmZpZ1wiKTtcblxudmFyIE1vdXNlSGFuZGxlciA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuXG4gICAgbmV3IERlZmF1bHRIYW5kbGVycyh0aGlzKTtcbiAgICBuZXcgSGVhZGluZ0hhbmRsZXIodGhpcyk7XG4gICAgaW5pdERyYWdIYW5kbGVycyh0aGlzKTtcblxuXG4gICAgdmFyIG1vdXNlVGFyZ2V0ID0gZWRpdG9yLnJlbmRlcmVyLmdldE1vdXNlRXZlbnRUYXJnZXQoKTtcbiAgICBldmVudC5hZGRMaXN0ZW5lcihtb3VzZVRhcmdldCwgXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICBlZGl0b3IuZm9jdXModHJ1ZSk7XG4gICAgICAgIHJldHVybiBldmVudC5wcmV2ZW50RGVmYXVsdChlKTtcbiAgICB9KTtcblxuICAgIGV2ZW50LmFkZExpc3RlbmVyKG1vdXNlVGFyZ2V0LCBcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VFdmVudC5iaW5kKHRoaXMsIFwibW91c2Vtb3ZlXCIpKTtcbiAgICBldmVudC5hZGRMaXN0ZW5lcihtb3VzZVRhcmdldCwgXCJtb3VzZXVwXCIsIHRoaXMub25Nb3VzZUV2ZW50LmJpbmQodGhpcywgXCJtb3VzZXVwXCIpKTtcbiAgICBldmVudC5hZGRNdWx0aU1vdXNlRG93bkxpc3RlbmVyKG1vdXNlVGFyZ2V0LCBbMzAwLCAzMDAsIDI1MF0sIHRoaXMsIFwib25Nb3VzZUV2ZW50XCIpO1xuICAgIGV2ZW50LmFkZE11bHRpTW91c2VEb3duTGlzdGVuZXIoZWRpdG9yLnJlbmRlcmVyLnNjcm9sbEJhclYuaW5uZXIsIFszMDAsIDMwMCwgMjUwXSwgdGhpcywgXCJvbk1vdXNlRXZlbnRcIik7XG4gICAgZXZlbnQuYWRkTXVsdGlNb3VzZURvd25MaXN0ZW5lcihlZGl0b3IucmVuZGVyZXIuc2Nyb2xsQmFySC5pbm5lciwgWzMwMCwgMzAwLCAyNTBdLCB0aGlzLCBcIm9uTW91c2VFdmVudFwiKTtcbiAgICBldmVudC5hZGRNb3VzZVdoZWVsTGlzdGVuZXIoZWRpdG9yLmNvbnRhaW5lciwgdGhpcy5vbk1vdXNlV2hlZWwuYmluZCh0aGlzLCBcIm1vdXNld2hlZWxcIikpO1xuICAgIGV2ZW50LmFkZExpc3RlbmVyKG1vdXNlVGFyZ2V0LCBcIm1vdXNlb3V0XCIsIHRoaXMub25Nb3VzZUV2ZW50LmJpbmQodGhpcywgXCJtb3VzZWxlYXZlXCIpKTtcbn07XG5cbihmdW5jdGlvbigpIHtcbiAgICB0aGlzLm9uTW91c2VFdmVudCA9IGZ1bmN0aW9uKG5hbWUsIGUpIHtcbiAgICAgICAgdGhpcy5lZGl0b3IuX2VtaXQobmFtZSwgbmV3IE1vdXNlRXZlbnQoZSwgdGhpcy5lZGl0b3IpKTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbk1vdXNlV2hlZWwgPSBmdW5jdGlvbihuYW1lLCBlKSB7XG4gICAgICAgIHZhciBtb3VzZUV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoZSwgdGhpcy5lZGl0b3IpO1xuICAgICAgICBtb3VzZUV2ZW50LnNwZWVkID0gdGhpcy4kc2Nyb2xsU3BlZWQgKiAyO1xuICAgICAgICBtb3VzZUV2ZW50LndoZWVsWCA9IGUud2hlZWxYO1xuICAgICAgICBtb3VzZUV2ZW50LndoZWVsWSA9IGUud2hlZWxZO1xuXG4gICAgICAgIHRoaXMuZWRpdG9yLl9lbWl0KG5hbWUsIG1vdXNlRXZlbnQpO1xuICAgIH07XG5cbiAgICB0aGlzLnNldFN0YXRlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIH07XG5cbiAgICB0aGlzLmNhcHR1cmVNb3VzZSA9IGZ1bmN0aW9uKGV2LCBzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUpXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHN0YXRlKTtcblxuICAgICAgICB0aGlzLnggPSBldi54O1xuICAgICAgICB0aGlzLnkgPSBldi55O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IDI7XG5cbiAgICAgICAgLy8gZG8gbm90IG1vdmUgdGV4dGFyZWEgZHVyaW5nIHNlbGVjdGlvblxuICAgICAgICB2YXIgcmVuZGVyZXIgPSB0aGlzLmVkaXRvci5yZW5kZXJlcjtcbiAgICAgICAgaWYgKHJlbmRlcmVyLiRrZWVwVGV4dEFyZWFBdEN1cnNvcilcbiAgICAgICAgICAgIHJlbmRlcmVyLiRrZWVwVGV4dEFyZWFBdEN1cnNvciA9IG51bGw7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgb25Nb3VzZU1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBzZWxmLnggPSBlLmNsaWVudFg7XG4gICAgICAgICAgICBzZWxmLnkgPSBlLmNsaWVudFk7XG4gICAgICAgICAgICBzZWxmLm1vdXNlRXZlbnQgPSBuZXcgTW91c2VFdmVudChlLCBzZWxmLmVkaXRvcik7XG4gICAgICAgICAgICBzZWxmLiRtb3VzZU1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb25DYXB0dXJlRW5kID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcklkKTtcbiAgICAgICAgICAgIG9uQ2FwdHVyZUludGVydmFsKCk7XG4gICAgICAgICAgICBzZWxmW3NlbGYuc3RhdGUgKyBcIkVuZFwiXSAmJiBzZWxmW3NlbGYuc3RhdGUgKyBcIkVuZFwiXShlKTtcbiAgICAgICAgICAgIHNlbGYuJGNsaWNrU2VsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlci4ka2VlcFRleHRBcmVhQXRDdXJzb3IgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlbmRlcmVyLiRrZWVwVGV4dEFyZWFBdEN1cnNvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVuZGVyZXIuJG1vdmVUZXh0QXJlYVRvQ3Vyc29yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICBlICYmIHNlbGYub25Nb3VzZUV2ZW50KFwibW91c2V1cFwiLCBlKTtcbiAgICAgICAgICAgIHNlbGYuJG9uQ2FwdHVyZU1vdXNlTW92ZSA9IHNlbGYucmVsZWFzZU1vdXNlID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb25DYXB0dXJlSW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGZbc2VsZi5zdGF0ZV0gJiYgc2VsZltzZWxmLnN0YXRlXSgpO1xuICAgICAgICAgICAgc2VsZi4kbW91c2VNb3ZlZCA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgaWYgKHVzZXJhZ2VudC5pc09sZElFICYmIGV2LmRvbUV2ZW50LnR5cGUgPT0gXCJkYmxjbGlja1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtvbkNhcHR1cmVFbmQoZXYuZG9tRXZlbnQpO30pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzZWxmLiRvbkNhcHR1cmVNb3VzZU1vdmUgPSBvbk1vdXNlTW92ZTtcbiAgICAgICAgc2VsZi5yZWxlYXNlTW91c2UgPSBldmVudC5jYXB0dXJlKHRoaXMuZWRpdG9yLmNvbnRhaW5lciwgb25Nb3VzZU1vdmUsIG9uQ2FwdHVyZUVuZCk7XG4gICAgICAgIHZhciB0aW1lcklkID0gc2V0SW50ZXJ2YWwob25DYXB0dXJlSW50ZXJ2YWwsIDIwKTtcbiAgICB9O1xuICAgIHRoaXMucmVsZWFzZU1vdXNlID0gbnVsbDtcbn0pLmNhbGwoTW91c2VIYW5kbGVyLnByb3RvdHlwZSk7XG5cbmNvbmZpZy5kZWZpbmVPcHRpb25zKE1vdXNlSGFuZGxlci5wcm90b3R5cGUsIFwibW91c2VIYW5kbGVyXCIsIHtcbiAgICBzY3JvbGxTcGVlZDoge2luaXRpYWxWYWx1ZTogMn0sXG4gICAgZHJhZ0RlbGF5OiB7aW5pdGlhbFZhbHVlOiAxNTB9LFxuICAgIGZvY3VzVGltZW91dDoge2luaXRpYWxWYWx1ZTogMH0sXG4gICAgZW5hYmxlRHJhZ0Ryb3A6IHtpbml0aWFsVmFsdWU6IGZhbHNlfVxufSk7XG5cblxuZXhwb3J0cy5Nb3VzZUhhbmRsZXIgPSBNb3VzZUhhbmRsZXI7XG59KTtcbiIsImRlZmluZShmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgcXVpY2tTZWFyY2ggPSBmdW5jdGlvbih0cmVlLCBzdHIpIHtcbiAgICB2YXIgbm9kZSA9IHRyZWUuc2VsZWN0aW9uLmdldEN1cnNvcigpXG4gICAgdmFyIHNpYmxpbmdzID0gdHJlZS5wcm92aWRlci5nZXRDaGlsZHJlbihub2RlLnBhcmVudCk7XG4gICAgXG4gICAgaWYgKCFzaWJsaW5ncyB8fCBzaWJsaW5ncy5sZW5ndGggPT0gMSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIHZhciBpbmRleCA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSk7XG4gICAgdmFyIG5ld05vZGVcbiAgICBmb3IgKHZhciBpID0gaW5kZXggKyAxOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbm9kZSA9IHNpYmxpbmdzW2ldO1xuICAgICAgICB2YXIgbGFiZWwgPSBub2RlLmxhYmVsIHx8IG5vZGUubmFtZSB8fCBcIlwiO1xuICAgICAgICBpZiAobGFiZWxbMF0gPT0gc3RyKSB7XG4gICAgICAgICAgICBuZXdOb2RlID0gbm9kZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghbmV3Tm9kZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGV4OyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUgPSBzaWJsaW5nc1tpXTtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IG5vZGUubGFiZWwgfHwgbm9kZS5uYW1lIHx8IFwiXCI7XG4gICAgICAgICAgICBpZiAobGFiZWxbMF0gPT0gc3RyKSB7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKG5ld05vZGUpIHtcbiAgICAgICAgdHJlZS5zZWxlY3Rpb24uc2VsZWN0Tm9kZShuZXdOb2RlKTtcbiAgICAgICAgdHJlZS5yZW5kZXJlci5zY3JvbGxDYXJldEludG9WaWV3KG5ld05vZGUsIDAuNSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBxdWlja1NlYXJjaDtcbn0pO1xuIiwiLyoqXG4gKiBUaGUgbWFpbiBjbGFzcyByZXF1aXJlZCB0byBzZXQgdXAgYSBUcmVlIGluc3RhbmNlIGluIHRoZSBicm93c2VyLlxuICpcbiAqIEBjbGFzcyBUcmVlXG4gKiovXG5cbmRlZmluZShmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgb29wID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvb29wXCIpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL2V2ZW50X2VtaXR0ZXJcIikuRXZlbnRFbWl0dGVyO1xuXG5cbnZhciBzY3JvbGxhYmxlID0ge307XG5cbihmdW5jdGlvbigpIHtcbiAgICBvb3AuaW1wbGVtZW50KHRoaXMsIEV2ZW50RW1pdHRlcik7XG5cbiAgICB0aGlzLiRzY3JvbGxUb3AgPSAwO1xuICAgIHRoaXMuZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLiRzY3JvbGxUb3A7IH07XG4gICAgdGhpcy5zZXRTY3JvbGxUb3AgPSBmdW5jdGlvbihzY3JvbGxUb3ApIHtcbiAgICAgICAgc2Nyb2xsVG9wID0gTWF0aC5yb3VuZChzY3JvbGxUb3ApO1xuICAgICAgICBpZiAodGhpcy4kc2Nyb2xsVG9wID09PSBzY3JvbGxUb3AgfHwgaXNOYU4oc2Nyb2xsVG9wKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLiRzY3JvbGxUb3AgPSBzY3JvbGxUb3A7XG4gICAgICAgIHRoaXMuX3NpZ25hbChcImNoYW5nZVNjcm9sbFRvcFwiLCBzY3JvbGxUb3ApO1xuICAgIH07XG5cbiAgICB0aGlzLiRzY3JvbGxMZWZ0ID0gMDtcbiAgICB0aGlzLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuJHNjcm9sbExlZnQ7IH07XG4gICAgdGhpcy5zZXRTY3JvbGxMZWZ0ID0gZnVuY3Rpb24oc2Nyb2xsTGVmdCkge1xuICAgICAgICBzY3JvbGxMZWZ0ID0gTWF0aC5yb3VuZChzY3JvbGxMZWZ0KTtcbiAgICAgICAgaWYgKHRoaXMuJHNjcm9sbExlZnQgPT09IHNjcm9sbExlZnQgfHwgaXNOYU4oc2Nyb2xsTGVmdCkpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy4kc2Nyb2xsTGVmdCA9IHNjcm9sbExlZnQ7XG4gICAgICAgIHRoaXMuX3NpZ25hbChcImNoYW5nZVNjcm9sbExlZnRcIiwgc2Nyb2xsTGVmdCk7XG4gICAgfTtcblxuICAgIFxufSkuY2FsbChzY3JvbGxhYmxlKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzY3JvbGxhYmxlO1xufSk7XG4iLCIvKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBEaXN0cmlidXRlZCB1bmRlciB0aGUgQlNEIGxpY2Vuc2U6XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLCBBamF4Lm9yZyBCLlYuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICogICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiAgICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gKiAgICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogICAgICogTmVpdGhlciB0aGUgbmFtZSBvZiBBamF4Lm9yZyBCLlYuIG5vciB0aGVcbiAqICAgICAgIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzXG4gKiAgICAgICBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqIFxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EXG4gKiBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRVxuICogRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgQUpBWC5PUkcgQi5WLiBCRSBMSUFCTEUgRk9SIEFOWVxuICogRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAqIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbiAqIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORFxuICogT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAqIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTXG4gKiBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKiAqL1xuXG5kZWZpbmUoZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIG9vcCA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL29vcFwiKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9ldmVudF9lbWl0dGVyXCIpLkV2ZW50RW1pdHRlcjtcblxudmFyIFNlbGVjdGlvbiA9IGZ1bmN0aW9uKHByb3ZpZGVyKSB7XG4gICAgdGhpcy5wcm92aWRlciA9IHByb3ZpZGVyO1xuICAgIGlmICh0aGlzLnByb3ZpZGVyICYmICF0aGlzLnByb3ZpZGVyLnNlbGVjdGVkSXRlbXMpXG4gICAgICAgIHRoaXMucHJvdmlkZXIuc2VsZWN0ZWRJdGVtcyA9IFtdO1xuICAgIHRoaXMucHJvdmlkZXIub24oXCJyZW1vdmVcIiwgdGhpcy51bnNlbGVjdFJlbW92ZWQgPSB0aGlzLnVuc2VsZWN0UmVtb3ZlZC5iaW5kKHRoaXMpKTtcbn07XG5cbihmdW5jdGlvbigpIHtcblxuICAgIG9vcC5pbXBsZW1lbnQodGhpcywgRXZlbnRFbWl0dGVyKTtcbiAgICBcbiAgICB0aGlzLiR3cmFwQXJvdW5kID0gZmFsc2U7XG4gICAgdGhpcy5nZXRSYW5nZSA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgICBcbiAgICB0aGlzLnNlbGVjdEFsbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsID0gdGhpcy5wcm92aWRlci5zZWxlY3RlZEl0ZW1zO1xuICAgICAgICB0aGlzLmV4cGFuZFNlbGVjdGlvbihzZWxbMF0sIHNlbFtzZWwubGVuZ3RoIC0xXSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zaWduYWwoXCJjaGFuZ2VcIik7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLm1vdmVTZWxlY3Rpb24gPSBmdW5jdGlvbihkaXIsIHNlbGVjdCwgYWRkKSB7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIHZhciBjdXJzb3IgPSB0aGlzLmdldEN1cnNvcigpO1xuICAgICAgICB2YXIgYW5jaG9yID0gdGhpcy5nZXRBbmNob3IoKTtcbiAgICAgICAgdmFyIGkgPSBwcm92aWRlci5nZXRJbmRleEZvck5vZGUoY3Vyc29yKTtcbiAgICAgICAgaWYgKCFhZGQpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXIodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYWRkICYmICFzZWxlY3QpIHtcbiAgICAgICAgICAgIHRoaXMudW5zZWxlY3ROb2RlKGN1cnNvcik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBtaW4gPSBwcm92aWRlci5nZXRNaW5JbmRleCgpO1xuICAgICAgICB2YXIgbWF4ID0gcHJvdmlkZXIuZ2V0TWF4SW5kZXgoKTtcbiAgICAgICAgdmFyIHdyYXBwZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIG5ld0kgPSBpO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBuZXdJICs9IGRpcjtcbiAgICAgICAgICAgIGlmIChuZXdJIDwgbWluKSB7XG4gICAgICAgICAgICAgICAgbmV3SSA9IHRoaXMuJHdyYXBBcm91bmQgPyBtYXggOiBtaW47XG4gICAgICAgICAgICAgICAgd3JhcHBlZCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5ld0kgPiBtYXgpIHtcbiAgICAgICAgICAgICAgICBuZXdJID0gdGhpcy4kd3JhcEFyb3VuZCA/IG1pbiA6IG1heDtcbiAgICAgICAgICAgICAgICB3cmFwcGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuZXdOb2RlID0gcHJvdmlkZXIuZ2V0Tm9kZUF0SW5kZXgobmV3SSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSB3aGlsZSAoIXdyYXBwZWQgJiYgbmV3Tm9kZSAmJiAhcHJvdmlkZXIuaXNTZWxlY3RhYmxlKG5ld05vZGUpKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghbmV3Tm9kZSB8fCAhcHJvdmlkZXIuaXNTZWxlY3RhYmxlKG5ld05vZGUpKVxuICAgICAgICAgICAgbmV3Tm9kZSA9IGN1cnNvcjtcbiAgICAgICAgICAgIFxuICAgICAgICBpZiAoc2VsZWN0KSB7XG4gICAgICAgICAgICB0aGlzLmV4cGFuZFNlbGVjdGlvbihuZXdOb2RlLCBhbmNob3IsIGFkZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdE5vZGUobmV3Tm9kZSwgYWRkKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXRDdXJzb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbCA9IHRoaXMucHJvdmlkZXIuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgcmV0dXJuIHNlbC5jdXJzb3IgfHwgc2VsW3NlbC5sZW5ndGggLSAxXTtcbiAgICB9O1xuICAgIHRoaXMuZ2V0QW5jaG9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnByb3ZpZGVyLnNlbGVjdGVkSXRlbXM7XG4gICAgICAgIHJldHVybiBzZWwuYW5jaG9yIHx8IHNlbC5jdXJzb3IgfHwgc2VsWzBdO1xuICAgIH07XG4gICAgdGhpcy5nZXRTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnByb3ZpZGVyLnNlbGVjdGVkSXRlbXM7XG4gICAgICAgIHJldHVybiBzZWwuc2xpY2UoKTtcbiAgICB9O1xuICAgIHRoaXMuZ2V0VmlzaWJsZVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0gdGhpcy5wcm92aWRlcjtcbiAgICAgICAgdmFyIHNlbCA9IHByb3ZpZGVyLnNlbGVjdGVkSXRlbXM7XG4gICAgICAgIHJldHVybiBzZWwuZmlsdGVyKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm92aWRlci5pc1Zpc2libGUobm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5pc0VtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnByb3ZpZGVyLnNlbGVjdGVkSXRlbXM7XG4gICAgICAgIHJldHVybiBzZWwubGVuZ3RoID09PSAwO1xuICAgIH07XG4gICAgdGhpcy5pc011bHRpUm93ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnByb3ZpZGVyLnNlbGVjdGVkSXRlbXM7XG4gICAgICAgIHJldHVybiBzZWwubGVuZ3RoID4gMTtcbiAgICB9O1xuICAgIHRoaXMudG9nZ2xlU2VsZWN0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICB2YXIgc2VsID0gcHJvdmlkZXIuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgdmFyIGkgPSBzZWwuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGkgIT0gLTEpXG4gICAgICAgICAgICBzZWwuc3BsaWNlKGksIDEpO1xuICAgICAgICBwcm92aWRlci5zZXRTZWxlY3RlZChub2RlLCAhcHJvdmlkZXIuaXNTZWxlY3RlZChub2RlKSk7XG4gICAgICAgIGlmIChwcm92aWRlci5pc1NlbGVjdGVkKG5vZGUpKSB7XG4gICAgICAgICAgICBzZWwucHVzaChub2RlKTtcbiAgICAgICAgICAgIHNlbC5hbmNob3IgPSBzZWwuY3Vyc29yID0gbm9kZTtcbiAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICBzZWwuYW5jaG9yID0gc2VsLmN1cnNvciA9IHNlbFtzZWwubGVuZ3RoIC0gMV07XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zaWduYWwoXCJjaGFuZ2VcIik7XG4gICAgfTtcbiAgICB0aGlzLnNlbGVjdE5vZGUgPSBmdW5jdGlvbihub2RlLCBhZGQsIHNpbGVudCkge1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICB2YXIgc2VsID0gcHJvdmlkZXIuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgaWYgKCFwcm92aWRlci5pc1NlbGVjdGFibGUobm9kZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICghYWRkKVxuICAgICAgICAgICAgdGhpcy5jbGVhcih0cnVlKTtcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBpID0gc2VsLmluZGV4T2Yobm9kZSk7XG4gICAgICAgICAgICBpZiAoaSAhPSAtMSlcbiAgICAgICAgICAgICAgICBzZWwuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcHJvdmlkZXIuc2V0U2VsZWN0ZWQobm9kZSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAocHJvdmlkZXIuaXNTZWxlY3RlZChub2RlKSlcbiAgICAgICAgICAgICAgICBzZWwucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBzZWwuYW5jaG9yID0gc2VsLmN1cnNvciA9IG5vZGU7XG4gICAgICAgIHRoaXMuX3NpZ25hbChcImNoYW5nZVwiKTtcbiAgICB9O1xuICAgIHRoaXMuYWRkID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZSwgdHJ1ZSk7XG4gICAgfTtcbiAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvdmlkZXIuaXNTZWxlY3RlZChub2RlKSlcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlU2VsZWN0KG5vZGUpO1xuICAgIH07XG4gICAgdGhpcy5jbGVhciA9XG4gICAgdGhpcy5jbGVhclNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNpbGVudCkge1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICB2YXIgc2VsID0gcHJvdmlkZXIuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgc2VsLmZvckVhY2goZnVuY3Rpb24obm9kZSkgeyBwcm92aWRlci5zZXRTZWxlY3RlZChub2RlLCBmYWxzZSk7IH0pO1xuICAgICAgICBzZWwuc3BsaWNlKDAsIHNlbC5sZW5ndGgpO1xuICAgICAgICBzZWwuYW5jaG9yID0gc2VsLmN1cnNvcjtcbiAgICAgICAgXG4gICAgICAgIHNpbGVudCB8fCB0aGlzLl9zaWduYWwoXCJjaGFuZ2VcIik7XG4gICAgfTtcbiAgICB0aGlzLnVuc2VsZWN0Tm9kZSA9IGZ1bmN0aW9uKG5vZGUsIHNpbGVudCkge1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICB2YXIgc2VsID0gcHJvdmlkZXIuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgdmFyIGkgPSBzZWwuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGkgIT0gLTEpIHtcbiAgICAgICAgICAgIHNlbC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBwcm92aWRlci5zZXRTZWxlY3RlZChub2RlLCBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoc2VsLmFuY2hvciA9PSBub2RlKVxuICAgICAgICAgICAgICAgIHNlbC5hbmNob3IgPSBzZWxbaS0xXSB8fCBzZWxbaV07XG4gICAgICAgICAgICBpZiAoc2VsLmN1cnNvciA9PSBub2RlKVxuICAgICAgICAgICAgICAgIHNlbC5jdXJzb3IgPSBzZWxbaV0gfHwgc2VsW2ktMV07ICAgICAgICBcbiAgICAgICAgICAgIHNpbGVudCB8fCB0aGlzLl9zaWduYWwoXCJjaGFuZ2VcIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc2V0U2VsZWN0aW9uID0gZnVuY3Rpb24obm9kZXMpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZXMpKSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyKHRydWUpO1xuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKG5vZGUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKG5vZGVzLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfTtcbiAgICB0aGlzLmV4cGFuZFNlbGVjdGlvbiA9IGZ1bmN0aW9uKGN1cnNvciwgYW5jaG9yLCBhZGRpdGl2ZSkge1xuICAgICAgICBhbmNob3IgPSBhbmNob3IgfHwgdGhpcy5nZXRBbmNob3IoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghYWRkaXRpdmUpXG4gICAgICAgICAgICB0aGlzLmNsZWFyKHRydWUpO1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICB2YXIgc2VsID0gcHJvdmlkZXIuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgXG4gICAgICAgIHZhciBlbmQgPSBwcm92aWRlci5nZXRJbmRleEZvck5vZGUoY3Vyc29yKTtcbiAgICAgICAgdmFyIHN0YXJ0ID0gcHJvdmlkZXIuZ2V0SW5kZXhGb3JOb2RlKGFuY2hvciB8fCBjdXJzb3IpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPD0gZW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHByb3ZpZGVyLmdldE5vZGVBdEluZGV4KGkpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHNlbC5pbmRleE9mKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPSAtMSlcbiAgICAgICAgICAgICAgICAgICAgc2VsLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3ZpZGVyLmlzU2VsZWN0YWJsZShub2RlKSlcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXIuc2V0U2VsZWN0ZWQobm9kZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2VsLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPj0gZW5kOyBpLS0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHByb3ZpZGVyLmdldE5vZGVBdEluZGV4KGkpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHNlbC5pbmRleE9mKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPSAtMSlcbiAgICAgICAgICAgICAgICAgICAgc2VsLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3ZpZGVyLmlzU2VsZWN0YWJsZShub2RlKSlcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXIuc2V0U2VsZWN0ZWQobm9kZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2VsLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHNlbC5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIHNlbC5hbmNob3IgPSBhbmNob3I7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zaWduYWwoXCJjaGFuZ2VcIik7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnVuc2VsZWN0UmVtb3ZlZCA9IGZ1bmN0aW9uKHRvUmVtb3ZlKSB7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLmdldFNlbGVjdGVkTm9kZXMoKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0gdGhpcy5wcm92aWRlcjtcbiAgICAgICAgdmFyIGNoYW5nZWQsIGN1cnNvciA9IHRoaXMuZ2V0Q3Vyc29yKCk7XG4gICAgICAgIHNlbC5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgIGlmIChwcm92aWRlci5pc0FuY2VzdG9yKHRvUmVtb3ZlLCBuKSkge1xuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMudW5zZWxlY3ROb2RlKG4sIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYgKGNoYW5nZWQgJiYgIXByb3ZpZGVyLmlzU2VsZWN0ZWQoY3Vyc29yKSkge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRvUmVtb3ZlLnBhcmVudDtcbiAgICAgICAgICAgIHZhciBjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAmJiBwcm92aWRlci5pc09wZW4ocGFyZW50KSkge1xuICAgICAgICAgICAgICAgIGNoID0gcHJvdmlkZXIuZ2V0Q2hpbGRyZW4ocGFyZW50KTtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGNoLmluZGV4T2YodG9SZW1vdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpID0gdG9SZW1vdmUuaW5kZXg7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSBjaFtpXSB8fCBjaFtpIC0gMV0gfHwgcGFyZW50O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlID0gY2hbaSArIDFdIHx8IGNoW2kgLSAxXSB8fCBwYXJlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSA9PSBwcm92aWRlci5yb290KVxuICAgICAgICAgICAgICAgIG5vZGUgPSBjaFswXSB8fCBub2RlO1xuICAgICAgICAgICAgaWYgKG5vZGUpXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKG5vZGUsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fc2lnbmFsKFwiY2hhbmdlXCIpO1xuICAgICAgICB9XG4gICAgfTtcbn0pLmNhbGwoU2VsZWN0aW9uLnByb3RvdHlwZSk7XG5cbmV4cG9ydHMuU2VsZWN0aW9uID0gU2VsZWN0aW9uO1xufSk7XG4iLCIvKipcbiAqIFRoZSBtYWluIGNsYXNzIHJlcXVpcmVkIHRvIHNldCB1cCBhIFRyZWUgaW5zdGFuY2UgaW4gdGhlIGJyb3dzZXIuXG4gKlxuICogQGNsYXNzIFRyZWVcbiAqKi9cblxuZGVmaW5lKGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIHZhciBVbmRvTWFuYWdlciA9IHJlcXVpcmUoXCIuL3VuZG9tYW5hZ2VyXCIpLlVuZG9NYW5hZ2VyO1xudmFyIFJlbmRlcmVyID0gcmVxdWlyZShcIi4vdmlydHVhbF9yZW5kZXJlclwiKS5WaXJ0dWFsUmVuZGVyZXI7XG4vLyB2YXIgTXVsdGlTZWxlY3QgPSByZXF1aXJlKFwiLi9tdWx0aV9zZWxlY3RcIikuTXVsdGlTZWxlY3Q7XG5cbmV4cG9ydHMuY29uZmlnID0gcmVxdWlyZShcIi4vY29uZmlnXCIpO1xuXG52YXIgb29wID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvb29wXCIpO1xudmFyIGxhbmcgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2xpYi9sYW5nXCIpO1xudmFyIHVzZXJhZ2VudCA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL3VzZXJhZ2VudFwiKTtcbnZhciBUZXh0SW5wdXQgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2tleWJvYXJkL3RleHRpbnB1dFwiKS5UZXh0SW5wdXQ7XG52YXIgTW91c2VIYW5kbGVyID0gcmVxdWlyZShcIi4vbW91c2UvbW91c2VfaGFuZGxlclwiKS5Nb3VzZUhhbmRsZXI7XG52YXIgS2V5QmluZGluZyA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMva2V5Ym9hcmQva2V5YmluZGluZ1wiKS5LZXlCaW5kaW5nO1xudmFyIFNlbGVjdGlvbiA9IHJlcXVpcmUoXCIuL3NlbGVjdGlvblwiKS5TZWxlY3Rpb247XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZXZlbnRfZW1pdHRlclwiKS5FdmVudEVtaXR0ZXI7XG52YXIgQ29tbWFuZE1hbmFnZXIgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL2NvbW1hbmRzL2NvbW1hbmRfbWFuYWdlclwiKS5Db21tYW5kTWFuYWdlcjtcbnZhciBkZWZhdWx0Q29tbWFuZHMgPSByZXF1aXJlKFwiLi9jb21tYW5kcy9kZWZhdWx0X2NvbW1hbmRzXCIpLmNvbW1hbmRzO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoXCIuL2NvbmZpZ1wiKTtcblxudmFyIHF1aWNrU2VhcmNoID0gcmVxdWlyZShcIi4vcXVpY2tzZWFyY2hcIik7XG4vKipcbiAqIEBjbGFzcyBUcmVlXG4gKiovXG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgVHJlZWAgb2JqZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgVGhlIGh0bWwgZWxlbWVudCB0aGUgVHJlZSB0YWJsZSByZW5kZXJzIGluLlxuICpcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqKi9cbnZhciBUcmVlID0gZnVuY3Rpb24oZWxlbWVudCwgY2VsbFdpZHRoLCBjZWxsSGVpZ2h0KSB7XG4gICAgdGhpcy4kdG9EZXN0cm95ID0gW107XG4gICAgdGhpcy5jZWxsV2lkdGggID0gY2VsbFdpZHRoIHx8IDgwO1xuICAgIHRoaXMuY2VsbEhlaWdodCA9IGNlbGxIZWlnaHQgfHwgMjQ7XG4gICAgXG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcihlbGVtZW50LCB0aGlzLmNlbGxXaWR0aCwgdGhpcy5jZWxsSGVpZ2h0KTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHRoaXMucmVuZGVyZXIuY29udGFpbmVyO1xuXG4gICAgdGhpcy5jb21tYW5kcyA9IG5ldyBDb21tYW5kTWFuYWdlcih1c2VyYWdlbnQuaXNNYWMgPyBcIm1hY1wiIDogXCJ3aW5cIiwgZGVmYXVsdENvbW1hbmRzKTtcbiAgICB0aGlzLnRleHRJbnB1dCAgPSBuZXcgVGV4dElucHV0KHRoaXMuY29udGFpbmVyLCB0aGlzKTtcbiAgICB0aGlzLmtleUJpbmRpbmcgPSBuZXcgS2V5QmluZGluZyh0aGlzKTtcblxuICAgIC8vIFRPRE8gZGV0ZWN0IHRvdWNoIGV2ZW50IHN1cHBvcnRcbiAgICB0aGlzLiRtb3VzZUhhbmRsZXIgPSBuZXcgTW91c2VIYW5kbGVyKHRoaXMpO1xuXG4gICAgdGhpcy4kYmxvY2tTY3JvbGxpbmcgPSAwO1xuICAgIFxuICAgIHZhciBfc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5yZW5kZXJlci5vbihcImVkaXRcIiwgZnVuY3Rpb24oZSl7XG4gICAgICAgIF9zZWxmLl9lbWl0KFwiZWRpdFwiLCBlKTtcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLmNvbW1hbmRzLm9uKFwiZXhlY1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25DaGFuZ2VkID0gZmFsc2U7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbW1hbmRzLm9uKFwiYWZ0ZXJFeGVjXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb25DaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2Nyb2xsQ2FyZXRJbnRvVmlldygpO1xuICAgICAgICAgICAgdGhpcy5fc2lnbmFsKFwidXNlclNlbGVjdFwiKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5vbihcImNoYW5nZVNlbGVjdGlvblwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuJG1vdXNlSGFuZGxlci5pc01vdXNlUHJlc3NlZClcbiAgICAgICAgICAgIHRoaXMuX3NpZ25hbChcInVzZXJTZWxlY3RcIik7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICBcbiAgICBcbiAgICAvLyB2YXIgVG9vbHRpcCA9IHJlcXVpcmUoXCIuL3Rvb2x0aXBcIilcbiAgICAvLyBuZXcgVG9vbHRpcCh0aGlzKVxuXG4gICAgY29uZmlnLnJlc2V0T3B0aW9ucyh0aGlzKTtcbiAgICBjb25maWcuX2VtaXQoXCJUcmVlXCIsIHRoaXMpO1xufTtcblxuKGZ1bmN0aW9uKCl7XG5cbiAgICBvb3AuaW1wbGVtZW50KHRoaXMsIEV2ZW50RW1pdHRlcik7XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLnNldERhdGFQcm92aWRlciA9IGZ1bmN0aW9uKHByb3ZpZGVyKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3ZpZGVyKSB7XG4gICAgICAgICAgICB2YXIgb2xkUHJvdmlkZXIgPSB0aGlzLnByb3ZpZGVyO1xuICAgICAgICAgICAgLy8gdGhpcy5zZXNzaW9uLm9mZihcImNoYW5nZVNjcm9sbExlZnRcIiwgdGhpcy4kb25TY3JvbGxMZWZ0Q2hhbmdlKTtcblxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24ub2ZmKFwiY2hhbmdlQ2FyZXRcIiwgdGhpcy4kb25DYXJldENoYW5nZSk7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5vZmYoXCJjaGFuZ2VcIiwgdGhpcy4kb25TZWxlY3Rpb25DaGFuZ2UpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBvbGRQcm92aWRlci5vZmYoXCJjaGFuZ2VDbGFzc1wiLCB0aGlzLiRvbkNoYW5nZUNsYXNzKTtcbiAgICAgICAgICAgIG9sZFByb3ZpZGVyLm9mZihcImV4cGFuZFwiLCB0aGlzLiRyZWRyYXcpO1xuICAgICAgICAgICAgb2xkUHJvdmlkZXIub2ZmKFwiY29sbGFwc2VcIiwgdGhpcy4kcmVkcmF3KTtcbiAgICAgICAgICAgIG9sZFByb3ZpZGVyLm9mZihcImNoYW5nZVwiLCB0aGlzLiRyZWRyYXcpO1xuICAgICAgICAgICAgb2xkUHJvdmlkZXIub2ZmKFwiY2hhbmdlU2Nyb2xsVG9wXCIsIHRoaXMuJG9uU2Nyb2xsVG9wQ2hhbmdlKTtcbiAgICAgICAgICAgIG9sZFByb3ZpZGVyLm9mZihcImNoYW5nZVNjcm9sbExlZnRcIiwgdGhpcy4kb25TY3JvbGxMZWZ0Q2hhbmdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHJvdmlkZXIgPSBwcm92aWRlcjtcbiAgICAgICAgdGhpcy5tb2RlbCA9IHByb3ZpZGVyOyAvLyBUT0RPIHJlbW92ZSBwcm92aWRlciBpbiBmYXZvciBvZiBtb2RlbFxuICAgICAgICBpZiAocHJvdmlkZXIpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0RGF0YVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICBcbiAgICAgICAgICAgIC8vIHRoaXMuJG9uU2Nyb2xsTGVmdENoYW5nZSA9IHRoaXMub25TY3JvbGxMZWZ0Q2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAvLyB0aGlzLnNlc3Npb24ub24oXCJjaGFuZ2VTY3JvbGxMZWZ0XCIsIHRoaXMuJG9uU2Nyb2xsTGVmdENoYW5nZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghdGhpcy4kcmVkcmF3KSB0aGlzLiRyZWRyYXcgPSB0aGlzLnJlZHJhdy5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLm9uKFwiZXhwYW5kXCIsIHRoaXMuJHJlZHJhdyk7XG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLm9uKFwiY29sbGFwc2VcIiwgdGhpcy4kcmVkcmF3KTtcbiAgICAgICAgICAgIHRoaXMucHJvdmlkZXIub24oXCJjaGFuZ2VcIiwgdGhpcy4kcmVkcmF3KTtcbiAgICBcbiAgICAgICAgICAgIC8vIEZJWE1FXG4gICAgICAgICAgICBpZiAoIXRoaXMucHJvdmlkZXIuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm92aWRlci5zZWxlY3Rpb24gPSBuZXcgU2VsZWN0aW9uKHRoaXMucHJvdmlkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHRoaXMucHJvdmlkZXIuc2VsZWN0aW9uO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLiRvbkNhcmV0Q2hhbmdlID0gdGhpcy5vbkNhcmV0Q2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5vbihcImNoYW5nZUNhcmV0XCIsIHRoaXMuJG9uQ2FyZXRDaGFuZ2UpO1xuICAgICAgICAgICAgdGhpcy4kb25DaGFuZ2VDbGFzcyA9IHRoaXMuJG9uQ2hhbmdlQ2xhc3MuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMucHJvdmlkZXIub24oXCJjaGFuZ2VDbGFzc1wiLCB0aGlzLiRvbkNoYW5nZUNsYXNzKTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuJG9uU2VsZWN0aW9uQ2hhbmdlID0gdGhpcy5vblNlbGVjdGlvbkNoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24ub24oXCJjaGFuZ2VcIiwgdGhpcy4kb25TZWxlY3Rpb25DaGFuZ2UpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuJG9uU2Nyb2xsVG9wQ2hhbmdlID0gdGhpcy5vblNjcm9sbFRvcENoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci5vbihcImNoYW5nZVNjcm9sbFRvcFwiLCB0aGlzLiRvblNjcm9sbFRvcENoYW5nZSk7XG4gICAgXG4gICAgICAgICAgICB0aGlzLiRvblNjcm9sbExlZnRDaGFuZ2UgPSB0aGlzLm9uU2Nyb2xsTGVmdENoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci5vbihcImNoYW5nZVNjcm9sbExlZnRcIiwgdGhpcy4kb25TY3JvbGxMZWZ0Q2hhbmdlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy4kYmxvY2tTY3JvbGxpbmcgKz0gMTtcbiAgICAgICAgICAgIHRoaXMub25DYXJldENoYW5nZSgpO1xuICAgICAgICAgICAgdGhpcy4kYmxvY2tTY3JvbGxpbmcgLT0gMTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMub25TY3JvbGxUb3BDaGFuZ2UoKTtcbiAgICAgICAgICAgIHRoaXMub25TY3JvbGxMZWZ0Q2hhbmdlKCk7XG4gICAgICAgICAgICB0aGlzLm9uU2VsZWN0aW9uQ2hhbmdlKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZUZ1bGwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2VtaXQoXCJjaGFuZ2VEYXRhUHJvdmlkZXJcIiwge1xuICAgICAgICAgICAgcHJvdmlkZXI6IHByb3ZpZGVyLFxuICAgICAgICAgICAgb2xkUHJvdmlkZXI6IG9sZFByb3ZpZGVyXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5yZWRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci51cGRhdGVGdWxsKCk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmdldExlbmd0aCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiAwOyAvLyB0aGlzLnJlbmRlcmVyLiR0cmVlTGF5ZXIubGVuZ3RoO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXRMaW5lID0gZnVuY3Rpb24ocm93KXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxlbmd0aCA6IDAgLy8gdGhpcy5yZW5kZXJlci4kaG9ySGVhZGluZ0xheWVyLmxlbmd0aCAtIDFcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCBzZXNzaW9uIGJlaW5nIHVzZWQuXG4gICAgICoqL1xuICAgIHRoaXMuZ2V0RGF0YVByb3ZpZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3ZpZGVyO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnRseSBoaWdobGlnaHRlZCBzZWxlY3Rpb24uXG4gICAgICogQHJldHVybnMge1N0cmluZ30gVGhlIGhpZ2hsaWdodGVkIHNlbGVjdGlvblxuICAgICAqKi9cbiAgICB0aGlzLmdldFNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb247XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIHs6VmlydHVhbFJlbmRlcmVyLm9uUmVzaXplfVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2UgSWYgYHRydWVgLCByZWNvbXB1dGVzIHRoZSBzaXplLCBldmVuIGlmIHRoZSBoZWlnaHQgYW5kIHdpZHRoIGhhdmVuJ3QgY2hhbmdlZFxuICAgICAqXG4gICAgICpcbiAgICAgKiBAcmVsYXRlZCBWaXJ0dWFsUmVuZGVyZXIub25SZXNpemVcbiAgICAgKiovXG4gICAgdGhpcy5yZXNpemUgPSBmdW5jdGlvbihmb3JjZSkge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLm9uUmVzaXplKGZvcmNlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBCcmluZ3MgdGhlIGN1cnJlbnQgYHRleHRJbnB1dGAgaW50byBmb2N1cy5cbiAgICAgKiovXG4gICAgdGhpcy5mb2N1cyA9IGZ1bmN0aW9uKG9uY2UpIHtcbiAgICAgICAgLy8gU2FmYXJpIG5lZWRzIHRoZSB0aW1lb3V0XG4gICAgICAgIC8vIGlPUyBhbmQgRmlyZWZveCBuZWVkIGl0IGNhbGxlZCBpbW1lZGlhdGVseVxuICAgICAgICAvLyB0byBiZSBvbiB0aGUgc2F2ZSBzaWRlIHdlIGRvIGJvdGhcbiAgICAgICAgdmFyIF9zZWxmID0gdGhpcztcbiAgICAgICAgb25jZSB8fCBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3NlbGYudGV4dElucHV0LmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnRleHRJbnB1dC5mb2N1cygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgY3VycmVudCBgdGV4dElucHV0YCBpcyBpbiBmb2N1cy5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqKi9cbiAgICB0aGlzLmlzRm9jdXNlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXh0SW5wdXQuaXNGb2N1c2VkKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQmx1cnMgdGhlIGN1cnJlbnQgYHRleHRJbnB1dGAuXG4gICAgICoqL1xuICAgIHRoaXMuYmx1ciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRleHRJbnB1dC5ibHVyKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEVtaXR0ZWQgb25jZSB0aGUgZWRpdG9yIGNvbWVzIGludG8gZm9jdXMuXG4gICAgICogQGV2ZW50IGZvY3VzXG4gICAgICpcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLm9uRm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuJGlzRm9jdXNlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy4kaXNGb2N1c2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci52aXN1YWxpemVGb2N1cygpO1xuICAgICAgICB0aGlzLl9lbWl0KFwiZm9jdXNcIik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEVtaXR0ZWQgb25jZSB0aGUgZWRpdG9yIGhhcyBiZWVuIGJsdXJyZWQuXG4gICAgICogQGV2ZW50IGJsdXJcbiAgICAgKlxuICAgICAqXG4gICAgICoqL1xuICAgIHRoaXMub25CbHVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy4kaXNGb2N1c2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLiRpc0ZvY3VzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci52aXN1YWxpemVCbHVyKCk7XG4gICAgICAgIHRoaXMuX2VtaXQoXCJibHVyXCIpO1xuICAgIH07XG5cbiAgICB0aGlzLm9uU2Nyb2xsVG9wQ2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2Nyb2xsVG9ZKHRoaXMucHJvdmlkZXIuZ2V0U2Nyb2xsVG9wKCkpO1xuICAgIH07XG5cbiAgICB0aGlzLm9uU2Nyb2xsTGVmdENoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNjcm9sbFRvWCh0aGlzLnJlbmRlcmVyLmdldFNjcm9sbExlZnQoKSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLiRvbkNoYW5nZUNsYXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIudXBkYXRlQ2FyZXQoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRW1pdHRlZCB3aGVuIHRoZSBzZWxlY3Rpb24gY2hhbmdlcy5cbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLm9uQ2FyZXRDaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kb25DaGFuZ2VDbGFzcygpO1xuXG4gICAgICAgIGlmICghdGhpcy4kYmxvY2tTY3JvbGxpbmcpXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkNoYW5nZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuX2VtaXQoXCJjaGFuZ2VTZWxlY3Rpb25cIik7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLm9uU2VsZWN0aW9uQ2hhbmdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLm9uQ2FyZXRDaGFuZ2UoKTtcbiAgICB9O1xuXG4gICAgdGhpcy5leGVjQ29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQsIGFyZ3MpIHtcbiAgICAgICAgdGhpcy5jb21tYW5kcy5leGVjKGNvbW1hbmQsIHRoaXMsIGFyZ3MpO1xuICAgIH07XG5cbiAgICB0aGlzLm9uVGV4dElucHV0ID0gZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB0aGlzLmtleUJpbmRpbmcub25UZXh0SW5wdXQodGV4dCk7XG4gICAgfTtcblxuICAgIHRoaXMub25Db21tYW5kS2V5ID0gZnVuY3Rpb24oZSwgaGFzaElkLCBrZXlDb2RlKSB7XG4gICAgICAgIHRoaXMua2V5QmluZGluZy5vbkNvbW1hbmRLZXkoZSwgaGFzaElkLCBrZXlDb2RlKTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuaW5zZXJ0U3RpbmcgPSBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRGaWx0ZXIpIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRGaWx0ZXIoc3RyKTtcbiAgICAgICAgXG4gICAgICAgIHF1aWNrU2VhcmNoKHRoaXMsIHN0cik7ICAgIFxuICAgIH07XG4gICAgXG4gICAgdGhpcy5zZXRUaGVtZSA9IGZ1bmN0aW9uKHRoZW1lKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0VGhlbWUodGhlbWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCBpbmRpY2F0aW5nIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgcm93cy4gVGhlIG9iamVjdCBsb29rcyBsaWtlIHRoaXM6XG4gICAgICpcbiAgICAgKiBgYGBqc29uXG4gICAgICogeyBmaXJzdDogcmFuZ2Uuc3RhcnQucm93LCBsYXN0OiByYW5nZS5lbmQucm93IH1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICoqL1xuICAgIHRoaXMuJGdldFNlbGVjdGVkUm93cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvblJhbmdlKCkuY29sbGFwc2VSb3dzKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpcnN0OiByYW5nZS5zdGFydC5yb3csXG4gICAgICAgICAgICBsYXN0OiByYW5nZS5lbmQucm93XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIHs6VmlydHVhbFJlbmRlcmVyLmdldFZpc2libGVOb2Rlc31cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdG9sZXJhbmNlIGZyYWN0aW9uIG9mIHRoZSBub2RlIGFsbG93ZWQgdG8gYmUgaGlkZGVuIHdoaWxlIG5vZGUgc3RpbGwgY29uc2lkZXJlZCB2aXNpYmxlIChkZWZhdWx0IDEvMylcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICogQHJlbGF0ZWQgVmlydHVhbFJlbmRlcmVyLmdldFZpc2libGVOb2Rlc1xuICAgICAqKi9cbiAgICB0aGlzLmdldFZpc2libGVOb2RlcyA9IGZ1bmN0aW9uKHRvbGVyYW5jZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRWaXNpYmxlTm9kZXModG9sZXJhbmNlKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEluZGljYXRlcyBpZiB0aGUgbm9kZSBpcyBjdXJyZW50bHkgdmlzaWJsZSBvbiB0aGUgc2NyZWVuLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIFRoZSBub2RlIHRvIGNoZWNrXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRvbGVyYW5jZSBmcmFjdGlvbiBvZiB0aGUgbm9kZSBhbGxvd2VkIHRvIGJlIGhpZGRlbiB3aGlsZSBub2RlIHN0aWxsIGNvbnNpZGVyZWQgdmlzaWJsZSAoZGVmYXVsdCAxLzMpXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKiovXG4gICAgdGhpcy5pc05vZGVWaXNpYmxlID0gZnVuY3Rpb24obm9kZSwgdG9sZXJhbmNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmlzTm9kZVZpc2libGUobm9kZSwgdG9sZXJhbmNlKTtcbiAgICB9O1xuXG4gICAgdGhpcy4kbW92ZUJ5UGFnZSA9IGZ1bmN0aW9uKGRpciwgc2VsZWN0KSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IHRoaXMucmVuZGVyZXI7XG4gICAgICAgIHZhciBjb25maWcgPSB0aGlzLnJlbmRlcmVyLmxheWVyQ29uZmlnO1xuICAgICAgICBjb25maWcubGluZUhlaWdodCA9IHRoaXMucHJvdmlkZXIucm93SGVpZ2h0O1xuICAgICAgICB2YXIgcm93cyA9IGRpciAqIE1hdGguZmxvb3IoY29uZmlnLmhlaWdodCAvIGNvbmZpZy5saW5lSGVpZ2h0KTtcblxuICAgICAgICB0aGlzLiRibG9ja1Njcm9sbGluZysrO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbi5tb3ZlU2VsZWN0aW9uKHJvd3MsIHNlbGVjdCk7XG4gICAgICAgIHRoaXMuJGJsb2NrU2Nyb2xsaW5nLS07XG5cbiAgICAgICAgdmFyIHNjcm9sbFRvcCA9IHJlbmRlcmVyLnNjcm9sbFRvcDtcblxuICAgICAgICByZW5kZXJlci5zY3JvbGxCeSgwLCByb3dzICogY29uZmlnLmxpbmVIZWlnaHQpO1xuICAgICAgICBpZiAoc2VsZWN0ICE9IG51bGwpXG4gICAgICAgICAgICByZW5kZXJlci5zY3JvbGxDYXJldEludG9WaWV3KG51bGwsIDAuNSk7XG5cbiAgICAgICAgcmVuZGVyZXIuYW5pbWF0ZVNjcm9sbGluZyhzY3JvbGxUb3ApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3RzIHRoZSB0ZXh0IGZyb20gdGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIGRvY3VtZW50IHVudGlsIHdoZXJlIGEgXCJwYWdlIGRvd25cIiBmaW5pc2hlcy5cbiAgICAgKiovXG4gICAgdGhpcy5zZWxlY3RQYWdlRG93biA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRtb3ZlQnlQYWdlKDEsIHRydWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3RzIHRoZSB0ZXh0IGZyb20gdGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIGRvY3VtZW50IHVudGlsIHdoZXJlIGEgXCJwYWdlIHVwXCIgZmluaXNoZXMuXG4gICAgICoqL1xuICAgIHRoaXMuc2VsZWN0UGFnZVVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJG1vdmVCeVBhZ2UoLTEsIHRydWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaGlmdHMgdGhlIGRvY3VtZW50IHRvIHdoZXJldmVyIFwicGFnZSBkb3duXCIgaXMsIGFzIHdlbGwgYXMgbW92aW5nIHRoZSBjdXJzb3IgcG9zaXRpb24uXG4gICAgICoqL1xuICAgIHRoaXMuZ290b1BhZ2VEb3duID0gZnVuY3Rpb24oKSB7XG4gICAgICAgdGhpcy4kbW92ZUJ5UGFnZSgxLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNoaWZ0cyB0aGUgZG9jdW1lbnQgdG8gd2hlcmV2ZXIgXCJwYWdlIHVwXCIgaXMsIGFzIHdlbGwgYXMgbW92aW5nIHRoZSBjdXJzb3IgcG9zaXRpb24uXG4gICAgICoqL1xuICAgIHRoaXMuZ290b1BhZ2VVcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRtb3ZlQnlQYWdlKC0xLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNjcm9sbHMgdGhlIGRvY3VtZW50IHRvIHdoZXJldmVyIFwicGFnZSBkb3duXCIgaXMsIHdpdGhvdXQgY2hhbmdpbmcgdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgICAgKiovXG4gICAgdGhpcy5zY3JvbGxQYWdlRG93biA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRtb3ZlQnlQYWdlKDEpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTY3JvbGxzIHRoZSBkb2N1bWVudCB0byB3aGVyZXZlciBcInBhZ2UgdXBcIiBpcywgd2l0aG91dCBjaGFuZ2luZyB0aGUgY3Vyc29yIHBvc2l0aW9uLlxuICAgICAqKi9cbiAgICB0aGlzLnNjcm9sbFBhZ2VVcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRtb3ZlQnlQYWdlKC0xKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2Nyb2xscyB0byBhIHJvdy4gSWYgYGNlbnRlcmAgaXMgYHRydWVgLCBpdCBwdXRzIHRoZSByb3cgaW4gbWlkZGxlIG9mIHNjcmVlbiAob3IgYXR0ZW1wdHMgdG8pLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb3cgVGhlIHJvdyB0byBzY3JvbGwgdG9cbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGNlbnRlciBJZiBgdHJ1ZWBcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGFuaW1hdGUgSWYgYHRydWVgIGFuaW1hdGVzIHNjcm9sbGluZ1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaGFzIGZpbmlzaGVkXG4gICAgICpcbiAgICAgKlxuICAgICAqIEByZWxhdGVkIFZpcnR1YWxSZW5kZXJlci5zY3JvbGxUb1Jvd1xuICAgICAqKi9cbiAgICB0aGlzLnNjcm9sbFRvUm93ID0gZnVuY3Rpb24ocm93LCBjZW50ZXIsIGFuaW1hdGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2Nyb2xsVG9Sb3cocm93LCBjZW50ZXIsIGFuaW1hdGUsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQXR0ZW1wdHMgdG8gY2VudGVyIHRoZSBjdXJyZW50IHNlbGVjdGlvbiBvbiB0aGUgc2NyZWVuLlxuICAgICAqKi9cbiAgICB0aGlzLmNlbnRlclNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvblJhbmdlKCk7XG4gICAgICAgIHZhciBwb3MgPSB7XG4gICAgICAgICAgICByb3c6IE1hdGguZmxvb3IocmFuZ2Uuc3RhcnQucm93ICsgKHJhbmdlLmVuZC5yb3cgLSByYW5nZS5zdGFydC5yb3cpIC8gMiksXG4gICAgICAgICAgICBjb2x1bW46IE1hdGguZmxvb3IocmFuZ2Uuc3RhcnQuY29sdW1uICsgKHJhbmdlLmVuZC5jb2x1bW4gLSByYW5nZS5zdGFydC5jb2x1bW4pIC8gMilcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5hbGlnbkNhcmV0KHBvcywgMC41KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgQ2FyZXQuXG4gICAgICogQHJldHVybnMge09iamVjdH0gQW4gb2JqZWN0IHRoYXQgbG9va3Mgc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgICAgKlxuICAgICAqIGBgYGpzb25cbiAgICAgKiB7IHJvdzogY3VyclJvdywgY29sdW1uOiBjdXJyQ29sIH1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEByZWxhdGVkIFNlbGVjdGlvbi5nZXRDdXJzb3JcbiAgICAgKiovXG4gICAgdGhpcy5nZXRDdXJzb3JQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb24uZ2V0Q3Vyc29yKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNjcmVlbiBwb3NpdGlvbiBvZiB0aGUgQ2FyZXQuXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKiovXG4gICAgdGhpcy5nZXRDdXJzb3JQb3NpdGlvblNjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXNzaW9uLmRvY3VtZW50VG9TY3JlZW5Qb3NpdGlvbih0aGlzLmdldEN1cnNvclBvc2l0aW9uKCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiB7OlNlbGVjdGlvbi5nZXRSYW5nZX1cbiAgICAgKiBAcmV0dXJucyB7UmFuZ2V9XG4gICAgICogQHJlbGF0ZWQgU2VsZWN0aW9uLmdldFJhbmdlXG4gICAgICoqL1xuICAgIHRoaXMuZ2V0U2VsZWN0aW9uUmFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uLmdldFJhbmdlKCk7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0cyBhbGwgdGhlIHRleHQgaW4gZWRpdG9yLlxuICAgICAqIEByZWxhdGVkIFNlbGVjdGlvbi5zZWxlY3RBbGxcbiAgICAgKiovXG4gICAgdGhpcy5zZWxlY3RBbGwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kYmxvY2tTY3JvbGxpbmcgKz0gMTtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24uc2VsZWN0QWxsKCk7XG4gICAgICAgIHRoaXMuJGJsb2NrU2Nyb2xsaW5nIC09IDE7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIHs6U2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9ufVxuICAgICAqIEByZWxhdGVkIFNlbGVjdGlvbi5jbGVhclNlbGVjdGlvblxuICAgICAqKi9cbiAgICB0aGlzLmNsZWFyU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBDYXJldCB0byB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uLiBOb3RlIHRoYXQgdGhpcyBkb2VzIG5vdCBkZS1zZWxlY3QgdGhlIGN1cnJlbnQgc2VsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb3cgVGhlIG5ldyByb3cgbnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGNvbHVtbiBUaGUgbmV3IGNvbHVtbiBudW1iZXJcbiAgICAgKlxuICAgICAqXG4gICAgICogQHJlbGF0ZWQgU2VsZWN0aW9uLm1vdmVDYXJldFRvXG4gICAgICoqL1xuICAgIHRoaXMubW92ZUNhcmV0VG8gPSBmdW5jdGlvbihyb3csIGNvbHVtbikge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbi5tb3ZlQ2FyZXRUbyhyb3csIGNvbHVtbik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBDYXJldCB0byB0aGUgcG9zaXRpb24gaW5kaWNhdGVkIGJ5IGBwb3Mucm93YCBhbmQgYHBvcy5jb2x1bW5gLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3MgQW4gb2JqZWN0IHdpdGggdHdvIHByb3BlcnRpZXMsIHJvdyBhbmQgY29sdW1uXG4gICAgICpcbiAgICAgKlxuICAgICAqIEByZWxhdGVkIFNlbGVjdGlvbi5tb3ZlQ2FyZXRUb1Bvc2l0aW9uXG4gICAgICoqL1xuICAgIHRoaXMubW92ZUNhcmV0VG9Qb3NpdGlvbiA9IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbi5tb3ZlQ2FyZXRUb1Bvc2l0aW9uKHBvcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBDYXJldCB0byB0aGUgc3BlY2lmaWVkIHJvdyBudW1iZXIsIGFuZCBhbHNvIGludG8gdGhlIGluZGljaWF0ZWQgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb3dOdW1iZXIgVGhlIHJvdyBudW1iZXIgdG8gZ28gdG9cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29sdW1uIEEgY29sdW1uIG51bWJlciB0byBnbyB0b1xuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gYW5pbWF0ZSBJZiBgdHJ1ZWAgYW5pbWF0ZXMgc2NvbGxpbmdcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLmdvdG9Sb3cgPSBmdW5jdGlvbihyb3dOdW1iZXIsIGNvbHVtbiwgYW5pbWF0ZSkge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNvbHVtbiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgY29sdW1uID0gdGhpcy5zZWxlY3Rpb24uZ2V0Q3Vyc29yKCkuY29sdW1uO1xuXG4gICAgICAgIHRoaXMuJGJsb2NrU2Nyb2xsaW5nICs9IDE7XG4gICAgICAgIHRoaXMubW92ZUNhcmV0VG8ocm93TnVtYmVyIC0gMSwgY29sdW1uIHx8IDApO1xuICAgICAgICB0aGlzLiRibG9ja1Njcm9sbGluZyAtPSAxO1xuXG4gICAgICAgIGlmICghdGhpcy5pc1Jvd0Z1bGx5VmlzaWJsZShyb3dOdW1iZXIgLSAxKSlcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9Sb3cocm93TnVtYmVyIC0gMSwgdHJ1ZSwgYW5pbWF0ZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBDYXJldCB0byB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uLiBOb3RlIHRoYXQgdGhpcyBkb2VzIGRlLXNlbGVjdCB0aGUgY3VycmVudCBzZWxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvdyBUaGUgbmV3IHJvdyBudW1iZXJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29sdW1uIFRoZSBuZXcgY29sdW1uIG51bWJlclxuICAgICAqXG4gICAgICpcbiAgICAgKiBAcmVsYXRlZCBFZGl0b3IubW92ZUNhcmV0VG9cbiAgICAgKiovXG4gICAgdGhpcy5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24ocm93LCBjb2x1bW4pIHtcbiAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLm1vdmVDYXJldFRvKHJvdywgY29sdW1uKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTW92ZXMgdGhlIENhcmV0IHVwIGluIHRoZSBkb2N1bWVudCB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiB0aW1lcy4gTm90ZSB0aGF0IHRoaXMgZG9lcyBkZS1zZWxlY3QgdGhlIGN1cnJlbnQgc2VsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lcyBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIGNoYW5nZSBuYXZpZ2F0aW9uXG4gICAgICpcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLm5hdmlnYXRlVXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnByb3ZpZGVyLm5hdmlnYXRlKFwidXBcIik7XG4gICAgICAgIG5vZGUgJiYgdGhpcy5zZWxlY3Rpb24uc2V0U2VsZWN0aW9uKG5vZGUpO1xuICAgICAgICB0aGlzLiRzY3JvbGxJbnRvVmlldygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNb3ZlcyB0aGUgQ2FyZXQgZG93biBpbiB0aGUgZG9jdW1lbnQgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgdGltZXMuIE5vdGUgdGhhdCB0aGlzIGRvZXMgZGUtc2VsZWN0IHRoZSBjdXJyZW50IHNlbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdGltZXMgVGhlIG51bWJlciBvZiB0aW1lcyB0byBjaGFuZ2UgbmF2aWdhdGlvblxuICAgICAqXG4gICAgICpcbiAgICAgKiovXG4gICAgdGhpcy5uYXZpZ2F0ZURvd24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnByb3ZpZGVyLm5hdmlnYXRlKFwiZG93blwiKTtcbiAgICAgICAgbm9kZSAmJiB0aGlzLnNlbGVjdGlvbi5zZXRTZWxlY3Rpb24obm9kZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBDYXJldCBsZWZ0IGluIHRoZSBkb2N1bWVudCB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiB0aW1lcy4gTm90ZSB0aGF0IHRoaXMgZG9lcyBkZS1zZWxlY3QgdGhlIGN1cnJlbnQgc2VsZWN0aW9uLlxuICAgICAqKi9cbiAgICB0aGlzLm5hdmlnYXRlTGV2ZWxVcCA9IGZ1bmN0aW9uKHRvZ2dsZU5vZGUpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnNlbGVjdGlvbi5nZXRDdXJzb3IoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAvLyBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKHRvZ2dsZU5vZGUgJiYgdGhpcy5wcm92aWRlci5pc09wZW4obm9kZSkpIHtcbiAgICAgICAgICAgIHRoaXMucHJvdmlkZXIuY2xvc2Uobm9kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5zZXRTZWxlY3Rpb24obm9kZS5wYXJlbnQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBDYXJldCByaWdodCBpbiB0aGUgZG9jdW1lbnQgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgdGltZXMuIE5vdGUgdGhhdCB0aGlzIGRvZXMgZGUtc2VsZWN0IHRoZSBjdXJyZW50IHNlbGVjdGlvbi5cbiAgICAgKiovXG4gICAgdGhpcy5uYXZpZ2F0ZUxldmVsRG93biA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuc2VsZWN0aW9uLmdldEN1cnNvcigpO1xuICAgICAgICB2YXIgaGFzQ2hpbGRyZW4gPSB0aGlzLnByb3ZpZGVyLmhhc0NoaWxkcmVuKG5vZGUpO1xuICAgICAgICBpZiAoIWhhc0NoaWxkcmVuIHx8IHRoaXMucHJvdmlkZXIuaXNPcGVuKG5vZGUpKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uLm1vdmVTZWxlY3Rpb24oMSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnByb3ZpZGVyLm9wZW4obm9kZSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLm5hdmlnYXRlU3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldEZpcnN0Tm9kZSgpO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbi5zZXRTZWxlY3Rpb24obm9kZSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLm5hdmlnYXRlRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXRMYXN0Tm9kZSgpO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbi5zZXRTZWxlY3Rpb24obm9kZSk7XG4gICAgfTtcbiAgICB0aGlzLmdldEZpcnN0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnByb3ZpZGVyLmdldE1pbkluZGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3ZpZGVyLmdldE5vZGVBdEluZGV4KGluZGV4KTtcbiAgICB9O1xuICAgIHRoaXMuZ2V0TGFzdE5vZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5wcm92aWRlci5nZXRNYXhJbmRleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXROb2RlQXRJbmRleChpbmRleCk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLiRzY3JvbGxJbnRvVmlldyA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zY3JvbGxDYXJldEludG9WaWV3KCk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnNlbGVjdCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24uc2V0U2VsZWN0aW9uKG5vZGUpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5nZXRDb3B5VGV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfTtcbiAgICB0aGlzLm9uUGFzdGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH07XG5cbiAgICB0aGlzLnJldmVhbCA9IGZ1bmN0aW9uKG5vZGUsIGFuaW1hdGUpIHtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0gdGhpcy5wcm92aWRlcjtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50O1xuICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICBpZiAoIXByb3ZpZGVyLmlzT3BlbihwYXJlbnQpKVxuICAgICAgICAgICAgICAgIHByb3ZpZGVyLmV4cGFuZChwYXJlbnQpO1xuICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5zZWxlY3Qobm9kZSk7XG4gICAgICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLnJlbmRlcmVyLnNjcm9sbFRvcDtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zY3JvbGxDYXJldEludG9WaWV3KG5vZGUsIDAuNSk7XG4gICAgICAgIGlmIChhbmltYXRlICE9PSBmYWxzZSlcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuYW5pbWF0ZVNjcm9sbGluZyhzY3JvbGxUb3ApO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICogezpVbmRvTWFuYWdlci51bmRvfVxuICAgICAqIEByZWxhdGVkIFVuZG9NYW5hZ2VyLnVuZG9cbiAgICAgKiovXG4gICAgdGhpcy51bmRvID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGJsb2NrU2Nyb2xsaW5nKys7XG4gICAgICAgIHRoaXMuc2Vzc2lvbi5nZXRVbmRvTWFuYWdlcigpLnVuZG8oKTtcbiAgICAgICAgdGhpcy4kYmxvY2tTY3JvbGxpbmctLTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zY3JvbGxDYXJldEludG9WaWV3KG51bGwsIDAuNSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIHs6VW5kb01hbmFnZXIucmVkb31cbiAgICAgKiBAcmVsYXRlZCBVbmRvTWFuYWdlci5yZWRvXG4gICAgICoqL1xuICAgIHRoaXMucmVkbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRibG9ja1Njcm9sbGluZysrO1xuICAgICAgICB0aGlzLnNlc3Npb24uZ2V0VW5kb01hbmFnZXIoKS5yZWRvKCk7XG4gICAgICAgIHRoaXMuJGJsb2NrU2Nyb2xsaW5nLS07XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2Nyb2xsQ2FyZXRJbnRvVmlldyhudWxsLCAwLjUpO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVkaXRvciBpcyBzZXQgdG8gcmVhZC1vbmx5IG1vZGUuXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAgICoqL1xuICAgIHRoaXMuZ2V0UmVhZE9ubHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3B0aW9uKFwicmVhZE9ubHlcIik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQ2xlYW5zIHVwIHRoZSBlbnRpcmUgZWRpdG9yLlxuICAgICAqKi9cbiAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuX2VtaXQoXCJkZXN0cm95XCIsIHRoaXMpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy5zZXRIb3JIZWFkaW5nVmlzaWJsZSA9IGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRIb3JIZWFkaW5nVmlzaWJsZSh2YWx1ZSk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnNldFZlckhlYWRpbmdWaXNpYmxlID0gZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFZlckhlYWRpbmdWaXNpYmxlKHZhbHVlKTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuZW5hYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIlwiO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5zdHlsZS5vcGFjaXR5ID0gXCJcIjtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRkaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICAgdGhpcy5jb250YWluZXIuc3R5bGUub3BhY2l0eSA9IFwiMC45XCI7XG4gICAgICAgIGlmICh0aGlzLmlzRm9jdXNlZCgpKVxuICAgICAgICAgICAgdGhpcy5ibHVyKCk7XG4gICAgfTtcblxufSkuY2FsbChUcmVlLnByb3RvdHlwZSk7XG5cbmNvbmZpZy5kZWZpbmVPcHRpb25zKFRyZWUucHJvdG90eXBlLCBcIlRyZWVcIiwge1xuICAgIHRvZ2dsZToge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHRvZ2dsZSkge1xuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIGluaXRpYWxWYWx1ZTogZmFsc2VcbiAgICB9LFxuICAgIHJlYWRPbmx5OiB7XG4gICAgICAgIHNldDogZnVuY3Rpb24ocmVhZE9ubHkpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dElucHV0LnNldFJlYWRPbmx5KHJlYWRPbmx5KTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBmYWxzZVxuICAgIH0sXG5cbiAgICBhbmltYXRlZFNjcm9sbDogXCJyZW5kZXJlclwiLFxuICAgIG1heExpbmVzOiBcInJlbmRlcmVyXCIsXG4gICAgbWluTGluZXM6IFwicmVuZGVyZXJcIixcblxuICAgIHNjcm9sbFNwZWVkOiBcIiRtb3VzZUhhbmRsZXJcIixcbiAgICBlbmFibGVEcmFnRHJvcDogXCIkbW91c2VIYW5kbGVyXCJcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWU7XG59KTtcbiIsImRlZmluZShmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgb29wID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvb29wXCIpO1xudmFyIGRvbSA9IHJlcXVpcmUoXCJhY2UtY29kZS9zcmMvbGliL2RvbVwiKTtcbnZhciBjb25maWcgPSByZXF1aXJlKFwiLi9jb25maWdcIik7XG5cbnZhciBDZWxsTGF5ZXIgPSByZXF1aXJlKFwiLi9sYXllci9jZWxsc1wiKS5DZWxscztcbnZhciBNYXJrZXJMYXllciA9IHJlcXVpcmUoXCIuL2xheWVyL21hcmtlcnNcIikuU2VsZWN0aW9uO1xudmFyIEhlYWRlckxheWVyID0gcmVxdWlyZShcIi4vbGF5ZXIvaGVhZGluZ1wiKS5Db2x1bW5IZWFkZXI7XG5cbnZhciBTY3JvbGxCYXJIID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9zY3JvbGxiYXJcIikuU2Nyb2xsQmFySDtcbnZhciBTY3JvbGxCYXJWID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9zY3JvbGxiYXJcIikuU2Nyb2xsQmFyVjtcbnZhciBSZW5kZXJMb29wID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9yZW5kZXJsb29wXCIpLlJlbmRlckxvb3A7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImFjZS1jb2RlL3NyYy9saWIvZXZlbnRfZW1pdHRlclwiKS5FdmVudEVtaXR0ZXI7XG52YXIgcGl2b3RDc3MgPSByZXF1aXJlKFwiYWNlLWNvZGUvc3JjL3JlcXVpcmVqcy90ZXh0IS4vY3NzL3RyZWUuY3NzXCIpO1xuXG5kb20uaW1wb3J0Q3NzU3RyaW5nKHBpdm90Q3NzLCBcImFjZV90cmVlXCIpO1xuXG52YXIgZGVmYXVsdFRoZW1lID0gcmVxdWlyZShcIi4vY3NzL2xpZ2h0X3RoZW1lXCIpO1xuLyoqXG4gKiBUaGUgY2xhc3MgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgZHJhd2luZyBldmVyeXRoaW5nIHlvdSBzZWUgb24gdGhlIHNjcmVlbiFcbiAqIEBjbGFzcyBWaXJ0dWFsUmVuZGVyZXJcbiAqKi9cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IGBWaXJ0dWFsUmVuZGVyZXJgIHdpdGhpbiB0aGUgYGNvbnRhaW5lcmAgc3BlY2lmaWVkLCBhcHBseWluZyB0aGUgZ2l2ZW4gYHRoZW1lYC5cbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gY29udGFpbmVyIFRoZSByb290IGVsZW1lbnQgb2YgdGhlIGVkaXRvclxuICogQHBhcmFtIHtOdW1iZXJ9IGNlbGxXaWR0aCBUaGUgZGVmYXVsdCB3aWR0aCBvZiBhIGNlbGwgaW4gcGl4ZWxzIFxuICogQHBhcmFtIHtOdW1iZXJ9IGNlbGxIZWlnaHQgVGhlIGRlZmF1bHQgaGVpZ2h0IG9mIGEgY2VsbCBpbiBwaXhlbHMgXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiovXG5cbnZhciBWaXJ0dWFsUmVuZGVyZXIgPSBmdW5jdGlvbihjb250YWluZXIsIGNlbGxXaWR0aCwgY2VsbEhlaWdodCkge1xuICAgIHZhciBfc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb20uY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgIGRvbS5hZGRDc3NDbGFzcyh0aGlzLmNvbnRhaW5lciwgXCJhY2VfdHJlZVwiKTtcbiAgICBkb20uYWRkQ3NzQ2xhc3ModGhpcy5jb250YWluZXIsIFwiYWNlX3RyZWVcIik7XG4gICAgXG4gICAgLy8gdGhpcy5zZXRUaGVtZSh0aGlzLiR0aGVtZSk7XG4gICAgdGhpcy5zY3JvbGxlciA9IGRvbS5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuc2Nyb2xsZXIuY2xhc3NOYW1lID0gXCJhY2VfdHJlZV9zY3JvbGxlclwiO1xuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuc2Nyb2xsZXIpO1xuICAgIFxuICAgIHRoaXMuY2VsbHMgPSBkb20uY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmNlbGxzLmNsYXNzTmFtZSA9IFwiYWNlX3RyZWVfY2VsbHNcIjtcbiAgICB0aGlzLnNjcm9sbGVyLmFwcGVuZENoaWxkKHRoaXMuY2VsbHMpO1xuICAgIFxuICAgIHRoaXMuJGhlYWRpbmdMYXllciA9IG5ldyBIZWFkZXJMYXllcih0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgdGhpcy4kbWFya2VyTGF5ZXIgPSBuZXcgTWFya2VyTGF5ZXIodGhpcy5jZWxscywgdGhpcyk7XG4gICAgXG4gICAgdGhpcy4kY2VsbExheWVyID0gbmV3IENlbGxMYXllcih0aGlzLmNlbGxzKTtcbiAgICB0aGlzLmNhbnZhcyA9IHRoaXMuJGNlbGxMYXllci5lbGVtZW50O1xuXG4gICAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGhvcml6b250YWwgc2Nyb2xsYmFyc2Nyb2xsYmFyIGlzIHZpc2libGVcbiAgICB0aGlzLiRob3JpelNjcm9sbCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zY3JvbGxCYXJWID0gbmV3IFNjcm9sbEJhclYodGhpcy5jb250YWluZXIsIHRoaXMpO1xuICAgIHRoaXMuc2Nyb2xsQmFyVi5zZXRWaXNpYmxlKHRydWUpO1xuICAgIHRoaXMuc2Nyb2xsQmFyVi5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFfc2VsZi4kaW5TY3JvbGxBbmltYXRpb24pXG4gICAgICAgICAgICBfc2VsZi5zZXRTY3JvbGxUb3AoZS5kYXRhIC0gX3NlbGYuc2Nyb2xsTWFyZ2luLnRvcCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnNjcm9sbEJhckggPSBuZXcgU2Nyb2xsQmFySCh0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgdGhpcy5zY3JvbGxCYXJILmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIV9zZWxmLiRpblNjcm9sbEFuaW1hdGlvbilcbiAgICAgICAgICAgIF9zZWxmLnNldFNjcm9sbExlZnQoZS5kYXRhKTtcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XG4gICAgdGhpcy5zY3JvbGxMZWZ0ID0gMDtcblxuICAgIHRoaXMuY2FyZXRQb3MgPSB7XG4gICAgICAgIHJvdyA6IDAsXG4gICAgICAgIGNvbHVtbiA6IDBcbiAgICB9O1xuXG4gICAgdGhpcy4kc2l6ZSA9IHtcbiAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgc2Nyb2xsZXJIZWlnaHQ6IDAsXG4gICAgICAgIHNjcm9sbGVyV2lkdGg6IDAsXG4gICAgICAgIGhlYWRpbmdIZWlnaHQ6IDBcbiAgICB9O1xuXG4gICAgdGhpcy5sYXllckNvbmZpZyA9IHtcbiAgICAgICAgd2lkdGggOiAxLFxuICAgICAgICBwYWRkaW5nIDogMCxcbiAgICAgICAgZmlyc3RSb3cgOiAwLFxuICAgICAgICBmaXJzdFJvd1NjcmVlbjogMCxcbiAgICAgICAgbGFzdFJvdyA6IDAsXG4gICAgICAgIGxpbmVIZWlnaHQgOiAxLFxuICAgICAgICBjaGFyYWN0ZXJXaWR0aCA6IDEsXG4gICAgICAgIG1pbkhlaWdodCA6IDEsXG4gICAgICAgIG1heEhlaWdodCA6IDEsXG4gICAgICAgIG9mZnNldCA6IDAsXG4gICAgICAgIGhlaWdodCA6IDFcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuc2Nyb2xsTWFyZ2luID0ge1xuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIHY6IDAsXG4gICAgICAgIGg6IDBcbiAgICB9O1xuICAgIFxuICAgIHRoaXMuJHNjcm9sbEludG9WaWV3ID0gbnVsbDtcblxuICAgIHRoaXMuJGxvb3AgPSBuZXcgUmVuZGVyTG9vcChcbiAgICAgICAgdGhpcy4kcmVuZGVyQ2hhbmdlcy5iaW5kKHRoaXMpLFxuICAgICAgICB0aGlzLmNvbnRhaW5lci5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgKTtcbiAgICB0aGlzLiRsb29wLnNjaGVkdWxlKHRoaXMuQ0hBTkdFX0ZVTEwpO1xuICAgIHRoaXMuc2V0VGhlbWUoZGVmYXVsdFRoZW1lKTtcbiAgICBcbiAgICB0aGlzLiR3aW5kb3dGb2N1cyA9IHRoaXMuJHdpbmRvd0ZvY3VzLmJpbmQodGhpcyk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLiR3aW5kb3dGb2N1cyk7XG59O1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5DSEFOR0VfU0NST0xMICAgID0gMTtcbiAgICB0aGlzLkNIQU5HRV9DT0xVTU4gICAgPSAyO1xuICAgIHRoaXMuQ0hBTkdFX1JPVyAgICAgICA9IDQ7XG4gICAgdGhpcy5DSEFOR0VfQ0VMTFMgICAgID0gODtcbiAgICB0aGlzLkNIQU5HRV9TSVpFICAgICAgPSAxNjtcbiAgICB0aGlzLkNIQU5HRV9DTEFTUyAgICAgPSAzMjtcbiAgICB0aGlzLkNIQU5HRV9NQVJLRVIgICAgPSA2NDtcbiAgICB0aGlzLkNIQU5HRV9GVUxMICAgICAgPSAxMjg7XG5cbiAgICB0aGlzLkNIQU5HRV9IX1NDUk9MTCA9IDEwMjQ7XG5cbiAgICBvb3AuaW1wbGVtZW50KHRoaXMsIEV2ZW50RW1pdHRlcik7XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEFzc29jaWF0ZXMgdGhlIHJlbmRlcmVyIHdpdGggYW4gRGF0YVByb3ZpZGVyLlxuICAgICAqKi9cbiAgICB0aGlzLnNldERhdGFQcm92aWRlciA9IGZ1bmN0aW9uKHByb3ZpZGVyKSB7XG4gICAgICAgIHRoaXMucHJvdmlkZXIgPSBwcm92aWRlcjtcbiAgICAgICAgdGhpcy5tb2RlbCA9IHByb3ZpZGVyO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsTWFyZ2luLnRvcCAmJiBwcm92aWRlciAmJiBwcm92aWRlci5nZXRTY3JvbGxUb3AoKSA8PSAwKVxuICAgICAgICAgICAgcHJvdmlkZXIuc2V0U2Nyb2xsVG9wKC10aGlzLnNjcm9sbE1hcmdpbi50b3ApO1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsZXIuY2xhc3NOYW1lID0gXCJhY2VfdHJlZV9zY3JvbGxlclwiO1xuXG4gICAgICAgIHRoaXMuJGNlbGxMYXllci5zZXREYXRhUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgICB0aGlzLiRtYXJrZXJMYXllci5zZXREYXRhUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgICB0aGlzLiRoZWFkaW5nTGF5ZXIuc2V0RGF0YVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuJHNpemUuaGVhZGluZ0hlaWdodCA9IHByb3ZpZGVyICYmIHByb3ZpZGVyLmNvbHVtbnNcbiAgICAgICAgICAgID8gcHJvdmlkZXIuaGVhZGVySGVpZ2h0IHx8IHByb3ZpZGVyLnJvd0hlaWdodFxuICAgICAgICAgICAgOiAwO1xuICAgICAgICBcbiAgICAgICAgdGhpcy4kbG9vcC5zY2hlZHVsZSh0aGlzLkNIQU5HRV9GVUxMKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVHJpZ2dlcnMgYSBwYXJ0aWFsIHVwZGF0ZSBvZiB0aGUgdGV4dCwgZnJvbSB0aGUgcmFuZ2UgZ2l2ZW4gYnkgdGhlIHR3byBwYXJhbWV0ZXJzLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBmaXJzdFJvdyBUaGUgZmlyc3Qgcm93IHRvIHVwZGF0ZVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsYXN0Um93IFRoZSBsYXN0IHJvdyB0byB1cGRhdGVcbiAgICAgKlxuICAgICAqXG4gICAgICoqL1xuICAgIHRoaXMudXBkYXRlUm93cyA9IGZ1bmN0aW9uKGZpcnN0Um93LCBsYXN0Um93KSB7XG4gICAgICAgIGlmIChsYXN0Um93ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBsYXN0Um93ID0gSW5maW5pdHk7XG5cbiAgICAgICAgaWYgKCF0aGlzLiRjaGFuZ2VkTGluZXMpIHtcbiAgICAgICAgICAgIHRoaXMuJGNoYW5nZWRMaW5lcyA9IHtcbiAgICAgICAgICAgICAgICBmaXJzdFJvdzogZmlyc3RSb3csXG4gICAgICAgICAgICAgICAgbGFzdFJvdzogbGFzdFJvd1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiRjaGFuZ2VkTGluZXMuZmlyc3RSb3cgPiBmaXJzdFJvdylcbiAgICAgICAgICAgICAgICB0aGlzLiRjaGFuZ2VkTGluZXMuZmlyc3RSb3cgPSBmaXJzdFJvdztcblxuICAgICAgICAgICAgaWYgKHRoaXMuJGNoYW5nZWRMaW5lcy5sYXN0Um93IDwgbGFzdFJvdylcbiAgICAgICAgICAgICAgICB0aGlzLiRjaGFuZ2VkTGluZXMubGFzdFJvdyA9IGxhc3RSb3c7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy4kY2hhbmdlZExpbmVzLmZpcnN0Um93ID4gdGhpcy5sYXllckNvbmZpZy5sYXN0Um93IHx8XG4gICAgICAgICAgICB0aGlzLiRjaGFuZ2VkTGluZXMubGFzdFJvdyA8IHRoaXMubGF5ZXJDb25maWcuZmlyc3RSb3cpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuJGxvb3Auc2NoZWR1bGUodGhpcy5DSEFOR0VfUk9XKTtcbiAgICB9O1xuICAgIFxuICAgIHRoaXMudXBkYXRlQ2FyZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kbG9vcC5zY2hlZHVsZSh0aGlzLkNIQU5HRV9DTEFTUyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXJzIGEgZnVsbCB1cGRhdGUgb2YgdGhlIHRleHQsIGZvciBhbGwgdGhlIHJvd3MuXG4gICAgICoqL1xuICAgIHRoaXMudXBkYXRlQ2VsbHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kbG9vcC5zY2hlZHVsZSh0aGlzLkNIQU5HRV9DRUxMUyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXJzIGEgZnVsbCB1cGRhdGUgb2YgYWxsIHRoZSBsYXllcnMsIGZvciBhbGwgdGhlIHJvd3MuXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBmb3JjZSBJZiBgdHJ1ZWAsIGZvcmNlcyB0aGUgY2hhbmdlcyB0aHJvdWdoXG4gICAgICpcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLnVwZGF0ZUZ1bGwgPSBmdW5jdGlvbihmb3JjZSkge1xuICAgICAgICBpZiAoZm9yY2UpXG4gICAgICAgICAgICB0aGlzLiRyZW5kZXJDaGFuZ2VzKHRoaXMuQ0hBTkdFX0ZVTEwsIHRydWUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLiRsb29wLnNjaGVkdWxlKHRoaXMuQ0hBTkdFX0ZVTEwpO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy51cGRhdGVIb3Jpem9udGFsSGVhZGluZ3MgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLiRsb29wLnNjaGVkdWxlKHRoaXMuQ0hBTkdFX0NPTFVNTik7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnVwZGF0ZVZlcnRpY2FsSGVhZGluZ3MgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLiRsb29wLnNjaGVkdWxlKHRoaXMuQ0hBTkdFX1JPVyk7XG4gICAgfTtcblxuXG4gICAgdGhpcy4kY2hhbmdlcyA9IDA7XG4gICAgLyoqXG4gICAgKiBbVHJpZ2dlcnMgYSByZXNpemUgb2YgdGhlIGVkaXRvci5dezogI1ZpcnR1YWxSZW5kZXJlci5vblJlc2l6ZX1cbiAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2UgSWYgYHRydWVgLCByZWNvbXB1dGVzIHRoZSBzaXplLCBldmVuIGlmIHRoZSBoZWlnaHQgYW5kIHdpZHRoIGhhdmVuJ3QgY2hhbmdlZFxuICAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIFRoZSB3aWR0aCBvZiB0aGUgZWRpdG9yIGluIHBpeGVsc1xuICAgICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCBUaGUgaGllaGd0IG9mIHRoZSBlZGl0b3IsIGluIHBpeGVsc1xuICAgICpcbiAgICAqXG4gICAgKiovXG4gICAgdGhpcy5vblJlc2l6ZSA9IGZ1bmN0aW9uKGZvcmNlLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIGlmICh0aGlzLnJlc2l6aW5nID4gMilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgZWxzZSBpZiAodGhpcy5yZXNpemluZyA+IDApXG4gICAgICAgICAgICB0aGlzLnJlc2l6aW5nKys7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMucmVzaXppbmcgPSBmb3JjZSA/IDEgOiAwO1xuICAgICAgICAvLyBgfHwgZWwuc2Nyb2xsSGVpZ2h0YCBpcyByZXF1aXJlZCBmb3Igb3V0b3NpemluZyBlZGl0b3JzIG9uIGllXG4gICAgICAgIC8vIHdoZXJlIGVsZW1lbnRzIHdpdGggY2xpZW50SGVpZ2h0ID0gMCBhbHNvZSBoYXZlIGNsaWVudFdpZHRoID0gMFxuICAgICAgICB2YXIgZWwgPSB0aGlzLmNvbnRhaW5lcjtcbiAgICAgICAgaWYgKCFoZWlnaHQpXG4gICAgICAgICAgICBoZWlnaHQgPSBlbC5jbGllbnRIZWlnaHQgfHwgZWwuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICBpZiAoIXdpZHRoKVxuICAgICAgICAgICAgd2lkdGggPSBlbC5jbGllbnRXaWR0aCB8fCBlbC5zY3JvbGxXaWR0aDtcbiAgICAgICAgdmFyIGNoYW5nZXMgPSB0aGlzLiR1cGRhdGVDYWNoZWRTaXplKGZvcmNlLCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgICAgICBpZiAoIXRoaXMuJHNpemUuc2Nyb2xsZXJIZWlnaHQgfHwgKCF3aWR0aCAmJiAhaGVpZ2h0KSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2l6aW5nID0gMDtcblxuICAgICAgICBpZiAoZm9yY2UpXG4gICAgICAgICAgICB0aGlzLiRyZW5kZXJDaGFuZ2VzKGNoYW5nZXMsIHRydWUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLiRsb29wLnNjaGVkdWxlKGNoYW5nZXMgfCB0aGlzLiRjaGFuZ2VzKTtcblxuICAgICAgICBpZiAodGhpcy5yZXNpemluZylcbiAgICAgICAgICAgIHRoaXMucmVzaXppbmcgPSAwO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy4kd2luZG93Rm9jdXMgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLm9uUmVzaXplKCk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLiR1cGRhdGVDYWNoZWRTaXplID0gZnVuY3Rpb24oZm9yY2UsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGNoYW5nZXMgPSAwO1xuICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuJHNpemU7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIGlmIChwcm92aWRlcikge1xuICAgICAgICAgICAgdmFyIGhlYWRpbmdIZWlnaHQgPSBwcm92aWRlci5jb2x1bW5zXG4gICAgICAgICAgICAgICAgPyBwcm92aWRlci5oZWFkZXJIZWlnaHQgfHwgcHJvdmlkZXIucm93SGVpZ2h0XG4gICAgICAgICAgICAgICAgOiAwO1xuICAgICAgICAgICAgaWYgKGhlYWRpbmdIZWlnaHQgIT0gc2l6ZS5oZWFkaW5nSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgc2l6ZS5oZWFkaW5nSGVpZ2h0ID0gaGVhZGluZ0hlaWdodDtcbiAgICAgICAgICAgICAgICBjaGFuZ2VzIHw9IHRoaXMuQ0hBTkdFX1NJWkU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChoZWlnaHQgJiYgKGZvcmNlIHx8IHNpemUuaGVpZ2h0ICE9IGhlaWdodCkpIHtcbiAgICAgICAgICAgIHNpemUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgY2hhbmdlcyB8PSB0aGlzLkNIQU5HRV9TSVpFO1xuXG4gICAgICAgICAgICBzaXplLnNjcm9sbGVySGVpZ2h0ID0gc2l6ZS5oZWlnaHQ7XG4gICAgICAgICAgICBpZiAodGhpcy4kaG9yaXpTY3JvbGwpXG4gICAgICAgICAgICAgICAgc2l6ZS5zY3JvbGxlckhlaWdodCAtPSB0aGlzLnNjcm9sbEJhckguZ2V0SGVpZ2h0KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vaWYgKHRoaXMuaGVhZGluZykge1xuICAgICAgICAgICAgICAgIHNpemUuc2Nyb2xsZXJIZWlnaHQgLT0gc2l6ZS5oZWFkaW5nSGVpZ2h0O1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLiRoZWFkaW5nTGF5ZXIuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZXIuc3R5bGUudG9wID0gXG4gICAgICAgICAgICB0aGlzLnNjcm9sbEJhclYuZWxlbWVudC5zdHlsZS50b3AgPSBzaXplLmhlYWRpbmdIZWlnaHQgKyBcInB4XCI7XG4gICAgICAgICAgICAvLyB0aGlzLnNjcm9sbEJhclYuc2V0SGVpZ2h0KHNpemUuc2Nyb2xsZXJIZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxCYXJWLmVsZW1lbnQuc3R5bGUuYm90dG9tID0gdGhpcy5zY3JvbGxCYXJILmdldEhlaWdodCgpICsgXCJweFwiO1xuXG4gICAgICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIuc2V0U2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvdmlkZXIuc2V0U2Nyb2xsVG9wKHRoaXMuZ2V0U2Nyb2xsVG9wKCkpO1xuICAgICAgICAgICAgICAgIGNoYW5nZXMgfD0gdGhpcy5DSEFOR0VfU0NST0xMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGhpcy4kc2Nyb2xsSW50b1ZpZXcpXG4gICAgICAgICAgICBpZiAodGhpcy4kc2Nyb2xsSW50b1ZpZXcubW9kZWwgPT0gdGhpcy5tb2RlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsQ2FyZXRJbnRvVmlldyh0aGlzLiRzY3JvbGxJbnRvVmlldy5jYXJldCwgdGhpcy4kc2Nyb2xsSW50b1ZpZXcub2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLiRzY3JvbGxJbnRvVmlldyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAod2lkdGggJiYgKGZvcmNlIHx8IHNpemUud2lkdGggIT0gd2lkdGgpKSB7XG4gICAgICAgICAgICBjaGFuZ2VzIHw9IHRoaXMuQ0hBTkdFX1NJWkU7XG4gICAgICAgICAgICBzaXplLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQmFySC5lbGVtZW50LnN0eWxlLmxlZnQgPSBcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZXIuc3R5bGUubGVmdCA9IDAgKyBcInB4XCI7XG4gICAgICAgICAgICBzaXplLnNjcm9sbGVyV2lkdGggPSBNYXRoLm1heCgwLCB3aWR0aCAgLSB0aGlzLnNjcm9sbEJhclYuZ2V0V2lkdGgoKSk7ICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy4kaGVhZGluZ0xheWVyLmVsZW1lbnQuc3R5bGUucmlnaHQgPSBcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQmFySC5lbGVtZW50LnN0eWxlLnJpZ2h0ID0gXG4gICAgICAgICAgICB0aGlzLnNjcm9sbGVyLnN0eWxlLnJpZ2h0ID0gdGhpcy5zY3JvbGxCYXJWLmdldFdpZHRoKCkgKyBcInB4XCI7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbGVyLnN0eWxlLmJvdHRvbSA9IHRoaXMuc2Nyb2xsQmFySC5nZXRIZWlnaHQoKSArIFwicHhcIjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHRoaXMuc2Nyb2xsQmFySC5lbGVtZW50LnN0eWxlLnNldFdpZHRoKHNpemUuc2Nyb2xsZXJXaWR0aCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuJGhlYWRpbmdMYXllci51cGRhdGVXaWR0aChzaXplLnNjcm9sbGVyV2lkdGgpO1xuXG4gICAgICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIuY29sdW1ucylcbiAgICAgICAgICAgICAgICBjaGFuZ2VzIHw9IHRoaXMuQ0hBTkdFX0ZVTEw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjaGFuZ2VzKVxuICAgICAgICAgICAgdGhpcy5fc2lnbmFsKFwicmVzaXplXCIpO1xuXG4gICAgICAgIHJldHVybiBjaGFuZ2VzO1xuICAgIH07XG5cbiAgICB0aGlzLnNldFZlckhlYWRpbmdWaXNpYmxlID0gZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICB0aGlzLiR0cmVlTGF5ZXIudmlzaWJsZSA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5sYXllckNvbmZpZy52UmFuZ2UgJiYgdGhpcy5sYXllckNvbmZpZy5oUmFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuJHJlbmRlckNoYW5nZXModGhpcy5DSEFOR0VfRlVMTCwgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLm9uUmVzaXplKHRydWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogUmV0dXJucyB0aGUgcm9vdCBlbGVtZW50IGNvbnRhaW5pbmcgdGhpcyByZW5kZXJlci5cbiAgICAgKiBAcmV0dXJucyB7RE9NRWxlbWVudH1cbiAgICAgKiovXG4gICAgdGhpcy5nZXRDb250YWluZXJFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lcjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIHRoZSBlbGVtZW50IHRoYXQgdGhlIG1vdXNlIGV2ZW50cyBhcmUgYXR0YWNoZWQgdG9cbiAgICAgKiBAcmV0dXJucyB7RE9NRWxlbWVudH1cbiAgICAgKiovXG4gICAgdGhpcy5nZXRNb3VzZUV2ZW50VGFyZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjcm9sbGVyO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogW1JldHVybnMgYXJyYXkgb2Ygbm9kZXMgY3VycmVudGx5IHZpc2libGUgb24gdGhlIHNjcmVlbl17OiAjVmlydHVhbFJlbmRlcmVyLmdldFZpc2libGVOb2Rlc31cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbm9kZSBUcmVlIG5vZGVcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdG9sZXJhbmNlIGZyYWN0aW9uIG9mIHRoZSBub2RlIGFsbG93ZWQgdG8gYmUgaGlkZGVuIHdoaWxlIG5vZGUgc3RpbGwgY29uc2lkZXJlZCB2aXNpYmxlIChkZWZhdWx0IDEvMylcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICoqL1xuICAgIHRoaXMuZ2V0VmlzaWJsZU5vZGVzID0gZnVuY3Rpb24odG9sZXJhbmNlKSB7XG4gICAgICAgIHZhciBub2RlcyA9IHRoaXMubGF5ZXJDb25maWcudlJhbmdlO1xuICAgICAgICB2YXIgZmlyc3QgPSAwO1xuICAgICAgICB2YXIgbGFzdCA9IG5vZGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlICh0aGlzLmlzTm9kZVZpc2libGUobm9kZXNbZmlyc3RdLCB0b2xlcmFuY2UpICYmIGZpcnN0IDwgbGFzdClcbiAgICAgICAgICAgIGZpcnN0Kys7XG4gICAgICAgIHdoaWxlICghdGhpcy5pc05vZGVWaXNpYmxlKG5vZGVzW2xhc3RdLCB0b2xlcmFuY2UpICYmIGxhc3QgPiBmaXJzdClcbiAgICAgICAgICAgIGxhc3QtLTtcbiAgICAgICAgcmV0dXJuIG5vZGVzLnNsaWNlKGZpcnN0LCBsYXN0ICsgMSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBbSW5kaWNhdGVzIGlmIHRoZSBub2RlIGlzIGN1cnJlbnRseSB2aXNpYmxlIG9uIHRoZSBzY3JlZW5dezogI1ZpcnR1YWxSZW5kZXJlci5pc05vZGVWaXNpYmxlfVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIFRyZWUgbm9kZVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0b2xlcmFuY2UgZnJhY3Rpb24gb2YgdGhlIG5vZGUgYWxsb3dlZCB0byBiZSBoaWRkZW4gd2hpbGUgbm9kZSBzdGlsbCBjb25zaWRlcmVkIHZpc2libGUgKGRlZmF1bHQgMS8zKVxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgICAqKi9cbiAgICB0aGlzLmlzTm9kZVZpc2libGUgPSBmdW5jdGlvbihub2RlLCB0b2xlcmFuY2UpIHtcbiAgICAgICB2YXIgbGF5ZXJDb25maWcgPSB0aGlzLmxheWVyQ29uZmlnO1xuICAgICAgIGlmICghbGF5ZXJDb25maWcudlJhbmdlKSByZXR1cm47XG4gICAgICAgdmFyIHByb3ZpZGVyID0gdGhpcy5wcm92aWRlcjtcbiAgICAgICB2YXIgaSA9IGxheWVyQ29uZmlnLnZSYW5nZS5pbmRleE9mKG5vZGUpO1xuICAgIFxuICAgICAgIGlmIChpID09IC0xKSByZXR1cm4gZmFsc2U7XG4gICAgICAgdmFyIG5vZGVQb3MgPSBwcm92aWRlci5nZXROb2RlUG9zaXRpb24obm9kZSk7XG4gICAgXG4gICAgICAgdmFyIHRvcCA9IG5vZGVQb3MudG9wO1xuICAgICAgIHZhciBoZWlnaHQgPSBub2RlUG9zLmhlaWdodDtcbiAgICAgICBpZiAodG9sZXJhbmNlID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgIHRvbGVyYW5jZSA9IDEgLyAzO1xuICAgICAgIGlmICh0aGlzLnNjcm9sbFRvcCA+IHRvcCArIHRvbGVyYW5jZSAqIGhlaWdodClcbiAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgIGlmICh0aGlzLnNjcm9sbFRvcCArIHRoaXMuJHNpemUuc2Nyb2xsZXJIZWlnaHQgPD0gdG9wICsgICgxIC0gdG9sZXJhbmNlKSAqIGhlaWdodClcbiAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy4kdXBkYXRlU2Nyb2xsQmFyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHRvZG8gc2VwYXJhdGUgZXZlbnQgZm9yIGggdiBzY3JvbGxcbiAgICAgICAgdGhpcy4kdXBkYXRlU2Nyb2xsQmFySCgpO1xuICAgICAgICB0aGlzLiR1cGRhdGVTY3JvbGxCYXJWKCk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnNldFNjcm9sbE1hcmdpbiA9IGZ1bmN0aW9uKHRvcCwgYm90dG9tLCBsZWZ0LCByaWdodCkge1xuICAgICAgICB2YXIgc20gPSB0aGlzLnNjcm9sbE1hcmdpbjtcbiAgICAgICAgc20udG9wID0gdG9wfDA7XG4gICAgICAgIHNtLmJvdHRvbSA9IGJvdHRvbXwwO1xuICAgICAgICBzbS5yaWdodCA9IHJpZ2h0fDA7XG4gICAgICAgIHNtLmxlZnQgPSBsZWZ0fDA7XG4gICAgICAgIHNtLnYgPSBzbS50b3AgKyBzbS5ib3R0b207XG4gICAgICAgIHNtLmggPSBzbS5sZWZ0ICsgc20ucmlnaHQ7XG4gICAgICAgIGlmIChzbS50b3AgJiYgdGhpcy5zY3JvbGxUb3AgPD0gMCAmJiB0aGlzLnByb3ZpZGVyKVxuICAgICAgICAgICAgdGhpcy5wcm92aWRlci5zZXRTY3JvbGxUb3AoLXNtLnRvcCk7XG4gICAgICAgIHRoaXMudXBkYXRlRnVsbCgpO1xuICAgIH07XG4gICAgdGhpcy4kdXBkYXRlU2Nyb2xsQmFyViA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNjcm9sbEJhclYuc2V0SW5uZXJIZWlnaHQodGhpcy5sYXllckNvbmZpZy5tYXhIZWlnaHQgKyB0aGlzLnNjcm9sbE1hcmdpbi52KTtcbiAgICAgICAgdGhpcy5zY3JvbGxCYXJWLnNldFNjcm9sbFRvcCh0aGlzLnNjcm9sbFRvcCArIHRoaXMuc2Nyb2xsTWFyZ2luLnRvcCk7XG4gICAgfTtcbiAgICB0aGlzLiR1cGRhdGVTY3JvbGxCYXJIID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsQmFySC5zZXRJbm5lcldpZHRoKHRoaXMubGF5ZXJDb25maWcubWF4V2lkdGggKyB0aGlzLnNjcm9sbE1hcmdpbi5oKTtcbiAgICAgICAgdGhpcy5zY3JvbGxCYXJILnNldFNjcm9sbExlZnQodGhpcy5zY3JvbGxMZWZ0ICsgdGhpcy5zY3JvbGxNYXJnaW4ubGVmdCk7XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLiRmcm96ZW4gPSBmYWxzZTtcbiAgICB0aGlzLmZyZWV6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRmcm96ZW4gPSB0cnVlO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy51bmZyZWV6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRmcm96ZW4gPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgdGhpcy4kcmVuZGVyQ2hhbmdlcyA9IGZ1bmN0aW9uKGNoYW5nZXMsIGZvcmNlKSB7XG4gICAgICAgIGlmICh0aGlzLiRjaGFuZ2VzKSB7XG4gICAgICAgICAgICBjaGFuZ2VzIHw9IHRoaXMuJGNoYW5nZXM7XG4gICAgICAgICAgICB0aGlzLiRjaGFuZ2VzID0gMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKCF0aGlzLnByb3ZpZGVyIHx8ICF0aGlzLmNvbnRhaW5lci5vZmZzZXRXaWR0aCB8fCB0aGlzLiRmcm96ZW4pIHx8ICghY2hhbmdlcyAmJiAhZm9yY2UpKSB7XG4gICAgICAgICAgICB0aGlzLiRjaGFuZ2VzIHw9IGNoYW5nZXM7XG4gICAgICAgICAgICByZXR1cm47IFxuICAgICAgICB9IFxuICAgICAgICBpZiAoIXRoaXMuJHNpemUud2lkdGgpIHtcbiAgICAgICAgICAgIHRoaXMuJGNoYW5nZXMgfD0gY2hhbmdlcztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uUmVzaXplKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgLy8gdGhpcy4kbG9nQ2hhbmdlcyhjaGFuZ2VzKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3NpZ25hbChcImJlZm9yZVJlbmRlclwiKTtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHRoaXMubGF5ZXJDb25maWc7XG4gICAgICAgIC8vIHRleHQsIHNjcm9sbGluZyBhbmQgcmVzaXplIGNoYW5nZXMgY2FuIGNhdXNlIHRoZSB2aWV3IHBvcnQgc2l6ZSB0byBjaGFuZ2VcbiAgICAgICAgaWYgKGNoYW5nZXMgJiB0aGlzLkNIQU5HRV9GVUxMIHx8XG4gICAgICAgICAgICBjaGFuZ2VzICYgdGhpcy5DSEFOR0VfU0laRSB8fFxuICAgICAgICAgICAgY2hhbmdlcyAmIHRoaXMuQ0hBTkdFX1NDUk9MTCB8fFxuICAgICAgICAgICAgY2hhbmdlcyAmIHRoaXMuQ0hBTkdFX0hfU0NST0xMIHx8XG4gICAgICAgICAgICBjaGFuZ2VzICYgdGhpcy5DSEFOR0VfQ09MVU1OIHx8XG4gICAgICAgICAgICBjaGFuZ2VzICYgdGhpcy5DSEFOR0VfUk9XIHx8XG4gICAgICAgICAgICBjaGFuZ2VzICYgdGhpcy5DSEFOR0VfQ0VMTFNcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjaGFuZ2VzIHw9dGhpcy4kY29tcHV0ZUxheWVyQ29uZmlnKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbmZpZyA9IHRoaXMubGF5ZXJDb25maWc7XG4gICAgICAgICAgICAvLyB1cGRhdGUgc2Nyb2xsYmFyIGZpcnN0IHRvIG5vdCBsb3NlIHNjcm9sbCBwb3NpdGlvbiB3aGVuIGd1dHRlciBjYWxscyByZXNpemVcbiAgICAgICAgICAgIHRoaXMuJHVwZGF0ZVNjcm9sbEJhcigpO1xuICAgICAgICAgICAgdGhpcy5jZWxscy5zdHlsZS5tYXJnaW5Ub3AgID0gLWNvbmZpZy52T2Zmc2V0ICsgXCJweFwiO1xuICAgICAgICAgICAgdGhpcy5jZWxscy5zdHlsZS5tYXJnaW5MZWZ0ID0gLWNvbmZpZy5oT2Zmc2V0ICsgXCJweFwiO1xuICAgICAgICAgICAgdGhpcy5jZWxscy5zdHlsZS53aWR0aCA9IGNvbmZpZy53aWR0aCArIFwicHhcIjtcbiAgICAgICAgICAgIHRoaXMuY2VsbHMuc3R5bGUuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCArIGNvbmZpZy5yb3dIZWlnaHQgKyBcInB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZnVsbFxuICAgICAgICBpZiAoY2hhbmdlcyAmIHRoaXMuQ0hBTkdFX0ZVTEwpIHtcbiAgICAgICAgICAgIHRoaXMuJGhlYWRpbmdMYXllci51cGRhdGUodGhpcy5sYXllckNvbmZpZyk7XG4gICAgICAgICAgICB0aGlzLiRjZWxsTGF5ZXIudXBkYXRlKHRoaXMubGF5ZXJDb25maWcpO1xuICAgICAgICAgICAgdGhpcy4kbWFya2VyTGF5ZXIudXBkYXRlKHRoaXMubGF5ZXJDb25maWcpO1xuICAgICAgICAgICAgdGhpcy5fc2lnbmFsKFwiYWZ0ZXJSZW5kZXJcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzY3JvbGxpbmdcbiAgICAgICAgaWYgKGNoYW5nZXMgJiB0aGlzLkNIQU5HRV9TQ1JPTEwpIHtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VzICYgdGhpcy5DSEFOR0VfUk9XIHx8IFxuICAgICAgICAgICAgICAgIGNoYW5nZXMgJiB0aGlzLkNIQU5HRV9DT0xVTU4gfHxcbiAgICAgICAgICAgICAgICBjaGFuZ2VzICYgdGhpcy5DSEFOR0VfQ0VMTFNcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuJGhlYWRpbmdMYXllci51cGRhdGUodGhpcy5sYXllckNvbmZpZyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kY2VsbExheWVyLnVwZGF0ZSh0aGlzLmxheWVyQ29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuJGhlYWRpbmdMYXllci51cGRhdGUodGhpcy5sYXllckNvbmZpZyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kY2VsbExheWVyLnNjcm9sbCh0aGlzLmxheWVyQ29uZmlnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy4kbWFya2VyTGF5ZXIudXBkYXRlKHRoaXMubGF5ZXJDb25maWcpO1xuICAgICAgICAgICAgdGhpcy4kdXBkYXRlU2Nyb2xsQmFyKCk7XG4gICAgICAgICAgICB0aGlzLl9zaWduYWwoXCJhZnRlclJlbmRlclwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGNoYW5nZXMgJiB0aGlzLkNIQU5HRV9DTEFTUylcbiAgICAgICAgICAgIHRoaXMuJGNlbGxMYXllci51cGRhdGVDbGFzc2VzKHRoaXMubGF5ZXJDb25maWcpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNoYW5nZXMgJiB0aGlzLkNIQU5HRV9NQVJLRVIgfHwgY2hhbmdlcyAmIHRoaXMuQ0hBTkdFX0NFTExTKVxuICAgICAgICAgICAgdGhpcy4kbWFya2VyTGF5ZXIudXBkYXRlKHRoaXMubGF5ZXJDb25maWcpO1xuXG4gICAgICAgIC8vIGlmIChjaGFuZ2VzICYgdGhpcy5DSEFOR0VfUk9XKVxuICAgICAgICAvLyAgICAgdGhpcy4kdHJlZUxheWVyLnVwZGF0ZSh0aGlzLmxheWVyQ29uZmlnKTtcbiAgICAgICAgLy8gICAgIHRoaXMuJHVwZGF0ZVJvd3MoKTtcbiAgICAgICAgLy9AdG9kbyBhbmFsb2cgdG8gdXBkYXRlUm93cz9cbiAgICAgICAgaWYgKGNoYW5nZXMgJiB0aGlzLkNIQU5HRV9DT0xVTU4pXG4gICAgICAgICAgICB0aGlzLiRob3JIZWFkaW5nTGF5ZXIudXBkYXRlKHRoaXMubGF5ZXJDb25maWcpO1xuICAgICAgICBpZiAoY2hhbmdlcyAmIHRoaXMuQ0hBTkdFX0NFTExTKVxuICAgICAgICAgICAgdGhpcy4kY2VsbExheWVyLnVwZGF0ZSh0aGlzLmxheWVyQ29uZmlnKTtcblxuICAgICAgICBpZiAoY2hhbmdlcyAmIHRoaXMuQ0hBTkdFX1NJWkUpXG4gICAgICAgICAgICB0aGlzLiR1cGRhdGVTY3JvbGxCYXIoKTtcblxuICAgICAgICB0aGlzLl9zaWduYWwoXCJhZnRlclJlbmRlclwiKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLiRzY3JvbGxJbnRvVmlldylcbiAgICAgICAgICAgIHRoaXMuJHNjcm9sbEludG9WaWV3ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgXG4gICAgdGhpcy4kYXV0b3NpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGhlYWRpbmdIZWlnaHQgPSB0aGlzLiRzaXplLmhlYWRpbmdIZWlnaHQ7XG4gICAgICAgIHZhciBoZWlnaHQgPSB0aGlzLnByb3ZpZGVyLmdldFRvdGFsSGVpZ2h0KCkgKyBoZWFkaW5nSGVpZ2h0O1xuICAgICAgICB2YXIgbWF4SGVpZ2h0ID0gdGhpcy5nZXRNYXhIZWlnaHRcbiAgICAgICAgICAgID8gdGhpcy5nZXRNYXhIZWlnaHQoKVxuICAgICAgICAgICAgOiB0aGlzLiRtYXhMaW5lcyAqIHRoaXMucHJvdmlkZXIucm93SGVpZ2h0ICsgaGVhZGluZ0hlaWdodDtcbiAgICAgICAgdmFyIGRlc2lyZWRIZWlnaHQgPSBNYXRoLm1heChcbiAgICAgICAgICAgICh0aGlzLiRtaW5MaW5lcyB8fCAxKSAqIHRoaXMucHJvdmlkZXIucm93SGVpZ2h0ICsgaGVhZGluZ0hlaWdodCxcbiAgICAgICAgICAgIE1hdGgubWluKG1heEhlaWdodCwgaGVpZ2h0KVxuICAgICAgICApICsgdGhpcy5zY3JvbGxNYXJnaW4udjtcbiAgICAgICAgdmFyIHZTY3JvbGwgPSBoZWlnaHQgPiBtYXhIZWlnaHQ7XG4gICAgICAgIFxuICAgICAgICBpZiAoZGVzaXJlZEhlaWdodCAhPSB0aGlzLmRlc2lyZWRIZWlnaHQgfHxcbiAgICAgICAgICAgIHRoaXMuJHNpemUuaGVpZ2h0ICE9IHRoaXMuZGVzaXJlZEhlaWdodCB8fCB2U2Nyb2xsICE9IHRoaXMuJHZTY3JvbGwpIHtcbiAgICAgICAgICAgIGlmICh2U2Nyb2xsICE9IHRoaXMuJHZTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiR2U2Nyb2xsID0gdlNjcm9sbDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEJhclYuc2V0VmlzaWJsZSh2U2Nyb2xsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHcgPSB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGRlc2lyZWRIZWlnaHQgKyBcInB4XCI7XG4gICAgICAgICAgICB0aGlzLiR1cGRhdGVDYWNoZWRTaXplKHRydWUsIHcsIGRlc2lyZWRIZWlnaHQpO1xuICAgICAgICAgICAgLy8gdGhpcy4kbG9vcC5jaGFuZ2VzID0gMDtcbiAgICAgICAgICAgIHRoaXMuZGVzaXJlZEhlaWdodCA9IGRlc2lyZWRIZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9zaWduYWwoXCJhdXRvcmVzaXplXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLiRjb21wdXRlTGF5ZXJDb25maWcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuJG1heExpbmVzKVxuICAgICAgICAgICAgdGhpcy4kYXV0b3NpemUoKTtcblxuICAgICAgICB2YXIgcHJvdmlkZXIgICA9IHRoaXMucHJvdmlkZXI7XG4gICAgICAgIHZhciB2ZXJ0aWNhbCAgID0gdGhpcy4kdHJlZUxheWVyO1xuICAgICAgICB2YXIgaG9yaXpvbnRhbCA9IHRoaXMuJGhvckhlYWRpbmdMYXllcjtcbiAgICAgICAgXG4gICAgICAgIHZhciBtaW5IZWlnaHQgPSB0aGlzLiRzaXplLnNjcm9sbGVySGVpZ2h0O1xuICAgICAgICB2YXIgbWF4SGVpZ2h0ID0gcHJvdmlkZXIuZ2V0VG90YWxIZWlnaHQoKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBtaW5XaWR0aCAgPSB0aGlzLiRzaXplLnNjcm9sbGVyV2lkdGg7XG4gICAgICAgIHZhciBtYXhXaWR0aCAgPSAwIC8vaG9yaXpvbnRhbC5zaXplO1xuXG4gICAgICAgIHZhciBoaWRlU2Nyb2xsYmFycyA9IHRoaXMuJHNpemUuaGVpZ2h0IDw9IDIgKiAxMDtcbiAgICAgICAgdmFyIGhvcml6U2Nyb2xsID0gIWhpZGVTY3JvbGxiYXJzICYmICh0aGlzLiRoU2Nyb2xsQmFyQWx3YXlzVmlzaWJsZSB8fFxuICAgICAgICAgICAgdGhpcy4kc2l6ZS5zY3JvbGxlcldpZHRoIC0gbWF4V2lkdGggPCAwKTtcblxuICAgICAgICB2YXIgaFNjcm9sbENoYW5nZWQgPSB0aGlzLiRob3JpelNjcm9sbCAhPT0gaG9yaXpTY3JvbGw7XG4gICAgICAgIGlmIChoU2Nyb2xsQ2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy4kaG9yaXpTY3JvbGwgPSBob3JpelNjcm9sbDtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQmFySC5zZXRWaXNpYmxlKGhvcml6U2Nyb2xsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHZTY3JvbGwgPSAhaGlkZVNjcm9sbGJhcnMgJiYgKHRoaXMuJHZTY3JvbGxCYXJBbHdheXNWaXNpYmxlIHx8XG4gICAgICAgICAgICB0aGlzLiRzaXplLnNjcm9sbGVySGVpZ2h0IC0gbWF4SGVpZ2h0IDwgMCk7XG4gICAgICAgIHZhciB2U2Nyb2xsQ2hhbmdlZCA9IHRoaXMuJHZTY3JvbGwgIT09IHZTY3JvbGw7XG4gICAgICAgIGlmICh2U2Nyb2xsQ2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy4kdlNjcm9sbCA9IHZTY3JvbGw7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEJhclYuc2V0VmlzaWJsZSh2U2Nyb2xsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5wcm92aWRlci5zZXRTY3JvbGxUb3AoTWF0aC5tYXgoLXRoaXMuc2Nyb2xsTWFyZ2luLnRvcCxcbiAgICAgICAgICAgIE1hdGgubWluKHRoaXMuc2Nyb2xsVG9wLCBtYXhIZWlnaHQgLSB0aGlzLiRzaXplLnNjcm9sbGVySGVpZ2h0ICsgdGhpcy5zY3JvbGxNYXJnaW4uYm90dG9tKSkpO1xuXG4gICAgICAgIHRoaXMucHJvdmlkZXIuc2V0U2Nyb2xsTGVmdChNYXRoLm1heCgtdGhpcy5zY3JvbGxNYXJnaW4ubGVmdCwgTWF0aC5taW4odGhpcy5zY3JvbGxMZWZ0LCBcbiAgICAgICAgICAgIG1heFdpZHRoIC0gdGhpcy4kc2l6ZS5zY3JvbGxlcldpZHRoICsgdGhpcy5zY3JvbGxNYXJnaW4ucmlnaHQpKSk7XG5cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnByb3ZpZGVyLmdldFNjcm9sbFRvcCgpICE9IHRoaXMuc2Nyb2xsVG9wKVxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSB0aGlzLnByb3ZpZGVyLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgXG4gICAgICAgIHZhciB0b3AgPSBNYXRoLm1heCh0aGlzLnNjcm9sbFRvcCwgMCk7XG4gICAgICAgIHZhciB2UmFuZ2UgPSBwcm92aWRlci5nZXRSYW5nZSh0b3AsIHRvcCArIHRoaXMuJHNpemUuaGVpZ2h0KTtcbiAgICAgICAgdmFyIGhSYW5nZSA9IHsgc2l6ZTogMCB9Oy8vIGhvcml6b250YWwuZ2V0UmFuZ2UodGhpcy5zY3JvbGxMZWZ0LCB0aGlzLnNjcm9sbExlZnQgKyB0aGlzLiRzaXplLndpZHRoKTtcblxuICAgICAgICBcbiAgICAgICAgdmFyIHZPZmZzZXQgID0gdGhpcy5zY3JvbGxUb3AgLSB2UmFuZ2Uuc2l6ZTtcbiAgICAgICAgdmFyIGhPZmZzZXQgID0gdGhpcy5zY3JvbGxMZWZ0IC0gaFJhbmdlLnNpemU7XG4gICAgICAgIFxuICAgICAgICB2YXIgcm93Q291bnQgPSB2UmFuZ2UubGVuZ3RoO1xuICAgICAgICB2YXIgZmlyc3RSb3cgPSB2UmFuZ2UuY291bnQ7XG4gICAgICAgIHZhciBsYXN0Um93ICA9IGZpcnN0Um93ICsgcm93Q291bnQgLSAxO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNvbENvdW50ID0gaFJhbmdlLmxlbmd0aDtcbiAgICAgICAgdmFyIGZpcnN0Q29sID0gaFJhbmdlLmNvdW50O1xuICAgICAgICB2YXIgbGFzdENvbCAgPSBmaXJzdENvbCArIGNvbENvdW50IC0gMTtcblxuICAgICAgICBpZiAodGhpcy5sYXllckNvbmZpZylcbiAgICAgICAgICAgIHRoaXMubGF5ZXJDb25maWcuZGlzY2FyZCA9IHRydWU7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2hhbmdlcyA9IDA7XG4gICAgICAgIC8vIEhvcml6b250YWwgc2Nyb2xsYmFyIHZpc2liaWxpdHkgbWF5IGhhdmUgY2hhbmdlZCwgd2hpY2ggY2hhbmdlc1xuICAgICAgICAvLyB0aGUgY2xpZW50IGhlaWdodCBvZiB0aGUgc2Nyb2xsZXJcbiAgICAgICAgaWYgKGhTY3JvbGxDaGFuZ2VkIHx8IHZTY3JvbGxDaGFuZ2VkKSB7XG4gICAgICAgICAgICBjaGFuZ2VzID0gdGhpcy4kdXBkYXRlQ2FjaGVkU2l6ZSh0cnVlLCB0aGlzLiRzaXplLndpZHRoLCB0aGlzLiRzaXplLmhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLl9zaWduYWwoXCJzY3JvbGxiYXJWaXNpYmlsaXR5Q2hhbmdlZFwiKTtcbiAgICAgICAgICAgIC8vaWYgKHZTY3JvbGxDaGFuZ2VkKVxuICAgICAgICAgICAgLy8gICAgbG9uZ2VzdExpbmUgPSB0aGlzLiRnZXRMb25nZXN0TGluZSgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmxheWVyQ29uZmlnID0ge1xuICAgICAgICAgICAgdlJhbmdlIDogdlJhbmdlLFxuICAgICAgICAgICAgaFJhbmdlIDogaFJhbmdlLFxuICAgICAgICAgICAgd2lkdGggOiBtaW5XaWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA6IG1pbkhlaWdodCxcbiAgICAgICAgICAgIGZpcnN0Um93IDogZmlyc3RSb3csXG4gICAgICAgICAgICBsYXN0Um93IDogbGFzdFJvdyxcbiAgICAgICAgICAgIGZpcnN0Q29sIDogZmlyc3RDb2wsXG4gICAgICAgICAgICBsYXN0Q29sIDogbGFzdENvbCxcbiAgICAgICAgICAgIG1pbkhlaWdodCA6IG1pbkhlaWdodCxcbiAgICAgICAgICAgIG1heEhlaWdodCA6IG1heEhlaWdodCxcbiAgICAgICAgICAgIG1pbldpZHRoIDogbWluV2lkdGgsXG4gICAgICAgICAgICBtYXhXaWR0aCA6IG1heFdpZHRoLFxuICAgICAgICAgICAgdk9mZnNldCA6IHZPZmZzZXQsXG4gICAgICAgICAgICBoT2Zmc2V0IDogaE9mZnNldCxcbiAgICAgICAgICAgIHJvd0hlaWdodDogcHJvdmlkZXIucm93SGVpZ2h0XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB2YXIgY29uZmlnID0gdGhpcy5sYXllckNvbmZpZywgcmVuZGVyZXIgPSB0aGlzO1xuICAgICAgICBpZiAodlJhbmdlKSB7XG4gICAgICAgICAgICBjb25maWcudmlldyA9IHByb3ZpZGVyLmdldERhdGFSYW5nZShcbiAgICAgICAgICAgICAgICB7c3RhcnQ6IHZSYW5nZS5jb3VudCwgbGVuZ3RoOiB2UmFuZ2UubGVuZ3RofSwgXG4gICAgICAgICAgICAgICAge3N0YXJ0OiBoUmFuZ2UuY291bnQsIGxlbmd0aDogaFJhbmdlLmxlbmd0aH0sIFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgdmlldywgdXBkYXRlKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGZhbHNlOyAvL0B0b2RvXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy52aWV3ID0gdmlldztcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICh1cGRhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci4kbG9vcC5zY2hlZHVsZShyZW5kZXJlci5DSEFOR0VfQ0VMTFMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9yIGRlYnVnZ2luZy5cbiAgICAgICAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5sYXllckNvbmZpZykpO1xuXG4gICAgICAgIHJldHVybiBjaGFuZ2VzO1xuICAgIH07XG4gICAgXG4gICAgdGhpcy4kdXBkYXRlUm93cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmlyc3RSb3cgPSB0aGlzLiRjaGFuZ2VkTGluZXMuZmlyc3RSb3c7XG4gICAgICAgIHZhciBsYXN0Um93ID0gdGhpcy4kY2hhbmdlZExpbmVzLmxhc3RSb3c7XG4gICAgICAgIHRoaXMuJGNoYW5nZWRMaW5lcyA9IG51bGw7XG5cbiAgICAgICAgdmFyIGxheWVyQ29uZmlnID0gdGhpcy5sYXllckNvbmZpZztcblxuICAgICAgICBpZiAoZmlyc3RSb3cgPiBsYXllckNvbmZpZy5sYXN0Um93ICsgMSkgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKGxhc3RSb3cgPCBsYXllckNvbmZpZy5maXJzdFJvdykgeyByZXR1cm47IH1cblxuICAgICAgICAvLyBpZiB0aGUgbGFzdCByb3cgaXMgdW5rbm93biAtPiByZWRyYXcgZXZlcnl0aGluZ1xuICAgICAgICBpZiAobGFzdFJvdyA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgIHRoaXMuJGNlbGxMYXllci51cGRhdGUobGF5ZXJDb25maWcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZWxzZSB1cGRhdGUgb25seSB0aGUgY2hhbmdlZCByb3dzXG4gICAgICAgIHRoaXMuJGNlbGxMYXllci51cGRhdGVSb3dzKGxheWVyQ29uZmlnLCBmaXJzdFJvdywgbGFzdFJvdyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICB0aGlzLnNjcm9sbFNlbGVjdGlvbkludG9WaWV3ID0gZnVuY3Rpb24oYW5jaG9yLCBsZWFkLCBvZmZzZXQpIHtcbiAgICAgICAgLy8gZmlyc3Qgc2Nyb2xsIGFuY2hvciBpbnRvIHZpZXcgdGhlbiBzY3JvbGwgbGVhZCBpbnRvIHZpZXdcbiAgICAgICAgdGhpcy5zY3JvbGxDYXJldEludG9WaWV3KGFuY2hvciwgb2Zmc2V0KTtcbiAgICAgICAgdGhpcy5zY3JvbGxDYXJldEludG9WaWV3KGxlYWQsIG9mZnNldCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogU2Nyb2xscyB0aGUgQ2FyZXQgaW50byB0aGUgZmlyc3QgdmlzaWJsZSBhcmVhIG9mIHRoZSBlZGl0b3JcbiAgICAgKiovXG4gICAgdGhpcy5zY3JvbGxDYXJldEludG9WaWV3ID0gZnVuY3Rpb24oY2FyZXQsIG9mZnNldCkge1xuICAgICAgICB0aGlzLiRzY3JvbGxJbnRvVmlldyA9IHtcbiAgICAgICAgICAgIGNhcmV0OiBjYXJldCxcbiAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgICAgc2Nyb2xsVG9wOiB0aGlzLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIG1vZGVsOiB0aGlzLm1vZGVsLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLiRzaXplLnNjcm9sbGVySGVpZ2h0XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyB0aGUgZWRpdG9yIGlzIG5vdCB2aXNpYmxlXG4gICAgICAgIGlmICh0aGlzLiRzaXplLnNjcm9sbGVySGVpZ2h0ID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgdmFyIHByb3ZpZGVyID0gdGhpcy5wcm92aWRlcjtcbiAgICAgICAgdmFyIG5vZGUgPSBjYXJldCB8fCBwcm92aWRlci5zZWxlY3Rpb24uZ2V0Q3Vyc29yKCk7XG4gICAgICAgIGlmICghbm9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHZhciBub2RlUG9zID0gcHJvdmlkZXIuZ2V0Tm9kZVBvc2l0aW9uKG5vZGUpO1xuXG4gICAgICAgIHZhciB0b3AgPSBub2RlUG9zLnRvcDtcbiAgICAgICAgdmFyIGhlaWdodCA9IG5vZGVQb3MuaGVpZ2h0O1xuICAgICAgICB2YXIgbGVmdCA9IDA7XG4gICAgICAgIHZhciB3aWR0aCA9IDA7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5zY3JvbGxUb3AgPiB0b3ApIHtcbiAgICAgICAgICAgIGlmIChvZmZzZXQpXG4gICAgICAgICAgICAgICAgdG9wIC09IG9mZnNldCAqIHRoaXMuJHNpemUuc2Nyb2xsZXJIZWlnaHQ7XG4gICAgICAgICAgICBpZiAodG9wID09PSAwKVxuICAgICAgICAgICAgICAgIHRvcCA9IC10aGlzLnNjcm9sbE1hcmdpbi50b3A7XG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLnNldFNjcm9sbFRvcCh0b3ApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2Nyb2xsVG9wICsgdGhpcy4kc2l6ZS5zY3JvbGxlckhlaWdodCA8IHRvcCArIGhlaWdodCkge1xuICAgICAgICAgICAgaWYgKG9mZnNldClcbiAgICAgICAgICAgICAgICB0b3AgKz0gb2Zmc2V0ICogdGhpcy4kc2l6ZS5zY3JvbGxlckhlaWdodDtcbiAgICAgICAgICAgIHRoaXMucHJvdmlkZXIuc2V0U2Nyb2xsVG9wKHRvcCArIGhlaWdodCAtIHRoaXMuJHNpemUuc2Nyb2xsZXJIZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNjcm9sbExlZnQgPSB0aGlzLnNjcm9sbExlZnQ7XG5cbiAgICAgICAgaWYgKHNjcm9sbExlZnQgPiBsZWZ0KSB7XG4gICAgICAgICAgICBpZiAobGVmdCA8IDApXG4gICAgICAgICAgICAgICAgbGVmdCA9IDA7XG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLnNldFNjcm9sbExlZnQobGVmdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2Nyb2xsTGVmdCArIHRoaXMuJHNpemUuc2Nyb2xsZXJXaWR0aCA8IGxlZnQgKyB3aWR0aCkge1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci5zZXRTY3JvbGxMZWZ0KE1hdGgucm91bmQobGVmdCArIHdpZHRoIC0gdGhpcy4kc2l6ZS5zY3JvbGxlcldpZHRoKSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuJHNjcm9sbEludG9WaWV3LnNjcm9sbFRvcCA9IHRoaXMuc2Nyb2xsVG9wO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqKi9cbiAgICB0aGlzLmdldFNjcm9sbFRvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxUb3A7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICoqL1xuICAgIHRoaXMuZ2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxMZWZ0O1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICogVGhpcyBmdW5jdGlvbiBzZXRzIHRoZSBzY3JvbGwgdG9wIHZhbHVlLiBJdCBhbHNvIGVtaXRzIHRoZSBgJ2NoYW5nZVNjcm9sbFRvcCdgIGV2ZW50LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGxUb3AgVGhlIG5ldyBzY3JvbGwgdG9wIHZhbHVlXG4gICAgICpcbiAgICAgKiovXG4gICAgdGhpcy5zZXRTY3JvbGxUb3AgPSBmdW5jdGlvbihzY3JvbGxUb3ApIHtcbiAgICAgICAgc2Nyb2xsVG9wID0gTWF0aC5yb3VuZChzY3JvbGxUb3ApO1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxUb3AgPT09IHNjcm9sbFRvcCB8fCBpc05hTihzY3JvbGxUb3ApKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9ZKHNjcm9sbFRvcCk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIHNldHMgdGhlIHNjcm9sbCB0b3AgdmFsdWUuIEl0IGFsc28gZW1pdHMgdGhlIGAnY2hhbmdlU2Nyb2xsTGVmdCdgIGV2ZW50LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGxMZWZ0IFRoZSBuZXcgc2Nyb2xsIGxlZnQgdmFsdWVcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLnNldFNjcm9sbExlZnQgPSBmdW5jdGlvbihzY3JvbGxMZWZ0KSB7XG4gICAgICAgIHNjcm9sbExlZnQgPSBNYXRoLnJvdW5kKHNjcm9sbExlZnQpO1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxMZWZ0ID09PSBzY3JvbGxMZWZ0IHx8IGlzTmFOKHNjcm9sbExlZnQpKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9YKHNjcm9sbExlZnQpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIFJldHVybnMgdGhlIGZpcnN0IHZpc2libGUgcm93LCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgaXQncyBmdWxseSB2aXNpYmxlIG9yIG5vdC5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqKi9cbiAgICB0aGlzLmdldFNjcm9sbFRvcFJvdyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXllckNvbmZpZy5maXJzdFJvdztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIHRoZSBsYXN0IHZpc2libGUgcm93LCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgaXQncyBmdWxseSB2aXNpYmxlIG9yIG5vdC5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqKi9cbiAgICB0aGlzLmdldFNjcm9sbEJvdHRvbVJvdyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXllckNvbmZpZy5sYXN0Um93O1xuICAgICAgICAvL3JldHVybiBNYXRoLm1heCgwLCBNYXRoLmZsb29yKCh0aGlzLnNjcm9sbFRvcCArIHRoaXMuJHNpemUuc2Nyb2xsZXJIZWlnaHQpIC8gdGhpcy5saW5lSGVpZ2h0KSAtIDEpO1xuICAgIH07XG5cbiAgICB0aGlzLmFsaWduQ2FyZXQgPSBmdW5jdGlvbihjdXJzb3IsIGFsaWdubWVudCkge1xuICAgICAgICBpZiAodHlwZW9mIGN1cnNvciA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgY3Vyc29yID0ge3JvdzogY3Vyc29yLCBjb2x1bW46IDB9O1xuXG4gICAgICAgIHZhciBub2RlID0gdGhpcy5wcm92aWRlci5maW5kTm9kZUJ5SW5kZXgoY3Vyc29yLnJvdyk7XG4gICAgICAgIHZhciBwb3MgPSB0aGlzLnByb3ZpZGVyLmZpbmRTaXplQXRJbmRleChjdXJzb3Iucm93KTtcbiAgICAgICAgdmFyIGggPSB0aGlzLiRzaXplLnNjcm9sbGVySGVpZ2h0O1xuICAgICAgICB2YXIgb2Zmc2V0ID0gcG9zIC0gKChoIC0gbm9kZS5zaXplKSAqIChhbGlnbm1lbnQgfHwgMCkpO1xuXG4gICAgICAgIHRoaXMuc2V0U2Nyb2xsVG9wKG9mZnNldCk7XG4gICAgICAgIHJldHVybiBvZmZzZXQ7XG4gICAgfTtcblxuICAgIHRoaXMuU1RFUFMgPSA4O1xuICAgIHRoaXMuJGNhbGNTdGVwcyA9IGZ1bmN0aW9uKGZyb21WYWx1ZSwgdG9WYWx1ZSl7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGwgPSB0aGlzLlNURVBTO1xuICAgICAgICB2YXIgc3RlcHMgPSBbXTtcblxuICAgICAgICB2YXIgZnVuYyAgPSBmdW5jdGlvbih0LCB4X21pbiwgZHgpIHtcbiAgICAgICAgICAgIHJldHVybiBkeCAqIChNYXRoLnBvdyh0IC0gMSwgMykgKyAxKSArIHhfbWluO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyArK2kpXG4gICAgICAgICAgICBzdGVwcy5wdXNoKGZ1bmMoaSAvIHRoaXMuU1RFUFMsIGZyb21WYWx1ZSwgdG9WYWx1ZSAtIGZyb21WYWx1ZSkpO1xuXG4gICAgICAgIHJldHVybiBzdGVwcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogR3JhY2VmdWxseSBzY3JvbGxzIHRoZSBlZGl0b3IgdG8gdGhlIHJvdyBpbmRpY2F0ZWQuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGxpbmUgQSBsaW5lIG51bWJlclxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gY2VudGVyIElmIGB0cnVlYCwgY2VudGVycyB0aGUgZWRpdG9yIHRoZSB0byBpbmRpY2F0ZWQgbGluZVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gYW5pbWF0ZSBJZiBgdHJ1ZWAgYW5pbWF0ZXMgc2Nyb2xsaW5nXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgRnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIHRoZSBhbmltYXRpb24gaGFzIGZpbmlzaGVkXG4gICAgICpcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLnNjcm9sbFRvUm93ID0gZnVuY3Rpb24ocm93LCBjZW50ZXIsIGFuaW1hdGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5wcm92aWRlci5maW5kTm9kZUJ5SW5kZXgocm93KTtcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMucHJvdmlkZXIuZmluZFNpemVBdEluZGV4KHJvdyk7XG4gICAgICAgIGlmIChjZW50ZXIpXG4gICAgICAgICAgICBvZmZzZXQgLT0gKHRoaXMuJHNpemUuc2Nyb2xsZXJIZWlnaHQgLSBub2RlLnNpemUpIC8gMjtcblxuICAgICAgICB2YXIgaW5pdGlhbFNjcm9sbCA9IHRoaXMuc2Nyb2xsVG9wO1xuICAgICAgICB0aGlzLnNldFNjcm9sbFRvcChvZmZzZXQpO1xuICAgICAgICBpZiAoYW5pbWF0ZSAhPT0gZmFsc2UpXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGVTY3JvbGxpbmcoaW5pdGlhbFNjcm9sbCwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB0aGlzLmFuaW1hdGVTY3JvbGxpbmcgPSBmdW5jdGlvbihmcm9tVmFsdWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB0b1ZhbHVlID0gdGhpcy5zY3JvbGxUb3A7XG4gICAgICAgIGlmICghdGhpcy4kYW5pbWF0ZWRTY3JvbGwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBfc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBpZiAoZnJvbVZhbHVlID09IHRvVmFsdWUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy4kc2Nyb2xsQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgb2xkU3RlcHMgPSB0aGlzLiRzY3JvbGxBbmltYXRpb24uc3RlcHM7XG4gICAgICAgICAgICBpZiAob2xkU3RlcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZnJvbVZhbHVlID0gb2xkU3RlcHNbMF07XG4gICAgICAgICAgICAgICAgaWYgKGZyb21WYWx1ZSA9PSB0b1ZhbHVlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBzdGVwcyA9IF9zZWxmLiRjYWxjU3RlcHMoZnJvbVZhbHVlLCB0b1ZhbHVlKTtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQW5pbWF0aW9uID0ge2Zyb206IGZyb21WYWx1ZSwgdG86IHRvVmFsdWUsIHN0ZXBzOiBzdGVwc307XG5cbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLiR0aW1lcik7XG5cbiAgICAgICAgX3NlbGYucHJvdmlkZXIuc2V0U2Nyb2xsVG9wKHN0ZXBzLnNoaWZ0KCkpO1xuICAgICAgICAvLyB0cmljayBwcm92aWRlciB0byB0aGluayBpdCdzIGFscmVhZHkgc2Nyb2xsZWQgdG8gbm90IGxvb3NlIHRvVmFsdWVcbiAgICAgICAgX3NlbGYucHJvdmlkZXIuJHNjcm9sbFRvcCA9IHRvVmFsdWU7XG4gICAgICAgIHRoaXMuJHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoc3RlcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgX3NlbGYucHJvdmlkZXIuc2V0U2Nyb2xsVG9wKHN0ZXBzLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgIF9zZWxmLnByb3ZpZGVyLiRzY3JvbGxUb3AgPSB0b1ZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0b1ZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBfc2VsZi5wcm92aWRlci4kc2Nyb2xsVG9wID0gLTE7XG4gICAgICAgICAgICAgICAgX3NlbGYucHJvdmlkZXIuc2V0U2Nyb2xsVG9wKHRvVmFsdWUpO1xuICAgICAgICAgICAgICAgIHRvVmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBkbyB0aGlzIG9uIHNlcGFyYXRlIHN0ZXAgdG8gbm90IGdldCBzcHVyaW91cyBzY3JvbGwgZXZlbnQgZnJvbSBzY3JvbGxiYXJcbiAgICAgICAgICAgICAgICBfc2VsZi4kdGltZXIgPSBjbGVhckludGVydmFsKF9zZWxmLiR0aW1lcik7XG4gICAgICAgICAgICAgICAgX3NlbGYuJHNjcm9sbEFuaW1hdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTY3JvbGxzIHRoZSBlZGl0b3IgdG8gdGhlIHkgcGl4ZWwgaW5kaWNhdGVkLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGxUb3AgVGhlIHBvc2l0aW9uIHRvIHNjcm9sbCB0b1xuICAgICAqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqKi9cbiAgICB0aGlzLnNjcm9sbFRvWSA9IGZ1bmN0aW9uKHNjcm9sbFRvcCkge1xuICAgICAgICAvLyBhZnRlciBjYWxsaW5nIHNjcm9sbEJhci5zZXRTY3JvbGxUb3BcbiAgICAgICAgLy8gc2Nyb2xsYmFyIHNlbmRzIHVzIGV2ZW50IHdpdGggc2FtZSBzY3JvbGxUb3AuIGlnbm9yZSBpdFxuICAgICAgICBpZiAodGhpcy5zY3JvbGxUb3AgIT09IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgdGhpcy4kbG9vcC5zY2hlZHVsZSh0aGlzLkNIQU5HRV9TQ1JPTEwpO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSBzY3JvbGxUb3A7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2Nyb2xscyB0aGUgZWRpdG9yIGFjcm9zcyB0aGUgeC1heGlzIHRvIHRoZSBwaXhlbCBpbmRpY2F0ZWQuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHNjcm9sbExlZnQgVGhlIHBvc2l0aW9uIHRvIHNjcm9sbCB0b1xuICAgICAqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqKi9cbiAgICB0aGlzLnNjcm9sbFRvWCA9IGZ1bmN0aW9uKHNjcm9sbExlZnQpIHtcbiAgICAgICAgaWYgKHNjcm9sbExlZnQgPCAwKVxuICAgICAgICAgICAgc2Nyb2xsTGVmdCA9IDA7XG5cbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsTGVmdCAhPT0gc2Nyb2xsTGVmdCkge1xuICAgICAgICAgICAgdGhpcy4kbG9vcC5zY2hlZHVsZSh0aGlzLkNIQU5HRV9TQ1JPTEwpO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxMZWZ0ID0gc2Nyb2xsTGVmdDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTY3JvbGxzIHRoZSBlZGl0b3IgYWNyb3NzIGJvdGggeC0gYW5kIHktYXhlcy5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFYIFRoZSB4IHZhbHVlIHRvIHNjcm9sbCBieVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVkgVGhlIHkgdmFsdWUgdG8gc2Nyb2xsIGJ5XG4gICAgICpcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLnNjcm9sbEJ5ID0gZnVuY3Rpb24oZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgZGVsdGFZICYmIHRoaXMucHJvdmlkZXIuc2V0U2Nyb2xsVG9wKHRoaXMucHJvdmlkZXIuZ2V0U2Nyb2xsVG9wKCkgKyBkZWx0YVkpO1xuICAgICAgICBkZWx0YVggJiYgdGhpcy5wcm92aWRlci5zZXRTY3JvbGxMZWZ0KHRoaXMucHJvdmlkZXIuZ2V0U2Nyb2xsTGVmdCgpICsgZGVsdGFYKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgeW91IGNhbiBzdGlsbCBzY3JvbGwgYnkgZWl0aGVyIHBhcmFtZXRlcjsgaW4gb3RoZXIgd29yZHMsIHlvdSBoYXZlbid0IHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgZmlsZSBvciBsaW5lLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVggVGhlIHggdmFsdWUgdG8gc2Nyb2xsIGJ5XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhWSBUaGUgeSB2YWx1ZSB0byBzY3JvbGwgYnlcbiAgICAgKlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAgICoqL1xuICAgIHRoaXMuaXNTY3JvbGxhYmxlQnkgPSBmdW5jdGlvbihkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICBpZiAoZGVsdGFZIDwgMCAmJiB0aGlzLmdldFNjcm9sbFRvcCgpID49IDEgLSB0aGlzLnNjcm9sbE1hcmdpbi50b3ApXG4gICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAoZGVsdGFZID4gMCAmJiB0aGlzLmdldFNjcm9sbFRvcCgpICsgdGhpcy4kc2l6ZS5zY3JvbGxlckhlaWdodCAtIHRoaXMubGF5ZXJDb25maWcubWF4SGVpZ2h0XG4gICAgICAgICAgICA8IC0xICsgdGhpcy5zY3JvbGxNYXJnaW4uYm90dG9tKVxuICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKGRlbHRhWCA8IDAgJiYgdGhpcy5nZXRTY3JvbGxMZWZ0KCkgPj0gMSlcbiAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmIChkZWx0YVggPiAwICYmIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgdGhpcy4kc2l6ZS5zY3JvbGxlcldpZHRoIC0gdGhpcy5sYXllckNvbmZpZy5tYXhXaWR0aCA8IC0xKVxuICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLy8gQHRvZG8gdGhpcyBjb2RlIGNhbiBiZSBjb21wcmVzc2VkXG4gICAgdGhpcy5zY3JlZW5Ub1RleHRDb29yZGluYXRlcyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgdmFyIGNhbnZhc1BvcyA9IHRoaXMuc2Nyb2xsZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHkgLT0gY2FudmFzUG9zLnRvcDtcbiAgICAgICAgeCAtPSBjYW52YXNQb3MubGVmdDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeCA6IHggKyB0aGlzLnNjcm9sbExlZnQsXG4gICAgICAgICAgICB5IDogeSArIHRoaXMuc2Nyb2xsVG9wXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGBwYWdlWGAgYW5kIGBwYWdlWWAgY29vcmRpbmF0ZXMgb2YgdGhlIGRvY3VtZW50IHBvc2l0aW9uLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb3cgVGhlIGRvY3VtZW50IHJvdyBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb2x1bW4gVGhlIGRvY3VtZW50IGNvbHVtbiBwb3NpdGlvblxuICAgICAqXG4gICAgICpcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICoqL1xuICAgIHRoaXMudGV4dFRvU2NyZWVuQ29vcmRpbmF0ZXMgPSBmdW5jdGlvbihyb3csIGNvbHVtbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcblxuICAgIH07XG4gICAgXG4gICAgdGhpcy5maW5kTm9kZUF0ID0gZnVuY3Rpb24oeCwgeSwgY29vcmRzKSB7XG4gICAgICAgIFxuICAgIH07XG4gICAgXG4gICAgdGhpcy4kbW92ZVRleHRBcmVhVG9DdXJzb3IgPSBmdW5jdGlvbigpe307XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEZvY3VzZXMgdGhlIGN1cnJlbnQgY29udGFpbmVyLlxuICAgICAqKi9cbiAgICB0aGlzLnZpc3VhbGl6ZUZvY3VzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvbS5hZGRDc3NDbGFzcyh0aGlzLmNvbnRhaW5lciwgXCJhY2VfdHJlZV9mb2N1c1wiKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBCbHVycyB0aGUgY3VycmVudCBjb250YWluZXIuXG4gICAgICoqL1xuICAgIHRoaXMudmlzdWFsaXplQmx1ciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBkb20ucmVtb3ZlQ3NzQ2xhc3ModGhpcy5jb250YWluZXIsIFwiYWNlX3RyZWVfZm9jdXNcIik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICogW1NldHMgYSBuZXcgdGhlbWUgZm9yIHRoZSBlZGl0b3IuIGB0aGVtZWAgc2hvdWxkIGV4aXN0LCBhbmQgYmUgYSBkaXJlY3RvcnkgcGF0aCwgbGlrZSBgYWNlL3RoZW1lL3RleHRtYXRlYC5dezogI1ZpcnR1YWxSZW5kZXJlci5zZXRUaGVtZX1cbiAgICAqIEBwYXJhbSB7U3RyaW5nfSB0aGVtZSBUaGUgcGF0aCB0byBhIHRoZW1lXG4gICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBvcHRpb25hbCBjYWxsYmFja1xuICAgICpcbiAgICAqKi9cbiAgICB0aGlzLnNldFRoZW1lID0gZnVuY3Rpb24odGhlbWUsIGNiKSB7XG4gICAgICAgIHZhciBfc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuJHRoZW1lVmFsdWUgPSB0aGVtZTtcbiAgICAgICAgX3NlbGYuX2Rpc3BhdGNoRXZlbnQoJ3RoZW1lQ2hhbmdlJyx7dGhlbWU6dGhlbWV9KTtcblxuICAgICAgICBpZiAoIXRoZW1lIHx8IHR5cGVvZiB0aGVtZSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB2YXIgbW9kdWxlTmFtZSA9IHRoZW1lIHx8IFwiYWNlL3RoZW1lL3RleHRtYXRlXCI7XG4gICAgICAgICAgICBjb25maWcubG9hZE1vZHVsZShbXCJ0aGVtZVwiLCBtb2R1bGVOYW1lXSwgYWZ0ZXJMb2FkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFmdGVyTG9hZCh0aGVtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZnRlckxvYWQobW9kdWxlKSB7XG4gICAgICAgICAgICBpZiAoX3NlbGYuJHRoZW1lVmFsdWUgIT0gdGhlbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiICYmIGNiKCk7XG4gICAgICAgICAgICBpZiAoIW1vZHVsZS5jc3NDbGFzcylcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBkb20uaW1wb3J0Q3NzU3RyaW5nKFxuICAgICAgICAgICAgICAgIG1vZHVsZS5jc3NUZXh0LFxuICAgICAgICAgICAgICAgIG1vZHVsZS5jc3NDbGFzcyxcbiAgICAgICAgICAgICAgICBfc2VsZi5jb250YWluZXIub3duZXJEb2N1bWVudFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKF9zZWxmLnRoZW1lKVxuICAgICAgICAgICAgICAgIGRvbS5yZW1vdmVDc3NDbGFzcyhfc2VsZi5jb250YWluZXIsIF9zZWxmLnRoZW1lLmNzc0NsYXNzKTtcblxuICAgICAgICAgICAgLy8gdGhpcyBpcyBrZXB0IG9ubHkgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICBfc2VsZi4kdGhlbWUgPSBtb2R1bGUuY3NzQ2xhc3M7XG5cbiAgICAgICAgICAgIF9zZWxmLnRoZW1lID0gbW9kdWxlO1xuICAgICAgICAgICAgZG9tLmFkZENzc0NsYXNzKF9zZWxmLmNvbnRhaW5lciwgbW9kdWxlLmNzc0NsYXNzKTtcbiAgICAgICAgICAgIGRvbS5zZXRDc3NDbGFzcyhfc2VsZi5jb250YWluZXIsIFwiYWNlX2RhcmtcIiwgbW9kdWxlLmlzRGFyayk7XG5cbiAgICAgICAgICAgIHZhciBwYWRkaW5nID0gbW9kdWxlLnBhZGRpbmcgfHwgNDtcbiAgICAgICAgICAgIGlmIChfc2VsZi4kcGFkZGluZyAmJiBwYWRkaW5nICE9IF9zZWxmLiRwYWRkaW5nKVxuICAgICAgICAgICAgICAgIF9zZWxmLnNldFBhZGRpbmcocGFkZGluZyk7XG5cbiAgICAgICAgICAgIC8vIGZvcmNlIHJlLW1lYXN1cmUgb2YgdGhlIGd1dHRlciB3aWR0aFxuICAgICAgICAgICAgaWYgKF9zZWxmLiRzaXplKSB7XG4gICAgICAgICAgICAgICAgX3NlbGYuJHNpemUud2lkdGggPSAwO1xuICAgICAgICAgICAgICAgIF9zZWxmLm9uUmVzaXplKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9zZWxmLl9kaXNwYXRjaEV2ZW50KCd0aGVtZUxvYWRlZCcsIHt0aGVtZTptb2R1bGV9KTtcbiAgICAgICAgICAgIGNiICYmIGNiKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgKiBbUmV0dXJucyB0aGUgcGF0aCBvZiB0aGUgY3VycmVudCB0aGVtZS5dezogI1ZpcnR1YWxSZW5kZXJlci5nZXRUaGVtZX1cbiAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgKiovXG4gICAgdGhpcy5nZXRUaGVtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kdGhlbWVWYWx1ZTtcbiAgICB9O1xuXG4gICAgLy8gTWV0aG9kcyBhbGxvd3MgdG8gYWRkIC8gcmVtb3ZlIENTUyBjbGFzc25hbWVzIHRvIHRoZSBlZGl0b3IgZWxlbWVudC5cbiAgICAvLyBUaGlzIGZlYXR1cmUgY2FuIGJlIHVzZWQgYnkgcGx1Zy1pbnMgdG8gcHJvdmlkZSBhIHZpc3VhbCBpbmRpY2F0aW9uIG9mXG4gICAgLy8gYSBjZXJ0YWluIG1vZGUgdGhhdCBlZGl0b3IgaXMgaW4uXG5cbiAgICAvKipcbiAgICAgKiBbQWRkcyBhIG5ldyBjbGFzcywgYHN0eWxlYCwgdG8gdGhlIGVkaXRvci5dezogI1ZpcnR1YWxSZW5kZXJlci5zZXRTdHlsZX1cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGUgQSBjbGFzcyBuYW1lXG4gICAgICpcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLnNldFN0eWxlID0gZnVuY3Rpb24gc2V0U3R5bGUoc3R5bGUsIGluY2x1ZGUpIHtcbiAgICAgICAgZG9tLnNldENzc0NsYXNzKHRoaXMuY29udGFpbmVyLCBzdHlsZSwgaW5jbHVkZSAhPT0gZmFsc2UpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbUmVtb3ZlcyB0aGUgY2xhc3MgYHN0eWxlYCBmcm9tIHRoZSBlZGl0b3IuXXs6ICNWaXJ0dWFsUmVuZGVyZXIudW5zZXRTdHlsZX1cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGUgQSBjbGFzcyBuYW1lXG4gICAgICpcbiAgICAgKlxuICAgICAqKi9cbiAgICB0aGlzLnVuc2V0U3R5bGUgPSBmdW5jdGlvbiB1bnNldFN0eWxlKHN0eWxlKSB7XG4gICAgICAgIGRvbS5yZW1vdmVDc3NDbGFzcyh0aGlzLmNvbnRhaW5lciwgc3R5bGUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIERlc3Ryb3lzIHRoZSB0ZXh0IGFuZCBDYXJldCBsYXllcnMgZm9yIHRoaXMgcmVuZGVyZXIuXG4gICAgICoqL1xuICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIHRoaXMuJHdpbmRvd0ZvY3VzKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuJGNlbGxMYXllci5kZXN0cm95KCk7XG4gICAgfTtcblxufSkuY2FsbChWaXJ0dWFsUmVuZGVyZXIucHJvdG90eXBlKTtcblxuY29uZmlnLmRlZmluZU9wdGlvbnMoVmlydHVhbFJlbmRlcmVyLnByb3RvdHlwZSwgXCJyZW5kZXJlclwiLCB7XG4gICAgYW5pbWF0ZWRTY3JvbGw6IHtpbml0aWFsVmFsdWU6IHRydWV9LFxuICAgIHNob3dJbnZpc2libGVzOiB7XG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiRjZWxsTGF5ZXIuc2V0U2hvd0ludmlzaWJsZXModmFsdWUpKVxuICAgICAgICAgICAgICAgIHRoaXMuJGxvb3Auc2NoZWR1bGUodGhpcy5DSEFOR0VfVEVYVCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluaXRpYWxWYWx1ZTogZmFsc2VcbiAgICB9LFxuICAgIHNob3dQcmludE1hcmdpbjoge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKCkgeyB0aGlzLiR1cGRhdGVQcmludE1hcmdpbigpOyB9LFxuICAgICAgICBpbml0aWFsVmFsdWU6IHRydWVcbiAgICB9LFxuICAgIHByaW50TWFyZ2luQ29sdW1uOiB7XG4gICAgICAgIHNldDogZnVuY3Rpb24oKSB7IHRoaXMuJHVwZGF0ZVByaW50TWFyZ2luKCk7IH0sXG4gICAgICAgIGluaXRpYWxWYWx1ZTogODBcbiAgICB9LFxuICAgIHByaW50TWFyZ2luOiB7XG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbCA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgIHRoaXMuJHByaW50TWFyZ2luQ29sdW1uID0gdmFsO1xuICAgICAgICAgICAgdGhpcy4kc2hvd1ByaW50TWFyZ2luID0gISF2YWw7XG4gICAgICAgICAgICB0aGlzLiR1cGRhdGVQcmludE1hcmdpbigpO1xuICAgICAgICB9LFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuJHNob3dQcmludE1hcmdpbiAmJiB0aGlzLiRwcmludE1hcmdpbkNvbHVtbjsgXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRpc3BsYXlJbmRlbnRHdWlkZXM6IHtcbiAgICAgICAgc2V0OiBmdW5jdGlvbihzaG93KSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kY2VsbExheWVyLnNldERpc3BsYXlJbmRlbnRHdWlkZXMoc2hvdykpXG4gICAgICAgICAgICAgICAgdGhpcy4kbG9vcC5zY2hlZHVsZSh0aGlzLkNIQU5HRV9URVhUKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdGlhbFZhbHVlOiB0cnVlXG4gICAgfSxcbiAgICBoU2Nyb2xsQmFyQWx3YXlzVmlzaWJsZToge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGFsd2F5c1Zpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuJGhTY3JvbGxCYXJBbHdheXNWaXNpYmxlID0gYWx3YXlzVmlzaWJsZTtcbiAgICAgICAgICAgIGlmICghdGhpcy4kaFNjcm9sbEJhckFsd2F5c1Zpc2libGUgfHwgIXRoaXMuJGhvcml6U2Nyb2xsKVxuICAgICAgICAgICAgICAgIHRoaXMuJGxvb3Auc2NoZWR1bGUodGhpcy5DSEFOR0VfU0NST0xMKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBmYWxzZVxuICAgIH0sXG4gICAgdlNjcm9sbEJhckFsd2F5c1Zpc2libGU6IHtcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy4kdlNjcm9sbEJhckFsd2F5c1Zpc2libGUgfHwgIXRoaXMuJHZTY3JvbGwpXG4gICAgICAgICAgICAgICAgdGhpcy4kbG9vcC5zY2hlZHVsZSh0aGlzLkNIQU5HRV9TQ1JPTEwpO1xuICAgICAgICB9LFxuICAgICAgICBpbml0aWFsVmFsdWU6IGZhbHNlXG4gICAgfSxcbiAgICBmb250U2l6ZTogIHtcbiAgICAgICAgc2V0OiBmdW5jdGlvbihzaXplKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNpemUgPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICBzaXplID0gc2l6ZSArIFwicHhcIjtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLmZvbnRTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRm9udFNpemUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdGlhbFZhbHVlOiAxMlxuICAgIH0sXG4gICAgZm9udEZhbWlseToge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLmZvbnRGYW1pbHkgPSBuYW1lO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVGb250U2l6ZSgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtYXhMaW5lczoge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVGdWxsKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1pbkxpbmVzOiB7XG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZ1bGwoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2Nyb2xsUGFzdEVuZDoge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgdmFsID0gK3ZhbCB8fCAwO1xuICAgICAgICAgICAgaWYgKHRoaXMuJHNjcm9sbFBhc3RFbmQgPT0gdmFsKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuJHNjcm9sbFBhc3RFbmQgPSB2YWw7XG4gICAgICAgICAgICB0aGlzLiRsb29wLnNjaGVkdWxlKHRoaXMuQ0hBTkdFX1NDUk9MTCk7XG4gICAgICAgIH0sXG4gICAgICAgIGluaXRpYWxWYWx1ZTogMCxcbiAgICAgICAgaGFuZGxlc1NldDogdHJ1ZVxuICAgIH1cbn0pO1xuXG5leHBvcnRzLlZpcnR1YWxSZW5kZXJlciA9IFZpcnR1YWxSZW5kZXJlcjtcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBcIi5hY2VfdHJlZS1saWdodC5hY2VfdHJlZXtcXG4gICAgZm9udDogMTJweCBBcmlhbDtcXG59XFxuXFxuLmFjZV90cmVlX3NlbGVjdGlvbl9yYW5nZXtcXG4gICAgYmFja2dyb3VuZCA6IHJnYmEoMCwgMTEwLCAyNTUsIDAuMik7XFxuICAgIGJvcmRlciA6IDFweCBzb2xpZCByZ2JhKDAsMCwwLDAuMSk7XFxufVxcbi5hY2VfdHJlZV9mb2N1cyAuYWNlX3RyZWVfc2VsZWN0aW9uX3Jhbmdle1xcbiAgICBcXG59XFxuXFxuLmFjZV90cmVlLWxpZ2h0IC50b2dnbGVyIHtcXG4gICAgb3ZlcmZsb3c6IHZpc2libGU7XFxuICAgIHdpZHRoOiAxMHB4O1xcbiAgICBoZWlnaHQ6IDEwcHg7XFxufVxcblxcbi5hY2VfdHJlZS1saWdodCAudHJlZS1yb3cgLmNhcHRpb24ge1xcbiAgICBwYWRkaW5nIDogNHB4IDVweDtcXG59XFxuLmFjZV90cmVlLWxpZ2h0IC50cmVlLXJvdyA+IC5jYXB0aW9uIHtcXG4gICAgb3ZlcmZsb3c6IHZpc2libGU7XFxuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG59XFxuLmFjZV90cmVlLWxpZ2h0IC50cmVlLXJvdyB7XFxuICAgIGJvcmRlcjogMXB4IHNvbGlkIHRyYW5zcGFyZW50O1xcbiAgICAtbW96LWJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcbi5hY2VfdHJlZS1saWdodCAudHJlZS1yb3c6aG92ZXIsXFxuLmFjZV90cmVlLWxpZ2h0IC50cmVlLXJvdy5ob3ZlcntcXG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjAzKTtcXG59XFxuLmFjZV90cmVlLWxpZ2h0IC50cmVlLXJvdy5zZWxlY3RlZCB7XFxuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wNCk7XFxufVxcblxcbi5hY2VfdHJlZV9mb2N1cy5hY2VfdHJlZS1saWdodCAudHJlZS1yb3cuc2VsZWN0ZWQge1xcbiAgICBiYWNrZ3JvdW5kOiAtd2Via2l0LWdyYWRpZW50KGxpbmVhciwgbGVmdCB0b3AsIGxlZnQgYm90dG9tLCBmcm9tKCMyODkwRTUpLCBjb2xvci1zdG9wKDEsICMxRjgyRDIpKTtcXG4gICAgYmFja2dyb3VuZDogLW1vei1saW5lYXItZ3JhZGllbnQoY2VudGVyIGJvdHRvbSwgIzFmODJkMiAwJSwgIzI4OTBlNSAxMDAlKSByZXBlYXQgc2Nyb2xsIDAgMCB0cmFuc3BhcmVudDtcXG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KGNlbnRlciBib3R0b20sICMxZjgyZDIgMCUsICMyODkwZTUgMTAwJSkgcmVwZWF0IHNjcm9sbCAwIDAgdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiAjZjhmOGY4O1xcbn1cXG5cXG5cXG4vKiBkYXRhZ3JpZCAqL1xcblxcbi5hY2VfdHJlZS1saWdodCAudHJlZS1yb3c+LnRyZWUtY29sdW1uIHtcXG4gICAgYm9yZGVyOiAxcHggc29saWQgcmdiKDIwNCwgMjA0LCAyMDQpO1xcbiAgICBib3JkZXItd2lkdGg6IDAgMXB4IDFweCAwO1xcbiAgICBwYWRkaW5nOiA0cHggNXB4O1xcbn1cXG5cXG4uYWNlX3RyZWUtbGlnaHQgLnRyZWUtcm93LnNlbGVjdGVkPi50cmVlLWNvbHVtbiB7XFxuICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xcbn1cXG4uYWNlX3RyZWUtbGlnaHQgLnRyZWUtaGVhZGluZ3Mge1xcbiAgICBiYWNrZ3JvdW5kOiByZ2IoMjUzLCAyNTMsIDI1Myk7XFxufVxcbi5hY2VfdHJlZS1saWdodCAudHJlZS1oZWFkaW5ncz4udHJlZS1jb2x1bW4ge1xcbiAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcXG4gICAgcGFkZGluZzogNXB4IDNweDtcXG59XFxuXFxuLmFjZV90cmVlLWxpZ2h0IC50cmVlLWhlYWRpbmdzPi50cmVlLWNvbHVtbi1yZXNpemVyIHtcXG4gICAgaGVpZ2h0OiAxMDAlO1xcbiAgICBiYWNrZ3JvdW5kOiByZ2IoMTgyLCAxODIsIDE4Mik7XFxuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gICAgd2lkdGg6IDFweDtcXG4gICAgei1pbmRleDogMTAwMDtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICBtYXJnaW4tbGVmdDogLTFweDtcXG4gICAgYm9yZGVyLWxlZnQ6IDFweCBzb2xpZCByZ2JhKDAsIDAsIDAsIDApO1xcbn1cXG5cIiIsIm1vZHVsZS5leHBvcnRzID0gXCIuYWNlX3RyZWV7XFxuICAgIG92ZXJmbG93IDogaGlkZGVuO1xcbiAgICBmb250IDogMTJweCBUYWhvbWEsIEFyaWFsO1xcbiAgICBjdXJzb3I6IGRlZmF1bHQ7XFxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG4gICAgd2hpdGUtc3BhY2U6IHByZTtcXG59XFxuXFxuLmFjZV90cmVlIHRleHRhcmVhe1xcbiAgICBwb3NpdGlvbiA6IGFic29sdXRlO1xcbiAgICB6LWluZGV4IDogMDtcXG59XFxuXFxuLmFjZV90cmVlX3Njcm9sbGVyIHtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgICB0b3A6IDA7XFxuICAgIGJvdHRvbTogMDtcXG4gICAgLXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcXG4gICAgICAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcXG4gICAgICAgIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcXG4gICAgICAgICAtby11c2VyLXNlbGVjdDogbm9uZTtcXG4gICAgICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcXG59XFxuXFxuLmFjZV90cmVlX2NvbnRlbnQge1xcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICAgIC1tb3otYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgLXdlYmtpdC1ib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbn1cXG5cXG4uYWNlX3Njcm9sbGJhciB7XFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgb3ZlcmZsb3cteDogaGlkZGVuO1xcbiAgICBvdmVyZmxvdy15OiBhdXRvO1xcbiAgICByaWdodDogMDtcXG4gICAgYm90dG9tOiAwO1xcbn1cXG5cXG4uYWNlX3Njcm9sbGJhci1pbm5lciB7XFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgY3Vyc29yOiB0ZXh0O1xcbiAgICBsZWZ0OiAwO1xcbiAgICB0b3A6IDA7XFxufVxcblxcbi5hY2Vfc2Nyb2xsYmFyLWgge1xcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICAgIG92ZXJmbG93LXg6IGF1dG87XFxuICAgIG92ZXJmbG93LXk6IGhpZGRlbjtcXG4gICAgcmlnaHQ6IDA7XFxuICAgIGxlZnQ6IDA7XFxuICAgIGJvdHRvbTogMDtcXG59XFxuXFxuLmFjZV90cmVlX2hvcmhlYWRpbmcge1xcbiAgICBwb3NpdGlvbiA6IGFic29sdXRlO1xcbn1cXG5cXG4uYWNlX3RyZWVfdmVyaGVhZGluZ3tcXG4gICAgYm90dG9tIDogMDtcXG4gICAgcG9zaXRpb24gOiBhYnNvbHV0ZTtcXG59XFxuXFxuLmFjZV90cmVlX2hlYWRpbmcge1xcbiAgICB6LWluZGV4OiAxMDtcXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcbiAgICAtd2Via2l0LWJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICAgICAgIC1tb3otYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcXG59XFxuXFxuLmFjZV90cmVlX2xheWVyIHtcXG4gICAgei1pbmRleDogMTtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcbiAgICAtd2Via2l0LWJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICAgICAgIC1tb3otYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcXG59XFxuXFxuLmFjZV90cmVlIC50cmVlLWluZGVudCB7XFxuICAgIGRpc3BsYXkgOiBpbmxpbmUtYmxvY2s7XFxufVxcblxcbi5hY2VfdHJlZV9zZWxlY3Rpb25fcmFuZ2V7XFxuICAgIHBvc2l0aW9uIDogYWJzb2x1dGU7XFxuICAgIC13ZWJraXQtYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgICAgLW1vei1ib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcbi5hY2VfdHJlZV9mb2N1cyAuYWNlX3RyZWVfc2VsZWN0aW9uX3Jhbmdle1xcbiAgICBcXG59XFxuXFxuLmFjZV90cmVlLWVkaXRvciB7XFxuICAgIHBvc2l0aW9uIDogYWJzb2x1dGU7XFxuICAgIHotaW5kZXggOiAxMDAwMDtcXG4gICAgYmFja2dyb3VuZCA6IHdoaXRlO1xcbiAgICBwYWRkaW5nIDogM3B4IDRweCAzcHggNHB4O1xcbiAgICAtbW96LWJveC1zaXppbmcgOiBib3JkZXItYm94O1xcbiAgICAgICAgIGJveC1zaXppbmcgOiBib3JkZXItYm94O1xcbiAgICBib3JkZXIgOiAxcHggZG90dGVkIGdyZWVuO1xcbiAgICBsZWZ0OiAwO1xcbiAgICByaWdodDogMFxcbn1cXG5cXG5cXG5cXG4uYWNlX3RyZWUgLnRvZ2dsZXIge1xcbiAgICB3aWR0aDogMTBweDtcXG4gICAgaGVpZ2h0OiAxMHB4O1xcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiAwcHggMHB4O1xcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xcbiAgICBjdXJzb3I6IHBvaW50ZXI7XFxuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gICAgcG9pbnRlci1ldmVudHM6IGF1dG87XFxufVxcblxcbi5hY2VfdHJlZSAudG9nZ2xlci5lbXB0eSB7XFxuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xcbn1cXG5cXG4uYWNlX3RyZWUgLnRvZ2dsZXIub3BlbiB7XFxuICAgIGJhY2tncm91bmQtcG9zaXRpb246IC0xMHB4IDBweDtcXG59XFxuXFxuLmFjZV90cmVlIC50b2dnbGVyLmVtcHR5IHtcXG4gICAgYmFja2dyb3VuZC1wb3NpdGlvbjogNTBweCAwcHg7XFxuICAgIGN1cnNvcjogZGVmYXVsdDtcXG59XFxuXFxuLmFjZV90cmVlX2NlbGxzLCAuYWNlX3RyZWVfY2VsbC1sYXllciB7XFxuICAgIHdpZHRoOiAxMDAlO1xcbn1cXG4uYWNlX3RyZWVfc2VsZWN0aW9uLWxheWVyIHtcXG4gICAgd2lkdGg6IDEwMCU7XFxuICAgIGhlaWdodDogMTEwJTtcXG59XFxuLmFjZV90cmVlX2NlbGxzIC5tZXNzYWdlLmVtcHR5IHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgICBvcGFjaXR5OiAwLjk7XFxuICAgIGN1cnNvciA6IGRlZmF1bHQ7XFxufVxcblxcbi8qIGRhdGFncmlkICovXFxuXFxuLmFjZV90cmVlIC50cmVlLXJvdz4udHJlZS1jb2x1bW4ge1xcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxuICAgIC13ZWJraXQtYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgICAgLW1vei1ib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcblxcblxcbi50cmVlLWhlYWRpbmdzIHtcXG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgICB0b3A6IDA7XFxuICAgIGxlZnQ6IDA7XFxuICAgIHJpZ2h0OiAwO1xcbiAgICAtd2Via2l0LWJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICAgICAgIC1tb3otYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbn1cXG4udHJlZS1oZWFkaW5ncz4udHJlZS1jb2x1bW4ge1xcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICAgIC13ZWJraXQtYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gICAgICAgLW1vei1ib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcblxcbi50cmVlLWhlYWRpbmdzPi50cmVlLWNvbHVtbi1yZXNpemVyIHtcXG4gICAgaGVpZ2h0OiAxMDAlO1xcbiAgICBiYWNrZ3JvdW5kOiByZ2IoMTgyLCAxODIsIDE4Mik7XFxuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gICAgd2lkdGg6IDJweDtcXG4gICAgei1pbmRleDogMTAwMDtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICBtYXJnaW4tbGVmdDogLTJweDtcXG4gICAgYm9yZGVyLWxlZnQ6IDFweCBzb2xpZCByZ2JhKDAsIDAsIDAsIDApO1xcbn1cXG5cIiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJleHBvcnQgKiBhcyBUcmVlIGZyb20gXCIuL3NyYy90cmVlXCI7XG5leHBvcnQgKiBhcyBEYXRhUHJvdmlkZXIgZnJvbSBcIi4vc3JjL2RhdGFfcHJvdmlkZXJcIjsiXSwibmFtZXMiOlsiZGVmaW5lIiwicmVxdWlyZSIsImV4cG9ydHMiLCJtb2R1bGUiLCJiaW5kS2V5Iiwid2luIiwibWFjIiwiY29tbWFuZHMiLCJuYW1lIiwiZXhlYyIsImVkaXRvciIsInNlbGVjdEFsbCIsImNlbnRlclNlbGVjdGlvbiIsIm5hdmlnYXRlTGV2ZWxVcCIsIm5hdmlnYXRlTGV2ZWxEb3duIiwiZWRpdG9yS2V5IiwibmF2aWdhdGVTdGFydCIsIm5hdmlnYXRlRW5kIiwiZWQiLCJwcm92aWRlciIsImNsb3NlIiwic2VsZWN0aW9uIiwiZ2V0Q3Vyc29yIiwib3BlbiIsInNjcm9sbFBhZ2VVcCIsImdvdG9QYWdlVXAiLCJzY3JvbGxQYWdlRG93biIsImdvdG9QYWdlRG93biIsImUiLCJyZW5kZXJlciIsInNjcm9sbEJ5IiwibGF5ZXJDb25maWciLCJsaW5lSGVpZ2h0IiwiYXJncyIsImluc2VydFN0aW5nIiwibW92ZVNlbGVjdGlvbiIsInRyZWUiLCJlZGl0Iiwic3RhcnRSZW5hbWUiLCJfZW1pdCIsInJvb3QiLCJyZXZlYWwiLCJsYW5nIiwib29wIiwibmV0IiwiQXBwQ29uZmlnIiwiZ2xvYmFsIiwib3B0aW9ucyIsInBhY2thZ2VkIiwid29ya2VyUGF0aCIsIm1vZGVQYXRoIiwidGhlbWVQYXRoIiwiYmFzZVBhdGgiLCJzdWZmaXgiLCIkbW9kdWxlVXJscyIsImdldCIsImtleSIsImhhc093blByb3BlcnR5IiwiRXJyb3IiLCJzZXQiLCJ2YWx1ZSIsImFsbCIsImNvcHlPYmplY3QiLCJtb2R1bGVVcmwiLCJjb21wb25lbnQiLCJwYXJ0cyIsInNwbGl0IiwibGVuZ3RoIiwiYmFzZSIsInJlcGxhY2UiLCJwYXRoIiwic2xpY2UiLCJzZXRNb2R1bGVVcmwiLCJzdWJzdCIsIiRsb2FkaW5nIiwibG9hZE1vZHVsZSIsIm1vZHVsZU5hbWUiLCJvbkxvYWQiLCJpc0RhcmsiLCJjc3NDbGFzcyIsImNzc1RleHQiLCJkb20iLCJpbXBvcnRDc3NTdHJpbmciLCJTY3JvbGxhYmxlIiwiZXNjYXBlSFRNTCIsIkRhdGFQcm92aWRlciIsInJvd0hlaWdodCIsInNldFJvb3QiLCJ1bmRlZmluZWQiLCJyb3dIZWlnaHRJbm5lciIsIiRpbmRlbnRTaXplIiwiaW1wbGVtZW50IiwiJHNvcnROb2RlcyIsIkFycmF5IiwiaXNBcnJheSIsIml0ZW1zIiwiJGRlcHRoIiwidmlzaWJsZUl0ZW1zIiwidW5zaGlmdCIsIiRzZWxlY3RlZE5vZGUiLCJfc2lnbmFsIiwiZXhwYW5kIiwibm9kZSIsImRlZXAiLCJzaWxlbnQiLCJpc09wZW4iLCJjaCIsImdldENoaWxkcmVuIiwibG9hZENoaWxkcmVuIiwic2hvdWxkTG9hZENoaWxkcmVuIiwidGltZXIiLCJzZXRUaW1lb3V0Iiwic3RhdHVzIiwiYmluZCIsImVyciIsImNsZWFyVGltZW91dCIsImNvbGxhcHNlIiwic2V0T3BlbiIsImkiLCJpbmRleE9mIiwiZm9yY2VFbXB0eSIsImNvbmNhdCIsInNwbGljZSIsImFwcGx5IiwiaiIsImNoaWxkTm9kZSIsInJvd3MiLCJpc1Jvb3QiLCJ0aGlzRGVwdGgiLCJkZWxldGVjb3VudCIsInQiLCJ0b2dnbGVOb2RlIiwic29ydCIsImNoaWxkcmVuIiwiY29tcGFyZSIsImFscGhhbnVtQ29tcGFyZSIsImEiLCJiIiwiYUNoaWxkcmVuIiwibWFwIiwiYkNoaWxkcmVuIiwibGFiZWwiLCJzZXRGaWx0ZXIiLCJmbiIsIiRmaWx0ZXJGbiIsIk9iamVjdCIsImtleXMiLCJwYXJlbnQiLCJkIiwiZm9yRWFjaCIsIm4iLCJmaWx0ZXIiLCIkc29ydGVkIiwiaGFzQ2hpbGRyZW4iLCJmaW5kTm9kZUJ5UGF0aCIsImdldFNpYmxpbmciLCJkaXIiLCJwb3MiLCJnZXROb2RlQXRJbmRleCIsImdldEluZGV4Rm9yTm9kZSIsImdldE1pbkluZGV4IiwiZ2V0TWF4SW5kZXgiLCJ2YWwiLCJpc1Zpc2libGUiLCJpc1NlbGVjdGVkIiwic2V0U2VsZWN0ZWQiLCJpc1NlbGVjdGFibGUiLCJub1NlbGVjdCIsImlzQW5jZXN0b3IiLCJjaGlsZCIsInNldEF0dHJpYnV0ZSIsImdldERhdGFSYW5nZSIsImNvbHVtbnMiLCJjYWxsYmFjayIsInZpZXciLCJzdGFydCIsImdldFJhbmdlIiwidG9wIiwiYm90dG9tIiwiTWF0aCIsImZsb29yIiwiZW5kIiwiY2VpbCIsInJhbmdlIiwiY291bnQiLCJzaXplIiwiZ2V0VG90YWxIZWlnaHQiLCJnZXROb2RlUG9zaXRpb24iLCJoZWlnaHQiLCJmaW5kSXRlbUF0T2Zmc2V0Iiwib2Zmc2V0IiwiY2xpcCIsImluZGV4IiwibWluIiwibWF4IiwiZ2V0SWNvbkhUTUwiLCJnZXRDbGFzc05hbWUiLCJjbGFzc05hbWUiLCJzZXRDbGFzcyIsImluY2x1ZGUiLCJzZXRDc3NDbGFzcyIsInJlZHJhd05vZGUiLCJnZXRDYXB0aW9uSFRNTCIsImdldENvbnRlbnRIVE1MIiwiZ2V0RW1wdHlNZXNzYWdlIiwiZW1wdHlNZXNzYWdlIiwiZ2V0VGV4dCIsImdldFJvd0luZGVudCIsImhpZGVBbGxOb2RlcyIsInNob3dBbGxOb2RlcyIsImNhbGwiLCJwcm90b3R5cGUiLCJjYXNlT3JkZXIiLCJ4IiwibCIsImNoMSIsImNoYXJDb2RlQXQiLCJjaDIiLCJudW0xIiwibnVtMiIsImNoMUwiLCJ0b0xvd2VyQ2FzZSIsImNoMkwiLCJ2YXJpYWJsZUhlaWdodFJvd01peGluIiwicmVzZXQiLCIkY2FjaGVkVG90YWxIZWlnaHQiLCJvbiIsImdldEl0ZW1IZWlnaHQiLCJmaW5kSW5kZXhBdE9mZnNldCIsInN0YXJ0SCIsIkV2ZW50RW1pdHRlciIsIkNlbGxzIiwicGFyZW50RWwiLCJlbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwiY29uZmlnIiwic2V0RGF0YVByb3ZpZGVyIiwidXBkYXRlIiwicmVuZGVyUm93IiwiJGN1c3RvbVVwZGF0ZSIsIiR0cmVlTW9kZVVwZGF0ZSIsIm1lYXN1cmVTaXplcyIsImRvbU5vZGUiLCJmaXJzdENoaWxkIiwib2Zmc2V0SGVpZ2h0IiwiY2xpZW50SGVpZ2h0Iiwicm93IiwiaHRtbCIsImRhdGFyb3ciLCJmaXJzdFJvdyIsImxhc3RSb3ciLCJoc2l6ZSIsInZzaXplIiwiJHJlbmRlclJvdyIsInJlbmRlclBsYWNlSG9sZGVyIiwiaW5uZXJIVE1MIiwiam9pbiIsImNvbHVtbk5vZGUiLCJjb2x1bW4iLCJmdWxsV2lkdGgiLCIkd2lkdGgiLCJnZXRSb3dDbGFzcyIsImluZGVudCIsInB1c2giLCIkZml4ZWRXaWR0aCIsInR5cGUiLCJkZXB0aCIsImdldENoZWNrYm94SFRNTCIsImNvbCIsInJvd1N0ciIsImdldEhUTUwiLCJ1cGRhdGVDbGFzc2VzIiwidXBkYXRlTm9kZSIsImVsIiwic2Nyb2xsIiwiaW5zZXJ0QWRqYWNlbnRIVE1MIiwidXBkYXRlUm93cyIsImRlc3Ryb3kiLCJnZXREb21Ob2RlQXRJbmRleCIsInJlbmRlckVtcHR5TWVzc2FnZSIsIlJFU0laRVJfV0lEVEgiLCJnZXRDb2x1bW5UZXh0IiwiZGVmYXVsdFZhbHVlIiwiQ29sdW1uSGVhZGVyIiwidmlzaWJsZSIsIm1pbldpZHRoIiwiY2FwdGlvbiIsInN0eWxlIiwicGFkZGluZ1JpZ2h0IiwiZml4ZWRXaWR0aCIsInciLCJ3aWR0aCIsImZsZXgiLCJwYXJzZUludCIsInBpeGVsV2lkdGgiLCJ1cGRhdGVXaWR0aCIsImZsZXhXaWR0aCIsImNoYW5nZUNvbHVtbldpZHRoIiwiY2hhbmdlZENvbHVtbiIsImR3IiwidG90YWwiLCJuZXh0Q29sIiwicHJldkNvbCIsImZpbmRDb2x1bW4iLCJvZmZzZXRXaWR0aCIsIm92ZXJSZXNpemVyIiwiU2VsZWN0aW9uIiwibWFya2VyRWwiLCJhcnJvd0VsIiwibWFya2VkRm9sZGVyIiwibWFya2VkRm9sZGVyVHlwZSIsImNsZWFyRm9sZGVyTWFya2VyIiwic2hvd0ZvbGRlck1hcmtlciIsImNsZWFySW5zZXJ0aW9uTWFya2VyIiwic2hvd0luc2VydGlvbk1hcmtlciIsImxlZnQiLCJyaWdodCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCIsImNsZWFyIiwiY2xlYXJJbnNlcnRNYXJrZXIiLCJEUkFHX09GRlNFVCIsIkRlZmF1bHRIYW5kbGVycyIsIm1vdXNlSGFuZGxlciIsIiRjbGlja1NlbGVjdGlvbiIsInNldERlZmF1bHRIYW5kbGVyIiwib25Nb3VzZURvd24iLCJvbkRvdWJsZUNsaWNrIiwib25Nb3VzZUxlYXZlIiwib25Nb3VzZU1vdmUiLCJvbk1vdXNlV2hlZWwiLCJvbk1vdXNlVXAiLCJvbkNsaWNrIiwiaXNUb2dnbGVyQ2xpY2siLCJ0YXJnZXQiLCJoYXNDc3NDbGFzcyIsImdldE5vZGUiLCJ0aXRsZSIsImdldERvY3VtZW50UG9zaXRpb24iLCJjb2x1bW5EYXRhIiwiJGhlYWRpbmdMYXllciIsImdldFRvb2x0aXBUZXh0IiwidG9vbHRpcCIsImNvbnRhaW5lciIsInVwZGF0ZUhvdmVyU3RhdGUiLCJldiIsImRldGFpbCIsIm1vdXNlZG93bkV2ZW50IiwiZGVsYXllZFNlbGVjdCIsImlzTW91c2VQcmVzc2VkIiwiYnV0dG9uIiwiZ2V0QnV0dG9uIiwic2VsZWN0ZWROb2RlcyIsImdldFNlbGVjdGVkTm9kZXMiLCJpc011bHRpU2VsZWN0IiwiJGNsaWNrTm9kZSIsImluU2VsZWN0aW9uIiwiZG9tRXZlbnQiLCJyZWdpb24iLCJjbGlja0FjdGlvbiIsInRvZ2dsZUNoaWxkcmVuIiwiZ2V0U2hpZnRLZXkiLCJnZXRBY2NlbEtleSIsIm5vZGVzIiwiaXNDaGVja2VkIiwiZXhwYW5kU2VsZWN0aW9uIiwidG9nZ2xlU2VsZWN0IiwiaXNGb2N1c2VkIiwic2V0U2VsZWN0aW9uIiwiJG1vdXNlSGFuZGxlciIsImNhcHR1cmVNb3VzZSIsInByZXZlbnREZWZhdWx0IiwieSIsIm9uTW91c2VFdmVudCIsIm1vdXNlRXZlbnQiLCJkcmFnTW92ZVNlbGVjdGlvbiIsIiRwb3MiLCJzZWxlY3ROb2RlIiwic2Nyb2xsQ2FyZXRJbnRvVmlldyIsImRyYWdXYWl0IiwiYWJzIiwic3RhdGUiLCJzZXRTdGF0ZSIsImRyYWdXYWl0RW5kIiwidGltZVN0YW1wIiwiZHQiLCIkbGFzdFNjcm9sbFRpbWUiLCJpc1Njcm9sYWJsZSIsImlzU2Nyb2xsYWJsZUJ5Iiwid2hlZWxYIiwic3BlZWQiLCJ3aGVlbFkiLCJzdG9wIiwiZXZlbnQiLCJ1c2VyYWdlbnQiLCJNb3VzZUV2ZW50IiwiaW5pdERyYWdIYW5kbGVycyIsIlVORk9MRF9USU1FT1VUIiwiV0lER0VUX1VORk9MRF9USU1FT1VUIiwiQVVUT1NDUk9MTF9ERUxBWSIsIk1JTl9EUkFHX1QiLCJkcmFnSW5mbyIsImR4IiwiZHkiLCJzY3JvbGxlclJlY3QiLCJkcmFnIiwiaXNJblRyZWUiLCJpc0luUmVjdCIsIm9mZnNldFkiLCJvZmZzZXRYIiwiaG92ZXJOb2RlIiwieE9mZnNldCIsImRlcHRoRGlmZiIsImlzRm9sZGVyIiwibW9kZSIsImhpZ2hsaWdodEZvbGRlciIsImluc2VydFBvcyIsIm5vdyIsIkRhdGUiLCJpc0ZvbGRXaWRnZXQiLCJkaXN0YW5jZSIsImF1dG9TY3JvbGxNYXJnaW4iLCIkc2l6ZSIsInNjcm9sbGVySGVpZ2h0IiwiYXV0b1Njcm9sbCIsInN0b3BUaW1lIiwiSW5maW5pdHkiLCJkcmFnRW5kIiwiY2FuY2VsIiwid2luZG93IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImtleUhhbmRsZXIiLCJ2aXN1YWxpemVGb2N1cyIsInNldFN0eWxlIiwic3RhcnRUIiwiZHJhZ1N0YXJ0IiwidmlzdWFsaXplQmx1ciIsInNjcm9sbGVyIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiZ2V0T3B0aW9uIiwiYWRkRXZlbnRMaXN0ZW5lciIsImNvbnN0cnVjdERyYWdOb2RlIiwiJGNlbGxMYXllciIsImRvY3VtZW50IiwiY2xvbmVOb2RlIiwib3BhY2l0eSIsInBvc2l0aW9uIiwiekluZGV4IiwicG9pbnRlckV2ZW50cyIsIm92ZXJmbG93IiwiY29sb3IiLCJib2R5Iiwia2V5Q29kZSIsInN0b3BFdmVudCIsImlzQ29weSIsIiRsb29wIiwic2NoZWR1bGUiLCJDSEFOR0VfTUFSS0VSIiwicmVjdCIsIkhlYWRpbmdIYW5kbGVyIiwiaGVhZGluZ0xheWVyIiwiYWRkTGlzdGVuZXIiLCJkcmFnU3RhcnRQb3MiLCJzY3JvbGxlcldpZHRoIiwiY3Vyc29yIiwiaGVhZGVyUmVzaXplIiwidXBkYXRlRnVsbCIsImhlYWRlclJlc2l6ZUVuZCIsImNsaWVudFgiLCJjbGllbnRZIiwiJGluU2VsZWN0aW9uIiwicHJvcGFnYXRpb25TdG9wcGVkIiwiZGVmYXVsdFByZXZlbnRlZCIsInN0b3BQcm9wYWdhdGlvbiIsInNjcmVlblRvVGV4dENvb3JkaW5hdGVzIiwic2hpZnRLZXkiLCJpc01hYyIsIm1ldGFLZXkiLCJjdHJsS2V5IiwiTW91c2VIYW5kbGVyIiwibW91c2VUYXJnZXQiLCJnZXRNb3VzZUV2ZW50VGFyZ2V0IiwiZm9jdXMiLCJhZGRNdWx0aU1vdXNlRG93bkxpc3RlbmVyIiwic2Nyb2xsQmFyViIsImlubmVyIiwic2Nyb2xsQmFySCIsImFkZE1vdXNlV2hlZWxMaXN0ZW5lciIsIiRzY3JvbGxTcGVlZCIsIiRrZWVwVGV4dEFyZWFBdEN1cnNvciIsInNlbGYiLCIkbW91c2VNb3ZlZCIsIm9uQ2FwdHVyZUVuZCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lcklkIiwib25DYXB0dXJlSW50ZXJ2YWwiLCIkbW92ZVRleHRBcmVhVG9DdXJzb3IiLCIkb25DYXB0dXJlTW91c2VNb3ZlIiwicmVsZWFzZU1vdXNlIiwiaXNPbGRJRSIsImNhcHR1cmUiLCJzZXRJbnRlcnZhbCIsImRlZmluZU9wdGlvbnMiLCJzY3JvbGxTcGVlZCIsImluaXRpYWxWYWx1ZSIsImRyYWdEZWxheSIsImZvY3VzVGltZW91dCIsImVuYWJsZURyYWdEcm9wIiwicXVpY2tTZWFyY2giLCJzdHIiLCJzaWJsaW5ncyIsIm5ld05vZGUiLCJzY3JvbGxhYmxlIiwiJHNjcm9sbFRvcCIsImdldFNjcm9sbFRvcCIsInNldFNjcm9sbFRvcCIsInNjcm9sbFRvcCIsInJvdW5kIiwiaXNOYU4iLCIkc2Nyb2xsTGVmdCIsImdldFNjcm9sbExlZnQiLCJzZXRTY3JvbGxMZWZ0Iiwic2Nyb2xsTGVmdCIsInNlbGVjdGVkSXRlbXMiLCJ1bnNlbGVjdFJlbW92ZWQiLCIkd3JhcEFyb3VuZCIsInNlbCIsInNlbGVjdCIsImFkZCIsImFuY2hvciIsImdldEFuY2hvciIsInVuc2VsZWN0Tm9kZSIsIndyYXBwZWQiLCJuZXdJIiwiZ2V0VmlzaWJsZVNlbGVjdGVkTm9kZXMiLCJpc0VtcHR5IiwiaXNNdWx0aVJvdyIsInJlbW92ZSIsImNsZWFyU2VsZWN0aW9uIiwiYWRkaXRpdmUiLCJ0b1JlbW92ZSIsImNoYW5nZWQiLCJSZW5kZXJlciIsIlZpcnR1YWxSZW5kZXJlciIsIlRleHRJbnB1dCIsIktleUJpbmRpbmciLCJDb21tYW5kTWFuYWdlciIsImRlZmF1bHRDb21tYW5kcyIsIlRyZWUiLCJjZWxsV2lkdGgiLCJjZWxsSGVpZ2h0IiwiJHRvRGVzdHJveSIsInRleHRJbnB1dCIsImtleUJpbmRpbmciLCIkYmxvY2tTY3JvbGxpbmciLCJfc2VsZiIsInNlbGVjdGlvbkNoYW5nZWQiLCJyZXNldE9wdGlvbnMiLCJvbGRQcm92aWRlciIsIm9mZiIsIiRvbkNhcmV0Q2hhbmdlIiwiJG9uU2VsZWN0aW9uQ2hhbmdlIiwiJG9uQ2hhbmdlQ2xhc3MiLCIkcmVkcmF3IiwiJG9uU2Nyb2xsVG9wQ2hhbmdlIiwiJG9uU2Nyb2xsTGVmdENoYW5nZSIsIm1vZGVsIiwicmVkcmF3Iiwib25DYXJldENoYW5nZSIsIm9uU2VsZWN0aW9uQ2hhbmdlIiwib25TY3JvbGxUb3BDaGFuZ2UiLCJvblNjcm9sbExlZnRDaGFuZ2UiLCJnZXRMZW5ndGgiLCJnZXRMaW5lIiwiZ2V0RGF0YVByb3ZpZGVyIiwiZ2V0U2VsZWN0aW9uIiwicmVzaXplIiwiZm9yY2UiLCJvblJlc2l6ZSIsIm9uY2UiLCJibHVyIiwib25Gb2N1cyIsIiRpc0ZvY3VzZWQiLCJvbkJsdXIiLCJzY3JvbGxUb1kiLCJzY3JvbGxUb1giLCJ1cGRhdGVDYXJldCIsImV4ZWNDb21tYW5kIiwiY29tbWFuZCIsIm9uVGV4dElucHV0IiwidGV4dCIsIm9uQ29tbWFuZEtleSIsImhhc2hJZCIsInN0YXJ0RmlsdGVyIiwic2V0VGhlbWUiLCJ0aGVtZSIsIiRnZXRTZWxlY3RlZFJvd3MiLCJnZXRTZWxlY3Rpb25SYW5nZSIsImNvbGxhcHNlUm93cyIsImZpcnN0IiwibGFzdCIsImdldFZpc2libGVOb2RlcyIsInRvbGVyYW5jZSIsImlzTm9kZVZpc2libGUiLCIkbW92ZUJ5UGFnZSIsImFuaW1hdGVTY3JvbGxpbmciLCJzZWxlY3RQYWdlRG93biIsInNlbGVjdFBhZ2VVcCIsInNjcm9sbFRvUm93IiwiY2VudGVyIiwiYW5pbWF0ZSIsImFsaWduQ2FyZXQiLCJnZXRDdXJzb3JQb3NpdGlvbiIsImdldEN1cnNvclBvc2l0aW9uU2NyZWVuIiwic2Vzc2lvbiIsImRvY3VtZW50VG9TY3JlZW5Qb3NpdGlvbiIsIm1vdmVDYXJldFRvIiwibW92ZUNhcmV0VG9Qb3NpdGlvbiIsImdvdG9Sb3ciLCJyb3dOdW1iZXIiLCJpc1Jvd0Z1bGx5VmlzaWJsZSIsIm5hdmlnYXRlVG8iLCJuYXZpZ2F0ZVVwIiwibmF2aWdhdGUiLCIkc2Nyb2xsSW50b1ZpZXciLCJuYXZpZ2F0ZURvd24iLCJnZXRGaXJzdE5vZGUiLCJnZXRMYXN0Tm9kZSIsImdldENvcHlUZXh0Iiwib25QYXN0ZSIsInVuZG8iLCJnZXRVbmRvTWFuYWdlciIsInJlZG8iLCJnZXRSZWFkT25seSIsInNldEhvckhlYWRpbmdWaXNpYmxlIiwic2V0VmVySGVhZGluZ1Zpc2libGUiLCJlbmFibGUiLCIkZGlzYWJsZWQiLCJkaXNhYmxlIiwidG9nZ2xlIiwicmVhZE9ubHkiLCJzZXRSZWFkT25seSIsImFuaW1hdGVkU2Nyb2xsIiwibWF4TGluZXMiLCJtaW5MaW5lcyIsIkNlbGxMYXllciIsIk1hcmtlckxheWVyIiwiSGVhZGVyTGF5ZXIiLCJTY3JvbGxCYXJIIiwiU2Nyb2xsQmFyViIsIlJlbmRlckxvb3AiLCJwaXZvdENzcyIsImRlZmF1bHRUaGVtZSIsImFkZENzc0NsYXNzIiwiY2VsbHMiLCIkbWFya2VyTGF5ZXIiLCJjYW52YXMiLCIkaG9yaXpTY3JvbGwiLCJzZXRWaXNpYmxlIiwiJGluU2Nyb2xsQW5pbWF0aW9uIiwiZGF0YSIsInNjcm9sbE1hcmdpbiIsImNhcmV0UG9zIiwiaGVhZGluZ0hlaWdodCIsInBhZGRpbmciLCJmaXJzdFJvd1NjcmVlbiIsImNoYXJhY3RlcldpZHRoIiwibWluSGVpZ2h0IiwibWF4SGVpZ2h0IiwidiIsImgiLCIkcmVuZGVyQ2hhbmdlcyIsIm93bmVyRG9jdW1lbnQiLCJkZWZhdWx0VmlldyIsIkNIQU5HRV9GVUxMIiwiJHdpbmRvd0ZvY3VzIiwiQ0hBTkdFX1NDUk9MTCIsIkNIQU5HRV9DT0xVTU4iLCJDSEFOR0VfUk9XIiwiQ0hBTkdFX0NFTExTIiwiQ0hBTkdFX1NJWkUiLCJDSEFOR0VfQ0xBU1MiLCJDSEFOR0VfSF9TQ1JPTEwiLCJoZWFkZXJIZWlnaHQiLCIkY2hhbmdlZExpbmVzIiwidXBkYXRlQ2VsbHMiLCJ1cGRhdGVIb3Jpem9udGFsSGVhZGluZ3MiLCJ1cGRhdGVWZXJ0aWNhbEhlYWRpbmdzIiwiJGNoYW5nZXMiLCJyZXNpemluZyIsInNjcm9sbEhlaWdodCIsImNsaWVudFdpZHRoIiwic2Nyb2xsV2lkdGgiLCJjaGFuZ2VzIiwiJHVwZGF0ZUNhY2hlZFNpemUiLCJnZXRIZWlnaHQiLCJjYXJldCIsImdldFdpZHRoIiwiJHRyZWVMYXllciIsInZSYW5nZSIsImhSYW5nZSIsImdldENvbnRhaW5lckVsZW1lbnQiLCJub2RlUG9zIiwiJHVwZGF0ZVNjcm9sbEJhciIsIiR1cGRhdGVTY3JvbGxCYXJIIiwiJHVwZGF0ZVNjcm9sbEJhclYiLCJzZXRTY3JvbGxNYXJnaW4iLCJzbSIsInNldElubmVySGVpZ2h0Iiwic2V0SW5uZXJXaWR0aCIsIm1heFdpZHRoIiwiJGZyb3plbiIsImZyZWV6ZSIsInVuZnJlZXplIiwiJGNvbXB1dGVMYXllckNvbmZpZyIsIm1hcmdpblRvcCIsInZPZmZzZXQiLCJtYXJnaW5MZWZ0IiwiaE9mZnNldCIsIiRob3JIZWFkaW5nTGF5ZXIiLCIkYXV0b3NpemUiLCJnZXRNYXhIZWlnaHQiLCIkbWF4TGluZXMiLCJkZXNpcmVkSGVpZ2h0IiwiJG1pbkxpbmVzIiwidlNjcm9sbCIsIiR2U2Nyb2xsIiwidmVydGljYWwiLCJob3Jpem9udGFsIiwiaGlkZVNjcm9sbGJhcnMiLCJob3JpelNjcm9sbCIsIiRoU2Nyb2xsQmFyQWx3YXlzVmlzaWJsZSIsImhTY3JvbGxDaGFuZ2VkIiwiJHZTY3JvbGxCYXJBbHdheXNWaXNpYmxlIiwidlNjcm9sbENoYW5nZWQiLCJyb3dDb3VudCIsImNvbENvdW50IiwiZmlyc3RDb2wiLCJsYXN0Q29sIiwiZGlzY2FyZCIsIiR1cGRhdGVSb3dzIiwic2Nyb2xsU2VsZWN0aW9uSW50b1ZpZXciLCJsZWFkIiwiZ2V0U2Nyb2xsVG9wUm93IiwiZ2V0U2Nyb2xsQm90dG9tUm93IiwiYWxpZ25tZW50IiwiZmluZE5vZGVCeUluZGV4IiwiZmluZFNpemVBdEluZGV4IiwiU1RFUFMiLCIkY2FsY1N0ZXBzIiwiZnJvbVZhbHVlIiwidG9WYWx1ZSIsInN0ZXBzIiwiZnVuYyIsInhfbWluIiwicG93IiwiaW5pdGlhbFNjcm9sbCIsIiRhbmltYXRlZFNjcm9sbCIsIiRzY3JvbGxBbmltYXRpb24iLCJvbGRTdGVwcyIsImZyb20iLCJ0byIsIiR0aW1lciIsInNoaWZ0IiwiZGVsdGFYIiwiZGVsdGFZIiwiY2FudmFzUG9zIiwidGV4dFRvU2NyZWVuQ29vcmRpbmF0ZXMiLCJmaW5kTm9kZUF0IiwiY29vcmRzIiwicmVtb3ZlQ3NzQ2xhc3MiLCJjYiIsIiR0aGVtZVZhbHVlIiwiX2Rpc3BhdGNoRXZlbnQiLCJhZnRlckxvYWQiLCIkdGhlbWUiLCIkcGFkZGluZyIsInNldFBhZGRpbmciLCJnZXRUaGVtZSIsInVuc2V0U3R5bGUiLCJzaG93SW52aXNpYmxlcyIsInNldFNob3dJbnZpc2libGVzIiwiQ0hBTkdFX1RFWFQiLCJzaG93UHJpbnRNYXJnaW4iLCIkdXBkYXRlUHJpbnRNYXJnaW4iLCJwcmludE1hcmdpbkNvbHVtbiIsInByaW50TWFyZ2luIiwiJHByaW50TWFyZ2luQ29sdW1uIiwiJHNob3dQcmludE1hcmdpbiIsImRpc3BsYXlJbmRlbnRHdWlkZXMiLCJzaG93Iiwic2V0RGlzcGxheUluZGVudEd1aWRlcyIsImhTY3JvbGxCYXJBbHdheXNWaXNpYmxlIiwiYWx3YXlzVmlzaWJsZSIsInZTY3JvbGxCYXJBbHdheXNWaXNpYmxlIiwiZm9udFNpemUiLCJ1cGRhdGVGb250U2l6ZSIsImZvbnRGYW1pbHkiLCJzY3JvbGxQYXN0RW5kIiwiJHNjcm9sbFBhc3RFbmQiLCJoYW5kbGVzU2V0Il0sInNvdXJjZVJvb3QiOiIifQ==