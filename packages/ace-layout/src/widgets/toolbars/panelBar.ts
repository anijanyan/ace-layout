import {TabPanelBar} from "./tabPanelBar";
import type {PanelOptions, Widget} from "../widget";
import {dom} from "../../utils/dom";
import {TabbarHandler} from "../../mouse/tabbar_handler";
import {Panel} from "../tabs/panel";

export class PanelBar extends TabPanelBar<Panel> implements Widget {
    setBox(x, y, w, h) {
        super.setBox(x, y, w, h);
        this.configure();
    }

    configure() {
        let tabElement;
        let tabSize = 30;//TODO
        let position = 0;
        for (let i = 0; i < this.tabList.length; i++) {
            tabElement = this.tabList[i].element;

            if (this.draggingElementIndex === i)
                position += this.getDraggingElementSize();

            if (this.isVertical()) {
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
            }, ["div", {
                class: "tabContainer",
                ref: "tabContainer",
                onmousedown: function (e) {
                    TabbarHandler.tabbarMouseDown(e, Panel, PanelBar)
                },
                onmouseup: (e) => {
                    if (this.activeTabClicked) {
                        let activeTab = this.activeTab!;
                        this.removeSelection(activeTab);
                        activeTab.deactivate();
                        this.activeTab = undefined;

                        if (this.activeTabHistory.length && activeTab.autoHide) {
                            let previousTab = activeTab;

                            while (previousTab === activeTab && this.activeTabHistory.length) {
                                previousTab = this.activeTabHistory.pop()!;
                            }

                            if (previousTab !== activeTab)
                                this.activateTab(previousTab);
                        }
                    }
                },
            }]], undefined, this);
        }

        if (this.initTabList && this.initTabList.length) {
            for (let i = 0; i < this.initTabList.length; i++) {
                this.addTab(this.initTabList[i]);
            }
        }

        this.element.$host = this;
        return this.element
    }

    addTabList(tabList: PanelOptions[], index?: number) {
        index = index || this.tabList.length;
        let tab;
        for (let i = 0; i < tabList.length; i++) {
            tab = new Panel(tabList[i]);
            this.addTab(tab, index++);
        }
    }

    remove() {
    }
}