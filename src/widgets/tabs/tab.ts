import {
    EditSession,
    LayoutEditor,
    TabOptions,
    Widget
} from "../widget";
import {TabManager} from "./tabManager";
import {dom} from "../../utils/dom";
import * as tabCSS from "../../../styles/tab.css";
import {EditorType} from "../../utils/params";
import {TabPanel} from "./tabPanel";
import type {TabBar} from "../toolbars/tabBar";

dom.importCssString(tabCSS, "tab.css");

export class Tab<SessionType extends EditSession = EditSession> extends TabPanel implements Widget {
    session: SessionType;
    sessionValue?: string;
    contextMenu = "tabs";
    tabIcon: string;
    path: string;
    preview: boolean;
    parent?: TabBar;
    $caption: string;
    editorType: EditorType;

    constructor(options: TabOptions) {
        super(options);
        this.tabIcon = options.icon ?? "";
        this.path = options.path;
        this.preview = options.preview ?? false;
        this.editorType = options.editorType ?? EditorType.ace;
    }

    toJSON(): TabOptions {
        return {
            title: this.title,
            icon: this.tabIcon || undefined,
            active: this.active || undefined,
            path: this.path,
            preview: this.preview || undefined,
            editorType: this.editorType
        };
    }

    activate(content?: string | null) {
        super.activate();

        this.activatePane();

        let tabManager = TabManager.getInstance();
        tabManager.loadFile(this, content);
        tabManager.activePane!.resize();
    }

    activatePane() {
        TabManager.getInstance().activePane = this.parent?.parent;
    }

    remove() {
        this.parent?.closeTab(this);
    }

    set caption(value) {
        this.$caption = value
    }

    get caption() {
        return this.$caption
    }

    render() {
        this.element = dom.buildDom(["div",
            {
                class: "tab" + (this.active ? " active" : ""),
                title: this.path
            },
            ["span", {class: "tabIcon"}, this.tabIcon],
            ["span", {class: "tabTitle", ref: "$title"}, this.title],
            ["span", {class: "tabCloseButton"}],
        ], undefined, this);

        if (this.preview)
            this.element.style.fontStyle = "italic"

        this.element.$host = this;
        return this.element;
    }

    setTitle(title: string) {
        this.title = title;
        this.element.getElementsByClassName("tabTitle")[0].innerHTML = title;
    }

    get isActive(): boolean {
        return this.parent?.activeTab == this;
    }

    get editor(): LayoutEditor<SessionType> | undefined {
        return this.parent?.parent.getEditor(this.editorType);
    }
}
