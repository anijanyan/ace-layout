"use strict";

import React from 'react';
import App from "./widgets/App";
import {createRoot} from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement)
    throw new Error("Failed to find the root element");
const root = createRoot(rootElement);
root.render(<App/>);