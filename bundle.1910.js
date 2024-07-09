"use strict";
(self["webpackChunkace_layout_root"] = self["webpackChunkace_layout_root"] || []).push([[1910],{

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

/***/ 26450:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*
  THIS FILE WAS GENERATED BY 'ligand' USING 'mode_highlight_rules.js'
*/

    

    var oop = __webpack_require__(89359);
    var TextHighlightRules = (__webpack_require__(28053)/* .TextHighlightRules */ .K);


    var IonHighlightRules = function() {
        // constant.language.bool.ion
        var k_keywords_bool =
            "TRUE|FALSE";
        var k_bool = k_keywords_bool;

        // constant.language.null.ion
        var k_keywords_null =
            "NULL.NULL|NULL.BOOL|NULL.INT|NULL.FLOAT|NULL.DECIMAL|NULL.TIMESTAMP|NULL.STRING|NULL.SYMBOL|NULL.BLOB|NULL.CLOB|"
            +"NULL.STRUCT|NULL.LIST|NULL.SEXP|NULL";
        var k_null = k_keywords_null;


        var keywordMapper = this.createKeywordMapper({
            "constant.language.bool.ion": k_bool,
            "constant.language.null.ion": k_null
        }, "constant.other.symbol.identifier.ion", true);

        var keywordMapperRule = {
            token : keywordMapper,
            regex : "\\b\\w+(?:\\.\\w+)?\\b"
        };

        this.$rules = {
          "start": [
            {
              "include": "value"
            }
          ],
          "value": [
            {
              "include": "whitespace"
            },
            {
              "include": "comment"
            },
            {
              "include": "annotation"
            },
            {
              "include": "string"
            },
            {
              "include": "number"
            },
            {
              "include": "keywords"
            },
            {
              "include": "symbol"
            },
            {
              "include": "clob"
            },
            {
              "include": "blob"
            },
            {
              "include": "struct"
            },
            {
              "include": "list"
            },
            {
              "include": "sexp"
            }
          ],
          "sexp": [
            {
              "token": "punctuation.definition.sexp.begin.ion",
              "regex": "\\(",
              "push": [
                {
                  "token": "punctuation.definition.sexp.end.ion",
                  "regex": "\\)",
                  "next": "pop"
                },
                {
                  "include": "comment"
                },
                {
                  "include": "value"
                },
                {
                  "token": "storage.type.symbol.operator.ion",
                  "regex": "[\\!\\#\\%\\&\\*\\+\\-\\./\\;\\<\\=\\>\\?\\@\\^\\`\\|\\~]+"
                }
              ]
            }
          ],
          "comment": [
            {
              "token": "comment.line.ion",
              "regex": "//[^\\n]*"
            },
            {
              "token": "comment.block.ion",
              "regex": "/\\*",
              "push": [
                {
                  "token": "comment.block.ion",
                  "regex": "[*]/",
                  "next": "pop"
                },
                {
                  "token": "comment.block.ion",
                  "regex": "[^*/]+"
                },
                {
                  "token": "comment.block.ion",
                  "regex": "[*/]+"
                }
              ]
            }
          ],
          "list": [
            {
              "token": "punctuation.definition.list.begin.ion",
              "regex": "\\[",
              "push": [
                {
                  "token": "punctuation.definition.list.end.ion",
                  "regex": "\\]",
                  "next": "pop"
                },
                {
                  "include": "comment"
                },
                {
                  "include": "value"
                },
                {
                  "token": "punctuation.definition.list.separator.ion",
                  "regex": ","
                }
              ]
            }
          ],
          "struct": [
            {
              "token": "punctuation.definition.struct.begin.ion",
              "regex": "\\{",
              "push": [
                {
                  "token": "punctuation.definition.struct.end.ion",
                  "regex": "\\}",
                  "next": "pop"
                },
                {
                  "include": "comment"
                },
                {
                  "include": "value"
                },
                {
                  "token": "punctuation.definition.struct.separator.ion",
                  "regex": ",|:"
                }
              ]
            }
          ],
          "blob": [
            {
              "token": [
                "punctuation.definition.blob.begin.ion",
                "string.other.blob.ion",
                "punctuation.definition.blob.end.ion"
              ],
              "regex": "(\\{\\{)([^\"]*)(\\}\\})"
            }
          ],
          "clob": [
            {
              "token": [
                "punctuation.definition.clob.begin.ion",
                "string.other.clob.ion",
                "punctuation.definition.clob.end.ion"
              ],
              "regex": "(\\{\\{)(\"[^\"]*\")(\\}\\})"
            }
          ],
          "symbol": [
            {
              "token": "storage.type.symbol.quoted.ion",
              "regex": "(['])((?:(?:\\\\')|(?:[^']))*?)(['])"
            },
            {
              "token": "storage.type.symbol.identifier.ion",
              "regex": "[\\$_a-zA-Z][\\$_a-zA-Z0-9]*"
            }
          ],
          "number": [
            {
              "token": "constant.numeric.timestamp.ion",
              "regex": "\\d{4}(?:-\\d{2})?(?:-\\d{2})?T(?:\\d{2}:\\d{2})(?::\\d{2})?(?:\\.\\d+)?(?:Z|[-+]\\d{2}:\\d{2})?"
            },
            {
              "token": "constant.numeric.timestamp.ion",
              "regex": "\\d{4}-\\d{2}-\\d{2}T?"
            },
            {
              "token": "constant.numeric.integer.binary.ion",
              "regex": "-?0[bB][01](?:_?[01])*"
            },
            {
              "token": "constant.numeric.integer.hex.ion",
              "regex": "-?0[xX][0-9a-fA-F](?:_?[0-9a-fA-F])*"
            },
            {
              "token": "constant.numeric.float.ion",
              "regex": "-?(?:0|[1-9](?:_?\\d)*)(?:\\.(?:\\d(?:_?\\d)*)?)?(?:[eE][+-]?\\d+)"
            },
            {
              "token": "constant.numeric.float.ion",
              "regex": "(?:[-+]inf)|(?:nan)"
            },
            {
              "token": "constant.numeric.decimal.ion",
              "regex": "-?(?:0|[1-9](?:_?\\d)*)(?:(?:(?:\\.(?:\\d(?:_?\\d)*)?)(?:[dD][+-]?\\d+)|\\.(?:\\d(?:_?\\d)*)?)|(?:[dD][+-]?\\d+))"
            },
            {
              "token": "constant.numeric.integer.ion",
              "regex": "-?(?:0|[1-9](?:_?\\d)*)"
            }
          ],
          "string": [
            {
              "token": [
                "punctuation.definition.string.begin.ion",
                "string.quoted.double.ion",
                "punctuation.definition.string.end.ion"
              ],
              "regex": "([\"])((?:(?:\\\\\")|(?:[^\"]))*?)([\"])"
            },
            {
              "token": "punctuation.definition.string.begin.ion",
              "regex": "'{3}",
              "push": [
                {
                  "token": "punctuation.definition.string.end.ion",
                  "regex": "'{3}",
                  "next": "pop"
                },
                {
                  "token": "string.quoted.triple.ion",
                  "regex": "(?:\\\\'|[^'])+"
                },
                {
                  "token": "string.quoted.triple.ion",
                  "regex": "'"
                }
              ]
            }
          ],
          "annotation": [
            {
              "token": [
                "variable.language.annotation.ion",
                "punctuation.definition.annotation.ion"
              ],
              "regex": /('(?:[^'\\]|\\.)*')\s*(::)/
            },
            {
              "token": [
                "variable.language.annotation.ion",
                "punctuation.definition.annotation.ion"
              ],
              "regex": "([\\$_a-zA-Z][\\$_a-zA-Z0-9]*)\\s*(::)"
            }
          ],
          "whitespace": [
            {
              "token": "text.ion",
              "regex": "\\s+"
            }
          ]
        } ;
        this.$rules["keywords"] = [keywordMapperRule];


        this.normalizeRules();
    };

    oop.inherits(IonHighlightRules, TextHighlightRules);

    exports.U = IonHighlightRules;


/***/ }),

