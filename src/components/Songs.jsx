import React, { useState, useRef, useEffect, useContext } from "react";

import SortIcon from "../resources/sort.svg";
import { LibraryContext } from "../contexts/LibraryContext";
import { PopupContext } from "../contexts/PopupContext";
import SongList from "./SongList";

const Songs = () => {
    // Get contexts
    const { openPopup } = useContext(PopupContext);
    const { library } = useContext(LibraryContext);

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

    // On sort button press or click
    useEffect(() => {
        var currSortButton = sortButtonRef;
        currSortButton.current.addEventListener("touchstart", () => (longPressTimeout.current = setTimeout(() => handleSortLongPress(), 500)));
        currSortButton.current.addEventListener("touchend", () => handleSortClick());
        return () => {
            currSortButton.current.removeEventListener("touchstart", () => (longPressTimeout.current = setTimeout(() => handleSortLongPress(), 500)));
            currSortButton.current.removeEventListener("touchend", () => handleSortClick());
        };
    }, []);

    // Prepare song actions
    var actions = {
        left: {
            numberOfActionsAlwaysVisible: 0,
            // Items in normal order (first one is in the left)
            list: [
                { event: "onAlbumSelected", type: "album" },
                { event: "onArtistSelected", type: "artist" },
                { event: "onAddToClicked", type: "add" },
            ],
        },
        right: {
            numberOfActionsAlwaysVisible: 0,
            // Items in reverse order (first one is in the right)
            list: [{ event: "onSongLikeClicked", type: "like" }],
        },
    };

    return (
        <>
            {/*<Popup type="sortBy" items={orderPopupElems} callback={handleSortChange} open={popupOpen} closePopup={closePopup}></Popup>*/}
            <p className="songs_title">Liked Songs</p>
            <div className="songs_sortButton" ref={sortButtonRef}>
                <img className="songs_sortIcon" src={SortIcon} alt="" style={{ transform: "rotate( " + orderSettings.iconRotation + "deg)" }} />
            </div>
            <div className="songs_listWrapper">
                <SongList songList={library.songs} actions={actions} order={orderSettings.currentOrder} />
            </div>
            <button className="songs_shuffle">SHUFFLE</button>
        </>
    );
};
export default Songs;
