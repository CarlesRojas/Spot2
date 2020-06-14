import React, { useEffect, useContext, useRef } from "react";
import { useDrag } from "react-use-gesture";
import { useSprings } from "react-spring";

// Get contexts
import { QueueContext } from "../contexts/QueueContext";
import { PlaybackContext } from "../contexts/PlaybackContext";
import { LibraryContext } from "../contexts/LibraryContext";
import { SpotifyContext } from "../contexts/SpotifyContext";

import SongItem from "./SongItem";
import { setLocalStorage, clamp, move } from "../Utils";

// Size of the viewport
const viewHeight = window.innerHeight;
const rowHeight = viewHeight / 11;

// Autoscroll settings
const scrollMinSpeed = 5;
const scrollMaxSpeed = 25;
const scrollAccelerateEveryXFremes = 10;

// Returns fitting styles for dragged/idle items
const getItemStyle = (order, down, originalIndex, indexBeforeMoving, y) => (index) => {
    //if (down && index === originalIndex) console.log(y);
    return down && index === originalIndex
        ? { y: indexBeforeMoving * rowHeight + y, zIndex: "520", immediate: (n) => n === "y" || n === "zIndex" }
        : { y: order.indexOf(index) * rowHeight, zIndex: "515", immediate: false };
};

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

    // Effect to set the original order
    useEffect(() => {
        if (listID in library.playlists) {
            listOrderIDs.current = library.playlists[listID].songOrder;
            listOrderIndexs.current = listOrderIDs.current.map((_, index) => index);
            setSprings(getItemStyle(listOrderIndexs.current));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [songList]);

    // Scroll container reference and scroll elements
    const scrollDOM = useRef(null);
    const scrollTimeout = useRef(null);
    const indexBeingMoved = useRef({ originalIndex: null, indexBeforeMoving: null, y: null, order: [], dispY: 0 });
    const isScrolling = useRef({ up: false, down: false });
    const totalScrollFrames = useRef(0);

    // Function to autoscroll when sorting
    const scroll = (scrollDown) => {
        const { originalIndex, indexBeforeMoving, y, dispY } = indexBeingMoved.current;
        isScrolling.current = { up: !scrollDown, down: scrollDown };

        // Get current scroll speed
        totalScrollFrames.current = totalScrollFrames.current + 1;
        var scrollSpeed = Math.min(scrollMinSpeed + Math.floor(totalScrollFrames.current / scrollAccelerateEveryXFremes), scrollMaxSpeed);

        // Get constants
        const containerHeight = scrollDOM.current.offsetHeight;
        const currScrollTop = scrollDOM.current.scrollTop;
        const numRows = list.length > 0 ? list.length : 20;
        const totalHeight = rowHeight * numRows;
        const maxScroll = totalHeight - containerHeight;

        // Get new displacement value
        const newDispY = dispY + scrollSpeed * (scrollDown ? 1 : -1);

        // Prevent autoscroll past the min and max
        if ((!scrollDown && currScrollTop <= 0) || (scrollDown && currScrollTop >= maxScroll)) {
            stopScrolling();
            return;
        }

        // Scroll the container and set recursive timeout for next scroll
        scrollDOM.current.scrollBy(0, scrollSpeed * (scrollDown ? 1 : -1));
        scrollTimeout.current = setTimeout(() => scroll(scrollDown), 10);

        // Get the current position and new order
        const targetIndex = clamp(Math.round((indexBeforeMoving * rowHeight + y + newDispY) / rowHeight), 0, Object.keys(songList).length - 1);
        const newOrderIndexs = move(listOrderIndexs.current, indexBeforeMoving, targetIndex);

        // Update status
        indexBeingMoved.current = { ...indexBeingMoved.current, dispY: newDispY };

        // Move item accordingly
        setSprings(getItemStyle(newOrderIndexs, true, originalIndex, indexBeforeMoving, y + newDispY));
    };

    // Function to stop autoscrolling
    const stopScrolling = () => {
        isScrolling.current = { up: false, down: false };
        totalScrollFrames.current = 0;
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = null;
    };

    // State to hold weather we are dragging vertically or horizontally
    const draggingVertically = useRef(false);

    // Springs for sorting items
    const [springs, setSprings] = useSprings(Object.keys(songList).length, getItemStyle(listOrderIndexs.current));

    const bind = useDrag(
        ({ args: [originalIndex], first, down, vxvy: [vx, vy], movement: [, y], delta: [, yDelta] }) => {
            // Check drag direction and reset indexBeingMoved
            if (first) {
                draggingVertically.current = Math.abs(vy) >= Math.abs(vx);
                indexBeingMoved.current = { originalIndex: null, indexBeforeMoving: null, y: null, order: [], dispY: 0 };
            }

            // Only if is dragging vertically
            if (draggingVertically.current) {
                var currentY = y + indexBeingMoved.current.dispY;

                // Reorder accordingly
                const indexBeforeMoving = listOrderIndexs.current.indexOf(originalIndex);
                const targetIndex = clamp(Math.round((indexBeforeMoving * rowHeight + currentY) / rowHeight), 0, Object.keys(songList).length - 1);
                var newOrderIndexs = move(listOrderIndexs.current, indexBeforeMoving, targetIndex);

                // Get info about container
                const containerHeight = scrollDOM.current.offsetHeight;
                const numRows = list.length > 0 ? list.length : 20;
                const totalHeight = rowHeight * numRows;
                const maxScroll = totalHeight - containerHeight;
                const yTop = currentY + rowHeight * indexBeforeMoving;
                const currScrollTop = scrollDOM.current.scrollTop;
                const scrollDownDiference = yTop + rowHeight - currScrollTop - containerHeight;
                const scrollUpDiference = currScrollTop - yTop;

                // Cancel scroll if drag changes direction
                if ((isScrolling.current.down && vy < 0) || (isScrolling.current.up && vy > 0)) stopScrolling();

                // Set the container to scroll
                if (scrollDownDiference >= 0 && !scrollTimeout.current && currScrollTop < maxScroll) scroll(true);
                else if (scrollUpDiference >= 0 && !scrollTimeout.current && currScrollTop > 0) scroll(false);
                // If it is not scrolling
                else if (scrollDownDiference < 0 && scrollUpDiference < 0) {
                    // Set current moved row properties
                    indexBeingMoved.current = {
                        originalIndex,
                        indexBeforeMoving,
                        y,
                        order: listOrderIndexs.current,
                        dispY: indexBeingMoved.current.dispY,
                    };

                    // Feed springs new style data, they'll animate the view without causing a single render
                    setSprings(getItemStyle(newOrderIndexs, down, originalIndex, indexBeforeMoving, currentY));
                }

                if (!down && indexBeforeMoving !== targetIndex) {
                    // Feed springs new style data, they'll animate the view without causing a single render
                    setSprings(getItemStyle(newOrderIndexs, down, originalIndex, indexBeforeMoving, currentY));

                    // Reset autoscroll
                    stopScrolling();
                    indexBeingMoved.current = { originalIndex: null, indexBeforeMoving: null, y: null, order: [], dispY: 0 };

                    // Save new order
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
        <div className="songList_scroll" ref={scrollDOM} onScroll={handleScroll}>
            <div style={{ height: totalHeight }}>{renderedItems}</div>
        </div>
    );
};
export default SongListSortable;
