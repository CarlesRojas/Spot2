import React, { Component, createContext } from "react";
import Script from "react-load-script";
import { print, getHashParams } from "..//Utils";
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

        this.state = {
            // Credentials
            accessToken: params.access_token,
            refreshToken: params.refresh_token,
            loggedIn: params.access_token ? true : false,

            // Player
            deviceID: null,
            player: null,

            // Refresh token timeout
            refreshTokenTimeout: null,
        };

        // Set the access token in the Spotify API
        if (params.access_token) window.spotifyAPI.setAccessToken(params.access_token);

        // Create spotify Player
        this.createSpotPlayer();
    }

    render() {
        return (
            <>
                <Script url="https://sdk.scdn.co/spotify-player.js" onLoad={this.handleSpotifyPlaybackScriptLoad} />
                <SpotifyContext.Provider value={{ ...this.state }}>{this.props.children}</SpotifyContext.Provider>
            </>
        );
    }

    // When the compnent mounts for the first time
    componentDidMount() {
        const { loggedIn } = this.state;
        const { getUserLibrary } = this.context;

        // If not logged in, go to spotify login page
        if (!loggedIn) {
            print("Logged Out", "orange");
            window.location.assign(window.serverLocation + "login");
        } else {
            print("Logged In");

            // Refresh the token
            this.refreshSpotifyToken().then(() => {
                // Get the user library
                getUserLibrary();
            });
        }
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

        return new Promise(function (resolve, reject) {
            fetch(window.serverLocation + "refresh_token", {
                method: "POST",
                body: JSON.stringify({ refresh_token: refreshToken }),
                headers: { "Content-Type": "application/json" },
            })
                .then((res) => res.json())
                .then((data) => {
                    // Save new info in cookies and set it in the api
                    window.spotifyAPI.setAccessToken(data.access_token);

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

    //##############################################
    //       SPOTIFY API
    //##############################################

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
                        this.props.playbackContext.handlePlaybackChange();
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
                window.spotifyAPI.transferMyPlayback([deviceID], { play: true }).then(
                    () => {
                        print("Now Playing on Spot");
                        this.props.playbackContext.handlePlaybackChange();
                    },
                    (err) => {
                        if (err.status === 401) window.location.assign(window.serverLocation + "login");
                        else if (err.status === 404) this.transferPlayer(deviceID);
                        else console.error(err);
                    }
                );
            }
        );
    };
}
