define(function(require, exports, module) {
    var dom = require("ace/lib/dom");
    var lib = require("new/lib");
    var event = require("ace/lib/event");

    var {Box} = require("new/box");

    dom.importCssString(require("ace/requirejs/text!new/accordion.css"), "accordion.css");

    var {toggleBarMouseDown, toggleBarOnClick, splitterMouseDown} = require("new/mouse/accordion_handler");
    var BOX_MIN_SIZE = 80;//TODO

    exports.Accordion = class Accordion {
        toggleBarList = [];
        splitterList = [];
        toggleBlockList = [];
        boxList = [];
        boxMinSize = 30;
        toggleBarHeight = 20;
        splitterSize = 1;
        constructor(options) {
            this.vertical = options.vertical || false;
            this.color = options.color;
            this.boxes = options.boxes;
            this.minSize = options.minSize || BOX_MIN_SIZE;
            this.minVerticalSize = options.minVerticalSize || this.minSize;
            this.minHorizontalSize = options.minHorizontalSize || this.minSize;

            this.padding = {top: 0, right: 0, bottom: 0, left: 0};
            this.size = options.size;
        }

        hasNextOpenedBoxes(index) {
            for (var i = index; i < this.toggleBlockList.length; i++) {
                if (this.isOpenedIndex(i)) {
                    return true;
                }
            }

            return false;
        }

        hasPrevOpenedBoxes(index) {
            for (var i = index - 1; i >= 0; i--) {
                if (this.isOpenedIndex(i)) {
                    return true;
                }
            }

            return false;
        }

        isOpenedIndex(index) {
            return this.isOpenedBlock(this.toggleBlockList[index]);
        }

        isOpenedBlock(toggleBlock) {
            return toggleBlock.classList.contains("toggle-opened");
        }

        keepState() {
            this.nextChangedBoxes = [];
            this.prevChangedBoxes = [];
            for (var i = 0; i < this.toggleBlockList.length; i++) {
                if (this.isOpenedIndex(i)) {
                    this.boxList[i].$prevSize = this.boxList[i].$size;
                }
            }
        }

        dischargeState() {
            this.nextChangedBoxes = null;
            this.prevChangedBoxes = null;
            for (var i = 0; i < this.toggleBlockList.length; i++) {
                if (this.isOpenedIndex(i)) {
                    this.boxList[i].$prevSize = null;
                }
            }
        }

        addChangedBox(index, changedBoxes) {
            if (changedBoxes && changedBoxes.indexOf(index) < 0) {
                changedBoxes.unshift(index);
            }
        }

        recalculatePreviousBoxesSize(index, top, maxChangeSize) {
            var box, rect, prevSize, currentSize;
            var changedSize = 0;
            var done = false;
            for (var i = index - 1; i >= 0; i--) {
                if (this.isOpenedIndex(i)) {
                    box = this.boxList[i];
                    rect = box.element.getBoundingClientRect();
                    prevSize = rect.height;
                    currentSize = Math.max(top - rect.top, this.boxMinSize);
                    top -= rect.height;
                    if (currentSize < prevSize) {
                        if (currentSize > this.boxMinSize) {
                            done = true;
                        }

                        this.addChangedBox(i, this.prevChangedBoxes);
                        box.$size = currentSize;
                        changedSize += (prevSize - currentSize);
                        if (done) {
                            break;
                        }
                        if (maxChangeSize && changedSize >= maxChangeSize) {
                            break;
                        }
                    }

                }

                top -= this.toggleBarHeight;
            }

            return changedSize;
        }

        recalculateNextBoxesSize(index, top, maxChangeSize) {
            var box, rect, prevSize, currentSize;
            var changedSize = 0;
            var done = false;
            for (var i = index; i < this.toggleBlockList.length; i++) {
                if (this.isOpenedIndex(i)) {
                    box = this.boxList[i];
                    rect = box.element.getBoundingClientRect();
                    prevSize = rect.height;
                    currentSize = Math.max(rect.bottom - top - this.toggleBarHeight, this.boxMinSize);
                    top += rect.height;
                    if (currentSize < prevSize) {
                        if (currentSize > this.boxMinSize) {
                            done = true;
                        }

                        this.addChangedBox(i, this.nextChangedBoxes);
                        box.$size = currentSize;
                        changedSize += (prevSize - currentSize);
                        if (done) {
                            break;
                        }
                        if (maxChangeSize && changedSize >= maxChangeSize) {
                            break;
                        }
                    }

                }

                top += this.toggleBarHeight;
                top += this.splitterSize;
            }

            return changedSize;
        }

        restoreChangedSizes(size, changedBoxes) {
            if (!changedBoxes) {
                return size;
            }
            var index, box, currSize;
            while (changedBoxes.length && size > 0) {
                index = changedBoxes[0];
                box = this.boxList[index];

                currSize = box.$size;
                box.$size = Math.min(box.$prevSize, currSize + size);
                size -= (box.$size - currSize);
                if (box.$size >= box.$prevSize) {
                    changedBoxes.shift();
                }
            }

            return size;
        }

        expandPrevBoxes(index, size) {
            size = this.restoreChangedSizes(size, this.prevChangedBoxes);
            if (size <= 0) {
                return;
            }
            var boxList = [];
            for (var i = index - 1; i >= 0; i--) {
                if (this.isOpenedIndex(i)) {
                    boxList.push(this.boxList[i]);
                }
            }

            var count = boxList.length;
            if (!count) return;

            var remainder = size % count;
            var addSize = (size - remainder) / count;

            for (var i = 0; i < count; i++) {
                boxList[i].$size += addSize;
            }
            boxList[0].$size += remainder;
        }

        expandNextBoxes(index, size) {
            size = this.restoreChangedSizes(size, this.nextChangedBoxes);
            if (size <= 0) {
                return;
            }
            var boxList = [];
            for (var i = index; i < this.toggleBlockList.length; i++) {
                if (this.isOpenedIndex(i)) {
                    boxList.push(this.boxList[i]);
                }
            }

            var count = boxList.length;
            if (!count) return;

            var remainder = size % count;
            var addSize = (size - remainder) / count;

            for (var i = 0; i < count; i++) {
                boxList[i].$size += addSize;
            }
            boxList[0].$size += remainder;
        }

        resize() {
            this.$updateChildSize(...this.box);
        }
        draw() {
            if (this.element)
                return this.element;
            this.element = dom.buildDom(["div", {
                class: "box accordion",
                $host: this,
            }]);

            var box;
            var splitter;
            var toggleBlock;
            var toggleBar;
            for (var i = 0; i < this.boxes.length; i++) {
                box = this.boxes[i];

                if (i > 0) {
                    splitter = dom.buildDom(["div", {
                        class: `splitter accordion-splitter splitter${this.vertical ? "-v" : "-h"}`,
                        $index: i - 1,
                        $parent: this,
                        onmousedown: function (e) {
                            splitterMouseDown(e);
                        }
                    }, ["div"]]);

                    this.element.appendChild(splitter);
                    this.splitterList.push(splitter);
                }

                toggleBlock = dom.buildDom(["div", {
                    class: `toggle-block`,
                    $index: i,
                    $parent: this
                }]);

                toggleBar = dom.buildDom(["div", {
                    class: `toggle-bar toggle-bar${this.vertical ? "-v" : "-h"}`,
                    onmousedown: function (e) {
                        toggleBarMouseDown(e, Accordion)
                    },
                    onclick: function (e) {
                        toggleBarOnClick(e, Accordion)
                    }
                }, ["div", {class: "title"}, box.title]]);

                box = box.obj;

                box.$size = box._$size = parseInt(box.size, 10);
                this.boxList.push(box);

                toggleBlock.appendChild(toggleBar);
                this.toggleBarList.push(toggleBar);
                toggleBlock.appendChild(box.draw());

                this.element.appendChild(toggleBlock);
                this.toggleBlockList.push(toggleBlock);
            }

            this.element.style.backgroundColor = this.color;
            this.element.style.position = "absolute";

            this.calculateChildrenSizePercents();

            return this.element;
        }
        calculateChildrenSizePercents() {
            var box;
            var totalSize = 0;

            for (var i = 0; i < this.boxList.length; i++) {
                box = this.boxList[i];
                box.boxSize = this.isOpenedIndex(i) ? box.$size : box._$size;
                totalSize += this.isOpenedIndex(i) ? box.$size : box._$size;
            }


            var minPercent = Math.floor(this.boxMinSize / totalSize * 100);
            var maxPercent = 100 - minPercent * (this.boxList.length - 1);


            var totalPercent = 0;
            for (var i = 0; i < this.boxList.length; i++) {
                box = this.boxList[i];
                box.$sizePercent = Math.floor(box.boxSize / totalSize * 100);
                box.$sizePercent = Math.min(Math.max(box.$sizePercent, minPercent), maxPercent);
                totalPercent += box.$sizePercent;
            }

            if (totalPercent !== 100) {
                box.$sizePercent += (100 - totalPercent);
            }
        }
        setBox(x, y, w, h) {
            this.box = [x, y, w, h];
            lib.setBox(this.element, x, y, w, h);
            this.recalculateChildrenSizes();
            this.$updateChildSize(x, y, w, h);
        }
        recalculateChildrenSizes(index) {
            var height = this.box[3];
            height -= this.toggleBarHeight * this.toggleBarList.length;
            height -= this.splitterSize * this.splitterList.length;
            var box;
            var totalSize = 0;
            var openedIndexes = [];

            for (var i = 0; i < this.boxList.length; i++) {
                box = this.boxList[i];

                box.$size = Math.max(Math.floor((height * box.$sizePercent) / 100), this.boxMinSize);
                if (this.isOpenedIndex(i)) {
                    totalSize += box.$size;
                    openedIndexes.push(i);
                } else {
                    box._$size = box.$size;
                    box.$size = 0;
                }
            }
            var spareSize = height - totalSize;

            if (!spareSize)
                return;

            if (index !== undefined) {
                var prevOpenedIndexes = [];
                while (openedIndexes.length && openedIndexes[0] < index) {
                    prevOpenedIndexes.push(openedIndexes.shift());
                }
                if (!openedIndexes.length)
                    openedIndexes = prevOpenedIndexes;
            }

            var prevSize, changedSize, openedBoxesCount, remainder, addSize;

            while (openedIndexes.length && spareSize) {
                var changedIndexes = [];
                openedBoxesCount = openedIndexes.length;

                remainder = spareSize % openedBoxesCount;
                addSize = (spareSize - remainder) / openedBoxesCount;
                for (var i = 0; i < openedIndexes.length; i++) {
                    box = this.boxList[openedIndexes[i]];
                    prevSize = box.$size;
                    if (openedBoxesCount === 1)
                        addSize += remainder;

                    box.$size += addSize;
                    box.$size = Math.max(box.$size, this.boxMinSize);

                    changedSize = box.$size - prevSize;

                    spareSize -= changedSize;
                    openedBoxesCount--;

                    if (changedSize < 0) {
                        changedIndexes.push(openedIndexes[i]);
                    }
                }

                openedIndexes = changedIndexes;
            }
        }
        $updateChildSize(x, y, w, h) {
            x = 0;
            y = 0;
            var boxSize;

            var toggleBlock, box;
            for (var i = 0; i < this.toggleBlockList.length; i++) {
                toggleBlock = this.toggleBlockList[i];
                box = this.boxList[i];
                boxSize = box.$size;

                h = this.toggleBarHeight + boxSize;
                lib.setBox(toggleBlock, x, y, w, h);
                y += this.toggleBarHeight;
                box.setBox(0, this.toggleBarHeight, w, boxSize);

                y += boxSize;

                if (this.splitterList[i]) {
                    lib.setBox(this.splitterList[i], x, y, w, this.splitterSize);
                    y += this.splitterSize;
                }
            }
        }
        toggleShowHide() {
            Box.enableAnimation();
            this.hidden = !this.hidden;
            this.parent.resize();
            var node = this.element;
            node.addEventListener('transitionend', function handler() {
                node.removeEventListener('transitionend', handler);
                Box.disableAnimation();
            });
        }

        hide() {
            Box.enableAnimation();
            this.hidden = true;
            this.parent.resize();
            var node = this.element;
            node.addEventListener('transitionend', function handler() {
                node.removeEventListener('transitionend', handler);
                Box.disableAnimation();
            });
        }

        show() {
            Box.enableAnimation();
            this.hidden = false;
            this.parent.resize();
            var node = this.element;
            node.addEventListener('transitionend', function handler() {
                node.removeEventListener('transitionend', handler);
                Box.disableAnimation();
            });
        }

        remove() {
            if (this.element) this.element.remove();
            if (this.parent) {
                if (this.vertical === this.parent.vertical)
                    this.parent.changeMinSize(-this.minSize);

                if (this.parent[0] == this) this.parent[0] = null;
                if (this.parent[1] == this) this.parent[1] = null;
                this.parent = null;
            }
        }

        toJSON() {
            var boxes = [];
            var box;

            for (var i = 0; i < this.boxes.length; i++) {
                box = this.boxes[i];
                boxes.push({
                    title: box.title,
                    boxData: box.obj.toJSON()
                });
            }

            return {
                type: "accordion",
                vertical: this.vertical,
                size: this.size,
                boxes: boxes
            }
        }
    };
});