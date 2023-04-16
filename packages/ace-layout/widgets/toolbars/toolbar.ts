import type {LayoutHTMLElement, ToolbarDirection, ToolBarOptions, ToolbarPosition, Widget} from "../widget";
import {Utils} from "../../utils/lib";

export abstract class Toolbar implements Widget {
    size: number;
    direction: ToolbarDirection;
    position?: ToolbarPosition;
    element: LayoutHTMLElement;

    setBox(x, y, w, h) {
        Utils.setBox(this.element, x, y, w, h);
    }

    constructor(options?: ToolBarOptions) {
        this.direction = options?.direction || "horizontal";
        this.size = options?.size || 27;//TODO
        this.position = options?.position;
    }

    abstract remove();

    abstract toJSON();

    abstract render(): LayoutHTMLElement;
}