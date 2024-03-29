import React, { Component, createContext } from "react";
import Script from "react-load-script";

import { setCookie, getCookie, print, getHashParams, setSpotifyAccessToken, handleSpotifyAPIError } from "../Utils";
import { getQueueImageInBase64 } from "../resources/SpotQueueImage";

import { LibraryContext } from "./LibraryContext";

// Spotify Context
export const SpotifyContext = createContext();

// Refresh token time (Access Token will expire after an hour)
const refreshTokenTime = 30 * 60 * 1000;

export default class SpotifyContextProvider extends Component {
    // Get the library context
    static contextType = LibraryContext;

    constructor(props) {
        super(props);

        // Get hash parameters (for oauth autentication)
        const params = getHashParams();

        // Save refresh token in the cookies
        if (params.refresh_token) setCookie("spot_refreshToken", params.refresh_token, 10);

        // Get refresh token from cookies
        var savedRefreshToken = getCookie("spot_refreshToken");

        this.state = {
            // Credentials
            accessToken: params.access_token,
            refreshToken: savedRefreshToken,
            loggedIn: savedRefreshToken ? true : false,

            // Player
            deviceID: null,
            player: null,

            // Refresh token timeout
            refreshTokenTimeout: null,
            userID: null,
        };

        // Set the access token in the Spotify API
        if (params.access_token) setSpotifyAccessToken(params.access_token);

        // Create spotify Player
        this.createSpotPlayer();
    }

    //##############################################
    //       OAUTH SETUP
    //##############################################

    // Handles the load of the Spotify Web Playback Script-
    handleSpotifyPlaybackScriptLoad = () => {
        return new Promise((resolve) => {
            if (window.Spotify) {
                resolve();
            } else {
                this.onSpotifyWebPlaybackSDKReady = resolve;
            }
        });
    };

    // Refresh the token
    refreshSpotifyToken = () => {
        const { refreshToken } = this.state;
        var that = this;
        print("Refreshing Token");

        return new Promise(function (resolve, reject) {
            fetch(window.serverLocation + "refresh_token", {
                method: "POST",
                body: JSON.stringify({ refresh_token: refreshToken }),
                headers: { "Content-Type": "application/json" },
            })
                .then((res) => res.json())
                .then((data) => {
                    // Save new info in cookies and set it in the api

                    setSpotifyAccessToken(data.access_token);

                    print("New Access Token: " + data.access_token, "white");
                    // Set the state
                    that.setState((prevState) => {
                        return {
                            ...prevState,
                            accessToken: data.access_token,
                            refreshTokenTimeout: setTimeout(() => {
                                that.refreshSpotifyToken();
                            }, refreshTokenTime),
                        };
                    }, resolve);
                })
                .catch((error) => {
                    print(error, "red");
                    reject();
                });
        });
    };

    createSpotPlayer = () => {
        // Connects to Spotify Playback & creates a new Player
        window.onSpotifyWebPlaybackSDKReady = () => {
            this.setState(
                (prevState) => {
                    return {
                        ...prevState,
                        player: new window.Spotify.Player({
                            name: "Spot",
                            getOAuthToken: (callback) => {
                                callback(prevState.accessToken);
                            },
                        }),
                    };
                },
                () => {
                    const { player } = this.state;

                    // Error handling
                    player.addListener("initialization_error", ({ message }) => {
                        //console.error(message);
                    });
                    player.addListener("authentication_error", ({ message }) => {
                        //console.error(message);
                    });
                    player.addListener("account_error", ({ message }) => {
                        //console.error(message);
                    });
                    player.addListener("playback_error", ({ message }) => {
                        //console.error(message);
                    });

                    // Playback status updates
                    player.addListener("player_state_changed", (state) => {
                        window.PubSub.emit("onPlaybackChange");
                    });

                    // Ready
                    player.addListener("ready", ({ device_id }) => {
                        this.transferPlayer(device_id);
                    });

                    // Not Ready
                    player.addListener("not_ready", ({ device_id }) => {
                        print("Device ID has gone offline " + device_id, "orange");
                    });

                    // Connect to the player!
                    player.connect();
                }
            );
        };
    };

    // Transfer the spotify player to Spot in this device
    transferPlayer = (deviceID) => {
        this.setState(
            (prevState) => {
                return {
                    ...prevState,
                    deviceID,
                };
            },
            () => {
                const { deviceID } = this.state;
                // Start playing on Spot
                document.spotifyAPI.transferMyPlayback([deviceID], { play: true }).then(() => {
                    print("Now Playing on Spot");
                    window.PubSub.emit("onPlaybackChange");
                }, handleSpotifyAPIError);
            }
        );
    };

    //##############################################
    //       SPOTIFY API
    //##############################################

    // Get user id
    getUserID = () => {
        return new Promise((resolve, reject) => {
            document.spotifyAPI.getMe({}).then(
                (response) => {
                    this.setState((prevState) => {
                        return {
                            ...prevState,
                            userID: response.id,
                        };
                    }, resolve(response.id));
                },
                (err) => {
                    handleSpotifyAPIError(err);
                    reject();
                }
            );
        });
    };

    // Play Song
    play = (contextID = null, type = null, position = 0) => {
        var playOptions = {};
        if (contextID)
            playOptions = {
                context_uri: `spotify:${type}:${contextID}`,
                offset: { position },
            };

        return new Promise((resolve, reject) => {
            document.spotifyAPI.play(playOptions).then(
                () => {
                    resolve();
                },
                (err) => {
                    handleSpotifyAPIError(err);
                    reject();
                }
            );
        });
    };

