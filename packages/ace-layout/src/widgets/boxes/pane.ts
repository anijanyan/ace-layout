import {Box} from "./box";
import {LayoutEditor, LayoutHTMLElement, PaneOptions} from "../widget";
import {dom} from "../../utils/dom";
import {AceEditor} from "../editors/aceEditor";
import {PreviewEditor} from "../editors/previewEditor";
import {EditorType} from "../../utils/params";
import {Utils} from "../../utils/lib";
import {TabBar} from "../toolbars/tabBar";

export class Pane extends Box {
    tabBar: TabBar;
    private tabEditorBoxElement: LayoutHTMLElement;
    isButtonHost: boolean;
    editors: { [editorName: string]: LayoutEditor }
    currentEditorType?: EditorType;
    editor?: LayoutEditor;

    constructor(options: PaneOptions = {}) {
        let tabBar = new TabBar({
            tabList: options.tabList
        });
        options.toolBars = options.toolBars ?? {};
        options.toolBars.top = tabBar;
        super(options);
        tabBar.parent = this;
        this.tabBar = tabBar;
    }

    toJSON(): object {
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
        let newPane = new Pane({});
        let root = this.parent!;
        let wrapper = new Box({
            [far ? 1 : 0]: this,
            [far ? 0 : 1]: newPane,
            vertical: vertical,
            ratio: 0.5
        });

        root.addChildBox(this, wrapper);

        if (this.isButtonHost) {
            let buttons = this.tabBar.buttons;
            this.removeButtons();
            wrapper.setButtons(buttons);
        }
        return newPane;
    }

    setButtons(buttons: HTMLElement[]) {
        this.isButtonHost = true;
        if (buttons) {
            this.tabBar.setButtons(buttons);
        } else {
            this.tabBar.removeButtons();
        }
    }

    addButton(button: HTMLElement) {
        this.isButtonHost = true;
        this.tabBar.addButton(button);
    }

    $updateChildSize(x, y, w, h) {
        this.updateToolBarSize(w, h);

        w -= this.padding.left + this.padding.right;
        h -= this.padding.top + this.padding.bottom;
        x = this.padding.left;
        y = this.padding.top;

        if (this.editor) {
            Utils.setBox(this.editor.container, x, y, w, h);

            this.editor.resize();
        }
    }

    removeButtons() {
        this.tabBar.removeButtons();
        this.isButtonHost = false;
    }

    remove() {
        let wrapper = this.parent!;
        let root = wrapper.parent!;
        let paneIndex = wrapper[0] == this ? 1 : 0;
        let pane = wrapper[paneIndex] || null;
        let rootIndex = root[0] == wrapper ? 0 : 1;

        if (pane) {
            pane.parent = root;
            root[rootIndex] = pane;
            root.element.appendChild(pane.element);

            if (root.fixedChild && root.fixedChild == wrapper) {
                pane.fixedSize = wrapper.fixedSize;
                pane.size = wrapper.size;
                root.fixedChild = pane;
            }
            wrapper.element.remove();
        } else {
            if (wrapper.isMain) {
                root = wrapper;
            } else {
                wrapper.element.remove();
            }
            root.ratio = 1;
        }

        root.recalculateAllMinSizes();
        root.resize();

        if (this.isButtonHost)
            root.setButtons(this.tabBar.buttons);

        this.clearEditors();
        this.tabBar.clear();
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

        this.hidePreviousEditor();

        this.editors ??= {};
        this.currentEditorType = editorType;
        this.editors[editorType] ??= this.createEditor();
        this.editor = this.editors[editorType];
        this.element.appendChild(this.editor.container);
    }

    private hidePreviousEditor() {
        if (!this.editor)
            return;
        this.element.removeChild(this.editor.container);
    }

    getEditor(editorType: EditorType = EditorType.ace): LayoutEditor | undefined {
        return this.editors[editorType];
    }

    getOrCreateEditor(editorType: EditorType = EditorType.ace): LayoutEditor {
        this.initEditor(editorType);
        return this.editor!;
    }

    private clearEditors() {
        for (let i in this.editors) {
            this.editors[i].destroy();
        }
        this.editors = {};
        this.currentEditorType = undefined;
        this.editor = undefined;
    }
}