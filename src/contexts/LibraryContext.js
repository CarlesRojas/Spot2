import React, { createContext, useState, useEffect, useRef } from "react";
import { print } from "../Utils";

// Icons
import ArtistEmpty from "../resources/ArtistEmpty.svg";
import AlbumEmpty from "../resources/AlbumEmpty.svg";
import PlaylistEmpty from "../resources/PlaylistEmpty.svg";

// Library Context
export const LibraryContext = createContext();

const LibraryContextProvider = (props) => {
    const [library, setLibrary] = useState({
        songs: {},
        albums: {},
        artists: {},
        playlists: {},
    });

    // Efect to subscribe to events
    useEffect(() => {
        window.PubSub.sub("onSpotifyReady", getUserLibrary);
        return () => {
            window.PubSub.unsub("onSpotifyReady", getUserLibrary);
        };
    }, []);

    // Component did update
    const mounted = useRef();
    useEffect(() => {
        if (!mounted.current) mounted.current = true;
        else {
            print("LIBRARY LOADED");
            print(library);
            deleteTempLibrary();
        }
    }, [library]);

    // #######################################
    //      BUILD USER LIBRARY
    // #######################################

    // Fetch the users library
    const getUserLibrary = () => {
        // Temporal structure to be filled -> Will be set as the state when the library is loaded
        window.library = {
            songs: {},
            albums: {},
            artists: {},
            playlists: {},
        };

        getUserSongs(0);
    };

    // Get the user's library
    const getUserSongs = (offset) => {
        var limit = 50;
        window.spotifyAPI.getMySavedTracks({ offset: offset, limit: limit }).then(
            (response) => {
                const { items, next } = response;

                for (let i = 0; i < items.length; i++) parseAndSaveSavedTracks(items[i]);

                if (next) getUserSongs((offset += 50));
                else {
                    // Get artists images
                    var artists = Object.keys(window.library.artists);
                    getArtistsImages(artists, 0);
                }
            },
            (err) => {
                if (err.status === 401) window.location.assign(window.serverLocation + "login");
                else console.error(err);
            }
        );
    };

    // Parse song info (To keep only what will be used)
    const parseAndSaveSavedTracks = (song) => {
        var dateAdded = new Date(song.added_at);
        song = song.track;
        var songID = song.id;
        var albumID = song.album.id;
        var artistID = song.artists.length ? song.artists[0].id : "";

        // Add song
        if (!(songID in window.library.songs)) {
            var songInfo = {};
            songInfo["songID"] = songID;
            songInfo["dateAdded"] = dateAdded;
            songInfo["name"] = song.name;
            songInfo["duration"] = song.duration_ms;
            songInfo["albumID"] = albumID;
            songInfo["albumName"] = song.album.name;
            songInfo["artistID"] = artistID;
            songInfo["artistName"] = song.artists.length ? song.artists[0].name : "";
            songInfo["trackNumber"] = song.track_number;
            songInfo["image"] = song.album.images.length ? song.album.images[0].url : AlbumEmpty;
            window.library.songs[songID] = songInfo;
        }

        // Add song to the album if already in the library
        if (albumID in window.library.albums) {
            var albumInfo = window.library.albums[albumID];
            if (!(songID in albumInfo.songs)) albumInfo["songs"][songID] = null;
            if (albumInfo.dateAdded < dateAdded) albumInfo["dateAdded"] = dateAdded;
        }

        // Add the album otherwise
        else {
            albumInfo = {};
            albumInfo["albumID"] = albumID;
            albumInfo["dateAdded"] = dateAdded;
            albumInfo["name"] = song.album.name;
            albumInfo["image"] = song.album.images.length ? song.album.images[0].url : AlbumEmpty;
            albumInfo["artistID"] = artistID;
            albumInfo["songs"] = {};
            albumInfo["songs"][songID] = null;
            window.library.albums[albumID] = albumInfo;
        }

        // Add song & album to the artist if already in the library
        if (artistID in window.library.artists) {
            var artistInfo = window.library.artists[artistID];
            if (!(songID in artistInfo.songs)) artistInfo["songs"][songID] = null;
            if (!(albumID in artistInfo.albums)) artistInfo["albums"][albumID] = null;
            if (artistInfo.dateAdded < dateAdded) artistInfo["dateAdded"] = dateAdded;
        }

        // Add the artist otherwise
        else {
            artistInfo = {};
            artistInfo["artistID"] = artistID;
            artistInfo["dateAdded"] = dateAdded;
            artistInfo["name"] = song.artists.length ? song.artists[0].name : "";
            artistInfo["image"] = null;
            artistInfo["albums"] = {};
            artistInfo["albums"][albumID] = null;
            artistInfo["songs"] = {};
            artistInfo["songs"][songID] = null;
            window.library.artists[artistID] = artistInfo;
        }
    };

    // Gets the images for the artists in the list
    const getArtistsImages = (artists, offset) => {
        var limit = 50;
        var curr = artists.slice(offset, offset + limit);

        // Return in there is no more artists to get
        if (curr.length <= 0) {
            getUserPlaylists(0);
            return;
        }

        window.spotifyAPI.getArtists(curr).then(
            (response) => {
                for (let i = 0; i < response.artists.length; i++) {
                    var artistID = response.artists[i].id;
                    if (artistID in window.library.artists) {
                        var url = response.artists[i]["images"].length ? response.artists[i]["images"][0].url : ArtistEmpty;
                        window.library.artists[artistID]["image"] = url;
                    }
                }
                getArtistsImages(artists, offset + limit);
            },
            (err) => {
                if (err.status === 401) window.location.assign(window.serverLocation + "login");
                else console.error(err);
            }
        );
    };

    // Gets the user playlists
    const getUserPlaylists = (offset) => {
        var limit = 50;

        window.spotifyAPI.getUserPlaylists({ offset: offset, limit: limit }).then(
            (response) => {
                const { items, next } = response;

                for (let i = 0; i < items.length; i++) parseAndSavePlaylists(items[i], i);

                if (next) getUserPlaylists((offset += limit));
                else {
                    // Get the songs in each playlist
                    var playlists = Object.keys(window.library.playlists);
                    let promises = [];
                    for (var i = 0; i < playlists.length; ++i) promises.push(getPlaylistSongs(playlists[i], 0));

                    // Wait until all the playlist songs are fetched
                    Promise.all(promises).then(() => {
                        // Set the library
                        setLibrary(window.library);
                    });
                }
            },
            (err) => {
                if (err.status === 401) window.location.assign(window.serverLocation + "login");
                else console.error(err);
            }
        );
    };

    // Parse and save playlists to the library
    const parseAndSavePlaylists = (playlist, order) => {
        var playlistID = playlist.id;
        var dateAdded = order;

        // Add playlist
        if (!(playlistID in window.library.playlists)) {
            var playlistInfo = {};
            playlistInfo["playlistID"] = playlistID;
            playlistInfo["dateAdded"] = dateAdded;
            playlistInfo["name"] = playlist.name;
            playlistInfo["image"] = playlist.images.length ? playlist.images[0].url : PlaylistEmpty;
            playlistInfo["songs"] = {};
            window.library.playlists[playlistID] = playlistInfo;
        }
    };

    // Get the songs in each playlist
    const getPlaylistSongs = (playlist, offset) => {
        return new Promise((resolve, reject) => {
            var limit = 100;
            window.spotifyAPI.getPlaylistTracks(playlist, { fields: "items(track(id))", offset: offset, limit: limit }).then(
                (response) => {
                    const { items, next } = response;

                    for (var i = 0; i < items.length; ++i) {
                        if (!items[i].track) continue;
                        var songID = items[i].track.id;
                        if (songID in window.library.songs && playlist in window.library.playlists) {
                            window.library.playlists[playlist].songs[songID] = null;
                        }
                    }

                    if (next) getPlaylistSongs(playlist, (offset += limit));
                    else resolve();
                },
                (err) => {
                    if (err.status === 401) window.location.assign(window.serverLocation + "login");
                    else console.error(err);
                    reject();
                }
            );
        });
    };

    // Delete the temporal library structure
    const deleteTempLibrary = () => {
        if ("library" in window) {
            delete window.library;
        }
    };

    return <LibraryContext.Provider value={{ library, getUserLibrary }}>{props.children}</LibraryContext.Provider>;
};

export default LibraryContextProvider;