/***/ 1164:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var Range = (__webpack_require__(59082)/* .Range */ .e);

var MatchingBraceOutdent = function() {};

(function() {

    this.checkOutdent = function(line, input) {
        if (! /^\s+$/.test(line))
            return false;

        return /^\s*\}/.test(input);
    };

    this.autoOutdent = function(doc, row) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({row: row, column: column});

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column-1), indent);
    };

    this.$getIndent = function(line) {
        return line.match(/^\s*/)[0];
    };

}).call(MatchingBraceOutdent.prototype);

exports.MatchingBraceOutdent = MatchingBraceOutdent;


/***/ }),

/***/ 81910:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*
  THIS FILE WAS GENERATED BY 'ligand' USING 'mode.js'
*/



var oop = __webpack_require__(89359);
var TextMode = (__webpack_require__(98030).Mode);
var HighlightRules = (__webpack_require__(13770)/* .PartiqlHighlightRules */ .O);
var MatchingBraceOutdent = (__webpack_require__(1164).MatchingBraceOutdent);
var CStyleFoldMode = (__webpack_require__(12764)/* .FoldMode */ .Z);

var Mode = function () {
    this.HighlightRules = HighlightRules;
    this.$outdent = new MatchingBraceOutdent();
    this.$behaviour = this.$defaultBehaviour;
    this.foldingRules = new CStyleFoldMode();
};
oop.inherits(Mode, TextMode);

