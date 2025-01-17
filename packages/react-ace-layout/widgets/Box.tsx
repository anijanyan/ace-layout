import React, {
    ReactElement,
    createContext,
    useRef,
    useMemo,
    useLayoutEffect,
    useEffect,
    useContext,
    forwardRef,
    useImperativeHandle
} from "react";
import {createRoot} from "react-dom/client";
import { Box as AceBox } from "ace-layout";
import {BoxOptions} from "ace-layout/widgets/widget";
import {Button} from "./Button";
export interface BoxHandler {
    boxInstance: AceBox | null;
}

export interface BoxProps extends BoxOptions {
    isRoot?: boolean;
    buttons?: ReactElement<typeof Button>[],
    children?: React.ReactNode;
}

interface BoxContextValue {
    parentBox: AceBox | null;
    childIndexRef: React.MutableRefObject<number>;
}

const BoxContext = createContext<BoxContextValue>({
    parentBox: null,
    childIndexRef: { current: 0 }
});

export const Box = forwardRef<BoxHandler, BoxProps>((props: BoxProps, ref: React.Ref<BoxHandler>) => {
    const {
        isRoot = false,
        buttons = [],
        children,
        ...boxOptions
    } = props;

    const boxRef = useRef<AceBox>(
        new AceBox(boxOptions)
    );

    const containerRef = useRef<HTMLDivElement>(null);

    const { parentBox, childIndexRef } = useContext(BoxContext);

    useEffect(() => {
        if (isRoot && containerRef.current) {
            const domNode = boxRef.current.render();
            containerRef.current.appendChild(domNode);
        }
        boxRef.current.setButtons(buttons.map((button) => {
            const buttonDomNode = document.createElement("div");
            const root = createRoot(buttonDomNode);
            root.render(button);
            return buttonDomNode;//TODO try to get rid of extra div
        }))
    }, [isRoot]);

    useLayoutEffect(() => {
        if (!isRoot && parentBox) {
            const i = childIndexRef.current;
            childIndexRef.current = i + 1;

            parentBox.addChildBox(i, boxRef.current);
            parentBox.resize();

            return () => {
                boxRef.current.remove();
            };
        }

        return () => {
            if (isRoot) {
                boxRef.current.remove();
            }
        };
    }, [isRoot, parentBox]);

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
            {isRoot && (
                <div ref={containerRef} />
            )}
            {children}
        </BoxContext.Provider>
    );
});
