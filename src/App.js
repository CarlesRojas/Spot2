import React, { useRef } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";
import "./App.css";

const height = window.innerWidth * 0.96;

export default function App() {
    // True if the user is dragging
    const draggingRef = useRef(false);

    // Spring hook
    const [{ y }, set] = useSpring(() => ({ y: height }));

    // Function to open the cover
    const open = ({ canceled }) => {
        set({ y: 0, config: canceled ? config.wobbly : config.stiff });
    };

    // Function to close the cover
    const close = (velocity = 0) => {
        set({ y: height, config: { ...config.stiff, velocity } });
    };

    // Drag Hook (first frame, last frame, velocity xy, movement xy, cancel callback, cancelled boolean)
    const bind = useDrag(
        ({ first, last, vxvy: [, vy], movement: [, my], cancel, canceled }) => {
            // First and last frame -> Update the dragging reference
            if (first) draggingRef.current = true;
            else if (last) setTimeout(() => (draggingRef.current = false), 0);

            // If user drags past a threshhold going the other way -> Cancel drag and open panel
            if (my < -height * 0.1) cancel();

            // If user releases after the threshold we open, othersie close it
            if (last) my > height * 0.5 || vy > 0.5 ? close(vy) : open({ canceled });
            // If user keeps dragging -> move panel following the position
            else set({ y: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true }
    );

    // Do not display if not in view
    const display = y.to((py) => (py < height ? "block" : "none"));

    return (
        <>
            <div className="app_main" onClick={open} />
            <a.div className="app_cover" {...bind()} style={{ display, y }}></a.div>
        </>
    );
}
