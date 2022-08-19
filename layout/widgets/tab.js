define(function(require, exports, module) {
var dom = require("ace/lib/dom");
var lib = require("layout/lib");
dom.importCssString(require("ace/requirejs/text!layout/styles/tab.css"), "tab.css");
dom.importCssString(require("ace/requirejs/text!layout/styles/panel.css"), "panel.css");

/**
 * @type {Tab}
 * @implements {Widget}
 */
class Tab {
    /**
     * @type {String|Ace.EditSession}
     */
    session;

    /**
     *
     * @param {Object} options
     * @param {Boolean} options.active
     * @param {String} options.tabIcon
     * @param {String} options.tabTitle
     * @param {String} options.path
     * @param {String} options.preview
     */
    constructor(options) {
        this.active = options.active;
        this.tabIcon = options.tabIcon;
        this.tabTitle = options.tabTitle;
        this.path = options.path;
        this.preview = options.preview;
    }

    toJSON() {
        return {
            tabTitle: this.tabTitle || undefined,
            tabIcon: this.tabIcon || undefined,
            active: this.active || undefined,
            path: this.path || undefined,
            preview: this.preview || undefined,
        };
    }

    activate() {
        this.active = true;
        this.element.classList.add("active");
        tabManager.activateTab(this);
    }

    deactivate() {
        this.active = false;
        this.element.classList.remove("active");
        tabManager.deactivateTab(this);
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
            ["span", { class: "tabIcon" }, this.tabIcon],
            ["span", { class: "tabTitle", ref: "$title" }, this.tabTitle],
            ["span", { class: "tabCloseButton" }],
        ], null, this);

        if (this.preview)
            this.element.style.fontStyle =  "italic"

        this.element.$host = this;
        return this.element;
    }

    update() {
    }

    get editor() {
        if (this.parent.activeTab == this)
            return this.parent.parent.editor
    }
}

var {tabbarMouseDown} = require("../mouse/tabbar_handler");

/**
 * @type {TabBar}
 * @implements {Widget}
 */
class TabBar {
    /**
     *
     * @type {Tab|undefined}
     */
    activeTab = null;
    selectedTabs = [];
    box = [];
    inverted = true;
    buttonsWidth = 0;
    activeTabHistory = [];
    tabList = [];
    tabContainer;
    tabPlusButton;
    freeze;

    /**
     *
     * @param {Object} options
     * @param {String|undefined} options.direction
     * @param {Tab[]} options.tabList
     */
    constructor(options) {
        this.direction = options.direction || "";
        this.initTabList = options.tabList;
    }

