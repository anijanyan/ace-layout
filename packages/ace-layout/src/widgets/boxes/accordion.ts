import {AccordionHandler} from "../../mouse/accordion_handler";
import {Box} from "./box";
import {Utils} from "../../utils/lib";

import {AccordionOptions, AccordionSection, Widget} from "../widget";
import {dom} from "../../utils/dom";
import * as accordionCSS from "../../../assets/styles/accordion.css";

dom.importCssString(accordionCSS, "accordion.css");

const BOX_MIN_SIZE = 80;

export class Accordion extends Box implements Widget {//TODO extending from Box isn't right
    toggleBarList: HTMLElement[] = [];
    splitterList: HTMLElement[] = [];
    toggleBlockList: HTMLElement[] = [];
    boxMinSize: number = 30;
    toggleBarHeight: number = 20;
    splitterSize: number = 1;
    vertical: boolean;
    color: string;
    sections: AccordionSection[];
    minSize: number;
    minVerticalSize: number;
    minHorizontalSize: number;
    padding: { top: number; left: number; bottom: number; right: number };
    size?: number;
    nextChangedIndexes?: number[];
    prevChangedIndexes?: number[];
    rect: [number, number, number, number];
    hidden: boolean;
    parent: Box;

    constructor(options: AccordionOptions) {
        super(options);
        this.vertical = options.vertical || false;
        this.color = options.color ?? "";
        this.sections = options.sections;
        this.minSize = options.minSize || BOX_MIN_SIZE;
        this.minVerticalSize = options.minVerticalSize || this.minSize;
        this.minHorizontalSize = options.minHorizontalSize || this.minSize;
        this.padding = {top: 0, right: 0, bottom: 0, left: 0};
        this.size = options.size;
    }

    hasNextOpenedBlocks(index: number): boolean {
        for (let i = index; i < this.toggleBlockList.length; i++) {
            if (this.isOpenedByIndex(i))
                return true;
        }

        return false;
    }

    hasPrevOpenedBlocks(index: number): boolean {
        for (let i = index - 1; i >= 0; i--) {
            if (this.isOpenedByIndex(i))
                return true;
        }

        return false;
    }

    isOpenedByIndex(index: number): boolean {
        return this.isOpenedBlock(this.toggleBlockList[index]);
    }

    isOpenedBlock(toggleBlock: HTMLElement): boolean {
        return toggleBlock.classList.contains("toggle-opened");
    }

    keepState() {
        this.nextChangedIndexes = [];
        this.prevChangedIndexes = [];
        for (let i = 0; i < this.toggleBlockList.length; i++) {
            if (this.isOpenedByIndex(i)) {
                let section = this.sections[i];
                section.previousSize = section.currentSize;
            }
        }
    }

    dischargeState() {
        this.nextChangedIndexes = undefined;
        this.prevChangedIndexes = undefined;
        for (let i = 0; i < this.toggleBlockList.length; i++) {
            if (this.isOpenedByIndex(i))
                this.sections[i].previousSize = undefined;
        }
    }

    recalculatePreviousSectionsSize(index: number, top: number, maxChangeSize?: number): number {
        let changedSize = 0;
        for (let i = index - 1; i >= 0; i--) {
            if (this.isOpenedByIndex(i)) {
                let section = this.sections[i];
                let rect = section.box.element.getBoundingClientRect();
                let done = false;
                let prevSize = rect.height;
                let currentSize = Math.max(top - rect.top, this.boxMinSize);
                top -= rect.height;
                if (currentSize < prevSize) {
                    if (currentSize > this.boxMinSize)
                        done = true;

                    if (!this.prevChangedIndexes!.includes(i))
                        this.prevChangedIndexes!.unshift(i);

                    section.currentSize = currentSize;
                    changedSize += (prevSize - currentSize);
                    if (done || (maxChangeSize != undefined && changedSize >= maxChangeSize))
                        break;
                }
            }

            top -= this.toggleBarHeight;
        }

        return changedSize;
    }

