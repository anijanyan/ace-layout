import React, { useRef, useLayoutEffect, PropsWithChildren } from "react";
import { Button as AceButton } from "ace-layout";
import { ButtonOptions } from "ace-layout/widgets/widget";

export const Button = (props: PropsWithChildren<ButtonOptions>) => {
    const {children, ...buttonOptions} = props;
    const buttonRef = useRef<AceButton>(new AceButton(buttonOptions));
    const buttonElementRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        buttonRef.current.element = buttonElementRef.current;
        buttonRef.current.render();
        return () => {
            buttonRef.current.remove();
        };
    }, []);

    return <div ref={buttonElementRef}>
        {children}
    </div>;
};
