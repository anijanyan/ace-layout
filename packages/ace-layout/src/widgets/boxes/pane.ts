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

    setButtons(buttons: HTMLElement[]) {
        this.buttons = buttons;
        this.tabBar.setButtons(buttons);
    }

    removeButtons() {
        this.tabBar.removeButtons();
    }

    addButton(button: HTMLElement) {
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

    split(far, vertical?: boolean) {
        let newPane = new Pane({});
        let root = this.parent!;
        let [childBox1, childBox2] = far ? [newPane, this] : [this, newPane];
        let wrapper = new Box({
            childBox1,
            childBox2,
            vertical,
        });

        root.replaceChildBox(this, wrapper);
        return newPane;
    }

    remove() {
        this.clearEditors();
        let parentBox = this.parent;
        if (!parentBox)
            return;
        let root = parentBox.parent!;
        let siblingBox = parentBox.getChildBoxSibling(this);
        if (parentBox.isMain && !siblingBox)
            return;
        if (siblingBox)
            root.replaceChildBox(parentBox, siblingBox);
        this.element.remove();
        parentBox.remove();

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