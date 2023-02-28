import type {Widget} from "../widget";
import type {Pane} from "../boxes/pane";
import {Utils} from "../../utils/lib";
import {dom} from "../../utils/dom";
import {TabbarHandler} from "../../mouse/tabbar_handler";
import {TabManager} from "../tabs/tabManager";
import {TabPanelBar} from "./tabPanelBar";
import {Tab} from "../tabs/tab";

export class TabBar extends TabPanelBar<Tab> implements Widget {
    inverted = true;
    buttonsWidth = 0;
    tabPlusButton: HTMLElement;
    additionalButtons: HTMLElement;
    freeze: boolean;
    parent: Pane;
    plusButtonWidth: number;
    containerWidth: number;
    buttons: HTMLElement[] = [];

    setBox(x, y, w, h) {
        super.setBox(x, y, w, h);
        this.width = w;
        this.configure();
    }

    onTabMouseUp = (e) => {
        if (e.button == 1) {
            let tab = Utils.findHost(e.target, Tab);
            if (tab)
                tab.remove();
        }
    }

    onTabMouseDown = (e) => {
        if (e.button == 0)
            TabbarHandler.tabbarMouseDown(e, Tab, TabBar, true)
    }

    onTabPlusClick = (e) => {
        this.removeSelections();
        TabManager.getInstance().addNewTab(this.parent);
    }

    renderElement() {
        this.element = dom.buildDom(["div", {
            class: "tabbar " + this.direction,
            onwheel: this.onMouseWheel,
            $host: this,
        },
            ["span", {class: "tabMenuButton"}],
            [
                "div",
                {
                    class: "tabScroller",
                },
                ["div", {
                    class: "tabContainer",
                    ref: "tabContainer",
                    onclick: this.onTabClick,
                    onmouseup: this.onTabMouseUp,
                    onmousedown: this.onTabMouseDown,
                }]
            ],
            ["span", {
                class: "tabPlusButton",
                ref: "tabPlusButton",
                onclick: this.onTabPlusClick
            }, "+"],
            ["span", {
                class: "sizer"
            }],
            ["span", {
                class: "buttons",
                ref: "additionalButtons"
            }],

        ], undefined, this);

        if (this.initTabList && this.initTabList.length) {
            for (let i = 0; i < this.initTabList.length; i++) {
                this.addTab(this.initTabList[i]);
            }
        }
    }

    render() {
        if (!this.element)
            this.renderElement();

        return this.element
    }

    computeConfig() {
        let draggingElementSize = this.getDraggingElementSize();
        this.plusButtonWidth = this.tabPlusButton.getBoundingClientRect().width;
        this.containerWidth = this.width - this.plusButtonWidth - this.buttonsWidth;
        let tabsCount = this.tabList.length;
        if (tabsCount * this.MAX_TAB_SIZE + draggingElementSize < this.containerWidth) {
            this.tabWidth = this.MAX_TAB_SIZE;
            this.containerWidth = tabsCount * this.tabWidth + draggingElementSize;
        } else if (tabsCount * this.MIN_TAB_SIZE + draggingElementSize < this.containerWidth) {
            this.tabWidth = (this.containerWidth - draggingElementSize) / tabsCount;
        } else {
            this.tabWidth = this.MIN_TAB_SIZE;
        }
        let tabsWidth = this.tabWidth * tabsCount + draggingElementSize;

        this.scrollLeft = Math.min(Math.max(this.scrollLeft, 0), tabsWidth - this.containerWidth);
    }

