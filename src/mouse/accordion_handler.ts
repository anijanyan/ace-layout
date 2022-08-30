import {Box} from "../widgets/box";
import {Utils} from "../lib";

var event = require("ace-code/src/lib/event");

export namespace AccordionHandler {
    export var toggleBarMouseDown = function (e, accordionConstructor) {
        var toggleBlock = Utils.findNode(e.target, "toggle-block");
        if (!toggleBlock)
            return;

        var accordionBox, accordionBoxRect, toggleBlockDragging, toggleBlockRect;
        var startIndex, changeIndex, previousIndex;
        var toggleBar, box, splitter;

        var startX = e.clientX, startY = e.clientY;
        var isDragging = false;
        var posX, posY, prevY, prevX;

        var prevBlock, topMaxY, nextBlock, bottomMaxY;

        function distance(dx, dy) {
            return dx * dx + dy * dy
        }

        function calculateNearbyBlocksData() {
            prevBlock = accordionBox.toggleBlockList[changeIndex - 1] || null;
            nextBlock = accordionBox.toggleBlockList[changeIndex + 1] || null;
            topMaxY = prevBlock && (parseInt(prevBlock.style.top, 10) + parseInt(prevBlock.style.height, 10) / 2 + accordionBoxRect.top);
            bottomMaxY = nextBlock && (parseInt(nextBlock.style.top, 10) + parseInt(nextBlock.style.height, 10) / 2 + accordionBoxRect.top);
        }

        function startDragging() {
            if (isDragging)
                return;

            accordionBox = Utils.findHost(toggleBlock, accordionConstructor);
            accordionBoxRect = accordionBox.element.getBoundingClientRect();
            startIndex = changeIndex = previousIndex = toggleBlock.$index;

            toggleBlockRect = toggleBlock.getBoundingClientRect();
            toggleBlockDragging = toggleBlock.cloneNode(true);
            toggleBlockDragging.$hostAccordionBox = accordionBox;
            toggleBlockDragging.$hostIndex = startIndex;
            toggleBlockDragging.classList.add("toggleBlockDragging");

            Utils.setBox(toggleBlockDragging, toggleBlockRect.left, toggleBlockRect.top, toggleBlockRect.width, toggleBlockRect.height);
            posX = startX - toggleBlockRect.left;
            posY = startY - toggleBlockRect.top;
            document.body.appendChild(toggleBlockDragging);

            toggleBlock.style.opacity = 0;
            calculateNearbyBlocksData();

            isDragging = true;
        }

        function recalculateIndexes(arr) {
            for (var i = 0; i < arr.length; i++) {
                arr[i].$index = i;
            }
        }

        function accordionDataChanged() {
            recalculateIndexes(accordionBox.boxList);
            recalculateIndexes(accordionBox.toggleBarList);
            recalculateIndexes(accordionBox.toggleBlockList);
            recalculateIndexes(accordionBox.splitterList);

            accordionBox.resize();
        }

        function addToAccordionBox(index) {
            accordionBox.boxList.splice(index, 0, box);
            accordionBox.toggleBarList.splice(index, 0, toggleBar);
            accordionBox.toggleBlockList.splice(index, 0, toggleBlock);

            calculateNearbyBlocksData();
            if (nextBlock) {
                accordionBox.element.insertBefore(splitter, nextBlock);
                accordionBox.element.insertBefore(toggleBlock, splitter);
                accordionBox.splitterList.splice(index - 1, 0, splitter);
            } else {
                accordionBox.element.appendChild(splitter);
                accordionBox.element.appendChild(toggleBlock);
                accordionBox.splitterList.push(splitter);
            }

            toggleBlock.$parent = accordionBox;
            splitter.$parent = accordionBox;

            accordionBox.calculateChildrenSizePercents();
            accordionBox.recalculateChildrenSizes();

            accordionDataChanged();
        }

        function removeFromAccordionBox() {
            box = accordionBox.boxList.splice(previousIndex, 1)[0];
            toggleBar = accordionBox.toggleBarList.splice(previousIndex, 1)[0];
            toggleBlock = accordionBox.toggleBlockList.splice(previousIndex, 1)[0];

            var splitterIndex = accordionBox.splitterList[previousIndex] ? previousIndex : previousIndex - 1;
            splitter = accordionBox.splitterList.splice(splitterIndex, 1)[0];

            toggleBlockDragging.style.height = accordionBox.toggleBarHeight + "px";

            toggleBlock.remove();
            splitter.remove();
            accordionBox.calculateChildrenSizePercents();
            accordionBox.recalculateChildrenSizes();
            accordionDataChanged();
            accordionBox = null;
            toggleBlock.$parent = null;
            splitter.$parent = null;
        }

        function finishDragging() {
            if (!accordionBox) {
                accordionBox = toggleBlockDragging.$hostAccordionBox;

                addToAccordionBox(toggleBlockDragging.$hostIndex);
            }

            toggleBlockDragging.remove();
            toggleBlock.style.opacity = 1;

            isDragging = false;
        }

        var onMouseMove = function (e) {
            if (e.type !== "mousemove")
                return;

            if (!isDragging) {
                if (distance(e.clientX - startX, e.clientY - startY) < 25)
                    return;
                startDragging();
            }

            var left = e.clientX - posX;
            var top = e.clientY - posY;

            if (accordionBox) {
                if (left < accordionBoxRect.left - accordionBoxRect.width || left > accordionBoxRect.left + accordionBoxRect.width) {
                    removeFromAccordionBox();
                }
            }

            if (!accordionBox) {
                accordionBox = Utils.findHost(e.target, accordionConstructor);
                if (accordionBox) {
                    accordionBoxRect = accordionBox.element.getBoundingClientRect();

                    nextBlock = Utils.findNode(e.target, "toggle-block");
                    if (nextBlock) {
                        startIndex = nextBlock.$index;
                    } else {
                        startIndex = accordionBox.toggleBlockList.length;
                    }
                    previousIndex = changeIndex = startIndex;

                    addToAccordionBox(previousIndex);

                    toggleBlockDragging.style.height = toggleBlock.style.height;
                }
            }

            if (accordionBox) {
                left = accordionBoxRect.left;

                if (e.clientY < prevY && topMaxY && top < topMaxY) {
                    changeIndex--;
                } else if (e.clientY > prevY && bottomMaxY && top + toggleBlockRect.height > bottomMaxY) {
                    changeIndex++;
                }

                if (changeIndex !== previousIndex) {
                    accordionBox.element.insertBefore(toggleBlock, accordionBox.toggleBlockList[changeIndex]);
                    var splitterIndex = accordionBox.splitterList[previousIndex] ? previousIndex : previousIndex + 1;
                    accordionBox.element.insertBefore(accordionBox.toggleBlockList[changeIndex], accordionBox.splitterList[splitterIndex]);

                    accordionBox.boxList.splice(changeIndex, 0, accordionBox.boxList.splice(previousIndex, 1)[0]);
                    accordionBox.toggleBarList.splice(changeIndex, 0, accordionBox.toggleBarList.splice(previousIndex, 1)[0]);
                    accordionBox.toggleBlockList.splice(changeIndex, 0, accordionBox.toggleBlockList.splice(previousIndex, 1)[0]);

                    calculateNearbyBlocksData();
                    accordionDataChanged();

                    previousIndex = changeIndex;
                }
            }

            toggleBlockDragging.style.left = left + "px";
            toggleBlockDragging.style.top = top + "px";

            prevX = e.clientX;
            prevY = e.clientY;
        };
        var onMouseUp = function (e) {
            if (!isDragging)
                return;

            finishDragging();
        };

        event.capture(window, onMouseMove, onMouseUp);
        return e.preventDefault();
    };