    recalculateNextSectionsSize(index: number, top: number, maxChangeSize?: number): number {
        let changedSize = 0;
        for (let i = index; i < this.toggleBlockList.length; i++) {
            if (this.isOpenedByIndex(i)) {
                let section = this.sections[i];
                let rect = section.box.element.getBoundingClientRect();
                let done = false;
                let prevSize = rect.height;
                let currentSize = Math.max(rect.bottom - top - this.toggleBarHeight, this.boxMinSize);
                top += rect.height;

                if (currentSize < prevSize) {
                    if (currentSize > this.boxMinSize)
                        done = true;

                    if (!this.nextChangedIndexes!.includes(i))
                        this.nextChangedIndexes!.unshift(i);

                    section.currentSize = currentSize;
                    changedSize += (prevSize - currentSize);
                    if (done || (maxChangeSize != undefined && changedSize >= maxChangeSize))
                        break;
                }
            }

            top += this.toggleBarHeight;
            top += this.splitterSize;
        }

        return changedSize;
    }

    restoreChangedSizes(size: number, changedIndexes) {
        if (!changedIndexes)
            return size;

        while (changedIndexes.length && size > 0) {
            let index = changedIndexes[0];
            let section = this.sections[index];
            let currSize = section.currentSize!;
            section.currentSize = Math.min(section.previousSize!, currSize + size);
            size -= (section.currentSize - currSize);
            if (section.currentSize >= section.previousSize!)
                changedIndexes.shift();
        }

        return size;
    }

    expandPreviousSections(index: number, size: number) {
        size = this.restoreChangedSizes(size, this.prevChangedIndexes);
        if (size <= 0)
            return;

        let openedSectionsList: AccordionSection[] = [];
        for (let i = index - 1; i >= 0; i--) {
            if (this.isOpenedByIndex(i))
                openedSectionsList.push(this.sections[i]);
        }

        this.applySizeToOpenedSections(size, openedSectionsList);
    }

    expandNextSections(index: number, size: number) {
        size = this.restoreChangedSizes(size, this.nextChangedIndexes);
        if (size <= 0)
            return;

        let openedSectionsList: AccordionSection[] = [];
        for (let i = index; i < this.toggleBlockList.length; i++) {
            if (this.isOpenedByIndex(i)) {
                openedSectionsList.push(this.sections[i]);
            }
        }

        this.applySizeToOpenedSections(size, openedSectionsList);
    }

    applySizeToOpenedSections(size: number, openedSections: AccordionSection[]) {
        let count = openedSections.length;
        if (!count) return;

        let remainder = size % count;
        let addSize = (size - remainder) / count;

        for (let i = 0; i < count; i++) {
            openedSections[i].currentSize! += addSize;
        }
        openedSections[0].currentSize! += remainder;
    }

    resize() {
        this.$updateChildSize(...this.rect);
    }

    render() {
        if (this.element)
            return this.element;

        this.element = dom.buildDom(["div", {
            class: "box accordion",
            $host: this,
        }]);

        let section: AccordionSection;
        let splitter: HTMLElement;
        let toggleBlock: HTMLElement;
        let toggleBar: HTMLElement;

        for (let i = 0; i < this.sections.length; i++) {
            section = this.sections[i];

            if (i > 0) {
                splitter = dom.buildDom(["div", {
                    class: `splitter accordion-splitter splitter${this.vertical ? "-v" : "-h"}`,
                    $index: i - 1,
                    $parent: this,
                    onmousedown: function (e) {
                        AccordionHandler.splitterMouseDown(e);
                    }
                }, ["div"]]);

                this.element.appendChild(splitter);
                this.splitterList.push(splitter);
            }

            toggleBlock = dom.buildDom(["div", {
                class: `toggle-block`,
                $index: i,
                $parent: this
            }]);

            toggleBar = dom.buildDom(["div", {
                class: `toggle-bar toggle-bar${this.vertical ? "-v" : "-h"}`,
                onmousedown: function (e) {
                    AccordionHandler.toggleBarMouseDown(e, Accordion)
                },
                onclick: function (e) {
                    AccordionHandler.toggleBarOnClick(e)
                }
            }, ["div", {class: "title"}, section.title]]);


            section.currentSize = section.savedSize = parseInt(section.box.size?.toString() ?? "", 10);

            toggleBlock.appendChild(toggleBar);
            this.toggleBarList.push(toggleBar);
            toggleBlock.appendChild(section.box.render());

            this.element.appendChild(toggleBlock);
            this.toggleBlockList.push(toggleBlock);
        }

        this.element.style.backgroundColor = this.color;
        this.element.style.position = "absolute";

        this.calculateSectionsSizesPercents();

        return this.element;
    }

