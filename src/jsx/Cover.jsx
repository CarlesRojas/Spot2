import React, { useState } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";

import "../css/Cover.css";

// Size of the viewport
const viewWidth = window.innerWidth;

export default function Cover() {
    // State to hold weather we are dragging horizontally or horizontally
    const [draggingHorizontally, setDraggingHorizontally] = useState(false);
    const [currentX, setCurrentX] = useState(0);
    const [leftPositions, setLeftPositions] = useState([-viewWidth, 0, viewWidth]);

    // Spring hook
    const [{ x }, set] = useSpring(() => ({ x: currentX, config: { clamp: true } }));

    // Function to cancel the Prev opening
    const cancelShowPrev = () => {
        console.log("CancelShowPrev");
        set({ x: currentX });
    };

    // Function to open the Prev
    const showPrev = (velocity = 0) => {
        console.log("ShowPrev");
        set({ x: currentX + viewWidth });
        setCurrentX(currentX + viewWidth);
        let indexOfMax = leftPositions.indexOf(Math.max(...leftPositions));
        setLeftPositions(leftPositions.map((x, i) => (i === indexOfMax ? viewWidth : x)));
    };

    // Function to cancel the Next opening
    const cancelShowNext = () => {
        console.log("CancelShowNext");
        set({ x: currentX });
    };

    // Function to open the Next
    const showNext = (velocity = 0) => {
        console.log("ShowNext");
        set({ x: currentX - viewWidth });
        setCurrentX(currentX - viewWidth);
        let indexOfMin = leftPositions.indexOf(Math.min(...leftPositions));
        setLeftPositions(leftPositions.map((x, i) => (i === indexOfMin ? viewWidth : x)));
    };

    // Drag Hook (first frame, last frame, velocity xy, movement xy, cancel callback)
    const bind = useDrag(
        ({ first, last, vxvy: [vx, vy], movement: [mx], cancel }) => {
            if (first) setDraggingHorizontally(Math.abs(vy) < Math.abs(vx));

            // Dragging Vertically
            if (draggingHorizontally) {
                // If user releases after the threshold we open, othersie close it
                if (last) {
                    if (vx >= 0) mx > viewWidth * 0.25 || vx > 0.5 ? showPrev(vx) : cancelShowPrev();
                    else mx < -viewWidth * 0.25 || vx < -0.5 ? showNext(vx) : cancelShowNext();
                }
                // If user keeps dragging -> move panel following the position
                else set({ x: mx, immediate: false, config: config.stiff });
            }
        },
        { initial: () => [x.get(), 0], filterTaps: true, bounds: { top: 0 }, rubberband: true }
    );

    return (
        <>
            <a.div className="cover_prev" {...bind()} style={{ x, left: leftPositions[0] + "px" }}></a.div>
            <a.div className="cover_curr" {...bind()} style={{ x, left: leftPositions[1] + "px" }}></a.div>
            <a.div className="cover_next" {...bind()} style={{ x, left: leftPositions[2] + "px" }}></a.div>
        </>
    );
}
