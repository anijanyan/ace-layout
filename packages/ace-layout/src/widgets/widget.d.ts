import type {Box} from "./boxes/box";
import type {SizeUnit} from "../utils/params";
import type {Tab} from "./tabs/tab";
import type {Accordion} from "./boxes/accordion";
import {FileSystemWeb} from "../file-system/file-system-web";
import {EditorType} from "../utils/params";
import {Ace} from "ace-code";
import {Toolbar} from "./toolbars/toolbar";

export interface LayoutEditor<SessionType extends EditSession = EditSession> {
    container: HTMLElement;
    setSession(tab: Tab, value?: string | null);
    tab: Tab;
    resize();
    focus();
    destroy();
    sessionToJSON(tab: Tab<SessionType>);
    restoreSessionFromJson(tab: Tab<SessionType>);
}

export type EditSession = Ace.EditSession | String;

/**
 * Interface for classes that represent a widgets.
 *
 */
export interface Widget {
    render(): LayoutHTMLElement

    remove(): void

    toJSON(): object
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

interface AccordionSection {
    title: string,
    box: Box,
    currentSize: number,
    previousSize?: number,
    savedSize?: number,
    sizePercent: number
}

interface AccordionOptions {
    vertical?: boolean;
    color?: string;
    sections: AccordionSection[];
    minSize?: number
    minVerticalSize?: any
    minHorizontalSize?: any
    size?: number
}

interface BoxOptions {
    fixedSize?: number;
    hidden?: boolean;
    toolBars?: { [position in ToolbarPosition]?: Toolbar };
    ratio?: number;
    isMain?: boolean;
    vertical?: boolean;
    splitter?: boolean;
    color?: string;
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

export interface TabPanelOptions {
    title: string;
    active?: boolean;
    icon?: string;
}

export interface TabOptions extends TabPanelOptions{
    preview?: boolean;
    path: string;
    editorType?: EditorType;
}

export interface TabCommand extends Ace.Command{
    mac: string,
    win: string,
    desc: string,
    position?: number,
}

export interface PanelOptions extends TabPanelOptions {
    panelBody: Accordion | Box;
    location?: string;
    autoHide?: boolean;
}

export interface PanelManagerOptions {
    locations: LocationList;
    layout: Box;
}

export type LocationList = {
    [location in ToolbarPosition]?: PanelLocation;
};

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

export interface ToolBarOptions {
    size?: number;
    direction?: ToolbarDirection;
    position?: ToolbarPosition;
}

export type ToolbarPosition = "right" | "left" | "top" | "bottom";
export type ToolbarDirection = "vertical" | "horizontal";

interface ButtonOptions {
    disabled?: boolean;
    title?: string;
    value?: string;
    className?: string;
    onClick?: VoidFunction;
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