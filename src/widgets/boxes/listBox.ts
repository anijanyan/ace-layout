import {Box} from "./box";
import {Utils} from "../../lib";

import {AcePopup} from 'ace-code/src/autocomplete/popup';

export class ListBox extends Box {
    private popup: AcePopup;

    render() {
        if (this.element) return this.element;
        super.render();

        var popup = new AcePopup();
        popup.renderer.setStyle("ace_listBox");
        popup.container.style.display = "block";
        popup.container.style.position = "absolute";
        popup.container.style.zIndex = "0";
        popup.container.style.boxShadow = "none";
        popup.renderer.setScrollMargin(2, 2, 0, 0);
        popup.autoSelect = false;
        popup.renderer.$maxLines = null;
        popup.setRow(-1);
        popup.on("click", (e) => {
            e.stop();
            var data = popup.getData(popup.getRow());
            //@ts-ignore
            this._signal("select", data);
        });
        popup.on("dblclick", (e) => {
            e.stop();
            var data = popup.getData(popup.getRow());
            //@ts-ignore
            this._signal("choose", data);
        });
        popup.on("tripleclick", (e) => {
            e.stop();
        });
        popup.on("quadclick", (e) => {
            e.stop();
        });
        this.element.appendChild(popup.container);
        this.popup = popup;
        delete popup.focus
        return this.element;
    }

    $updateChildSize(x, y, w, h) {
        Utils.setBox(this.popup.container, x, y, w, h);
        this.popup.resize(true);
    }
}
