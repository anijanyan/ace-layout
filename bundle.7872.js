"use strict";
(self["webpackChunkace_layout_root"] = self["webpackChunkace_layout_root"] || []).push([[7872],{

/***/ 77872:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 *
 * @typedef {import("../editor").Editor} Editor
 */
var dom = __webpack_require__(6359);
var lang = __webpack_require__(20124);

/** simple statusbar **/
class StatusBar{
    /**
     * @param {Editor} editor
     * @param {HTMLElement} parentNode
     */
    constructor(editor, parentNode) {
        this.element = dom.createElement("div");
        this.element.className = "ace_status-indicator";
        this.element.style.cssText = "display: inline-block;";
        parentNode.appendChild(this.element);

        var statusUpdate = lang.delayedCall(function(){
            this.updateStatus(editor);
        }.bind(this)).schedule.bind(null, 100);

        editor.on("changeStatus", statusUpdate);
        editor.on("changeSelection", statusUpdate);
        editor.on("keyboardActivity", statusUpdate);
    }

    /**
     * @param {Editor} editor
     */
    updateStatus(editor) {
        var status = [];
        function add(str, separator) {
            str && status.push(str, separator || "|");
        }
        // @ts-expect-error TODO: potential wrong argument
        add(editor.keyBinding.getStatusText(editor));
        if (editor.commands.recording)
            add("REC");
        
        var sel = editor.selection;
        var c = sel.lead;
        
        if (!sel.isEmpty()) {
            var r = editor.getSelectionRange();
            add("(" + (r.end.row - r.start.row) + ":"  +(r.end.column - r.start.column) + ")", " ");
        }
        add(c.row + ":" + c.column, " ");        
        if (sel.rangeCount)
            add("[" + sel.rangeCount + "]", " ");
        status.pop();
        this.element.textContent = status.join("");
    }
}

exports.StatusBar = StatusBar;


/***/ })

}]);
//# sourceMappingURL=bundle.7872.js.map