import * as layoutCSS from "../styles/layout.css";
import {dom} from "../utils/dom";
import {Box} from "./boxes/box";

export class AceLayout {
    box: Box;

    constructor(startBox: Box, css?: string) {
        dom.importCssString(css ?? layoutCSS, "layout.css");
        this.box = startBox;
    }
}
