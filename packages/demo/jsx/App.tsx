import React, {useRef, useEffect} from 'react';
import {Box, BoxHandler, Button, AceTree, AceTreeHandler} from "react-ace-layout";
import {
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

    const aceTreeRef = useRef<AceTreeHandler>(null);

    const fileSystem = new FileSystemWeb();

    const openFolder = async (e) => {
        const nodes = await fileSystem.open();
        const aceTree = aceTreeRef.current.aceTreeInstance;
        aceTree.updateTreeData(nodes);
        aceTree.element.addEventListener("item-click", (evt: CustomEvent) => {
            fileSystem.openFile(evt.detail);
        });
    }

    if (!menuDefs["View/Console"]) {
        menuDefs["View/Console"] = {
            properties: "700,check,false,false,F6",
            exec: () => consoleRef.current.boxInstance!.toggleShowHide()
        };
        addExampleMenuItems(MenuManager.getInstance(), "", menuDefs);
    }

    useEffect(() => {
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

    return <Box ref={boxRef} vertical={false} toolBars={{
        top: new MenuToolbar(),
        bottom: new PanelBar({})
    }}>
        <Box vertical={true}>
            <Box vertical={false}>
                <Box ref={fileRef} size={200}>
                    <Button onClick={openFolder}>
                        {"Open Folder"}
                    </Button>
                    <AceTree ref={aceTreeRef}/>
                </Box>
                <Box ref={mainRef} isMain={true}/>
            </Box>
            <Box ref={consoleRef} isMain={true} ratio={1} size={100} buttons={[
                <Button title="F6" className="consoleCloseBtn" onClick={() => {
                    consoleRef.current.boxInstance!.hide();
                }}>
                    {"x"}
                </Button>
            ]}/>
        </Box>
    </Box>;
};

export default App;