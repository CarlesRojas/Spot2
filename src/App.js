import React, { useState } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";

import "./App.css";

import Cover from "./jsx/Cover";

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

    // Spring hook
    const [{ y }, set] = useSpring(() => ({ y: ySmall, config: { clamp: true } }));

    // Function to cancel the Library opening
    const cancelShowLibrary = () => {
        set({ y: yBig });
    };

    // Function to open the Library
    const showLibrary = (velocity = 0) => {
        set({ y: ySmall });
    };

    // Function to cancel the Queue opening
    const cancelShowQueue = () => {
        set({ y: ySmall });
    };

    // Function to open the Queue
    const showQueue = (velocity = 0) => {
        set({ y: yBig });
    };

    // Drag Hook (first frame, last frame, velocity xy, movement xy, cancel callback)
    const bind = useDrag(
        ({ first, last, vxvy: [vx, vy], movement: [my], cancel }) => {
            if (first) setDraggingVertically(Math.abs(vy) >= Math.abs(vx));

            // Dragging Vertically
            if (draggingVertically) {
                const wrong_direction = my < yBig || my > ySmall;
                if (wrong_direction) cancel();

                // If user releases after the threshold we open, othersie close it
                if (last) {
                    if (vy >= 0) my > yBig + heightBig * 0.5 || vy > 0.5 ? showLibrary(vy) : cancelShowLibrary();
                    else my < ySmall - heightSmall || vy < -0.5 ? showQueue(vy) : cancelShowQueue();
                }
                // If user keeps dragging -> move panel following the position
                else if (!wrong_direction) set({ y: my, immediate: false, config: config.stiff });
            }
        },
        { initial: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true }
    );

    // Style for the Library
    const libraryStyle = {
        bottom: y.to([yBig, ySmall], [viewHeight, heightSmall], "clamp"),
        display: y.to((py) => (py <= yBig ? "none" : "block")),
        opacity: y.to([yBig, ySmall], [0, 1], "clamp"),
    };

    // Style for the Queue
    const queueStyle = {
        top: y.to([yBig, ySmall], [heightBig, viewHeight], "clamp"),
        display: y.to((py) => (py >= ySmall ? "none" : "block")),
        opacity: y.to([yBig, ySmall], [1, 0], "clamp"),
    };

    // Height for the Cover
    const height = y.to([yBig, ySmall], [heightBig, heightSmall], "clamp");

    return (
        <>
            <a.div className="app_library" style={libraryStyle}></a.div>
            <a.div className="app_cover" {...bind()} style={{ y, height }}>
                <Cover></Cover>
            </a.div>
            <a.div className="app_queue" style={queueStyle}></a.div>
        </>
    );
}