    export var toggleBarOnClick = function (e) {
        var toggleBlock = Utils.findNode(e.target, "toggle-block");
        if (!toggleBlock)
            return;

        var accordionBox = toggleBlock.$parent;

        var index = toggleBlock.$index;
        var isOpened = accordionBox.isOpenedBlock(toggleBlock);

        if (!isOpened) {
            toggleBlock.classList.add("toggle-opened");
            index = undefined;
        } else {
            toggleBlock.classList.remove("toggle-opened");
        }
        accordionBox.recalculateChildrenSizes(index);

        Box.enableAnimation();

        var node = accordionBox.element;
        node.addEventListener('transitionend', function handler() {
            node.removeEventListener('transitionend', handler);
            Box.disableAnimation();
        });

        accordionBox.resize();
    };

    export var splitterMouseDown = function (e) {
        var button = e.button;
        if (button !== 0)
            return;

        var splitter = Utils.findNode(e.target, "splitter");
        if (!splitter)
            return;

        var accordionBox = splitter.$parent;
        var x = e.clientX;
        var y = e.clientY;
        var splitterIndex = splitter.$index + 1;

        var prevX = x;
        var prevY = y;

        if (!accordionBox.hasNextOpenedBoxes(splitterIndex) || !accordionBox.hasPrevOpenedBoxes(splitterIndex))
            return;

        accordionBox.keepState();

        var onMouseMove = function (e) {
            x = e.clientX;
            y = e.clientY;

            var changedSize = 0;

            if (prevY > y) {
                changedSize = accordionBox.recalculatePreviousBoxesSize(splitterIndex, y);

                if (changedSize === 0)
                    return;

                accordionBox.expandNextBoxes(splitterIndex, changedSize);
            } else if (prevY < y) {
                changedSize = accordionBox.recalculateNextBoxesSize(splitterIndex, y);

                if (changedSize === 0)
                    return;

                accordionBox.expandPrevBoxes(splitterIndex, changedSize);
            } else {
                return;
            }

            prevY = y;
            accordionBox.resize();
        };
        var onResizeEnd = function (e) {
            accordionBox.dischargeState();
            Box.setGlobalCursor("");

            accordionBox.calculateChildrenSizePercents();
        };
        Box.setGlobalCursor(`${accordionBox.vertical ? "ns" : "ew"}-resize`);

        event.capture(window, onMouseMove, onResizeEnd);
        return e.preventDefault();

    };
}