import React from "react";
import ReactDOM from "react-dom";

import EventsPubSub from "./EventsPubSub";
import PlaybackContextProvider, { PlaybackContext } from "./contexts/PlaybackContext";
import SpotifyContextProvider from "./contexts/SpotifyContext";
import LibraryContextProvider from "./contexts/LibraryContext";
import PopupContextProvider from "./contexts/PopupContext";
import ProfileContextProvider from "./contexts/ProfileContext";

import App from "./App";

import "./index.css";

// Pubsub and soptify api
window.PubSub = new EventsPubSub();
window.serverLocation = "http://localhost:8888/";

// Disable right click
document.oncontextmenu = () => false;

// Render app
ReactDOM.render(
    <LibraryContextProvider>
        <PlaybackContextProvider>
            <PlaybackContext.Consumer>
                {(playbackContext) => {
                    return (
                        <SpotifyContextProvider playbackContext={playbackContext}>
                            <ProfileContextProvider>
                                <PopupContextProvider>
                                    <App />
                                </PopupContextProvider>
                            </ProfileContextProvider>
                        </SpotifyContextProvider>
                    );
                }}
            </PlaybackContext.Consumer>
        </PlaybackContextProvider>
    </LibraryContextProvider>,
    document.getElementById("root")
);