    setBox(x, y, w, h) {
        lib.setBox(this.element, x, y, w, h);
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

    tabMouseDown(tab, expand, toggle) {
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

    expandSelection(tab, toggle) {
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

    toggleSelection(tab) {
        var index = this.selectedTabs.indexOf(tab);
        if (index < 0) {
            this.activateTab(tab);
        } else if (tab !== this.activeTab) {
            this.removeSelection(tab);
        }
    }

    addSelection(tab) {
        if (this.selectedTabs.indexOf(tab) < 0) {
            this.selectTab(tab);
            this.selectedTabs.push(tab);
        }
    }

    selectTab(tab) {
        tab.element.classList.add("selected");
    }

    deselectTab(tab) {
        tab.element.classList.remove("selected");
    }

    removeSelection(tab) {
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

    scrollTabIntoView(tab) {
        var index = this.tabList.indexOf(tab);
        this.setScrollPosition((index + 1) * this.tabWidth);
    }

    activateTab(tab) {
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
        tab.activate();
        this.configurate();
    }

    removeTab(tab) {
        if (tab === this.activeTab)
            this.activeTab = null;
        var index = this.tabList.indexOf(tab);
        if (index >= 0)
            this.tabList.splice(index, 1);
        tab.parent = null;
    }

    activatePrevious(index) {//TODO active tab history
        if (this.tabList.length) {
            var tab = this.tabList[index - 1] || this.tabList[this.tabList.length - 1];
            this.activateTab(tab);
        } else if (this.parent) {
            this.parent.remove();
        }
    }

    closeTab(tab) {
        var index = this.tabList.indexOf(tab);
        tabManager.deactivateTab(tab);
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

    addTabList(tabList, index) {
        index = index || this.tabList.length;
        var tab;
        for (var i = 0; i < tabList.length; i++) {
            tab = new Tab(tabList[i]);
            this.addTab(tab, index++);
        }
    }

    addTab(tab, index) {
        if (!(tab instanceof Tab) && !(tab instanceof Panel)) {//TODO
            tab = new Tab(tab);
        }
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
            this.activateTab(tab);
        }

        this.configurate();
        return tab;
    }

    scrollLeft = 0;
    onMouseWheel = function(e) {
        var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

        if (Math.abs(d) > 50) {
            this.animateScroll(d);
        } else {
            this.stopScrollAnmation();
            this.setScrollPosition((this.scrollLeft || 0) + d)
        }
    };
    onMouseWheel = this.onMouseWheel.bind(this);

    setScrollPosition(scrollLeft) {
        this.scrollLeft = scrollLeft;
        
        this.configurate();
    }

    animationSteps = 0;

    animateScroll(v) {
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
            ["span", { class: "tabMenuButton"}],
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

    transform(el, dx, dy) {
        el.style.left = Math.round(dx) + "px";
        el.dx = dx;
        el.dy = dy;
    }

    MIN_TAB_SIZE = 120;
    MAX_TAB_SIZE = 150;

    computeConfig () {
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
            for (var i = 0; i < this.tabList.length; i++){
                var tab = this.tabList[i];
                var el = tab.element;
                var pos = this.tabWidth * i - this.scrollLeft;
                if (this.tabDraggingElement && i >= this.draggingElementIndex) {
                    pos += this.draggingElementSize;
                }
                if (tab === this.activeTab) {
                    var activeMin = Math.max(min + this.tabWidth * 0.25, - this.tabWidth * 0.75);
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
                el.style.zIndex = zIndex;
                zIndex--;

                this.transform(el, pos, 0);
            }
            var lastRendered = i;
            zIndex = this.tabList.length;
            for (var i = this.tabList.length - 1; i >= lastRendered; i--){
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
                el.style.zIndex = zIndex;
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

    addButtons(buttons) {
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

    startTabDragging(element, index) {
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
        var tab = lib.findHost(target, Tab);
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
    onTabClick = this.onTabClick.bind(this);

    onTabMouseUp(e) {
        if (e.button == 1) {
            var tab = lib.findHost(e.target, Tab);
            if (tab)
                tab.remove();
        }
    }
    onTabMouseUp = this.onTabMouseUp.bind(this);

    onTabMouseDown(e) {
        if (e.button == 0)
            tabbarMouseDown(e, Tab, TabBar, true)
    }
    onTabMouseDown = this.onTabMouseDown.bind(this)

    onTabPlusClick(e) {
        this.removeSelections();
        tabManager.addNewTab(this.parent);
    }
    onTabPlusClick = this.onTabPlusClick.bind(this);
}

/**
 * @type {Panel}
 * @implements {Widget}
 */
class Panel {
    /**
     *
     * @param {Object} options
     * @param {Boolean|undefined} options.active
     * @param {String} options.location
     * @param {String} options.panelTitle
     * @param {Accordion|Box} options.panelBody
     * @param {Boolean|undefined} options.autohide
     */
    constructor(options) {
        this.active = options.active;
        this.location = options.location;
        this.panelTitle = options.panelTitle;
        this.panelBody = options.panelBody;
        this.autohide = options.autohide;
    }

    activate() {
        this.active = true;
        this.element.classList.add("active");
        panelManager.activatePanel(this);
    }

    deactivate(autohide) {
        this.active = false;
        this.element.classList.remove("active");
        panelManager.deactivatePanel(this, autohide);
    }

    render() {
        this.element = dom.buildDom(["div", {
            class: "panelButton" + (this.active ? " active" : ""),
        }, ["span", {
            class: "panelTitle"
        }, this.panelTitle]]);

        this.element.$host = this;
        return this.element;
    }

    toJSON() {
        return {
            active: this.active || undefined,
            panelTitle: this.panelTitle,
            autohide: this.autohide,
            panelBody: this.panelBody.toJSON(),
        };
    }
}

/**
 * @type {PanelBar}
 * @implements {Widget}
 */
class PanelBar extends TabBar {
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
        lib.setBox(this.element, x, y, w, h);
        this.box = [x, y, w, h];
        this.configurate();
    }

    configurate() {
        var tabElement;
        var isVertical = this.isVertical();
        var tabSize = 30;//TODO
        var position = 0;
        for (var i = 0; i < this.tabList.length; i++){
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
                    tabbarMouseDown(e, Panel, PanelBar)
                },
            }, ["div", {
                class: "tabContainer",
                ref: "tabContainer",
                onclick: this.onTabClick,
                onmousedown: function (e) {
                    tabbarMouseDown(e, Tab, TabBar)
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

    addTabList(tabList, index) {
        index = index || this.tabList.length;
        var tab;
        for (var i = 0; i < tabList.length; i++) {
            tab = new Panel(tabList[i]);
            this.addTab(tab, index++);
        }
    }
}

exports.Tab = Tab;
exports.TabBar = TabBar;
exports.Panel = Panel;
exports.PanelBar = PanelBar;
});