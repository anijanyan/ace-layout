import {Utils} from "../../utils/lib";

import {DropdownElement, DropdownOptions} from "../widget";
import {dom} from "../../utils/dom";
import * as dropdownCSS from "../../../assets/styles/dropdown.css";
import * as menuCSS from "../../../assets/styles/menu.css";

dom.importCssString(dropdownCSS, "dropdown.css");
dom.importCssString(menuCSS, "menu.css");

const DEFAULT_WIDTH = 200;

export class Dropdown {
    lbl: any;
    disabled: boolean;
    items: any;
    value?: string;
    className?: string;
    width: number;
    options: any;
    element: any;
    popup: Popup;
    isPopupOpen: boolean;

    constructor(options: DropdownOptions) {
        let {disabled, items, value, className, width, ...other} = options;
        this.disabled = disabled ?? false;
        this.items = items;
        this.value = value ?? items[0].value;
        this.className = className || "black_dropdown";
        this.width = width ?? DEFAULT_WIDTH;
        this.options = other;
    }

    render() {
        this.element = dom.buildDom(["div", {
            class: this.className + (this.disabled ? this.className + "Disabled" : ""),
            style: "width: " + this.width + "px",
            onmousedown: (e) => {
                e.preventDefault();
                this.element.className = this.className + " " + this.className + "Down";
                this.togglePopup();
            },
            onmouseup: (e) => {
                this.element.className = this.className;
            },
            onmouseover: (e) => {
                this.element.className = this.className + " " + this.className + "Over";
            },
            onfocus: (e) => {
                this.element.className = this.className + " " + this.className + "Focus";
            },
            onunfocus: (e) => {
                this.element.className = this.className;
            },
            onmouseout: (e) => {
                this.element.className = this.className;
            },
            ...this.options
        }, [
            ["div", {
                class: "lbl",
                ref: "lbl"
            }],
            ["div", {
                class: "button"
            }]
        ]], undefined, this);

        this.element.$host = this;
        this.updateLabel();
        return this.element;
    }

    onMouseDown = (e) => {
        e.preventDefault()
        let node = Utils.findNode(e.target, this.className)
        if (node && node == this.element) return;
        node = Utils.findNode(e.target, this.popup.element.className)
        if (node && node == this.popup.element) return;

        this.closePopup()
    }

    onMouseWheel = (e) => {
        this.closePopup()
    }

    togglePopup() {
        if (this.isPopupOpen) {
            this.closePopup();
        } else {
            this.openPopup();
        }
    }

    openPopup() {
        if (this.isPopupOpen) return;
        this.popup = new Popup();
        // this.popup.direction = direction;
        this.popup.items = this.items;
        this.popup.selectedItem = this.value;
        this.popup.parent = this;
        this.popup.selectCallback = (host) => {
            this.select(host.value)
            this.closePopup();
        }
        this.popup.open();
        window.addEventListener("mousedown", this.onMouseDown);
        window.addEventListener("wheel", this.onMouseWheel);
        this.isPopupOpen = true;
    }

    closePopup() {
        if (!this.isPopupOpen) return;
        this.popup.close();
        this.isPopupOpen = false;
        window.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("wheel", this.onMouseWheel);
    }

    select(value) {
        this.setValue(value)
    }

    setValue(value) {
        if (this.value !== value) {
            this.value = value;
            this.updateLabel();
        }
    }

    updateLabel() {
        let items = this.items
        for (let i = 0; i < items.length; i++) {
            let x = items[i];
            let itemValue = x.value;
            if (this.value === itemValue) {
                this.lbl.innerHTML = x.caption;
                return;
            }
        }
    }

    toJSON() {
    }
}


class Popup {
    items: DropdownElement[];
    selectedItem?: string;
    parent: Dropdown;
    selectCallback: (host) => void;
    activeItem;
    element: any;
    isSubMenu: any;
    position: any;
    direction: string;
    selectedMenu: any;

    open() {
        this.build();
        this.render();
    }

