import {Ace} from "ace-code";

export class Tree implements Ace.EventEmitter<any> {
    selection: Ace.Selection;

    constructor(element: HTMLElement, cellWidth?: number, cellHeight?: number);

    setDataProvider(provider: DataProvider): void;

    redraw(): void;

    getLength(): void;

    /**
     * @deprecated
     * @param row
     */
    getLine(row: number);

    getDataProvider(): DataProvider;

    /**
     *
     * Returns the currently highlighted selection.
     * @returns {String} The highlighted selection
     **/
    getSelection(): Ace.Selection;

    /**
     * {:VirtualRenderer.onResize}
     * @param {Boolean} force If `true`, recomputes the size, even if the height and width haven't changed
     *
     *
     * @related VirtualRenderer.onResize
     **/
    resize(force?: boolean): void

    /**
     * Brings the current `textInput` into focus.
     **/
    focus(once: boolean): void;

    /**
     * Returns `true` if the current `textInput` is in focus.
     **/
    isFocused(): boolean;

    /**
     * Blurs the current `textInput`.
     **/
    blur(): void

    /**
     * Emitted once the editor comes into focus.
     * @event focus
     **/
    onFocus()

    /**
     * Emitted once the editor has been blurred.
     * @event blur
     **/
    onBlur();

    onScrollTopChange();

    onScrollLeftChange()

    $onChangeClass()

    /**
     * Emitted when the selection changes.
     **/
    onCaretChange()

    onSelectionChange(e)

    execCommand(command, args)

    onTextInput(text)

    onCommandKey(e, hashId, keyCode)

    insertSting(str)

    setTheme(theme)

    /**
     * Returns an object indicating the currently selected rows. The object looks like this:
     *
     * ```json
     * { first: range.start.row, last: range.end.row }
     * ```
     *
     * @returns {Object}
     **/
    $getSelectedRows(): { first: number, last: number }

    /**
     * {:VirtualRenderer.getVisibleNodes}
     * @param {Number} tolerance fraction of the node allowed to be hidden while node still considered visible (default 1/3)
     * @returns {Array}
     * @related VirtualRenderer.getVisibleNodes
     **/
    getVisibleNodes(tolerance: number): any[]

    /**
     * Indicates if the node is currently visible on the screen.
     * @param {Object} node The node to check
     * @param {Number} tolerance fraction of the node allowed to be hidden while node still considered visible (default 1/3)
     *
     * @returns {Boolean}
     **/
    isNodeVisible(node: Object, tolerance: number): boolean

    $moveByPage(dir, select)

    /**
     * Selects the text from the current position of the document until where a "page down" finishes.
     **/
    selectPageDown()

    /**
     * Selects the text from the current position of the document until where a "page up" finishes.
     **/
    selectPageUp()

    /**
     * Shifts the document to wherever "page down" is, as well as moving the cursor position.
     **/
    gotoPageDown()

    /**
     * Shifts the document to wherever "page up" is, as well as moving the cursor position.
     **/
    gotoPageUp()

    /**
     * Scrolls the document to wherever "page down" is, without changing the cursor position.
     **/
    scrollPageDown()

    /**
     * Scrolls the document to wherever "page up" is, without changing the cursor position.
     **/
    scrollPageUp()

    /**
     * Scrolls to a row. If `center` is `true`, it puts the row in middle of screen (or attempts to).
     * @param {Number} row The row to scroll to
     * @param {Boolean} center If `true`
     * @param {Boolean} animate If `true` animates scrolling
     * @param {Function} callback Function to be called when the animation has finished
     *
     *
     * @related VirtualRenderer.scrollToRow
     **/
    scrollToRow(row, center, animate, callback)

    /**
     * Attempts to center the current selection on the screen.
     **/
    centerSelection()

    /**
     * Gets the current position of the Caret.
     * @returns {Object} An object that looks something like this:
     *
     * ```json
     * { row: currRow, column: currCol }
     * ```
     *
     * @related Selection.getCursor
     **/
    getCursorPosition(): Ace.Position

    /**
     * Returns the screen position of the Caret.
     * @returns {Number}
     **/
    getCursorPositionScreen(): number

    /**
     * {:Selection.getRange}
     * @returns {Range}
     * @related Selection.getRange
     **/
    getSelectionRange(): Ace.Range


    /**
     * Selects all the text in editor.
     * @related Selection.selectAll
     **/
    selectAll()

