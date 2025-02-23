import {Tree, DataProvider} from "./ace-tree-lib";
import {LayoutHTMLElement, Widget} from "../widget";
import {dom} from "../../utils/dom";
import oop = require("ace-code/src/lib/oop");
import {EventEmitter} from "ace-code/src/lib/event_emitter";
import {getIconUrl} from "../../file-system/file-type-icons";
import * as aceTreeCSS from "../../../assets/styles/ace-tree.css";

dom.importCssString(aceTreeCSS, "ace-tree.css");

function transform(node) {
    const path = node["path"] || "";
    const name = path.slice(path.lastIndexOf("/") + 1);
    let children = node["nodes"] || node["children"];
    if (children) children = children.map(transform);

    return {
        fsNode: node,
        name,
        children,
    };
}

export class AceTreeWrapper implements Widget{
    tree: Tree;
    private model: DataProvider;
    element: LayoutHTMLElement;

    render() {
        if (this.tree) {
            return this.element;
        }
        this.element ??= dom.buildDom(["div"]);
        this.element.className = "ace-tree-wrapper";
        this.tree = new Tree(this.element);
        this.model = new DataProvider({});
        this.setupAceTree();
        return this.element;
    }
    remove() {
        this.element.remove();
    }
    toJSON() {
        return {};
    }

    private setupAceTree() {
        this.tree.setDataProvider(this.model);
        this.provideIcons();

        if (
            typeof window !== "undefined"
        ) {
            window["fileTree"] = this.tree;
        }
    }

    public updateTreeData(fileTree) {
        const model = this.model;
        const tree = this.tree;

        if (!model.root || model.root.fsNode != fileTree) {
            const treeNodes = transform(fileTree);

            if (treeNodes.children.length == 1) {
                treeNodes.children[0].isOpen = true;
            }

            model.setRoot(treeNodes);

            tree.on("afterChoose", () => {
                //@ts-ignore
                const fsNode = tree.selection.getCursor()?.fsNode;

                if (fsNode && fsNode.kind != "directory") {
                    const event = new CustomEvent("item-click", {
                        detail: fsNode,
                    });
                    this.element.dispatchEvent(event);
                }
            });
        }

        this.tree.resize();
    }

    provideIcons() {
        this.model.getIconHTML = function (node) {
            const treeNode = node.fsNode;
            const isDir = treeNode.kind === "directory";
            const size = 16;
            return `<span class="file-icon">
<svg width="${size}" height="${size}">
     <image xlink:href="${getIconUrl(
                treeNode.path,
                isDir
            )}" width="${size}" height="${size}"/>
</svg>
</span>`;
        };
    }
}

oop.implement(AceTreeWrapper.prototype, EventEmitter);
