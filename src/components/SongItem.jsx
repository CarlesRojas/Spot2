import React, { useState, useEffect, useContext } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";

import { LibraryContext } from "../contexts/LibraryContext";
import { ProfileContext } from "../contexts/ProfileContext";

import { prettifyName, print } from "../Utils";

// Icons
import AlbumIcon from "../resources/albumSmall.svg";
import ArtistIcon from "../resources/artistSmall.svg";
import AddIcon from "../resources/add.svg";
import SortIcon from "../resources/hamburger.svg";
import RemoveIcon from "../resources/remove.svg";

// Size of the viewport
const viewWidth = window.innerWidth;

const iconWidth = 3 * 16; // 3rem
const scrollBarWidth = 5; // 5px
const listMargin = 1.5 * 16; // 1.5rem

const SongItem = (props) => {
    const { height, id, name, album, artist, albumID, artistID, selected, skeleton, actions, onSongClicked, itemSpring, sortBind, sortIndex } = props;

    // Get contexts
    const { openProfile } = useContext(ProfileContext);
    const { library } = useContext(LibraryContext);

    // Information about actions
    const hiddenLeftIcons = actions.left.list.length - actions.left.numberOfActionsAlwaysVisible;
    const hiddenRightIcons = actions.right.list.length - actions.right.numberOfActionsAlwaysVisible;
    const containerWidth = viewWidth - scrollBarWidth;

    // Information about width
    const width = containerWidth + (hiddenLeftIcons + hiddenRightIcons) * iconWidth;
    const nameWidth =
        containerWidth - (actions.left.numberOfActionsAlwaysVisible + actions.right.numberOfActionsAlwaysVisible) * iconWidth - listMargin;
    const nameLeftOffset = actions.left.list.length * iconWidth;

    // Main positions for the container
    const leftX = 0;
    const normalX = hiddenLeftIcons * -iconWidth;
    const rightX = (hiddenLeftIcons + hiddenRightIcons) * -iconWidth;

    // Spring hook
    const [position, setPosition] = useState("normal"); // "normal", "left", "right"
    const [currentX, setCurrentX] = useState(normalX);
    const [draggingVertically, setDraggingVertically] = useState(false);
    const [{ x }, set] = useSpring(() => ({ x: normalX, config: { clamp: true } }));

    // Efect to subscribe to events
    useEffect(() => {
        // Funcion to hide the actions
        const hideActions = (ignoreID) => {
            if (ignoreID && ignoreID === id) return;
            setCurrentX(normalX);
            setPosition("normal");
            set({ x: normalX });
        };

        // Only subscribe if the actions are open
        if (position !== "normal") window.PubSub.sub("onCloseSongActions", hideActions);

        return () => {
            window.PubSub.unsub("onCloseSongActions", hideActions);
        };
    }, [id, normalX, set, position]);

    // Function to show the name
    const showName = () => {
        setCurrentX(normalX);
        setPosition("normal");
        set({ x: normalX });
    };

    // Function to show the left actions
    const showLeftActions = () => {
        setCurrentX(leftX);
        setPosition("left");
        set({ x: leftX });
    };

    // Function to show the right actions
    const showRightActions = () => {
        setCurrentX(rightX);
        setPosition("right");
        set({ x: rightX });
    };

    // Drag Hook
    const dragBind = useDrag(
        ({ first, last, vxvy: [vx, vy], movement: [mx], cancel, canceled }) => {
            if (first) {
                window.PubSub.emit("onCloseSongActions", id);
                setDraggingVertically(Math.abs(vy) >= Math.abs(vx));
            }

            const wrong_direction = (position === "left" && vx > 0) || (position === "right" && vx < 0);

            // Dragging Horizontally
            if (!first && !draggingVertically && !wrong_direction) {
                // If user releases after the threshold to the left we open, othersie close it
                if (!canceled && last && vx < -0.5) {
                    if (position === "left") showName();
                    else if (position === "normal") showRightActions();
                }

                // If user releases after the threshold to the right we open, othersie close it
                else if (!canceled && last && vx > 0.5) {
                    if (position === "right") showName();
                    else if (position === "normal") showLeftActions();
                }
                // Cancel the movement
                else if (!canceled && last) {
                    if (position === "left") showLeftActions();
                    else if (position === "normal") showName();
                    else showRightActions();
                }

                // If user keeps dragging -> move panel following the position
                else {
                    // If the position goes to next stage -> cancel drag and move
                    if (position === "left" && mx <= normalX) {
                        showName();
                        cancel();
                    } else if (position === "right" && mx >= normalX) {
                        showName();
                        cancel();
                    } else if (position === "normal" && mx >= leftX) {
                        showLeftActions();
                        cancel();
                    } else if (position === "normal" && mx <= rightX) {
                        showRightActions();
                        cancel();
                    } else if (!canceled) {
                        set({ x: mx, immediate: false, config: config.stiff });
                    }
                }
            }

            // Wrong direction
            else if (wrong_direction) {
                cancel();
            }
        },
        { initial: () => [currentX, 0], filterTaps: true, rubberband: true }
    );

    // Handle action click
    const handleActionClick = (importantID, action) => {
        /*
            Possible actions:
                - add: ADD TO PLAYLIST OR QUEUE
                - remove: REMOVE FROM PLAYLIST OR QUEUE
                - album: OPEN THE SONGS ALBUM
                - artist: OPEN THE SONGS ARTIST
        */

        window.PubSub.emit("onCloseSongActions");

        switch (action) {
            // Add item to the playlist or queue CARLES
            case "add":
                print("ADD", "cyan");
                break;

            // Remove item from the playlist or queue CARLES
            case "remove":
                print("REMOVE", "cyan");
                break;

            // Return if  the id is not in the user artists -> Otherwise open the artist profile
            case "artist":
                if (!(importantID in library.artists)) return;
                openProfile({ type: "artist", id: importantID });
                break;

            // Return if  the id is not in the user albums -> Otherwise open the album profile
            case "album":
                if (!(importantID in library.albums)) return;
                openProfile({ type: "album", id: importantID });
                break;

            default:
                break;
        }
    };

    // Compute left buttons
    var leftButtons = actions.left.list.map((type, index) => {
        if (type === "album") {
            var icon = AlbumIcon;
            var importantID = albumID;
        } else if (type === "artist") {
            icon = ArtistIcon;
            importantID = artistID;
        } else if (type === "add") {
            icon = AddIcon;
            importantID = id;
        } else if (type === "remove") {
            icon = RemoveIcon;
            importantID = id;
        }

        return (
            <button
                key={index}
                className="songItem_actionButton"
                onClick={() => handleActionClick(importantID, type)}
                style={{ left: index * iconWidth - listMargin / 2 + "px" }}
            >
                <img className="songItem_icon" src={icon} alt="" />
            </button>
        );
    });

    var rightButtons = actions.right.list.map((type, index) => {
        if (type === "album") {
            var icon = AlbumIcon;
            var importantID = albumID;
        } else if (type === "artist") {
            icon = ArtistIcon;
            importantID = artistID;
        } else if (type === "add") {
            icon = AddIcon;
            importantID = id;
        } else if (type === "remove") {
            icon = RemoveIcon;
            importantID = id;
        } else if (type === "sort") {
            icon = SortIcon;
            importantID = null;

            return (
                <button
                    key={index}
                    {...sortBind(sortIndex)}
                    className="songItem_actionButton songItem_sortButton"
                    style={{ right: index * iconWidth + listMargin / 2 + "px" }}
                >
                    <img className="songItem_icon" src={icon} alt="" />
                </button>
            );
        }

        return (
            <button
                key={index}
                className="songItem_actionButton"
                onClick={() => handleActionClick(importantID, type)}
                style={{ right: index * iconWidth + listMargin / 2 + "px" }}
            >
                <img className="songItem_icon" src={icon} alt="" />
            </button>
        );
    });

    // Style for the this item
    var sortWrapperStyle = {
        transform: itemSpring ? itemSpring.y.to((y) => `translate3d(0px,${y}px,0px)`) : null,
        zIndex: itemSpring ? itemSpring.zIndex : null,
    };

    return (
        <a.div className={itemSpring ? "songItem_sortableWrapper" : ""} style={sortWrapperStyle}>
            <a.div className="songItem_wrapper" /*{...dragBind()} */ style={{ x, width: width + "px" }}>
                <button
                    className="songItem_button"
                    onClick={() => onSongClicked(id, skeleton)}
                    style={{ height: height + "px", width: nameWidth, left: nameLeftOffset + "px" }}
                >
                    <p className={"songItem_name " + (skeleton ? "songItem_skeletonName" : "") + (selected ? " songItem_selectedName" : "")}>
                        {skeleton ? "-" : prettifyName(name)}
                    </p>
                    <p className={"songItem_info " + (skeleton ? "songItem_skeletonInfo" : "")}>
                        {skeleton ? "-" : prettifyName(album)}
                        <strong> · </strong>
                        {skeleton ? "-" : prettifyName(artist)}
                    </p>
                </button>

                {leftButtons}
                {rightButtons}
            </a.div>
        </a.div>
    );
};
export default SongItem;
