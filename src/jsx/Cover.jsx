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
        set({ x: currentX });
    };

    // Function to open the Prev
    const showPrev = (velocity = 0) => {
        // Move all to the right
        set({ x: currentX + viewWidth });
        setCurrentX(currentX + viewWidth);

        // Move the one on the right to the left
        let indexOfMax = leftPositions.indexOf(Math.max(...leftPositions));
        setLeftPositions(leftPositions.map((x, i) => (i === indexOfMax ? x - viewWidth * 3 : x)));
    };

    // Function to cancel the Next opening
    const cancelShowNext = () => {
        set({ x: currentX });
    };

    // Function to open the Next
    const showNext = (velocity = 0) => {
        // Move all to the left
        set({ x: currentX - viewWidth });
        setCurrentX(currentX - viewWidth);

        // Move the one on the left to the right
        let indexOfMin = leftPositions.indexOf(Math.min(...leftPositions));
        setLeftPositions(leftPositions.map((x, i) => (i === indexOfMin ? x + viewWidth * 3 : x)));
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

    var prevStyle = { x, left: leftPositions[0] + "px" };
    var currStyle = { x, left: leftPositions[1] + "px" };
    var nextStyle = { x, left: leftPositions[2] + "px" };

    return (
        <>
            <a.div className="cover_prev" {...bind()} style={prevStyle}></a.div>
            <a.div className="cover_curr" {...bind()} style={currStyle}></a.div>
            <a.div className="cover_next" {...bind()} style={nextStyle}></a.div>
        </>
    );
}
