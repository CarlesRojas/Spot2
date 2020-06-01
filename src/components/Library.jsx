import React, { useState } from "react";

// Icons
import SongIcon from "../resources/song.svg";
import AlbumIcon from "../resources/album.svg";
import ArtistIcon from "../resources/artist.svg";
import PlaylistIcon from "../resources/playlist.svg";

const sections = {
    song: {
        name: "song",
        icon: SongIcon,
        left: "0%",
    },
    album: {
        name: "album",
        icon: AlbumIcon,
        left: "-100%",
    },
    artist: {
        name: "artist",
        icon: ArtistIcon,
        left: "-200%",
    },
    playlist: {
        name: "playlist",
        icon: PlaylistIcon,
        left: "-300%",
    },
};

export default function Library() {
    // Current section state
    const [currentSection, setCurrentSection] = useState("song");

    const changeSection = (name) => {
        setCurrentSection(name);
    };

    return (
        <>
            <div className="library_sectionsWrapper" style={{ left: sections[currentSection].left }}>
                <div className="library_section">{/*<Songs isOpen={currentSection === "song"} />*/}</div>

                <div className="library_section">{/*<Albums isOpen={currentSection === "album"} />*/}</div>

                <div className="library_section">{/*<Artists isOpen={currentSection === "artist"} />*/}</div>

                <div className="library_section">{/*<Playlists isOpen={currentSection === "playlist"} />*/}</div>
            </div>

            <div className="library_navBar">
                {Object.values(sections).map((section) => (
                    <NavItem
                        key={section.name}
                        name={section.name}
                        icon={section.icon}
                        selected={section.name === currentSection}
                        changeSection={changeSection}
                    />
                ))}
            </div>
        </>
    );
}

const NavItem = (props) => {
    const { name, icon, selected, changeSection } = props;
    return (
        <button className={"navItem_button" + (selected ? " navItem_buttonSelected" : "")} onClick={() => changeSection(name)}>
            <img className="navItem_icon" src={icon} alt="" />
        </button>
    );
};