    // Pause Song
    pause = () => {
        return new Promise((resolve, reject) => {
            document.spotifyAPI.pause().then(resolve, (err) => {
                handleSpotifyAPIError(err);
                reject();
            });
        });
    };

    // Previous Song
    prev = () => {
        return new Promise((resolve, reject) => {
            document.spotifyAPI.skipToPrevious().then(resolve, (err) => {
                handleSpotifyAPIError(err);
                reject();
            });
        });
    };

    // Next Song
    next = () => {
        return new Promise((resolve, reject) => {
            document.spotifyAPI.skipToNext().then(resolve, (err) => {
                handleSpotifyAPIError(err);
                reject();
            });
        });
    };

    // Rewind to any point in the Song
    rewind = (milliseconds) => {};

    // Set the repeat value: "none" "repeat" "repeatOne"
    setRepeat = (repeatType) => {};

    // Set the shuffle value: "none" "shuffle"
    setShuffle = (shuffleType) => {};

    // Create a playlist
    createPlaylist = (playlistName) => {
        const { userID } = this.state;

        // Create playlsit
        return new Promise((resolve, reject) => {
            document.spotifyAPI.createPlaylist(userID, { name: playlistName, public: false, description: "A playlist used by Spot as a queue" }).then(
                (response) => {
                    // Set the image
                    document.spotifyAPI.uploadCustomPlaylistCoverImage(response.id, getQueueImageInBase64()).then(
                        () => {
                            this.context.addNewPlaylistToLibrary(response).then((id) => resolve(id));
                        },
                        (err) => {
                            handleSpotifyAPIError(err);
                            reject();
                        }
                    );
                },
                (err) => {
                    handleSpotifyAPIError(err);
                    reject();
                }
            );
        });
    };

    // Remove songs from a playlist
    removeSongsFromPlaylist = (playlistID, songIDs) => {
        return new Promise(async (resolve) => {
            const trackURIs = songIDs.map((id) => `spotify:track:${id}`);

            var latestSnapshotID = { snapshot_id: null };
            for (let i = 0; i < trackURIs.length; i += 100) {
                const currentTrackURIs = trackURIs.slice(i, i + 100 < trackURIs.length ? i + 100 : trackURIs.length);
                latestSnapshotID = await document.spotifyAPI.removeTracksFromPlaylist(playlistID, currentTrackURIs);
            }

            if (latestSnapshotID && "snapshot_id" in latestSnapshotID) this.context.onPlaylistSongsChange(playlistID, latestSnapshotID.snapshot_id).then(resolve);
        });
    };

    // Add songs to a playlist
    addSongsToPlaylist = (playlistID, songIDs, targetPosition = null) => {
        const options = targetPosition ? { position: targetPosition } : {};

        return new Promise(async (resolve) => {
            const trackURIs = songIDs.map((id) => `spotify:track:${id}`);

            var latestSnapshotID = null;
            for (let i = 0; i < trackURIs.length; i += 100) {
                const currentTrackURIs = trackURIs.slice(i, i + 100 < trackURIs.length ? i + 100 : trackURIs.length);
                latestSnapshotID = await document.spotifyAPI.addTracksToPlaylist(playlistID, currentTrackURIs, options);
            }

            this.context.onPlaylistSongsChange(playlistID, latestSnapshotID.snapshot_id).then(resolve);
        });
    };

    // Move a song inside a playlist
    moveSongInsidePlaylist = (playlistID, indexBeforeMoving, targetIndex) => {
        return new Promise(async (resolve) => {
            var latestSnapshotID = this.context.library.playlists[playlistID].snapshotID;
            var insertBefore = targetIndex > indexBeforeMoving ? targetIndex + 1 : targetIndex;

            latestSnapshotID = await document.spotifyAPI.reorderTracksInPlaylist(playlistID, indexBeforeMoving, insertBefore, {
                snapshot_id: latestSnapshotID,
            });
            this.context.reorderSongsInPlaylist(playlistID, indexBeforeMoving, targetIndex, latestSnapshotID.snapshot_id).then(resolve);
        });
    };

    //##############################################
    //       REACT LIFE CYCLE METHODS
    //##############################################

    // Renders this component
    render() {
        return (
            <>
                <Script url="https://sdk.scdn.co/spotify-player.js" onLoad={this.handleSpotifyPlaybackScriptLoad} />
                <SpotifyContext.Provider
                    value={{
                        ...this.state,
                        play: this.play,
                        pause: this.pause,
                        prev: this.prev,
                        next: this.next,
                        createPlaylist: this.createPlaylist,
                        addSongsToPlaylist: this.addSongsToPlaylist,
                        removeSongsFromPlaylist: this.removeSongsFromPlaylist,
                        moveSongInsidePlaylist: this.moveSongInsidePlaylist,
                    }}
                >
                    {this.props.children}
                </SpotifyContext.Provider>
            </>
        );
    }

    // When the compnent mounts for the first time
    componentDidMount() {
        const { loggedIn } = this.state;

        // If not logged in, go to spotify login page
        if (!loggedIn) {
            print("Logged Out", "orange");
            window.location.assign(window.serverLocation + "login");
        } else {
            print("Logged In");
            window.history.replaceState({}, document.title, "/");

            // Refresh the token
            this.refreshSpotifyToken().then(() => {
                // Get the library
                this.context.getUserLibrary();

                // Get the user id
                this.getUserID();
            });
        }
    }
}
