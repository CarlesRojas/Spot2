import React, { createContext, useState, useContext, useEffect } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";
import Vibrant from "node-vibrant";

import { LibraryContext } from "../contexts/LibraryContext";

import { prettifyName, print } from "../Utils";
import SongList from "../components/SongList";
import HorizontalList from "../components/HorizontalList";

// Icons
import AddIcon from "../resources/add.svg";
import ArtistEmpty from "../resources/ArtistEmpty.svg";
import AlbumEmpty from "../resources/AlbumEmpty.svg";
import PlaylistEmpty from "../resources/PlaylistEmpty.svg";
import SpotifyColor from "../resources/SpotifyColor.svg";

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
    const { library } = useContext(LibraryContext);

    // States
    const [closeTapTimeout, setCloseTapTimeout] = useState(null);

    // Playlist image color
    const [playlistImageColor, setPlaylistImageColor] = useState("rgba(0, 0, 0, 0)");

    // Artist image color
    const [artistImageColor, setArtistImageColor] = useState("rgba(0, 0, 0, 0)");

    // Album image color
    const [albumImageColor, setAlbumImageColor] = useState("rgba(0, 0, 0, 0)");

    // Playlist State
    const [playlistState, setPlaylistState] = useState({
        id: "",
        name: "",
        image: PlaylistEmpty,
        songList: "",
        borderRadius: "0.5rem",
        background: null,
        zindex: 510,
    });

    // Artist State
    const [artistState, setArtistState] = useState({
        id: "",
        name: "",
        image: ArtistEmpty,
        songList: "",
        albumList: "",
        borderRadius: "50%",
        background: null,
        zindex: 520,
    });

    // Album State
    const [albumState, setAlbumState] = useState({
        id: "",
        name: "",
        image: AlbumEmpty,
        songList: "",
        borderRadius: "0.5rem",
        background: null,
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
    const openProfile = ({ type, id }) => {
        // Timeout to prevent the tap closing the profile
        setCloseTapTimeout(
            setTimeout(() => {
                setCloseTapTimeout(null);
            }, 500)
        );

        // Get the song list
        var songList = {};

        Object.keys(type === "playlist" ? library.playlists[id].songs : type === "artist" ? library.artists[id].songs : library.albums[id].songs)
            .filter((songID) => songID in library.songs)
            .forEach((songID) => {
                return (songList[songID] = library.songs[songID]);
            });

        // Set the state for the item
        if (type === "playlist") {
            var playlistImage = library.playlists[id].image;
            setPlaylistState({
                id,
                name: library.playlists[id].name,
                image: playlistImage,
                songList,
                borderRadius: "0.5rem",
                background: playlistImage === PlaylistEmpty ? null : playlistImage,
                zindex: 510,
            });
        } else if (type === "artist") {
            // Get the album list for the artist
            var albumList = {};
            if (id in library.artists) {
                Object.keys(library.artists[id].albums)
                    .filter((albumID) => albumID in library.albums)
                    .map((albumID) => {
                        return (albumList[albumID] = library.albums[albumID]);
                    });
            }
            var artistImage = library.artists[id].image;

            setArtistState({
                id,
                name: library.artists[id].name,
                image: artistImage,
                songList,
                albumList,
                borderRadius: "50%",
                background: artistImage === ArtistEmpty ? null : artistImage,
                zindex: 520,
            });
        } else if (type === "album") {
            var albumImage = library.albums[id].image;
            setAlbumState({
                id,
                name: library.albums[id].name,
                image: albumImage,
                songList,
                borderRadius: "0.5rem",
                background: albumImage === AlbumEmpty ? null : albumImage,
                zindex: 530,
            });
        }

        showProfile(type);
    };

    // Playlist Drag Hook
    const dragBindPlaylist = useDrag(
        ({ first, last, vxvy: [, vy], movement: [, my], cancel }) => {
            if (first) window.PubSub.emit("onCloseSongActions");
            const cancelDrag = my >= 0 || !yArtist.idle || !yAlbum.idle;
            if (cancelDrag) cancel();

            if (last && (my < -viewHeight * 0.4 || vy < -0.5)) hideProfile("playlist");
            else if (last) showProfile("playlist");
            else if (!cancelDrag) setYPlaylist({ yPlaylist: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentPlaylistY], filterTaps: true, rubberband: true }
    );

    // Artist Drag Hook
    const dragBindArtist = useDrag(
        ({ first, last, vxvy: [, vy], movement: [, my], cancel }) => {
            if (first) window.PubSub.emit("onCloseSongActions");
            const cancelDrag = my >= 0 || !yAlbum.idle;
            if (cancelDrag) cancel();

            if (last && (my < -viewHeight * 0.4 || vy < -0.5)) hideProfile("artist");
            else if (last) showProfile("artist");
            else if (!cancelDrag) setYArtist({ yArtist: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentArtistY], filterTaps: true, rubberband: true }
    );

    // Album Drag Hook
    const dragBindAlbum = useDrag(
        ({ first, last, vxvy: [, vy], movement: [, my], cancel }) => {
            if (first) window.PubSub.emit("onCloseSongActions");
            const cancelDrag = my >= 0;
            if (cancelDrag) cancel();

            if (last && (my < -viewHeight * 0.4 || vy < -0.5)) hideProfile("album");
            else if (last) showProfile("album");
            else if (!cancelDrag) setYAlbum({ yAlbum: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentAlbumY], filterTaps: true, rubberband: true }
    );

    // Playlist Tap Hook
    const tapBindPlaylist = useDrag(({ tap, cancel }) => {
        // Cancel if it is too soon to close the popup or the artists or albums are open
        if (closeTapTimeout !== null || !yArtist.idle || !yAlbum.idle) cancel();
        else if (tap) hideProfile("playlist");
    });

    // Artist Tap Hook
    const tapBindArtist = useDrag(({ tap, cancel }) => {
        // Cancel if it is too soon to close the popup or the albums are open
        if (closeTapTimeout !== null || !yAlbum.idle) cancel();
        else if (tap) hideProfile("artist");
    });

    // Album Tap Hook
    const tapBindAlbum = useDrag(({ tap, cancel }) => {
        // Cancel if it is too soon to close the popup
        if (closeTapTimeout !== null) cancel();
        else if (tap) hideProfile("album");
    });

    // Get the color for the current playlist
    useEffect(() => {
        // Extract the color from the currently playing image
        var targetImage = playlistState.image ? playlistState.image : PlaylistEmpty;
        let v = new Vibrant(targetImage);
        v.getPalette((err, palette) => (!err ? setPlaylistImageColor(palette.Vibrant.getRgb()) : print(err, "red")));
    }, [playlistState.image]);

    // Get the color for the current artist
    useEffect(() => {
        // Extract the color from the currently playing image
        var targetImage = artistState.image ? artistState.image : PlaylistEmpty;
        let v = new Vibrant(targetImage);
        v.getPalette((err, palette) => (!err ? setArtistImageColor(palette.Vibrant.getRgb()) : print(err, "red")));
    }, [artistState.image]);

    // Get the color for the current album
    useEffect(() => {
        // Extract the color from the currently playing image
        var targetImage = albumState.image ? albumState.image : PlaylistEmpty;
        let v = new Vibrant(targetImage);
        v.getPalette((err, palette) => (!err ? setAlbumImageColor(palette.Vibrant.getRgb()) : print(err, "red")));
    }, [albumState.image]);

    // Handle a click on the shuffle button
    const handleShuffleClick = (type) => {
        // CARLES Shuffle
        if (type === "playlist") print("Shuffle Playlist", "cyan");
        else if (type === "artist") print("Shuffle Artist", "cyan");
        else if (type === "album") print("Shuffle Album", "cyan");

        window.PubSub.emit("onCloseSongActions");
    };

    // Handle action click
    const handleAddButtonClick = () => {
        print("ADD", "cyan"); // CARLES

        window.PubSub.emit("onCloseSongActions");
    };

    // Returns true if all teh profiles are closed
    const areProfilesClosed = () => {
        return (
            yPlaylist.idle &&
            yArtist.idle &&
            yAlbum.idle &&
            currentPlaylistY === -viewHeight &&
            currentArtistY === -viewHeight &&
            currentAlbumY === -viewHeight
        );
    };

    // Playlist song list
    /*<SongListSortable songList={playlistState.songList} playbackState={playbackState} actions={playlistActions} order={"dateAdded"} listenToOrderChange={false} /> CARLES*/
    var playlistSongListObject = (
        <SongList songList={playlistState.songList} actions={playlistActions} order={"dateAdded"} listID={playlistState.id} listType={"playlist"} />
    );

    // Artist song list
    var artistSongListObject = (
        <SongList songList={artistState.songList} actions={artistActions} order="album" listID={artistState.id} listType={"artist"} />
    );

    // Artist album list
    var albumObjects = Object.values(artistState.albumList).map((albumInfo) => {
        return {
            id: albumInfo.albumID,
            height: albumsHeight,
            width: albumsWidth,
            padding: albumsPadding,
            name: albumInfo.name,
            image: albumInfo.image,
        };
    });

    var artistAlbumListObject = albumObjects.length ? (
        <div className="profile_albums" style={{ height: albumsHeight, zIndex: artistState.zindex }}>
            <HorizontalList elements={albumObjects} />
        </div>
    ) : null;

    // Album song list
    var albumSongListObject = (
        <SongList songList={albumState.songList} actions={albumActions} order="album" listID={albumState.id} listType={"album"} />
    );

    // Playlist image gradient
    var playlistImageGradient = `linear-gradient(to bottom, rgba(${playlistImageColor[0]}, ${playlistImageColor[1]}, ${playlistImageColor[2]}, 0.2) 0%, rgba(${playlistImageColor[0]}, ${playlistImageColor[1]}, ${playlistImageColor[2]}, 0) 5rem)`;

    // Artist image gradient
    var artistImageGradient = `linear-gradient(to bottom, rgba(${artistImageColor[0]}, ${artistImageColor[1]}, ${artistImageColor[2]}, 0.2) 0%, rgba(${artistImageColor[0]}, ${artistImageColor[1]}, ${artistImageColor[2]}, 0) 5rem)`;

    // Album image gradient
    var albumImageGradient = `linear-gradient(to bottom, rgba(${albumImageColor[0]}, ${albumImageColor[1]}, ${albumImageColor[2]}, 0.2) 0%, rgba(${albumImageColor[0]}, ${albumImageColor[1]}, ${albumImageColor[2]}, 0) 5rem)`;

    return (
        <ProfileContext.Provider value={{ openProfile, areProfilesClosed }}>
            <a.div className="profile_wrapper" style={{ y: yPlaylist }}>
                <div className="profile_backgrounWrapper">
                    <div className="profile_background" style={{ backgroundImage: "url(" + playlistState.image + ")" }} />
                </div>

                <div className="profile_gradient" style={{ backgroundImage: playlistImageGradient, zIndex: playlistState.zindex - 4 }} />
                <div className="profile_header" style={{ zIndex: playlistState.zindex }}>
                    <img
                        className="profile_image"
                        src={playlistState.image}
                        alt=""
                        style={{ borderRadius: playlistState.borderRadius, height: imageHeight, width: imageHeight }}
                    />

                    <p className="profile_name">{prettifyName(playlistState.name)}</p>

                    <button
                        className="profile_actionButton"
                        onClick={() => handleAddButtonClick("add")}
                        style={{ top: "calc(" + imageHeight / 2 + "px - 1.5rem)" }}
                    >
                        <img className="profile_icon" src={AddIcon} alt="" />
                    </button>
                </div>
                <div className="profile_songs" style={{ zIndex: playlistState.zindex }}>
                    {playlistSongListObject}
                </div>
                <div className="profile_controls" {...dragBindPlaylist()} style={{ zIndex: playlistState.zindex }}>
                    <button
                        className="profile_shuffle"
                        onClick={() => handleShuffleClick("playlist")}
                        style={{ backgroundImage: `url(${SpotifyColor})` }}
                    >
                        SHUFFLE
                    </button>
                    <button className="profile_back" {...tapBindPlaylist()}>
                        Back
                    </button>
                </div>
            </a.div>
            <a.div className="profile_wrapper" style={{ y: yArtist }}>
                <div className="profile_backgrounWrapper">
                    <div className="profile_background" style={{ backgroundImage: "url(" + artistState.image + ")" }} />
                </div>

                <div className="profile_gradient" style={{ backgroundImage: artistImageGradient, zIndex: artistState.zindex - 4 }} />
                <div className="profile_header" style={{ zIndex: artistState.zindex }}>
                    <img
                        className="profile_image"
                        src={artistState.image}
                        alt=""
                        style={{ borderRadius: artistState.borderRadius, height: imageHeight, width: imageHeight }}
                    />

                    <p className="profile_name">{prettifyName(artistState.name)}</p>

                    <button
                        className="profile_actionButton"
                        onClick={() => handleAddButtonClick("add")}
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
                    <button
                        className="profile_shuffle"
                        onClick={() => handleShuffleClick("artist")}
                        style={{ backgroundImage: `url(${SpotifyColor})` }}
                    >
                        SHUFFLE
                    </button>
                    <button className="profile_back" {...tapBindArtist()}>
                        Back
                    </button>
                </div>
            </a.div>
            <a.div className="profile_wrapper" style={{ y: yAlbum }}>
                <div className="profile_backgrounWrapper">
                    <div className="profile_background" style={{ backgroundImage: "url(" + albumState.image + ")" }} />
                </div>

                <div className="profile_gradient" style={{ backgroundImage: albumImageGradient, zIndex: albumState.zindex - 4 }} />
                <div className="profile_header" style={{ zIndex: albumState.zindex }}>
                    <img
                        className="profile_image"
                        src={albumState.image}
                        alt=""
                        style={{ borderRadius: albumState.borderRadius, height: imageHeight, width: imageHeight }}
                    />

                    <p className="profile_name">{prettifyName(albumState.name)}</p>

                    <button
                        className="profile_actionButton"
                        onClick={() => handleAddButtonClick("add")}
                        style={{ top: "calc(" + imageHeight / 2 + "px - 1.5rem)" }}
                    >
                        <img className="profile_icon" src={AddIcon} alt="" />
                    </button>
                </div>
                <div className="profile_songs" style={{ zIndex: albumState.zindex }}>
                    {albumSongListObject}
                </div>
                <div className="profile_controls" {...dragBindAlbum()} style={{ zIndex: albumState.zindex }}>
                    <button
                        className="profile_shuffle"
                        onClick={() => handleShuffleClick("album")}
                        style={{ backgroundImage: `url(${SpotifyColor})` }}
                    >
                        SHUFFLE
                    </button>
                    <button className="profile_back" {...tapBindAlbum()}>
                        Back
                    </button>
                </div>
            </a.div>
            {props.children}
        </ProfileContext.Provider>
    );
};

export default ProfileContextProvider;

const playlistActions = {
    // Items in normal order (first one is in the left)
    left: {
        numberOfActionsAlwaysVisible: 0,
        list: ["album", "artist", "add"],
    },
    // Items in reverse order (first one is in the right)
    right: {
        numberOfActionsAlwaysVisible: 0, // CARLES IT WAS 1
        list: ["remove" /*"sort" CARLES*/],
    },
};

const albumActions = {
    // Items in normal order (first one is in the left)
    left: {
        numberOfActionsAlwaysVisible: 0,
        list: ["add"],
    },
    // Items in reverse order (first one is in the right)
    right: {
        numberOfActionsAlwaysVisible: 0,
        list: [],
    },
};

const artistActions = {
    // Items in normal order (first one is in the left)
    left: {
        numberOfActionsAlwaysVisible: 0,
        list: ["add"],
    },
    // Items in reverse order (first one is in the right)
    right: {
        numberOfActionsAlwaysVisible: 0,
        list: [],
    },
};
