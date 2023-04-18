/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 17989:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var keys = __webpack_require__(11797);
var useragent = __webpack_require__(50618);

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

/***/ 11797:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

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



var oop = __webpack_require__(89359);

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

/***/ 89359:
/***/ ((__unused_webpack_module, exports) => {



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

/***/ 50618:
/***/ ((__unused_webpack_module, exports) => {



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

/***/ 21705:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87537);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".toggle-block {\n    position: absolute;\n    /*border: 1px solid black;*/\n}\n\n\n.toggle-bar {\n    display:flex;\n    background: #cecece;\n    color: #111;\n    align-items: stretch;\n    justify-content: stretch;\n    overflow: hidden;\n    position: absolute;\n    user-select: none;\n    cursor: pointer;\n}\n.toggleBlockDragging {\n    pointer-events: none;\n    overflow-y: hidden;\n}\n.toggleBlockDragging  .title{\n    pointer-events: none;\n}\n\n.toggle-bar .title {\n    position: absolute;\n    top: auto;\n    left: auto;\n    width: auto;\n    height: auto;\n}\n\n.toggle-bar-h {\n    width: 20px;\n    height: 100%;\n}\n\n.toggle-bar-v {\n    height: 20px;\n    width: 100%;\n}\n.toggle-bar-h div {\n    margin-left: -2px;\n    width: 5px;\n    height: 100%\n}\n.toggle-bar-v div {\n    margin-top: -2px;\n    height: 5px;\n}", "",{"version":3,"sources":["webpack://./packages/ace-layout/styles/accordion.css"],"names":[],"mappings":"AAAA;IACI,kBAAkB;IAClB,2BAA2B;AAC/B;;;AAGA;IACI,YAAY;IACZ,mBAAmB;IACnB,WAAW;IACX,oBAAoB;IACpB,wBAAwB;IACxB,gBAAgB;IAChB,kBAAkB;IAClB,iBAAiB;IACjB,eAAe;AACnB;AACA;IACI,oBAAoB;IACpB,kBAAkB;AACtB;AACA;IACI,oBAAoB;AACxB;;AAEA;IACI,kBAAkB;IAClB,SAAS;IACT,UAAU;IACV,WAAW;IACX,YAAY;AAChB;;AAEA;IACI,WAAW;IACX,YAAY;AAChB;;AAEA;IACI,YAAY;IACZ,WAAW;AACf;AACA;IACI,iBAAiB;IACjB,UAAU;IACV;AACJ;AACA;IACI,gBAAgB;IAChB,WAAW;AACf","sourcesContent":[".toggle-block {\n    position: absolute;\n    /*border: 1px solid black;*/\n}\n\n\n.toggle-bar {\n    display:flex;\n    background: #cecece;\n    color: #111;\n    align-items: stretch;\n    justify-content: stretch;\n    overflow: hidden;\n    position: absolute;\n    user-select: none;\n    cursor: pointer;\n}\n.toggleBlockDragging {\n    pointer-events: none;\n    overflow-y: hidden;\n}\n.toggleBlockDragging  .title{\n    pointer-events: none;\n}\n\n.toggle-bar .title {\n    position: absolute;\n    top: auto;\n    left: auto;\n    width: auto;\n    height: auto;\n}\n\n.toggle-bar-h {\n    width: 20px;\n    height: 100%;\n}\n\n.toggle-bar-v {\n    height: 20px;\n    width: 100%;\n}\n.toggle-bar-h div {\n    margin-left: -2px;\n    width: 5px;\n    height: 100%\n}\n.toggle-bar-v div {\n    margin-top: -2px;\n    height: 5px;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 75715:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87537);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".blackbutton {\n    background-image: linear-gradient(to bottom, #4c4c4c 0%, #434343 52%, #333333 52%, #454545 100%);\n    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.125) inset, 0px 1px rgba(255, 255, 255, 0.125);\n    border: 1px solid #042440;\n    border-radius: 3px;\n    color: #d0e3ce;\n    text-shadow: 0;\n    height: 27px;\n    line-height: 27px;\n    padding: 0 11px;\n    text-align: center;\n    cursor: default;\n    font-weight: normal;\n    -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;\n}\n.blackbuttonDisabled {\n    color: rgba(220, 235, 219, 0.5);\n}\n.blackbuttonFocus {\n    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.125) inset, 0px 1px rgba(255, 255, 255, 0.125), 0 0 6px 1px rgba(255, 255, 255, 0.1) inset;\n}\n.blackbuttonOver {\n    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.125) inset, 0px 1px rgba(255, 255, 255, 0.125), 0 0 0 1000px rgba(158, 169, 156, 0.08) inset;\n}\n.blackbuttonDown {\n    box-shadow: 0 0 3px 2px #343434 inset;\n}", "",{"version":3,"sources":["webpack://./packages/ace-layout/styles/button.css"],"names":[],"mappings":"AAAA;IACI,gGAAgG;IAChG,wFAAwF;IACxF,yBAAyB;IACzB,kBAAkB;IAClB,cAAc;IACd,cAAc;IACd,YAAY;IACZ,iBAAiB;IACjB,eAAe;IACf,kBAAkB;IAClB,eAAe;IACf,mBAAmB;IACnB,mCAAmC,CAAC,kCAAkC;AAC1E;AACA;IACI,+BAA+B;AACnC;AACA;IACI,oIAAoI;AACxI;AACA;IACI,sIAAsI;AAC1I;AACA;IACI,qCAAqC;AACzC","sourcesContent":[".blackbutton {\n    background-image: linear-gradient(to bottom, #4c4c4c 0%, #434343 52%, #333333 52%, #454545 100%);\n    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.125) inset, 0px 1px rgba(255, 255, 255, 0.125);\n    border: 1px solid #042440;\n    border-radius: 3px;\n    color: #d0e3ce;\n    text-shadow: 0;\n    height: 27px;\n    line-height: 27px;\n    padding: 0 11px;\n    text-align: center;\n    cursor: default;\n    font-weight: normal;\n    -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;\n}\n.blackbuttonDisabled {\n    color: rgba(220, 235, 219, 0.5);\n}\n.blackbuttonFocus {\n    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.125) inset, 0px 1px rgba(255, 255, 255, 0.125), 0 0 6px 1px rgba(255, 255, 255, 0.1) inset;\n}\n.blackbuttonOver {\n    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.125) inset, 0px 1px rgba(255, 255, 255, 0.125), 0 0 0 1000px rgba(158, 169, 156, 0.08) inset;\n}\n.blackbuttonDown {\n    box-shadow: 0 0 3px 2px #343434 inset;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 86800:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87537);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(61667);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(37113), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".black_dropdown {\n    display: inline-block;\n    position: relative;\n    overflow: hidden;\n    height: 21px;\n    border-radius: 3px;\n    border: 1px solid #1c1c1c;\n    background: #383838 linear-gradient(0deg, #323232 0%, #383838 100%);\n    box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.15) inset, 0px 1px 0px 0px rgba(255, 255, 255, 0.1);\n    text-shadow: none;\n    min-height: 19px !important;\n    max-height: 19px !important;\n}\n.black_dropdown .lbl {\n    position: relative;\n    overflow: hidden;\n    height: 17px;\n    padding: 4px 0 0 6px;\n    margin: 0 19px 0 0;\n    font-family: Arial, Helvetica, sans-serif;\n    font-size: 12px;\n    color: #c0dabe;\n    line-height: 13px;\n    border-right: 1px solid #1c1c1c;\n    cursor: default;\n    white-space: nowrap;\n}\n.black_dropdown .button {\n    width: 19px;\n    border-left: 1px solid #4d4c4d;\n    bottom: 0;\n    position: absolute;\n    top: 0;\n    right: 0;\n    background-repeat: no-repeat;\n    background-image: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ");\n    background-size: 9px 13px;\n    background-position: 4px 4px;\n}\n.black_dropdownOver {\n    background-image: linear-gradient(0deg, #2f2f2f 0%, #3f3f3f 100%);\n}\n.black_dropdownDown {\n    background: #2d2d2d linear-gradient(0deg, #2d2d2d 0%, #363636 100%);\n}", "",{"version":3,"sources":["webpack://./packages/ace-layout/styles/dropdown.css"],"names":[],"mappings":"AAAA;IACI,qBAAqB;IACrB,kBAAkB;IAClB,gBAAgB;IAChB,YAAY;IACZ,kBAAkB;IAClB,yBAAyB;IACzB,mEAAmE;IACnE,iGAAiG;IACjG,iBAAiB;IACjB,2BAA2B;IAC3B,2BAA2B;AAC/B;AACA;IACI,kBAAkB;IAClB,gBAAgB;IAChB,YAAY;IACZ,oBAAoB;IACpB,kBAAkB;IAClB,yCAAyC;IACzC,eAAe;IACf,cAAc;IACd,iBAAiB;IACjB,+BAA+B;IAC/B,eAAe;IACf,mBAAmB;AACvB;AACA;IACI,WAAW;IACX,8BAA8B;IAC9B,SAAS;IACT,kBAAkB;IAClB,MAAM;IACN,QAAQ;IACR,4BAA4B;IAC5B,yDAAmE;IACnE,yBAAyB;IACzB,4BAA4B;AAChC;AACA;IACI,iEAAiE;AACrE;AACA;IACI,mEAAmE;AACvE","sourcesContent":[".black_dropdown {\n    display: inline-block;\n    position: relative;\n    overflow: hidden;\n    height: 21px;\n    border-radius: 3px;\n    border: 1px solid #1c1c1c;\n    background: #383838 linear-gradient(0deg, #323232 0%, #383838 100%);\n    box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.15) inset, 0px 1px 0px 0px rgba(255, 255, 255, 0.1);\n    text-shadow: none;\n    min-height: 19px !important;\n    max-height: 19px !important;\n}\n.black_dropdown .lbl {\n    position: relative;\n    overflow: hidden;\n    height: 17px;\n    padding: 4px 0 0 6px;\n    margin: 0 19px 0 0;\n    font-family: Arial, Helvetica, sans-serif;\n    font-size: 12px;\n    color: #c0dabe;\n    line-height: 13px;\n    border-right: 1px solid #1c1c1c;\n    cursor: default;\n    white-space: nowrap;\n}\n.black_dropdown .button {\n    width: 19px;\n    border-left: 1px solid #4d4c4d;\n    bottom: 0;\n    position: absolute;\n    top: 0;\n    right: 0;\n    background-repeat: no-repeat;\n    background-image: url(../images/dropdown-dark-glossy/button@1x.png);\n    background-size: 9px 13px;\n    background-position: 4px 4px;\n}\n.black_dropdownOver {\n    background-image: linear-gradient(0deg, #2f2f2f 0%, #3f3f3f 100%);\n}\n.black_dropdownDown {\n    background: #2d2d2d linear-gradient(0deg, #2d2d2d 0%, #363636 100%);\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 47594:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87537);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(61667);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(24403), __webpack_require__.b);
var ___CSS_LOADER_URL_IMPORT_1___ = new URL(/* asset import */ __webpack_require__(6646), __webpack_require__.b);
var ___CSS_LOADER_URL_IMPORT_2___ = new URL(/* asset import */ __webpack_require__(21527), __webpack_require__.b);
var ___CSS_LOADER_URL_IMPORT_3___ = new URL(/* asset import */ __webpack_require__(72527), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_1___);
var ___CSS_LOADER_URL_REPLACEMENT_2___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_2___);
var ___CSS_LOADER_URL_REPLACEMENT_3___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_3___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".menuButton {\n    height: 100%;\n    box-sizing: border-box;\n    overflow: visible;\n    cursor: default;\n    position: relative;\n    display: inline-block;\n    font-family: Tahoma, Arial;\n    font-size: 12px;\n    line-height: 14px;\n    color: #cecece;\n    padding: 4px 7px 0 7px;\n    text-shadow: #292a2b 0px 1px 0px;\n    -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;\n}\n.menuButtonOver, .menuButton:hover {\n    background-color: #333333;\n    box-shadow: 1px -1px 0 0 #000000, -1px 0 0 0 #000000, 0 1px 0 0 rgba(255, 255, 255, 0.15) inset;\n    color: #d4d4d4;\n}\n.menuButton.menuButtonDown {\n    font-weight: normal;\n    background-color: #494949;\n    box-shadow: 1px 0 0 0 #000000 inset, 1px 0 0 0 #000000, 0 1px 0 0 rgba(255, 255, 255, 0.15) inset;\n    border: 0;\n    border-width: 0;\n    padding: 4px 7px 0 7px;\n    z-index: 100000000;\n}\n.menuButtonDisabled.menuButton .label {\n    color: #999999;\n}\n.menuButtonIcon {\n    padding-left: 24px;\n}\n.menuButtonIcon .icon {\n    display: block;\n}\n.menuButtonEmpty {\n    padding-left: 7px;\n}\n.menuButtonEmpty .icon {\n    left: 0;\n    top: 0;\n}\n.menuButtonDisabled {\n    color: gray;\n}\n.menuButton.btn {\n    min-width: 12px;\n    font-weight: bold;\n    background-position: 2px 50%;\n}\n\n\n.menu {\n    margin: -1px 0 0 0;\n    padding: 3px 0 3px 0;\n    z-index: 10000;\n    position: absolute;\n    overflow: visible;\n    font-family: Tahoma, Arial;\n    font-size: 11px;\n    line-height: 14px;\n    color: #f1f1f1;\n    cursor: default;\n    display: none;\n    border: 1px solid #00040a;\n    box-shadow: 0px 3px 15px 0px rgba(0, 0, 0, 0.65);\n    background-color: #494949;\n    text-shadow: 0px 1px 0px #2c2c2c;\n    border-radius: 0;\n}\n.menu > div.menu_item {\n    padding: 3px 16px 5px 23px;\n    white-space: nowrap;\n    cursor: default;\n    z-index: 1100000;\n    height: 13px;\n}\n.menu > div.menu_item.update {\n    background-color: #748512;\n    font-weight: bold;\n    color: #f1f1f1;\n    text-shadow: none;\n}\n.menu > div.menu_item.hover {\n    background-color: #262626;\n    color: #a0b42a;\n}\n.menu > div.menu_divider {\n    overflow: visible;\n    padding: 0;\n    font-size: 1px;\n    margin: 2px 3px;\n    border-top: 1px solid #353535;\n    border-bottom: 1px solid #565656;\n    height: 0;\n}\n.menu > div.menu_item > .shortcut {\n    right: 15px;\n    margin-top: 0px;\n    z-index: 10;\n    text-align: right;\n    padding-left: 15px;\n    float: right;\n}\n.menu > div.submenu > .shortcut {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") no-repeat right -15px;\n    width: 4px;\n    height: 7px;\n    display: block;\n    position: absolute;\n    right: 8px;\n    margin: 4px 0 0 0;\n    z-index: 10;\n}\n.menu > div.submenu.hover > span {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") no-repeat right -15px;\n}\n.menu > div.menu_item.disabled {\n    color: #808080;\n    text-shadow: none;\n    -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;\n}\n.menu > div.menu_item > u {\n    width: 16px;\n    height: 16px;\n    position: absolute;\n    left: 3px;\n    margin-top: -1px;\n}\n.menu > div.menu_item > a {\n    float: left;\n}\n.menu > div.menu_item.selected > u {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") no-repeat 0 -16px;\n}\n.menu > div.menu_item.selected:hover > u {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") no-repeat 0 -16px;\n}\n.menu > div.menu_item.checked > u {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") no-repeat 0 -16px;\n}\n.menu > div.menu_item.checked:hover > u {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") no-repeat 0 -16px;\n}\n.menu > div.menu_item.disabled > u {\n    opacity: 0.2;\n}\n.menu > div.menu_item.checked.disabled > u {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") no-repeat 0 -16px;\n}\n.menu > div.menu_item.selected.disabled > u {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") no-repeat 0 -16px;\n}\n\n.menu_searchbox {\n    height: auto;\n    width: auto;\n    border: 1px solid #be1100;\n    background-color: #653b13;\n    color: white;\n    position: absolute;\n    font-family: Tahoma, Arial;\n    font-size: 12px;\n}\n\n.menu-completion-highlight {\n    color: #2d69c7;\n}\n.searchbtn_close {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ") no-repeat 50% 0;\n    border-radius: 50%;\n    border: 0 none;\n    color: #656565;\n    cursor: pointer;\n    font: 16px/16px Arial;\n    padding: 0;\n    height: 14px;\n    width: 14px; \n    display: inline-block;\n}\n.searchbtn_close:hover {\n    background-color: #656565;\n    background-position: 50% 100%;\n    color: white;\n}\n\n.searchbtn_filter {\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") no-repeat 50% 0;\n    border-radius: 50%;\n    border: 0 none;\n    color: #656565;\n    cursor: pointer;\n    font: 16px/16px Arial;\n    padding: 0;\n    height: 14px;\n    width: 14px; \n    display: inline-block;\n}\n\n.searchbtn_filter:hover {\n    background-color: #656565;\n    background-position: 50% 100%;\n    color: white;\n}\n\n.menu_no_result {\n    padding: 3px 10px 5px 20px;\n    white-space: nowrap;\n    cursor: default;\n    z-index: 1100000;\n    height: 13px;\n}", "",{"version":3,"sources":["webpack://./packages/ace-layout/styles/menu.css"],"names":[],"mappings":"AAAA;IACI,YAAY;IACZ,sBAAsB;IACtB,iBAAiB;IACjB,eAAe;IACf,kBAAkB;IAClB,qBAAqB;IACrB,0BAA0B;IAC1B,eAAe;IACf,iBAAiB;IACjB,cAAc;IACd,sBAAsB;IACtB,gCAAgC;IAChC,yBAAyB,EAAE,sBAAsB,EAAE,qBAAqB,EAAE,iBAAiB;AAC/F;AACA;IACI,yBAAyB;IACzB,+FAA+F;IAC/F,cAAc;AAClB;AACA;IACI,mBAAmB;IACnB,yBAAyB;IACzB,iGAAiG;IACjG,SAAS;IACT,eAAe;IACf,sBAAsB;IACtB,kBAAkB;AACtB;AACA;IACI,cAAc;AAClB;AACA;IACI,kBAAkB;AACtB;AACA;IACI,cAAc;AAClB;AACA;IACI,iBAAiB;AACrB;AACA;IACI,OAAO;IACP,MAAM;AACV;AACA;IACI,WAAW;AACf;AACA;IACI,eAAe;IACf,iBAAiB;IACjB,4BAA4B;AAChC;;;AAGA;IACI,kBAAkB;IAClB,oBAAoB;IACpB,cAAc;IACd,kBAAkB;IAClB,iBAAiB;IACjB,0BAA0B;IAC1B,eAAe;IACf,iBAAiB;IACjB,cAAc;IACd,eAAe;IACf,aAAa;IACb,yBAAyB;IACzB,gDAAgD;IAChD,yBAAyB;IACzB,gCAAgC;IAChC,gBAAgB;AACpB;AACA;IACI,0BAA0B;IAC1B,mBAAmB;IACnB,eAAe;IACf,gBAAgB;IAChB,YAAY;AAChB;AACA;IACI,yBAAyB;IACzB,iBAAiB;IACjB,cAAc;IACd,iBAAiB;AACrB;AACA;IACI,yBAAyB;IACzB,cAAc;AAClB;AACA;IACI,iBAAiB;IACjB,UAAU;IACV,cAAc;IACd,eAAe;IACf,6BAA6B;IAC7B,gCAAgC;IAChC,SAAS;AACb;AACA;IACI,WAAW;IACX,eAAe;IACf,WAAW;IACX,iBAAiB;IACjB,kBAAkB;IAClB,YAAY;AAChB;AACA;IACI,yEAAoE;IACpE,UAAU;IACV,WAAW;IACX,cAAc;IACd,kBAAkB;IAClB,UAAU;IACV,iBAAiB;IACjB,WAAW;AACf;AACA;IACI,yEAAoE;AACxE;AACA;IACI,cAAc;IACd,iBAAiB;IACjB,mCAAmC,CAAC,kCAAkC;AAC1E;AACA;IACI,WAAW;IACX,YAAY;IACZ,kBAAkB;IAClB,SAAS;IACT,gBAAgB;AACpB;AACA;IACI,WAAW;AACf;AACA;IACI,qEAAwD;AAC5D;AACA;IACI,qEAAwD;AAC5D;AACA;IACI,qEAAwD;AAC5D;AACA;IACI,qEAAwD;AAC5D;AACA;IACI,YAAY;AAChB;AACA;IACI,qEAAwD;AAC5D;AACA;IACI,qEAAwD;AAC5D;;AAEA;IACI,YAAY;IACZ,WAAW;IACX,yBAAyB;IACzB,yBAAyB;IACzB,YAAY;IACZ,kBAAkB;IAClB,0BAA0B;IAC1B,eAAe;AACnB;;AAEA;IACI,cAAc;AAClB;AACA;IACI,mEAA+Q;IAC/Q,kBAAkB;IAClB,cAAc;IACd,cAAc;IACd,eAAe;IACf,qBAAqB;IACrB,UAAU;IACV,YAAY;IACZ,WAAW;IACX,qBAAqB;AACzB;AACA;IACI,yBAAyB;IACzB,6BAA6B;IAC7B,YAAY;AAChB;;AAEA;IACI,mEAAsD;IACtD,kBAAkB;IAClB,cAAc;IACd,cAAc;IACd,eAAe;IACf,qBAAqB;IACrB,UAAU;IACV,YAAY;IACZ,WAAW;IACX,qBAAqB;AACzB;;AAEA;IACI,yBAAyB;IACzB,6BAA6B;IAC7B,YAAY;AAChB;;AAEA;IACI,0BAA0B;IAC1B,mBAAmB;IACnB,eAAe;IACf,gBAAgB;IAChB,YAAY;AAChB","sourcesContent":[".menuButton {\n    height: 100%;\n    box-sizing: border-box;\n    overflow: visible;\n    cursor: default;\n    position: relative;\n    display: inline-block;\n    font-family: Tahoma, Arial;\n    font-size: 12px;\n    line-height: 14px;\n    color: #cecece;\n    padding: 4px 7px 0 7px;\n    text-shadow: #292a2b 0px 1px 0px;\n    -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;\n}\n.menuButtonOver, .menuButton:hover {\n    background-color: #333333;\n    box-shadow: 1px -1px 0 0 #000000, -1px 0 0 0 #000000, 0 1px 0 0 rgba(255, 255, 255, 0.15) inset;\n    color: #d4d4d4;\n}\n.menuButton.menuButtonDown {\n    font-weight: normal;\n    background-color: #494949;\n    box-shadow: 1px 0 0 0 #000000 inset, 1px 0 0 0 #000000, 0 1px 0 0 rgba(255, 255, 255, 0.15) inset;\n    border: 0;\n    border-width: 0;\n    padding: 4px 7px 0 7px;\n    z-index: 100000000;\n}\n.menuButtonDisabled.menuButton .label {\n    color: #999999;\n}\n.menuButtonIcon {\n    padding-left: 24px;\n}\n.menuButtonIcon .icon {\n    display: block;\n}\n.menuButtonEmpty {\n    padding-left: 7px;\n}\n.menuButtonEmpty .icon {\n    left: 0;\n    top: 0;\n}\n.menuButtonDisabled {\n    color: gray;\n}\n.menuButton.btn {\n    min-width: 12px;\n    font-weight: bold;\n    background-position: 2px 50%;\n}\n\n\n.menu {\n    margin: -1px 0 0 0;\n    padding: 3px 0 3px 0;\n    z-index: 10000;\n    position: absolute;\n    overflow: visible;\n    font-family: Tahoma, Arial;\n    font-size: 11px;\n    line-height: 14px;\n    color: #f1f1f1;\n    cursor: default;\n    display: none;\n    border: 1px solid #00040a;\n    box-shadow: 0px 3px 15px 0px rgba(0, 0, 0, 0.65);\n    background-color: #494949;\n    text-shadow: 0px 1px 0px #2c2c2c;\n    border-radius: 0;\n}\n.menu > div.menu_item {\n    padding: 3px 16px 5px 23px;\n    white-space: nowrap;\n    cursor: default;\n    z-index: 1100000;\n    height: 13px;\n}\n.menu > div.menu_item.update {\n    background-color: #748512;\n    font-weight: bold;\n    color: #f1f1f1;\n    text-shadow: none;\n}\n.menu > div.menu_item.hover {\n    background-color: #262626;\n    color: #a0b42a;\n}\n.menu > div.menu_divider {\n    overflow: visible;\n    padding: 0;\n    font-size: 1px;\n    margin: 2px 3px;\n    border-top: 1px solid #353535;\n    border-bottom: 1px solid #565656;\n    height: 0;\n}\n.menu > div.menu_item > .shortcut {\n    right: 15px;\n    margin-top: 0px;\n    z-index: 10;\n    text-align: right;\n    padding-left: 15px;\n    float: right;\n}\n.menu > div.submenu > .shortcut {\n    background: url(\"../images/submenu_arrow.gif\") no-repeat right -15px;\n    width: 4px;\n    height: 7px;\n    display: block;\n    position: absolute;\n    right: 8px;\n    margin: 4px 0 0 0;\n    z-index: 10;\n}\n.menu > div.submenu.hover > span {\n    background: url(\"../images/submenu_arrow.gif\") no-repeat right -15px;\n}\n.menu > div.menu_item.disabled {\n    color: #808080;\n    text-shadow: none;\n    -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;\n}\n.menu > div.menu_item > u {\n    width: 16px;\n    height: 16px;\n    position: absolute;\n    left: 3px;\n    margin-top: -1px;\n}\n.menu > div.menu_item > a {\n    float: left;\n}\n.menu > div.menu_item.selected > u {\n    background: url(\"../images/radio.gif\") no-repeat 0 -16px;\n}\n.menu > div.menu_item.selected:hover > u {\n    background: url(\"../images/radio.gif\") no-repeat 0 -16px;\n}\n.menu > div.menu_item.checked > u {\n    background: url(\"../images/check.gif\") no-repeat 0 -16px;\n}\n.menu > div.menu_item.checked:hover > u {\n    background: url(\"../images/check.gif\") no-repeat 0 -16px;\n}\n.menu > div.menu_item.disabled > u {\n    opacity: 0.2;\n}\n.menu > div.menu_item.checked.disabled > u {\n    background: url(\"../images/check.gif\") no-repeat 0 -16px;\n}\n.menu > div.menu_item.selected.disabled > u {\n    background: url(\"../images/radio.gif\") no-repeat 0 -16px;\n}\n\n.menu_searchbox {\n    height: auto;\n    width: auto;\n    border: 1px solid #be1100;\n    background-color: #653b13;\n    color: white;\n    position: absolute;\n    font-family: Tahoma, Arial;\n    font-size: 12px;\n}\n\n.menu-completion-highlight {\n    color: #2d69c7;\n}\n.searchbtn_close {\n    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAcCAYAAABRVo5BAAAAZ0lEQVR42u2SUQrAMAhDvazn8OjZBilCkYVVxiis8H4CT0VrAJb4WHT3C5xU2a2IQZXJjiQIRMdkEoJ5Q2yMqpfDIo+XY4k6h+YXOyKqTIj5REaxloNAd0xiKmAtsTHqW8sR2W5f7gCu5nWFUpVjZwAAAABJRU5ErkJggg==) no-repeat 50% 0;\n    border-radius: 50%;\n    border: 0 none;\n    color: #656565;\n    cursor: pointer;\n    font: 16px/16px Arial;\n    padding: 0;\n    height: 14px;\n    width: 14px; \n    display: inline-block;\n}\n.searchbtn_close:hover {\n    background-color: #656565;\n    background-position: 50% 100%;\n    color: white;\n}\n\n.searchbtn_filter {\n    background: url(\"../images/check.gif\") no-repeat 50% 0;\n    border-radius: 50%;\n    border: 0 none;\n    color: #656565;\n    cursor: pointer;\n    font: 16px/16px Arial;\n    padding: 0;\n    height: 14px;\n    width: 14px; \n    display: inline-block;\n}\n\n.searchbtn_filter:hover {\n    background-color: #656565;\n    background-position: 50% 100%;\n    color: white;\n}\n\n.menu_no_result {\n    padding: 3px 10px 5px 20px;\n    white-space: nowrap;\n    cursor: default;\n    z-index: 1100000;\n    height: 13px;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 52368:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87537);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".panelbar {\n    display:flex;\n    height:30px;\n    background: #665a82;\n    background: #cecece;\n    color: #111;\n    align-items: stretch;\n    justify-content: stretch;\n    overflow: hidden;\n    position: absolute;\n}\n.panelbar.vertical {\n}\n\n.panelbar.vertical .panelButton {\n}\n.panelbar.vertical.right .panelButton {\n}\n\n.panelButton {\n    cursor: default;\n    display:flex;\n    align-items: center;\n    padding: 0 10px;\n    box-sizing: border-box;\n    transition: 0.5s background-color;\n    border-left: #b3b3b3 solid 1px;\n    user-select: none;\n    height: 30px;\n    width: 30px;\n    position: absolute;\n}\n.panelButton:hover {\n    background: #e0e0e0;\n    border-radius: 10px 10px 0 0;\n}\n.panelButton.selected {\n    background-color: #e7e7e7;\n}\n.panelButton.active {\n    background-color: whitesmoke!important;\n    border-radius: 10px 10px 0 0;\n}\n.panelTitle {\n    flex: 1;\n    padding: 0 2px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n", "",{"version":3,"sources":["webpack://./packages/ace-layout/styles/panel.css"],"names":[],"mappings":"AAAA;IACI,YAAY;IACZ,WAAW;IACX,mBAAmB;IACnB,mBAAmB;IACnB,WAAW;IACX,oBAAoB;IACpB,wBAAwB;IACxB,gBAAgB;IAChB,kBAAkB;AACtB;AACA;AACA;;AAEA;AACA;AACA;AACA;;AAEA;IACI,eAAe;IACf,YAAY;IACZ,mBAAmB;IACnB,eAAe;IACf,sBAAsB;IACtB,iCAAiC;IACjC,8BAA8B;IAC9B,iBAAiB;IACjB,YAAY;IACZ,WAAW;IACX,kBAAkB;AACtB;AACA;IACI,mBAAmB;IACnB,4BAA4B;AAChC;AACA;IACI,yBAAyB;AAC7B;AACA;IACI,sCAAsC;IACtC,4BAA4B;AAChC;AACA;IACI,OAAO;IACP,cAAc;IACd,gBAAgB;IAChB,uBAAuB;IACvB,mBAAmB;AACvB","sourcesContent":[".panelbar {\n    display:flex;\n    height:30px;\n    background: #665a82;\n    background: #cecece;\n    color: #111;\n    align-items: stretch;\n    justify-content: stretch;\n    overflow: hidden;\n    position: absolute;\n}\n.panelbar.vertical {\n}\n\n.panelbar.vertical .panelButton {\n}\n.panelbar.vertical.right .panelButton {\n}\n\n.panelButton {\n    cursor: default;\n    display:flex;\n    align-items: center;\n    padding: 0 10px;\n    box-sizing: border-box;\n    transition: 0.5s background-color;\n    border-left: #b3b3b3 solid 1px;\n    user-select: none;\n    height: 30px;\n    width: 30px;\n    position: absolute;\n}\n.panelButton:hover {\n    background: #e0e0e0;\n    border-radius: 10px 10px 0 0;\n}\n.panelButton.selected {\n    background-color: #e7e7e7;\n}\n.panelButton.active {\n    background-color: whitesmoke!important;\n    border-radius: 10px 10px 0 0;\n}\n.panelTitle {\n    flex: 1;\n    padding: 0 2px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 83619:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87537);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(61667);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(85981), __webpack_require__.b);
var ___CSS_LOADER_URL_IMPORT_1___ = new URL(/* asset import */ __webpack_require__(7486), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_1___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".cboffline {\n    width: 55px;\n    height: 21px;\n    background: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") no-repeat 0 -21px;\n    display: inline-block;\n}\n.cbofflineDown {\n    background-position: 0 0px;\n}\n.cbofflineChecked {\n    background-position: 0 0px;\n}\n\n.checkbox {\n    display: inline-block;\n    width: 16px;\n    height: 17px;\n    background-repeat: no-repeat;\n    background-image: url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ");\n    background-size: 16px 136px;\n    background-position: 0 0;\n}\n\n.checkboxOver {\n    background-position: 0 -17px;\n}\n\n.checkboxDown {\n    background-position: 0 -34px;\n}\n\n.checkboxChecked {\n    background-position: 0 -51px;\n}", "",{"version":3,"sources":["webpack://./packages/ace-layout/styles/switcher.css"],"names":[],"mappings":"AAAA;IACI,WAAW;IACX,YAAY;IACZ,qEAAuD;IACvD,qBAAqB;AACzB;AACA;IACI,0BAA0B;AAC9B;AACA;IACI,0BAA0B;AAC9B;;AAEA;IACI,qBAAqB;IACrB,WAAW;IACX,YAAY;IACZ,4BAA4B;IAC5B,yDAAwD;IACxD,2BAA2B;IAC3B,wBAAwB;AAC5B;;AAEA;IACI,4BAA4B;AAChC;;AAEA;IACI,4BAA4B;AAChC;;AAEA;IACI,4BAA4B;AAChC","sourcesContent":[".cboffline {\n    width: 55px;\n    height: 21px;\n    background: url(\"../images/sync.png\") no-repeat 0 -21px;\n    display: inline-block;\n}\n.cbofflineDown {\n    background-position: 0 0px;\n}\n.cbofflineChecked {\n    background-position: 0 0px;\n}\n\n.checkbox {\n    display: inline-block;\n    width: 16px;\n    height: 17px;\n    background-repeat: no-repeat;\n    background-image: url(\"../images/checkbox_black@1x.png\");\n    background-size: 16px 136px;\n    background-position: 0 0;\n}\n\n.checkboxOver {\n    background-position: 0 -17px;\n}\n\n.checkboxDown {\n    background-position: 0 -34px;\n}\n\n.checkboxChecked {\n    background-position: 0 -51px;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 85334:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87537);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".bar-preferences {\n    overflow-y: hidden;\n    overflow-x: hidden;\n    color: #ddd;\n    font-family: Tahoma, Arial;\n    font-size: 12px;\n    text-shadow: 0 1px #232323;\n    background: #363636;\n}\n\n.bar-preferences .panelbar {\n    background: #363636;\n}\n.bar-preferences > div {\n    font-family: Arial, Helvetica, sans-serif;\n    font-size: 12px;\n}\n\n.bar-preferences .search_results {\n    color: white;\n}\n\n.bar-preferences .header {\n    padding: 8px 15px 8px 15px;\n    font-size: 14px;\n    color: #dddddd;\n    border-bottom: 1px solid #232323;\n    background-color: #313131;\n    margin: 0\n}\n\n.bar-preferences .tbsimple {\n    background: rgba(255, 255, 255, 0.1);\n    border: 1px solid rgba(0, 0, 0, 0.5);\n    height: 15px;\n    color: #cccccc;\n    padding: 3px;\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n    border-radius: 0;\n    font-family: Arial, Helvetica, sans-serif;\n    font-size: 12px;\n}\n\n.bar-preferences .tbsimpleFocus {\n    border: 1px solid rgba(0, 0, 0, 0.8);\n    box-shadow: none;\n}\n\n.preferenceItem {\n    padding: 2px 2px 2px 16px;\n    position: relative;\n    overflow: visible;\n    color: #333;\n}\n\n.bar-preferences .label, .bar-preferences .preferenceItem span {\n    color: #999999;\n    font-size: 12px;\n    text-overflow: ellipsis;\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n    top: 0;\n    font-family: Tahoma, Arial;\n    cursor: default;\n    padding: 1px 3px 2px 7px;\n    position: relative;\n    overflow: visible;\n    display: inline-block;\n    line-height: 13px;\n    white-space: nowrap;\n    width: 300px;\n}\n\n.spinner {\n    display: inline-block;\n    height: 19px;\n    margin: 0;\n    padding: 0;\n    border: 1px solid rgba(0, 0, 0, 0.5);\n    background: rgba(255, 255, 255, 0.1);\n    min-height: 18px;\n    max-height: 18px;\n    text-align: right;\n}\n\n.spinnerFocus {\n    border: 1px solid rgba(0, 0, 0, 0.8);\n    box-shadow: 0;\n}\n\n.spinner input {\n    outline: none;\n    border-right: 0;\n    padding: 1px 1px 2px 0;\n    text-align: right;\n    left: 0;\n    height: 14px;\n    color: #cccccc;\n    font-family: Tahoma, Arial;\n    font-size: 11px;\n    margin: 0;\n    z-index: 10000;\n    border: 0;\n    background: transparent;\n}\n\n::-webkit-scrollbar {\n    background: none;\n    width: 16px;\n    height: 16px;\n}\n\n::-webkit-scrollbar-thumb {\n    border: solid 0 rgba(0, 0, 0, 0);\n    border-right-width: 4px;\n    border-left-width: 4px;\n    -webkit-border-radius: 9px 4px;\n    -webkit-box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.2), inset 0 0 0 4px rgba(128, 128, 128, 0.2);\n}\n\n::-webkit-scrollbar-track-piece {\n    margin: 4px 0;\n}\n\n::-webkit-scrollbar-thumb:horizontal {\n    border-right-width: 0;\n    border-left-width: 0;\n    border-top-width: 4px;\n    border-bottom-width: 4px;\n    -webkit-border-radius: 4px 9px;\n}\n\n::-webkit-scrollbar-thumb:hover {\n    -webkit-box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.9), inset 0 0 0 4px rgba(128, 128, 128, 0.9);\n}\n\n::-webkit-scrollbar-corner {\n    background: transparent;\n}\n\n.ace_scrollbar-h {\n    margin: 0 2px\n}", "",{"version":3,"sources":["webpack://./packages/demo/preferences/preferences.css"],"names":[],"mappings":"AAAA;IACI,kBAAkB;IAClB,kBAAkB;IAClB,WAAW;IACX,0BAA0B;IAC1B,eAAe;IACf,0BAA0B;IAC1B,mBAAmB;AACvB;;AAEA;IACI,mBAAmB;AACvB;AACA;IACI,yCAAyC;IACzC,eAAe;AACnB;;AAEA;IACI,YAAY;AAChB;;AAEA;IACI,0BAA0B;IAC1B,eAAe;IACf,cAAc;IACd,gCAAgC;IAChC,yBAAyB;IACzB;AACJ;;AAEA;IACI,oCAAoC;IACpC,oCAAoC;IACpC,YAAY;IACZ,cAAc;IACd,YAAY;IACZ,mCAAmC;IACnC,kCAAkC;IAClC,gBAAgB;IAChB,yCAAyC;IACzC,eAAe;AACnB;;AAEA;IACI,oCAAoC;IACpC,gBAAgB;AACpB;;AAEA;IACI,yBAAyB;IACzB,kBAAkB;IAClB,iBAAiB;IACjB,WAAW;AACf;;AAEA;IACI,cAAc;IACd,eAAe;IACf,uBAAuB;IACvB,mCAAmC;IACnC,kCAAkC;IAClC,MAAM;IACN,0BAA0B;IAC1B,eAAe;IACf,wBAAwB;IACxB,kBAAkB;IAClB,iBAAiB;IACjB,qBAAqB;IACrB,iBAAiB;IACjB,mBAAmB;IACnB,YAAY;AAChB;;AAEA;IACI,qBAAqB;IACrB,YAAY;IACZ,SAAS;IACT,UAAU;IACV,oCAAoC;IACpC,oCAAoC;IACpC,gBAAgB;IAChB,gBAAgB;IAChB,iBAAiB;AACrB;;AAEA;IACI,oCAAoC;IACpC,aAAa;AACjB;;AAEA;IACI,aAAa;IACb,eAAe;IACf,sBAAsB;IACtB,iBAAiB;IACjB,OAAO;IACP,YAAY;IACZ,cAAc;IACd,0BAA0B;IAC1B,eAAe;IACf,SAAS;IACT,cAAc;IACd,SAAS;IACT,uBAAuB;AAC3B;;AAEA;IACI,gBAAgB;IAChB,WAAW;IACX,YAAY;AAChB;;AAEA;IACI,gCAAgC;IAChC,uBAAuB;IACvB,sBAAsB;IACtB,8BAA8B;IAC9B,sGAAsG;AAC1G;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,qBAAqB;IACrB,oBAAoB;IACpB,qBAAqB;IACrB,wBAAwB;IACxB,8BAA8B;AAClC;;AAEA;IACI,sGAAsG;AAC1G;;AAEA;IACI,uBAAuB;AAC3B;;AAEA;IACI;AACJ","sourcesContent":[".bar-preferences {\n    overflow-y: hidden;\n    overflow-x: hidden;\n    color: #ddd;\n    font-family: Tahoma, Arial;\n    font-size: 12px;\n    text-shadow: 0 1px #232323;\n    background: #363636;\n}\n\n.bar-preferences .panelbar {\n    background: #363636;\n}\n.bar-preferences > div {\n    font-family: Arial, Helvetica, sans-serif;\n    font-size: 12px;\n}\n\n.bar-preferences .search_results {\n    color: white;\n}\n\n.bar-preferences .header {\n    padding: 8px 15px 8px 15px;\n    font-size: 14px;\n    color: #dddddd;\n    border-bottom: 1px solid #232323;\n    background-color: #313131;\n    margin: 0\n}\n\n.bar-preferences .tbsimple {\n    background: rgba(255, 255, 255, 0.1);\n    border: 1px solid rgba(0, 0, 0, 0.5);\n    height: 15px;\n    color: #cccccc;\n    padding: 3px;\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n    border-radius: 0;\n    font-family: Arial, Helvetica, sans-serif;\n    font-size: 12px;\n}\n\n.bar-preferences .tbsimpleFocus {\n    border: 1px solid rgba(0, 0, 0, 0.8);\n    box-shadow: none;\n}\n\n.preferenceItem {\n    padding: 2px 2px 2px 16px;\n    position: relative;\n    overflow: visible;\n    color: #333;\n}\n\n.bar-preferences .label, .bar-preferences .preferenceItem span {\n    color: #999999;\n    font-size: 12px;\n    text-overflow: ellipsis;\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n    top: 0;\n    font-family: Tahoma, Arial;\n    cursor: default;\n    padding: 1px 3px 2px 7px;\n    position: relative;\n    overflow: visible;\n    display: inline-block;\n    line-height: 13px;\n    white-space: nowrap;\n    width: 300px;\n}\n\n.spinner {\n    display: inline-block;\n    height: 19px;\n    margin: 0;\n    padding: 0;\n    border: 1px solid rgba(0, 0, 0, 0.5);\n    background: rgba(255, 255, 255, 0.1);\n    min-height: 18px;\n    max-height: 18px;\n    text-align: right;\n}\n\n.spinnerFocus {\n    border: 1px solid rgba(0, 0, 0, 0.8);\n    box-shadow: 0;\n}\n\n.spinner input {\n    outline: none;\n    border-right: 0;\n    padding: 1px 1px 2px 0;\n    text-align: right;\n    left: 0;\n    height: 14px;\n    color: #cccccc;\n    font-family: Tahoma, Arial;\n    font-size: 11px;\n    margin: 0;\n    z-index: 10000;\n    border: 0;\n    background: transparent;\n}\n\n::-webkit-scrollbar {\n    background: none;\n    width: 16px;\n    height: 16px;\n}\n\n::-webkit-scrollbar-thumb {\n    border: solid 0 rgba(0, 0, 0, 0);\n    border-right-width: 4px;\n    border-left-width: 4px;\n    -webkit-border-radius: 9px 4px;\n    -webkit-box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.2), inset 0 0 0 4px rgba(128, 128, 128, 0.2);\n}\n\n::-webkit-scrollbar-track-piece {\n    margin: 4px 0;\n}\n\n::-webkit-scrollbar-thumb:horizontal {\n    border-right-width: 0;\n    border-left-width: 0;\n    border-top-width: 4px;\n    border-bottom-width: 4px;\n    -webkit-border-radius: 4px 9px;\n}\n\n::-webkit-scrollbar-thumb:hover {\n    -webkit-box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.9), inset 0 0 0 4px rgba(128, 128, 128, 0.9);\n}\n\n::-webkit-scrollbar-corner {\n    background: transparent;\n}\n\n.ace_scrollbar-h {\n    margin: 0 2px\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 23645:
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";

      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }

      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }

      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }

      content += cssWithMappingToString(item);

      if (needLayer) {
        content += "}";
      }

      if (item[2]) {
        content += "}";
      }

      if (item[4]) {
        content += "}";
      }

      return content;
    }).join("");
  }; // import a list of modules into the list


  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }

      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }

      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }

      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ 61667:
