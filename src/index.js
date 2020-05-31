import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import App from "./App";
import SpotifyContextProvider from "./context/SpotifyContext";
import EventsPubSub from "./EventsPubSub";

window.PubSub = new EventsPubSub();
document.oncontextmenu = () => false;
ReactDOM.render(
    <SpotifyContextProvider>
        <App />
    </SpotifyContextProvider>,
    document.getElementById("root")
);