    configure() {
        if (!this.width || this.freeze)
            return;

        let shadowWidth = 4;

        this.computeConfig();
        this.tabContainer.style.width = this.containerWidth + "px";
        let draggingElementSize = this.getDraggingElementSize();

        if (this.inverted) {
            let zIndex = this.tabList.length;
            let min = shadowWidth - this.tabWidth;
            let max = this.containerWidth;
            let maxPos = (max - this.tabWidth) / 2;
            let i = 0;
            for (; i < this.tabList.length; i++) {
                let tab = this.tabList[i];
                let el = tab.element;
                let pos = this.tabWidth * i - this.scrollLeft;
                if (this.tabDraggingElement && i >= this.draggingElementIndex!) {
                    pos += draggingElementSize!;
                }
                if (tab === this.activeTab) {
                    let activeMin = Math.max(min + this.tabWidth * 0.25, -this.tabWidth * 0.75);
                    if (pos < activeMin)
                        min = activeMin;
                }
                if (pos < min) {
                    pos = min;
                    min += shadowWidth;
                    el.classList.add("scrolledLeft");
                } else if (pos > maxPos) {
                    break;
                } else {
                    el.classList.remove("scrolledLeft");
                }

                el.style.width = this.tabWidth + "px";
                el.style.zIndex = String(zIndex);
                zIndex--;

                this.transform(el, pos, 0);
            }
            let lastRendered = i;
            zIndex = this.tabList.length;
            for (let i = this.tabList.length - 1; i >= lastRendered; i--) {
                let tab = this.tabList[i];
                let el = tab.element;
                let pos = this.tabWidth * i - this.scrollLeft;
                if (this.tabDraggingElement && i >= this.draggingElementIndex!) {
                    pos += draggingElementSize!;
                }
                if (tab === this.activeTab) {
                    let activeMax = Math.min(max - this.tabWidth * 0.25, this.containerWidth - this.tabWidth * 0.25);
                    if (pos > activeMax)
                        max = activeMax;
                }
                if (pos > max) {
                    pos = max;
                    max -= shadowWidth;
                    el.classList.add("scrolledLeft");
                } else {
                    el.classList.remove("scrolledLeft");
                }

                el.style.width = this.tabWidth + "px";
                el.style.zIndex = String(zIndex);
                zIndex--;

                this.transform(el, pos, 0);
            }
        } else {
            /*let min = 0;
            let max = containerWidth - w;
            let zIndex = 0
            let zdir = 1
            for (let i = 0; i < this.tabs.length; i++){
                let tab = this.tabs[i];
                let el = tab.element
                let pos = -this.scrollPos + w * i
                if (tab == this.activeTab) {
                    zdir = -1
                    zIndex = this.tabs.length
                }
                if (pos < min) {
                    pos = min
                    min += 4

                } else if (pos > max/2) {
                    break;
                }

                el.style.zIndex = zIndex
                zIndex += zdir

                translate(el, pos, 0)
                el.style.width = w - 1 + "px"
                el.style.transitionDuration = "0s"
            }
            let lastRendered = i
            let zIndex = 0
            let zdir = 1
            for (let i = this.tabs.length - 1; i >= lastRendered; i--){
                let tab = this.tabs[i];
                let el = tab.element
                let pos = -this.scrollPos + w * i
                if (tab == this.activeTab) {
                    zdir = -1
                    zIndex = this.tabs.length
                }
                if (pos > max) {
                    pos = max
                    max -= 4;
                }

                el.style.zIndex = zIndex
                zIndex += zdir

                translate(el, pos, 0)
                el.style.width = w - 1 + "px"
                el.style.transitionDuration = "0s"
            }*/
        }
    }

    addButton(button: HTMLElement) {
        this.buttons.push(button);
        this.setButtons(this.buttons);
    }

    setButtons(buttons: HTMLElement[]) {
        this.additionalButtons.innerHTML = "";
        this.buttons = buttons;
        buttons.forEach((button) => this.additionalButtons.appendChild(button));
        let rect = this.additionalButtons.getBoundingClientRect();
        this.buttonsWidth = rect.width;
        this.configure();
    }

    removeButtons() {
        if (!this.buttons.length)
            return;

        this.buttons = [];
        this.additionalButtons.innerHTML = "";
        this.buttonsWidth = 0;
        this.configure();
    }

    clear() {
        this.removeButtons();
        this.tabList = [];
    }

    remove() {
    }

    onTabClick = (e) => {
        let target = e.target;
        let tab: Tab = Utils.findHost(target, Tab);
        if (tab) {
            if (e.button == 0 && target.classList.contains("tabCloseButton")) {
                this.closeTab(tab);
            } else if (e.button == 0 && tab.isActive && tab.editor) {
                tab.editor.focus();
            } else if (e.button == 1) {
                tab.remove();
            }
        }
    }

    closeTab(tab: Tab) {
        let index = this.tabList.indexOf(tab);
        let isActiveTab = this.activeTab === tab;
        let isAnchorTab = this.anchorTab === tab;
        this.removeTab(tab);
        this.removeSelection(tab);
        if (isActiveTab) {
            this.activeTab = undefined;
            this.activatePrevious(index);
        }
        if (isAnchorTab)
            this.anchorTab = null;

        if (tab.element)
            tab.element.remove();


        TabManager.getInstance().removeTab(tab);//TODO need big refactor for all TabManagement

        this.configure();
    }

    activateTab(tab: Tab, content?: string | null, removeSelections: boolean = false) {
        removeSelections && this.removeSelections();

        this.activeTabClicked = false;
        this.addSelection(tab);
        if (this.activeTab) {
            if (this.activeTab === tab) {
                this.activeTabClicked = true;
                tab.activatePane();
                return;
            }

            if (this.activeTabHistory.indexOf(this.activeTab) >= 0)
                this.activeTabHistory.splice(this.activeTabHistory.indexOf(this.activeTab), 1);

            this.activeTabHistory.push(this.activeTab);
            this.activeTab.deactivate();
        }
        tab.activate(content);

        this.activeTab = tab;
        this.configure();
    }

    activatePrevious(index: number) {//TODO active tab history
        if (this.tabList.length) {
            let tab = this.tabList[index - 1] || this.tabList[this.tabList.length - 1];
            this.activateTab(tab);
        } else if (this.parent) {
            this.parent.remove();
        }
    }
}