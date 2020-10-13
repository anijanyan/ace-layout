define(function(require, exports, module) {
    var dom = require("ace/lib/dom");
    var lib = require("layout/lib");

    var {Tab, TabBar, Panel, PanelBar} = require("layout/tab");
    var {Accordion} = require("layout/accordion");
    var {Box, Pane} = require("layout/box");

    exports.PanelManager = class PanelManager {
        constructor(options) {
            this.base = options.base;
            this.locations = options.locations;
        }

        toJSON() {
            return {
                panelBars: this.panelBarsToJSON()
            };
        }

        panelBarsToJSON() {
            var panelBars = {};
            var panelBar;

            for (var position in this.base.toolBars) {
                panelBar = this.base.toolBars[position];
                if (panelBar instanceof PanelBar) {
                    panelBars[position] = panelBar.toJSON();
                }
            }

            return panelBars;
        }

        setState(json) {
            var panelBars = json.panelBars;
            var panelBar, panelList, panel;
            var panelBody, panelBodyData, accordionBoxes;

            for (var position in panelBars) {
                panelList = [];
                for (var i = 0; i < panelBars[position].tabList.length; i++) {
                    panel = panelBars[position].tabList[i];
                    panelBodyData = panel.panelBody;
                    if (panelBodyData.type === "accordion") {//todo
                        accordionBoxes = [];

                        for (var index = 0; index < panelBodyData.boxes.length; index++) {
                            accordionBoxes.push({
                                title: panelBodyData.boxes[index].title,
                                obj: new Box(panelBodyData.boxes[index].boxData)
                            })
                        }

                        panelBody = new Accordion({
                            vertical: panelBodyData.vertical,
                            size: panelBodyData.size,
                            boxes: accordionBoxes
                        });
                    } else {
                        panelBody = new Box({
                            vertical: panelBodyData.type === "vbox",
                            color: panelBodyData.color,
                            size: panelBodyData.size,
                            hidden: panelBodyData.hidden,
                            fixedSize: panelBodyData.fixedSize
                        });
                    }
                    panelList.push({
                        active: panel.active,
                        panelTitle: panel.panelTitle,
                        autohide: panel.autohide,
                        panelBody: panelBody,
                    });
                }
                panelBar = new PanelBar({panelList: {}});
                this.base.addToolBar(position, panelBar);
                panelBar.addTabList(panelList);
            }
        }

        addPanel(panel, panelBar) {

        }

        activatePanel(panel) {
            // var location = panel.location;
            var location = panel.parent.position;
            var locationData = this.locations[location];

            if (!locationData)
                return;

            var index = locationData.index;
            var parent = locationData.parent;
            panel.panelBody.size = locationData.size;

            var newBox = parent.addChildBox(index, panel.panelBody);

            if (newBox.fixedSize && !parent.fixedChild)
                parent.fixedChild = newBox;

            this.locations[location].box = newBox;

            newBox.show();
        }

        deactivatePanel(panel) {
            var location = panel.parent.position;
            if (!this.locations[location])
                return;

            var locationBox = this.locations[location].box;

            locationBox.hide();
        }
    }
});