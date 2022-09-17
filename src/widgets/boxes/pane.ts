import {Tab, TabBar} from "../tabs/tab";
import {Box} from "./box";
import {LayoutHTMLElement, PaneOptions} from "../widget";
import {dom} from "../../utils/dom";
import {AceEditor} from "../editors/aceEditor";

export class Pane extends Box {
    tabBar: TabBar;
    private tabEditorBoxElement: LayoutHTMLElement;
    isButtonHost: any;
    editors: { [editorName: string]: any }

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

    //TODO: move
    initBoxTabEditor(tab: Tab) {
        tab.editorType = tab.editorType || "ace";
        if (!this.editors) this.editors = {};
        var editorType = tab.editorType;
        if (!this.editors[editorType]) {
            this.editor = AceEditor.create();
            this.editors[editorType] = this.editor;
        } else {
            this.editor = this.editors[editorType];
        }
        this.editor.container.style.display = "";
        this.element.appendChild(this.editor.container);
    }
}