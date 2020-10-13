define(function(require, exports, module) {
    var event = require("ace/lib/event");
    var dom = require("ace/lib/dom");
    var lib = require("layout/lib");

    var tabbarMouseDown = function(e, tabConstructor, tabBarConstructor, showSplit) {
        var divSplit, splitPosition, pane;
        function hideSplitPosition(e) {
            divSplit && divSplit.remove();
            divSplit = splitPosition = pane = null;
        }

            function showSplitPosition(e) {
                var el = e.target;
                if (tabBar) {
                    if (divSplit) hideSplitPosition();
                    return;
                }

                pane = lib.findHost(el);

                // If aml is not the pane we seek, lets abort
                if (!pane || !pane.acceptsTab || !pane.acceptsTab(tab)) {
                    if (divSplit) hideSplitPosition();
                    return;
                }
                // Cannot split pane that would be removed later
                if (pane.tabBar.tabList.length === 0) {
                    if (divSplit) hideSplitPosition();
                    return;
                }

                var dark = false; // !tab || tab.classList.constains("dark");
                if (!divSplit) {
                    divSplit = document.createElement("div");
                    document.body.appendChild(divSplit);
                }

                divSplit.className = "split-area" + (dark ? " dark" : "");

                // Find the rotated quarter that we're in
                var rect = pane.element.getBoundingClientRect();
                // TODO add getContentRect?
                // Get buttons height
                var bHeight = pane.tabBar.element.clientHeight - 1;
                rect = {
                    left: rect.left,
                    top: rect.top + bHeight,
                    width: rect.width,
                    height: rect.height - bHeight,
                };

                var left = (e.clientX - rect.left) / rect.width;
                var right = 1 - left;
                var top = (e.clientY - rect.top) / rect.height;
                var bottom = 1 - top;

                // Anchor to closes side
                var min = Math.min(left, top, right, bottom);

                if (min == left) {
                    splitPosition = [true, false]; // Left
                    lib.setBox(divSplit, rect.left, rect.top, rect.width / 2, rect.height);
                } else if (min == right) {
                    splitPosition = [false, false];// Right
                    lib.setBox(divSplit, rect.left + rect.width / 2, rect.top, rect.width / 2, rect.height);
                } else if (min == top) {
                    splitPosition = [true, true];// Top
                    lib.setBox(divSplit, rect.left, rect.top, rect.width, rect.height/ 2);
                } else if (min == bottom) {
                    splitPosition = [false, true]; // Bottom
                    lib.setBox(divSplit, rect.left, rect.top+ rect.height / 2, rect.width, rect.height / 2);
                }
            }



        if (e.target.classList.contains("tabCloseButton")) {//TODO not sure
            return
        }

        var tab = lib.findHost(e.target, tabConstructor);
        if (!tab)
            return;

        var tabBar = lib.findHost(e.target, tabBarConstructor);
        var isVertical = tabBar.isVertical();
        tabBar.tabMouseDown(tab, e.shiftKey, e.ctrlKey);
        if (e.shiftKey || e.ctrlKey) {
            return;
        }

        var isDragging = false;
        var posX, posY, prevX, prevY;
        var startX = e.clientX, startY = e.clientY;
        var parentRect, tabElement, index, selectedTabs, hostTabBar, hostIndex;
        var prevTab, leftMaxX, topMaxY, nextTab, rightMaxX, bottomMaxY;

        var tabDragElementSize = 0;//TODO rename these
        var tabDragElementLeft = 0;
        var tabDragElementTop = 0;

        var calculateNearbyTabsData = function () {
            if (isVertical) {
                topMaxY = prevTab && (parseInt(prevTab.style.top, 10) + parseInt(prevTab.style.height, 10) / 2 + parentRect.top);
                bottomMaxY = nextTab && (parseInt(nextTab.style.top, 10) + parseInt(nextTab.style.height, 10) / 2 + parentRect.top);
            } else {
                leftMaxX = prevTab && (parseInt(prevTab.style.left, 10) + parseInt(prevTab.style.width, 10) / 2 + parentRect.left);
                rightMaxX = nextTab && (parseInt(nextTab.style.left, 10) + parseInt(nextTab.style.width, 10) / 2 + parentRect.left);
            }
        };

        var startDragging = function() {
            if (isDragging) {
                return;
            }

            tabElement = dom.buildDom(["div", {
                class: "tabDragging"
            }]);
            var activeIndex = index = tabBar.tabList.indexOf(tab);
            tabBar.tabContainer.insertBefore(tabElement, tab.element);
            tabDragElementLeft = parseInt(tab.element.style.left, 10);
            tabDragElementTop = parseInt(tab.element.style.top, 10);
            selectedTabs = [];
            var selectedTab, selectedTabElement;
            for (var i = 0; i < tabBar.selectedTabs.length; i++) {
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

            for (var i = 0; i < selectedTabs.length; i++) {
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
                lib.setBox(tabElement, tabDragElementTop, parentRect.left, parentRect.width, tabDragElementSize);
            } else {
                lib.setBox(tabElement, tabDragElementLeft, parentRect.top, tabDragElementSize, parentRect.height);
            }

            tabBar.startTabDragging(tabElement, index);
        };


        var finishDragging = function() {
            if (pane && pane.split && splitPosition) {
                var newPane = pane.split(...splitPosition);
                tabBar = newPane.tabBar;
            } else if (!tabBar) {
                tabBar = hostTabBar;
            }

            tabBar.removeSelections();
            tabElement.remove();

            if (tabBar !== hostTabBar) {
                hostTabBar.removeSelections();
                hostTabBar.activatePrevious(hostIndex);
            }

            var selectedTab;
            for (var i = 0; i < selectedTabs.length; i++) {
                selectedTab = selectedTabs[i];
                selectedTab.element.style.pointerEvents = "";
                if (selectedTab === tab) {
                    selectedTab.active = true;
                }
                tabBar.addTab(selectedTab, index++);
                tabBar.addSelection(selectedTab);
            }

            tabBar.finishTabDragging();

            isDragging = false;
            hideSplitPosition(e);
        };


        function distance(dx, dy) {
            return dx * dx + dy * dy
        }

        var onMouseMove = function(e) {
            if (e.type !== "mousemove") {
                return;
            }
            if (!isDragging) {
                if (distance(e.clientX - startX, e.clientY - startY) < 25)
                    return;
                startDragging();
            }

            function removeTabFromBar() {
                tabBar.finishTabDragging();
                tabBar = null;
            }

            if (tabBar) {
                tabBar.startTabDragging(tabElement, index);
                if ((!isVertical && (e.clientX < parentRect.left || e.clientX > parentRect.left + parentRect.width))
                    || (isVertical && (e.clientY < parentRect.top || e.clientY > parentRect.top + parentRect.height))
                ) {
                    removeTabFromBar();
                }
            } else {
                tabBar = lib.findHost(e.target, tabBarConstructor);

                if (tabBar) {
                    isVertical = tabBar.isVertical();
                    var nextTabHost = lib.findHost(e.target, tabConstructor);
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

            if (showSplit) {
                showSplitPosition(e);
            }

            var left = e.clientX - posX;
            var top = e.clientY - posY;
            var x = left;
            var y = top;

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
        var onMouseUp = function(e) {
            if (!isDragging) {
                if (tabBar.selectedTabs.length > 1) {
                    tabBar.removeSelections();
                    tabBar.addSelection(tab);
                }
            } else {
                finishDragging();
            }
        };

        event.capture(window, onMouseMove, onMouseUp);
        return e.preventDefault();
    };


    exports.tabbarMouseDown = tabbarMouseDown;
});
