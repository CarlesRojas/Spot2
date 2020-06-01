import React, { createContext, useState, useEffect, useReducer } from "react";

// Playback Context
export const PlaybackContext = createContext();
const updateProgressInterval = 5000; // CARLES Change to 15

const ProgressStateReducer = (progressState, action) => {
    switch (action.type) {
        case "set":
            return action.newProgressState;
        case "increment":
            // Do not update if the song is not playing
            if (!progressState.playing) return progressState;

            const newProgress = progressState.progress + updateProgressInterval;
            return {
                ...progressState,
                progress: newProgress,
                percentage: (newProgress / progressState.duration) * 100,
            };
        default:
            return progressState;
    }
};

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
    });

    const [progressState, updateProgressState] = useReducer(ProgressStateReducer, { playing: false, duration: 0, progress: 0, percentage: 0 });

    // Set an interval to update the song progress
    useEffect(() => {
        // Create an interval
        const progressInterval = setInterval(() => {
            updateProgressState({ type: "increment" });
        }, updateProgressInterval);

        // Clean interval on component unmount
        return () => clearInterval(progressInterval);
    }, []);

    // Obtains the current playback state for the user
    const handlePlaybackChange = () => {
        window.setTimeout(() => {
            window.spotifyAPI.getMyCurrentPlaybackState().then(
                (response) => {
                    if (response) {
                        const artistID = response.item.artists.length ? response.item.artists[0] : null;

                        var newPlayback = {
                            playing: response.is_playing,
                            repeat: false,
                            repeatOne: false,
                            shuffle: response.shuffle_state,
                            songID: response.item.id,
                            albumID: playback.albumID === response.item.album.id ? playback.albumID : null,
                            artistID: playback.artistID === artistID ? playback.artistID : null,
                            playlistID: null, // CARLES <- Update for playlists
                            exists: true,
                            image: response.item.album.images.length > 0 ? response.item.album.images[0].url : null,
                        };

                        var newProgressState = {
                            playing: response.is_playing,
                            duration: response.item.duration_ms,
                            progress: response.progress_ms,
                            percentage: (response.progress_ms / response.item.duration_ms) * 100,
                        };

                        // Set the playback
                        setPlayback(newPlayback);

                        // Set the progress state
                        updateProgressState({ type: "set", newProgressState });
                    }
                },
                (err) => {
                    if (err.status === 401) window.location.assign(window.serverLocation);
                    else console.error(err);

                    var newPlayback = {
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
                    };

                    var newProgressState = { playing: false, duration: 0, progress: 0, percentage: 0 };

                    // Set the playback
                    setPlayback(newPlayback);

                    // Set the progress state
                    updateProgressState({ type: "set", newProgressState });
                }
            );
        }, 200);
    };

    return <PlaybackContext.Provider value={{ playback, handlePlaybackChange, progressState }}>{props.children}</PlaybackContext.Provider>;
};

export default PlaybackContextProvider;
