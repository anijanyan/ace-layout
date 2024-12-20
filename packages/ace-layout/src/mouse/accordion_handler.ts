import {Box} from "../widgets/boxes/box";
import {Utils} from "../utils/lib";
import {Accordion} from "../widgets/boxes/accordion";

let event = require("ace-code/src/lib/event");

export namespace AccordionHandler {
    export let toggleBarMouseDown = function (e, accordionConstructor) {
        let toggleBlock = Utils.findNode(e.target, "toggle-block");
        if (!toggleBlock)
            return;

        let accordionBox: Accordion | undefined,
            accordionBoxRect: DOMRect,
            toggleBlockDragging,
            toggleBlockRect;
        let startIndex,
            changeIndex,
            previousIndex;
        let toggleBar,
            section,
            splitter;

        let startX = e.clientX, startY = e.clientY;
        let isDragging = false;
        let posX, posY, prevY, prevX;

        let prevBlock, topMaxY, nextBlock, bottomMaxY;

        function distance(dx, dy) {
            return dx * dx + dy * dy
        }

        function calculateNearbyBlocksData() {
            if (!accordionBox)
                return;
            prevBlock = accordionBox.toggleBlockList[changeIndex - 1] || null;
            nextBlock = accordionBox.toggleBlockList[changeIndex + 1] || null;
            topMaxY = prevBlock && (parseInt(prevBlock.style.top, 10) + parseInt(prevBlock.style.height, 10) / 2 + accordionBoxRect.top);
            bottomMaxY = nextBlock && (parseInt(nextBlock.style.top, 10) + parseInt(nextBlock.style.height, 10) / 2 + accordionBoxRect.top);
        }

        function startDragging() {
            if (isDragging)
                return;

            accordionBox = Utils.findHost(toggleBlock, accordionConstructor);
            if (!accordionBox)
                return;
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
            for (let i = 0; i < arr.length; i++) {
                arr[i].$index = i;
            }
        }

        function accordionDataChanged() {
            if (!accordionBox)
                return;
            recalculateIndexes(accordionBox.sections);
            recalculateIndexes(accordionBox.toggleBarList);
            recalculateIndexes(accordionBox.toggleBlockList);
            recalculateIndexes(accordionBox.splitterList);

            accordionBox.resize();
        }

        function addToAccordionBox(index) {
            if (!accordionBox)
                return;
            accordionBox.sections.splice(index, 0, section);
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

            accordionBox.calculateSectionsSizesPercents();
            accordionBox.recalculateChildrenSizes();

            accordionDataChanged();
        }

        function removeFromAccordionBox() {
            if (!accordionBox)
                return;
            section = accordionBox.sections.splice(previousIndex, 1)[0];
            toggleBar = accordionBox.toggleBarList.splice(previousIndex, 1)[0];
            toggleBlock = accordionBox.toggleBlockList.splice(previousIndex, 1)[0];

            let splitterIndex = accordionBox.splitterList[previousIndex] ? previousIndex : previousIndex - 1;
            splitter = accordionBox.splitterList.splice(splitterIndex, 1)[0];

            toggleBlockDragging.style.height = accordionBox.toggleBarHeight + "px";

            toggleBlock.remove();
            splitter.remove();
            accordionBox.calculateSectionsSizesPercents();
            accordionBox.recalculateChildrenSizes();
            accordionDataChanged();
            accordionBox = undefined;
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

        let onMouseMove = function (e) {
            if (e.type !== "mousemove")
                return;

            if (!isDragging) {
                if (distance(e.clientX - startX, e.clientY - startY) < 25)
                    return;
                startDragging();
            }

            let left = e.clientX - posX;
            let top = e.clientY - posY;

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
                    let splitterIndex = accordionBox.splitterList[previousIndex] ? previousIndex : previousIndex + 1;
                    accordionBox.element.insertBefore(accordionBox.toggleBlockList[changeIndex], accordionBox.splitterList[splitterIndex]);

                    accordionBox.sections.splice(changeIndex, 0, accordionBox.sections.splice(previousIndex, 1)[0]);
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
        let onMouseUp = function (e) {
            if (!isDragging)
                return;

            finishDragging();
        };

        event.capture(window, onMouseMove, onMouseUp);
        return e.preventDefault();
    };

    export let toggleBarOnClick = function (e) {
        let toggleBlock = Utils.findNode(e.target, "toggle-block");
        if (!toggleBlock)
            return;

        let accordionBox = toggleBlock.$parent;

        let index = toggleBlock.$index;
        let isOpened = accordionBox.isOpenedBlock(toggleBlock);

        if (!isOpened) {
            toggleBlock.classList.add("toggle-opened");
            index = undefined;
        } else {
            toggleBlock.classList.remove("toggle-opened");
        }
        accordionBox.recalculateChildrenSizes(index);

        Box.enableAnimation();

        let node = accordionBox.element;
        node.addEventListener('transitionend', function handler() {
            node.removeEventListener('transitionend', handler);
            Box.disableAnimation();
        });

        accordionBox.resize();
    };

    export let splitterMouseDown = function (e) {
        let button = e.button;
        if (button !== 0)
            return;

        let splitter = Utils.findNode(e.target, "splitter");
        if (!splitter)
            return;

        let accordionBox = splitter.$parent as Accordion;
        let x = e.clientX;
        let y = e.clientY;
        let splitterIndex = splitter.$index + 1;

        let prevX = x;
        let prevY = y;

        if (!accordionBox.hasNextOpenedBlocks(splitterIndex) || !accordionBox.hasPrevOpenedBlocks(splitterIndex))
            return;

        accordionBox.keepState();

        let onMouseMove = function (e) {
            x = e.clientX;
            y = e.clientY;

            let changedSize = 0;

            if (prevY > y) {
                changedSize = accordionBox.recalculatePreviousSectionsSize(splitterIndex, y);

                if (changedSize === 0)
                    return;

                accordionBox.expandNextSections(splitterIndex, changedSize);
            } else if (prevY < y) {
                changedSize = accordionBox.recalculateNextSectionsSize(splitterIndex, y);

                if (changedSize === 0)
                    return;

                accordionBox.expandPreviousSections(splitterIndex, changedSize);
            } else {
                return;
            }

            prevY = y;
            accordionBox.resize();
        };
        let onResizeEnd = function (e) {
            accordionBox.dischargeState();
            Box.setGlobalCursor("");

            accordionBox.calculateSectionsSizesPercents();
        };
        Box.setGlobalCursor(`${accordionBox.vertical ? "ns" : "ew"}-resize`);

        event.capture(window, onMouseMove, onResizeEnd);
        return e.preventDefault();

    };
}