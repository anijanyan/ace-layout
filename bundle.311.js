"use strict";
(self["webpackChunkace_layout"] = self["webpackChunkace_layout"] || []).push([[311],{

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

/***/ 40311:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*
  THIS FILE WAS AUTOGENERATED BY mode.tmpl.js
*/



var oop = __webpack_require__(89359);
var TextMode = (__webpack_require__(98030).Mode);
var PrismaHighlightRules = (__webpack_require__(77722)/* .PrismaHighlightRules */ .v);
// TODO: pick appropriate fold mode
var FoldMode = (__webpack_require__(12764)/* .FoldMode */ .Z);

var Mode = function() {
    this.HighlightRules = PrismaHighlightRules;
    this.foldingRules = new FoldMode();
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = "//";
    // this.blockComment = {start: ""/*"", end: ""*/""};
    // Extra logic goes here.
    this.$id = "ace/mode/prisma";
}).call(Mode.prototype);

exports.Mode = Mode;


/***/ }),

/***/ 77722:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* This file was autogenerated from ../convert.json (uuid: ) */
/****************************************************************************************
 * IT MIGHT NOT BE PERFECT ...But it's a good start from an existing *.tmlanguage file. *
 * fileTypes                                                                            *
 ****************************************************************************************/



var oop = __webpack_require__(89359);
var TextHighlightRules = (__webpack_require__(28053)/* .TextHighlightRules */ .K);

