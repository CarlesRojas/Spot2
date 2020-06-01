import React, { useState } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";
import { lerp, invlerp } from "./Utils";

import Cover from "./components/Cover";

// Size of the viewport
const viewHeight = window.innerHeight;
const viewWidth = window.innerWidth;

// Height of the Cover in the 2 states
const heightBig = viewWidth;
const heightSmall = viewWidth * 0.25;

// Y position of the Cover in the 2 states
const yBig = 0;
const ySmall = viewHeight - heightSmall;

export default function App() {
    // State to hold weather we are dragging vertically or horizontally
    const [draggingVertically, setDraggingVertically] = useState(false);
    const [draggingHorizontally, setDraggingHorizontally] = useState(false);

    // Current X and Y
    const [currentX, setCurrentX] = useState(0);
    const [currentY, setCurrentY] = useState(yBig);
    const [leftPositions, setLeftPositions] = useState([-viewWidth, 0, viewWidth]);

    // Spring hook
    const [{ xy }, set] = useSpring(() => ({ xy: [currentX, yBig], config: { clamp: true } }));

    // Function to cancel the Library opening
    const cancelShowLibrary = () => {
        set({ xy: [currentX, yBig] });
    };

    // Function to open the Library
    const showLibrary = () => {
        set({ xy: [currentX, ySmall] });
        setCurrentY(ySmall);
    };

    // Function to cancel the Queue opening
    const cancelShowQueue = () => {
        set({ xy: [currentX, ySmall] });
    };

    // Function to open the Queue
    const showQueue = () => {
        set({ xy: [currentX, yBig] });
        setCurrentY(yBig);
    };

    // Function to cancel the Prev opening
    const cancelShowPrev = () => {
        set({ xy: [currentX, currentY] });
    };

    // Function to open the Prev
    const showPrev = () => {
        // Move all to the right
        set({ xy: [currentX + viewWidth, currentY] });
        setCurrentX(currentX + viewWidth);

        // Move the one on the right to the left
        let indexOfMax = leftPositions.indexOf(Math.max(...leftPositions));
        setLeftPositions(leftPositions.map((x, i) => (i === indexOfMax ? x - viewWidth * 3 : x)));
    };

    // Function to cancel the Next opening
    const cancelShowNext = () => {
        set({ xy: [currentX, currentY] });
    };

    // Function to open the Next
    const showNext = () => {
        // Move all to the left
        set({ xy: [currentX - viewWidth, currentY] });
        setCurrentX(currentX - viewWidth);

        // Move the one on the left to the right
        let indexOfMin = leftPositions.indexOf(Math.min(...leftPositions));
        setLeftPositions(leftPositions.map((x, i) => (i === indexOfMin ? x + viewWidth * 3 : x)));
    };

    // Drag Hook (first frame, last frame, velocity xy, movement xy, cancel callback)
    const bind = useDrag(
        ({ first, last, vxvy: [vx, vy], movement: [mx, my], cancel }) => {
            if (first) {
                var verticalMovement = Math.abs(vy) >= Math.abs(vx);
                setDraggingVertically(verticalMovement);
                setDraggingHorizontally(!verticalMovement);
            }

            // Dragging Vertically
            if (draggingVertically) {
                const wrong_direction = my < yBig || my > ySmall;
                if (wrong_direction) cancel();

                // If user releases after the threshold we open, othersie close it
                if (last) {
                    if (vy >= 0) my > yBig + heightBig * 0.5 || vy > 0.5 ? showLibrary() : cancelShowLibrary();
                    else my < ySmall - heightSmall || vy < -0.5 ? showQueue() : cancelShowQueue();
                }
                // If user keeps dragging -> move panel following the position
                else if (!wrong_direction) set({ xy: [currentX, my], immediate: false, config: config.stiff });
            }

            // Dragging Vertically
            if (draggingHorizontally) {
                // If user releases after the threshold we open, othersie close it
                if (last) {
                    if (vx >= 0) mx > viewWidth * 0.25 || vx > 0.5 ? showPrev() : cancelShowPrev();
                    else mx < -viewWidth * 0.25 || vx < -0.5 ? showNext() : cancelShowNext();
                }
                // If user keeps dragging -> move panel following the position
                else set({ xy: [mx, currentY], immediate: false, config: config.stiff });
            }
        },
        { initial: () => [currentX, currentY], filterTaps: true, bounds: { top: 0 }, rubberband: true }
    );

    // Style for the sprevious song
    var prevStyle = {
        transform: xy.to((x, y) => `translate3d(${x}px,${y}px,0px)`),
        left: leftPositions[0] + "px",
        height: xy.to((x, y) => lerp(heightBig, heightSmall, invlerp(yBig, ySmall, y))),
    };

    // Style for the scurrent song
    var currStyle = {
        transform: xy.to((x, y) => `translate3d(${x}px,${y}px,0px)`),
        left: leftPositions[1] + "px",
        height: xy.to((x, y) => lerp(heightBig, heightSmall, invlerp(yBig, ySmall, y))),
    };

    // Style for the snext song
    var nextStyle = {
        transform: xy.to((x, y) => `translate3d(${x}px,${y}px,0px)`),
        left: leftPositions[2] + "px",
        height: xy.to((x, y) => lerp(heightBig, heightSmall, invlerp(yBig, ySmall, y))),
    };

    // Style for the Library
    const libraryStyle = {
        bottom: xy.to((x, y) => lerp(viewHeight, heightSmall, invlerp(yBig, ySmall, y))),
        display: xy.to((x, y) => (y <= yBig ? "none" : "block")),
        opacity: xy.to((x, y) => lerp(0, 1, invlerp(yBig, ySmall, y))),
    };

    // Style for the Library
    const queueStyle = {
        top: xy.to((x, y) => lerp(heightBig, viewHeight, invlerp(yBig, ySmall, y))),
        display: xy.to((x, y) => (y >= ySmall ? "none" : "block")),
        opacity: xy.to((x, y) => lerp(1, 0, invlerp(yBig, ySmall, y))),
    };

    return (
        <>
            <a.div className="app_library" style={libraryStyle}></a.div>

            <a.div className="app_cover_prev" {...bind()} style={prevStyle}></a.div>
            <a.div className="app_cover_curr" {...bind()} style={currStyle}>
                <Cover></Cover>
            </a.div>
            <a.div className="app_cover_next" {...bind()} style={nextStyle}></a.div>

            <a.div className="app_queue" style={queueStyle}></a.div>
        </>
    );
}
