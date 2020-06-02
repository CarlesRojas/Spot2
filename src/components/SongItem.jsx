import React, { useState, useEffect } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";
import { prettifyName, print } from "../Utils";

// Icons
import AlbumIcon from "../resources/albumSmall.svg";
import ArtistIcon from "../resources/artistSmall.svg";
import LikedIcon from "../resources/liked.svg";
import AddIcon from "../resources/add.svg";
import SortIcon from "../resources/hamburger.svg";
import RemoveIcon from "../resources/remove.svg";

// Size of the viewport
const viewWidth = window.innerWidth;

const iconWidth = 3 * 16; // 3rem
const scrollBarWidth = 5; // 5px
const listMargin = 1.5 * 16; // 1.5rem

const SongItem = (props) => {
    const { height, id, name, album, artist, albumID, artistID, selected, skeleton, actions } = props;

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

    // Funcion to hide the actions
    const hideActions = (ignoreID) => {
        if (ignoreID && ignoreID === id) return;
        showName();
    };

    // Efect to subscribe to events
    useEffect(() => {
        window.PubSub.sub("onCloseSongActions", hideActions);
        return () => {
            window.PubSub.unsub("onCloseSongActions", hideActions);
        };
    }, []);

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

    // Handle the click on this item
    const handleClick = (id, skeleton) => {
        if (!skeleton) print("SONG SELECTED: " + id, "cyan");
        //window.PubSub.emit("onSongSelected", { id }); CARLES
    };

    // Compute left buttons
    var leftButtons = actions.left.list.map(({ event, type }, index) => {
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
        } else if (type === "like") {
            icon = LikedIcon;
            importantID = id;
        }
        return (
            <button
                key={index}
                className="songItem_actionButton"
                //onClick={() => this.handleActionClick(importantID, event)} CARLES
                style={{ left: index * iconWidth - listMargin / 2 + "px" }}
            >
                <img className="songItem_icon" src={icon} alt="" />
            </button>
        );
    });

    var rightButtons = actions.right.list.map(({ event, type }, index) => {
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
        } else if (type === "like") {
            icon = LikedIcon;
            importantID = id;
        }

        return (
            <button
                key={index}
                className="songItem_actionButton"
                // onClick={() => this.handleActionClick(importantID, event)} CARLES
                style={{ right: index * iconWidth + listMargin / 2 + "px" }}
            >
                <img className="songItem_icon" src={icon} alt="" />
            </button>
        );
    });

    return (
        <a.div className="songItem_wrapper" {...dragBind()} style={{ x, width: width + "px" }}>
            <button
                className="songItem_button"
                onClick={() => handleClick(id, skeleton)}
                style={{ height: height + "px", width: nameWidth, left: nameLeftOffset + "px" }}
            >
                <p className={"songItem_name " + (skeleton ? "songItem_skeletonName" : "") + (selected ? " songItem_selectedName" : "")}>
                    {skeleton ? "-" : prettifyName(name)}
                </p>
                <p className={"songItem_info " + (skeleton ? "songItem_skeletonInfo" : "")}>
                    {skeleton ? "-" : prettifyName(album)}
                    <strong> · </strong>
                    {prettifyName(artist)}
                </p>
            </button>

            {leftButtons}
            {rightButtons}
        </a.div>
    );
};
export default SongItem;
