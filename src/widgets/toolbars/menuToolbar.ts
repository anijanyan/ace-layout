import {Toolbar} from "./toolbar";
import {dom} from "../../utils/dom";
import {MenuManager} from "../menu/menuManager";
import type {MenuBar} from "../menu/menu";

export class MenuToolbar extends Toolbar {
    menuBar: MenuBar;

    render() {
        if (!this.element) {
            this.element = dom.buildDom(["div", {
                class: "menuToolBar",
            }, [
                "div", {
                    class: "menuBar",
                    ref: "menuBar"
                }
            ]], undefined, this);
            let menuManager = MenuManager.getInstance();
            menuManager.build();
            menuManager.buildMenuBar(this.menuBar);
            menuManager.bindKeys();
        }
        return this.element
    }
    remove() {
    }
    toJSON() {
    }
}