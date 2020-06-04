import React from "react";
import AlbumArtistItem from "./AlbumArtistItem";

const HorizontalList = (props) => {
    const { elements } = props;

    var elementComponents = elements.map(({ id, height, width, padding, name, image, selected }) => {
        return (
            <AlbumArtistItem
                key={id}
                id={id}
                height={height}
                width={width}
                padding={padding}
                name={name}
                image={image}
                selected={selected}
                skeleton={false}
                type={"album"}
                noName={true}
            />
        );
    });

    return (
        <div className="horizontalList_wrapper">
            <div className="horizontalList_scroll">{elementComponents}</div>
        </div>
    );
};
export default HorizontalList;
