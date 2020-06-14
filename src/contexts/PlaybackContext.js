import React, { createContext, useState, useEffect, /* useReducer,*/ useRef } from "react";
import { print, getLocalStorage, handleSpotifyAPIError } from "../Utils";

// Playback Context
export const PlaybackContext = createContext();
//const updateProgressInterval = 5000; ROJAS // CARLES Change to 15

/* ROJAS
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
*/

const PlaybackContextProvider = (props) => {
    // Playback state
    const [playback, setPlayback] = useState({
        playing: false,
        repeat: false,
        repeatOne: false,
        shuffle: false,
        songID: null,
        exists: false,
        image: null,
    });

    // Snapshot of the last playback known
    const lastKnownPlayback = useRef({
        playing: false,
        repeat: false,
        repeatOne: false,
        shuffle: false,
        songID: null,
        exists: false,
        image: null,
    });

    /* ROJAS
    // State for the song progress control
    const [progressState, updateProgressState] = useReducer(ProgressStateReducer, { playing: false, duration: 0, progress: 0, percentage: 0 });
    */

    // State for keeping track of the currently played context
    const cookieListID = getLocalStorage("spot_playbackContext_listID");
    const cookiePlaylist = getLocalStorage("spot_playbackContext_playlist");
    const cookieArtist = getLocalStorage("spot_playbackContext_artist");
    const cookieAlbum = getLocalStorage("spot_playbackContext_album");

    const [playbackContext, setPlaybackContext] = useState({
        id: cookieListID ? cookieListID : "",
        playlist: cookiePlaylist ? cookiePlaylist : false,
        artist: cookieArtist ? cookieArtist : false,
        album: cookieAlbum ? cookieAlbum : false,
    });

    /* ROJAS
    // Set an interval to update the song progress
    useEffect(() => {
        // Create an interval
        const progressInterval = setInterval(() => {
            updateProgressState({ type: "increment" });
        }, updateProgressInterval);

        // Clean interval on component unmount
        return () => clearInterval(progressInterval);
    }, []);
    */

    // Check if the playback has changed
    const playbackHasChanged = (newPlayback) => {
        return (
            lastKnownPlayback.current.playing !== newPlayback.playing ||
            lastKnownPlayback.current.repeat !== newPlayback.repeat ||
            lastKnownPlayback.current.repeatOne !== newPlayback.repeatOne ||
            lastKnownPlayback.current.shuffle !== newPlayback.shuffle ||
            lastKnownPlayback.current.songID !== newPlayback.songID ||
            lastKnownPlayback.current.exists !== newPlayback.exists ||
            lastKnownPlayback.current.image !== newPlayback.image
        );
    };

    // Obtains the current playback state for the user
    const handlePlaybackChange = () => {
        window.setTimeout(() => {
            document.spotifyAPI.getMyCurrentPlaybackState().then(
                (response) => {
                    if (response) {
                        var newPlayback = {
                            playing: response.is_playing,
                            repeat: false,
                            repeatOne: false,
                            shuffle: response.shuffle_state,
                            songID: response.item.id,
                            exists: true,
                            image: response.item.album.images.length > 0 ? response.item.album.images[0].url : null,
                        };

                        /* ROJAS
                        var newProgressState = {
                            playing: response.is_playing,
                            duration: response.item.duration_ms,
                            progress: response.progress_ms,
                            percentage: (response.progress_ms / response.item.duration_ms) * 100,
                        };
                        */

                        // Set the playback
                        if (playbackHasChanged(newPlayback)) {
                            lastKnownPlayback.current = newPlayback;
                            setPlayback(newPlayback);
                        }

                        /* ROJAS
                        // Set the progress state
                        updateProgressState({ type: "set", newProgressState });
                        */

                        // Set the media controls outide the browser
                        setMediaSession(response);
                    }
                },
                (err) => {
                    handleSpotifyAPIError(err);

                    var newPlayback = {
                        playing: false,
                        repeat: false,
                        repeatOne: false,
                        shuffle: false,
                        songID: null,
                        exists: false,
                        image: null,
                    };

                    /* ROJAS
                    var newProgressState = { playing: false, duration: 0, progress: 0, percentage: 0 };
                    */

                    // Set the playback
                    lastKnownPlayback.current = newPlayback;
                    setPlayback(newPlayback);

                    /* ROJAS
                    // Set the progress state
                    updateProgressState({ type: "set", newProgressState });
                    */
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <PlaybackContext.Provider value={{ playback, handlePlaybackChange /*, progressState ROJAS */, playbackContext, setPlaybackContext }}>
            {props.children}
        </PlaybackContext.Provider>
    );
};

export default PlaybackContextProvider;
