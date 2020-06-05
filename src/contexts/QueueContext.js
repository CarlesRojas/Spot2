import React, { createContext, useState } from "react";

// Queue Context
export const QueueContext = createContext();

const QueueContextProvider = (props) => {
    // Sets the repeat value
    const setRepeat = (repeatType) => {};

    // Sets the shuffle value
    const setShuffle = (shuffleType) => {};

    // Adds the song/songs to the end of the queue
    const addSongsToQueue = (songIDs) => {};

    // Removes a single song from the queue
    const removeSongFromQueue = (songID) => {};

    // Replaces the current queue with a new one with the songs
    const replaceQueue = (songIDs) => {};

    // Return the Queue Provider
    return <QueueContext.Provider value={{ openPopup }}>{props.children}</QueueContext.Provider>;
};

export default QueueContextProvider;
