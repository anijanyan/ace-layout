import {Accordion} from "../boxes/accordion";
import {Box} from "../boxes/box";
import {PanelOptions, Widget} from "../widget";
import {PanelManager} from "./panelManager";
import {Utils} from "../../lib";
import {TabbarHandler} from "../../mouse/tabbar_handler";
import {Tab, TabBar} from "./tab";
import {dom} from "../../utils/dom";


dom.importCssString(require("text-loader!../../../styles/panel.css"), "panel.css");

export class Panel extends Tab {
    active: boolean;
    location?: string;
    panelBody: Accordion | Box;
    autohide: boolean;
    parent: PanelBar;

    constructor(options: PanelOptions) {
        super(options);
        this.active = options.active;
        this.location = options.location;
        this.panelBody = options.panelBody;
        this.autohide = options.autohide;
    }

    activate() {
        this.active = true;
        this.element.classList.add("active");
        PanelManager.getInstance().activatePanel(this);
    }

    deactivate() {
        this.active = false;
        this.element.classList.remove("active");
        PanelManager.getInstance().deactivatePanel(this);
    }

    render() {
        this.element = dom.buildDom(["div", {
            class: "panelButton" + (this.active ? " active" : ""),
        }, ["span", {
            class: "panelTitle"
        }, this.title]]);

        this.element.$host = this;
        return this.element;
    }

    toJSON() {
        return {
            active: this.active || undefined,
            title: this.title,
            autohide: this.autohide,
            panelBody: this.panelBody.toJSON(),
        };
    }

    remove() {
    }
}

//TODO: ?
export class PanelBar extends TabBar implements Widget {
    position: any;

    /**
     *
     * @param {Object} options
     * @param {String|undefined} options.position
     * @param {Tab[]|Panel[]|undefined} options.tabList
     * @param {Panel[]|undefined} options.panelList
     */
    constructor(options) {
        if (!options.tabList) {
            options.tabList = options.panelList;
        }

        super(options);
        this.position = options.position || "";
    }

    setBox(x, y, w, h) {
        Utils.setBox(this.element, x, y, w, h);
        this.box = [x, y, w, h];
        this.configurate();
    }

    configurate() {
        var tabElement;
        var isVertical = this.isVertical();
        var tabSize = 30;//TODO
        var position = 0;
        for (var i = 0; i < this.tabList.length; i++) {
            tabElement = this.tabList[i].element;

            if (this.draggingElementSize && this.draggingElementIndex === i) {
                position += this.draggingElementSize;
            }

            if (isVertical) {
                tabElement.style.left = 0 + "px";
                tabElement.style.height = tabSize + "px";
                tabElement.style.top = position + "px";
            } else {
                tabElement.style.top = 0 + "px";
                tabElement.style.width = tabSize + "px";
                tabElement.style.left = position + "px";
            }

            position += tabSize;
        }
    }

    render() {
        if (!this.element) {
            this.element = dom.buildDom(["div", {
                class: "panelbar " + this.direction + " " + this.position,
                onmousedown: function (e) {
                    TabbarHandler.tabbarMouseDown(e, Panel, PanelBar)
                },
            }, ["div", {
                class: "tabContainer",
                ref: "tabContainer",
                onclick: this.onTabClick,
                onmousedown: function (e) {
                    TabbarHandler.tabbarMouseDown(e, Tab, TabBar)
                },
                onmouseup: (e) => {
                    if (this.activeTabClicked) {
                        var activeTab = this.activeTab;
                        this.removeSelection(this.activeTab);
                        this.activeTab.deactivate();
                        this.activeTab = null;

                        if (this.activeTabHistory.length && activeTab.autohide) {
                            var previousTab = activeTab;

                            while (previousTab === activeTab && this.activeTabHistory.length) {
                                previousTab = this.activeTabHistory.pop();
                            }

                            if (previousTab !== activeTab) {
                                this.activateTab(previousTab);
                            }
                        }
                    }
                },
            }]], null, this);
        }

        if (this.initTabList && this.initTabList.length) {
            for (var i = 0; i < this.initTabList.length; i++) {
                this.addTab(this.initTabList[i]);
            }
        }

        this.element.$host = this;
        return this.element
    }

    addTabList(tabList: PanelOptions[], index?: number) {
        index = index || this.tabList.length;
        var tab;
        for (var i = 0; i < tabList.length; i++) {
            tab = new Panel(tabList[i]);
            this.addTab(tab, index++);
        }
    }
}