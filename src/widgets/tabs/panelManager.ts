import {Box} from "../boxes/box";
import {Accordion} from "../boxes/accordion";
import {LocationList, PanelManagerOptions, PanelOptions} from "../widget";
import {Panel, PanelBar} from "./panel";

export class PanelManager {
    private static _instance: PanelManager;
    private layout: Box;
    private locations: LocationList;

    constructor(options: PanelManagerOptions) {
        this.layout = options.layout;
        this.locations = options.locations;
    }

    static getInstance(options?: PanelManagerOptions) {
        if (!PanelManager._instance) {
            PanelManager._instance = new PanelManager(options);
        }

        return PanelManager._instance;
    }

    toJSON() {
        return {
            panelBars: this.panelBarsToJSON()
        };
    }

    panelBarsToJSON() {
        var panelBars = {};
        var panelBar;

        for (var position in this.layout.toolBars) {
            panelBar = this.layout.toolBars[position];
            if (panelBar instanceof PanelBar) {
                panelBars[position] = panelBar.toJSON();
            }
        }

        return panelBars;
    }

    setState(state) {
        var panelBars = state.panelBars;
        var panelBar: PanelBar, panelList: PanelOptions[], panel: Panel;
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
                    title: panel.title,
                    autohide: panel.autohide,
                    panelBody: panelBody,
                });
            }
            panelBar = new PanelBar({panelList: {}});
            this.layout.addToolBar(position, panelBar);
            panelBar.addTabList(panelList);
        }
    }

    addPanel(panel, panelBar) {

    }

    activatePanel(panel: Panel) {
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

    deactivatePanel(panel: Panel) {
        var location = panel.parent.position;
        if (!this.locations[location])
            return;

        var locationBox = this.locations[location].box;

        locationBox.hide();
    }
}