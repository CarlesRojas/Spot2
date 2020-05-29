import React, { useRef } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";
import "./App.css";

const heightBig = window.innerWidth * 0.96;
const heightSmall = window.innerWidth * 0.2;
const yBig = 0;
const ySmall = window.innerHeight - heightSmall - window.innerWidth * 0.04;

export default function App() {
    // True if the user is dragging
    const draggingRef = useRef(false);

    // Spring hook
    const [{ y, height }, set] = useSpring(() => ({ y: ySmall, height: heightSmall, config: { clamp: true } }));

    // Function to cancel the Library opening
    const cancelShowLibrary = ({ canceled }) => {
        set({ y: yBig, height: heightBig });
    };

    // Function to open the Library
    const showLibrary = (velocity = 0) => {
        set({ y: ySmall, height: heightSmall });
    };

    // Function to cancel the Queue opening
    const cancelShowQueue = ({ canceled }) => {
        set({ y: ySmall, height: heightSmall });
    };

    // Function to open the Queue
    const showQueue = (velocity = 0) => {
        set({ y: yBig, height: heightBig });
    };

    // Drag Hook (first frame, last frame, velocity xy, movement xy, cancel callback, cancelled boolean)
    const bind = useDrag(
        ({ first, last, vxvy: [, vy], movement: [, my], cancel, canceled }) => {
            // First and last frame -> Update the dragging reference
            if (first) draggingRef.current = true;
            else if (last) setTimeout(() => (draggingRef.current = false), 0);

            let wrong_direction = my < yBig || my > ySmall;
            if (wrong_direction) cancel();

            if (last) {
                // If user releases after the threshold we open, othersie close it
                if (vy >= 0) my > yBig + heightBig * 0.5 || vy > 1 ? showLibrary(vy) : cancelShowLibrary({ canceled });
                else my < ySmall - heightSmall || vy < -1 ? showQueue(vy) : cancelShowQueue({ canceled });
            }
            // If user keeps dragging -> move panel following the position
            else if (!wrong_direction) set({ y: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true }
    );

    // Style for Library
    const libraryStyle = {
        transform: y.to([0, heightBig], ["translateY(-8%) scale(1.16)", "translateY(0px) scale(1)"]),
        opacity: y.to([0, heightBig], [0.4, 1], "clamp"),
    };

    // Style for Queue
    const queueStyle = {
        transform: y.to([0, heightBig], ["translateY(-8%) scale(1.16)", "translateY(0px) scale(1)"]),
        opacity: y.to([0, heightBig], [0.4, 1], "clamp"),
    };

    return (
        <>
            <div className="app_main" onClick={cancelShowLibrary} />
            <a.div className="app_cover" {...bind()} style={{ y, height }}></a.div>
        </>
    );
}