    calculateSectionsSizesPercents() {
        let totalSize = 0;
        let actualSizes: number[] = [];

        for (let i = 0; i < this.sections.length; i++) {
            let section = this.sections[i];
            actualSizes.push(this.isOpenedByIndex(i) ? section.currentSize! : section.savedSize!);
            totalSize += actualSizes[i];
        }


        let minPercent = Math.floor(this.boxMinSize / totalSize * 100);
        let maxPercent = 100 - minPercent * (this.sections.length - 1);


        let totalPercent = 0;
        for (let i = 0; i < this.sections.length; i++) {
            let section = this.sections[i];
            section.sizePercent = Math.floor(actualSizes[i] / totalSize * 100);
            section.sizePercent = Math.min(Math.max(section.sizePercent, minPercent), maxPercent);
            totalPercent += section.sizePercent;
        }

        if (totalPercent !== 100)
            this.sections[this.sections.length - 1].sizePercent! += (100 - totalPercent);
    }

    setBox(x, y, w, h) {
        this.rect = [x, y, w, h];
        Utils.setBox(this.element, x, y, w, h);
        this.recalculateChildrenSizes();
        this.$updateChildSize(x, y, w, h);
    }

    recalculateChildrenSizes(index?: number) {
        let height = this.rect[3];
        height -= this.toggleBarHeight * this.toggleBarList.length;
        height -= this.splitterSize * this.splitterList.length;
        let totalSize = 0;
        let openedIndexes: number[] = [];

        for (let i = 0; i < this.sections.length; i++) {
            let section = this.sections[i];

            section.currentSize = Math.max(Math.floor((height * section.sizePercent!) / 100), this.boxMinSize);
            if (this.isOpenedByIndex(i)) {
                totalSize += section.currentSize;
                openedIndexes.push(i);
            } else {
                section.savedSize = section.currentSize;
                section.currentSize = 0;
            }
        }
        let spareSize = height - totalSize;

        if (!spareSize)
            return;

        if (index !== undefined) {
            let prevOpenedIndexes: number[] = [];
            while (openedIndexes.length && openedIndexes[0] < index) {
                prevOpenedIndexes.push(openedIndexes.shift()!);
            }
            if (!openedIndexes.length)
                openedIndexes = prevOpenedIndexes;
        }

        let prevSize, changedSize, openedBoxesCount, remainder, addSize;

        while (openedIndexes.length && spareSize) {
            let changedIndexes: number[] = [];
            openedBoxesCount = openedIndexes.length;

            remainder = spareSize % openedBoxesCount;
            addSize = (spareSize - remainder) / openedBoxesCount;
            for (let i = 0; i < openedIndexes.length; i++) {
                let section = this.sections[openedIndexes[i]];
                prevSize = section.currentSize;
                if (openedBoxesCount === 1)
                    addSize += remainder;

                section.currentSize += addSize;
                section.currentSize = Math.max(section.currentSize!, this.boxMinSize);

                changedSize = section.currentSize - prevSize;

                spareSize -= changedSize;
                openedBoxesCount--;

                if (changedSize < 0)
                    changedIndexes.push(openedIndexes[i]);
            }

            openedIndexes = changedIndexes;
        }
    }

    $updateChildSize(x, y, w, h) {
        x = 0;
        y = 0;

        for (let i = 0; i < this.toggleBlockList.length; i++) {
            let toggleBlock = this.toggleBlockList[i];
            let section = this.sections[i];
            let boxSize = section.currentSize!;

            h = this.toggleBarHeight + boxSize;
            Utils.setBox(toggleBlock, x, y, w, h);
            y += this.toggleBarHeight;
            section.box.setBox(0, this.toggleBarHeight, w, boxSize);

            y += boxSize;

            if (this.splitterList[i]) {
                Utils.setBox(this.splitterList[i], x, y, w, this.splitterSize);
                y += this.splitterSize;
            }
        }
    }

    remove() {
        if (this.element) this.element.remove();
        if (this.parent) {
            if (this.vertical === this.parent.vertical)
                this.parent.minSize -= this.minSize;//TODO why did we need this?

            if (this.parent[0] == this) this.parent[0] = undefined;
            if (this.parent[1] == this) this.parent[1] = undefined;
        }
    }

    toJSON() {
        let sections: any[] = [];
        let section: AccordionSection;

        for (let i = 0; i < this.sections.length; i++) {
            section = this.sections[i];
            sections.push({
                title: section.title,
                boxData: section.box.toJSON()
            });
        }

        return {
            type: "accordion",
            vertical: this.vertical,
            size: this.size,
            sections: sections
        }
    }
}
