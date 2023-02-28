import {Toolbar} from "./toolbar";
import type {TabPanel} from "../tabs/tabPanel";
import type {LayoutHTMLElement} from "../widget";

export abstract class TabPanelBar<TabPanelType extends TabPanel> extends Toolbar {
    activeTab?: TabPanelType;
    selectedTabs: TabPanelType[] = [];
    tabList: TabPanelType[] = [];
    initTabList: TabPanelType[];
    tabDraggingElement?: HTMLElement;
    draggingElementIndex?: number;
    isDragging: boolean;
    scrollLeft = 0;
    animationSteps = 0;
    MIN_TAB_SIZE = 120;
    MAX_TAB_SIZE = 150;
    vX: number;
    animationTimer: any;
    animationScrollLeft: any;
    width: any;
    anchorTab: any;
    tabWidth: number;
    activeTabClicked: boolean;
    activeTabHistory: TabPanelType[] = [];
    tabContainer: HTMLElement;

    constructor(options) {
        super(options);
        this.initTabList = options.tabList ?? options.panelList ?? [];
    }

    isVertical() {
        return this.direction === "vertical";
    }

    getDraggingElementSize(): number {
        if (!this.tabDraggingElement)
            return 0;

        let draggingElementSize = this.isVertical() ? this.tabDraggingElement.style.height : this.tabDraggingElement.style.width;
        return parseInt(draggingElementSize, 10);
    }

    tabMouseDown(tab: TabPanelType, expand = false, toggle = false) {
        if (expand) {
            this.expandSelection(tab, toggle);
        } else {
            this.anchorTab = null;
            if (toggle) {
                this.toggleSelection(tab);
            } else {
                this.activateTab(tab, undefined, this.selectedTabs.indexOf(tab) < 0);
            }
        }
    }

    expandSelection(tab: TabPanelType, toggle = false) {
        if (!this.anchorTab)
            this.anchorTab = this.activeTab;

        let prevSelectedTabs = this.selectedTabs;
        this.selectedTabs = [];
        let start = this.tabList.indexOf(this.anchorTab);
        let end = this.tabList.indexOf(tab);
        if (end < start) {
            [start, end] = [end, start];
        }
        for (let i = start; i <= end; i++) {
            this.addSelection(this.tabList[i]);
        }

        prevSelectedTabs.forEach((selectedTab) => {
            if (this.selectedTabs.indexOf(selectedTab) < 0) {
                if (!toggle) {
                    this.deselectTab(selectedTab);
                } else {
                    this.addSelection(selectedTab);
                }
            }
        });

        this.activateTab(tab);
    }

    toggleSelection(tab: TabPanelType) {
        let index = this.selectedTabs.indexOf(tab);
        if (index < 0) {
            this.activateTab(tab);
        } else if (tab !== this.activeTab) {
            this.removeSelection(tab);
        }
    }

    addSelection(tab: TabPanelType) {
        if (this.selectedTabs.indexOf(tab) < 0) {
            this.selectTab(tab);
            this.selectedTabs.push(tab);
        }
    }

    selectTab(tab: TabPanelType) {
        tab.element.classList.add("selected");
    }

    deselectTab(tab: TabPanelType) {
        tab.element.classList.remove("selected");
    }

    removeSelection(tab: TabPanelType) {
        if (this.selectedTabs.indexOf(tab) < 0)
            return;

        this.deselectTab(tab);
        this.selectedTabs.splice(this.selectedTabs.indexOf(tab), 1);
    }

    removeSelections() {
        this.selectedTabs.forEach((selectedTab) => {
            this.deselectTab(selectedTab);
        });
        this.selectedTabs = [];
    }

    scrollTabIntoView(tab: TabPanelType) {
        let index = this.tabList.indexOf(tab);
        this.setScrollPosition((index + 1) * this.tabWidth);
    }

