import React, { useContext } from "react";

import { ProfileContext } from "../contexts/ProfileContext";
import { LibraryContext } from "../contexts/LibraryContext";

import { prettifyName } from "../Utils";

const AlbumArtistItem = (props) => {
    const { id, height, width, padding, name, image, selected, skeleton, type, noName } = props;

    // Get contexts
    const { openProfile } = useContext(ProfileContext);
    const { library } = useContext(LibraryContext);

    // Handle the click on this item
    const handleClick = (id, skeleton) => {
        // Return if it is a skeleton or the id is not in the user albums/artists
        if (skeleton || (type === "artist" && !(id in library.artists)) || (type === "album" && !(id in library.albums))) return;

        // Open the profile
        openProfile({ type, id });
    };

    // Substract padding from the cover size
    const coverSize = "calc(" + width + "px - " + padding * 2 + "px)";

    // Get type variables
    if (type === "album") {
        var mockImage = "https://i.imgur.com/iajaWIN.png";
        var borderRadius = "0.5rem";
    } else {
        mockImage = "https://i.imgur.com/PgCafqK.png";
        borderRadius = "50%";
    }

    // Skeleton image
    if (skeleton)
        var cover = <div className="albumArtistItem_skeletonCover" style={{ height: coverSize, width: coverSize, borderRadius: borderRadius }} />;
    else
        cover = (
            <img
                className="albumArtistItem_cover"
                src={image}
                alt={mockImage}
                style={{ height: coverSize, width: coverSize, borderRadius: borderRadius }}
            />
        );

    // Skeleton name
    if (noName) var title = null;
    else if (skeleton) {
        title = (
            <p className={"albumArtistItem_skeletonName "} style={{ width: width * 0.5 + "px" }}>
                {"-"}
            </p>
        );
    } else {
        title = (
            <p
                className={"albumArtistItem_name " + (selected ? " albumArtistItem_selectedName" : "")}
                style={{ width: coverSize, padding: padding / 2 + "px " + padding + "px" }}
            >
                {prettifyName(name)}
            </p>
        );
    }

    return (
        <div className="albumArtistItem_wrapper">
            <button
                className="albumArtistItem_button"
                onClick={() => handleClick(id, skeleton)}
                style={{ height: height + "px", width: width + "px", padding: padding + "px" }}
            >
                {cover}
                {title}
            </button>
        </div>
    );
};
export default AlbumArtistItem;