    /**
     * {:Selection.clearSelection}
     * @related Selection.clearSelection
     **/
    clearSelection()

    /**
     * Moves the Caret to the specified row and column. Note that this does not de-select the current selection.
     * @param {Number} row The new row number
     * @param {Number} column The new column number
     *
     *
     * @related Selection.moveCaretTo
     **/
    moveCaretTo(row: number, column: number)

    /**
     * Moves the Caret to the position indicated by `pos.row` and `pos.column`.
     * @param {Object} pos An object with two properties, row and column
     *
     *
     * @related Selection.moveCaretToPosition
     **/
    moveCaretToPosition(pos: Ace.Position)

    /**
     * Moves the Caret to the specified row number, and also into the indiciated column.
     * @param {Number} rowNumber The row number to go to
     * @param {Number} column A column number to go to
     * @param {Boolean} animate If `true` animates scolling
     *
     **/
    gotoRow(rowNumber: number, column: number, animate: boolean)

    /**
     * Moves the Caret to the specified row and column. Note that this does de-select the current selection.
     * @param {Number} row The new row number
     * @param {Number} column The new column number
     *
     *
     * @related Editor.moveCaretTo
     **/
    navigateTo(row: number, column: number)

    /**
     * Moves the Caret up in the document the specified number of times. Note that this does de-select the current selection.
     **/
    navigateUp()

    /**
     * Moves the Caret down in the document the specified number of times. Note that this does de-select the current selection.
     **/
    navigateDown()

    /**
     * Moves the Caret left in the document the specified number of times. Note that this does de-select the current selection.
     **/
    navigateLevelUp(toggleNode: boolean)

    /**
     * Moves the Caret right in the document the specified number of times. Note that this does de-select the current selection.
     **/
    navigateLevelDown()

    navigateStart()

    navigateEnd()

    getFirstNode()

    getLastNode(): Object

    $scrollIntoView(node)

    select(node)

    getCopyText(node): string

    onPaste(node): string

    reveal(node, animate)

    /**
     * {:UndoManager.undo}
     * @related UndoManager.undo
     **/
    undo()

    /**
     * {:UndoManager.redo}
     * @related UndoManager.redo
     **/
    redo()

    /**
     * Returns `true` if the editor is set to read-only mode.
     * @returns {Boolean}
     **/
    getReadOnly()

    /**
     * Cleans up the entire editor.
     **/
    destroy()

    setHorHeadingVisible(value)

    setVerHeadingVisible(value)

    enable()

    disable()

    removeAllListeners(name?: string): void;

    removeDefaultHandler(name: string, callback: Function): void;

    setDefaultHandler(name: string, callback: Function): void;

    addEventListener<K>(name: K, callback: any, capturing: boolean | undefined): any;

    off<K>(name: K, callback: any): void;

    on<K>(name: K, callback: any, capturing?: boolean): any;

    once<K>(name: K, callback: any): void;

    removeEventListener<K>(name: K, callback: any): void;

    removeListener<K>(name: K, callback: any): void;
}

export class DataProvider {
    root: { [property: string]: any }

    constructor(root?: Object | Array<any>)

    setRoot(root?: Object | Array<any>)

    open(node, deep, silent)

    expand(node, deep, silent)

    close(node, deep, silent)

    collapse(node, deep, silent)


    toggleNode(node, deep, silent)

    sort(children, compare)

    setFilter(fn)

    getChildren(node)

    loadChildren;

    shouldLoadChildren(node, ch)

    hasChildren(node)

    findNodeByPath()

    getSibling(node, dir)

    getNodeAtIndex(i)

    getIndexForNode(node)

    getMinIndex(): number

    getMaxIndex(): number

    setOpen(node, val): boolean

    isOpen(node): boolean

    isVisible(node): boolean

    isSelected(node): boolean

    setSelected(node, val): boolean

    isSelectable(node): boolean

    isAncestor(node, child): boolean

    setAttribute(node, name, value)

    getDataRange(rows, columns, callback)

    getRange(top, bottom): Ace.Range

    getTotalHeight(top, bottom): number

    getNodePosition(node): { top: number, height: number }

    findItemAtOffset(offset, clip)

    getIconHTML(node)

    getClassName(node)

    setClass(node, name, include)

    redrawNode;

    getCaptionHTML(node)

    getContentHTML;

    getEmptyMessage(): string;

    getText(node): string

    getRowIndent(node): number

    hideAllNodes()

    showAllNodes()
}