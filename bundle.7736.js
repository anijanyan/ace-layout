"use strict";
(self["webpackChunkace_layout_root"] = self["webpackChunkace_layout_root"] || []).push([[7736],{

/***/ 12764:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var oop = __webpack_require__(89359);
var Range = (__webpack_require__(59082)/* .Range */ .e);
var BaseFoldMode = (__webpack_require__(15369).FoldMode);

var FoldMode = exports.Z = function(commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(
            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
        );
        this.foldingStopMarker = new RegExp(
            this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
        );
    }
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {
    
    this.foldingStartMarker = /([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/;
    this.singleLineBlockCommentRe= /^\s*(\/\*).*\*\/\s*$/;
    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
    
    //prevent naming conflict with any modes that inherit from cstyle and override this (like csharp)
    this._getFoldWidgetBase = this.getFoldWidget;
    
    /**
     * Gets fold widget with some non-standard extras:
     *
     * @example lineCommentRegionStart
     *      //#region [optional description]
     *
     * @example blockCommentRegionStart
     *      /*#region [optional description] *[/]
     *
     * @example tripleStarFoldingSection
     *      /*** this folds even though 1 line because it has 3 stars ***[/]
     * 
     * @note the pound symbol for region tags is optional
     */
    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
    
        if (this.singleLineBlockCommentRe.test(line)) {
            // No widget for single line block comment unless region or triple star
            if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line))
                return "";
        }
    
        var fw = this._getFoldWidgetBase(session, foldStyle, row);
    
        if (!fw && this.startRegionRe.test(line))
            return "start"; // lineCommentRegionStart
    
        return fw;
    };

    this.getFoldWidgetRange = function(session, foldStyle, row, forceMultiline) {
        var line = session.getLine(row);
        
        if (this.startRegionRe.test(line))
            return this.getCommentRegionBlock(session, line, row);
        
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);
                
            var range = session.getCommentFoldRange(row, i + match[0].length, 1);
            
            if (range && !range.isMultiLine()) {
                if (forceMultiline) {
                    range = this.getSectionRange(session, row);
                } else if (foldStyle != "all")
                    range = null;
            }
            
            return range;
        }

        if (foldStyle === "markbegin")
            return;

        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;

            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i, -1);
        }
    };
    
    this.getSectionRange = function(session, row) {
        var line = session.getLine(row);
        var startIndent = line.search(/\S/);
        var startRow = row;
        var startColumn = line.length;
        row = row + 1;
        var endRow = row;
        var maxRow = session.getLength();
        while (++row < maxRow) {
            line = session.getLine(row);
            var indent = line.search(/\S/);
            if (indent === -1)
                continue;
            if  (startIndent > indent)
                break;
            var subRange = this.getFoldWidgetRange(session, "all", row);
            
            if (subRange) {
                if (subRange.start.row <= startRow) {
                    break;
                } else if (subRange.isMultiLine()) {
                    row = subRange.end.row;
                } else if (startIndent == indent) {
                    break;
                }
            }
            endRow = row;
        }
        
        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
    };
    
    /**
     * gets comment region block with end region assumed to be start of comment in any cstyle mode or SQL mode (--) which inherits from this.
     * There may optionally be a pound symbol before the region/endregion statement
     */
    this.getCommentRegionBlock = function(session, line, row) {
        var startColumn = line.search(/\s*$/);
        var maxRow = session.getLength();
        var startRow = row;
        
        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
        var depth = 1;
        while (++row < maxRow) {
            line = session.getLine(row);
            var m = re.exec(line);
            if (!m) continue;
            if (m[1]) depth--;
            else depth++;

            if (!depth) break;
        }

        var endRow = row;
        if (endRow > startRow) {
            return new Range(startRow, startColumn, endRow, line.length);
        }
    };

}).call(FoldMode.prototype);


/***/ }),

/***/ 47736:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var oop = __webpack_require__(89359);
var TextMode = (__webpack_require__(98030).Mode);
var HighlightRules = (__webpack_require__(81937)/* .PrqlHighlightRules */ .r);
var FoldMode = (__webpack_require__(12764)/* .FoldMode */ .Z);

var Mode = function() {
    this.HighlightRules = HighlightRules;
    this.foldingRules = new FoldMode();
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = "#";
    // Extra logic goes here.
    this.$id = "ace/mode/prql";
}).call(Mode.prototype);

exports.Mode = Mode;


/***/ }),

/***/ 81937:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// https://prql-lang.org/
// https://github.com/PRQL/prql



var oop = __webpack_require__(89359);
var TextHighlightRules = (__webpack_require__(28053)/* .TextHighlightRules */ .K);

