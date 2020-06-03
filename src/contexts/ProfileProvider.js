import React, { createContext, useState } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";

// Popup Context
export const ProfileContext = createContext();

// Size of the viewport
const viewWidth = window.innerWidth;
const viewHeight = window.innerHeight;

const scrollBarWidth = 5; // 5px
const margin = 1.5 * 16; // 1.5rem
const artistPadding = 0.8 * 16; // 0.8rem

const albumsHeight = (viewWidth - margin) / 3 + scrollBarWidth;
const albumsWidth = (viewWidth - margin) / 3;
const albumsPadding = margin / 2;

// Height of the album cover
var imageHeight = viewWidth / 3;

const ProfileContextProvider = (props) => {
    // Get contexts
    const { playback } = useContext(PlaybackContext);

    const { type, id, image, name, songList, albumList } = props;

    // State
    const [state, setState] = useState({
        type: "",
        id: "",
        image: "",
        image: "https://i.imgur.com/PgCafqK.png",
        songList: "",
        albumList: "",
    });
    const [closeTapTimeout, setCloseTapTimeout] = useState(null);

    // Spring hook
    const [currentY, setCurrentY] = useState(-viewHeight);
    const [{ y }, set] = useSpring(() => ({ y: -viewHeight, config: { clamp: true } }));

    // Function to open the profile
    const showProfile = () => {
        set({ y: 0 });
        setCurrentY(0);
    };

    // Function to hide the profile
    const hideProfile = () => {
        set({ y: -viewHeight });
        setCurrentY(-viewHeight);
    };

    // Function to set the state and open the profile
    const openProfile = (newProfileState) => {
        setCloseTapTimeout(
            setTimeout(() => {
                setCloseTapTimeout(null);
            }, 500)
        );
        setState(newProfileState);
        showProfile();
    };

    const [typeInfo, setTypeInfo] = useState({
        borderRadius: "50%",
        background: state.image === "https://i.imgur.com/PgCafqK.png" ? null : image,
    });

    // Drag Hook
    const dragBind = useDrag(
        ({ last, vxvy: [, vy], movement: [, my], cancel }) => {
            const wrong_direction = my >= 0;
            if (wrong_direction) cancel();

            // If user releases after the threshold we open, othersie close it
            if (last && (my < -75 || vy < -0.5)) hidePopup();
            else if (last) showPopup();
            // If user keeps dragging -> move panel following the position
            else if (!wrong_direction) set({ y: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentY], filterTaps: true, rubberband: true }
    );

    const tapBind = useDrag(({ tap, cancel }) => {
        // Cancel if it is too soon to close the popup
        if (closeTapTimeout !== null) cancel();
        else if (tap) hidePopup();
    });

    useEffect(() => {
        // Get information
        switch (state.type) {
            case "artist":
                var borderRadius = "50%";
                var background = state.image === "https://i.imgur.com/PgCafqK.png" ? null : state.image;
                break;

            case "album":
                borderRadius = "0.5rem";
                background = state.image === "https://i.imgur.com/iajaWIN.png" ? null : state.image;
                break;

            case "playlist":
            default:
                borderRadius = "0.5rem";
                background = state.image === "https://i.imgur.com/06SzS3d.png" ? null : state.image;
                break;
        }

        // Set information
        setTypeInfo({ borderRadius, background });
    }, [state.type]);

    useEffect(() => {
        // Extract the color from the currently playing image
        if (playback.image) {
            let v = new Vibrant(playback.image);
            v.getPalette((err, palette) => (!err ? setImageColor(palette.Vibrant.getRgb()) : print(err, "red")));
        }
    }, [playback.image]);

    // Handle a click on the shuffle button
    const handleShuffleClick = () => {
        // CARLES Shuffle
        print("Shuffle");
    };

    const { albumID, artistID, playlistID } = playback;

    // Playlist Info
    if (type === "playlist") {
        var selected = playlistID === id;
        var zIndex = 510;
        var albums = null;

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
                numberOfActionsAlwaysVisible: 1,
                // Items in reverse order (first one is in the right)
                list: [
                    { event: "onSongLikeClicked", type: "like" },
                    { event: "onRemoveClicked", type: "remove" },
                    { event: "", type: "sort" },
                ],
            },
        };

        var songListOject = (
            /*<SongListSortable songList={songList} playbackState={playbackState} actions={actions} order={"dateAdded"} listenToOrderChange={false} /> CARLES*/
            <SongList songList={songList} actions={actions} order={"dateAdded"} />
        );
    }

    // Artist Info
    else if (type === "artist") {
        selected = artistID === id;
        zIndex = 520;

        var albumObjects = Object.values(albumList).map((albumInfo) => {
            return {
                id: albumInfo.albumID,
                height: albumsHeight,
                width: albumsWidth,
                padding: albumsPadding,
                name: albumInfo.name,
                image: albumInfo.image,
                selected: albumInfo.albumID === albumID,
            };
        });

        if (albumObjects.length) {
            albums = (
                <div className="profile_albums" style={{ height: albumsHeight, zIndex: zIndex }}>
                    <HorizontalList elements={albumObjects} />
                </div>
            );
        } else albums = null;

        actions = {
            left: {
                numberOfActionsAlwaysVisible: 0,
                // Items in normal order (first one is in the left)
                list: [{ event: "onAddToClicked", type: "add" }],
            },
            right: {
                numberOfActionsAlwaysVisible: 0,
                // Items in reverse order (first one is in the right)
                list: [{ event: "onSongLikeClicked", type: "like" }],
            },
        };

        songListOject = <SongList songList={songList} actions={actions} order="album" />;
    }

    // Album Info
    else {
        selected = albumID === id;
        zIndex = 530;
        albums = null;

        actions = {
            left: {
                numberOfActionsAlwaysVisible: 0,
                // Items in normal order (first one is in the left)
                list: [{ event: "onAddToClicked", type: "add" }],
            },
            right: {
                numberOfActionsAlwaysVisible: 0,
                // Items in reverse order (first one is in the right)
                list: [{ event: "onSongLikeClicked", type: "like" }],
            },
        };

        songListOject = <SongList songList={songList} actions={actions} order="album" />;
    }

    var imageGradient = `linear-gradient(to bottom, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0.3) 0%, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0) 5rem)`;

    return (
        <div className="profile_wrapper">
            <div className="profile_background" style={{ backgroundImage: "url(" + typeInfo.background + ")", zIndex: zIndex - 5 }} />
            <div className="profile_backgroundBlurred" style={{ backgroundImage: "url(" + typeInfo.background + ")", zIndex: zIndex - 5 }} />
            <div className="profile_gradient" style={{ backgroundImage: imageGradient, zIndex: zIndex - 4 }} />
            <div className="profile_header" style={{ zIndex: zIndex }}>
                <img
                    className="profile_image"
                    src={image}
                    alt=""
                    style={{ borderRadius: typeInfo.borderRadius, height: imageHeight, width: imageHeight }}
                />

                <p className={"profile_name" + (selected ? " profile_nameSelected" : "")}>{window.prettifyName(name)}</p>

                <button
                    className="profile_actionButton profile_action_like"
                    /*onClick={() => handleActionClick("onProfileLikeClicked")} CARLES */
                    style={{ top: "calc(" + imageHeight / 2 + "px - 1.5rem)" }}
                >
                    <img className="profile_icon" src={LikedIcon} alt="" />
                </button>

                <button
                    className="profile_actionButton profile_action_add"
                    /*onClick={() => handleActionClick("onAddToClicked")} CARLES */
                    style={{ top: "calc(" + imageHeight / 2 + "px - 1.5rem)" }}
                >
                    <img className="profile_icon" src={AddIcon} alt="" />
                </button>
            </div>
            <div className="profile_songs" style={{ zIndex: zIndex }}>
                {songListOject}
            </div>
            {albums}
            <div className="profile_controls" style={{ zIndex: zIndex }}>
                <button className="profile_shuffle" onClick={() => handleShuffleClick()}>
                    SHUFFLE
                </button>
                <button className="profile_back" /*onClick={() => handleBackClick() CARLES }*/>Back</button>
            </div>
        </div>
    );
};
export default Profile;
