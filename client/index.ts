import { render } from "react-dom";
import { createElement } from "react";
import App from "./App";

const domContainer = document.querySelector("#app");

render(createElement(App), domContainer);
