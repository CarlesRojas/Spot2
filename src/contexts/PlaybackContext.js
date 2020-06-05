import React, { createContext, useState, useEffect, useReducer } from "react";
import { print } from "../Utils";

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
    // Playback state
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

                        // Set the media controls outide the browser
                        setMediaSession(response);
                    }
                },
                (err) => {
                    if (err.status === 401) window.location.assign(window.serverLocation + "login");
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

    // Sets the media controls outside the app Android
    const setMediaSession = (response) => {
        // CARLES DEBUG

        // Get images
        if ("item" in response && "album" in response.item && "images" in response.item.album && response.item.album.images.length > 0)
            var artwork = response.item.album.images.map(({ height, width, url }) => {
                return {
                    src: url,
                    type: "image/png",
                    sizes: `${width}x${height}`,
                };
            });
        else artwork = null;

        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: response.item.name,
                artist: response.item.artists.length > 0 ? response.item.artists[0].name : null,
                album: response.item.album.name,
                artwork,
            });

            navigator.mediaSession.setActionHandler("play", function () {
                print("Play", "cyan");
            });
            navigator.mediaSession.setActionHandler("pause", function () {
                print("Pause", "cyan");
            });
            navigator.mediaSession.setActionHandler("previoustrack", function () {
                print("Prev", "cyan");
            });
            navigator.mediaSession.setActionHandler("nexttrack", function () {
                print("Next", "cyan");
            });
        }
    };

    // Efect to subscribe to events
    useEffect(() => {
        window.PubSub.sub("onPlaybackChange", handlePlaybackChange);
        return () => {
            window.PubSub.unsub("onPlaybackChange", handlePlaybackChange);
        };
    }, []);

    return <PlaybackContext.Provider value={{ playback, handlePlaybackChange, progressState }}>{props.children}</PlaybackContext.Provider>;
};

export default PlaybackContextProvider;
