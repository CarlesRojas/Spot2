import React, { Component, createContext } from "react";
import Script from "react-load-script";
import { getCookie, setCookie, getHashParams } from "..//Utils";
import { LibraryContext } from "./LibraryContext";

// Spotify Context
export const SpotifyContext = createContext();

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
            loggedIn: params.access_token ? true : false,
            refreshToken: params.refresh_token,
            tokenExpireDateTime: new Date(Date.now() + 25 * 60 * 1000),

            // Player
            deviceID: null,
            player: null,
        };

        // Obtain token info from cookies
        this.getTokenInfoFromCookies();

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

    // When the component updates
    componentDidUpdate() {
        const { loggedIn } = this.state;
        // If not logged in, go to spotify login page
        if (!loggedIn) {
            window.location.assign(window.serverLocation);
            console.log("update");
        }
    }

    // When the compnent mounts for the first time
    componentDidMount() {
        const { loggedIn, tokenExpireDateTime } = this.state;
        const { getUserLibrary } = this.context;

        // If not logged in, go to spotify login page
        if (!loggedIn) {
            window.location.assign(window.serverLocation);
            console.log("not logged");
        } else {
            // Set up the refresh token behaviour
            window.refreshTokenInterval = window.setInterval(() => {
                if (Date.now() > tokenExpireDateTime) {
                    window.clearInterval(window.refreshTokenInterval);
                    this.refreshSpotifyToken();
                }
            }, 2 * 60 * 1000);

            // Get the user library
            getUserLibrary();

            console.log("logged");
        }
    }

    //##############################################
    //       OAUTH SETUP
    //##############################################

    getTokenInfoFromCookies = () => {
        const { accessToken, refreshToken, tokenExpireDateTime } = this.state;

        // Get tokens and info from the cookie or set it if there was none
        if (accessToken) {
            window.spotifyAPI.setAccessToken(accessToken);

            setCookie("spot_accessToken", accessToken, 5);
            setCookie("spot_refreshToken", refreshToken, 5);
            setCookie("spot_tokenExpireDateTime", tokenExpireDateTime, 5);
        } else {
            var accessTokenCookie = getCookie("spot_accessToken");
            var refreshTokenCookie = getCookie("spot_refreshToken");
            var tokenExpireDateTimeCookie = new Date(Date.parse(getCookie("spot_tokenExpireDateTime")));

            if (accessTokenCookie && refreshTokenCookie && tokenExpireDateTimeCookie && tokenExpireDateTimeCookie > Date.now()) {
                window.spotifyAPI.setAccessToken(accessTokenCookie);

                this.setState((prevState) => {
                    return {
                        ...prevState,
                        accessToken: accessTokenCookie,
                        refreshToken: refreshTokenCookie,
                        tokenExpireDateTime: tokenExpireDateTimeCookie,
                    };
                });
            }
        }
    };

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

        fetch("http://localhost:8888/refresh_token", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
            headers: { "Content-Type": "application/json" },
        })
            .then((res) => res.json())
            .then((data) => {
                this.setState(
                    (prevState) => {
                        return {
                            ...prevState,
                            accessToken: data.access_token,
                            tokenExpireDateTime: new Date(Date.now() + 25 * 60 * 1000),
                        };
                    },
                    () => {
                        const { accessToken, tokenExpireDateTime } = this.state;
                        setCookie("spot_accessToken", accessToken, 5);
                        setCookie("spot_tokenExpireDateTime", tokenExpireDateTime, 5);
                        window.spotifyAPI.setAccessToken(accessToken);

                        window.refreshTokenInterval = window.setInterval(() => {
                            if (Date.now() > tokenExpireDateTime) {
                                window.clearInterval(window.refreshTokenInterval);
                                this.refreshSpotifyToken();
                            }
                        }, 2 * 60 * 1000);
                    }
                );
            })
            .catch((error) => console.log(error));
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
                        console.log("Device ID has gone offline", device_id);
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
                    (response) => {
                        console.log("Now Playing on Spot");
                        this.props.playbackContext.handlePlaybackChange();
                    },
                    (err) => {
                        if (err.status === 401) window.location.assign(window.serverLocation);
                        else if (err.status === 404) this.transferPlayer(deviceID);
                        else console.error(err);
                    }
                );
            }
        );
    };
}
