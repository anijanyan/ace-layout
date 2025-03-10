import React, { useRef, useLayoutEffect, PropsWithChildren } from "react";
import { Button as AceButton, ButtonOptions, LayoutHTMLElement } from "ace-layout";

export const Button = (props: PropsWithChildren<ButtonOptions>) => {
    const {children, ...buttonOptions} = props;
    const buttonRef = useRef<AceButton>(new AceButton(buttonOptions));
    const buttonElementRef = useRef<LayoutHTMLElement>(null);

    useLayoutEffect(() => {
        buttonRef.current.element = buttonElementRef.current!;
        buttonRef.current.render();
        return () => {
            buttonRef.current.remove();
        };
    }, []);

    return <div ref={buttonElementRef}>
        {children}
    </div>;
};