var PrismaHighlightRules = function() {
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules = {
        start: [{
            include: "#triple_comment"
        }, {
            include: "#double_comment"
        }, {
            include: "#model_block_definition"
        }, {
            include: "#config_block_definition"
        }, {
            include: "#enum_block_definition"
        }, {
            include: "#type_definition"
        }],
        "#model_block_definition": [{
            token: [
                "source.prisma.embedded.source",
                "storage.type.model.prisma",
                "source.prisma.embedded.source",
                "entity.name.type.model.prisma",
                "source.prisma.embedded.source",
                "punctuation.definition.tag.prisma"
            ],
            regex: /^(\s*)(model|type)(\s+)([A-Za-z][\w]*)(\s+)({)/,
            push: [{
                token: "punctuation.definition.tag.prisma",
                regex: /\s*\}/,
                next: "pop"
            }, {
                include: "#triple_comment"
            }, {
                include: "#double_comment"
            }, {
                include: "#field_definition"
            }, {
                defaultToken: "source.prisma.embedded.source"
            }]
        }],
        "#enum_block_definition": [{
            token: [
                "source.prisma.embedded.source",
                "storage.type.enum.prisma",
                "source.prisma.embedded.source",
                "entity.name.type.enum.prisma",
                "source.prisma.embedded.source",
                "punctuation.definition.tag.prisma"
            ],
            regex: /^(\s*)(enum)(\s+)([A-Za-z][\w]*)(\s+)({)/,
            push: [{
                token: "punctuation.definition.tag.prisma",
                regex: /\s*\}/,
                next: "pop"
            }, {
                include: "#triple_comment"
            }, {
                include: "#double_comment"
            }, {
                include: "#enum_value_definition"
            }, {
                defaultToken: "source.prisma.embedded.source"
            }]
        }],
        "#config_block_definition": [{
            token: [
                "source.prisma.embedded.source",
                "storage.type.config.prisma",
                "source.prisma.embedded.source",
                "entity.name.type.config.prisma",
                "source.prisma.embedded.source",
                "punctuation.definition.tag.prisma"
            ],
            regex: /^(\s*)(generator|datasource)(\s+)([A-Za-z][\w]*)(\s+)({)/,
            push: [{
                token: "source.prisma.embedded.source",
                regex: /\s*\}/,
                next: "pop"
            }, {
                include: "#triple_comment"
            }, {
                include: "#double_comment"
            }, {
                include: "#assignment"
            }, {
                defaultToken: "source.prisma.embedded.source"
            }]
        }],
        "#assignment": [{
            token: [
                "text",
                "variable.other.assignment.prisma",
                "text",
                "keyword.operator.terraform",
                "text"
            ],
            regex: /^(\s*)(\w+)(\s*)(=)(\s*)/,
            push: [{
                token: "text",
                regex: /$/,
                next: "pop"
            }, {
                include: "#value"
            }, {
                include: "#double_comment_inline"
            }]
        }],
        "#field_definition": [{
            token: [
                "text",
                "variable.other.assignment.prisma",
                "invalid.illegal.colon.prisma",
                "text",
                "support.type.primitive.prisma",
                "keyword.operator.list_type.prisma",
                "keyword.operator.optional_type.prisma",
                "invalid.illegal.required_type.prisma"
            ],
            regex: /^(\s*)(\w+)((?:\s*:)?)(\s+)(\w+)((?:\[\])?)((?:\?)?)((?:\!)?)/
        }, {
            include: "#attribute_with_arguments"
        }, {
            include: "#attribute"
        }],
        "#type_definition": [{
            token: [
                "text",
                "storage.type.type.prisma",
                "text",
                "entity.name.type.type.prisma",
                "text",
                "support.type.primitive.prisma"
            ],
            regex: /^(\s*)(type)(\s+)(\w+)(\s*=\s*)(\w+)/
        }, {
            include: "#attribute_with_arguments"
        }, {
            include: "#attribute"
        }],
        "#enum_value_definition": [{
            token: [
                "text",
                "variable.other.assignment.prisma",
                "text"
            ],
            regex: /^(\s*)(\w+)(\s*$)/
        }, {
            include: "#attribute_with_arguments"
        }, {
            include: "#attribute"
        }],
        "#attribute_with_arguments": [{
            token: [
                "entity.name.function.attribute.prisma",
                "punctuation.definition.tag.prisma"
            ],
            regex: /(@@?[\w\.]+)(\()/,
            push: [{
                token: "punctuation.definition.tag.prisma",
                regex: /\)/,
                next: "pop"
            }, {
                include: "#named_argument"
            }, {
                include: "#value"
            }, {
                defaultToken: "source.prisma.attribute.with_arguments"
            }]
        }],
        "#attribute": [{
            token: "entity.name.function.attribute.prisma",
            regex: /@@?[\w\.]+/
        }],
        "#array": [{
            token: "source.prisma.array",
            regex: /\[/,
            push: [{
                token: "source.prisma.array",
                regex: /\]/,
                next: "pop"
            }, {
                include: "#value"
            }, {
                defaultToken: "source.prisma.array"
            }]
        }],
        "#value": [{
            include: "#array"
        }, {
            include: "#functional"
        }, {
            include: "#literal"
        }],
        "#functional": [{
            token: [
                "support.function.functional.prisma",
                "punctuation.definition.tag.prisma"
            ],
            regex: /(\w+)(\()/,
            push: [{
                token: "punctuation.definition.tag.prisma",
                regex: /\)/,
                next: "pop"
            }, {
                include: "#value"
            }, {
                defaultToken: "source.prisma.functional"
            }]
        }],
        "#literal": [{
            include: "#boolean"
        }, {
            include: "#number"
        }, {
            include: "#double_quoted_string"
        }, {
            include: "#identifier"
        }],
        "#identifier": [{
            token: "support.constant.constant.prisma",
            regex: /\b(?:\w)+\b/
        }],
        "#map_key": [{
            token: [
                "variable.parameter.key.prisma",
                "text",
                "punctuation.definition.separator.key-value.prisma",
                "text"
            ],
            regex: /(\w+)(\s*)(:)(\s*)/
        }],
        "#named_argument": [{
            include: "#map_key"
        }, {
            include: "#value"
        }],
        "#triple_comment": [{
            token: "comment.prisma",
            regex: /\/\/\//,
            push: [{
                token: "comment.prisma",
                regex: /$/,
                next: "pop"
            }, {
                defaultToken: "comment.prisma"
            }]
        }],
        "#double_comment": [{
            token: "comment.prisma",
            regex: /\/\//,
            push: [{
                token: "comment.prisma",
                regex: /$/,
                next: "pop"
            }, {
                defaultToken: "comment.prisma"
            }]
        }],
        "#double_comment_inline": [{
            token: "comment.prisma",
            regex: /\/\/[^$]*/
        }],
        "#boolean": [{
            token: "constant.language.boolean.prisma",
            regex: /\b(?:true|false)\b/
        }],
        "#number": [{
            token: "constant.numeric.prisma",
            regex: /(?:0(?:x|X)[0-9a-fA-F]*|(?:\+|-)?\b(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:(?:e|E)(?:\+|-)?[0-9]+)?)(?:[LlFfUuDdg]|UL|ul)?\b/
        }],
        "#double_quoted_string": [{
            token: "string.quoted.double.start.prisma",
            regex: /"/,
            push: [{
                token: "string.quoted.double.end.prisma",
                regex: /"/,
                next: "pop"
            }, {
                include: "#string_interpolation"
            }, {
                token: "string.quoted.double.prisma",
                regex: /[\w\-\/\._\\%@:\?=]+/
            }, {
                defaultToken: "unnamed"
            }]
        }],
        "#string_interpolation": [{
            token: "keyword.control.interpolation.start.prisma",
            regex: /\$\{/,
            push: [{
                token: "keyword.control.interpolation.end.prisma",
                regex: /\s*\}/,
                next: "pop"
            }, {
                include: "#value"
            }, {
                defaultToken: "source.tag.embedded.source.prisma"
            }]
        }]
    };
    
    this.normalizeRules();
};

PrismaHighlightRules.metaData = {
    name: "Prisma",
    scopeName: "source.prisma"
};


oop.inherits(PrismaHighlightRules, TextHighlightRules);

exports.v = PrismaHighlightRules;


/***/ })

}]);
//# sourceMappingURL=bundle.311.js.map