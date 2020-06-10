import React, { useState, useEffect, useContext, useRef } from "react";

import { QueueContext } from "../contexts/QueueContext";
import { PlaybackContext } from "../contexts/PlaybackContext";

import SongItem from "./SongItem";
import { setLocalStorage, useForceUpdate } from "../Utils";

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
    const { playSongInContext } = useContext(QueueContext);
    const { playback, setPlaybackContext } = useContext(PlaybackContext);

    // Get props
    const { songList, actions, order, listID, listType } = props;

    // State
    const [scrollTop, setScrollTop] = useState(0);
    const listOrder = useRef(getListOrder(songList, order));

    // Hook for forcing an update
    const forceUpdate = useForceUpdate();

    // Update order when the library or the order changes
    useEffect(() => {
        listOrder.current = getListOrder(songList, order);
        forceUpdate();
    }, [songList, order]);

    // Handle when the list is scrolled
    const handleScroll = (event) => {
        window.PubSub.emit("onCloseSongActions");
        setScrollTop(event.target.scrollTop);
    };

    /* CARLES DELETE SONG
    // Handle a song being deleted
    const handleDeleteSong = (id) => {
        var list = [...this.state.listOrder];
        var index = list.indexOf(id);
        if (index > -1) list.splice(index, 1);
        this.setState({ listOrder: list });
    };
    */

    // Handle the click on this item
    const onSongClicked = (id, skeleton) => {
        if (skeleton) return;
        setPlaybackContext({
            id: listID,
            playlist: listType === "playlist",
            artist: listType === "artist",
            album: listType === "album",
        });

        // Save info in local storage
        setLocalStorage("spot_playbackContext_listID", listID);
        setLocalStorage("spot_playbackContext_playlist", listType === "playlist");
        setLocalStorage("spot_playbackContext_artist", listType === "artist");
        setLocalStorage("spot_playbackContext_album", listType === "album");

        // Carles add context
        playSongInContext(listOrder.current, listID, "songs", listOrder.current.indexOf(id));
    };

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
                onSongClicked={onSongClicked}
                itemSpring={null}
                sortBind={() => {}}
                sortIndex={null}
                /*onDelete={() => this.handleDeleteSong(id)} CARLES DELETE SONG*/
            />
        );
    };

    const list = listOrder.current;
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
        if (index < list.length && songList && list[index] in songList) {
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
