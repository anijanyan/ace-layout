import {Box} from "../boxes/box";
import {Accordion} from "../boxes/accordion";
import {AccordionSection, LocationList, PanelManagerOptions, PanelOptions, ToolbarPosition} from "../widget";
import {Panel} from "./panel";
import {PanelBar} from "../toolbars/panelBar";

export class PanelManager {
    private static _instance: PanelManager;
    private layout: Box;
    private readonly locations: LocationList;

    private constructor(options: PanelManagerOptions) {
        this.layout = options.layout;
        this.locations = options.locations;
    }

    static getInstance(options?: PanelManagerOptions) {
        if (!PanelManager._instance)
            PanelManager._instance = new PanelManager(options!);

        return PanelManager._instance;
    }

    toJSON() {
        return {
            panelBars: this.panelBarsToJSON()
        };
    }

    panelBarsToJSON() {
        let panelBars = {};
        let panelBar;

        for (let position in this.layout.toolBars) {
            panelBar = this.layout.toolBars[position];
            if (panelBar instanceof PanelBar) {
                panelBars[position] = panelBar.toJSON();
            }
        }

        return panelBars;
    }

    setState(state) {
        let panelBars = state.panelBars;
        let panelBar: PanelBar, panelList: PanelOptions[], panel: Panel;
        let panelBody, panelBodyData;

        for (let position in panelBars) {
            panelList = [];
            let tabList = panelBars[position].tabList;
            for (let i = 0; i < tabList.length; i++) {
                panel = tabList[i];
                panelBodyData = panel.panelBody;
                if (panelBodyData.type === "accordion") {//todo
                    let accordionSections: AccordionSection[] = [];
                    let sections = panelBodyData.sections;

                    for (let index = 0; index < sections.length; index++) {
                        accordionSections.push({
                            title: sections[index].title,
                            box: new Box(sections[index].boxData)
                        })
                    }

                    panelBody = new Accordion({
                        vertical: panelBodyData.vertical,
                        size: panelBodyData.size,
                        sections: accordionSections
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
                    autoHide: panel.autoHide,
                    panelBody: panelBody,
                });
            }
                panelBar = new PanelBar({panelList: {}});
            this.layout.addToolBar(position as ToolbarPosition, panelBar);
            panelBar.addTabList(panelList);
        }
    }

    activatePanel(panel: Panel) {
        let location = this.locations[panel.parent.position!];

        if (!location)
            return;

        let index = location.index;
        let parent = location.parent;
        panel.panelBody.size = location.size;

        let newBox = parent.addChildBox(index, panel.panelBody);

        if (newBox.fixedSize && !parent.fixedChild)
            parent.fixedChild = newBox;

        location.box = newBox;
        newBox.show();
    }

    deactivatePanel(panel: Panel) {
        let location = this.locations[panel.parent.position!];
        location?.box!.hide();
    }
}