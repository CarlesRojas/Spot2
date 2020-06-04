import React, { useContext } from "react";

import { ProfileContext } from "../contexts/ProfileContext";
import { LibraryContext } from "../contexts/LibraryContext";

import { prettifyName } from "../Utils";

const PlaylistItem = (props) => {
    const { id, height, name, image, selected, skeleton } = props;

    // Get contexts
    const { openProfile } = useContext(ProfileContext);
    const { library } = useContext(LibraryContext);

    // Handle the click on this item
    const handleClick = (id, skeleton) => {
        // Return if it is a skeleton or the id is not in the user playlists
        if (skeleton || !(id in library.playlists)) return;

        // Open the playlist profile
        openProfile({ type: "playlist", id });
    };

    const coverSize = "calc(" + height + "px - 1rem)";
    const mockImage = "https://i.imgur.com/06SzS3d.png";

    // Skeleton image
    if (skeleton) var cover = <div className="itemPlaylist_skeletonImage" style={{ height: coverSize, width: coverSize }} />;
    else cover = <img className="itemPlaylist_image" src={image} alt={mockImage} style={{ height: coverSize, width: coverSize }} />;

    return (
        <button className="itemPlaylist_button" onClick={() => handleClick(id, skeleton)} style={{ height: height + "px" }}>
            {cover}
            <p className={"itemPlaylist_name " + (skeleton ? "itemPlaylist_skeletonName" : "") + (selected ? " itemPlaylist_selectedName" : "")}>
                {skeleton ? "-" : prettifyName(name)}
            </p>
        </button>
    );
};
export default PlaylistItem;
