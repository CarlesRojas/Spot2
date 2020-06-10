import React, { useState, useEffect, useContext, useRef } from "react";
import { useDrag } from "react-use-gesture";
import { useSprings } from "react-spring";

import { QueueContext } from "../contexts/QueueContext";
import { PlaybackContext } from "../contexts/PlaybackContext";
import { LibraryContext } from "../contexts/LibraryContext";
import { SpotifyContext } from "../contexts/SpotifyContext";

import SongItem from "./SongItem";
import { setLocalStorage, clamp, move, print } from "../Utils";

// Size of the viewport
const viewHeight = window.innerHeight;
const rowHeight = viewHeight / 11;

// Returns fitting styles for dragged/idle items
const getItemStyle = (order, down, originalIndex, indexBeforeMoving, y) => (index) =>
    down && index === originalIndex
        ? { y: indexBeforeMoving * rowHeight + y, zIndex: "520", immediate: (n) => n === "y" || n === "zIndex" }
        : { y: order.indexOf(index) * rowHeight, zIndex: "515", immediate: false };

const SongListSortable = (props) => {
    // Get context
    const { playSongInContext } = useContext(QueueContext);
    const { playback, setPlaybackContext } = useContext(PlaybackContext);
    const { library } = useContext(LibraryContext);
    const { moveSongInsidePlaylist } = useContext(SpotifyContext);

    // Get props
    const { songList, actions, listID, listType } = props;

    // References
    const listOrderIDs = useRef([]);
    const listOrderIndexs = useRef([]);
    useEffect(() => {
        if (!(listID in library.playlists)) return;

        listOrderIDs.current = library.playlists[listID].songOrder;
        listOrderIndexs.current = listOrderIDs.current.map((_, index) => index);
        setSprings(getItemStyle(listOrderIndexs.current));
    }, [songList]);

    // State to hold weather we are dragging vertically or horizontally
    const draggingVertically = useRef(false);

    // Springs for sorting items
    const [springs, setSprings] = useSprings(Object.keys(songList).length, getItemStyle(listOrderIndexs.current));

    const bind = useDrag(
        ({ args: [originalIndex], first, down, vxvy: [vx, vy], movement: [, y] }) => {
            if (first) draggingVertically.current = Math.abs(vy) >= Math.abs(vx);

            if (draggingVertically.current) {
                const indexBeforeMoving = listOrderIndexs.current.indexOf(originalIndex);
                const targetIndex = clamp(Math.round((indexBeforeMoving * rowHeight + y) / rowHeight), 0, Object.keys(songList).length - 1);
                const newOrderIndexs = move(listOrderIndexs.current, indexBeforeMoving, targetIndex);

                // Feed springs new style data, they'll animate the view without causing a single render
                setSprings(getItemStyle(newOrderIndexs, down, originalIndex, indexBeforeMoving, y));
                if (!down && indexBeforeMoving != targetIndex) {
                    listOrderIndexs.current = newOrderIndexs;
                    moveSongInsidePlaylist(listID, indexBeforeMoving, targetIndex);
                }
            }
        },
        { filterTaps: true, rubberband: true }
    );

    // Handle when the list is scrolled
    const handleScroll = (event) => {
        window.PubSub.emit("onCloseSongActions");
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
        playSongInContext(
            listOrderIndexs.current.map((index) => listOrderIDs.current[index]),
            listID,
            "songs",
            listOrderIndexs.current.indexOf(listOrderIDs.current.indexOf(id))
        );
    };

    // Create the component from an element in the array
    const createItem = (elem, skeleton) => {
        const { id, name, album, artist, albumID, artistID, index } = elem;
        const spring = springs[index];

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
                itemSpring={spring}
                sortBind={bind}
                sortIndex={index}
                /*onDelete={() => this.handleDeleteSong(id)} CARLES DELETE SONG*/
            />
        );
    };

    const list = listOrderIDs.current;
    const numRows = list.length > 0 ? list.length : 20;
    const totalHeight = rowHeight * numRows;

    // List to be rendered
    const renderedItems = [];
    let index = 0;

    // Add all items that will be shown
    while (index < list.length) {
        if (index < list.length && songList && list[index] in songList) {
            var { songID, name, albumID, artistID, albumName, artistName } = songList[list[index]];
            renderedItems.push(createItem({ id: songID, name, album: albumName, artist: artistName, albumID, artistID, index }, false));
        } else {
            renderedItems.push(createItem({ id: index, name: "", album: "", artist: "", albumID: "", artistID: "", index }, true));
        }
        ++index;
    }

    return (
        <div className="songList_scroll" onScroll={handleScroll}>
            <div style={{ height: totalHeight }}>{renderedItems}</div>
        </div>
    );
};
export default SongListSortable;
