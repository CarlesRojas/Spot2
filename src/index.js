import React from "react";
import ReactDOM from "react-dom";
import SpotifyWebApi from "spotify-web-api-js";

import EventsPubSub from "./EventsPubSub";
import SpotifyContextProvider from "./contexts/SpotifyContext";
import LibraryContextProvider from "./contexts/LibraryContext";
import PlaybackContextProvider, { PlaybackContext } from "./contexts/PlaybackContext";
import PopupContextProvider from "./contexts/PopupContext";

import App from "./App";

import "./index.css";

// Pubsub and soptify api
window.PubSub = new EventsPubSub();
window.spotifyAPI = new SpotifyWebApi();
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
                            <PopupContextProvider>
                                <App />
                            </PopupContextProvider>
                        </SpotifyContextProvider>
                    );
                }}
            </PlaybackContext.Consumer>
        </PlaybackContextProvider>
    </LibraryContextProvider>,
    document.getElementById("root")
);
