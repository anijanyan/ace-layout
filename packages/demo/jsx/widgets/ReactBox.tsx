import React, {
    createContext,
    useRef,
    useMemo,
    useLayoutEffect,
    useEffect,
    useContext,
    forwardRef,
    useImperativeHandle
} from "react";
import { Box } from "ace-layout";
import {BoxOptions} from "ace-layout/widgets/widget";
export interface ReactBoxHandle {
    boxInstance: Box | null;
}

export interface ReactBoxProps extends BoxOptions{
    isRoot?: boolean;
    children?: React.ReactNode;
}

interface BoxContextValue {
    parentBox: Box | null;
    childIndexRef: React.MutableRefObject<number>;
}

const BoxContext = createContext<BoxContextValue>({
    parentBox: null,
    childIndexRef: { current: 0 }
});

export const ReactBox = forwardRef<ReactBoxHandle, ReactBoxProps>((props, ref) => {
    const {
        isRoot = false,
        children,
        ...boxOptions
    } = props;

    const boxRef = useRef<Box>(
        new Box(boxOptions)
    );

    const containerRef = useRef<HTMLDivElement>(null);

    const { parentBox, childIndexRef } = useContext(BoxContext);

    useEffect(() => {
        if (isRoot && containerRef.current) {
            const domNode = boxRef.current.render();
            containerRef.current.appendChild(domNode);
        }
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
