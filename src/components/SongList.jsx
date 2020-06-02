import React, { useState, useEffect, useContext } from "react";
import { PlaybackContext } from "../contexts/PlaybackContext";
import SongItem from "./SongItem";

// Size of the viewport
const viewHeight = window.innerHeight;

const rowHeight = viewHeight / 11;

// Returns a list of song IDs in the order specified: ["album", "name", "nameReversed", "dateAdded", "dateReversed"]
const getListOrder = (list, order) => {
    function orderFunction(a, b, order) {
        if (order === "name") {
            var orderA = a["name"];
            var orderB = b["name"];
        } else if (order === "nameReversed") {
            orderA = b["name"];
            orderB = a["name"];
        } else if (order === "dateAdded") {
            // Reversed so it orders recents first
            orderA = b["dateAdded"];
            orderB = a["dateAdded"];
        } else if (order === "dateReversed") {
            orderA = a["dateAdded"];
            orderB = b["dateAdded"];
        } else {
            orderA = a["albumID"];
            orderB = b["albumID"];
        }

        // If the first order is the same sort by album name
        if (orderA === orderB) {
            var albumA = a["albumName"];
            var albumB = b["albumName"];

            // If the album is the same sort by track number
            if (albumA === albumB) {
                var trackNumA = a["trackNumber"];
                var trackNumB = b["trackNumber"];
                return trackNumA >= trackNumB ? 1 : -1;
            } else {
                return albumA > albumB ? 1 : -1;
            }
        } else {
            return orderA > orderB ? 1 : -1;
        }
    }

    return Object.values(list)
        .sort((a, b) => orderFunction(a, b, order))
        .map((x) => x["songID"]);
};

const SongList = (props) => {
    // Get context
    const { playback } = useContext(PlaybackContext);

    // Get props
    const { songList, actions, order } = props;

    // State
    const [scrollTop, setScrollTop] = useState(0);
    const [listOrder, setListOrder] = useState(getListOrder(songList, order));

    // Update order when the library or the order changes
    useEffect(() => {
        setListOrder(getListOrder(songList, order));
    }, [songList, order]);

    // Handle when the list is scrolled
    const handleScroll = (event) => {
        window.PubSub.emit("onCloseSongActions");
        setScrollTop(event.target.scrollTop);
    };

    /* CARLES
    // Handle a song being deleted
    const handleDeleteSong = (id) => {
        var list = [...this.state.listOrder];
        var index = list.indexOf(id);
        if (index > -1) list.splice(index, 1);
        this.setState({ listOrder: list });
    };
    */

    // Create the component from an element in the array
    const createItem = (elem, skeleton) => {
        const { id, name, album, artist, albumID, artistID } = elem;

        return (
            <SongItem
                key={id}
                height={rowHeight}
                id={id}
                name={name}
                album={album}
                artist={artist}
                albumID={albumID}
                artistID={artistID}
                selected={id === playback["songID"]}
                skeleton={skeleton}
                actions={actions}
                /*onDelete={() => this.handleDeleteSong(id)} CARLES*/
            />
        );
    };

    const list = listOrder;
    const numRows = list.length > 0 ? list.length : 20;

    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 20);
    const endIndex = Math.min(startIndex + 40, numRows);
    const totalHeight = rowHeight * numRows;
    const paddingTop = startIndex * rowHeight;

    // List to be rendered
    const renderedItems = [];
    let index = startIndex;

    // Add all items that will be shown
    while (index < endIndex) {
        if (index < list.length) {
            var { songID, name, albumID, artistID, albumName, artistName } = songList[list[index]];
            renderedItems.push(createItem({ id: songID, name, album: albumName, artist: artistName, albumID, artistID }, false));
        } else {
            renderedItems.push(createItem({ id: index, name: "", album: "", artist: "", albumID: "", artistID: "" }, true));
        }
        ++index;
    }

    return (
        <div className="songList_scroll" onScroll={handleScroll}>
            <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                <ol className="songList_list">{renderedItems}</ol>
            </div>
        </div>
    );
};
export default SongList;
