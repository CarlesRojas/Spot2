import React, { useState } from "react";
import { useSpring, a } from "react-spring";

// Components
import Songs from "./Songs";

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
    // Current section state
    const [currentSection, setCurrentSection] = useState("song");

    // Spring hook
    const [{ x }, set] = useSpring(() => ({ x: 0, config: { clamp: true } }));

    // Function to open the Library
    const showSection = (name) => {
        set({ x: sections[name].x });
        setCurrentSection(name);
    };

    return (
        <>
            <a.div className="library_sectionsWrapper" style={{ x }}>
                <div className="library_section">{<Songs isOpen={currentSection === "song"} />}</div>
                <div className="library_section">{/*<Albums isOpen={currentSection === "album"} />*/}</div>
                <div className="library_section">{/*<Artists isOpen={currentSection === "artist"} />*/}</div>
                <div className="library_section">{/*<Playlists isOpen={currentSection === "playlist"} />*/}</div>
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
