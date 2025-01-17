import React, { useRef, useLayoutEffect, useEffect } from "react";
import { Button as AceButton } from "ace-layout";
import { ButtonOptions } from "ace-layout/widgets/widget";

export const Button: React.FC<ButtonOptions> = (props: ButtonOptions) => {
    const buttonRef = useRef<AceButton>(new AceButton(props));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const domNode = buttonRef.current.render();
            containerRef.current.appendChild(domNode);
        }
    }, []);

    useLayoutEffect(() => {
        return () => {
            buttonRef.current.remove();
        };
    }, []);

    return <div ref={containerRef} />;
};
