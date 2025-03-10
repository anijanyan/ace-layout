import React, {
  useRef,
  useLayoutEffect,
  PropsWithChildren,
  forwardRef,
  useImperativeHandle,
} from "react";
import {AceTreeWrapper, LayoutHTMLElement} from "ace-layout";

export interface AceTreeHandler {
    aceTreeInstance: AceTreeWrapper | null;
}

export const AceTree = forwardRef<AceTreeHandler, PropsWithChildren>(
  (props, ref) => {
    const {children} = props;
    const treeRef = useRef<AceTreeWrapper>(new AceTreeWrapper());
    const treeElementRef = useRef<LayoutHTMLElement>(null);

    useLayoutEffect(() => {
        treeRef.current.element = treeElementRef.current!;
        treeRef.current.render();
        return () => {
            treeRef.current.remove();
        };
    }, []);

    useImperativeHandle(ref, () => ({
      aceTreeInstance: treeRef.current,
    }));

    return <div ref={treeElementRef}>
        {children}
    </div>;
});
