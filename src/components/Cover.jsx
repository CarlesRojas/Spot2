import React, { useContext } from "react";

import { prettifyName } from "../Utils";

import { SpotifyContext } from "../contexts/SpotifyContext";
import { LibraryContext } from "../contexts/LibraryContext";
import { PlaybackContext } from "../contexts/PlaybackContext";

// Icons
import AlbumEmpty from "../resources/AlbumEmpty.svg";

const Cover = () => {
    // Get the context
    const { play, pause } = useContext(SpotifyContext);
    const { playback } = useContext(PlaybackContext);
    const { library } = useContext(LibraryContext);
    const { playing, songID, exists } = playback;

    // Default values
    var songNamePretty = "";
    var artistNamePretty = "";
    var albumCover = AlbumEmpty;

    // Get song name and artist
    if (exists && songID && library.songs && songID in library.songs) {
        const { name, artistID, image } = library.songs[songID];
        const artistName = artistID in library.artists ? library.artists[artistID].name : "";

        // Treated information
        songNamePretty = prettifyName(name);
        artistNamePretty = prettifyName(artistName);
        albumCover = image;
    } else {
        // CARLES api call to spotify to get the info for this songID
    }

    // Called when the cover is clicked by the user
    const handleCoverClick = () => {
        if (playback.playing) pause();
        else play();
    };

    // Image filter for pause / play
    var imageFilter = playing || albumCover === AlbumEmpty ? "none" : "grayscale(100%)";
    var animationPaused = playing ? "" : "paused";

    return (
        <div className="cover_wrapper">
            <div
                className="cover_image"
                onClick={() => handleCoverClick()}
                style={{ filter: imageFilter, backgroundImage: `url(${albumCover})`, animationPlayState: animationPaused }}
            />
            <div id="cover_titleGradient" />
            <div className="cover_infoWrapper">
                <p className="cover_song">{songNamePretty}</p>
                <p className="cover_artist">{artistNamePretty}</p>
            </div>
        </div>
    );
};

export default Cover;