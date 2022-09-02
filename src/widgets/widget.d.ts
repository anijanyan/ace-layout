import {Box} from "./box";
import {SizeUnit} from "../models/params";
import {Tab} from "./tab";
import {Accordion} from "./accordion";
import {Ace} from "ace-code";

export interface LayoutEditSession extends Ace.EditSession {
    tab?: Tab;
}

export interface LayoutEditor extends Ace.Editor {
    session: LayoutEditSession;
}

/**
 * Interface for classes that represent a widgets.
 *
 */
export interface Widget {
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

export interface TabOptions {
    preview?: boolean;
    path?: string;
    title: string;
    tabIcon?: string;
    active: boolean;
}


export interface PanelOptions extends TabOptions {
    panelBody: Accordion | Box;
    location: string;
    autohide: boolean;
}

export interface TabList {
    [path: string]: Tab;
}

export interface LayoutHTMLElement extends HTMLElement {
    dx?: number;
    dy?: number;
    $host: any;  //TODO:
}

export interface SwitcherOptions {
    checked?: boolean;
    className?: string;
}

export interface ToolBar {
    size: number;
}