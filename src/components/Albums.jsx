import React, { useState, useRef, useEffect, useContext } from "react";

import SortIcon from "../resources/sort.svg";
import { LibraryContext } from "../contexts/LibraryContext";
import { PlaybackContext } from "../contexts/PlaybackContext";
import { PopupContext } from "../contexts/PopupContext";
import ItemAlbumArtist from "./ItemAlbumArtist";
import { useEventListener } from "../Utils";

// Size of the viewport
const viewWidth = window.innerWidth;
const rowHeight = viewWidth / 1.75;

const scrollBarWidth = 5; // 5px
const listMargin = 1.5 * 16; // 1.5rem
const albumPadding = 0.8 * 16; // 0.8rem
const albumWidth = (viewWidth - scrollBarWidth - listMargin) / 2;

// Returns a list of song IDs in the order specified: ["name", "dateAdded"]
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
        } else {
            orderA = a["dateAdded"];
            orderB = b["dateAdded"];
        }

        // If the first order is the same sort by album name
        if (orderA === orderB) {
            var albumA = list[a["albumID"]].name;
            var albumB = list[b["albumID"]].name;

            // If the album is the same sort by album id
            if (albumA === albumB) {
                var idA = a["albumID"];
                var idB = a["albumID"];
                return idA > idB ? 1 : -1;
            } else {
                return albumA > albumB ? 1 : -1;
            }
        } else {
            return orderA > orderB ? 1 : -1;
        }
    }

    return Object.values(list)
        .sort((a, b) => orderFunction(a, b, order))
        .map((x) => x["albumID"]);
};

const Albums = () => {
    // Get contexts
    const { openPopup } = useContext(PopupContext);
    const { library } = useContext(LibraryContext);
    const { playback } = useContext(PlaybackContext);

    // References
    const longPressTimeout = useRef(null);
    const sortButtonRef = useRef();

    // Order Settings State
    const [orderSettings, setOrderSettings] = useState({
        currentOrder: "dateAdded",
        iconRotation: 0,
        items: [
            { name: "Name", callbackName: "name", selected: false },
            { name: "Date Added", callbackName: "dateAdded", selected: true },
        ],
    });

    // State
    const [scrollTop, setScrollTop] = useState(0);
    const [listOrder, setListOrder] = useState(getListOrder(library.albums, "dateAdded"));

    // Update order when the library or the order changes
    useEffect(() => {
        setListOrder(getListOrder(library.albums, orderSettings.currentOrder));
    }, [library.albums, orderSettings.currentOrder]);

    // Handle when the list is scrolled
    const handleScroll = (event) => {
        setScrollTop(event.target.scrollTop);
    };

    // Called when a different sort order is selected from the popup
    const handleSortChange = (newOrder) => {
        setOrderSettings({
            currentOrder: newOrder,
            iconRotation: 0,
            items: [
                { name: "Name", callbackName: "name", selected: newOrder === "name" || newOrder === "nameReversed" },
                { name: "Date Added", callbackName: "dateAdded", selected: newOrder === "dateAdded" || newOrder === "dateAddedReversed" },
            ],
        });
    };

    // Called when the sort icon is clicked
    const handleSortClick = () => {
        // Is the timeout is still there, then it is a short click
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;

            setOrderSettings((prevOrderSettings) => {
                // Show Popup
                openPopup({
                    type: "sortBy",
                    name: "SORT BY",
                    items: prevOrderSettings.items,
                    callback: handleSortChange,
                });
                return prevOrderSettings;
            });
        }
    };

    // Called when the sort icon is long pressed
    const handleSortLongPress = () => {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;

        setOrderSettings((prevOrderSettings) => {
            if (prevOrderSettings.currentOrder === "name") var newOrder = "nameReversed";
            if (prevOrderSettings.currentOrder === "nameReversed") newOrder = "name";
            if (prevOrderSettings.currentOrder === "dateAdded") newOrder = "dateAddedReversed";
            if (prevOrderSettings.currentOrder === "dateAddedReversed") newOrder = "dateAdded";

            return { ...prevOrderSettings, currentOrder: newOrder, iconRotation: prevOrderSettings.iconRotation === 0 ? 180 : 0 };
        });
    };

    // Add event listener using our hook
    useEventListener("touchstart", () => (longPressTimeout.current = setTimeout(() => handleSortLongPress(), 500)), sortButtonRef.current);
    useEventListener("touchend", () => handleSortClick(), sortButtonRef.current);

    // Create the component from an element in the array
    const createItem = (elem, skeleton) => {
        const { id, name, image } = elem;

        return (
            <ItemAlbumArtist
                key={id}
                height={rowHeight}
                width={albumWidth}
                padding={albumPadding}
                id={id}
                name={name}
                image={image}
                selected={id === playback["albumID"]}
                skeleton={skeleton}
                type={"album"}
                noName={false}
            />
        );
    };

    const list = listOrder;
    const numRows = list.length > 0 ? Math.ceil(list.length / 2) : 20;

    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) * 2 - 10);
    const endIndex = Math.min(startIndex + 40, numRows * 2);
    const totalHeight = rowHeight * numRows;
    const paddingTop = (startIndex * rowHeight) / 2;

    // List to be rendered
    const renderedItems = [];
    let index = startIndex;

    // Add all items that will be shown
    while (index < endIndex) {
        if (index < list.length) {
            var { albumID, name, image } = library.albums[list[index]];
            renderedItems.push(createItem({ id: albumID, name: name, image: image }, false));
        } else if (list.length <= 0) {
            renderedItems.push(createItem({ id: index, name: "", image: "" }, true));
        }
        ++index;
    }

    return (
        <>
            <p className="albums_title">Liked Albums</p>
            <div className="albums_sortButton" ref={sortButtonRef}>
                <img className="albums_sortIcon" src={SortIcon} alt="" style={{ transform: "rotate( " + orderSettings.iconRotation + "deg)" }} />
            </div>
            <div className="albums_scroll" onScroll={handleScroll}>
                <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                    <ol className="albums_list">{renderedItems}</ol>
                </div>
            </div>
        </>
    );
};
export default Albums;
