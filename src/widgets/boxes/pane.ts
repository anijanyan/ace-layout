import {TabBar} from "../tabs/tab";
import {Box} from "./box";
import {LayoutEditor, LayoutHTMLElement, PaneOptions} from "../widget";
import {dom} from "../../utils/dom";
import {AceEditor} from "../editors/aceEditor";
import {PreviewEditor} from "../editors/previewEditor";
import {EditorType} from "../../utils/params";

export class Pane extends Box {
    tabBar: TabBar;
    private tabEditorBoxElement: LayoutHTMLElement;
    isButtonHost: any;
    editors: { [editorName: string]: LayoutEditor }
    currentEditorType?: EditorType;

    constructor(options: PaneOptions = {}) {
        var tabBar = new TabBar({
            tabList: options.tabList
        });
        options.toolBars = options.toolBars ?? {};
        options.toolBars.top = tabBar;
        super(options);
        tabBar.parent = this;
        this.tabBar = tabBar;
    }

    toJSON() {
        return {
            type: "pane",
            tabBar: this.tabBar.toJSON()
        };
    }

    render(): LayoutHTMLElement {
        super.render();
        this.element.classList.add("tabPanel");

        this.tabEditorBoxElement = dom.buildDom(["div", {
            class: `tab-editor`
        }]);
        this.element.appendChild(this.tabEditorBoxElement);

        return this.element;
    }

    acceptsTab(tab) {
        // TODO accept editor tabs, and not sidebar buttons
        return true;
    }

    split(far, vertical?: boolean) {
        var newPane = new Pane({});
        var root = this.parent;
        var wrapper = new Box({
            [far ? 1 : 0]: this,
            [far ? 0 : 1]: newPane,
            vertical: vertical,
            ratio: 0.5
        });

        root.addChildBox(this, wrapper);

        if (this.isButtonHost) {
            wrapper.buttons = this.buttons;
            this.removeButtons();
            wrapper.addButtons();
        }
        return newPane;
    }

    addButtons(buttons) {
        this.buttons = buttons;
        this.tabBar.addButtons(this.buttons);
        this.isButtonHost = true;
    }

    removeButtons() {
        this.buttons = null;
        this.tabBar.removeButtons();
        this.isButtonHost = false;
    }

    remove() {
        this.tabBar.clear();
        this.clearEditors();
        var wrapper = this.parent;
        var root = wrapper.parent;
        var paneIndex = wrapper[0] == this ? 1 : 0;
        var pane = wrapper[paneIndex] || null;
        var rootIndex = root[0] == wrapper ? 0 : 1;

        if (pane) {
            pane.parent = root;
            root[rootIndex] = pane;
            root.element.appendChild(pane.element);

            if (root.fixedChild && root.fixedChild == wrapper) {
                pane.fixedSize = wrapper.fixedSize;
                pane.size = wrapper.size;
                root.fixedChild = pane;
            }
        } else {
            if (wrapper.isMain) {
                root = wrapper;
                wrapper = null;
            }
            root.ratio = 1;
        }

        wrapper && wrapper.element.remove();

        root.recalculateAllMinSizes();
        root.resize();

        if (this.isButtonHost) {
            root.buttons = this.buttons;
            root.addButtons();
        }

    }

    getTopRightPane(): Pane {
        return this;
    }

    private createEditor(): LayoutEditor {
        let editor = this.createEditorByType();
        this.emit("editorAdded", editor);
        return editor;
    }

    private createEditorByType() {
        switch (this.currentEditorType) {
            case EditorType.preview:
                return new PreviewEditor();
            case EditorType.ace:
            default:
                return new AceEditor();
        }
    }

    private initEditor (editorType: EditorType = EditorType.ace) {
        if (this.currentEditorType == editorType)
            return;

        this.editor && this.hidePreviousEditor();

        this.editors ??= {};
        this.currentEditorType = editorType;
        this.editors[editorType] ??= this.createEditor();
        this.editor = this.editors[editorType];
        this.element.appendChild(this.editor.container);
    }

    private hidePreviousEditor() {
        this.element.removeChild(this.editor.container);
        this.editor.hide();
    }

    //TODO: move
    getEditor(editorType: EditorType = EditorType.ace): LayoutEditor {
        this.initEditor(editorType);
        return this.editor;
    }

    private clearEditors() {
        for (let i in this.editors) {
            this.editors[i].destroy();
        }
        this.editors = {};
        this.currentEditorType = null;
        this.editor = null;
    }
}