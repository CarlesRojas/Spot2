import React, { createContext, useState } from "react";

// Playback Context
export const PlaybackContext = createContext();

const PlaybackContextProvider = (props) => {
    const [playback, setPlayback] = useState({
        playing: false,
        repeat: false,
        repeatOne: false,
        shuffle: false,
        songID: null,
        albumID: null,
        artistID: null,
        playlistID: null,
        exists: false,
        image: null,
        duration: 0,
        progress: 0,
        percentage: 0,
    });

    return <PlaybackContext.Provider value={{ playback, setPlayback }}>{props.children}</PlaybackContext.Provider>;
};

export default PlaybackContextProvider;
