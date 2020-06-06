import React, { createContext, useState, useContext, useEffect } from "react";

import { SpotifyContext } from "../contexts/SpotifyContext";
import { LibraryContext } from "../contexts/LibraryContext";
import { setLocalStorage, getLocalStorage, print, areArraysIdentical } from "../Utils";

// Queue Context
export const QueueContext = createContext();

const QueueContextProvider = (props) => {
    // Get contexts
    const { play, createPlaylist, addSongsToPlaylist, removeSongsFromPlaylist } = useContext(SpotifyContext);
    const { library } = useContext(LibraryContext);

    // Queue ID
    const [queueID, setQueueID] = useState(null);
    useEffect(() => {
        if ("playlists" in library) {
            var playlistsValues = Object.values(library.playlists);
            for (let i = 0; i < playlistsValues.length; i++) {
                const { name, playlistID } = playlistsValues[i];
                if (name === "Spot Queue") {
                    setQueueID(playlistID);
                    break;
                }
            }
        }
    }, [library]);

    // Queue type: "custom" "songs" "album" "artist" "playlist"
    const [queueContextType, setQueueContextType] = useState(
        getLocalStorage("spot_queue_contextType") ? getLocalStorage("spot_queue_contextType") : "custom"
    );
    const setQueueContextTypeWithCookie = (value) => {
        setLocalStorage("spot_queue_contextType", value, 10);
        setQueueContextType(value);
    };

    // Queue context ID: the ID
    const [queueContextID, setQueueContextID] = useState(getLocalStorage("spot_queue_contextID") ? getLocalStorage("spot_queue_contextID") : "");
    const setQueueContextIDWithCookie = (value) => {
        setLocalStorage("spot_queue_contextID", value, 10);
        setQueueContextID(value);
    };

    // Queue song list in order
    const [queueSongList, setQueueSongList] = useState(
        getLocalStorage("spot_queue_songList") ? getLocalStorage("spot_queue_songList").split(",") : []
    );
    const setQueueSongListWithCookie = (value) => {
        setLocalStorage("spot_queue_songList", value, 10);
        setQueueSongList(value);
    };

    // No change in the queue while this is true
    const [working, setWorking] = useState(false);

    // Adds the song/songs to the end of the queue
    const addSongsToQueue = (songIDs) => {
        // Return if the queue is working
        if (working) return;

        // CARLES

        setQueueContextTypeWithCookie("custom");
        setQueueContextIDWithCookie("");
    };

    // Removes a single song from the queue
    const removeSongFromQueue = (songID) => {
        // Return if the queue is working
        if (working) return;

        // CARLES

        setQueueContextTypeWithCookie("custom");
        setQueueContextIDWithCookie("");
    };

    // Plays a song in its context
    const playSongInContext = (songIDs, contextID, contextType, position) => {
        // Return if the queue is working
        if (working) return;

        // Limit queue to 100

        // If there is no queue yet
        if (!queueID) {
            setWorking(true);
            console.log("NO QUEUE");

            // Create the Queue playlist
            createPlaylist("Spot Queue").then((queueID) => {
                setQueueID(queueID);

                // Set state
                setQueueContextIDWithCookie(contextID);
                setQueueContextTypeWithCookie(contextType);
                setQueueSongListWithCookie(songIDs);

                // Fill the queue
                addSongsToPlaylist(queueID, songIDs).then(() => {
                    play(queueID, "playlist", position);
                    setWorking(false);
                });
            });
            return;
        }

        // If the queue exists and the new songs and context are the same as the old
        if (contextID === queueContextID && contextType === queueContextType && areArraysIdentical(queueSongList, songIDs)) {
            console.log("SAME AS PREVIOUS QUEUE");

            play(queueID, "playlist", position);
            return;
        }

        // If the context, the type or the list of songs are diferent
        setWorking(true);

        console.log("NEW QUEUE");
        // Empty the queue
        removeSongsFromPlaylist(queueID, queueSongList).then(() => {
            // Set state
            setQueueContextIDWithCookie(contextID);
            setQueueContextTypeWithCookie(contextType);
            setQueueSongListWithCookie(songIDs);

            // Fill the queue
            addSongsToPlaylist(queueID, songIDs).then(() => {
                play(queueID, "playlist", position);
                setWorking(false);
            });
        });
    };

    // Return the Queue Provider
    return (
        <QueueContext.Provider
            value={{
                queueSongList,
                addSongsToQueue,
                removeSongFromQueue,
                playSongInContext,
            }}
        >
            {props.children}
        </QueueContext.Provider>
    );
};

export default QueueContextProvider;
