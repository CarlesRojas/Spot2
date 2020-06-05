import React, { createContext, useState, useContext, useEffect } from "react";

import { LibraryContext } from "../contexts/LibraryContext";

// Queue Context
export const QueueContext = createContext();

const QueueContextProvider = (props) => {
    // Get contexts
    const { library } = useContext(LibraryContext);

    // Queue ID
    const [queueID, setQueueID] = useState(null);
    useEffect(() => {
        if ("playlists" in library) {
            for (let i = 0; i < library.playlists.length; i++) {
                const { name, playlistID } = library.playlist[i];
                if (name === "Spot Queue") {
                    setQueue(playlistID);
                    break;
                }
            }
        }
    }, [library]);

    // Queue type: "custom" "songs" "album" "artist" "playlist"
    const [queueContextType, setQueueContextType] = useState("custom");

    // Queue context ID: the ID
    const [queueContextID, setQueueContextID] = useState("");

    // Adds the song/songs to the end of the queue
    const addSongsToQueue = (songIDs) => {
        setQueueContextType("custom");
        setQueueContextID("");
    };

    // Removes a single song from the queue
    const removeSongFromQueue = (songID) => {
        setQueueContextType("custom");
        setQueueContextID("");
    };

    // Replaces the current queue with a new one with the songs
    const replaceQueue = (songIDs, contextID, contextType) => {
        setQueueContextType(contextType);
        setQueueContextID(contextID);
    };

    // Return the Queue Provider
    return <QueueContext.Provider value={{}}>{props.children}</QueueContext.Provider>;
};

export default QueueContextProvider;