    build() {
        if (this.element) {
            return;
        }

        let result: any[] = [];

        if (this.items) {
            let items = Object.values(this.items).sort(function (item1, item2) {
                return item1.position - item2.position;
            });
            let afterDivider = true;
            result = items
                .map((item) => {
                    if (item.caption[0] === "~") {
                        if (afterDivider) return;
                        afterDivider = true;
                        return [
                            "div",
                            {
                                class: "menu_divider",
                                $host: item,
                            },
                        ];
                    }
                    afterDivider = false;
                    let classList = ["menu_item"];
                    if (item.checked) classList.push(item.type === "check" ? "checked" : "selected");
                    if (item.map) classList.push("submenu");
                    if (item.disabled) classList.push("disabled");
                    if (item.value === this.selectedItem) classList.push("selected")
                    return [
                        "div",
                        {
                            class: classList.join(" "),
                            $host: item,
                        },
                        ["u", " "],
                        ["a", item.caption + ""],
                        [
                            "span",
                            {
                                class: "shortcut",
                            },
                            item.hotKey,
                        ],
                    ];
                })
                .filter(Boolean);
            if (afterDivider) result.pop();
        }

        this.element = dom.buildDom(
            [
                "blockquote",
                {
                    class: "menu",
                    style: "display:block",
                    $host: this.parent,
                    onmousemove: this.onMouseMove.bind(this),
                    onclick: this.onClick.bind(this)
                },
                result,
            ],
            document.body
        );
    }

    render() {
        if (this.element.style.maxWidth) {
            this.element.style.maxWidth = window.innerWidth + "px";
        }
        if (this.element.style.maxHeight) {
            this.element.style.maxHeight = window.innerHeight + "px";
        }

        let elRect = this.element.getBoundingClientRect();

        let edge = Utils.getElementEdges(this.element);

        let parentRect, top, left;

        if (this.parent && this.parent.element) {
            parentRect = this.parent.element.getBoundingClientRect();
        }

        if (parentRect) {
            if (this.isSubMenu) {
                top = parentRect.top - edge.top;
                left = parentRect.right;
            } else {
                top = parentRect.bottom;
                left = parentRect.left;
            }
        } else {
            top = this.position.y;
            left = this.position.x
        }

        let targetH = Math.min(elRect.height, window.innerHeight);
        let availableH = window.innerHeight - top - edge.top - edge.bottom - 2;

        if (availableH < targetH && (!parentRect || this.isSubMenu)) {
            let tmpTop = parentRect ? window.innerHeight : top;
            top = tmpTop - targetH - edge.top;
            // top = Math.max(top, this.menuManager.menuBar.bottom);//TODO menuManager
            availableH = window.innerHeight - top - edge.top - edge.bottom - 2;
        }
        this.element.style.maxHeight = (availableH - 10) + "px";
        elRect = this.element.getBoundingClientRect();

        let availableW = window.innerWidth - left - edge.left - edge.right - 2;
        if (availableW < elRect.width) {
            if (parentRect) {
                let tmpLeft = this.isSubMenu ? parentRect.left : parentRect.right;
                if (tmpLeft > availableW) {
                    this.direction = "left";
                    left = tmpLeft - elRect.width + edge.left;
                    left = Math.max(left, 0);
                    availableW = tmpLeft + edge.left + edge.right;
                }
                if (availableW < elRect.width) {
                    this.element.style.maxWidth = availableW + "px";
                    this.element.style.overflowX = "auto";
                }
            } else {
                left = window.innerWidth - elRect.width - edge.left - edge.right;
            }
        }

        this.element.style.top = top + "px";
        this.element.style.left = left + "px";
        this.element.style.position = "absolute";
        this.element.style.zIndex = 195055;
        this.element.style.overflowY = "auto";
    }

    close() {
        if (this.element) {
            this.element.remove();
            delete this.element;
        }
    }

    scrollIfNeeded() {
        if (!this.selectedMenu) {
            return;
        }
        let menu = this.element;
        let item = this.selectedMenu.buttonElement;
        let menuRect = menu.getBoundingClientRect();
        let itemRect = item.getBoundingClientRect();

        if (itemRect.top < menuRect.top) {
            item.scrollIntoView(true);
        } else if (itemRect.bottom > menuRect.bottom) {
            item.scrollIntoView(false);
        }
    }

    //handle events
    onMouseMove(e) {
        if (e.target === this.element) {
            return;
        }

        let target = Utils.findHostTarget(e.target);
        if (target === this.element) {
            return;
        }

        if (target == this.activeItem) {
            return;
        }
        if (this.activeItem) {
            this.activeItem.classList.remove("hover")
        }

        this.activeItem = target
        this.activeItem.classList.add("hover")
    }

    onClick(e) {
        if (e.target === this.element)
            return;

        let target = Utils.findHostTarget(e.target);
        if (target === this.element)
            return;

        let host = target.$host;
        this.selectCallback && this.selectCallback(host)
    }
}
