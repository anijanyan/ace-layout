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
