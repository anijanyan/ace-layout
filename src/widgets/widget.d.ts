import type {Box} from "./boxes/box";
import type {SizeUnit} from "../models/params";
import type {Tab} from "./tabs/tab";
import type {Accordion} from "./boxes/accordion";
import type {Ace} from "ace-code";
import {FileSystemWeb} from "../file-system/file-system-web";

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
    size: number
    box?: Box
}

interface AccordionOptions {
    vertical?: boolean;
    color?: string;
    boxes: any
    minSize?: number
    minVerticalSize?: any
    minHorizontalSize?: any
    size?: number
}

interface BoxOptions {
    fixedSize?: number;
    hidden?: boolean;
    buttonList?: any[];
    toolBars?: { [place: string]: ToolBar };
    ratio?: number;
    isMain?: boolean;
    vertical?: boolean;
    splitter?: boolean;
    color?: string;
    boxes?: any;
    minSize?: number;
    minVerticalSize?: any;
    minHorizontalSize?: any;
    size?: number;
    sizeUnit?: SizeUnit;
    classNames?: string;
    0?: Box;
    1?: Box;
}

interface PaneOptions extends BoxOptions {
    tabList?: Tab[];

}

interface TabManagerOptions {
    console?: Box;
    main: Box;
    fileSystem: FileSystemWeb;
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
    location?: string;
    autohide: boolean;
}

export interface PanelManagerOptions {
    locations: LocationList;
    layout: Box;
}

export interface TabList {
    [path: string]: Tab;
}

export interface LocationList {
    [direction: string]: PanelLocation;
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

interface ButtonOptions {
    disabled?: boolean;
    value?: string;
    className?: string;
}

interface DropdownOptions {
    disabled?: boolean;
    items: any;
    value?: string;
    className?: string;
    width: number;
}

interface DropdownElement {
    hotKey: any | string;
    value: string;
    disabled: any;
    map: any;
    type: string;
    checked: any;
    caption: any;
    position: number;
}

interface MenuOptions {
    exec?: any;
    className?: string;
    disabled?: boolean;
    checked?: boolean;
    type?: string;
    hotKey?: any;
    label?: string;
    position?: number;
}

interface Position {
    x: number,
    y: number
}