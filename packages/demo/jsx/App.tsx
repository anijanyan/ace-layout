import React, {useRef, useEffect} from 'react';
import {Box, BoxHandler, Button} from "react-ace-layout";
import {
    AceTreeWrapper,
    Button as AceButton,
    dom,
    FileSystemWeb,
    MenuManager,
    MenuToolbar,
    PanelManager,
    TabManager
} from "ace-layout";
import {PanelBar} from "ace-layout/widgets/toolbars/panelBar";
import {addExampleMenuItems, menuDefs} from "../menu_example";

const App = () => {
    const boxRef = useRef<BoxHandler>(null);
    const fileRef = useRef<BoxHandler>(null);
    const mainRef = useRef<BoxHandler>(null);
    const consoleRef = useRef<BoxHandler>(null);

    if (!menuDefs["View/Console"]) {
        menuDefs["View/Console"] = {
            properties: "700,check,false,false,F6",
            exec: () => consoleRef.current.boxInstance!.toggleShowHide()
        };
        addExampleMenuItems(MenuManager.getInstance(), "", menuDefs);
    }

    useEffect(() => {
        const fileSystem = new FileSystemWeb();

        const renderFileTree = () => {
            let button = new AceButton({value: "Open Folder"});
            let buttonWrapper = ["div", {}, button.render()];
            let aceTree = new AceTreeWrapper();
            let aceTreeWrapper = ["div", {style: "height: 100%"}, aceTree.element];
            button.element.addEventListener("mousedown", async (e) => {
                let nodes = await fileSystem.open();
                aceTree.updateTreeData(nodes);
                aceTree.element.addEventListener("item-click", (evt: CustomEvent) => {
                    fileSystem.openFile(evt.detail);
                });
            })
            dom.buildDom(["div", {style: "height: 100%"}, buttonWrapper, aceTreeWrapper], fileRef.current.boxInstance!.element);
        };

        renderFileTree();

        const handleResize = () => {
            boxRef.current?.boxInstance.setBox(0, 0, window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        const tabManager = TabManager.getInstance({
            containers: {
                main: mainRef.current.boxInstance,
                console: consoleRef.current.boxInstance
            },
            fileSystem: fileSystem
        });

        const panelManager = PanelManager.getInstance({
            layout: boxRef.current.boxInstance,
            locations: {
                left: {
                    parent: boxRef.current.boxInstance,
                    index: 0,
                    size: 200
                }
            }
        });

        window.onbeforeunload = function () {
            tabManager.saveTo(localStorage);
            localStorage.tabs = JSON.stringify(tabManager.toJSON());
            localStorage.panels = JSON.stringify(panelManager.toJSON());
        };

        let tabState = {};
        let panelState = {};
        try {
            if (localStorage.tabs)
                tabState = JSON.parse(localStorage.tabs);

            if (localStorage.panels)
                panelState = JSON.parse(localStorage.panels);
        } catch (e) {
        }
        tabManager.setState(tabState);
        panelManager.setState(panelState);

        tabManager.restoreFrom(localStorage);

        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <Box isRoot ref={boxRef} vertical={false} toolBars={{
        top: new MenuToolbar(),
        bottom: new PanelBar({})
    }}>
        <Box vertical={true} toolBars={{}}>
            <Box vertical={false}>
                <Box ref={fileRef} size={200}/>
                <Box ref={mainRef} isMain={true}/>
            </Box>
            <Box ref={consoleRef} isMain={true} ratio={1} size={100} buttons={[
                <Button title="F6" value="x" className="consoleCloseBtn" onClick={() => {
                    consoleRef.current.boxInstance!.hide();
                }}/>
            ]}/>
        </Box>
    </Box>;
};

export default App;