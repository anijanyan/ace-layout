define(function(require, exports, module) {
    var dom = require("ace/lib/dom");
    var lib = require("new/lib");

    var {Box, Pane} = require("new/box");

    exports.TabManager = class TabManager {
        constructor(options) {
            this.containers = {};
            this.containers.console = options.console;
            this.containers.main = options.main;
        }
        toJSON() {
            return {
                console: this.containers.console.toJSON(),
                main: this.containers.main.toJSON(),
            };
        }

        setChildBoxData(box, boxData, index) {
            if (!boxData[index])
                return;

            var boxType = boxData[index].type;
            if (!box[index])
                box.addChildBox(index, boxType === "pane" ? new Pane({tabList: {}}) : new Box({vertical: boxType === "vbox"}))

            this.setBoxData(box[index], boxData[index]);

        }
        setBoxData(box, boxData) {
            if (!boxData) return;

            var boxType = boxData.type;
            if (boxData.fixedSize)
                box.fixedSize = boxData.fixedSize;

            if (boxType === "pane") {
                if (boxData.tabBar) {
                    box.tabBar.addTabList(boxData.tabBar.tabList);
                    box.tabBar.scrollLeft = boxData.tabBar.scrollLeft;
                }
            } else {
                box.hidden = boxData.hidden;
                box.ratio = boxData.ratio;
                this.setChildBoxData(box, boxData, 0);
                this.setChildBoxData(box, boxData, 1);
            }
        }
        setState(json) {
            //TODO
            if (this.containers.main[0]) {
                this.containers.main[0].remove();
            }
            if (this.containers.main[1]) {
                this.containers.main[1].remove();
            }
            if (this.containers.console[0]) {
                this.containers.console[0].remove();
            }
            if (this.containers.console[1]) {
                this.containers.console[1].remove();
            }
            //TODO
            this.setBoxData(this.containers.main, json && json.main);
            this.setBoxData(this.containers.console, json && json.console);

            var normalize = (box) => {
                if (!box[0] && box.isMain)
                    this.setChildBoxData(box, [{type: "pane"}], 0)
            }

            normalize(this.containers.main);
            normalize(this.containers.console);
        }
        clear() {

        }
        getPanes() {

        }
        getTabs() {

        }

    }
});