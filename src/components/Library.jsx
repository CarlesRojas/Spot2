import React, { useState, useEffect, useContext } from "react";
import { useSpring, a } from "react-spring";
import Vibrant from "node-vibrant";
import { print } from "../Utils";

// Contexts
import { PlaybackContext } from "../contexts/PlaybackContext";

// Components
import Songs from "./Songs";
import Albums from "./Albums";
import Artists from "./Artists";
import Playlists from "./Playlists";

// Icons
import SongIcon from "../resources/song.svg";
import AlbumIcon from "../resources/album.svg";
import ArtistIcon from "../resources/artist.svg";
import PlaylistIcon from "../resources/playlist.svg";

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
};

const Library = () => {
    // Get contexts
    const { playback } = useContext(PlaybackContext);

    // State
    const [currentSection, setCurrentSection] = useState("song");
    const [imageColor, setImageColor] = useState("rgba(0, 0, 0, 0)");

    // Spring hook
    const [{ x }, set] = useSpring(() => ({ x: 0, config: { clamp: true } }));

    // Function to open the Library
    const showSection = (name) => {
        set({ x: sections[name].x });
        setCurrentSection(name);
    };

    useEffect(() => {
        // Extract the color from the currently playing image
        if (playback.image) {
            let v = new Vibrant(playback.image);
            v.getPalette((err, palette) => (!err ? setImageColor(palette.Vibrant.getRgb()) : print(err, "red")));
        }
    }, [playback.image]);

    var imageGradient = `linear-gradient(to bottom, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0.3) 0%, rgba(${imageColor[0]}, ${imageColor[1]}, ${imageColor[2]}, 0) 5rem)`;

    return (
        <>
            <a.div className="library_sectionsWrapper" style={{ x, backgroundImage: imageGradient }}>
                <div className="library_section">{<Songs />}</div>
                <div className="library_section">{<Albums />}</div>
                <div className="library_section">{<Artists />}</div>
                <div className="library_section">{<Playlists />}</div>
            </a.div>

            <div className="library_navBar">
                {Object.values(sections).map((section) => (
                    <NavItem
                        key={section.name}
                        name={section.name}
                        icon={section.icon}
                        selected={section.name === currentSection}
                        changeSection={showSection}
                    />
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
