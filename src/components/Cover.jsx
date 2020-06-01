import React, { useContext } from "react";
import { PlaybackContext } from "../contexts/PlaybackContext";
import { LibraryContext } from "../contexts/LibraryContext";
import { prettifyName } from "../Utils";

const Cover = () => {
    // Get the context
    const { playback } = useContext(PlaybackContext);
    const { library } = useContext(LibraryContext);
    const { playing, songID, exists } = playback;

    // Default values
    var songNamePretty = "No Name";
    var artistNamePretty = "No Artist";
    var albumCover = null;

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
        console.log("CLICK");
    };

    // Image filter for pause / play
    var imageFilter = playing ? "none" : "grayscale(100%)";

    return (
        <div className="cover_wrapper">
            <div className="cover_image" onClick={() => handleCoverClick()} style={{ filter: imageFilter, backgroundImage: `url(${albumCover})` }} />
            <div id="cover_titleGradient" />
            {/* <div id="cover_timeGradient" style={{ clipPath: clipPath, backgroundImage: imageTimeGradient }} /> */}
            <div className="cover_infoWrapper">
                <p className="cover_song">{songNamePretty}</p>
                <p className="cover_artist">{artistNamePretty}</p>
            </div>
        </div>
    );
};

export default Cover;