/***/ ((module) => {



module.exports = function (url, options) {
  if (!options) {
    options = {};
  }

  if (!url) {
    return url;
  }

  url = String(url.__esModule ? url.default : url); // If url is already wrapped in quotes, remove them

  if (/^['"].*['"]$/.test(url)) {
    url = url.slice(1, -1);
  }

  if (options.hash) {
    url += options.hash;
  } // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls


  if (/["'() \t\n]|(%20)/.test(url) || options.needQuotes) {
    return "\"".concat(url.replace(/"/g, '\\"').replace(/\n/g, "\\n"), "\"");
  }

  return url;
};

/***/ }),

/***/ 87537:
/***/ ((module) => {



module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || "").concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join("\n");
  }

  return [content].join("\n");
};

/***/ }),

/***/ 17187:
/***/ ((module) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ 93379:
/***/ ((module) => {



var stylesInDOM = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };

    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);

  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }

      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };

  return updater;
}

module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();

        stylesInDOM.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ 90569:
/***/ ((module) => {



var memo = {};
/* istanbul ignore next  */

function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }

    memo[target] = styleTarget;
  }

  return memo[target];
}
/* istanbul ignore next  */


function insertBySelector(insert, style) {
  var target = getTarget(insert);

  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }

  target.appendChild(style);
}

