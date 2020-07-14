var ace = require("ace-builds");
var dom = ace.require("ace/lib/dom");
var event = ace.require("ace/lib/event");
var oop = ace.require("ace/lib/oop");
var {EventEmitter} = ace.require("ace/lib/event_emitter");
var lib = require("./lib");

dom.importCssString(require("text-loader!./layout.css"), "layout.css");


var {Tab, TabBar, Panel, PanelBar} = require("./tab");


var SPLITTER_SIZE = 1;
var BOX_MIN_SIZE = 40;
var barHeight = 27;

var Box = class {
    static enableAnimation() {
        document.documentElement.classList.add("animateBoxes");
    }
    static disableAnimation() {
        document.documentElement.classList.remove("animateBoxes");
    }
    static setGlobalCursor(value) {
        if (value)
            document.documentElement.classList.add("inheritCursor");
        else
            document.documentElement.classList.remove("inheritCursor");
        document.documentElement.style.cursor = value;
    }
    constructor(options) {
        if (options.splitter !== false) {}
        this.vertical = options.vertical || false;
        this.color = options.color;
        this.isMain = options.isMain || false;
        this[0] = options[0];
        this[1] = options[1];

        if (this[0]) this[0].parent = this;
        if (this[1]) this[1].parent = this;

        this.ratio = options.ratio;
        this.toolBars = options.toolBars || {};
        this.padding = {top: 0, right: 0, bottom: 0, left: 0};
        this.size = options.size;
        this.buttonList = options.buttonList || [];
        this.minSize = options.minSize || BOX_MIN_SIZE;
        this.minVerticalSize = options.minVerticalSize || this.minSize;
        this.minHorizontalSize = options.minHorizontalSize || this.minSize;
    }
    toJSON() {
        return {
            0: this[0] && this[0].toJSON(),
            1: this[1] && this[1].toJSON(),
            ratio: this.ratio,
            type: this.vertical ? "vbox" : "hbox",
            fixedSize: this.fixedSize || null,
            hidden: this.hidden,
            color: this.color,
            size: this.size
        }
    }
    onMouseDown(e) {
        var button = e.button;
        if (button !== 0)
            return;

        var box = this;
        var rect = this.element.getBoundingClientRect();
        var x = e.clientX;
        var y = e.clientY;

        var onMouseMove = function(e) {
            x = e.clientX - rect.left - box.padding.left;
            y = e.clientY - rect.top - box.padding.top;
            var height = rect.height - box.padding.top - box.padding.bottom;
            var width = rect.width - box.padding.left - box.padding.right;

            if (box.fixedChild) {
                if (box.vertical) {
                    box.fixedChild.fixedSize = (box.fixedChild === box[1]) ? height - y : y;
                } else {
                    box.fixedChild.fixedSize = (box.fixedChild === box[1]) ? width - x : x;
                }
                box.fixedChild.fixedSize = Math.max(box.fixedChild.fixedSize, box.fixedChild.minSize);
                box.ratio = null;
            } else {
                if (box.vertical) {
                    box.ratio = y / height;
                } else {
                    box.ratio = x / width;
                }
                box.ratio = Math.max(box.minRatio, Math.min(box.ratio, box.maxRatio));
            }

            box.resize();
        };
        var onResizeEnd = function(e) {
            Box.setGlobalCursor("");
        };
        Box.setGlobalCursor(`${box.vertical ? "ns" : "ew"}-resize`);

        event.capture(window, onMouseMove, onResizeEnd);
        return e.preventDefault();
    }
    resize() {
        if (!this.box)
            return;

        this.setBox(...this.box);
    }
    calculateMinMaxRatio() {
        if (!this.box || (!this[0] && !this[1]))
            return;

        var propertyName = this.vertical ? "minVerticalSize" : "minHorizontalSize";

        var size = this.vertical ? this.box[3] - this.padding.top - this.padding.bottom : this.box[2] - this.padding.left - this.padding.right;
        this.minRatio = this[0] ? this[0][propertyName] / size : 0;
        this.maxRatio = this[1] ? (size - this[1][propertyName]) / size : 1;
    }
    draw() {
        if (this.element)
            return this.element;

        this.element = dom.buildDom(["div", {
            class: "box",
            $host: this,
        }]);
        this.splitter = dom.buildDom(["div", {
            class: `splitter splitter${this.vertical ? "-v" : "-h"}`
        }, ["div"]]);

        this.splitter.onmousedown = this.onMouseDown.bind(this);

        this.element.appendChild(this.splitter);

        this.element.host = this;
        this.element.style.backgroundColor = this.color;
        this.element.style.position = "absolute";

        this.drawBarList();
        this.drawChildren();
        if (!this.ratio)
            this.calculateRatio();

        this.drawButtons();

        return this.element;
    }
    drawBarList() {
        var bar;
        for (var position in this.toolBars) {
            this.addToolBar(position, this.toolBars[position]);
        }
    }
    addToolBar(position, bar) {
        if (position == "left" || position == "right") {
            bar.direction = "vertical";
        }

        if (this.toolBars[position] && this.toolBars[position].element) {
            this.toolBars[position].element.remove();
        }

        bar.position = position;
        this.padding[position] = barHeight;
        this.element.appendChild(bar.draw());
        this.toolBars[position] = bar;
    }
    removeBar(position) {
        delete this.toolBars[position];
        this.padding[position] = 0;
    }
    drawChildren() {
        if (this[0]) this.element.appendChild(this[0].draw());
        if (this[1]) this.element.appendChild(this[1].draw());

        this.calculateMinSize();
    }
    calculateMinSize(forceChildrenSize) {
        var childrenMinVerticalSize = 0;
        var childrenMinHorizontalSize = 0;

        var calculateChildBoxMinSize = (childBox) => {
            if (this.vertical) {
                childrenMinVerticalSize += childBox.minVerticalSize;
                childrenMinHorizontalSize = Math.max(childBox.minHorizontalSize, childrenMinHorizontalSize);
            } else {
                childrenMinVerticalSize = Math.max(childBox.minVerticalSize, childrenMinVerticalSize);
                childrenMinHorizontalSize += childBox.minHorizontalSize;
            }
        };

        if (this[0]) calculateChildBoxMinSize(this[0]);
        if (this[1]) calculateChildBoxMinSize(this[1]);

        if (forceChildrenSize) {
            this.minVerticalSize = childrenMinVerticalSize;
            this.minHorizontalSize = childrenMinHorizontalSize;
        } else {
            this.minVerticalSize = Math.max(this.minVerticalSize, childrenMinVerticalSize);
            this.minHorizontalSize = Math.max(this.minHorizontalSize, childrenMinHorizontalSize);
        }

        this.minSize = this.vertical ? this.minVerticalSize : this.minHorizontalSize;
        this.calculateMinMaxRatio();
    }
    calculateRatio() {
        if (this[0]) {
            this.calculateChildRatio(this[0]);
        }
        if (this.ratio || this.fixedChild) {
            return;
        }
        if (this[1]) {
            this.calculateChildRatio(this[1]);
        }
        if (!this.ratio && !this.fixedChild) {
            this.ratio = 0.5;
        }
    }
    calculateChildRatio(childBox, isSecond) {
        if (!childBox.size) {
            return;
        }
        var sizeStr = childBox.size;
        var size = parseInt(sizeStr, 10);
        var sizeType = sizeStr.substring(size.toString().length);
        switch (sizeType) {
            case "px":
                childBox.fixedSize = size;
                this.fixedChild = childBox;
                break;
            case "%":
                if (isSecond) {
                    size = 100 - size;
                }
                this.ratio = Math.min(size / 100, 1);
                break;
            default: break;
        }
    }
    drawButtons() {
        if (!this.buttonList.length)
            return;

        this.buttons = dom.buildDom(["div", {
            class: `buttons`
        }]);

        var button, buttonElement;
        for (var i = 0; i < this.buttonList.length; i++) {
            button = this.buttonList[i];
            buttonElement = dom.buildDom(["div", {
                class: "button " + button.class,
                title: button.title,
                onclick: button.onclick
            }, "x"]);

            this.buttons.appendChild(buttonElement);
        }
    }
    addButtonsToChildPane() {
        if (this.buttonsHostChildPane)
            this.buttonsHostChildPane.removeButtons();

        this.buttonsHostChildPane = this.getButtonsHostChildPane();
        if (this.buttonsHostChildPane)
            this.buttonsHostChildPane.addButtons(this.buttons);
    }
    getButtonsHostChildPane() {
        if (this.constructor === Pane) {
            return this;
        } else {
            var childBox = this.vertical ? this[0] || this[1] : this[1] || this[0];
            if (!childBox)
                return null;

            return childBox.getButtonsHostChildPane();
        }
    }
    setBox(x, y, w, h) {
        this.box = [x, y, w, h];
        if (this.isMaximized) {
            x = 0;
            y = 0;
            w = window.innerWidth;
            h = window.innerHeight;
        }
        lib.setBox(this.element, x, y, w, h);
        this.calculateMinMaxRatio();
        this.$updateChildSize(x, y, w, h);
    }
    $updateChildSize(x, y, w, h) {
        var splitterSize = SPLITTER_SIZE;
        if (!this[0] || this[0].hidden || !this[1] || this[1].hidden) {
            this.splitter.style.display = "none";
            splitterSize = 0;
        } else {
            this.splitter.style.display = "";
        }
        this.updateBarSize(w, h);
        w -= this.padding.left + this.padding.right;
        h -= this.padding.top + this.padding.bottom;
        x = this.padding.left;
        y = this.padding.top;

        if (this.editor) {
            lib.setBox(this.editor.container, x, y, w, h);

            this.editor.resize();
        }


        if (this.fixedChild) {
            var size = this.fixedChild.fixedSize;
            if (this.fixedChild === this[1]) {
                size = this.vertical ? h - size : w - size;
            }
            this.ratio = this.vertical ? size / h : size / w;
        }
        this.ratio = Math.max(this.minRatio, Math.min(this.ratio, this.maxRatio));

        var ratio = this.ratio;
        if (!this[0] || this[0].hidden) {
            ratio = 0;
        } else if (!this[1] || this[1].hidden) {
            ratio = 1;
        }

        if (this.vertical) {
            var splitY = h * ratio - splitterSize;
            if (this.splitter)
                lib.setBox(this.splitter, x, y + splitY, w, splitterSize);
            if (this[0])
                this[0].setBox(x, y, w, splitY);
            if (this[1])
                this[1].setBox(x, y + splitY + splitterSize, w, h - splitY - splitterSize, 0);
        } else {
            var splitX = w * ratio - splitterSize;
            if (this.splitter)
                lib.setBox(this.splitter, x + splitX, y, splitterSize, h);
            if (this[0])
                this[0].setBox(x, y, splitX, h);
            if (this[1])
                this[1].setBox(x + splitX + splitterSize, y, w - splitX - splitterSize, h);
        }
    }
    updateBarSize(width, height) {
        var bar, x, y, w, h;
        for (var type in this.toolBars) {
            x = 0;
            y = 0;
            w = width;
            h = height;
            bar = this.toolBars[type];
            switch (type) {
                case "top":
                case "bottom":
                    h = barHeight;
                    if (type === "bottom")
                        y = height - barHeight;

                    break;
                case "left":
                case "right":
                    w = barHeight;
                    y = this.padding.top;
                    h -= (this.padding.top + this.padding.bottom);
                    if (type === "right")
                        x = width - barHeight;

                    break;
                default: continue;
            }
            bar.setBox(x, y, w, h);
        }
    }

    restore(disableAnimation) {
        var node = this.element;
        function rmClass(ch, cls) {
            for (var i = 0; i < ch.length; i++) {
                if (ch[i].classList)
                    ch[i].classList.remove(cls)
            }
        }
        var finishRestore = () => {
            classes.forEach(function(className) {
                rmClass(document.querySelectorAll("." + className), className);
            });
            this.setBox(...this.box);
        };
        var classes = [
            "fullScreenSibling","fullScreenNode","fullScreenParent"
        ];
        this.isMaximized = false;

        if (disableAnimation) {
            finishRestore();
        } else {
            Box.enableAnimation();

            node.addEventListener('transitionend', function handler(l) {
                Box.disableAnimation();
                node.removeEventListener('transitionend', handler);
                finishRestore();
            });
        }

        var parentRect = node.parentNode.getBoundingClientRect();
        var top = parentRect.top + this.box[1];
        var left = parentRect.left + this.box[0];

        lib.setBox(node, left, top, this.box[2], this.box[3]);
    }

    maximize(disableAnimation) {
        var node = this.element;
        function addClasses() {
            node.classList.add("fullScreenNode");
            var parent = node;
            while (parent = parent.parentNode) {
                if (parent === document.body) break;
                if (parent.classList)
                    parent.classList.add("fullScreenParent");
                var ch = parent.childNodes;
                for (var i = 0; i < ch.length; i++) {
                    if (ch[i] != node && ch[i].classList)
                        if (!ch[i].classList.contains("fullScreenParent"))
                            ch[i].classList.add("fullScreenSibling")
                }
            }
        }
        var rect = node.getBoundingClientRect();

        lib.setBox(node, rect.left, rect.top, rect.width, rect.height);

        addClasses();
        this.isMaximized = true;
        node.getBoundingClientRect();

        if (!disableAnimation) {
            Box.enableAnimation();

            node.addEventListener('transitionend', function handler() {
                node.removeEventListener('transitionend', handler);
                Box.disableAnimation();
            });
        }

        this.setBox(...this.box);
    }

    toggleMaximize() {
        if (this.isMaximized) this.restore();
        else this.maximize();
    }
    remove() {
        if (this.element) this.element.remove();
        if (this.parent) {
            if (this.parent[0] == this) this.parent[0] = null;
            if (this.parent[1] == this) this.parent[1] = null;
            this.parent.recalculateAllMinSizes();
            this.parent = null;
        }
    }
    removeAllChildren() {
        this[0] && this[0].remove();
        this[1] && this[1].remove();
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

    addChildBox(previousBoxIndex, box) {
        var previousBox, index;
        if (previousBoxIndex instanceof Box) {
            previousBox = previousBoxIndex;
            index = this[0] == previousBox ? 0 : 1;
        } else {
            index = previousBoxIndex;
            previousBox = this[index];
        }
        if (previousBox && previousBox === box) return previousBox;

        var previousParent = box.parent;
        if (previousParent && previousParent !== this) {
            var previousIndex = previousParent[0] === box ? 0 : 1;
            previousParent[previousIndex] = null;
            previousParent.ratio = 1;
            if (previousParent.fixedChild && previousParent.fixedChild === box) {
                previousParent.fixedChild = null;
            }
            previousParent.resize();
        }

        this[index] = box;
        box.parent = this;
        this.element.appendChild(box.draw());

        if (previousBox && previousBox.isMaximized) {
            previousBox.restore(true);
            box.maximize(true);
        }

        if (previousBox && previousBox.parent === this) {
            if (this.fixedChild && this.fixedChild == previousBox) {
                box.fixedSize = previousBox.fixedSize;
                if (!box.size) box.size = previousBox.size;
                previousBox.fixedSize = previousBox.size = null;
                this.fixedChild = box;
            }

            previousBox.remove();
        }

        if (!this.fixedChild)
            this.calculateChildRatio(box);

        this.recalculateAllMinSizes();
        this.resize();

        return box;
    }

    recalculateAllMinSizes() {
        var node = this;
        while (node) {
            node.calculateMinSize(true);
            node = node.parent;
        }
    }
};

oop.implement(Box.prototype, EventEmitter);

var Pane = class Pane extends Box {
    constructor(options) {
        var tabBar = new TabBar({
            tabList: options.tabList
        });
        options.toolBars = options.toolBars || {};
        options.toolBars.top = tabBar;
        super(options);
        tabBar.parent = this;
        this.tabBar = tabBar;
    }

    toJSON() {
        return {
            type: "pane",
            tabBar: this.tabBar.toJSON()
        };
    }
    draw() {
        super.draw();
        this.element.classList.add("tabPanel");

        this.tabEditorBoxElement = dom.buildDom(["div", {
            class: `tab-editor`
        }]);
        this.element.appendChild(this.tabEditorBoxElement);

        return this.element;
    }
    acceptsTab(tab) {
        // TODO accept editor tabs, and not sidebar buttons
        return true;
    }
    split(far, vertical) {
        var newPane = new Pane({});
        var root = this.parent;
        var wrapper = new Box({
            [far ? 1 : 0]: this,
            [far ? 0 : 1]:  newPane,
            vertical: vertical,
            ratio: 0.5
        });

        root.addChildBox(this, wrapper);

        if (this.isButtonHost) {
            wrapper.buttons = this.buttons;
            this.removeButtons();
            wrapper.addButtonsToChildPane();
        }
        return newPane;
    }

    addButtons(buttons) {
        this.buttons = buttons;
        this.tabBar.addButtons(this.buttons);
        this.isButtonHost = true;
    }

    removeButtons() {
        this.buttons = null;
        this.tabBar.removeButtons();
        this.isButtonHost = false;
    }

    remove() {
        var wrapper = this.parent;
        var root = wrapper.parent;
        var paneIndex = wrapper[0] == this ? 1 : 0;
        var pane = wrapper[paneIndex] || null;
        var rootIndex = root[0] == wrapper ? 0 : 1;

        if (pane) {
            pane.parent = root;
            root[rootIndex] = pane;
            root.element.appendChild(pane.element);

            if (root.fixedChild && root.fixedChild == wrapper) {
                pane.fixedSize = wrapper.fixedSize;
                pane.size = wrapper.size;
                root.fixedChild = pane;
            }
        } else {
            if (wrapper.isMain) {
                root = wrapper;
                wrapper = null;
            }
            root.ratio = 1;
        }

        wrapper && wrapper.element.remove();

        root.recalculateAllMinSizes();
        root.resize();

        if (this.isButtonHost) {
            root.buttons = this.buttons;
            root.addButtonsToChildPane();
        }

    }
};

exports.Box = Box;
exports.Pane = Pane;