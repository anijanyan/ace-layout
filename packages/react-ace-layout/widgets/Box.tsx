import React, {
    createContext,
    useRef,
    useMemo,
    useLayoutEffect,
    useContext,
    forwardRef,
    useImperativeHandle,
    useEffect,
} from "react";
import {createRoot} from "react-dom/client";
import { Box as AceBox, BoxOptions, LayoutHTMLElement } from "ace-layout";
export interface BoxHandler {
    boxInstance: AceBox | null;
}

interface BoxContextValue {
    parentBox: AceBox | null;
    childPlacementRef: React.RefObject<boolean>;
}

const BoxContext = createContext<BoxContextValue>({
    parentBox: null,
    childPlacementRef: { current: false }
});

import { ReactNode, ReactElement } from 'react';

type BoxElement = ReactElement<BoxProps, typeof Box>;

type AllowedChildren = BoxElement[] | ReactElement;

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

    const boxElement = useRef<LayoutHTMLElement>(null);
    const { parentBox, childPlacementRef } = useContext(BoxContext);

    function render() {
        boxRef.current.element = boxElement.current!;
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
        const far = childPlacementRef.current;
        childPlacementRef.current = !far;

        (parentBox as AceBox).addChildBox(boxRef.current, far);
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
            childPlacementRef: { current: false }
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