var PrqlHighlightRules = function() {
    var builtinFunctions = "min|max|sum|average|stddev|every|any|concat_array|count|" +
    "lag|lead|first|last|rank|rank_dense|row_number|" +
    "round|as|in|" +
    "tuple_every|tuple_map|tuple_zip|_eq|_is_null|" +
    "from_text|" +
    "lower|upper|" +
    "read_parquet|read_csv";

    var builtinTypes = [
        "bool",
        "int",
        "int8",
        "int16",
        "int32",
        "int64",
        "int128",
        "float",
        "text",
        "timestamp",
        "set"].join("|");

    var keywordMapper = this.createKeywordMapper({
       "constant.language": "null",
       "constant.language.boolean": "true|false",
       "keyword": "let|into|case|prql|type|module|internal",
       "storage.type": "let|func",
       "support.function": builtinFunctions,
       "support.type": builtinTypes,
       "variable.language": "date|math"
    }, "identifier");
    
    var escapeRe = /\\(\d+|['"\\&bfnrt]|u\{[0-9a-fA-F]{1,6}\}|x[0-9a-fA-F]{2})/;
    var identifierRe = /[A-Za-z_][a-z_A-Z0-9]/.source;
    var numRe = /(?:\d\d*(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+\b)?/.source;
    var bidi = "[\\u202A\\u202B\\u202D\\u202E\\u2066\\u2067\\u2068\\u202C\\u2069]";

    this.$rules = {
        start: [
        {
            token: "string.start",
            regex: 's?"',
            next: "string"
        }, {
            token: "string.start",
            regex: 'f"',
            next: "fstring"
        }, {
            token: "string.start",
            regex: 'r"',
            next: "rstring"
        }, {
            token: "string.single",
            start: "'",
            end: "'"
        }, {
            token: "string.character",
            regex: "'(?:" + escapeRe.source + "|.)'?"
        }, {
            token: "constant.language",
            regex: "^" + identifierRe + "*"
        }, {
            token : ["constant.numeric", "keyword"],
            regex : "(" + numRe + ")(years|months|weeks|days|hours|minutes|seconds|milliseconds|microseconds)"
        }, {
            token: "constant.numeric", // hexadecimal, octal and binary
            regex: /0(?:[xX][0-9a-fA-F]+|[oO][0-7]+|[bB][01]+)\b/
        }, {
            token: "constant.numeric", // decimal integers and floats
            regex: numRe
        }, {
            token: "comment.block.documentation",
            regex: "#!.*"
        }, {
            token: "comment.line.number-sign",
            regex: "#.*"
        }, {
            token: "keyword.operator",
            regex: /\|\s*/,
            next: "pipe"
        }, {
            token: "keyword.operator",
            regex: /->|=>|==|!=|>=|<=|~=|&&|\|\||\?\?|\/\/|@/
        }, {
            token: "invalid.illegal",
            regex: bidi
        }, {
            token: "punctuation.operator",
            regex: /[,`]/
        }, {
            token: keywordMapper,
            regex: "[\\w\\xff-\\u218e\\u2455-\\uffff]+\\b"
        }, {
            token: "paren.lparen",
            regex: /[\[({]/
        }, {
            token: "paren.rparen",
            regex: /[\])}]/
        } ],
        pipe: [{
            token: "constant.language",
            regex: identifierRe + "*",
            next: "pop"
        },{
            token: "error",
            regex: "",
            next: "pop"
        }],
        string: [{
            token: "constant.character.escape",
            regex: escapeRe
        }, {
            token: "text",
            regex: /\\(\s|$)/,
            next: "stringGap"
        }, {
            token: "string.end",
            regex: '"',
            next: "start"
        }, {
            token: "invalid.illegal",
            regex: bidi
        }, {
            defaultToken: "string.double"
        }],
        stringGap: [{
            token: "text",
            regex: /\\/,
            next: "string"
        }, {
            token: "error",
            regex: "",
            next: "start"
        }],
        fstring: [{
            token: "constant.character.escape",
            regex: escapeRe
        }, {
            token: "string.end",
            regex: '"',
            next: "start"
        }, {
            token: "invalid.illegal",
            regex: bidi
        }, {
            token: "paren.lparen",
            regex: "{",
            push: "fstringParenRules"
        }, {
            token: "invalid.illegal",
            regex: bidi
        }, {
            defaultToken: "string"
        }],
        fstringParenRules: [{
            token: "constant.language",
            regex: "^" + identifierRe + "*"
        }, {
            token: "paren.rparen",
            regex: "}",
            next: "pop"
        }],
        rstring: [{
            token: "string.end",
            regex: '"',
            next: "start"
        }, {
            token: "invalid.illegal",
            regex: bidi
        }, {
            defaultToken: "string"
        }]
    };
    
    this.normalizeRules();
};

oop.inherits(PrqlHighlightRules, TextHighlightRules);

exports.r = PrqlHighlightRules;


/***/ })

}]);
//# sourceMappingURL=bundle.7736.js.map