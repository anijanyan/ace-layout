import {TabbarHandler} from "../../mouse/tabbar_handler";
import {Utils} from "../../lib";
import {
    LayoutEditor,
    LayoutEditSession,
    LayoutHTMLElement,
    TabOptions,
    ToolBar,
    Widget
} from "../widget";
import {TabManager} from "./tabManager";
import {dom} from "../../utils/dom";
import type {Pane} from "../boxes/pane";


dom.importCssString(require("text-loader!../../../styles/tab.css"), "tab.css");

function parseJson(name) {
    try {
        let data = localStorage[name];
        return data && JSON.parse(data);
    } catch (e) {
        return null;
    }
}

export class Tab implements Widget {
    session: LayoutEditSession;
    contextMenu = "tabs";
    active: boolean;
    tabIcon: string;
    title: string;
    path: string;
    preview: boolean;
    element: LayoutHTMLElement;
    parent: TabBar;
    $caption: string;
    $icon: string;
    autohide: boolean;
    editorType: string;

    constructor(options: TabOptions) {
        this.active = options.active;
        this.tabIcon = options.tabIcon;
        this.title = options.title;
        this.path = options.path;
        this.preview = options.preview;
    }

    toJSON(): Object {
        return {
            title: this.title || undefined,
            tabIcon: this.tabIcon || undefined,
            active: this.active || undefined,
            path: this.path || undefined,
            preview: this.preview || undefined,
        };
    }

    activate(content?: string) {
        this.active = true;
        this.element.classList.add("active");

        let tabManager = TabManager.getInstance();
        tabManager.activePane = this.parent.parent;

        tabManager.loadFile(this, content);
        tabManager.activePane.resize();
    }

    deactivate() {
        this.active = false;
        this.element.classList.remove("active");
        TabManager.getInstance().deactivateTab(this);
    }

    remove() {
        if (this.parent) this.parent.closeTab(this);
    }

    set caption(value) {
        this.$caption = value
    }

    get caption() {
        return this.$caption
    }

    set icon(value) {
        this.$icon = value
    }

    get icon() {
        return this.$icon
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
        ], null, this);

        if (this.preview)
            this.element.style.fontStyle = "italic"

        this.element.$host = this;
        return this.element;
    }

    update() {
    }

    get editor(): LayoutEditor {
        if (this.parent.activeTab == this)
            return this.parent.parent.editor
    }

    //TODO: move to separate class
    loadMetadata() {
        var path = this.path;
        var session = this.session;
        var metadata = parseJson("@file@" + path)
        if (!metadata) return;
        try {
            if (typeof metadata.value == "string" && metadata.value != session.getValue()) {
                session.doc.setValue(metadata.value);
            }
            if (metadata.selection) {
                session.selection.fromJSON(metadata.selection);
            }
            if (metadata.scroll) {
                session.setScrollLeft(metadata.scroll[0]);
                session.setScrollTop(metadata.scroll[1]);
            }

        } catch (e) {
            console.error(e)
        }
    }

    saveMetadata() {
        if (!this.path || !this.session) return;

        var session = this.session
        var undoManager = this.session.getUndoManager();
        localStorage["@file@" + this.path] = JSON.stringify({
            selection: session.selection.toJSON(),
            //@ts-ignore
            undoManager: undoManager.toJSON(),
            value: session.getValue(),
            scroll: [
                session.getScrollLeft(),
                session.getScrollTop()
            ],
        });
    }

}

export class TabBar implements Widget, ToolBar {
    activeTab: Tab = null;
    selectedTabs = [];
    box = [];
    inverted = true;
    buttonsWidth = 0;
    activeTabHistory = [];
    tabList: Array<Tab> = [];
    tabContainer: HTMLElement;
    tabPlusButton: HTMLElement;
    freeze: boolean;
    //TODO: enum
    direction: string;
    initTabList: Tab[];
    element: LayoutHTMLElement;
    width: any;
    anchorTab: any;
    tabWidth: number;
    activeTabClicked: boolean;
    parent: Pane;
    vX: number;
    animationTimer: any;
    animationScrollLeft: any;
    draggingElementSize: any;
    plusButtonWidth: number;
    containerWidth: number;
    buttons: LayoutHTMLElement;
    isDragging: boolean;
    tabDraggingElement: HTMLElement;
    draggingElementIndex: number;
    size: number;

