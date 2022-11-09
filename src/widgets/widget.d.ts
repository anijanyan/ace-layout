import type {Box} from "./boxes/box";
import type {SizeUnit} from "../utils/params";
import type {Tab} from "./tabs/tab";
import type {Accordion} from "./boxes/accordion";
import {FileSystemWeb} from "../file-system/file-system-web";
import {EditorType} from "../utils/params";

export interface LayoutEditor {
    container: HTMLElement;
    setSession;
    tab?: Tab;
    resize();
    focus();
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
    containers: { "main": Box, [containerName: string]: Box };
    fileSystem?: FileSystemWeb;
}

//TODO: path mandatory
export interface TabOptions {
    preview?: boolean;
    path?: string;
    title: string;
    tabIcon?: string;
    active?: boolean;
    editorType?: EditorType;
}


export interface PanelOptions extends TabOptions {
    panelBody: Accordion | Box;
    location?: string;
    autohide?: boolean;
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
    parentElement: LayoutHTMLElement
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