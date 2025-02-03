import React, {
    createContext,
    useRef,
    useMemo,
    useLayoutEffect,
    useContext,
    forwardRef,
    useImperativeHandle,
    useEffect
} from "react";
import {createRoot} from "react-dom/client";
import { Box as AceBox } from "ace-layout";
import {BoxOptions} from "ace-layout";
export interface BoxHandler {
    boxInstance: AceBox | null;
}

interface BoxContextValue {
    parentBox: AceBox | null;
    childIndexRef: React.MutableRefObject<number>;
}

const BoxContext = createContext<BoxContextValue>({
    parentBox: null,
    childIndexRef: { current: 0 }
});

import { ReactNode, ReactElement } from 'react';

type BoxElement = ReactElement<BoxProps, typeof Box>;

type AllowedChildren = BoxElement | ReactElement;

interface BoxProps extends BoxOptions{
    buttons?: ReactNode[];
    children?: AllowedChildren;
}
export const Box = forwardRef((props: BoxProps, ref: React.Ref<BoxHandler>) => {
    const {
        buttons = [],
        children,
        ...boxOptions
    } = props;

    const boxRef = useRef<AceBox>(
        new AceBox(boxOptions)
    );

    const boxElement = useRef<HTMLDivElement>(null);
    const { parentBox, childIndexRef } = useContext(BoxContext);

    function render() {
        boxRef.current.element = boxElement.current;
        boxRef.current.render();
    }

    function setButtons() {
        boxRef.current.setButtons(buttons.map((button) => {
            const buttonDomNode = document.createElement("div");
            const root = createRoot(buttonDomNode);
            root.render(button);
            return buttonDomNode;//TODO try to get rid of extra div
        }))
    }

    function addToParent() {
        const i = childIndexRef.current;
        childIndexRef.current = i + 1;

        parentBox.addChildBox(i, boxRef.current);
    }

    useLayoutEffect(() => {
        render();
        setButtons();
        parentBox && addToParent();

        return () => {
            boxRef.current.remove();
        };
    }, [parentBox]);

    useEffect(() => {
        //TODO update props
    }, [props]);

    const myContextValue = useMemo<BoxContextValue>(() => {
        return {
            parentBox: boxRef.current,
            childIndexRef: { current: 0 }
        };
    }, []);

    useImperativeHandle(ref, () => ({
        boxInstance: boxRef.current,
    }));

    return (
        <BoxContext.Provider value={myContextValue}>
            <div ref={boxElement} className={"box"}>
                {children}
            </div>
        </BoxContext.Provider>
    );
});