(function () {

    this.lineCommentStart = "--";
    this.blockComment = {
        start: "/*",
        end: "*/",
        nestable: true
    };

    this.getNextLineIndent = function (state, line, tab) {
        var indent = this.$getIndent(line);

        if (state == "start") {
            var match = line.match(/^.*[\{\(\[]\s*$/);
            if (match) {
                indent += tab;
            }
        }

        return indent;
    };

    this.checkOutdent = function (state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function (state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    };

    this.$id = "ace/mode/partiql";
}).call(Mode.prototype);

exports.Mode = Mode;


/***/ }),

/***/ 13770:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*
  THIS FILE WAS GENERATED BY 'ligand' USING 'mode_highlight_rules.js'
*/

    

    var oop = __webpack_require__(89359);
    var TextHighlightRules = (__webpack_require__(28053)/* .TextHighlightRules */ .K);

    var IonHighlightRules = (__webpack_require__(26450)/* .IonHighlightRules */ .U);

    var PartiqlHighlightRules = function() {
        // constant.language.partiql
        var k_partiql_constant =
            "MISSING";
        var k_sql_constant =
            "FALSE|NULL|TRUE";
        var k_constant = k_partiql_constant + "|" + k_sql_constant;

        // keyword.other.partiql
        var k_partiql_keyword =
            "PIVOT|UNPIVOT|LIMIT|TUPLE|REMOVE|INDEX|CONFLICT|DO|NOTHING|RETURNING|"
            +"MODIFIED|NEW|OLD|LET";
        var k_sql_keyword =
            "ABSOLUTE|ACTION|ADD|ALL|ALLOCATE|ALTER|AND|ANY|ARE|AS|"
            +"ASC|ASSERTION|AT|AUTHORIZATION|BEGIN|BETWEEN|BIT_LENGTH|BY|CASCADE|CASCADED|"
            +"CASE|CATALOG|CHAR|CHARACTER_LENGTH|CHAR_LENGTH|CHECK|CLOSE|COLLATE|COLLATION|COLUMN|"
            +"COMMIT|CONNECT|CONNECTION|CONSTRAINT|CONSTRAINTS|CONTINUE|CONVERT|CORRESPONDING|CREATE|CROSS|"
            +"CURRENT|CURSOR|DEALLOCATE|DEC|DECLARE|DEFAULT|DEFERRABLE|DEFERRED|DELETE|DESC|"
            +"DESCRIBE|DESCRIPTOR|DIAGNOSTICS|DISCONNECT|DISTINCT|DOMAIN|DROP|ELSE|END|END-EXEC|"
            +"ESCAPE|EXCEPT|EXCEPTION|EXEC|EXECUTE|EXTERNAL|EXTRACT|FETCH|FIRST|FOR|"
            +"FOREIGN|FOUND|FROM|FULL|GET|GLOBAL|GO|GOTO|GRANT|GROUP|"
            +"HAVING|IDENTITY|IMMEDIATE|IN|INDICATOR|INITIALLY|INNER|INPUT|INSENSITIVE|INSERT|"
            +"INTERSECT|INTERVAL|INTO|IS|ISOLATION|JOIN|KEY|LANGUAGE|LAST|LEFT|"
            +"LEVEL|LIKE|LOCAL|LOWER|MATCH|MODULE|NAMES|NATIONAL|NATURAL|NCHAR|"
            +"NEXT|NO|NOT|OCTET_LENGTH|OF|ON|ONLY|OPEN|OPTION|OR|"
            +"ORDER|OUTER|OUTPUT|OVERLAPS|PAD|PARTIAL|POSITION|PRECISION|PREPARE|PRESERVE|"
            +"PRIMARY|PRIOR|PRIVILEGES|PROCEDURE|PUBLIC|READ|REAL|REFERENCES|RELATIVE|RESTRICT|"
            +"REVOKE|RIGHT|ROLLBACK|ROWS|SCHEMA|SCROLL|SECTION|SELECT|SESSION|SET|"
            +"SIZE|SOME|SPACE|SQL|SQLCODE|SQLERROR|SQLSTATE|TABLE|TEMPORARY|THEN|"
            +"TIME|TO|TRANSACTION|TRANSLATE|TRANSLATION|UNION|UNIQUE|UNKNOWN|UPDATE|UPPER|"
            +"USAGE|USER|USING|VALUE|VALUES|VIEW|WHEN|WHENEVER|WHERE|WITH|"
            +"WORK|WRITE|ZONE";
        var k_keyword = k_partiql_keyword + "|" + k_sql_keyword;

        // storage.type.partiql
        var k_partiql_type =
            "BOOL|BOOLEAN|STRING|SYMBOL|CLOB|BLOB|STRUCT|LIST|SEXP|BAG";
        var k_sql_type =
            "CHARACTER|DATE|DECIMAL|DOUBLE|FLOAT|INT|INTEGER|NUMERIC|SMALLINT|TIMESTAMP|"
            +"VARCHAR|VARYING";
        var k_type = k_partiql_type + "|" + k_sql_type;

        // support.function.aggregation.partiql
        var k_sql_aggfn =
            "AVG|COUNT|MAX|MIN|SUM";
        var k_aggfn = k_sql_aggfn;

        // support.function.partiql
        var k_sql_fn =
            "CAST|COALESCE|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|EXISTS|DATE_ADD|DATE_DIFF|NULLIF|"
            +"SESSION_USER|SUBSTRING|SYSTEM_USER|TRIM";
        var k_fn = k_sql_fn;


        var keywordMapper = this.createKeywordMapper({
            "constant.language.partiql": k_constant,
            "keyword.other.partiql": k_keyword,
            "storage.type.partiql": k_type,
            "support.function.aggregation.partiql": k_aggfn,
            "support.function.partiql": k_fn
        }, "variable.language.identifier.partiql", true);

        var keywordMapperRule = {
            token : keywordMapper,
            regex : "\\b\\w+\\b"
        };

        this.$rules = {
          "start": [
            {
              "include": "whitespace"
            },
            {
              "include": "comment"
            },
            {
              "include": "value"
            }
          ],
          "value": [
            {
              "include": "whitespace"
            },
            {
              "include": "comment"
            },
            {
              "include": "tuple_value"
            },
            {
              "include": "collection_value"
            },
            {
              "include": "scalar_value"
            }
          ],
          "scalar_value": [
            {
              "include": "string"
            },
            {
              "include": "number"
            },
            {
              "include": "keywords"
            },
            {
              "include": "identifier"
            },
            {
              "include": "embed-ion"
            },
            {
              "include": "operator"
            },
            {
              "include": "punctuation"
            }
          ],
          "punctuation": [
            {
              "token": "punctuation.partiql",
              "regex": "[;:()\\[\\]\\{\\},.]"
            }
          ],
          "operator": [
            {
              "token": "keyword.operator.partiql",
              "regex": "[+*/<>=~!@#%&|?^-]+"
            }
          ],
          "identifier": [
            {
              "token": "variable.language.identifier.quoted.partiql",
              "regex": "([\"])((?:(?:\\\\.)|(?:[^\"\\\\]))*?)([\"])"
            },
            {
              "token": "variable.language.identifier.at.partiql",
              "regex": "@\\w+"
            },
            {
              "token": "variable.language.identifier.partiql",
              "regex": "\\b\\w+(?:\\.\\w+)?\\b"
            }
          ],
          "number": [
            {
              "token": "constant.numeric.partiql",
              "regex": "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }
          ],
          "string": [
            {
              "token": [
                "punctuation.definition.string.begin.partiql",
                "string.quoted.single.partiql",
                "punctuation.definition.string.end.partiql"
              ],
              "regex": "(['])((?:(?:\\\\.)|(?:[^'\\\\]))*?)(['])"
            }
          ],
          "collection_value": [
            {
              "include": "array_value"
            },
            {
              "include": "bag_value"
            }
          ],
          "bag_value": [
            {
              "token": "punctuation.definition.bag.begin.partiql",
              "regex": "<<",
              "push": [
                {
                  "token": "punctuation.definition.bag.end.partiql",
                  "regex": ">>",
                  "next": "pop"
                },
                {
                  "include": "comment"
                },
                {
                  "token": "punctuation.definition.bag.separator.partiql",
                  "regex": ","
                },
                {
                  "include": "value"
                }
              ]
            }
          ],
          "comment": [
            {
              "token": "comment.line.partiql",
              "regex": "--.*"
            },
            {
              "token": "comment.block.partiql",
              "regex": "/\\*",
              "push": "comment__1"
            }
          ],
          "comment__1": [
            {
              "token": "comment.block.partiql",
              "regex": "[*]/",
              "next": "pop"
            },
            {
              "token": "comment.block.partiql",
              "regex": "[^*/]+"
            },
            {
              "token": "comment.block.partiql",
              "regex": "/\\*",
              "push": "comment__1"
            },
            {
              "token": "comment.block.partiql",
              "regex": "[*/]+"
            }
          ],
          "array_value": [
            {
              "token": "punctuation.definition.array.begin.partiql",
              "regex": "\\[",
              "push": [
                {
                  "token": "punctuation.definition.array.end.partiql",
                  "regex": "\\]",
                  "next": "pop"
                },
                {
                  "include": "comment"
                },
                {
                  "token": "punctuation.definition.array.separator.partiql",
                  "regex": ","
                },
                {
                  "include": "value"
                }
              ]
            }
          ],
          "tuple_value": [
            {
              "token": "punctuation.definition.tuple.begin.partiql",
              "regex": "\\{",
              "push": [
                {
                  "token": "punctuation.definition.tuple.end.partiql",
                  "regex": "\\}",
                  "next": "pop"
                },
                {
                  "include": "comment"
                },
                {
                  "token": "punctuation.definition.tuple.separator.partiql",
                  "regex": ",|:"
                },
                {
                  "include": "value"
                }
              ]
            }
          ],
          "whitespace": [
            {
              "token": "text.partiql",
              "regex": "\\s+"
            }
          ]
        } ;
        this.$rules["keywords"] = [keywordMapperRule];

        this.$rules["embed-ion"] = [{token : "punctuation.definition.ion.begin.partiql", regex : "`", next : "ion-start"}];
        this.embedRules(IonHighlightRules, "ion-", [{token : "punctuation.definition.ion.end.partiql", regex : "`", next : "start"}]);

        this.normalizeRules();
    };

    oop.inherits(PartiqlHighlightRules, TextHighlightRules);

    exports.O = PartiqlHighlightRules;


/***/ })

}]);
//# sourceMappingURL=bundle.1910.js.map