    constructor(options) {
        this.direction = options.direction || "";
        this.size = options.size || 27;//TODO
        this.initTabList = options.tabList ?? [];

        this.onMouseWheel = this.onMouseWheel.bind(this);
        this.onTabClick = this.onTabClick.bind(this);
        this.onTabMouseUp = this.onTabMouseUp.bind(this);
        this.onTabMouseDown = this.onTabMouseDown.bind(this);
        this.onTabPlusClick = this.onTabPlusClick.bind(this);
    }

    setBox(x, y, w, h) {
        Utils.setBox(this.element, x, y, w, h);
        this.box = [x, y, w, h];
        this.width = w;
        this.configurate();
    }

    render() {
        if (!this.element) {
            this.renderElement();
        }

        return this.element
    }

    isVertical() {
        return this.direction === "vertical";
    }

    tabMouseDown(tab: Tab, expand = false, toggle = false) {
        if (expand) {
            this.expandSelection(tab, toggle);
        } else {
            this.anchorTab = null;
            if (toggle) {
                this.toggleSelection(tab);
            } else {
                if (this.selectedTabs.indexOf(tab) < 0) {
                    this.removeSelections();
                }
                this.activateTab(tab);
            }
        }
    }

    expandSelection(tab: Tab, toggle = false) {
        if (!this.anchorTab) {
            this.anchorTab = this.activeTab;
        }
        var prevSelectedTabs = this.selectedTabs;
        this.selectedTabs = [];
        var start = this.tabList.indexOf(this.anchorTab);
        var end = this.tabList.indexOf(tab);
        if (end < start) {
            [start, end] = [end, start];
        }
        var selectedTab;
        for (var i = start; i <= end; i++) {
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

    toggleSelection(tab: Tab) {
        var index = this.selectedTabs.indexOf(tab);
        if (index < 0) {
            this.activateTab(tab);
        } else if (tab !== this.activeTab) {
            this.removeSelection(tab);
        }
    }

    addSelection(tab: Tab) {
        if (this.selectedTabs.indexOf(tab) < 0) {
            this.selectTab(tab);
            this.selectedTabs.push(tab);
        }
    }

    selectTab(tab: Tab) {
        tab.element.classList.add("selected");
    }

    deselectTab(tab: Tab) {
        tab.element.classList.remove("selected");
    }

    removeSelection(tab: Tab) {
        if (this.selectedTabs.indexOf(tab) < 0) {
            return;
        }
        this.deselectTab(tab);
        this.selectedTabs.splice(this.selectedTabs.indexOf(tab), 1);
    }

    removeSelections() {
        this.selectedTabs.forEach((selectedTab) => {
            this.deselectTab(selectedTab);
        });
        this.selectedTabs = [];
    }

    scrollTabIntoView(tab: Tab) {
        var index = this.tabList.indexOf(tab);
        this.setScrollPosition((index + 1) * this.tabWidth);
    }

    activateTab(tab: Tab, content?: string) {
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
        this.activeTab = tab;
        tab.activate(content);
        this.configurate();
    }

    removeTab(tab: Tab) {
        if (tab === this.activeTab)
            this.activeTab = null;
        var index = this.tabList.indexOf(tab);
        if (index >= 0)
            this.tabList.splice(index, 1);
        tab.parent = null;
    }

    activatePrevious(index: number) {//TODO active tab history
        if (this.tabList.length) {
            var tab = this.tabList[index - 1] || this.tabList[this.tabList.length - 1];
            this.activateTab(tab);
        } else if (this.parent) {
            this.parent.remove();
        }
    }

    closeTab(tab: Tab) {
        var index = this.tabList.indexOf(tab);
        TabManager.getInstance().deactivateTab(tab);
        var isActiveTab = this.activeTab === tab;
        var isAnchorTab = this.anchorTab === tab;
        this.removeTab(tab);
        this.removeSelection(tab);
        if (isActiveTab) {
            this.activeTab = null;
            this.activatePrevious(index);
        }
        if (isAnchorTab) {
            this.anchorTab = null;
        }

        if (tab.element)
            tab.element.remove();

        this.configurate();
    }

    addTabList(tabList: TabOptions[], index: number) {
        index = index || this.tabList.length;
        var tab;
        for (var i = 0; i < tabList.length; i++) {
            tab = new Tab(tabList[i]);
            this.addTab(tab, index++);
        }
    }

    addTab(tab: Tab, index?: number, content?: string): Tab {
        if (!tab.element) {
            tab.render();
        }
        tab.parent = this;
        if (index === undefined || index === null || index >= this.tabList.length) {
            this.tabContainer.appendChild(tab.element);
            this.tabList.push(tab);
        } else {
            this.tabContainer.insertBefore(tab.element, this.tabContainer.childNodes[index]);
            this.tabList.splice(index, 0, tab);
        }

        if (tab.active) {
            this.activateTab(tab, content);
        }

        this.configurate();
        return tab;
    }

    scrollLeft = 0;
    onMouseWheel = (e) => {
        var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

        if (Math.abs(d) > 50) {
            this.animateScroll(d);
        } else {
            this.stopScrollAnmation();
            this.setScrollPosition((this.scrollLeft || 0) + d)
        }
    };

    setScrollPosition(scrollLeft: number) {
        this.scrollLeft = scrollLeft;

        this.configurate();
    }

    animationSteps = 0;

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
                return this.stopScrollAnmation();
            }
            var vX = this.vX;
            if (Math.abs(this.vX) < 0.01) vX = 0;
            vX = 0.9 * vX;
            var oldScrollTop = this.scrollLeft;
            this.setScrollPosition(this.scrollLeft + 10 * vX)
            if (oldScrollTop == this.scrollLeft)
                this.animationSteps = 0;
            this.vX = vX;
        }, 10);
    }

    stopScrollAnmation() {
        clearInterval(this.animationTimer);
        this.animationTimer = null;
        this.animationScrollLeft = null;
        this.vX = 0;
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
            ["span", {class: "extraTabButtons"}],

        ], null, this);

        if (this.initTabList && this.initTabList.length) {
            for (var i = 0; i < this.initTabList.length; i++) {
                this.addTab(this.initTabList[i]);
            }
        }
    }

    transform(el: LayoutHTMLElement, dx: number, dy: number) {
        el.style.left = Math.round(dx) + "px";
        el.dx = dx;
        el.dy = dy;
    }

    MIN_TAB_SIZE = 120;
    MAX_TAB_SIZE = 150;

    computeConfig() {
        this.draggingElementSize = this.draggingElementSize || 0;
        this.plusButtonWidth = this.tabPlusButton.getBoundingClientRect().width;
        this.containerWidth = this.width - this.plusButtonWidth - this.buttonsWidth;
        var tabsCount = this.tabList.length;
        if (tabsCount * this.MAX_TAB_SIZE + this.draggingElementSize < this.containerWidth) {
            this.tabWidth = this.MAX_TAB_SIZE;
            this.containerWidth = tabsCount * this.tabWidth + this.draggingElementSize;
        } else if (tabsCount * this.MIN_TAB_SIZE + this.draggingElementSize < this.containerWidth) {
            this.tabWidth = (this.containerWidth - this.draggingElementSize) / tabsCount;
        } else {
            this.tabWidth = this.MIN_TAB_SIZE;
        }
        var tabsWidth = this.tabWidth * tabsCount + this.draggingElementSize;

        this.scrollLeft = Math.min(Math.max(this.scrollLeft, 0), tabsWidth - this.containerWidth);
    }

    configurate() {
        if (!this.width || this.freeze)
            return;

        var shadowWidth = 4;

        this.computeConfig();
        this.tabContainer.style.width = this.containerWidth + "px";

        if (this.inverted) {
            var zIndex = this.tabList.length;
            var min = shadowWidth - this.tabWidth;
            var max = this.containerWidth;
            var maxPos = (max - this.tabWidth) / 2;
            for (var i = 0; i < this.tabList.length; i++) {
                var tab = this.tabList[i];
                var el = tab.element;
                var pos = this.tabWidth * i - this.scrollLeft;
                if (this.tabDraggingElement && i >= this.draggingElementIndex) {
                    pos += this.draggingElementSize;
                }
                if (tab === this.activeTab) {
                    var activeMin = Math.max(min + this.tabWidth * 0.25, -this.tabWidth * 0.75);
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
            var lastRendered = i;
            zIndex = this.tabList.length;
            for (var i = this.tabList.length - 1; i >= lastRendered; i--) {
                var tab = this.tabList[i];
                var el = tab.element;
                var pos = this.tabWidth * i - this.scrollLeft;
                if (this.tabDraggingElement && i >= this.draggingElementIndex) {
                    pos += this.draggingElementSize;
                }
                if (tab === this.activeTab) {
                    var activeMax = Math.min(max - this.tabWidth * 0.25, this.containerWidth - this.tabWidth * 0.25);
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
            /*var min = 0;
            var max = containerWidth - w;
            var zIndex = 0
            var zdir = 1
            for (var i = 0; i < this.tabs.length; i++){
                var tab = this.tabs[i];
                var el = tab.element
                var pos = -this.scrollPos + w * i
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
            var lastRendered = i
            var zIndex = 0
            var zdir = 1
            for (var i = this.tabs.length - 1; i >= lastRendered; i--){
                var tab = this.tabs[i];
                var el = tab.element
                var pos = -this.scrollPos + w * i
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

    addButtons(buttons?: LayoutHTMLElement) {
        if (!buttons) {
            return;
        }
        this.buttons = buttons;
        this.element.appendChild(this.buttons);
        var rect = this.buttons.getBoundingClientRect();
        this.buttonsWidth = rect.width;
        this.configurate();
    }

    removeButtons() {
        this.buttons = null;
        this.buttonsWidth = 0;
        this.configurate();
    }

    startTabDragging(element: HTMLElement, index: number) {
        if (this.isDragging) {
            return;
        }

        this.tabDraggingElement = element;
        this.draggingElementSize = this.isVertical() ? this.tabDraggingElement.style.height : this.tabDraggingElement.style.width;
        this.draggingElementSize = parseInt(this.draggingElementSize, 10);
        this.draggingElementIndex = index;

        this.configurate();
        this.isDragging = true;
    }

    finishTabDragging() {
        this.draggingElementSize = this.draggingElementIndex = this.tabDraggingElement = null;

        if (this.activeTabHistory.length) {
            var removedHistoryTabs = [];
            for (var i = 0; i < this.activeTabHistory.length; i++) {
                if (this.tabList.indexOf(this.activeTabHistory[i]) < 0) {
                    removedHistoryTabs.push(this.activeTabHistory[i]);
                }
            }

            removedHistoryTabs.forEach((tab) => {
                var index = this.activeTabHistory.indexOf(tab);
                if (index >= 0) {
                    this.activeTabHistory.splice(index, 1);
                }
            });
        }

        this.configurate();

        this.isDragging = false;
    }

    toJSON() {
        return {
            tabList: this.tabList.map(tab => tab.toJSON()),
            scrollLeft: this.scrollLeft
        };
    }

    //events
    onTabClick(e) {
        var target = e.target;
        var tab = Utils.findHost(target, Tab);
        if (tab) {
            if (e.button == 0 && target.classList.contains("tabCloseButton")) {
                this.closeTab(tab);
            } else if (e.button == 0 && tab.editor) {
                tab.editor.focus();
            } else if (e.button == 1) {
                tab.remove();
            }
        }
    }

    onTabMouseUp(e) {
        if (e.button == 1) {
            var tab = Utils.findHost(e.target, Tab);
            if (tab)
                tab.remove();
        }
    }

    onTabMouseDown(e) {
        if (e.button == 0)
            TabbarHandler.tabbarMouseDown(e, Tab, TabBar, true)
    }

    /*onMouseMove(e) {
        if (e.button == 0)
            TabbarHandler.tabbarMouseMove(e, Tab, TabBar)
    }
    onMouseMove = this.onMouseMove.bind(this)

    onMouseOut(e) {
        if (e.button == 0)
            TabbarHandler.tabbarMouseOut(e, Tab, TabBar)
    }
    onMouseOut = this.onMouseOut.bind(this)*/

    onTabPlusClick(e) {
        this.removeSelections();
        TabManager.getInstance().addNewTab(this.parent);
    }

    remove() {
    }
}