module.exports = insertBySelector;

/***/ }),

/***/ 19216:
/***/ ((module) => {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}

module.exports = insertStyleElement;

/***/ }),

/***/ 3565:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;

  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}

module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ 7795:
/***/ ((module) => {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";

  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }

  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }

  var needLayer = typeof obj.layer !== "undefined";

  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }

  css += obj.css;

  if (needLayer) {
    css += "}";
  }

  if (obj.media) {
    css += "}";
  }

  if (obj.supports) {
    css += "}";
  }

  var sourceMap = obj.sourceMap;

  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  options.styleTagTransform(css, styleElement, options.options);
}

function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }

  styleElement.parentNode.removeChild(styleElement);
}
/* istanbul ignore next  */


function domAPI(options) {
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}

module.exports = domAPI;

/***/ }),

/***/ 44589:
/***/ ((module) => {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }

    styleElement.appendChild(document.createTextNode(css));
  }
}

module.exports = styleTagTransform;

/***/ }),

/***/ 21527:
/***/ ((module) => {

module.exports = "data:image/gif;base64,R0lGODlhDAAjAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAAMACMAAAItlI+py+2fgAMSVUGvoZjHrFkeE0LmiabqagZO4CKxAM8GTONJrSv1ywoKh4oCADs=";

/***/ }),

/***/ 7486:
/***/ ((module) => {

module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAACICAYAAADuxmtPAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBQkU4MzRBNDE1RjcxMUUyQjBEREY4NkZDMkM2NDc5MyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBQkU4MzRBNTE1RjcxMUUyQjBEREY4NkZDMkM2NDc5MyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkFCRTgzNEEyMTVGNzExRTJCMERERjg2RkMyQzY0NzkzIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkFCRTgzNEEzMTVGNzExRTJCMERERjg2RkMyQzY0NzkzIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+JumAiwAACF9JREFUeNrsmX9sU9cVx6/t599J6JrUSZyfjg2OnR+khB91qdRQ0a4pVA3QlgilaemP/TFtfyG1f7VSxRqgQ9M2RZUYYh2MpghNKlJAqVKphbUNtEAggRjHTuwk2IlJ45g48e8fb+cY+8XGdvADNHVdrnQU5/l+z73vnnM+795nDk3TBFthUZES/jSCFYHxSfoWBLODXbplt5vxAhUTP9Xe3r772c2bnywuLlZQFCVMpw6FQv6pqSlzb2/vedB8Ck6+o+BD1Wttbbtfb29vlUDj8XhkiSaUSqUauVxeweFyceApLmie2LJliy4vL08CIxMOh7OkYR/s+0Jz85Og3UAFg8HHKioqqvBLNg00CtSiA0oIjbBsqEFtdBHZjp7Yog64sCAP5OB/fAYCgSAMzc/n81lFArMSNGGuTCZz2Ww2y70S6G6zWq2WwsJCF7e5uXnk9OnTfRBTD65FNoZ9UYNa3r/Pnbt9+PBhemx83A+5Lc7Nzc2DeuClGxVuNTAxMWH6rKurx2g0ftnZ2dnHiZWz/I8HD9aePHmyDKotF0ZIW1F4z1Ct8607d1r37NlzDS5Nxh1gewRMBibFyGZYuwiYG+wW2BwTxhgT8uFPAwugzD1coLzz9tut+fn5EizMTIkFtysEmGgqKyuTgbJjxw5daWmpRCwWR8OUKfb4HfbBvtu3bYsChYtQ0Gq1VWxTGDSLQIF0Zg0U1KD2/svwYVXjL2EGCJQYHO4fKFCiFrYjj4+PLwLl1KlTfYFAwJMtjbAvahigHDp0iB4bG/MXxYACKcvLMO2AxWIxHT16tGdoaOiXAhSscSIrLHxq//79R0wm0w2/3++LRCJ0OsPvoI++o6PjCGqis4cPVR/BBY/H4wbq0tkY9t0HA4JWeQco27frYIEkMArJxrDvtpaWxR1KWVlZVcJiZtVAswgUeI4I0TObhhpmh8JWnFLO/+8OECiQYQ8GlJuw28A8YGMTN28uAqW7u7vP6/V6ss1E7Isa1GI5r2hra3tOqVQ246a7pKSkCp7OgkxAgb2R+cyZM31ms/nL48eP9y4D5SEAhVQqFLsMBoMeFo6+l/3j7HH6nc9+F/0Mmhuo5SYCZSk7N/Qt+fOlT4g3h5DWY2+wA4rRaiJ7v/uYqDR1ZNBwmfx9R2d6oDidTjLnc5HK4ookBx+eO0CK5OXkqk1PPtr8HtHKNIyGG3eA1m3qIa1f7CZfXOlmrr3f8wdC5YqIfsZE2hUvkeeVm5nvksrZ5pwk/xw8QTZqmkjH9wdJmBMm8/4FYgtOE/OCjazJXUV+r/tNSukzMyheUUQOvfJX0m+6QGoVa0i3uZd8cvEwmfbfJnlBiny8ZS+JhJKLKuUW5MI7TkasNwgH6qlW0UicM5PkLy0HCD9EpVRl1EEcKPGLpUI5+dvL4GRyiFwd6yd7n/+AFPFlKWLYI2QGSrmohHRu+xP57YY3yAZZ45JA4b351lu5kN/59fX1aogtP97hUf4jpLZAm1bs8/k8n5840aNSqb5ZBkoiUA4cOGIaGbkB4fHRGRp+B330Hfv2JQMFL8DKuuksG/bFARmgIKYyYSzR4kDBz4g/Bijl5eX3PPJ8PXiWAcorn75GQLMIFDzmLbXFGbLoU4CCmpQjj91uJ8NjxhQHcaBcA6B8AEB5vKwhuZzjKRoHyokL/2KuvXvq/SSgtNRsZb5LygOTbSQroKQ9saA3lVx5T6CIheKkoko58qgLVmYEyqPiX6U/MyFQEA5xr9rHqlOAsipflVLSEIHMR566Qi0DlOdWPrPkkScKlNHR0fzGxkY1xJYpInleMVlXuiatGAjowVNLRWXlN8yRxwJHHvCY3ZHn2LEe/fKRZ3mHsrxDWd6hLO9QMr+Ura6u3rimoUEAa8CDqaZ9O4dlbLPZVlzu71eA5nvmpeyqlSs3Nj39NIWxnZyaCtMZnvUcaCKxmLdp0yY+/LMRX8pSMNp6iEBk1uFwZ3NmDgYCYfgTUCoUAojEOgoQJRPw+X62J3gY2IdaCoT8OxuwAOujP2gFVGxx7vsFws/EARRH+IEcwALe/wzgUR70er00lDLNMgL4sj5ESaVSx5zLJc7JyWEVx4WFBQFoZ7hqtXrQefu2yOf1YpbR2Rj2RQ1qsZwFT+h0TZM22yqJROIWCYVBSHk6ww8UHJ/fL4CHq1heUmK6cP782TgPJLt27VL/ePGi1u12F8D9UWm3dHDPOO3169bpu7q6huGSJxEoiDFxLDKZXrZj5xCYF4N3N1DKHuhn4/8KUKanpwukOTkRAEqENVAcDseKUbO5GtfBr1b3A1BoBAo3ASgZ2+zsrHRkdLTu1Vd3ctauXe8dNhrrYvulZKBACCU4GoTKEx95fn5eCiOvbmnZDmnPd8AmRCISifxgQdQy5QwO+HAmrANnPJVSeRE7QcJIzBbL6q1bXxTAw2r2hx/OS6zWieDaxkb93NwchpNHxTbPBKa4uqnpmTwej0t/9VVvA0Tjus1qrf918wtiHoj7+y8Jx8bMIRBfn5mZWYgvNDdWGCKYgcR+y+7iC0Sz1ZoaLizQehDnwPPWOThwVTQyYqTr6+pQ7IK+4TiEqNjP4PNajebalf7LNcFAkC4vrwjKi+XBUDBMhg0GvslkDDc0NAzMOBxz4VCITgEKzCAETuya6urIwMCVGlhdqrS0LARnCmp42EBg5GsQZmfoLnESUGBaUSdQomRg8KoWOlND+uuc2pqaQVj5mbupFQcKD7JJhSXNo6gQdoLmhp2HxzBsKIAM1UNopz1ebzgMm+1Ec83PY724eDqdjsCZSSWEZIoe8WG7BIXvUVZV/QQjO8FBOBIOk0QDqHAgIaRarfbHjECB6XFwi//zB8p/BBgAHNqa8EdleScAAAAASUVORK5CYII=";

/***/ }),

/***/ 37113:
/***/ ((module) => {

module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANCAYAAAB7AEQGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozNEM5MTlGOTAwMDQxMUUyQjQxMkIyMEY3MzE5QTlBRCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozNEM5MTlGQTAwMDQxMUUyQjQxMkIyMEY3MzE5QTlBRCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjM0QzkxOUY3MDAwNDExRTJCNDEyQjIwRjczMTlBOUFEIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjM0QzkxOUY4MDAwNDExRTJCNDEyQjIwRjczMTlBOUFEIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+52cTFgAAAQdJREFUeNpi+v//PwMyZuQUUEEXY2JAAkxcghMV5OVug2hkcWQTJgRFxPy/c+fOf3efwP9Afg9MDqagx9bZ4/+lS5f+Hzhw4P/Fixf/Wzu6gRS2g+WBDHNDfb0T82dNYXj18iXEDUxMDIJCQgwxSRkMN27e0oObBMRfgfg/Ev4ANwlsJ8TRXECKnQEVfPn37f1vsCKggnZOTo4KNjY2FBVfv35j+PPnDxvIKkNdY8v/V69e+//w4UM4Pn/+wn9VHSOQtZpwkzTV1Srys1IYWJiZGX79+sXQO3kmw937D5qA1tWjhJOhuc3/qdOm/Tcws8YMJ2SFojJKIAUTkMUZsMSdEroYQIABAD4w1u/PTSI1AAAAAElFTkSuQmCC";

/***/ }),

/***/ 6646:
/***/ ((module) => {

module.exports = "data:image/gif;base64,R0lGODlhDAAjAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAAMACMAAAIjlI+py+0PDZhs2mWpyqDqCIbiSJbmEqRMyqJs4LbxSdf2UgAAOw==";

/***/ }),

/***/ 24403:
/***/ ((module) => {

module.exports = "data:image/gif;base64,R0lGODlhBAAeAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAAEAB4AAAIXhA4maeyr1Jm02mvDDFpw/YVe12HmaRUAOw==";

/***/ }),

/***/ 85981:
/***/ ((module) => {

module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAAqCAYAAAAXk8MDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NjQyQUZBRjU3QkFEMTFFMjhCODRFOEFGNTQyODdCNTQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NjQyQUZBRjY3QkFEMTFFMjhCODRFOEFGNTQyODdCNTQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2NDJBRkFGMzdCQUQxMUUyOEI4NEU4QUY1NDI4N0I1NCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2NDJBRkFGNDdCQUQxMUUyOEI4NEU4QUY1NDI4N0I1NCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv8NHYkAAASLSURBVHja3FhLbyNFEP7aHj+z3k1k5yGUxYmEtICSFRJrIXHYUyBCAo6cOEX5BZz4I9y4J3vgEIG0h0U5RQpIK22AA4l4HJIgsrE3b4f4MdN0tdPj2cnMZCZMj1eU1B67uz1dX9dX1V3FOOcgmZqa4pZlQQljzP6u5jjHqM85xz3Xa4yE1uh0Omi1Wi/1m6aJdDp9bZ9Xv/qdSqWQyWSwt7cnFzfo4/XqXV6e3UflXhuFIVKMtEMkoencBk8gr87pCjzbz4DPPvoCDx98gvKdCuKUF0d1PP7+W1RGK7xRbzBjenqaj71Tx1StjXwOyGYj4/IF45a/fwc+//RL1N78AC+eH+D5X/uxgjMMAx8+/BhGJo2JiQlukElfe7uF27eAYh5IG32FfU1kc9ADpEe/GvvzEHir+h7q9Tp0CNGd3v3g/vv4qvU1DPKN0h0gLyyWE82msuIZcynrBZpf8x81zUyhdd654sOxg7zoSj+UdiJAwhfBxNNSyvK+4szHWld05N4W7QeTDLrdLnSLWsNQypCilhkyciAABHNZEg5rQr/VXvLBHl1oV8XTuqqk7Uf29kcInS56irMmWXC0mATGewBvJF5+6YNhIOCIkhYPCBIxiMV7h3iitLQuaWn7HPP3KWdw4dzHz3ytlrDl5FXqv9IypPCkaWlbzlQ7G4GKLGTUvPxNm5g8La1eM60QoFjEyDlIWirLmWbIcy5MtPQZGwg40+pbL+qFuXd+BQNVF+uebycITvoA9/C3EH7nqSf3n2dhANHy4kxkBKVwlvM8CvzSIBfgtLi/nreaKGSLWkGdXzTlM0Xg6n9k0WkLenb7FvRrloPCgfMUDR3ziiL7+G33R2k9ne3ZLz8gl8vB2N7eZpN3J7mR2cf4vQ6Ktx0WivF2QlIcBtZ/fgRLbOIbk++K/PFWrBZr/nOKn359iu++eYLDw0PGlA9Uq1W7huKujzh/O31G1VKuq7k451JC2W63Zb6lQ6iWQsD6KY8QKthQi3tRWiybzcrCDRVwiC7UvC7U7qJSUBHKb/Od/dJylUqFLy4uYn5+HqOjo7GCo7R/dXUVy8vLGBsbk3UOVQUjsOq7U6hf9ak5zuqZc9w9dnJygqOjI+zs7DA2Pj7OFxYWMDc3JzvjzpQJzPDwMNbW1rCysoJyuay3xCBof3BwgOPjYxhExVqtpr1oMzs7i6WlJapK2TTSdeaNjIxIgLL6RdbSfbjSGtZlJh43MOf7FO3tgJJk0UYXMK/AYySd+rsVC77ehdfLa64nOL+diCVhddDyOuWj6uBmha/ldFhTvTPsu6Pq4J5veJ0z2soMCdKf1hqoz4XdhCD93If8KxNQwvraTfyf/pMoLZNeK3bLBUVaXRE4UVr6vS8p+it2JOpz/wvLvQpHAVlPgjs7O8PQ0JDWxZrNZmDYjlMoGSCWpChL3tjY0F602dzcRD6fT8RilJfSRhqNRoOJ/EfyZWZmBqVSKdbFTk9PsbW1hfX1de2JKmUeAo9su7u7/QIRAbxJ/SRsClMoFGSuFaYmEnXcfWOhih59/1eAAQAVvW4V+Ky7cAAAAABJRU5ErkJggg==";

/***/ }),

