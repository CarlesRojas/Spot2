import React from "react";
import { prettifyName, print } from "../Utils";

const ItemAlbumArtist = (props) => {
    const { id, height, width, padding, name, image, selected, skeleton, type, noName } = props;

    // Handle the click on this item
    const handleClick = (id, skeleton) => {
        //var event = type === "album" ? "onAlbumSelected" : "onArtistSelected";
        if (!skeleton) print((type === "album" ? "ALBUM" : "ARTIST") + " SELECTED: " + id, "cyan");
        //window.PubSub.emit(event, { id }); CARLES
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
        var cover = <div className="itemAlbumArtist_skeletonCover" style={{ height: coverSize, width: coverSize, borderRadius: borderRadius }} />;
    else
        cover = (
            <img
                className="itemAlbumArtist_cover"
                src={image}
                alt={mockImage}
                style={{ height: coverSize, width: coverSize, borderRadius: borderRadius }}
            />
        );

    // Skeleton name
    if (noName) var title = null;
    else if (skeleton) {
        title = (
            <p className={"itemAlbumArtist_skeletonName "} style={{ width: width * 0.5 + "px" }}>
                {"-"}
            </p>
        );
    } else {
        title = (
            <p
                className={"itemAlbumArtist_name " + (selected ? " itemAlbumArtist_selectedName" : "")}
                style={{ width: coverSize, padding: padding / 2 + "px " + padding + "px" }}
            >
                {prettifyName(name)}
            </p>
        );
    }

    return (
        <div className="itemAlbumArtist_wrapper">
            <button
                className="itemAlbumArtist_button"
                onClick={() => handleClick(id, skeleton)}
                style={{ height: height + "px", width: width + "px", padding: padding + "px" }}
            >
                {cover}
                {title}
            </button>
        </div>
    );
};
export default ItemAlbumArtist;
