import {Utils} from "../utils/lib";
import {Tab} from "../widgets/tabs/tab";
import {dom} from "../utils/dom";
import {TabPanel} from "../widgets/tabs/tabPanel";
import {TabPanelBar} from "../widgets/toolbars/tabPanelBar";

let event = require("ace-code/src/lib/event");

export namespace TabbarHandler {
    export let tabbarMouseDown = function (e, tabConstructor: typeof TabPanel, tabBarConstructor: typeof TabPanelBar<TabPanel>, showSplit: boolean = false) {
        let divSplit, splitPosition, pane;

        function hideSplitPosition() {
            if (!divSplit)
                return;
            divSplit.remove();
            divSplit = splitPosition = pane = null;
        }

        function showSplitPosition(e) {
            let el = e.target;
            if (tabBar) {
                hideSplitPosition();
                return;
            }

            pane = Utils.findHost(el);

            // If aml is not the pane we seek, lets abort
            if (!pane || !pane.acceptsTab || !pane.acceptsTab(tab)) {
                hideSplitPosition();
                return;
            }
            // Cannot split pane that would be removed later
            if (pane.tabBar.tabList.length === 0) {
                hideSplitPosition();
                return;
            }

            let dark = false; // !tab || tab.classList.constains("dark");
            if (!divSplit) {
                divSplit = document.createElement("div");
                document.body.appendChild(divSplit);
            }

            divSplit.className = "split-area" + (dark ? " dark" : "");

            // Find the rotated quarter that we're in
            let rect = pane.element.getBoundingClientRect();
            // TODO add getContentRect?
            // Get buttons height
            let bHeight = pane.tabBar.element.clientHeight - 1;
            rect = {
                left: rect.left,
                top: rect.top + bHeight,
                width: rect.width,
                height: rect.height - bHeight,
            };

            let left = (e.clientX - rect.left) / rect.width;
            let right = 1 - left;
            let top = (e.clientY - rect.top) / rect.height;
            let bottom = 1 - top;

            // Anchor to closes side
            let min = Math.min(left, top, right, bottom);

            if (min == left) {
                splitPosition = [true, false]; // Left
                Utils.setBox(divSplit, rect.left, rect.top, rect.width / 2, rect.height);
            } else if (min == right) {
                splitPosition = [false, false];// Right
                Utils.setBox(divSplit, rect.left + rect.width / 2, rect.top, rect.width / 2, rect.height);
            } else if (min == top) {
                splitPosition = [true, true];// Top
                Utils.setBox(divSplit, rect.left, rect.top, rect.width, rect.height / 2);
            } else if (min == bottom) {
                splitPosition = [false, true]; // Bottom
                Utils.setBox(divSplit, rect.left, rect.top + rect.height / 2, rect.width, rect.height / 2);
            }
        }


        if (e.target.classList.contains("tabCloseButton")) {//TODO not sure
            return;
        }

        let tab: Tab = Utils.findHost(e.target, tabConstructor);
        if (!tab)
            return;

        let tabBar: TabPanelBar<TabPanel> | undefined = Utils.findHost(e.target, tabBarConstructor);
        if (!tabBar)
            return;

        let isVertical = tabBar.isVertical();
        tabBar.tabMouseDown(tab, e.shiftKey, e.ctrlKey);
        if (e.shiftKey || e.ctrlKey)
            return;

        let isDragging = false;
        let posX, posY, prevX, prevY;
        let startX = e.clientX, startY = e.clientY;
        let parentRect, tabElement, index, selectedTabs, hostTabBar, hostIndex;
        let prevTab, leftMaxX, topMaxY, nextTab, rightMaxX, bottomMaxY;

        let tabDragElementSize = 0;//TODO rename these
        let tabDragElementLeft = 0;
        let tabDragElementTop = 0;

        let calculateNearbyTabsData = function () {
            if (isVertical) {
                topMaxY = prevTab && (parseInt(prevTab.style.top, 10) + parseInt(prevTab.style.height, 10) / 2 + parentRect.top);
                bottomMaxY = nextTab && (parseInt(nextTab.style.top, 10) + parseInt(nextTab.style.height, 10) / 2 + parentRect.top);
            } else {
                if (prevTab) {
                    let prevSibling = prevTab.previousSibling;
                    leftMaxX = prevSibling ? parseInt(prevSibling.style.left, 10) + parseInt(prevSibling.style.width, 10) + parentRect.left : parentRect.left;
                }

                rightMaxX = nextTab && (parseInt(nextTab.style.left, 10) + parseInt(nextTab.style.width, 10) / 2 + parentRect.left);
            }
        };

        let startDragging = function () {
            if (isDragging || !tabBar)
                return;

            tabElement = dom.buildDom(["div", {
                class: "tabDragging"
            }]);
            let activeIndex = index = tabBar.tabList.indexOf(tab);
            tabBar.tabContainer.insertBefore(tabElement, tab.element);
            tabDragElementLeft = parseInt(tab.element.style.left, 10);
            tabDragElementTop = parseInt(tab.element.style.top, 10);
            selectedTabs = [];
            let selectedTab, selectedTabElement;
            for (let i = 0; i < tabBar.selectedTabs.length; i++) {
                selectedTab = tabBar.selectedTabs[i];
                selectedTab.currentIndex = tabBar.tabList.indexOf(selectedTab);
                if (selectedTab.currentIndex < activeIndex) {
                    index--;
                    if (isVertical) {
                        tabDragElementTop -= parseInt(selectedTab.element.style.top, 10);
                    } else {
                        tabDragElementLeft -= parseInt(selectedTab.element.style.width, 10);
                    }
                }
                selectedTabs.push(selectedTab);
            }

            selectedTabs.sort(function (tab1, tab2) {
                return tab1.currentIndex - tab2.currentIndex;
            });

            for (let i = 0; i < selectedTabs.length; i++) {
                selectedTab = selectedTabs[i];
                selectedTabElement = selectedTab.element;
                tabElement.appendChild(selectedTabElement);
                selectedTabElement.style.pointerEvents = "none";
                if (isVertical) {
                    selectedTabElement.style.top = tabDragElementSize + "px";
                    tabDragElementSize += parseInt(selectedTabElement.style.height, 10);
                } else {
                    selectedTabElement.style.left = tabDragElementSize + "px";
                    tabDragElementSize += parseInt(selectedTabElement.style.width, 10);
                }

                tabBar.removeTab(selectedTab);
            }

            prevTab = tabElement.previousSibling;
            nextTab = tabElement.nextSibling;

            parentRect = tabBar.element.getBoundingClientRect();

            if (isVertical) {
                tabDragElementTop += parentRect.top;
                posY = startY - tabDragElementTop;
                posX = startX - parentRect.left;
            } else {
                tabDragElementLeft += parentRect.left;
                posX = startX - tabDragElementLeft;
                posY = startY - parentRect.top;
            }

            prevX = e.clientX;
            prevY = e.clientY;

            hostTabBar = tabBar;
            hostIndex = index;

            calculateNearbyTabsData();
            isDragging = true;

            document.body.appendChild(tabElement);
            if (isVertical) {
                Utils.setBox(tabElement, tabDragElementTop, parentRect.left, parentRect.width, tabDragElementSize);
            } else {
                Utils.setBox(tabElement, tabDragElementLeft, parentRect.top, tabDragElementSize, parentRect.height);
            }

            tabBar.startTabDragging(tabElement, index);
        };


        let finishDragging = function () {
            if (pane && pane.split && splitPosition) {
                let newPane = pane.split(...splitPosition);
                tabBar = newPane.tabBar;
            } else if (!tabBar) {
                tabBar = hostTabBar;
            }

            tabBar!.removeSelections();
            tabElement.remove();

            let selectedTab;
            for (let i = 0; i < selectedTabs.length; i++) {
                selectedTab = selectedTabs[i];
                selectedTab.element.style.pointerEvents = "";
                if (selectedTab === tab) {
                    selectedTab.active = true;
                }
                tabBar!.addTab(selectedTab, index++);
                tabBar!.addSelection(selectedTab);
            }

            if (tabBar !== hostTabBar) {
                hostTabBar.removeSelections();
                hostTabBar.activatePrevious(hostIndex);
            }

            tabBar!.finishTabDragging();

            isDragging = false;
            hideSplitPosition();
        };


        function distance(dx: number, dy: number): number {
            return dx * dx + dy * dy
        }

        let onMouseMove = function (e) {
            if (e.type !== "mousemove")
                return;

            if (!isDragging) {
                if (distance(e.clientX - startX, e.clientY - startY) < 25)
                    return;
                startDragging();
            }

            function removeTabFromBar() {
                tabBar!.finishTabDragging();
                tabBar = undefined;
            }

            if (tabBar) {
                tabBar.startTabDragging(tabElement, index);
                if ((!isVertical && (e.clientX < parentRect.left || e.clientX > parentRect.left + parentRect.width))
                    || (isVertical && (e.clientY < parentRect.top || e.clientY > parentRect.top + parentRect.height))
                ) {
                    removeTabFromBar();
                }
            } else {
                tabBar = Utils.findHost(e.target, tabBarConstructor);

                if (tabBar) {
                    isVertical = tabBar.isVertical();
                    let nextTabHost = Utils.findHost(e.target, tabConstructor);
                    if (nextTabHost) {
                        index = tabBar.tabList.indexOf(nextTabHost);
                        nextTab = nextTabHost.element;
                        prevTab = nextTab.previousSibling;
                    } else {
                        index = tabBar.tabList.length;
                        nextTab = null;
                        prevTab = tabBar.tabContainer.childNodes[index - 1];
                    }

                    tabBar.startTabDragging(tabElement, index);
                    parentRect = tabBar.element.getBoundingClientRect();
                    calculateNearbyTabsData();
                }
            }

            if (showSplit)
                showSplitPosition(e);

            let left = e.clientX - posX;
            let top = e.clientY - posY;
            let x = left;
            let y = top;

            if (tabBar) {
                if ((isVertical && (x < parentRect.left - parentRect.width || x > parentRect.left + parentRect.width)) ||
                    (!isVertical && (y < parentRect.top - parentRect.height || y > parentRect.top + parentRect.height))) {
                    removeTabFromBar();
                } else {
                    if (isVertical) {
                        x = parentRect.left;
                    } else {
                        y = parentRect.top;
                    }

                    if ((isVertical && e.clientY < prevY && topMaxY && top < topMaxY) ||
                        (!isVertical && e.clientX < prevX && leftMaxX && left < leftMaxX)) {
                        if (isVertical) {
                            prevTab.style.top = (parseInt(prevTab.style.top, 10) + tabDragElementSize) + "px";
                        } else {
                            prevTab.style.left = (parseInt(prevTab.style.left, 10) + tabDragElementSize) + "px";
                        }
                        index--;
                        [prevTab, nextTab] = [prevTab.previousSibling, prevTab];
                        calculateNearbyTabsData();
                    } else if ((isVertical && e.clientY > prevY && bottomMaxY && top + tabDragElementSize > bottomMaxY) ||
                        (!isVertical && e.clientX > prevX && rightMaxX && left + tabDragElementSize > rightMaxX)) {
                        if (isVertical) {
                            nextTab.style.top = (parseInt(nextTab.style.top, 10) - tabDragElementSize) + "px";
                        } else {
                            nextTab.style.left = (parseInt(nextTab.style.left, 10) - tabDragElementSize) + "px";
                        }
                        index++;
                        [prevTab, nextTab] = [nextTab, nextTab.nextSibling];
                        calculateNearbyTabsData();
                    }
                }
            }

            prevX = e.clientX;
            prevY = e.clientY;
            tabElement.style.left = x + "px";
            tabElement.style.top = y + "px";
        };
        let onMouseUp = function (e) {
            if (!isDragging) {
                if (tabBar!.selectedTabs.length > 1) {
                    tabBar!.removeSelections();
                    tabBar!.addSelection(tab);
                }
            } else {
                finishDragging();
            }
        };

        event.capture(window, onMouseMove, onMouseUp);
        return e.preventDefault();
    };
}

window.addEventListener("mousedown", function() {
    document.body.classList.add("disableIframe");
}, true);
window.addEventListener("mouseup", function() {
    document.body.classList.remove("disableIframe");
}, true);