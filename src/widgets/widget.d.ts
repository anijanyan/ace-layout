/**
 * Interface for classes that represent a widgets.
 *
 */
import {Box} from "./box";
import {SizeUnit} from "../models/params";
import {Tab} from "./tab";
import {Accordion} from "./accordion";

interface Widget {
    render()

    remove()

    toJSON()
}

/**
 * Interface for classes that represent location of the panel on layout.
 *
 */
interface PanelLocation {
    parent: Box
    index: number
    size: string
    box?: Box
}

interface AccordionOptions {
    vertical?: boolean;
    color: any
    boxes: any
    minSize?: number
    minVerticalSize?: any
    minHorizontalSize?: any
    size?: number
}

interface BoxOptions {
    buttonList?: any[];
    toolBars?: {};
    ratio?: number;
    isMain?: boolean;
    vertical?: boolean;
    splitter?: boolean
    color?: string
    boxes?: any
    minSize?: number
    minVerticalSize?: any
    minHorizontalSize?: any
    size?: number,
    sizeUnit?: SizeUnit
    0?: Box;
    1?: Box;
}

interface TabManagerOptions {
    console?: Box;
    main: Box;
}

interface TabOptions {
    preview: boolean;
    path: string;
    title: string;
    tabIcon: string;
    active: boolean;
}


interface PanelOptions extends TabOptions {
    panelBody: Accordion | Box;
    location: string;
    autohide: boolean;
}

interface TabList {
    [path: string]: Tab;
}

interface LayoutHTMLElement extends HTMLElement {
    $host: any;  //TODO:
}

interface SwitcherOptions {
    checked?: boolean;
    className?: string;
}

interface ToolBar {
    size: number;
}