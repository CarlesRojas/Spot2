import React from "react";
import ReactDOM from "react-dom";

import EventsPubSub from "./EventsPubSub";
import PlaybackContextProvider from "./contexts/PlaybackContext";
import SpotifyContextProvider from "./contexts/SpotifyContext";
import LibraryContextProvider from "./contexts/LibraryContext";
import PopupContextProvider from "./contexts/PopupContext";
import ProfileContextProvider from "./contexts/ProfileContext";
import QueueContextProvider from "./contexts/QueueContext";

import App from "./App";

import "./index.css";

// Pubsub and soptify api
window.PubSub = new EventsPubSub();
window.serverLocation = "http://localhost:8888/";

// Disable right click
document.oncontextmenu = () => false;

// Render app
ReactDOM.render(
    <SpotifyContextProvider>
        <PlaybackContextProvider>
            <LibraryContextProvider>
                <QueueContextProvider>
                    <ProfileContextProvider>
                        <PopupContextProvider>
                            <App />
                        </PopupContextProvider>
                    </ProfileContextProvider>
                </QueueContextProvider>
            </LibraryContextProvider>
        </PlaybackContextProvider>
    </SpotifyContextProvider>,
    document.getElementById("root")
);