    activateTab(tab: TabPanelType, content?: string | null, removeSelections: boolean = false) {//TODO activateTab
        removeSelections && this.removeSelections();

        this.activeTabClicked = false;
        this.addSelection(tab);
        if (this.activeTab) {
            if (this.activeTab === tab) {
                this.activeTabClicked = true;
                return;
            }

            if (this.activeTabHistory.indexOf(this.activeTab) >= 0)
                this.activeTabHistory.splice(this.activeTabHistory.indexOf(this.activeTab), 1);

            this.activeTabHistory.push(this.activeTab);
            this.activeTab.deactivate();
        }
        tab.activate();

        this.activeTab = tab;
        this.configure();
    }

    removeTab(tab: TabPanelType) {
        if (tab === this.activeTab)
            this.activeTab = undefined;
        let index = this.tabList.indexOf(tab);
        if (index >= 0)
            this.tabList.splice(index, 1);
        tab.parent = undefined;
    }

    activatePrevious(index: number) {//TODO active tab history
        if (this.tabList.length) {
            let tab = this.tabList[index - 1] || this.tabList[this.tabList.length - 1];
            this.activateTab(tab);
        }
    }

    addTab(tab: TabPanelType, index?: number, content?: string): TabPanelType {
        if (!tab.element)
            tab.render();

        tab.parent = this;
        if (index === undefined || index === null || index >= this.tabList.length) {
            this.tabContainer.appendChild(tab.element);
            this.tabList.push(tab);
        } else {
            this.tabContainer.insertBefore(tab.element, this.tabContainer.childNodes[index]);
            this.tabList.splice(index, 0, tab);
        }

        if (tab.active)
            this.activateTab(tab, content, true);

        this.configure();
        return tab;
    }

    onMouseWheel = (e) => {
        let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

        if (Math.abs(d) > 50) {
            this.animateScroll(d);
        } else {
            this.stopScrollAnimation();
            this.setScrollPosition((this.scrollLeft || 0) + d)
        }
    };

    setScrollPosition(scrollLeft: number) {
        this.scrollLeft = scrollLeft;

        this.configure();
    }

    animateScroll(v: number) {
        this.vX = v / 80;
        this.animationSteps += 15;
        if (this.animationSteps > 15) {
            this.vX *= 1.2 * this.animationSteps / 10;
            this.animationSteps = 15 + Math.ceil((this.animationSteps - 15) * 0.75)
        }
        if (this.animationTimer) return;
        this.animationTimer = setInterval(() => {
            if (this.animationSteps-- <= 0) {
                return this.stopScrollAnimation();
            }
            let vX = this.vX;
            if (Math.abs(this.vX) < 0.01) vX = 0;
            vX = 0.9 * vX;
            let oldScrollLeft = this.scrollLeft;
            this.setScrollPosition(this.scrollLeft + 10 * vX)
            if (oldScrollLeft == this.scrollLeft)
                this.animationSteps = 0;
            this.vX = vX;
        }, 10);
    }

    stopScrollAnimation() {
        clearInterval(this.animationTimer);
        this.animationTimer = null;
        this.animationScrollLeft = null;
        this.vX = 0;
    }

    transform(el: LayoutHTMLElement, dx: number, dy: number) {
        el.style.left = Math.round(dx) + "px";
        el.dx = dx;
        el.dy = dy;
    }

    startTabDragging(element: HTMLElement, index: number) {
        if (this.isDragging)
            return;

        this.tabDraggingElement = element;
        this.draggingElementIndex = index;

        this.configure();
        this.isDragging = true;
    }

    finishTabDragging() {
        this.draggingElementIndex = undefined;
        this.tabDraggingElement = undefined;

        if (this.activeTabHistory.length) {
            let removedHistoryTabs: TabPanelType[] = [];
            for (let i = 0; i < this.activeTabHistory.length; i++) {
                if (this.tabList.indexOf(this.activeTabHistory[i]) < 0) {
                    removedHistoryTabs.push(this.activeTabHistory[i]);
                }
            }

            removedHistoryTabs.forEach((tab) => {
                let index = this.activeTabHistory.indexOf(tab);
                if (index >= 0) {
                    this.activeTabHistory.splice(index, 1);
                }
            });
        }

        this.configure();

        this.isDragging = false;
    }

    toJSON() {
        return {
            tabList: this.tabList.map(tab => tab.toJSON()),
            scrollLeft: this.scrollLeft
        };
    }

    abstract render();
    abstract configure();
}