/***/ 72527:
/***/ ((module) => {

module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAcCAYAAABRVo5BAAAAZ0lEQVR42u2SUQrAMAhDvazn8OjZBilCkYVVxiis8H4CT0VrAJb4WHT3C5xU2a2IQZXJjiQIRMdkEoJ5Q2yMqpfDIo+XY4k6h+YXOyKqTIj5REaxloNAd0xiKmAtsTHqW8sR2W5f7gCu5nWFUpVjZwAAAABJRU5ErkJggg==";

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
/******/ 			id: moduleId,
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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
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
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = document.baseURI || self.location.href;
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			7544: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// no jsonp function
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

// NAMESPACE OBJECT: ./packages/ace-layout/styles/switcher.css
var switcher_namespaceObject = {};
__webpack_require__.r(switcher_namespaceObject);
__webpack_require__.d(switcher_namespaceObject, {
  "default": () => (styles_switcher)
});

// NAMESPACE OBJECT: ./packages/ace-layout/styles/button.css
var button_namespaceObject = {};
__webpack_require__.r(button_namespaceObject);
__webpack_require__.d(button_namespaceObject, {
  "default": () => (ace_layout_styles_button)
});

// NAMESPACE OBJECT: ./packages/ace-layout/styles/dropdown.css
var dropdown_namespaceObject = {};
__webpack_require__.r(dropdown_namespaceObject);
__webpack_require__.d(dropdown_namespaceObject, {
  "default": () => (styles_dropdown)
});

// NAMESPACE OBJECT: ./packages/ace-layout/styles/menu.css
var menu_namespaceObject = {};
__webpack_require__.r(menu_namespaceObject);
__webpack_require__.d(menu_namespaceObject, {
  "default": () => (styles_menu)
});

// NAMESPACE OBJECT: ./packages/demo/preferences/preferences.css
var preferences_namespaceObject = {};
__webpack_require__.r(preferences_namespaceObject);
__webpack_require__.d(preferences_namespaceObject, {
  "default": () => (preferences_preferences)
});

// NAMESPACE OBJECT: ./packages/ace-layout/styles/accordion.css
var accordion_namespaceObject = {};
__webpack_require__.r(accordion_namespaceObject);
__webpack_require__.d(accordion_namespaceObject, {
  "default": () => (styles_accordion)
});

// NAMESPACE OBJECT: ./packages/ace-layout/styles/panel.css
var panel_namespaceObject = {};
__webpack_require__.r(panel_namespaceObject);
__webpack_require__.d(panel_namespaceObject, {
  "default": () => (styles_panel)
});

;// CONCATENATED MODULE: ./packages/ace-layout/utils/lib.ts
var Utils;
((Utils2) => {
  Utils2.findHost = function(el, constructor) {
    while (el) {
      if (el.$host && (!constructor || el.$host.constructor === constructor))
        return el.$host;
      el = el.parentElement;
    }
  };
  Utils2.findNode = function(node, className) {
    while (node && node.classList) {
      if (node.classList.contains(className))
        return node;
      node = node.parentNode;
    }
    return null;
  };
  Utils2.findHostTarget = function(target) {
    while (target) {
      if (target.$host)
        return target;
      target = target.parentElement;
    }
    return null;
  };
  Utils2.setBox = function(el, x, y, w, h) {
    if (w) {
      w = Math.max(w, 0);
    }
    if (h) {
      h = Math.max(h, 0);
    }
    let s = el.style;
    s.left = x + "px";
    s.top = y + "px";
    s.width = w + "px";
    s.height = h + "px";
  };
  function getEdge(style, dir) {
    return parseInt(style["padding" + dir], 10) + parseInt(style["margin" + dir], 10) + parseInt(style["border" + dir], 10);
  }
  Utils2.getEdge = getEdge;
  function getElementEdges(element) {
    let style = getComputedStyle(element);
    return {
      "top": getEdge(style, "Top"),
      "bottom": getEdge(style, "Bottom"),
      "left": getEdge(style, "Left"),
      "right": getEdge(style, "Right")
    };
  }
  Utils2.getElementEdges = getElementEdges;
})(Utils || (Utils = {}));

;// CONCATENATED MODULE: ./packages/ace-layout/utils/params.ts
var SizeUnit = /* @__PURE__ */ ((SizeUnit2) => {
  SizeUnit2[SizeUnit2["px"] = 0] = "px";
  SizeUnit2[SizeUnit2["percent"] = 1] = "percent";
  return SizeUnit2;
})(SizeUnit || {});
var EditorType = /* @__PURE__ */ ((EditorType2) => {
  EditorType2["ace"] = "ace";
  EditorType2["preview"] = "preview";
  return EditorType2;
})(EditorType || {});

// EXTERNAL MODULE: ./node_modules/ace-code/src/lib/event.js
var lib_event = __webpack_require__(17989);
// EXTERNAL MODULE: ./node_modules/events/events.js
var events = __webpack_require__(17187);
// EXTERNAL MODULE: ./node_modules/ace-code/src/lib/useragent.js
var useragent = __webpack_require__(50618);
;// CONCATENATED MODULE: ./packages/ace-layout/utils/dom.ts


var XHTML_NS = "http://www.w3.org/1999/xhtml";
var dom;
((dom2) => {
  dom2.buildDom = function(arr, parent, refs) {
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
        var ch = (0, dom2.buildDom)(arr[i], parent, refs);
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
      (0, dom2.buildDom)(arr[i], el, refs);
    if (childIndex == 2) {
      Object.keys(options).forEach(function(n) {
        var val = options[n];
        if (n === "class") {
          el.className = Array.isArray(val) ? val.join(" ") : val;
        } else if (typeof val == "function" || n == "value" || n[0] == "$") {
          el[n] = val;
        } else if (n === "ref") {
          if (refs)
            refs[val] = el;
        } else if (n === "style") {
          if (typeof val == "string")
            el.style.cssText = val;
        } else if (val != null) {
          el.setAttribute(n, val);
        }
      });
    }
    if (parent)
      parent.appendChild(el);
    return el;
  };
  dom2.getDocumentHead = function(doc) {
    if (!doc)
      doc = document;
    return doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
  };
  dom2.createElement = function(tag, ns) {
    return document.createElementNS ? document.createElementNS(ns || XHTML_NS, tag) : document.createElement(tag);
  };
  dom2.removeChildren = function(element) {
    element.innerHTML = "";
  };
  dom2.createTextNode = function(textContent, element) {
    var doc = element ? element.ownerDocument : document;
    return doc.createTextNode(textContent);
  };
  dom2.createFragment = function(element) {
    var doc = element ? element.ownerDocument : document;
    return doc.createDocumentFragment();
  };
  dom2.hasCssClass = function(el, name) {
    var classes = (el.className + "").split(/\s+/g);
    return classes.indexOf(name) !== -1;
  };
  dom2.addCssClass = function(el, name) {
    if (!(0, dom2.hasCssClass)(el, name)) {
      el.className += " " + name;
    }
  };
  dom2.removeCssClass = function(el, name) {
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
  dom2.toggleCssClass = function(el, name) {
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
  dom2.setCssClass = function(node, className, include) {
    if (include) {
      (0, dom2.addCssClass)(node, className);
    } else {
      (0, dom2.removeCssClass)(node, className);
    }
  };
  dom2.hasCssString = function(id, doc) {
    var index = 0, sheets;
    doc = doc || document;
    if (sheets = doc.querySelectorAll("style")) {
      while (index < sheets.length) {
        if (sheets[index++].id === id) {
          return true;
        }
      }
    }
  };
  dom2.removeElementById = function(id, doc) {
    doc = doc || document;
    if (doc.getElementById(id)) {
      doc.getElementById(id).remove();
    }
  };
  var strictCSP;
  var cssCache = [];
  dom2.useStrictCSP = function(value) {
    strictCSP = value;
    if (value == false)
      insertPendingStyles();
    else if (!cssCache)
      cssCache = [];
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
    if (strictCSP)
      return;
    var container = target;
    if (!target || !target.getRootNode) {
      container = document;
    } else {
      container = target.getRootNode();
      if (!container || container == target)
        container = document;
    }
    var doc = container.ownerDocument || container;
    if (id && (0, dom2.hasCssString)(id, container))
      return null;
    if (id)
      cssText += "\n/*# sourceURL=ace/css/" + id + " */";
    var style = (0, dom2.createElement)("style");
    style.appendChild(doc.createTextNode(cssText));
    if (id)
      style.id = id;
    if (container == doc)
      container = (0, dom2.getDocumentHead)(doc);
    container.insertBefore(style, container.firstChild);
  }
  dom2.importCssString = importCssString;
  dom2.importCssStylsheet = function(uri, doc) {
    (0, dom2.buildDom)(["link", { rel: "stylesheet", href: uri }], (0, dom2.getDocumentHead)(doc));
  };
  dom2.scrollbarWidth = function(document2) {
    var inner = (0, dom2.createElement)("ace_inner");
    inner.style.width = "100%";
    inner.style.minWidth = "0px";
    inner.style.height = "200px";
    inner.style.display = "block";
    var outer = (0, dom2.createElement)("ace_outer");
    var style = outer.style;
    style.position = "absolute";
    style.left = "-10000px";
    style.overflow = "hidden";
    style.width = "200px";
    style.minWidth = "0px";
    style.height = "150px";
    style.display = "block";
    outer.appendChild(inner);
    var body = document2.documentElement;
    body.appendChild(outer);
    var noScrollbar = inner.offsetWidth;
    style.overflow = "scroll";
    var withScrollbar = inner.offsetWidth;
    if (noScrollbar == withScrollbar) {
      withScrollbar = outer.clientWidth;
    }
    body.removeChild(outer);
    return noScrollbar - withScrollbar;
  };
  dom2.computedStyle = function(element, style) {
    return window.getComputedStyle(element, "") || {};
  };
  dom2.setStyle = function(styles, property, value) {
    if (styles[property] !== value) {
      styles[property] = value;
    }
  };
  dom2.HAS_CSS_ANIMATION = false;
  dom2.HAS_CSS_TRANSFORMS = false;
  dom2.HI_DPI = useragent.isWin ? typeof window !== "undefined" && window.devicePixelRatio >= 1.5 : true;
  if (useragent.isChromeOS)
    dom2.HI_DPI = false;
  if (typeof document !== "undefined") {
    var div = document.createElement("div");
    if (dom2.HI_DPI && div.style.transform !== void 0)
      dom2.HAS_CSS_TRANSFORMS = true;
    if (!useragent.isEdge && typeof div.style.animationName !== "undefined")
      dom2.HAS_CSS_ANIMATION = true;
    div = null;
  }
  if (dom2.HAS_CSS_TRANSFORMS) {
    dom2.translate = function(element, tx, ty) {
      element.style.transform = "translate(" + Math.round(tx) + "px, " + Math.round(ty) + "px)";
    };
  } else {
    dom2.translate = function(element, tx, ty) {
      element.style.top = Math.round(ty) + "px";
      element.style.left = Math.round(tx) + "px";
    };
  }
})(dom || (dom = {}));

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/boxes/box.ts





const SPLITTER_SIZE = 1;
const BOX_MIN_SIZE = 40;
class Box extends events.EventEmitter {
  constructor(options) {
    var _a, _b, _c, _d;
    super();
    this.$editorAdded = (editor) => {
      this.emit("editorAdded", editor);
    };
    if (options.splitter !== false) {
    }
    this.vertical = options.vertical || false;
    this.color = (_a = options.color) != null ? _a : "";
    this.isMain = options.isMain || false;
    this[0] = options[0];
    this[1] = options[1];
    if (this[0])
      this[0].parent = this;
    if (this[1])
      this[1].parent = this;
    this.ratio = options.ratio;
    this.toolBars = options.toolBars || {};
    this.padding = { top: 0, right: 0, bottom: 0, left: 0 };
    this.size = options.size;
    this.sizeUnit = (_b = options.sizeUnit) != null ? _b : SizeUnit.px;
    this.minSize = options.minSize || BOX_MIN_SIZE;
    this.minVerticalSize = options.minVerticalSize || this.minSize;
    this.minHorizontalSize = options.minHorizontalSize || this.minSize;
    this.classNames = (_c = options.classNames) != null ? _c : "";
    this.hidden = (_d = options.hidden) != null ? _d : false;
    this.fixedSize = options.fixedSize;
  }
  static enableAnimation() {
    document.documentElement.classList.add("animateBoxes");
  }
  static disableAnimation() {
    document.documentElement.classList.remove("animateBoxes");
  }
  static setGlobalCursor(value) {
    if (value)
      document.documentElement.classList.add("inheritCursor");
    else
      document.documentElement.classList.remove("inheritCursor");
    document.documentElement.style.cursor = value;
  }
  toJSON() {
    return {
      0: this[0] && this[0].toJSON(),
      1: this[1] && this[1].toJSON(),
      ratio: this.ratio,
      type: this.vertical ? "vbox" : "hbox",
      fixedSize: this.fixedSize || null,
      hidden: this.hidden,
      color: this.color,
      size: this.size
    };
  }
  onMouseDown(e) {
    let button = e.button;
    if (button !== 0)
      return;
    let box = this;
    let rect = this.element.getBoundingClientRect();
    let x = e.clientX;
    let y = e.clientY;
    document.body.classList.add("dragging");
    let onMouseMove = function(e2) {
      x = e2.clientX - rect.left - box.padding.left;
      y = e2.clientY - rect.top - box.padding.top;
      let height = rect.height - box.padding.top - box.padding.bottom;
      let width = rect.width - box.padding.left - box.padding.right;
      if (box.fixedChild) {
        if (box.vertical) {
          box.fixedChild.fixedSize = box.fixedChild === box[1] ? height - y : y;
        } else {
          box.fixedChild.fixedSize = box.fixedChild === box[1] ? width - x : x;
        }
        box.fixedChild.fixedSize = Math.max(box.fixedChild.fixedSize, box.fixedChild.minSize);
        box.ratio = void 0;
      } else {
        if (box.vertical) {
          box.ratio = y / height;
        } else {
          box.ratio = x / width;
        }
        box.ratio = Math.max(box.minRatio, Math.min(box.ratio, box.maxRatio));
      }
      box.resize();
    };
    let onResizeEnd = function(e2) {
      Box.setGlobalCursor("");
      document.body.classList.remove("dragging");
    };
    Box.setGlobalCursor(`${box.vertical ? "ns" : "ew"}-resize`);
    lib_event.capture(window, onMouseMove, onResizeEnd);
    return e.preventDefault();
  }
  resize() {
    if (!this.box)
      return;
    this.setBox(...this.box);
  }
  calculateMinMaxRatio() {
    if (!this.box || !this[0] && !this[1])
      return;
    let propertyName = this.vertical ? "minVerticalSize" : "minHorizontalSize";
    let size = this.vertical ? this.box[3] - this.padding.top - this.padding.bottom : this.box[2] - this.padding.left - this.padding.right;
    this.minRatio = this[0] ? this[0][propertyName] / size : 0;
    this.maxRatio = this[1] ? (size - this[1][propertyName]) / size : 1;
  }
  render() {
    if (this.element)
      return this.element;
    this.element = dom.buildDom(["div", {
      class: "box" + this.classNames,
      $host: this
    }]);
    this.splitter = dom.buildDom(["div", {
      class: `splitter splitter${this.vertical ? "-v" : "-h"}`
    }, ["div"]]);
    this.splitter.onmousedown = this.onMouseDown.bind(this);
    this.element.appendChild(this.splitter);
    this.element.$host = this;
    this.element.style.backgroundColor = this.color;
    this.element.style.position = "absolute";
    this.renderToolBarList();
    this.renderChildren();
    if (!this.ratio)
      this.calculateRatio();
    return this.element;
  }
  renderToolBarList() {
    for (let position in this.toolBars) {
      this.addToolBar(position, this.toolBars[position]);
    }
  }
  addToolBar(position, bar) {
    var _a, _b;
    if (position == "left" || position == "right")
      bar.direction = "vertical";
    (_b = (_a = this.toolBars[position]) == null ? void 0 : _a.element) == null ? void 0 : _b.remove();
    bar.position = position;
    this.padding[position] = bar.size;
    this.element.appendChild(bar.render());
    this.toolBars[position] = bar;
  }
  removeToolBar(position) {
    delete this.toolBars[position];
    this.padding[position] = 0;
  }
  renderChildren() {
    this.renderChild(this[0]);
    this.renderChild(this[1]);
    this.calculateMinSize();
  }
  renderChild(child) {
    if (!child)
      return;
    child.on("editorAdded", this.$editorAdded);
    this.element.appendChild(child.render());
  }
  calculateMinSize(forceChildrenSize = false) {
    let childrenMinVerticalSize = 0;
    let childrenMinHorizontalSize = 0;
    let calculateChildBoxMinSize = (childBox) => {
      if (this.vertical) {
        childrenMinVerticalSize += childBox.minVerticalSize;
        childrenMinHorizontalSize = Math.max(childBox.minHorizontalSize, childrenMinHorizontalSize);
      } else {
        childrenMinVerticalSize = Math.max(childBox.minVerticalSize, childrenMinVerticalSize);
        childrenMinHorizontalSize += childBox.minHorizontalSize;
      }
    };
    if (this[0])
      calculateChildBoxMinSize(this[0]);
    if (this[1])
      calculateChildBoxMinSize(this[1]);
    if (forceChildrenSize) {
      this.minVerticalSize = childrenMinVerticalSize;
      this.minHorizontalSize = childrenMinHorizontalSize;
    } else {
      this.minVerticalSize = Math.max(this.minVerticalSize, childrenMinVerticalSize);
      this.minHorizontalSize = Math.max(this.minHorizontalSize, childrenMinHorizontalSize);
    }
    this.minSize = this.vertical ? this.minVerticalSize : this.minHorizontalSize;
    this.calculateMinMaxRatio();
  }
  calculateRatio() {
    if (this[0]) {
      this.calculateChildRatio(this[0]);
    }
    if (this.ratio || this.fixedChild) {
      return;
    }
    if (this[1]) {
      this.calculateChildRatio(this[1]);
    }
    if (!this.ratio && !this.fixedChild) {
      this.ratio = 0.5;
    }
  }
  calculateChildRatio(childBox, isSecond = false) {
    if (!childBox.size) {
      return;
    }
    let size = childBox.size;
    switch (this.sizeUnit) {
      case SizeUnit.px:
        childBox.fixedSize = size;
        this.fixedChild = childBox;
        break;
      case SizeUnit.percent:
        if (isSecond) {
          size = 100 - size;
        }
        this.ratio = Math.min(size / 100, 1);
        break;
    }
  }
  renderButtons(buttonList) {
    let buttons = buttonList.map((button) => {
      return dom.buildDom(["div", {
        class: "button " + button.class,
        title: button.title,
        onclick: button.onclick
      }, button.content]);
    });
    this.setButtons(buttons);
  }
  /**
   * Sets buttons of this box top-right tabBar
   */
  setButtons(buttons) {
    if (this.topRightPane)
      this.topRightPane.removeButtons();
    this.topRightPane = this.getTopRightPane();
    if (this.topRightPane)
      this.topRightPane.setButtons(buttons);
  }
  addButton(button) {
    this.topRightPane = this.getTopRightPane();
    if (this.topRightPane)
      this.topRightPane.addButton(button);
  }
  /**
   * Finds the most top-right Pane
   */
  getTopRightPane() {
    let childBox = this.vertical ? this[0] || this[1] : this[1] || this[0];
    if (!childBox)
      return;
    return childBox.getTopRightPane();
  }
  setBox(x, y, w, h) {
    this.box = [x, y, w, h];
    if (this.isMaximized) {
      x = 0;
      y = 0;
      w = window.innerWidth;
      h = window.innerHeight;
    }
    Utils.setBox(this.element, x, y, w, h);
    this.calculateMinMaxRatio();
    this.$updateChildSize(x, y, w, h);
  }
  $updateChildSize(x, y, w, h) {
    var _a;
    let splitterSize = SPLITTER_SIZE;
    if (!this[0] || this[0].hidden || !this[1] || this[1].hidden) {
      this.splitter.style.display = "none";
      splitterSize = 0;
    } else {
      this.splitter.style.display = "";
    }
    this.updateToolBarSize(w, h);
    w -= this.padding.left + this.padding.right;
    h -= this.padding.top + this.padding.bottom;
    x = this.padding.left;
    y = this.padding.top;
    if (this.fixedChild) {
      let size = this.fixedChild.fixedSize;
      if (this.fixedChild === this[1]) {
        size = this.vertical ? h - size : w - size;
      }
      this.ratio = this.vertical ? size / h : size / w;
    }
    this.ratio = Math.max(this.minRatio, Math.min((_a = this.ratio) != null ? _a : this.maxRatio, this.maxRatio));
    let ratio = this.ratio;
    if (!this[0] || this[0].hidden) {
      ratio = 0;
    } else if (!this[1] || this[1].hidden) {
      ratio = 1;
    }
    if (this.vertical) {
      let splitY = h * ratio - splitterSize;
      if (this.splitter)
        Utils.setBox(this.splitter, x, y + splitY, w, splitterSize);
      if (this[0])
        this[0].setBox(x, y, w, splitY);
      if (this[1])
        this[1].setBox(x, y + splitY + splitterSize, w, h - splitY - splitterSize);
    } else {
      let splitX = w * ratio - splitterSize;
      if (this.splitter)
        Utils.setBox(this.splitter, x + splitX, y, splitterSize, h);
      if (this[0])
        this[0].setBox(x, y, splitX, h);
      if (this[1])
        this[1].setBox(x + splitX + splitterSize, y, w - splitX - splitterSize, h);
    }
  }
  updateToolBarSize(width, height) {
    let bar, x, y, w, h;
    for (let type in this.toolBars) {
      x = 0;
      y = 0;
      w = width;
      h = height;
      bar = this.toolBars[type];
      switch (type) {
        case "top":
        case "bottom":
          h = bar.size;
          if (type === "bottom")
            y = height - bar.size;
          break;
        case "left":
        case "right":
          w = bar.size;
          y = this.padding.top;
          h -= this.padding.top + this.padding.bottom;
          if (type === "right")
            x = width - bar.size;
          break;
        default:
          continue;
      }
      bar.setBox(x, y, w, h);
    }
  }
  restore(disableAnimation = false) {
    let node = this.element;
    function rmClass(ch, cls) {
      for (let i = 0; i < ch.length; i++) {
        if (ch[i].classList)
          ch[i].classList.remove(cls);
      }
    }
    let finishRestore = () => {
      classes.forEach(function(className) {
        rmClass(document.querySelectorAll("." + className), className);
      });
      this.setBox(...this.box);
    };
    let classes = [
      "fullScreenSibling",
      "fullScreenNode",
      "fullScreenParent"
    ];
    this.isMaximized = false;
    if (disableAnimation) {
      finishRestore();
    } else {
      Box.enableAnimation();
      node.addEventListener("transitionend", function handler(l) {
        Box.disableAnimation();
        node.removeEventListener("transitionend", handler);
        finishRestore();
      });
    }
    let parentRect = node.parentNode.getBoundingClientRect();
    let top = parentRect.top + this.box[1];
    let left = parentRect.left + this.box[0];
    Utils.setBox(node, left, top, this.box[2], this.box[3]);
  }
  maximize(disableAnimation = false) {
    let node = this.element;
    function addClasses() {
      node.classList.add("fullScreenNode");
      let parent = node.parentNode;
      while (parent && parent !== document.body) {
        if (parent.classList)
          parent.classList.add("fullScreenParent");
        let childNodes = parent.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          let childNode = childNodes[i];
          if (childNode != node && childNode.classList && !childNode.classList.contains("fullScreenParent"))
            childNode.classList.add("fullScreenSibling");
        }
        parent = parent.parentNode;
      }
    }
    let rect = node.getBoundingClientRect();
    Utils.setBox(node, rect.left, rect.top, rect.width, rect.height);
    addClasses();
    this.isMaximized = true;
    node.getBoundingClientRect();
    if (!disableAnimation) {
      Box.enableAnimation();
      node.addEventListener("transitionend", function handler() {
        node.removeEventListener("transitionend", handler);
        Box.disableAnimation();
      });
    }
    this.setBox(...this.box);
  }
  toggleMaximize() {
    if (this.isMaximized)
      this.restore();
    else
      this.maximize();
  }
  remove() {
    this.removeAllChildren();
    if (this.element)
      this.element.remove();
    if (this.parent) {
      if (this.parent[0] == this)
        this.parent[0] = void 0;
      if (this.parent[1] == this)
        this.parent[1] = void 0;
      this.parent.recalculateAllMinSizes();
      this.parent = void 0;
    }
  }
  removeAllChildren() {
    this.removeChild(this[0]);
    this.removeChild(this[1]);
    this[0] = void 0;
    this[1] = void 0;
  }
  removeChild(child) {
    if (!child)
      return;
    child.off("editorAdded", this.$editorAdded);
    child.remove();
    child.element.remove();
  }
  toggleShowHide() {
    var _a;
    Box.enableAnimation();
    this.hidden = !this.hidden;
    (_a = this.parent) == null ? void 0 : _a.resize();
    let node = this.element;
    let self = this;
    node.addEventListener("transitionend", function handler() {
      var _a2;
      node.removeEventListener("transitionend", handler);
      Box.disableAnimation();
      (_a2 = self.parent) == null ? void 0 : _a2.resize();
    });
  }
  hide() {
    var _a;
    Box.enableAnimation();
    this.hidden = true;
    (_a = this.parent) == null ? void 0 : _a.resize();
    let node = this.element;
    let self = this;
    node.addEventListener("transitionend", function handler() {
      var _a2;
      node.removeEventListener("transitionend", handler);
      Box.disableAnimation();
      (_a2 = self.parent) == null ? void 0 : _a2.resize();
    });
  }
  show() {
    var _a;
    Box.enableAnimation();
    this.hidden = false;
    (_a = this.parent) == null ? void 0 : _a.resize();
    let node = this.element;
    let self = this;
    node.addEventListener("transitionend", function handler() {
      var _a2;
      node.removeEventListener("transitionend", handler);
      Box.disableAnimation();
      (_a2 = self.parent) == null ? void 0 : _a2.resize();
    });
  }
  /**
   *
   * @param {Number} previousBoxIndex
   * @param {Box} box
   * @returns {Box}
   */
  addChildBox(previousBoxIndex, box) {
    let previousBox, index;
    if (previousBoxIndex instanceof Box) {
      previousBox = previousBoxIndex;
      index = this[0] == previousBox ? 0 : 1;
    } else {
      index = previousBoxIndex;
      previousBox = this[index];
    }
    if (previousBox && previousBox === box)
      return previousBox;
    let previousParent = box.parent;
    if (previousParent && previousParent !== this) {
      let previousIndex = previousParent[0] === box ? 0 : 1;
      previousParent[previousIndex] = null;
      previousParent.ratio = 1;
      if (previousParent.fixedChild && previousParent.fixedChild === box) {
        previousParent.fixedChild = null;
      }
      previousParent.resize();
    }
    this[index] = box;
    box.parent = this;
    this.renderChild(box);
    if (previousBox && previousBox.isMaximized) {
      previousBox.restore(true);
      box.maximize(true);
    }
    if (previousBox && previousBox.parent === this) {
      if (this.fixedChild && this.fixedChild == previousBox) {
        box.fixedSize = previousBox.fixedSize;
        if (!box.size)
          box.size = previousBox.size;
        previousBox.fixedSize = previousBox.size = null;
        this.fixedChild = box;
      }
      previousBox.remove();
    }
    if (!this.fixedChild)
      this.calculateChildRatio(box);
    this.recalculateAllMinSizes();
    this.resize();
    return box;
  }
  recalculateAllMinSizes() {
    let node = this;
    while (node) {
      node.calculateMinSize(true);
      node = node.parent;
    }
  }
}

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/elements/search.ts

class SettingsSearchBox {
  constructor(prefsParentNode) {
    this.hideFiltered = false;
    this.value = "";
    this.currValue = "";
    this.searchResultsCount = 0;
    this.prefsParentNode = prefsParentNode;
  }
  filter() {
    let childNode;
    let noResult = true;
    this.searchResultsCount = 0;
    for (let i = 0; i < this.prefsParentNode.childNodes.length; i++) {
      childNode = this.prefsParentNode.childNodes[i];
      this.updateVisibility(childNode);
      if (noResult && !childNode.isFiltered) {
        noResult = false;
      }
    }
    if (this.currValue != "") {
      this.searchResults.innerHTML = " " + this.searchResultsCount + " Preferences Found";
    } else {
      this.searchResults.innerHTML = "";
    }
  }
  showHide(item, show) {
    show = show || false;
    item.isFiltered = !show;
    item.style.display = show ? "block" : "none";
  }
  updateVisibility(item) {
    let text = item.innerText;
    let tokens = this.getTokens(text);
    let show = true;
    if (!tokens) {
      show = false;
    } else {
      this.searchResultsCount++;
    }
    this.showHide(item, show);
  }
  getTokens(string) {
    let tokens = [];
    let caption = string.toLowerCase();
    let lower = this.currValue.toLowerCase();
    let upper = this.currValue.toUpperCase();
    function addToken(value, className) {
      value && tokens.push({
        type: className || "",
        value
      });
    }
    let lastIndex = -1;
    let matchMask = 0;
    let index, distance;
    let fullMatchIndex = caption.indexOf(lower);
    if (fullMatchIndex === -1) {
      for (let j = 0; j < this.currValue.length; j++) {
        let i1 = caption.indexOf(lower[j], lastIndex + 1);
        let i2 = caption.indexOf(upper[j], lastIndex + 1);
        index = i1 >= 0 ? i2 < 0 || i1 < i2 ? i1 : i2 : i2;
        if (index < 0)
          return null;
        distance = index - lastIndex - 1;
        if (distance > 0) {
          matchMask = matchMask | 1 << j;
        }
        lastIndex = index;
      }
    }
    let filterText = lower;
    lower = caption.toLowerCase();
    lastIndex = 0;
    let lastI = 0;
    for (let i = 0; i <= filterText.length; i++) {
      if (i !== lastI && (matchMask & 1 << i || i === filterText.length)) {
        let sub = filterText.slice(lastI, i);
        lastI = i;
        index = lower.indexOf(sub, lastIndex);
        if (index === -1)
          continue;
        addToken(string.slice(lastIndex, index), "");
        lastIndex = index + sub.length;
        addToken(string.slice(index, lastIndex), "completion-highlight");
      }
    }
    addToken(string.slice(lastIndex, string.length), "");
    return tokens;
  }
  build() {
    this.element = dom.buildDom([
      "div",
      {},
      ["input", { class: "search_field tbsimple", placeholder: "Search preferences" }],
      ["span", { class: "search_results" }],
      ["span", { class: "searchbtn_close" }]
    ]);
    this.element.$host = this;
    this.searchField = this.element.querySelector(".search_field");
    this.searchResults = this.element.querySelector(".search_results");
    let _this = this;
    this.element.querySelector(".searchbtn_close").addEventListener("mousedown", function(e) {
      _this.clear();
    });
    this.searchField.addEventListener("input", function(e) {
      _this.currValue = e.target.value;
      _this.filter();
    });
  }
  clear() {
    if (this.currValue.length) {
      this.searchField.value = "";
      this.currValue = "";
      this.filter();
    }
  }
}

// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(93379);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleDomAPI.js
var styleDomAPI = __webpack_require__(7795);
var styleDomAPI_default = /*#__PURE__*/__webpack_require__.n(styleDomAPI);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertBySelector.js
var insertBySelector = __webpack_require__(90569);
var insertBySelector_default = /*#__PURE__*/__webpack_require__.n(insertBySelector);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js
var setAttributesWithoutAttributes = __webpack_require__(3565);
var setAttributesWithoutAttributes_default = /*#__PURE__*/__webpack_require__.n(setAttributesWithoutAttributes);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertStyleElement.js
var insertStyleElement = __webpack_require__(19216);
var insertStyleElement_default = /*#__PURE__*/__webpack_require__.n(insertStyleElement);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleTagTransform.js
var styleTagTransform = __webpack_require__(44589);
var styleTagTransform_default = /*#__PURE__*/__webpack_require__.n(styleTagTransform);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./packages/ace-layout/styles/switcher.css
var switcher = __webpack_require__(83619);
;// CONCATENATED MODULE: ./packages/ace-layout/styles/switcher.css

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (styleTagTransform_default());
options.setAttributes = (setAttributesWithoutAttributes_default());

      options.insert = insertBySelector_default().bind(null, "head");
    
options.domAPI = (styleDomAPI_default());
options.insertStyleElement = (insertStyleElement_default());

var update = injectStylesIntoStyleTag_default()(switcher/* default */.Z, options);




       /* harmony default export */ const styles_switcher = (switcher/* default */.Z && switcher/* default.locals */.Z.locals ? switcher/* default.locals */.Z.locals : undefined);

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/elements/switcher.ts
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};


dom.importCssString(switcher_namespaceObject, "switcher.css");
class Switcher {
  constructor(options) {
    let _a = options, { className, checked } = _a, other = __objRest(_a, ["className", "checked"]);
    this.className = className || "cboffline";
    this.options = other;
    this.checked = checked || false;
  }
  render() {
    this.element = dom.buildDom(["div", __spreadValues({
      class: this.className + (this.checked ? " " + this.className + "Checked" : ""),
      onmousedown: (e) => {
        e.preventDefault();
        this.checked = !this.checked;
        e.target.className = this.className + (this.checked ? " " + this.className + "Down" : "");
      },
      onclick: (e) => {
        e.preventDefault();
        e.target.className = this.className + (this.checked ? " " + this.className + "Checked" : "");
      }
    }, this.options), ""]);
    this.element.$host = this;
    return this.element;
  }
  toJSON() {
  }
  remove() {
  }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./packages/ace-layout/styles/button.css
var styles_button = __webpack_require__(75715);
;// CONCATENATED MODULE: ./packages/ace-layout/styles/button.css

      
      
      
      
      
      
      
      
      

var button_options = {};

button_options.styleTagTransform = (styleTagTransform_default());
button_options.setAttributes = (setAttributesWithoutAttributes_default());

      button_options.insert = insertBySelector_default().bind(null, "head");
    
button_options.domAPI = (styleDomAPI_default());
button_options.insertStyleElement = (insertStyleElement_default());

var button_update = injectStylesIntoStyleTag_default()(styles_button/* default */.Z, button_options);




       /* harmony default export */ const ace_layout_styles_button = (styles_button/* default */.Z && styles_button/* default.locals */.Z.locals ? styles_button/* default.locals */.Z.locals : undefined);

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/elements/button.ts
var button_defProp = Object.defineProperty;
var button_getOwnPropSymbols = Object.getOwnPropertySymbols;
var button_hasOwnProp = Object.prototype.hasOwnProperty;
var button_propIsEnum = Object.prototype.propertyIsEnumerable;
var button_defNormalProp = (obj, key, value) => key in obj ? button_defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var button_spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (button_hasOwnProp.call(b, prop))
      button_defNormalProp(a, prop, b[prop]);
  if (button_getOwnPropSymbols)
    for (var prop of button_getOwnPropSymbols(b)) {
      if (button_propIsEnum.call(b, prop))
        button_defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var button_objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (button_hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && button_getOwnPropSymbols)
    for (var prop of button_getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && button_propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};


dom.importCssString(button_namespaceObject, "button.css");
class Button {
  constructor(options) {
    let _a = options, { disabled, value, className } = _a, other = button_objRest(_a, ["disabled", "value", "className"]);
    this.disabled = disabled;
    this.value = value;
    this.className = className || "blackbutton";
    this.options = other;
  }
  remove() {
  }
  render() {
    this.element = dom.buildDom(["div", button_spreadValues({
      class: this.className + (this.disabled ? this.className + "Disabled" : ""),
      onmousedown: (e) => {
        e.preventDefault();
        e.target.className = this.className + " " + this.className + "Down";
      },
      onmouseup: (e) => {
        e.target.className = this.className;
      },
      onmouseover: (e) => {
        e.target.className = this.className + " " + this.className + "Over";
      },
      onfocus: (e) => {
        e.target.className = this.className + " " + this.className + "Focus";
      },
      onunfocus: (e) => {
        e.target.className = this.className;
      },
      onmouseout: (e) => {
        e.target.className = this.className;
      }
    }, this.options), this.value]);
    this.element.$host = this;
    return this.element;
  }
  toJSON() {
  }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./packages/ace-layout/styles/dropdown.css
var dropdown = __webpack_require__(86800);
;// CONCATENATED MODULE: ./packages/ace-layout/styles/dropdown.css

      
      
      
      
      
      
      
      
      

var dropdown_options = {};

dropdown_options.styleTagTransform = (styleTagTransform_default());
dropdown_options.setAttributes = (setAttributesWithoutAttributes_default());

      dropdown_options.insert = insertBySelector_default().bind(null, "head");
    
dropdown_options.domAPI = (styleDomAPI_default());
dropdown_options.insertStyleElement = (insertStyleElement_default());

var dropdown_update = injectStylesIntoStyleTag_default()(dropdown/* default */.Z, dropdown_options);




       /* harmony default export */ const styles_dropdown = (dropdown/* default */.Z && dropdown/* default.locals */.Z.locals ? dropdown/* default.locals */.Z.locals : undefined);

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./packages/ace-layout/styles/menu.css
var menu = __webpack_require__(47594);
;// CONCATENATED MODULE: ./packages/ace-layout/styles/menu.css

      
      
      
      
      
      
      
      
      

var menu_options = {};

menu_options.styleTagTransform = (styleTagTransform_default());
menu_options.setAttributes = (setAttributesWithoutAttributes_default());

      menu_options.insert = insertBySelector_default().bind(null, "head");
    
menu_options.domAPI = (styleDomAPI_default());
menu_options.insertStyleElement = (insertStyleElement_default());

var menu_update = injectStylesIntoStyleTag_default()(menu/* default */.Z, menu_options);




       /* harmony default export */ const styles_menu = (menu/* default */.Z && menu/* default.locals */.Z.locals ? menu/* default.locals */.Z.locals : undefined);

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/elements/dropdown.ts
var dropdown_defProp = Object.defineProperty;
var dropdown_getOwnPropSymbols = Object.getOwnPropertySymbols;
var dropdown_hasOwnProp = Object.prototype.hasOwnProperty;
var dropdown_propIsEnum = Object.prototype.propertyIsEnumerable;
var dropdown_defNormalProp = (obj, key, value) => key in obj ? dropdown_defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var dropdown_spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (dropdown_hasOwnProp.call(b, prop))
      dropdown_defNormalProp(a, prop, b[prop]);
  if (dropdown_getOwnPropSymbols)
    for (var prop of dropdown_getOwnPropSymbols(b)) {
      if (dropdown_propIsEnum.call(b, prop))
        dropdown_defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var dropdown_objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (dropdown_hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && dropdown_getOwnPropSymbols)
    for (var prop of dropdown_getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && dropdown_propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};




dom.importCssString(dropdown_namespaceObject, "dropdown.css");
dom.importCssString(menu_namespaceObject, "menu.css");
const DEFAULT_WIDTH = 200;
class Dropdown {
  constructor(options) {
    this.onMouseDown = (e) => {
      e.preventDefault();
      let node = Utils.findNode(e.target, this.className);
      if (node && node == this.element)
        return;
      node = Utils.findNode(e.target, this.popup.element.className);
      if (node && node == this.popup.element)
        return;
      this.closePopup();
    };
    this.onMouseWheel = (e) => {
      this.closePopup();
    };
    let _a = options, { disabled, items, value, className, width } = _a, other = dropdown_objRest(_a, ["disabled", "items", "value", "className", "width"]);
    this.disabled = disabled != null ? disabled : false;
    this.items = items;
    this.value = value != null ? value : items[0].value;
    this.className = className || "black_dropdown";
    this.width = width != null ? width : DEFAULT_WIDTH;
    this.options = other;
  }
  render() {
    this.element = dom.buildDom(["div", dropdown_spreadValues({
      class: this.className + (this.disabled ? this.className + "Disabled" : ""),
      style: "width: " + this.width + "px",
      onmousedown: (e) => {
        e.preventDefault();
        this.element.className = this.className + " " + this.className + "Down";
        this.togglePopup();
      },
      onmouseup: (e) => {
        this.element.className = this.className;
      },
      onmouseover: (e) => {
        this.element.className = this.className + " " + this.className + "Over";
      },
      onfocus: (e) => {
        this.element.className = this.className + " " + this.className + "Focus";
      },
      onunfocus: (e) => {
        this.element.className = this.className;
      },
      onmouseout: (e) => {
        this.element.className = this.className;
      }
    }, this.options), [
      ["div", {
        class: "lbl",
        ref: "lbl"
      }],
      ["div", {
        class: "button"
      }]
    ]], void 0, this);
    this.element.$host = this;
    this.updateLabel();
    return this.element;
  }
  togglePopup() {
    if (this.isPopupOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }
  openPopup() {
    if (this.isPopupOpen)
      return;
    this.popup = new Popup();
    this.popup.items = this.items;
    this.popup.selectedItem = this.value;
    this.popup.parent = this;
    this.popup.selectCallback = (host) => {
      this.select(host.value);
      this.closePopup();
    };
    this.popup.open();
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("wheel", this.onMouseWheel);
    this.isPopupOpen = true;
  }
  closePopup() {
    if (!this.isPopupOpen)
      return;
    this.popup.close();
    this.isPopupOpen = false;
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("wheel", this.onMouseWheel);
  }
  select(value) {
    this.setValue(value);
  }
  setValue(value) {
    if (this.value !== value) {
      this.value = value;
      this.updateLabel();
    }
  }
  updateLabel() {
    let items = this.items;
    for (let i = 0; i < items.length; i++) {
      let x = items[i];
      let itemValue = x.value;
      if (this.value === itemValue) {
        this.lbl.innerHTML = x.caption;
        return;
      }
    }
  }
  toJSON() {
  }
}
class Popup {
  open() {
    this.build();
    this.render();
  }
  build() {
    if (this.element) {
      return;
    }
    let result = [];
    if (this.items) {
      let items = Object.values(this.items).sort(function(item1, item2) {
        return item1.position - item2.position;
      });
      let afterDivider = true;
      result = items.map((item) => {
        if (item.caption[0] === "~") {
          if (afterDivider)
            return;
          afterDivider = true;
          return [
            "div",
            {
              class: "menu_divider",
              $host: item
            }
          ];
        }
        afterDivider = false;
        let classList = ["menu_item"];
        if (item.checked)
          classList.push(item.type === "check" ? "checked" : "selected");
        if (item.map)
          classList.push("submenu");
        if (item.disabled)
          classList.push("disabled");
        if (item.value === this.selectedItem)
          classList.push("selected");
        return [
          "div",
          {
            class: classList.join(" "),
            $host: item
          },
          ["u", " "],
          ["a", item.caption + ""],
          [
            "span",
            {
              class: "shortcut"
            },
            item.hotKey
          ]
        ];
      }).filter(Boolean);
      if (afterDivider)
        result.pop();
    }
    this.element = dom.buildDom(
      [
        "blockquote",
        {
          class: "menu",
          style: "display:block",
          $host: this.parent,
          onmousemove: this.onMouseMove.bind(this),
          onclick: this.onClick.bind(this)
        },
        result
      ],
      document.body
    );
  }
  render() {
    if (this.element.style.maxWidth) {
      this.element.style.maxWidth = window.innerWidth + "px";
    }
    if (this.element.style.maxHeight) {
      this.element.style.maxHeight = window.innerHeight + "px";
    }
    let elRect = this.element.getBoundingClientRect();
    let edge = Utils.getElementEdges(this.element);
    let parentRect, top, left;
    if (this.parent && this.parent.element) {
      parentRect = this.parent.element.getBoundingClientRect();
    }
    if (parentRect) {
      if (this.isSubMenu) {
        top = parentRect.top - edge.top;
        left = parentRect.right;
      } else {
        top = parentRect.bottom;
        left = parentRect.left;
      }
    } else {
      top = this.position.y;
      left = this.position.x;
    }
    let targetH = Math.min(elRect.height, window.innerHeight);
    let availableH = window.innerHeight - top - edge.top - edge.bottom - 2;
    if (availableH < targetH && (!parentRect || this.isSubMenu)) {
      let tmpTop = parentRect ? window.innerHeight : top;
      top = tmpTop - targetH - edge.top;
      availableH = window.innerHeight - top - edge.top - edge.bottom - 2;
    }
    this.element.style.maxHeight = availableH - 10 + "px";
    elRect = this.element.getBoundingClientRect();
    let availableW = window.innerWidth - left - edge.left - edge.right - 2;
    if (availableW < elRect.width) {
      if (parentRect) {
        let tmpLeft = this.isSubMenu ? parentRect.left : parentRect.right;
        if (tmpLeft > availableW) {
          this.direction = "left";
          left = tmpLeft - elRect.width + edge.left;
          left = Math.max(left, 0);
          availableW = tmpLeft + edge.left + edge.right;
        }
        if (availableW < elRect.width) {
          this.element.style.maxWidth = availableW + "px";
          this.element.style.overflowX = "auto";
        }
      } else {
        left = window.innerWidth - elRect.width - edge.left - edge.right;
      }
    }
    this.element.style.top = top + "px";
    this.element.style.left = left + "px";
    this.element.style.position = "absolute";
    this.element.style.zIndex = 195055;
    this.element.style.overflowY = "auto";
  }
  close() {
    if (this.element) {
      this.element.remove();
      delete this.element;
    }
  }
  scrollIfNeeded() {
    if (!this.selectedMenu) {
      return;
    }
    let menu = this.element;
    let item = this.selectedMenu.buttonElement;
    let menuRect = menu.getBoundingClientRect();
    let itemRect = item.getBoundingClientRect();
    if (itemRect.top < menuRect.top) {
      item.scrollIntoView(true);
    } else if (itemRect.bottom > menuRect.bottom) {
      item.scrollIntoView(false);
    }
  }
  //handle events
  onMouseMove(e) {
    if (e.target === this.element) {
      return;
    }
    let target = Utils.findHostTarget(e.target);
    if (target === this.element) {
      return;
    }
    if (target == this.activeItem) {
      return;
    }
    if (this.activeItem) {
      this.activeItem.classList.remove("hover");
    }
    this.activeItem = target;
    this.activeItem.classList.add("hover");
  }
  onClick(e) {
    if (e.target === this.element)
      return;
    let target = Utils.findHostTarget(e.target);
    if (target === this.element)
      return;
    let host = target.$host;
    this.selectCallback && this.selectCallback(host);
  }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./packages/demo/preferences/preferences.css
var preferences = __webpack_require__(85334);
;// CONCATENATED MODULE: ./packages/demo/preferences/preferences.css

      
      
      
      
      
      
      
      
      

var preferences_options = {};

preferences_options.styleTagTransform = (styleTagTransform_default());
preferences_options.setAttributes = (setAttributesWithoutAttributes_default());

      preferences_options.insert = insertBySelector_default().bind(null, "head");
    
preferences_options.domAPI = (styleDomAPI_default());
preferences_options.insertStyleElement = (insertStyleElement_default());

var preferences_update = injectStylesIntoStyleTag_default()(preferences/* default */.Z, preferences_options);




       /* harmony default export */ const preferences_preferences = (preferences/* default */.Z && preferences/* default.locals */.Z.locals ? preferences/* default.locals */.Z.locals : undefined);

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/toolbars/toolbar.ts

class Toolbar {
  setBox(x, y, w, h) {
    Utils.setBox(this.element, x, y, w, h);
  }
  constructor(options) {
    this.direction = (options == null ? void 0 : options.direction) || "horizontal";
    this.size = (options == null ? void 0 : options.size) || 27;
    this.position = options == null ? void 0 : options.position;
  }
}

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/toolbars/tabPanelBar.ts

class TabPanelBar extends Toolbar {
  constructor(options) {
    var _a, _b;
    super(options);
    this.selectedTabs = [];
    this.tabList = [];
    this.scrollLeft = 0;
    this.animationSteps = 0;
    this.MIN_TAB_SIZE = 120;
    this.MAX_TAB_SIZE = 150;
    this.activeTabHistory = [];
    this.onMouseWheel = (e) => {
      let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) > 50) {
        this.animateScroll(d);
      } else {
        this.stopScrollAnimation();
        this.setScrollPosition((this.scrollLeft || 0) + d);
      }
    };
    this.initTabList = (_b = (_a = options.tabList) != null ? _a : options.panelList) != null ? _b : [];
  }
  isVertical() {
    return this.direction === "vertical";
  }
  getDraggingElementSize() {
    if (!this.tabDraggingElement)
      return 0;
    let draggingElementSize = this.isVertical() ? this.tabDraggingElement.style.height : this.tabDraggingElement.style.width;
    return parseInt(draggingElementSize, 10);
  }
  tabMouseDown(tab, expand = false, toggle = false) {
    if (expand) {
      this.expandSelection(tab, toggle);
    } else {
      this.anchorTab = null;
      if (toggle) {
        this.toggleSelection(tab);
      } else {
        this.activateTab(tab, void 0, this.selectedTabs.indexOf(tab) < 0);
      }
    }
  }
  expandSelection(tab, toggle = false) {
    if (!this.anchorTab)
      this.anchorTab = this.activeTab;
    let prevSelectedTabs = this.selectedTabs;
    this.selectedTabs = [];
    let start = this.tabList.indexOf(this.anchorTab);
    let end = this.tabList.indexOf(tab);
    if (end < start) {
      [start, end] = [end, start];
    }
    for (let i = start; i <= end; i++) {
      this.addSelection(this.tabList[i]);
    }
    prevSelectedTabs.forEach((selectedTab) => {
      if (this.selectedTabs.indexOf(selectedTab) < 0) {
        if (!toggle) {
          this.deselectTab(selectedTab);
        } else {
          this.addSelection(selectedTab);
        }
      }
    });
    this.activateTab(tab);
  }
  toggleSelection(tab) {
    let index = this.selectedTabs.indexOf(tab);
    if (index < 0) {
      this.activateTab(tab);
    } else if (tab !== this.activeTab) {
      this.removeSelection(tab);
    }
  }
  addSelection(tab) {
    if (this.selectedTabs.indexOf(tab) < 0) {
      this.selectTab(tab);
      this.selectedTabs.push(tab);
    }
  }
  selectTab(tab) {
    tab.element.classList.add("selected");
  }
  deselectTab(tab) {
    tab.element.classList.remove("selected");
  }
  removeSelection(tab) {
    if (this.selectedTabs.indexOf(tab) < 0)
      return;
    this.deselectTab(tab);
    this.selectedTabs.splice(this.selectedTabs.indexOf(tab), 1);
  }
  removeSelections() {
    this.selectedTabs.forEach((selectedTab) => {
      this.deselectTab(selectedTab);
    });
    this.selectedTabs = [];
  }
  scrollTabIntoView(tab) {
    let index = this.tabList.indexOf(tab);
    this.setScrollPosition((index + 1) * this.tabWidth);
  }
  activateTab(tab, content, removeSelections = false) {
    removeSelections && this.removeSelections();
    this.activeTabClicked = false;
    this.addSelection(tab);
    if (this.activeTab) {
      if (this.activeTab === tab) {
        this.activeTabClicked = true;
        return;
      }
      if (this.activeTabHistory.indexOf(this.activeTab) >= 0)
        this.activeTabHistory.splice(this.activeTabHistory.indexOf(this.activeTab), 1);
      this.activeTabHistory.push(this.activeTab);
      this.activeTab.deactivate();
    }
    tab.activate();
    this.activeTab = tab;
    this.configure();
  }
  removeTab(tab) {
    if (tab === this.activeTab)
      this.activeTab = void 0;
    let index = this.tabList.indexOf(tab);
    if (index >= 0)
      this.tabList.splice(index, 1);
    tab.parent = void 0;
  }
  activatePrevious(index) {
    if (this.tabList.length) {
      let tab = this.tabList[index - 1] || this.tabList[this.tabList.length - 1];
      this.activateTab(tab);
    }
  }
  addTab(tab, index, content) {
    if (!tab.element)
      tab.render();
    tab.parent = this;
    if (index === void 0 || index === null || index >= this.tabList.length) {
      this.tabContainer.appendChild(tab.element);
      this.tabList.push(tab);
    } else {
      this.tabContainer.insertBefore(tab.element, this.tabContainer.childNodes[index]);
      this.tabList.splice(index, 0, tab);
    }
    if (tab.active)
      this.activateTab(tab, content, true);
    this.configure();
    return tab;
  }
  setScrollPosition(scrollLeft) {
    this.scrollLeft = scrollLeft;
    this.configure();
  }
  animateScroll(v) {
    this.vX = v / 80;
    this.animationSteps += 15;
    if (this.animationSteps > 15) {
      this.vX *= 1.2 * this.animationSteps / 10;
      this.animationSteps = 15 + Math.ceil((this.animationSteps - 15) * 0.75);
    }
    if (this.animationTimer)
      return;
    this.animationTimer = setInterval(() => {
      if (this.animationSteps-- <= 0) {
        return this.stopScrollAnimation();
      }
      let vX = this.vX;
      if (Math.abs(this.vX) < 0.01)
        vX = 0;
      vX = 0.9 * vX;
      let oldScrollLeft = this.scrollLeft;
      this.setScrollPosition(this.scrollLeft + 10 * vX);
      if (oldScrollLeft == this.scrollLeft)
        this.animationSteps = 0;
      this.vX = vX;
    }, 10);
  }
  stopScrollAnimation() {
    clearInterval(this.animationTimer);
    this.animationTimer = null;
    this.animationScrollLeft = null;
    this.vX = 0;
  }
  transform(el, dx, dy) {
    el.style.left = Math.round(dx) + "px";
    el.dx = dx;
    el.dy = dy;
  }
  startTabDragging(element, index) {
    if (this.isDragging)
      return;
    this.tabDraggingElement = element;
    this.draggingElementIndex = index;
    this.configure();
    this.isDragging = true;
  }
  finishTabDragging() {
    this.draggingElementIndex = void 0;
    this.tabDraggingElement = void 0;
    if (this.activeTabHistory.length) {
      let removedHistoryTabs = [];
      for (let i = 0; i < this.activeTabHistory.length; i++) {
        if (this.tabList.indexOf(this.activeTabHistory[i]) < 0) {
          removedHistoryTabs.push(this.activeTabHistory[i]);
        }
      }
      removedHistoryTabs.forEach((tab) => {
        let index = this.activeTabHistory.indexOf(tab);
        if (index >= 0) {
          this.activeTabHistory.splice(index, 1);
        }
      });
    }
    this.configure();
    this.isDragging = false;
  }
  toJSON() {
    return {
      tabList: this.tabList.map((tab) => tab.toJSON()),
      scrollLeft: this.scrollLeft
    };
  }
}

;// CONCATENATED MODULE: ./packages/ace-layout/mouse/tabbar_handler.ts


let tabbar_handler_event = __webpack_require__(17989);
var TabbarHandler;
((TabbarHandler2) => {
  TabbarHandler2.tabbarMouseDown = function(e, tabConstructor, tabBarConstructor, showSplit = false) {
    let divSplit, splitPosition, pane;
    function hideSplitPosition() {
      if (!divSplit)
        return;
      divSplit.remove();
      divSplit = splitPosition = pane = null;
    }
    function showSplitPosition(e2) {
      let el = e2.target;
      if (tabBar) {
        hideSplitPosition();
        return;
      }
      pane = Utils.findHost(el);
      if (!pane || !pane.acceptsTab || !pane.acceptsTab(tab)) {
        hideSplitPosition();
        return;
      }
      if (pane.tabBar.tabList.length === 0) {
        hideSplitPosition();
        return;
      }
      let dark = false;
      if (!divSplit) {
        divSplit = document.createElement("div");
        document.body.appendChild(divSplit);
      }
      divSplit.className = "split-area" + (dark ? " dark" : "");
      let rect = pane.element.getBoundingClientRect();
      let bHeight = pane.tabBar.element.clientHeight - 1;
      rect = {
        left: rect.left,
        top: rect.top + bHeight,
        width: rect.width,
        height: rect.height - bHeight
      };
      let left = (e2.clientX - rect.left) / rect.width;
      let right = 1 - left;
      let top = (e2.clientY - rect.top) / rect.height;
      let bottom = 1 - top;
      let min = Math.min(left, top, right, bottom);
      if (min == left) {
        splitPosition = [true, false];
        Utils.setBox(divSplit, rect.left, rect.top, rect.width / 2, rect.height);
      } else if (min == right) {
        splitPosition = [false, false];
        Utils.setBox(divSplit, rect.left + rect.width / 2, rect.top, rect.width / 2, rect.height);
      } else if (min == top) {
        splitPosition = [true, true];
        Utils.setBox(divSplit, rect.left, rect.top, rect.width, rect.height / 2);
      } else if (min == bottom) {
        splitPosition = [false, true];
        Utils.setBox(divSplit, rect.left, rect.top + rect.height / 2, rect.width, rect.height / 2);
      }
    }
    if (e.target.classList.contains("tabCloseButton")) {
      return;
    }
    let tab = Utils.findHost(e.target, tabConstructor);
    if (!tab)
      return;
    let tabBar = Utils.findHost(e.target, tabBarConstructor);
    if (!tabBar)
      return;
    let isVertical = tabBar.isVertical();
    tabBar.tabMouseDown(tab, e.shiftKey, e.ctrlKey);
    if (e.shiftKey || e.ctrlKey)
      return;
    let isDragging = false;
    let posX, posY, prevX, prevY;
    let startX = e.clientX, startY = e.clientY;
    let parentRect, tabElement, index, selectedTabs, hostTabBar, hostIndex;
    let prevTab, leftMaxX, topMaxY, nextTab, rightMaxX, bottomMaxY;
    let tabDragElementSize = 0;
    let tabDragElementLeft = 0;
    let tabDragElementTop = 0;
    let calculateNearbyTabsData = function() {
      if (isVertical) {
        topMaxY = prevTab && parseInt(prevTab.style.top, 10) + parseInt(prevTab.style.height, 10) / 2 + parentRect.top;
        bottomMaxY = nextTab && parseInt(nextTab.style.top, 10) + parseInt(nextTab.style.height, 10) / 2 + parentRect.top;
      } else {
        if (prevTab) {
          let prevSibling = prevTab.previousSibling;
          leftMaxX = prevSibling ? parseInt(prevSibling.style.left, 10) + parseInt(prevSibling.style.width, 10) + parentRect.left : parentRect.left;
        }
        rightMaxX = nextTab && parseInt(nextTab.style.left, 10) + parseInt(nextTab.style.width, 10) / 2 + parentRect.left;
      }
    };
    let startDragging = function() {
      if (isDragging || !tabBar)
        return;
      tabElement = dom.buildDom(["div", {
        class: "tabDragging"
      }]);
      let activeIndex = index = tabBar.tabList.indexOf(tab);
      tabBar.tabContainer.insertBefore(tabElement, tab.element);
      tabDragElementLeft = parseInt(tab.element.style.left, 10);
      tabDragElementTop = parseInt(tab.element.style.top, 10);
      selectedTabs = [];
      let selectedTab, selectedTabElement;
      for (let i = 0; i < tabBar.selectedTabs.length; i++) {
        selectedTab = tabBar.selectedTabs[i];
        selectedTab.currentIndex = tabBar.tabList.indexOf(selectedTab);
        if (selectedTab.currentIndex < activeIndex) {
          index--;
          if (isVertical) {
            tabDragElementTop -= parseInt(selectedTab.element.style.top, 10);
          } else {
            tabDragElementLeft -= parseInt(selectedTab.element.style.width, 10);
          }
        }
        selectedTabs.push(selectedTab);
      }
      selectedTabs.sort(function(tab1, tab2) {
        return tab1.currentIndex - tab2.currentIndex;
      });
      for (let i = 0; i < selectedTabs.length; i++) {
        selectedTab = selectedTabs[i];
        selectedTabElement = selectedTab.element;
        tabElement.appendChild(selectedTabElement);
        selectedTabElement.style.pointerEvents = "none";
        if (isVertical) {
          selectedTabElement.style.top = tabDragElementSize + "px";
          tabDragElementSize += parseInt(selectedTabElement.style.height, 10);
        } else {
          selectedTabElement.style.left = tabDragElementSize + "px";
          tabDragElementSize += parseInt(selectedTabElement.style.width, 10);
        }
        tabBar.removeTab(selectedTab);
      }
      prevTab = tabElement.previousSibling;
      nextTab = tabElement.nextSibling;
      parentRect = tabBar.element.getBoundingClientRect();
      if (isVertical) {
        tabDragElementTop += parentRect.top;
        posY = startY - tabDragElementTop;
        posX = startX - parentRect.left;
      } else {
        tabDragElementLeft += parentRect.left;
        posX = startX - tabDragElementLeft;
        posY = startY - parentRect.top;
      }
      prevX = e.clientX;
      prevY = e.clientY;
      hostTabBar = tabBar;
      hostIndex = index;
      calculateNearbyTabsData();
      isDragging = true;
      document.body.appendChild(tabElement);
      if (isVertical) {
        Utils.setBox(tabElement, tabDragElementTop, parentRect.left, parentRect.width, tabDragElementSize);
      } else {
        Utils.setBox(tabElement, tabDragElementLeft, parentRect.top, tabDragElementSize, parentRect.height);
      }
      tabBar.startTabDragging(tabElement, index);
    };
    let finishDragging = function() {
      if (pane && pane.split && splitPosition) {
        let newPane = pane.split(...splitPosition);
        tabBar = newPane.tabBar;
      } else if (!tabBar) {
        tabBar = hostTabBar;
      }
      tabBar.removeSelections();
      tabElement.remove();
      let selectedTab;
      for (let i = 0; i < selectedTabs.length; i++) {
        selectedTab = selectedTabs[i];
        selectedTab.element.style.pointerEvents = "";
        if (selectedTab === tab) {
          selectedTab.active = true;
        }
        tabBar.addTab(selectedTab, index++);
        tabBar.addSelection(selectedTab);
      }
      if (tabBar !== hostTabBar) {
        hostTabBar.removeSelections();
        hostTabBar.activatePrevious(hostIndex);
      }
      tabBar.finishTabDragging();
      isDragging = false;
      hideSplitPosition();
    };
    function distance(dx, dy) {
      return dx * dx + dy * dy;
    }
    let onMouseMove = function(e2) {
      if (e2.type !== "mousemove")
        return;
      if (!isDragging) {
        if (distance(e2.clientX - startX, e2.clientY - startY) < 25)
          return;
        startDragging();
      }
      function removeTabFromBar() {
        tabBar.finishTabDragging();
        tabBar = void 0;
      }
      if (tabBar) {
        tabBar.startTabDragging(tabElement, index);
        if (!isVertical && (e2.clientX < parentRect.left || e2.clientX > parentRect.left + parentRect.width) || isVertical && (e2.clientY < parentRect.top || e2.clientY > parentRect.top + parentRect.height)) {
          removeTabFromBar();
        }
      } else {
        tabBar = Utils.findHost(e2.target, tabBarConstructor);
        if (tabBar) {
          isVertical = tabBar.isVertical();
          let nextTabHost = Utils.findHost(e2.target, tabConstructor);
          if (nextTabHost) {
            index = tabBar.tabList.indexOf(nextTabHost);
            nextTab = nextTabHost.element;
            prevTab = nextTab.previousSibling;
          } else {
            index = tabBar.tabList.length;
            nextTab = null;
            prevTab = tabBar.tabContainer.childNodes[index - 1];
          }
          tabBar.startTabDragging(tabElement, index);
          parentRect = tabBar.element.getBoundingClientRect();
          calculateNearbyTabsData();
        }
      }
      if (showSplit)
        showSplitPosition(e2);
      let left = e2.clientX - posX;
      let top = e2.clientY - posY;
      let x = left;
      let y = top;
      if (tabBar) {
        if (isVertical && (x < parentRect.left - parentRect.width || x > parentRect.left + parentRect.width) || !isVertical && (y < parentRect.top - parentRect.height || y > parentRect.top + parentRect.height)) {
          removeTabFromBar();
        } else {
          if (isVertical) {
            x = parentRect.left;
          } else {
            y = parentRect.top;
          }
          if (isVertical && e2.clientY < prevY && topMaxY && top < topMaxY || !isVertical && e2.clientX < prevX && leftMaxX && left < leftMaxX) {
            if (isVertical) {
              prevTab.style.top = parseInt(prevTab.style.top, 10) + tabDragElementSize + "px";
            } else {
              prevTab.style.left = parseInt(prevTab.style.left, 10) + tabDragElementSize + "px";
            }
            index--;
            [prevTab, nextTab] = [prevTab.previousSibling, prevTab];
            calculateNearbyTabsData();
          } else if (isVertical && e2.clientY > prevY && bottomMaxY && top + tabDragElementSize > bottomMaxY || !isVertical && e2.clientX > prevX && rightMaxX && left + tabDragElementSize > rightMaxX) {
            if (isVertical) {
              nextTab.style.top = parseInt(nextTab.style.top, 10) - tabDragElementSize + "px";
            } else {
              nextTab.style.left = parseInt(nextTab.style.left, 10) - tabDragElementSize + "px";
            }
            index++;
            [prevTab, nextTab] = [nextTab, nextTab.nextSibling];
            calculateNearbyTabsData();
          }
        }
      }
      prevX = e2.clientX;
      prevY = e2.clientY;
      tabElement.style.left = x + "px";
      tabElement.style.top = y + "px";
    };
    let onMouseUp = function(e2) {
      if (!isDragging) {
        if (tabBar.selectedTabs.length > 1) {
          tabBar.removeSelections();
          tabBar.addSelection(tab);
        }
      } else {
        finishDragging();
      }
    };
    tabbar_handler_event.capture(window, onMouseMove, onMouseUp);
    return e.preventDefault();
  };
})(TabbarHandler || (TabbarHandler = {}));
window.addEventListener("mousedown", function() {
  document.body.classList.add("disableIframe");
}, true);
window.addEventListener("mouseup", function() {
  document.body.classList.remove("disableIframe");
}, true);

;// CONCATENATED MODULE: ./packages/ace-layout/mouse/accordion_handler.ts


let accordion_handler_event = __webpack_require__(17989);
var AccordionHandler;
((AccordionHandler2) => {
  AccordionHandler2.toggleBarMouseDown = function(e, accordionConstructor) {
    let toggleBlock = Utils.findNode(e.target, "toggle-block");
    if (!toggleBlock)
      return;
    let accordionBox, accordionBoxRect, toggleBlockDragging, toggleBlockRect;
    let startIndex, changeIndex, previousIndex;
    let toggleBar, section, splitter;
    let startX = e.clientX, startY = e.clientY;
    let isDragging = false;
    let posX, posY, prevY, prevX;
    let prevBlock, topMaxY, nextBlock, bottomMaxY;
    function distance(dx, dy) {
      return dx * dx + dy * dy;
    }
    function calculateNearbyBlocksData() {
      if (!accordionBox)
        return;
      prevBlock = accordionBox.toggleBlockList[changeIndex - 1] || null;
      nextBlock = accordionBox.toggleBlockList[changeIndex + 1] || null;
      topMaxY = prevBlock && parseInt(prevBlock.style.top, 10) + parseInt(prevBlock.style.height, 10) / 2 + accordionBoxRect.top;
      bottomMaxY = nextBlock && parseInt(nextBlock.style.top, 10) + parseInt(nextBlock.style.height, 10) / 2 + accordionBoxRect.top;
    }
    function startDragging() {
      if (isDragging)
        return;
      accordionBox = Utils.findHost(toggleBlock, accordionConstructor);
      if (!accordionBox)
        return;
      accordionBoxRect = accordionBox.element.getBoundingClientRect();
      startIndex = changeIndex = previousIndex = toggleBlock.$index;
      toggleBlockRect = toggleBlock.getBoundingClientRect();
      toggleBlockDragging = toggleBlock.cloneNode(true);
      toggleBlockDragging.$hostAccordionBox = accordionBox;
      toggleBlockDragging.$hostIndex = startIndex;
      toggleBlockDragging.classList.add("toggleBlockDragging");
      Utils.setBox(toggleBlockDragging, toggleBlockRect.left, toggleBlockRect.top, toggleBlockRect.width, toggleBlockRect.height);
      posX = startX - toggleBlockRect.left;
      posY = startY - toggleBlockRect.top;
      document.body.appendChild(toggleBlockDragging);
      toggleBlock.style.opacity = 0;
      calculateNearbyBlocksData();
      isDragging = true;
    }
    function recalculateIndexes(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i].$index = i;
      }
    }
    function accordionDataChanged() {
      if (!accordionBox)
        return;
      recalculateIndexes(accordionBox.sections);
      recalculateIndexes(accordionBox.toggleBarList);
      recalculateIndexes(accordionBox.toggleBlockList);
      recalculateIndexes(accordionBox.splitterList);
      accordionBox.resize();
    }
    function addToAccordionBox(index) {
      if (!accordionBox)
        return;
      accordionBox.sections.splice(index, 0, section);
      accordionBox.toggleBarList.splice(index, 0, toggleBar);
      accordionBox.toggleBlockList.splice(index, 0, toggleBlock);
      calculateNearbyBlocksData();
      if (nextBlock) {
        accordionBox.element.insertBefore(splitter, nextBlock);
        accordionBox.element.insertBefore(toggleBlock, splitter);
        accordionBox.splitterList.splice(index - 1, 0, splitter);
      } else {
        accordionBox.element.appendChild(splitter);
        accordionBox.element.appendChild(toggleBlock);
        accordionBox.splitterList.push(splitter);
      }
      toggleBlock.$parent = accordionBox;
      splitter.$parent = accordionBox;
      accordionBox.calculateSectionsSizesPercents();
      accordionBox.recalculateChildrenSizes();
      accordionDataChanged();
    }
    function removeFromAccordionBox() {
      if (!accordionBox)
        return;
      section = accordionBox.sections.splice(previousIndex, 1)[0];
      toggleBar = accordionBox.toggleBarList.splice(previousIndex, 1)[0];
      toggleBlock = accordionBox.toggleBlockList.splice(previousIndex, 1)[0];
      let splitterIndex = accordionBox.splitterList[previousIndex] ? previousIndex : previousIndex - 1;
      splitter = accordionBox.splitterList.splice(splitterIndex, 1)[0];
      toggleBlockDragging.style.height = accordionBox.toggleBarHeight + "px";
      toggleBlock.remove();
      splitter.remove();
      accordionBox.calculateSectionsSizesPercents();
      accordionBox.recalculateChildrenSizes();
      accordionDataChanged();
      accordionBox = void 0;
      toggleBlock.$parent = null;
      splitter.$parent = null;
    }
    function finishDragging() {
      if (!accordionBox) {
        accordionBox = toggleBlockDragging.$hostAccordionBox;
        addToAccordionBox(toggleBlockDragging.$hostIndex);
      }
      toggleBlockDragging.remove();
      toggleBlock.style.opacity = 1;
      isDragging = false;
    }
    let onMouseMove = function(e2) {
      if (e2.type !== "mousemove")
        return;
      if (!isDragging) {
        if (distance(e2.clientX - startX, e2.clientY - startY) < 25)
          return;
        startDragging();
      }
      let left = e2.clientX - posX;
      let top = e2.clientY - posY;
      if (accordionBox) {
        if (left < accordionBoxRect.left - accordionBoxRect.width || left > accordionBoxRect.left + accordionBoxRect.width) {
          removeFromAccordionBox();
        }
      }
      if (!accordionBox) {
        accordionBox = Utils.findHost(e2.target, accordionConstructor);
        if (accordionBox) {
          accordionBoxRect = accordionBox.element.getBoundingClientRect();
          nextBlock = Utils.findNode(e2.target, "toggle-block");
          if (nextBlock) {
            startIndex = nextBlock.$index;
          } else {
            startIndex = accordionBox.toggleBlockList.length;
          }
          previousIndex = changeIndex = startIndex;
          addToAccordionBox(previousIndex);
          toggleBlockDragging.style.height = toggleBlock.style.height;
        }
      }
      if (accordionBox) {
        left = accordionBoxRect.left;
        if (e2.clientY < prevY && topMaxY && top < topMaxY) {
          changeIndex--;
        } else if (e2.clientY > prevY && bottomMaxY && top + toggleBlockRect.height > bottomMaxY) {
          changeIndex++;
        }
        if (changeIndex !== previousIndex) {
          accordionBox.element.insertBefore(toggleBlock, accordionBox.toggleBlockList[changeIndex]);
          let splitterIndex = accordionBox.splitterList[previousIndex] ? previousIndex : previousIndex + 1;
          accordionBox.element.insertBefore(accordionBox.toggleBlockList[changeIndex], accordionBox.splitterList[splitterIndex]);
          accordionBox.sections.splice(changeIndex, 0, accordionBox.sections.splice(previousIndex, 1)[0]);
          accordionBox.toggleBarList.splice(changeIndex, 0, accordionBox.toggleBarList.splice(previousIndex, 1)[0]);
          accordionBox.toggleBlockList.splice(changeIndex, 0, accordionBox.toggleBlockList.splice(previousIndex, 1)[0]);
          calculateNearbyBlocksData();
          accordionDataChanged();
          previousIndex = changeIndex;
        }
      }
      toggleBlockDragging.style.left = left + "px";
      toggleBlockDragging.style.top = top + "px";
      prevX = e2.clientX;
      prevY = e2.clientY;
    };
    let onMouseUp = function(e2) {
      if (!isDragging)
        return;
      finishDragging();
    };
    accordion_handler_event.capture(window, onMouseMove, onMouseUp);
    return e.preventDefault();
  };
  AccordionHandler2.toggleBarOnClick = function(e) {
    let toggleBlock = Utils.findNode(e.target, "toggle-block");
    if (!toggleBlock)
      return;
    let accordionBox = toggleBlock.$parent;
    let index = toggleBlock.$index;
    let isOpened = accordionBox.isOpenedBlock(toggleBlock);
    if (!isOpened) {
      toggleBlock.classList.add("toggle-opened");
      index = void 0;
    } else {
      toggleBlock.classList.remove("toggle-opened");
    }
    accordionBox.recalculateChildrenSizes(index);
    Box.enableAnimation();
    let node = accordionBox.element;
    node.addEventListener("transitionend", function handler() {
      node.removeEventListener("transitionend", handler);
      Box.disableAnimation();
    });
    accordionBox.resize();
  };
  AccordionHandler2.splitterMouseDown = function(e) {
    let button = e.button;
    if (button !== 0)
      return;
    let splitter = Utils.findNode(e.target, "splitter");
    if (!splitter)
      return;
    let accordionBox = splitter.$parent;
    let x = e.clientX;
    let y = e.clientY;
    let splitterIndex = splitter.$index + 1;
    let prevX = x;
    let prevY = y;
    if (!accordionBox.hasNextOpenedBlocks(splitterIndex) || !accordionBox.hasPrevOpenedBlocks(splitterIndex))
      return;
    accordionBox.keepState();
    let onMouseMove = function(e2) {
      x = e2.clientX;
      y = e2.clientY;
      let changedSize = 0;
      if (prevY > y) {
        changedSize = accordionBox.recalculatePreviousSectionsSize(splitterIndex, y);
        if (changedSize === 0)
          return;
        accordionBox.expandNextSections(splitterIndex, changedSize);
      } else if (prevY < y) {
        changedSize = accordionBox.recalculateNextSectionsSize(splitterIndex, y);
        if (changedSize === 0)
          return;
        accordionBox.expandPreviousSections(splitterIndex, changedSize);
      } else {
        return;
      }
      prevY = y;
      accordionBox.resize();
    };
    let onResizeEnd = function(e2) {
      accordionBox.dischargeState();
      Box.setGlobalCursor("");
      accordionBox.calculateSectionsSizesPercents();
    };
    Box.setGlobalCursor(`${accordionBox.vertical ? "ns" : "ew"}-resize`);
    accordion_handler_event.capture(window, onMouseMove, onResizeEnd);
    return e.preventDefault();
  };
})(AccordionHandler || (AccordionHandler = {}));

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./packages/ace-layout/styles/accordion.css
var accordion = __webpack_require__(21705);
;// CONCATENATED MODULE: ./packages/ace-layout/styles/accordion.css

      
      
      
      
      
      
      
      
      

var accordion_options = {};

accordion_options.styleTagTransform = (styleTagTransform_default());
accordion_options.setAttributes = (setAttributesWithoutAttributes_default());

      accordion_options.insert = insertBySelector_default().bind(null, "head");
    
accordion_options.domAPI = (styleDomAPI_default());
accordion_options.insertStyleElement = (insertStyleElement_default());

var accordion_update = injectStylesIntoStyleTag_default()(accordion/* default */.Z, accordion_options);




       /* harmony default export */ const styles_accordion = (accordion/* default */.Z && accordion/* default.locals */.Z.locals ? accordion/* default.locals */.Z.locals : undefined);

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/boxes/accordion.ts





dom.importCssString(accordion_namespaceObject, "accordion.css");
const accordion_BOX_MIN_SIZE = 80;
class Accordion extends Box {
  constructor(options) {
    var _a;
    super(options);
    //TODO extending from Box isn't right
    this.toggleBarList = [];
    this.splitterList = [];
    this.toggleBlockList = [];
    this.boxMinSize = 30;
    this.toggleBarHeight = 20;
    this.splitterSize = 1;
    this.vertical = options.vertical || false;
    this.color = (_a = options.color) != null ? _a : "";
    this.sections = options.sections;
    this.minSize = options.minSize || accordion_BOX_MIN_SIZE;
    this.minVerticalSize = options.minVerticalSize || this.minSize;
    this.minHorizontalSize = options.minHorizontalSize || this.minSize;
    this.padding = { top: 0, right: 0, bottom: 0, left: 0 };
    this.size = options.size;
  }
  hasNextOpenedBlocks(index) {
    for (let i = index; i < this.toggleBlockList.length; i++) {
      if (this.isOpenedByIndex(i))
        return true;
    }
    return false;
  }
  hasPrevOpenedBlocks(index) {
    for (let i = index - 1; i >= 0; i--) {
      if (this.isOpenedByIndex(i))
        return true;
    }
    return false;
  }
  isOpenedByIndex(index) {
    return this.isOpenedBlock(this.toggleBlockList[index]);
  }
  isOpenedBlock(toggleBlock) {
    return toggleBlock.classList.contains("toggle-opened");
  }
  keepState() {
    this.nextChangedIndexes = [];
    this.prevChangedIndexes = [];
    for (let i = 0; i < this.toggleBlockList.length; i++) {
      if (this.isOpenedByIndex(i)) {
        let section = this.sections[i];
        section.previousSize = section.currentSize;
      }
    }
  }
  dischargeState() {
    this.nextChangedIndexes = void 0;
    this.prevChangedIndexes = void 0;
    for (let i = 0; i < this.toggleBlockList.length; i++) {
      if (this.isOpenedByIndex(i))
        this.sections[i].previousSize = void 0;
    }
  }
  recalculatePreviousSectionsSize(index, top, maxChangeSize) {
    let changedSize = 0;
    for (let i = index - 1; i >= 0; i--) {
      if (this.isOpenedByIndex(i)) {
        let section = this.sections[i];
        let rect = section.box.element.getBoundingClientRect();
        let done = false;
        let prevSize = rect.height;
        let currentSize = Math.max(top - rect.top, this.boxMinSize);
        top -= rect.height;
        if (currentSize < prevSize) {
          if (currentSize > this.boxMinSize)
            done = true;
          if (!this.prevChangedIndexes.includes(i))
            this.prevChangedIndexes.unshift(i);
          section.currentSize = currentSize;
          changedSize += prevSize - currentSize;
          if (done || maxChangeSize != void 0 && changedSize >= maxChangeSize)
            break;
        }
      }
      top -= this.toggleBarHeight;
    }
    return changedSize;
  }
  recalculateNextSectionsSize(index, top, maxChangeSize) {
    let changedSize = 0;
    for (let i = index; i < this.toggleBlockList.length; i++) {
      if (this.isOpenedByIndex(i)) {
        let section = this.sections[i];
        let rect = section.box.element.getBoundingClientRect();
        let done = false;
        let prevSize = rect.height;
        let currentSize = Math.max(rect.bottom - top - this.toggleBarHeight, this.boxMinSize);
        top += rect.height;
        if (currentSize < prevSize) {
          if (currentSize > this.boxMinSize)
            done = true;
          if (!this.nextChangedIndexes.includes(i))
            this.nextChangedIndexes.unshift(i);
          section.currentSize = currentSize;
          changedSize += prevSize - currentSize;
          if (done || maxChangeSize != void 0 && changedSize >= maxChangeSize)
            break;
        }
      }
      top += this.toggleBarHeight;
      top += this.splitterSize;
    }
    return changedSize;
  }
  restoreChangedSizes(size, changedIndexes) {
    if (!changedIndexes)
      return size;
    while (changedIndexes.length && size > 0) {
      let index = changedIndexes[0];
      let section = this.sections[index];
      let currSize = section.currentSize;
      section.currentSize = Math.min(section.previousSize, currSize + size);
      size -= section.currentSize - currSize;
      if (section.currentSize >= section.previousSize)
        changedIndexes.shift();
    }
    return size;
  }
  expandPreviousSections(index, size) {
    size = this.restoreChangedSizes(size, this.prevChangedIndexes);
    if (size <= 0)
      return;
    let openedSectionsList = [];
    for (let i = index - 1; i >= 0; i--) {
      if (this.isOpenedByIndex(i))
        openedSectionsList.push(this.sections[i]);
    }
    this.applySizeToOpenedSections(size, openedSectionsList);
  }
  expandNextSections(index, size) {
    size = this.restoreChangedSizes(size, this.nextChangedIndexes);
    if (size <= 0)
      return;
    let openedSectionsList = [];
    for (let i = index; i < this.toggleBlockList.length; i++) {
      if (this.isOpenedByIndex(i)) {
        openedSectionsList.push(this.sections[i]);
      }
    }
    this.applySizeToOpenedSections(size, openedSectionsList);
  }
  applySizeToOpenedSections(size, openedSections) {
    let count = openedSections.length;
    if (!count)
      return;
    let remainder = size % count;
    let addSize = (size - remainder) / count;
    for (let i = 0; i < count; i++) {
      openedSections[i].currentSize += addSize;
    }
    openedSections[0].currentSize += remainder;
  }
  resize() {
    this.$updateChildSize(...this.rect);
  }
  render() {
    var _a, _b;
    if (this.element)
      return this.element;
    this.element = dom.buildDom(["div", {
      class: "box accordion",
      $host: this
    }]);
    let section;
    let splitter;
    let toggleBlock;
    let toggleBar;
    for (let i = 0; i < this.sections.length; i++) {
      section = this.sections[i];
      if (i > 0) {
        splitter = dom.buildDom(["div", {
          class: `splitter accordion-splitter splitter${this.vertical ? "-v" : "-h"}`,
          $index: i - 1,
          $parent: this,
          onmousedown: function(e) {
            AccordionHandler.splitterMouseDown(e);
          }
        }, ["div"]]);
        this.element.appendChild(splitter);
        this.splitterList.push(splitter);
      }
      toggleBlock = dom.buildDom(["div", {
        class: `toggle-block`,
        $index: i,
        $parent: this
      }]);
      toggleBar = dom.buildDom(["div", {
        class: `toggle-bar toggle-bar${this.vertical ? "-v" : "-h"}`,
        onmousedown: function(e) {
          AccordionHandler.toggleBarMouseDown(e, Accordion);
        },
        onclick: function(e) {
          AccordionHandler.toggleBarOnClick(e);
        }
      }, ["div", { class: "title" }, section.title]]);
      section.currentSize = section.savedSize = parseInt((_b = (_a = section.box.size) == null ? void 0 : _a.toString()) != null ? _b : "", 10);
      toggleBlock.appendChild(toggleBar);
      this.toggleBarList.push(toggleBar);
      toggleBlock.appendChild(section.box.render());
      this.element.appendChild(toggleBlock);
      this.toggleBlockList.push(toggleBlock);
    }
    this.element.style.backgroundColor = this.color;
    this.element.style.position = "absolute";
    this.calculateSectionsSizesPercents();
    return this.element;
  }
  calculateSectionsSizesPercents() {
    let totalSize = 0;
    let actualSizes = [];
    for (let i = 0; i < this.sections.length; i++) {
      let section = this.sections[i];
      actualSizes.push(this.isOpenedByIndex(i) ? section.currentSize : section.savedSize);
      totalSize += actualSizes[i];
    }
    let minPercent = Math.floor(this.boxMinSize / totalSize * 100);
    let maxPercent = 100 - minPercent * (this.sections.length - 1);
    let totalPercent = 0;
    for (let i = 0; i < this.sections.length; i++) {
      let section = this.sections[i];
      section.sizePercent = Math.floor(actualSizes[i] / totalSize * 100);
      section.sizePercent = Math.min(Math.max(section.sizePercent, minPercent), maxPercent);
      totalPercent += section.sizePercent;
    }
    if (totalPercent !== 100)
      this.sections[this.sections.length - 1].sizePercent += 100 - totalPercent;
  }
  setBox(x, y, w, h) {
    this.rect = [x, y, w, h];
    Utils.setBox(this.element, x, y, w, h);
    this.recalculateChildrenSizes();
    this.$updateChildSize(x, y, w, h);
  }
  recalculateChildrenSizes(index) {
    let height = this.rect[3];
    height -= this.toggleBarHeight * this.toggleBarList.length;
    height -= this.splitterSize * this.splitterList.length;
    let totalSize = 0;
    let openedIndexes = [];
    for (let i = 0; i < this.sections.length; i++) {
      let section = this.sections[i];
      section.currentSize = Math.max(Math.floor(height * section.sizePercent / 100), this.boxMinSize);
      if (this.isOpenedByIndex(i)) {
        totalSize += section.currentSize;
        openedIndexes.push(i);
      } else {
        section.savedSize = section.currentSize;
        section.currentSize = 0;
      }
    }
    let spareSize = height - totalSize;
    if (!spareSize)
      return;
    if (index !== void 0) {
      let prevOpenedIndexes = [];
      while (openedIndexes.length && openedIndexes[0] < index) {
        prevOpenedIndexes.push(openedIndexes.shift());
      }
      if (!openedIndexes.length)
        openedIndexes = prevOpenedIndexes;
    }
    let prevSize, changedSize, openedBoxesCount, remainder, addSize;
    while (openedIndexes.length && spareSize) {
      let changedIndexes = [];
      openedBoxesCount = openedIndexes.length;
      remainder = spareSize % openedBoxesCount;
      addSize = (spareSize - remainder) / openedBoxesCount;
      for (let i = 0; i < openedIndexes.length; i++) {
        let section = this.sections[openedIndexes[i]];
        prevSize = section.currentSize;
        if (openedBoxesCount === 1)
          addSize += remainder;
        section.currentSize += addSize;
        section.currentSize = Math.max(section.currentSize, this.boxMinSize);
        changedSize = section.currentSize - prevSize;
        spareSize -= changedSize;
        openedBoxesCount--;
        if (changedSize < 0)
          changedIndexes.push(openedIndexes[i]);
      }
      openedIndexes = changedIndexes;
    }
  }
  $updateChildSize(x, y, w, h) {
    x = 0;
    y = 0;
    for (let i = 0; i < this.toggleBlockList.length; i++) {
      let toggleBlock = this.toggleBlockList[i];
      let section = this.sections[i];
      let boxSize = section.currentSize;
      h = this.toggleBarHeight + boxSize;
      Utils.setBox(toggleBlock, x, y, w, h);
      y += this.toggleBarHeight;
      section.box.setBox(0, this.toggleBarHeight, w, boxSize);
      y += boxSize;
      if (this.splitterList[i]) {
        Utils.setBox(this.splitterList[i], x, y, w, this.splitterSize);
        y += this.splitterSize;
      }
    }
  }
  remove() {
    if (this.element)
      this.element.remove();
    if (this.parent) {
      if (this.vertical === this.parent.vertical)
        this.parent.minSize -= this.minSize;
      if (this.parent[0] == this)
        this.parent[0] = void 0;
      if (this.parent[1] == this)
        this.parent[1] = void 0;
    }
  }
  toJSON() {
    let sections = [];
    let section;
    for (let i = 0; i < this.sections.length; i++) {
      section = this.sections[i];
      sections.push({
        title: section.title,
        boxData: section.box.toJSON()
      });
    }
    return {
      type: "accordion",
      vertical: this.vertical,
      size: this.size,
      sections
    };
  }
}

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/tabs/panelManager.ts



class PanelManager {
  constructor(options) {
    this.layout = options.layout;
    this.locations = options.locations;
  }
  static getInstance(options) {
    if (!PanelManager._instance)
      PanelManager._instance = new PanelManager(options);
    return PanelManager._instance;
  }
  toJSON() {
    return {
      panelBars: this.panelBarsToJSON()
    };
  }
  panelBarsToJSON() {
    let panelBars = {};
    for (let [position, panelBar] of Object.entries(this.layout.toolBars)) {
      if (panelBar instanceof PanelBar)
        panelBars[position] = panelBar.toJSON();
    }
    return panelBars;
  }
  setState(state) {
    var _a;
    let panelBars = (_a = state.panelBars) != null ? _a : {};
    let panelBar, panelList, panel;
    let panelBody, panelBodyData;
    for (let position of Object.keys(panelBars)) {
      panelList = [];
      let tabList = panelBars[position].tabList;
      for (let i = 0; i < tabList.length; i++) {
        panel = tabList[i];
        panelBodyData = panel.panelBody;
        if (panelBodyData.type === "accordion") {
          let accordionSections = [];
          let sections = panelBodyData.sections;
          for (let index = 0; index < sections.length; index++) {
            accordionSections.push({
              title: sections[index].title,
              box: new Box(sections[index].boxData)
            });
          }
          panelBody = new Accordion({
            vertical: panelBodyData.vertical,
            size: panelBodyData.size,
            sections: accordionSections
          });
        } else {
          panelBody = new Box({
            vertical: panelBodyData.type === "vbox",
            color: panelBodyData.color,
            size: panelBodyData.size,
            hidden: panelBodyData.hidden,
            fixedSize: panelBodyData.fixedSize
          });
        }
        panelList.push({
          active: panel.active,
          title: panel.title,
          autoHide: panel.autoHide,
          panelBody
        });
      }
      panelBar = new PanelBar({ panelList: {} });
      this.layout.addToolBar(position, panelBar);
      panelBar.addTabList(panelList);
    }
  }
  activatePanel(panel) {
    let location = this.locations[panel.parent.position];
    if (!location)
      return;
    let index = location.index;
    let parent = location.parent;
    panel.panelBody.size = location.size;
    let newBox = parent.addChildBox(index, panel.panelBody);
    if (newBox.fixedSize && !parent.fixedChild)
      parent.fixedChild = newBox;
    location.box = newBox;
    newBox.show();
  }
  deactivatePanel(panel) {
    let location = this.locations[panel.parent.position];
    location == null ? void 0 : location.box.hide();
  }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./packages/ace-layout/styles/panel.css
var panel = __webpack_require__(52368);
;// CONCATENATED MODULE: ./packages/ace-layout/styles/panel.css

      
      
      
      
      
      
      
      
      

var panel_options = {};

panel_options.styleTagTransform = (styleTagTransform_default());
panel_options.setAttributes = (setAttributesWithoutAttributes_default());

      panel_options.insert = insertBySelector_default().bind(null, "head");
    
panel_options.domAPI = (styleDomAPI_default());
panel_options.insertStyleElement = (insertStyleElement_default());

var panel_update = injectStylesIntoStyleTag_default()(panel/* default */.Z, panel_options);




       /* harmony default export */ const styles_panel = (panel/* default */.Z && panel/* default.locals */.Z.locals ? panel/* default.locals */.Z.locals : undefined);

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/tabs/tabPanel.ts
class TabPanel {
  constructor(options) {
    var _a;
    this.active = (_a = options.active) != null ? _a : false;
    this.title = options.title;
  }
  activate() {
    this.active = true;
    this.element.classList.add("active");
  }
  deactivate() {
    this.active = false;
    this.element.classList.remove("active");
  }
}

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/tabs/panel.ts




dom.importCssString(panel_namespaceObject, "panel.css");
class Panel extends TabPanel {
  constructor(options) {
    var _a;
    super(options);
    this.location = options.location;
    this.panelBody = options.panelBody;
    this.autoHide = (_a = options.autoHide) != null ? _a : false;
    this.title = options.title;
  }
  activate() {
    super.activate();
    PanelManager.getInstance().activatePanel(this);
  }
  deactivate() {
    super.deactivate();
    PanelManager.getInstance().deactivatePanel(this);
  }
  render() {
    this.element = dom.buildDom(["div", {
      class: "panelButton" + (this.active ? " active" : "")
    }, ["span", {
      class: "panelTitle"
    }, this.title]]);
    this.element.$host = this;
    return this.element;
  }
  toJSON() {
    return {
      active: this.active,
      title: this.title,
      autoHide: this.autoHide,
      panelBody: this.panelBody.toJSON()
    };
  }
  remove() {
  }
}

;// CONCATENATED MODULE: ./packages/ace-layout/widgets/toolbars/panelBar.ts




class PanelBar extends TabPanelBar {
  setBox(x, y, w, h) {
    super.setBox(x, y, w, h);
    this.configure();
  }
  configure() {
    let tabElement;
    let tabSize = 30;
    let position = 0;
    for (let i = 0; i < this.tabList.length; i++) {
      tabElement = this.tabList[i].element;
      if (this.draggingElementIndex === i)
        position += this.getDraggingElementSize();
      if (this.isVertical()) {
        tabElement.style.left = "0px";
        tabElement.style.height = tabSize + "px";
        tabElement.style.top = position + "px";
      } else {
        tabElement.style.top = "0px";
        tabElement.style.width = tabSize + "px";
        tabElement.style.left = position + "px";
      }
      position += tabSize;
    }
  }
  render() {
    if (!this.element) {
      this.element = dom.buildDom(["div", {
        class: "panelbar " + this.direction + " " + this.position
      }, ["div", {
        class: "tabContainer",
        ref: "tabContainer",
        onmousedown: function(e) {
          TabbarHandler.tabbarMouseDown(e, Panel, PanelBar);
        },
        onmouseup: (e) => {
          if (this.activeTabClicked) {
            let activeTab = this.activeTab;
            this.removeSelection(activeTab);
            activeTab.deactivate();
            this.activeTab = void 0;
            if (this.activeTabHistory.length && activeTab.autoHide) {
              let previousTab = activeTab;
              while (previousTab === activeTab && this.activeTabHistory.length) {
                previousTab = this.activeTabHistory.pop();
              }
              if (previousTab !== activeTab)
                this.activateTab(previousTab);
            }
          }
        }
      }]], void 0, this);
    }
    if (this.initTabList && this.initTabList.length) {
      for (let i = 0; i < this.initTabList.length; i++) {
        this.addTab(this.initTabList[i]);
      }
    }
    this.element.$host = this;
    return this.element;
  }
  addTabList(tabList, index) {
    index = index || this.tabList.length;
    let tab;
    for (let i = 0; i < tabList.length; i++) {
      tab = new Panel(tabList[i]);
      this.addTab(tab, index++);
    }
  }
  remove() {
  }
}

;// CONCATENATED MODULE: ./packages/demo/preferences/demo.ts








dom.importCssString(preferences_namespaceObject, "preferences.css");
let navigation;
let app;
let demo = new Box({
  classNames: "bar-preferences",
  toolBars: {
    top: new PanelBar({ size: 31 })
  },
  0: navigation = new Box({
    size: 200
  }),
  1: app = new Box({})
});
document.body.appendChild(demo.render());
let resultPreferences = {};
function addState(state, prefModel) {
  for (let name in state) {
    if (!prefModel[name]) {
      prefModel[name] = { groupName: name };
    }
    if (state[name]["position"]) {
      prefModel[name]["position"] = state[name]["position"];
      delete state[name]["position"];
    }
    if (state[name]["type"]) {
      prefModel[name]["groupData"] = state[name];
    } else if (typeof state[name] === "object") {
      if (!prefModel[name]["subGroups"]) {
        prefModel[name]["subGroups"] = {};
      }
      addState(state[name], prefModel[name]["subGroups"]);
    } else {
      prefModel[name] = state[name];
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
        '<h1>Experimental Features</h1><p style="white-space:normal">AWS Cloud9 is continuously in development. New features in alpha or beta are first hidden and can be enabled via this page. <i>Use at your own risk</i>.</p>'
      ]
    },
    "User Settings": {
      "type": "custom",
      "title": "Introduction",
      "position": 1,
      "node": [
        "apf",
        "bar",
        '<h1>User Settings</h1><p>Manually edit these settings by clicking on this link: <a href="javascript:void(0)">user.settings</a>.</p><p class="hint">These settings are synced across all your environments.</p>'
      ]
    },
    "Project": {
      "type": "custom",
      "title": "Introduction",
      "position": 1,
      "node": [
        "apf",
        "bar",
        '<h1>Project Settings</h1><p>These settings are specific to this project. They are saved at: <span style="padding:5px 0 5px 0px"><a href="javascript:void(0)">&lt;project&gt;/.c9/project.settings</a>.</span></p><p class="hint">Hint: Add the .c9 folder to your repository to share these settings with your collaborators.</p>'
      ]
    }
  },
  {
    "General": {
      "Tree and Go Panel": {
        "position": 25,
        "Enable Preview on Tree Selection": {
          "type": "checkbox",
          "position": 3e3,
          "path": "user/general/@preview-tree"
        },
        "Hidden File Pattern": {
          "type": "textbox",
          "path": "user/projecttree/@hiddenFilePattern",
          "position": 4e3
        }
      },
      "User Interface": {
        "Environment Files Icon and Selection Style": {
          "type": "dropdown",
          "position": 3e3,
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
          "max": 1e4
        }
      }
    }
  },
  {
    "General": {
      "General": {
        "Warn Before Exiting": {
          "type": "checkbox",
          "position": 8e3,
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
          "position": 1e3,
          "path": "user/ace/@behavioursEnabled"
        },
        "Wrap Selection with Brackets, Quotes, etc.": {
          "type": "checkbox",
          "position": 1001,
          "path": "user/ace/@wrapBehavioursEnabled"
        },
        "Code Folding": {
          "type": "checkbox",
          "position": 2e3,
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
          "position": 3e3,
          "path": "user/ace/@selectionStyle",
          "values": "line|text"
        },
        "Highlight Active Line": {
          "type": "checkbox",
          "position": 4e3,
          "path": "user/ace/@highlightActiveLine"
        },
        "Highlight Gutter Line": {
          "type": "checkbox",
          "position": 4e3,
          "path": "user/ace/@highlightGutterLine"
        },
        "Show Invisible Characters": {
          "type": "checkbox",
          "position": 5e3,
          "path": "user/ace/@showInvisibles"
        },
        "Show Gutter": {
          "type": "checkbox",
          "position": 6e3,
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
          "position": 7e3,
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
          "position": 8e3
        },
        "Animate Scrolling": {
          "type": "checkbox",
          "path": "user/ace/@animatedScroll",
          "position": 9e3
        },
        "Font Family": {
          "type": "textbox",
          "path": "user/ace/@fontFamily",
          "position": 1e4
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
          "position": 11e3
        },
        "Mouse Scroll Speed": {
          "type": "spinner",
          "path": "user/ace/@scrollSpeed",
          "min": "1",
          "max": "8",
          "position": 13e3
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
          "position": 14e3
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
          "position": 1e3
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
          "position": 1e3,
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
          "position": 4e3,
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
        "Open Files when Navigating Results with \u2193 \u2191": {
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
          "position": 5e3
        },
        "Mark Missing Optional Semicolons": {
          "type": "checkbox",
          "path": "project/language/@semi",
          "position": 7e3
        },
        "Mark Undeclared Variables": {
          "type": "checkbox",
          "path": "project/language/@undeclaredVars",
          "position": 8e3
        },
        "Mark Unused Function Arguments": {
          "type": "checkbox",
          "path": "project/language/@unusedFunctionArgs",
          "position": 9e3
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
          "position": 11e3
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
          "position": 4e3
        },
        "Complete On Enter": {
          "type": "checkbox",
          "path": "user/language/@enterCompletion",
          "position": 5e3
        },
        "Highlight Variable Under Cursor": {
          "type": "checkbox",
          "path": "user/language/@instanceHighlight",
          "position": 6e3
        }
      },
      "Hints & Warnings": {
        "position": 200,
        "Enable Hints and Warnings": {
          "type": "checkbox",
          "path": "user/language/@hints",
          "position": 1e3
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
          "position": 3e3
        }
      }
    }
  },
  {
    "Language": {
      "Hints & Warnings": {
        "Show Available Quick Fixes On Click": {
          "type": "checkbox",
          "position": 1e3,
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
          "position": 6e3
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
            '\n            <div><div class=" ace_tree blackdg ace-tree-datagrid" style="height: 253px;"><textarea class="ace_text-input" wrap="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="opacity: 0; font-size: 1px;"></textarea><div class="ace_tree_scroller" style="inset: 23px 16px 0px 0px;"><div class="ace_tree_cells" style="margin-top: 0px; margin-left: 0px; width: 637px; height: 253px;"><div class="ace_tree_layer ace_tree_selection-layer"></div><div class="ace_tree_layer ace_tree_cell-layer"><div style="height:23px;padding-right:0px" class="tree-row  even"><span class="tree-column " style="width:100%;"><span class="toggler open"></span><span class="caption" style="width: auto; height: 23px">Experimental</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  odd"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">accounting</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  even"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">ace</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  odd"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">add2home</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  even"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">alertify</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  odd"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">amcharts</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  even"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">angularfire</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  odd"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">appframework</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  even"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">appletvjs</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  odd"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">applicationinsights</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  even"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">arbiter</span></span></div><div style="height:23px;padding-right:0px" class="tree-row  odd"><span class="tree-column " style="width:100%;"><span style="width:10px" class="tree-indent"></span><span class="toggler empty"></span><span class="checkbox "></span><span class="caption" style="width: auto; height: 23px">argparse</span></span></div></div></div></div><div class="tree-headings" style="height: 23px; right: 16px; padding-right: 0px;"><span class="tree-column " style="width:100%;height:">JavaScript Library Code Completion</span><span class="tree-column-resizer"></span></div><div class="ace_scrollbar ace_scrollbar-v" style="width: 21px; top: 23px; bottom: 0px;"><div class="ace_scrollbar-inner" style="width: 21px; height: 9361px;">&nbsp;</div></div><div class="ace_scrollbar ace_scrollbar-h" style="display: none; height: 21px; left: 0px; right: 16px;"><div class="ace_scrollbar-inner" style="height: 21px; width: 0px;">&nbsp;</div></div></div></div>'
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
          "position": 1e3
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
            '\n            <div class=" ace_tree blackdg" style="width: 600px; margin-bottom: 30px; height: 36px;"><textarea class="ace_text-input" wrap="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="opacity: 0; font-size: 1px;"></textarea><div class="ace_tree_scroller" style="inset: 18px 0px 0px;"><div class="ace_tree_cells" style="margin-top: 0px; margin-left: 0px; width: 600px; height: 36px;"><div class="ace_tree_layer ace_tree_selection-layer"></div><div class="ace_tree_layer ace_tree_cell-layer"><div class="message empty">No run configurations</div></div></div></div><div class="tree-headings" style="height: 18px; right: 0px; padding-right: 0px;"><span class="tree-column " style="width:15%;height:">Name</span><span class="tree-column-resizer"></span><span class="tree-column " style="width:30%;height:">Command</span><span class="tree-column-resizer"></span><span class="tree-column " style="width:15%;height:">CWD</span><span class="tree-column-resizer"></span><span class="tree-column " style="width:10%;height:">Debug</span><span class="tree-column-resizer"></span><span class="tree-column " style="width:20%;height:">Runner</span><span class="tree-column-resizer"></span><span class="tree-column " style="width:10%;height:">Default</span><span class="tree-column-resizer"></span></div><div class="ace_scrollbar ace_scrollbar-v" style="width: 21px; top: 18px; bottom: 0px; display: none;"><div class="ace_scrollbar-inner" style="width: 21px; height: 0px;">&nbsp;</div></div><div class="ace_scrollbar ace_scrollbar-h" style="display: none; height: 21px; left: 0px; right: 0px;"><div class="ace_scrollbar-inner" style="height: 21px; width: 0px;">&nbsp;</div></div></div><div style="position: absolute; left: 10px; bottom: 10px; display: flex; align-items: stretch; padding: 0px; justify-content: flex-start;" class="hbox"><div class="c9-toolbarbutton-glossy " style="box-sizing: border-box; margin: 0px;">\n                <div class="c9-icon"> </div>\n                <div class="c9-label">Remove Selected Configs</div>\n            </div><div class="c9-toolbarbutton-glossy " style="box-sizing: border-box; margin: 0px;">\n                <div class="c9-icon"> </div>\n                <div class="c9-label">Add New Config</div>\n            </div><div class="c9-toolbarbutton-glossy " style="box-sizing: border-box; margin: 0px;">\n                <div class="c9-icon"> </div>\n                <div class="c9-label">Set As Default</div>\n            </div></div>'
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
          "position": 1e3
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
          "position": 11e3
        },
        "Antialiased Fonts": {
          "type": "checkbox",
          "path": "user/terminal/@antialiasedfonts",
          "position": 12e3
        },
        "Blinking Cursor": {
          "type": "checkbox",
          "path": "user/terminal/@blinking",
          "position": 12e3
        },
        "Scrollback": {
          "type": "spinner",
          "path": "user/terminal/@scrollback",
          "min": "1",
          "max": "100000",
          "position": 13e3
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
          "position": 1e3,
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
          "position": 5e3
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
          "position": 14e3
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
];
$prefs.forEach(function(state) {
  addState(state, resultPreferences);
});
function sortPreferences(preferences) {
  preferences = Object.values(preferences).map((preference) => {
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
let navigationHtml = [];
let appHtml = [];
function render() {
  renderGroup(resultPreferences);
  dom.buildDom(["div", { style: "overflow-y: scroll; height: 100%" }, navigationHtml], navigation.element);
  let preferencesNode = dom.buildDom(["div", { style: "overflow-y: scroll; height: 100%" }, appHtml], app.element);
  let searchBox = new SettingsSearchBox(preferencesNode);
  searchBox.build();
  dom.buildDom([searchBox.element], demo.toolBars.top.element);
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
  });
}
function renderItem(title, item) {
  if (item) {
    switch (item["type"]) {
      case "checkbox":
        return ["div", { class: "preferenceItem" }, ["span", {}, title], new Switcher({}).render()];
      case "textbox":
        return ["div", { class: "preferenceItem" }, ["span", {}, title], ["input", { class: "tbsimple" }]];
      case "spinner":
        return ["div", { class: "preferenceItem" }, ["span", {}, title], ["div", { class: "spinner" }, ["input", {
          type: "number",
          min: item["min"],
          max: item["max"]
        }]]];
      case "checked-spinner":
        return ["div", { class: "preferenceItem" }, ["div", { class: "label" }, new Switcher({ className: "checkbox" }).render(), ["span", {}, title]], ["div", { class: "spinner" }, ["input", {
          type: "number",
          min: item["min"],
          max: item["max"]
        }]]];
      case "button":
        return ["div", { class: "preferenceItem" }, new Button({}).render()];
      case "dropdown":
        return ["div", { class: "preferenceItem" }, ["span", {}, title], new Dropdown({
          items: item["items"],
          width: item["width"]
        }).render()];
      case "custom":
        return ["div", { class: "preferenceItem" }, item["node"][2]];
      default:
        return [];
    }
  } else {
    return ["div", { class: "preferenceItem header" }, ["div", {}, title]];
  }
}
render();
function onResize() {
  demo.setBox(0, 0, window.innerWidth, window.innerHeight);
}
window.onresize = onResize;
onResize();

})();

/******/ })()
;
//# sourceMappingURL=bundle.preferences.js.map