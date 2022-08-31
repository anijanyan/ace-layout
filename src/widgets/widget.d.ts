/**
 * Interface for classes that represent a widgets.
 *
 */
import {Box} from "./box";

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
    size?: number
    0?: Box;
    1?: Box;
}