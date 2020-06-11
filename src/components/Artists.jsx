import React, { useState, useRef, useEffect, useContext } from "react";

import SortIcon from "../resources/sort.svg";
import { LibraryContext } from "../contexts/LibraryContext";
import { PlaybackContext } from "../contexts/PlaybackContext";
import { PopupContext } from "../contexts/PopupContext";
import AlbumArtistItem from "./AlbumArtistItem";
import { useEventListener, setLocalStorage, getLocalStorage, useForceUpdate } from "../Utils";

// Size of the viewport
const viewWidth = window.innerWidth;
const rowHeight = viewWidth / 1.75;

const scrollBarWidth = 5; // 5px
const listMargin = 1.5 * 16; // 1.5rem
const artistPadding = 0.8 * 16; // 0.8rem
const artistWidth = (viewWidth - scrollBarWidth - listMargin) / 2;

// Returns a list of song IDs in the order specified: ["name", "nameReversed", "dateAdded", "dateReversed"]
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

        // If the first order is the same sort by artist name
        if (orderA === orderB) {
            var albumA = list[a["artistID"]].name;
            var albumB = list[b["artistID"]].name;

            // If the artist is the same sort by artist id
            if (albumA === albumB) {
                var idA = a["artistID"];
                var idB = a["artistID"];
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
        .map((x) => x["artistID"]);
};
const Artists = () => {
    // Get contexts
    const { openPopup } = useContext(PopupContext);
    const { library } = useContext(LibraryContext);
    const { playbackContext } = useContext(PlaybackContext);

    // References
    const longPressTimeout = useRef(null);
    const sortButtonRef = useRef();

    // Order Settings State
    const cookieOrder = getLocalStorage("spot_artistOrder");
    const [orderSettings, setOrderSettings] = useState({
        currentOrder: cookieOrder ? cookieOrder : "dateAdded",
        iconRotation: !cookieOrder || cookieOrder === "name" || cookieOrder === "dateAdded" ? 0 : 180,
        items: [
            { name: "Name", callbackName: "name", selected: cookieOrder && cookieOrder === "name" ? true : false },
            { name: "Date Added", callbackName: "dateAdded", selected: !cookieOrder || cookieOrder === "dateAdded" ? true : false },
        ],
    });

    // State
    const [scrollTop, setScrollTop] = useState(0);
    const listOrder = useRef(getListOrder(library.artists, "dateAdded"));

    // Hook for forcing an update
    const forceUpdate = useForceUpdate();

    // Update order when the library or the order changes
    useEffect(() => {
        listOrder.current = getListOrder(library.artists, orderSettings.currentOrder);
        forceUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [library.artists, orderSettings.currentOrder]);

    // Handle when the list is scrolled
    const handleScroll = (event) => {
        setScrollTop(event.target.scrollTop);
    };

    // Called when a different sort order is selected from the popup
    const handleSortChange = (newOrder) => {
        // Save order in cookies
        setLocalStorage("spot_artistOrder", newOrder);

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

            // Show Popup
            openPopup({
                type: "sortBy",
                name: "SORT BY",
                items: orderSettings.items,
                callback: handleSortChange,
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

            // Save order in cookies
            setLocalStorage("spot_artistOrder", newOrder);

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
            <AlbumArtistItem
                key={id}
                height={rowHeight}
                width={artistWidth}
                padding={artistPadding}
                id={id}
                name={name}
                image={image}
                selected={playbackContext.artist && id === playbackContext.id}
                skeleton={skeleton}
                type={"artist"}
                noName={false}
            />
        );
    };

    const list = listOrder.current;
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
        if (index < list.length && library.artists && list[index] in library.artists) {
            var { artistID, name, image } = library.artists[list[index]];
            renderedItems.push(createItem({ id: artistID, name: name, image: image }, false));
        } else if (list.length <= 0) {
            renderedItems.push(createItem({ id: index, name: "", image: "" }, true));
        }
        ++index;
    }

    return (
        <>
            <p className="artists_title">Liked Artists</p>
            <div className="artists_sortButton" ref={sortButtonRef}>
                <img className="artists_sortIcon" src={SortIcon} alt="" style={{ transform: "rotate( " + orderSettings.iconRotation + "deg)" }} />
            </div>
            <div className="artists_scroll" onScroll={handleScroll}>
                <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                    <ol className="artists_list">{renderedItems}</ol>
                </div>
            </div>
        </>
    );
};
export default Artists;
