import React, { useState, useEffect, useContext } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";
import Vibrant from "node-vibrant";
import { print } from "../Utils";

// Contexts
import { PlaybackContext } from "../contexts/PlaybackContext";

// Components
import Songs from "./Songs";
import Albums from "./Albums";
import Artists from "./Artists";
import Playlists from "./Playlists";
import Queue from "./Queue";

// Icons
import SongIcon from "../resources/song.svg";
import AlbumIcon from "../resources/album.svg";
import ArtistIcon from "../resources/artist.svg";
import PlaylistIcon from "../resources/playlist.svg";
import QueueIcon from "../resources/queue.svg";
import AlbumEmpty from "../resources/AlbumEmpty.png";

// Size of the viewport
const viewWidth = window.innerWidth;

const sections = {
    song: {
        name: "song",
        icon: SongIcon,
        x: 0,
    },
    album: {
        name: "album",
        icon: AlbumIcon,
        x: -viewWidth,
    },
    artist: {
        name: "artist",
        icon: ArtistIcon,
        x: -viewWidth * 2,
    },
    playlist: {
        name: "playlist",
        icon: PlaylistIcon,
        x: -viewWidth * 3,
    },
    queue: {
        name: "queue",
        icon: QueueIcon,
        x: -viewWidth * 4,
    },
};

const Library = () => {
    // Get contexts
    const { playback } = useContext(PlaybackContext);

    // State
    const [currentSection, setCurrentSection] = useState("song");
    const [imageColor, setImageColor] = useState("rgba(0, 0, 0, 0)");

    // Spring hook
    const [currentX, setCurrentX] = useState(0);
    const [{ x }, set] = useSpring(() => ({ x: 0, config: { clamp: true } }));

    // Function to open the Library
    const showSection = (name) => {
        set({ x: sections[name].x });
        setCurrentX(sections[name].x);
        setCurrentSection(name);
        window.PubSub.emit("onCloseSongActions");
    };

    // Show the next section
    const showNextSection = () => {
        if (currentSection === "queue") return;

        const nextSection = currentSection === "song" ? "album" : currentSection === "album" ? "artist" : currentSection === "artist" ? "playlist" : "queue";
        set({ x: sections[nextSection].x });
        setCurrentX(sections[nextSection].x);
        setCurrentSection(nextSection);
    };

    // Show the previous section
    const showPrevSection = () => {
        if (currentSection === "song") return;

        const prevSection = currentSection === "queue" ? "playlist" : currentSection === "playlist" ? "artist" : currentSection === "artist" ? "album" : "song";
        set({ x: sections[prevSection].x });
        setCurrentX(sections[prevSection].x);
        setCurrentSection(prevSection);
    };

    // Drag Hook
    const dragBind = useDrag(
        ({ last, vxvy: [vx], movement: [mx], cancel }) => {
            window.PubSub.emit("onCloseSongActions");
            const wrong_direction = (currentSection === "song" && vx > 0) || (currentSection === "queue" && vx < 0);
            if (wrong_direction) cancel();

            // If user releases after the threshold we open, othersie close it
            if (last && vx < -0.25) showNextSection();
            else if (last && vx > 0.25) showPrevSection();
            else if (last) showSection(currentSection);
            // If user keeps dragging -> move panel following the position
            else if (!wrong_direction) set({ x: mx, immediate: false, config: config.stiff });
        },
        { initial: () => [currentX, 0], filterTaps: true, rubberband: true }
    );

    // Extract the color from the currently playing image
    useEffect(() => {
        var targetImage = playback.image ? playback.image : AlbumEmpty;
        let v = new Vibrant(targetImage);
        v.getPalette((err, palette) => (!err ? setImageColor(palette.Vibrant.getRgb()) : print(err, "red")));
    }, [playback.image]);

    var imageGradient = `linear-gradient(to bottom, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0.2) 0%, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0) 5rem)`;

    return (
        <>
            <a.div className="library_sectionsWrapper" style={{ x, backgroundImage: imageGradient }}>
                <div className="library_section">{<Songs />}</div>
                <div className="library_section">{<Albums />}</div>
                <div className="library_section">{<Artists />}</div>
                <div className="library_section">{<Playlists />}</div>
                <div className="library_section">{<Queue />}</div>
            </a.div>

            <div className="library_navBar" {...dragBind()}>
                {Object.values(sections).map(({ name, icon }) => (
                    <NavItem key={name} name={name} icon={icon} selected={name === currentSection} changeSection={showSection} />
                ))}
            </div>
        </>
    );
};

export default Library;

const NavItem = (props) => {
    const { name, icon, selected, changeSection } = props;
    return (
        <button className={"navItem_button" + (selected ? " navItem_buttonSelected" : "")} onClick={() => changeSection(name)}>
            <img className="navItem_icon" src={icon} alt="" />
        </button>
    );
};
