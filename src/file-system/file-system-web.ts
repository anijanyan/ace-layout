import {Directory} from "./fileEntries";
import {EventEmitter} from "events";

export class FileSystemWeb extends EventEmitter {
    private directory: Directory | void;

    private get dir(): Directory {
        if (!this.directory)
            throw new Error("Accessing directory before created");
        return this.directory;
    }

    async open() {
        //TODO: this would work only on chrome
        const handle = await window
            //@ts-ignore
            .showDirectoryPicker()
            .catch((err) => console.error("showDirectoryPicker:", err.message));

        if (handle) {
            const {err, dir} = await Directory.openFilehandle(handle)
                .then((dir) => ({dir, err: null}))
                .catch((err) => ({err, dir: null}));

            this.directory = dir;
            return this.getFileTree();
        }
    }

    async getFileTree() {
        if (this.directory) {
            const nodes = [await this.dir.getFileTee()];
            return {nodes: nodes};
        }
    }

    async openFile(treeNode) {
        const file = await this.dir.getFileByPath(treeNode.path);
        const fileText = await file.getFileText();
        this.emit("openFile", treeNode, fileText);
    }
}
