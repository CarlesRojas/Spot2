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
window.serverLocation = "https://ec2-18-191-231-228.us-east-2.compute.amazonaws.com:443/"; //"http://localhost:443/";

// Disable right click
document.oncontextmenu = () => false;

// Render app
ReactDOM.render(
    <LibraryContextProvider>
        <PlaybackContextProvider>
            <SpotifyContextProvider>
                <QueueContextProvider>
                    <ProfileContextProvider>
                        <PopupContextProvider>
                            <App />
                        </PopupContextProvider>
                    </ProfileContextProvider>
                </QueueContextProvider>
            </SpotifyContextProvider>
        </PlaybackContextProvider>
    </LibraryContextProvider>,
    document.getElementById("root")
);
