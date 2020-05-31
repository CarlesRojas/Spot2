import React, { Component, createContext } from "react";
import Script from "react-load-script";
import SpotifyWebApi from "spotify-web-api-js";
window.spotifyAPI = new SpotifyWebApi();

// Spotify Context
export const SpotifyContext = createContext();

// The state of this component will be shared between all components in this app
export default class SpotifyContextProvider extends Component {
    constructor() {
        super();

        // Get hash parameters (for oauth autentication)
        const params = this.getHashParams();

        this.state = {
            // Credentials
            accessToken: params.access_token,
            loggedIn: params.access_token ? true : false,
            refreshToken: params.refresh_token,
            tokenExpireDateTime: new Date(Date.now() + 25 * 60 * 1000),

            // Player
            deviceID: null,
            player: null,

            // Library
            library: {
                songs: {},
                albums: {},
                artists: {},
                playlists: {},
            },

            // Playback info
            playbackState: {
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
            },
            duration: 0,
            progress: 0,
            percentage: 0,
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
                <SpotifyContext.Provider value={{ ...this.state }}>{this.props.children}</SpotifyContext.Provider>{" "}
            </>
        );
    }

    // When the component updates
    componentDidUpdate() {
        const { loggedIn } = this.state;

        // If not logged in, go to spotify login page
        if (!loggedIn) {
            window.location.assign("http://localhost:8888/login");
            console.log("update");
        }
    }

    // When the compnent mounts for the first time
    componentDidMount() {
        const { loggedIn } = this.state;

        // If not logged in, go to spotify login page
        if (!loggedIn) {
            window.location.assign("http://localhost:8888/login");
            console.log("not logged");
        } else {
            // Set up the refresh token behaviour
            window.refreshTokenInterval = window.setInterval(() => {
                if (Date.now() > window.info.tokenExpireDateTime) {
                    window.clearInterval(window.refreshTokenInterval);
                    this.refreshSpotifyToken();
                }
            }, 2 * 60 * 1000);

            // Get the user library
            // this.getUserLibrary(0); ROJAS

            console.log("logged");
        }
    }

    // #######################################
    //      OAUTH SETUP
    // #######################################

    // Obtains parameters from the hash of the URL
    getHashParams = () => {
        var hashParams = {};
        var e;
        var r = /([^&;=]+)=?([^&;]*)/g;
        var q = window.location.hash.substring(1);
        while ((e = r.exec(q))) hashParams[e[1]] = decodeURIComponent(e[2]);
        return hashParams;
    };

    // Obtains the token from the cookies or sets it
    getTokenInfoFromCookies = () => {
        const { accessToken, refreshToken, tokenExpireDateTime } = this.state;

        // Get tokens and info from the cookie or set it if there was none
        if (accessToken) {
            window.spotifyAPI.setAccessToken(accessToken);

            this.setCookie("spot_accessToken", accessToken, 5);
            this.setCookie("spot_refreshToken", refreshToken, 5);
            this.setCookie("spot_tokenExpireDateTime", tokenExpireDateTime, 5);
        } else {
            var accessTokenCookie = this.getCookie("spot_accessToken");
            var refreshTokenCookie = this.getCookie("spot_refreshToken");
            var tokenExpireDateTimeCookie = new Date(Date.parse(this.getCookie("spot_tokenExpireDateTime")));

            if (accessTokenCookie && refreshTokenCookie && tokenExpireDateTimeCookie && tokenExpireDateTimeCookie > Date.now()) {
                window.spotifyAPI.setAccessToken(accessTokenCookie);
                this.setState({ accessToken: accessTokenCookie, refreshToken: refreshTokenCookie, tokenExpireDateTime: tokenExpireDateTimeCookie });
            }
        }
    };

    // Obtains parameters from the hash of the URL
    getHashParams = () => {
        var hashParams = {};
        var e;
        var r = /([^&;=]+)=?([^&;]*)/g;
        var q = window.location.hash.substring(1);
        while ((e = r.exec(q))) hashParams[e[1]] = decodeURIComponent(e[2]);
        return hashParams;
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
        const { refreshToken, tokenExpireDateTime } = this.state;

        // Set an interval to refresh the token evert 20 minutes
        window.refreshTokenInterval = window.setInterval(() => {
            if (Date.now() > tokenExpireDateTime) {
                window.clearInterval(window.refreshTokenInterval);
                this.refreshSpotifyToken();
            }
        }, 2 * 60 * 1000);

        fetch("http://localhost:8888/refresh_token", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
            headers: { "Content-Type": "application/json" },
        })
            .then((res) => res.json())
            .then((data) => {
                this.setState({ accessToken: data.access_token, tokenExpireDateTime: new Date(Date.now() + 25 * 60 * 1000) }, () => {
                    const { accessToken, tokenExpireDateTime } = this.state;
                    this.setCookie("spot_accessToken", accessToken, 5);
                    this.setCookie("spot_tokenExpireDateTime", tokenExpireDateTime, 5);
                    window.spotifyAPI.setAccessToken(accessToken);
                });
            })
            .catch((error) => console.log(error));
    };

    // #######################################
    //      SPOTIFY API
    // #######################################

    // Creates the Spot player
    createSpotPlayer = () => {
        const { accessToken } = this.state;

        // Connects to Spotify Playback & creates a new Player
        window.onSpotifyWebPlaybackSDKReady = () => {
            this.setState(
                {
                    player: new window.Spotify.Player({
                        name: "Spot",
                        getOAuthToken: (callback) => {
                            callback(accessToken);
                        },
                    }),
                },
                () => {
                    const { player } = this.state;
                    console.log(player);
                    // Error handling
                    player.addListener("initialization_error", ({ message }) => {
                        /* console.error(message); */
                    });

                    player.addListener("authentication_error", ({ message }) => {
                        /* console.error(message); */
                    });

                    player.addListener("account_error", ({ message }) => {
                        /* console.error(message); */
                    });

                    player.addListener("playback_error", ({ message }) => {
                        /* console.error(message); */
                    });

                    // Playback status updates
                    player.addListener("player_state_changed", (state) => {
                        //this.handlePlaybackChange(); ROJAS
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
        this.setState({ deviceID }, () => {
            const { deviceID } = this.state;

            // Start playing on Spot
            window.spotifyAPI.transferMyPlayback([deviceID], { play: true }).then(
                () => {
                    console.log("Now Playing on Spot");
                    //this.handlePlaybackChange(); ROJAS
                },
                (err) => {
                    if (err.status === 401) window.location.assign("http://localhost:8888/login");
                    else if (err.status === 404) this.transferPlayer(deviceID);
                    else console.error(err);
                }
            );
        });
    };

    // #######################################
    //      COOKIE HANDLE
    // #######################################

    // Set a cookie
    setCookie = (name, value, cookieDurationInDays) => {
        var d = new Date();
        d.setTime(d.getTime() + cookieDurationInDays * 24 * 60 * 60 * 1000);
        var expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    };

    // Get a cookie
    getCookie = (name) => {
        var formatedName = name + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var splitedCookies = decodedCookie.split(";");
        for (var i = 0; i < splitedCookies.length; i++) {
            var currentCookie = splitedCookies[i];
            while (currentCookie.charAt(0) === " ") {
                currentCookie = currentCookie.substring(1);
            }
            if (currentCookie.indexOf(formatedName) === 0) {
                return currentCookie.substring(formatedName.length, currentCookie.length);
            }
        }
        return "";
    };
}
