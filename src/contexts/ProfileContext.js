import React, { createContext, useState, useContext, useEffect } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";
import Vibrant from "node-vibrant";

import { PlaybackContext } from "./PlaybackContext";
import { prettifyName, print } from "../Utils";
import SongList from "../components/SongList";
import HorizontalList from "../components/HorizontalList";

import LikedIcon from "../resources/liked.svg";
import AddIcon from "../resources/add.svg";

// Popup Context
export const ProfileContext = createContext();

// Size of the viewport
const viewWidth = window.innerWidth;
const viewHeight = window.innerHeight;

const scrollBarWidth = 5; // 5px
const margin = 1.5 * 16; // 1.5rem

const albumsHeight = (viewWidth - margin) / 3 + scrollBarWidth;
const albumsWidth = (viewWidth - margin) / 3;
const albumsPadding = margin / 2;

// Height of the album cover
var imageHeight = viewWidth / 3;

const ProfileContextProvider = (props) => {
    // Get contexts
    const { playback } = useContext(PlaybackContext);
    const { playlistID, artistID, albumID } = playback;

    // States
    const [closeTapTimeout, setCloseTapTimeout] = useState(null);
    const [imageColor, setImageColor] = useState("rgba(0, 0, 0, 0)");

    // Playlist State
    const [playlistState, setPlaylistState] = useState({
        id: "",
        name: "",
        image: "https://i.imgur.com/06SzS3d.png",
        songList: "",
        borderRadius: "0.5rem",
        background: null,
        selected: false,
        zindex: 510,
    });

    // Artist State
    const [artistState, setArtistState] = useState({
        id: "",
        name: "",
        image: "https://i.imgur.com/PgCafqK.png",
        songList: "",
        albumList: "",
        borderRadius: "50%",
        background: null,
        selected: false,
        zindex: 520,
    });

    // Album State
    const [albumState, setAlbumState] = useState({
        id: "",
        name: "",
        image: "https://i.imgur.com/iajaWIN.png",
        songList: "",
        borderRadius: "0.5rem",
        background: null,
        selected: false,
        zindex: 530,
    });

    // Playlist Spring hook
    const [currentPlaylistY, setCurrentPlaylistY] = useState(-viewHeight);
    const [{ yPlaylist }, setYPlaylist] = useSpring(() => ({ yPlaylist: -viewHeight, config: { clamp: true } }));

    // Artist Spring hook
    const [currentArtistY, setCurrentArtistY] = useState(-viewHeight);
    const [{ yArtist }, setYArtist] = useSpring(() => ({ yArtist: -viewHeight, config: { clamp: true } }));

    // Album Spring hook
    const [currentAlbumY, setCurrentAlbumY] = useState(-viewHeight);
    const [{ yAlbum }, setYAlbum] = useSpring(() => ({ yAlbum: -viewHeight, config: { clamp: true } }));

    // Function to open a profile
    const showProfile = (type) => {
        if (type === "playlist") {
            setYPlaylist({ yPlaylist: 0 });
            setCurrentPlaylistY(0);
        } else if (type === "artist") {
            setYArtist({ yArtist: 0 });
            setCurrentArtistY(0);
        } else if (type === "album") {
            setYAlbum({ yAlbum: 0 });
            setCurrentAlbumY(0);
        }
    };

    // Function to hide a profile
    const hideProfile = (type) => {
        if (type === "playlist") {
            setYPlaylist({ yPlaylist: -viewHeight });
            setCurrentPlaylistY(-viewHeight);
        } else if (type === "artist") {
            setYArtist({ yArtist: -viewHeight });
            setCurrentArtistY(-viewHeight);
        } else if (type === "album") {
            setYAlbum({ yAlbum: -viewHeight });
            setCurrentAlbumY(-viewHeight);
        }
    };

    // Function to set the state and open the profile
    const openProfile = ({ type, id, image, name, songList, albumList = "" }) => {
        // Timeout to prevent the tap closing the profile
        setCloseTapTimeout(
            setTimeout(() => {
                setCloseTapTimeout(null);
            }, 500)
        );

        // Set the state for the item
        if (type === "playlist")
            setPlaylistState({
                id,
                name,
                image,
                songList,
                borderRadius: "0.5rem",
                background: image === "https://i.imgur.com/06SzS3d.png" ? null : image,
                selected: id === playlistID,
                zindex: 510,
            });
        else if (type === "artist")
            setArtistState({
                id,
                name,
                image,
                songList,
                albumList,
                borderRadius: "50%",
                background: image === "https://i.imgur.com/PgCafqK.png" ? null : image,
                selected: id === artistID,
                zindex: 520,
            });
        else if (type === "album")
            setAlbumState({
                id,
                name,
                image,
                songList,
                borderRadius: "0.5rem",
                background: image === "https://i.imgur.com/iajaWIN.png" ? null : image,
                selected: id === albumID,
                zindex: 530,
            });

        showProfile(type);
    };

    // Playlist Drag Hook
    const dragBindPlaylist = useDrag(
        ({ last, vxvy: [, vy], movement: [, my], cancel }) => {
            const wrong_direction = my >= 0;
            if (wrong_direction) cancel();

            if (last && (my < -75 || vy < -0.5)) hideProfile("playlist");
            else if (last) showProfile("playlist");
            else if (!wrong_direction) setYPlaylist({ yPlaylist: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentPlaylistY], filterTaps: true, rubberband: true }
    );

    // Artist Drag Hook
    const dragBindArtist = useDrag(
        ({ last, vxvy: [, vy], movement: [, my], cancel }) => {
            const wrong_direction = my >= 0;
            if (wrong_direction) cancel();

            if (last && (my < -75 || vy < -0.5)) hideProfile("artist");
            else if (last) showProfile("artist");
            else if (!wrong_direction) setYArtist({ yArtist: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentArtistY], filterTaps: true, rubberband: true }
    );

    // Album Drag Hook
    const dragBindAlbum = useDrag(
        ({ last, vxvy: [, vy], movement: [, my], cancel }) => {
            const wrong_direction = my >= 0;
            if (wrong_direction) cancel();

            if (last && (my < -75 || vy < -0.5)) hideProfile("album");
            else if (last) showProfile("album");
            else if (!wrong_direction) setYAlbum({ yAlbum: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentAlbumY], filterTaps: true, rubberband: true }
    );

    // Playlist Tap Hook
    const tapBindPlaylist = useDrag(({ tap, cancel }) => {
        // Cancel if it is too soon to close the popup
        if (closeTapTimeout !== null) cancel();
        else if (tap) hideProfile("playlist");
    });

    // Artist Tap Hook
    const tapBindArtist = useDrag(({ tap, cancel }) => {
        // Cancel if it is too soon to close the popup
        if (closeTapTimeout !== null) cancel();
        else if (tap) hideProfile("artist");
    });

    // Album Tap Hook
    const tapBindAlbum = useDrag(({ tap, cancel }) => {
        // Cancel if it is too soon to close the popup
        if (closeTapTimeout !== null) cancel();
        else if (tap) hideProfile("album");
    });

    useEffect(() => {
        // Extract the color from the currently playing image
        if (playback.image) {
            let v = new Vibrant(playback.image);
            v.getPalette((err, palette) => (!err ? setImageColor(palette.Vibrant.getRgb()) : print(err, "red")));
        }
    }, [playback.image]);

    // Handle a click on the shuffle button
    const handleShuffleClick = (type) => {
        // CARLES Shuffle
        if (type === "playlist") print("Shuffle Playlist");
        else if (type === "artist") print("Shuffle Artist");
        else if (type === "album") print("Shuffle Album");
    };

    // Playlist song list
    /*<SongListSortable songList={playlistState.songList} playbackState={playbackState} actions={playlistActions} order={"dateAdded"} listenToOrderChange={false} /> CARLES*/
    var playlistSongListObject = <SongList songList={playlistState.songList} actions={playlistActions} order={"dateAdded"} />;

    // Artist song list
    var artistSongListObject = <SongList songList={artistState.songList} actions={artistActions} order="album" />;

    // Artist album list
    var albumObjects = Object.values(artistState.albumList).map((albumInfo) => {
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

    var artistAlbumListObject = albumObjects.length ? (
        <div className="profile_albums" style={{ height: albumsHeight, zIndex: artistState.zindex }}>
            <HorizontalList elements={albumObjects} />
        </div>
    ) : null;

    // Album song list
    var albumSongListObject = <SongList songList={albumState.songList} actions={albumActions} order="album" />;

    var imageGradient = `linear-gradient(to bottom, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0.3) 0%, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0) 5rem)`;

    return (
        <ProfileContext.Provider value={{ openProfile }}>
            <a.div className="profile_wrapper" style={{ y: yPlaylist }}>
                <div className="profile_backgrounWrapper">
                    <div className="profile_background" style={{ backgroundImage: "url(" + playlistState.image + ")" }} />
                </div>

                <div className="profile_gradient" style={{ backgroundImage: imageGradient, zIndex: playlistState.zindex - 4 }} />
                <div className="profile_header" style={{ zIndex: playlistState.zindex }}>
                    <img
                        className="profile_image"
                        src={playlistState.image}
                        alt=""
                        style={{ borderRadius: playlistState.borderRadius, height: imageHeight, width: imageHeight }}
                    />

                    <p className={"profile_name" + (playlistState.selected ? " profile_nameSelected" : "")}>{prettifyName(playlistState.name)}</p>

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
                <div className="profile_songs" style={{ zIndex: playlistState.zindex }}>
                    {playlistSongListObject}
                </div>
                <div className="profile_controls" {...dragBindPlaylist()} style={{ zIndex: playlistState.zindex }}>
                    <button className="profile_shuffle" onClick={() => handleShuffleClick("playlist")}>
                        SHUFFLE
                    </button>
                    <button className="profile_back" /*onClick={() => handleBackClick() CARLES }*/>Back</button>
                </div>
            </a.div>
            <a.div className="profile_wrapper" style={{ y: yArtist }}>
                <div className="profile_backgrounWrapper">
                    <div className="profile_background" style={{ backgroundImage: "url(" + artistState.image + ")" }} />
                </div>

                <div className="profile_gradient" style={{ backgroundImage: imageGradient, zIndex: artistState.zindex - 4 }} />
                <div className="profile_header" style={{ zIndex: artistState.zindex }}>
                    <img
                        className="profile_image"
                        src={artistState.image}
                        alt=""
                        style={{ borderRadius: artistState.borderRadius, height: imageHeight, width: imageHeight }}
                    />

                    <p className={"profile_name" + (artistState.selected ? " profile_nameSelected" : "")}>{prettifyName(artistState.name)}</p>

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
                <div className="profile_songs" style={{ zIndex: artistState.zindex }}>
                    {artistSongListObject}
                </div>
                {artistAlbumListObject}
                <div className="profile_controls" {...dragBindArtist()} style={{ zIndex: artistState.zindex }}>
                    <button className="profile_shuffle" onClick={() => handleShuffleClick("artist")}>
                        SHUFFLE
                    </button>
                    <button className="profile_back" /*onClick={() => handleBackClick() CARLES }*/>Back</button>
                </div>
            </a.div>
            <a.div className="profile_wrapper" style={{ y: yAlbum }}>
                <div className="profile_backgrounWrapper">
                    <div className="profile_background" style={{ backgroundImage: "url(" + albumState.image + ")" }} />
                </div>

                <div className="profile_gradient" style={{ backgroundImage: imageGradient, zIndex: albumState.zindex - 4 }} />
                <div className="profile_header" style={{ zIndex: albumState.zindex }}>
                    <img
                        className="profile_image"
                        src={albumState.image}
                        alt=""
                        style={{ borderRadius: albumState.borderRadius, height: imageHeight, width: imageHeight }}
                    />

                    <p className={"profile_name" + (albumState.selected ? " profile_nameSelected" : "")}>{prettifyName(albumState.name)}</p>

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
                <div className="profile_songs" style={{ zIndex: albumState.zindex }}>
                    {albumSongListObject}
                </div>
                <div className="profile_controls" {...dragBindAlbum()} style={{ zIndex: albumState.zindex }}>
                    <button className="profile_shuffle" onClick={() => handleShuffleClick("album")}>
                        SHUFFLE
                    </button>
                    <button className="profile_back" /*onClick={() => handleBackClick() CARLES }*/>Back</button>
                </div>
            </a.div>
            {props.children}
        </ProfileContext.Provider>
    );
};

export default ProfileContextProvider;

const playlistActions = {
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
        numberOfActionsAlwaysVisible: 0, // CARLES IT WAS 1
        // Items in reverse order (first one is in the right)
        list: [
            { event: "onSongLikeClicked", type: "like" },
            { event: "onRemoveClicked", type: "remove" },
            /*{ event: "", type: "sort" }, CARLES*/
        ],
    },
};

const albumActions = {
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

const artistActions = {
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
