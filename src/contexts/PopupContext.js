import React, { createContext, useState } from "react";
import { useSpring, a, config } from "react-spring";
import { useDrag } from "react-use-gesture";

// Popup Context
export const PopupContext = createContext();

// Size of the viewport
const viewHeight = window.innerHeight;

const PopupContextProvider = (props) => {
    // State
    const [state, setState] = useState({
        type: "",
        name: "",
        items: [],
        callback: () => {},
    });

    // Spring hook
    const [currentY, setCurrentY] = useState(-viewHeight);
    const [{ y }, set] = useSpring(() => ({ y: -viewHeight, config: { clamp: true } }));

    // Function to open the popup
    const showPopup = () => {
        set({ y: 0 });
        setCurrentY(0);
    };

    // Function to hide the popup
    const hidePopup = () => {
        set({ y: -viewHeight });
        setCurrentY(-viewHeight);
    };

    // Function to set the state and open the popup
    const openPopup = (newPopupState) => {
        setState(newPopupState);
        showPopup();
    };

    // Handle click on an option
    const handleOptionClick = (callback, callbackName) => {
        callback(callbackName);
        hidePopup();
    };

    // Drag Hook
    const dragBind = useDrag(
        ({ last, vxvy: [, vy], movement: [, my], cancel }) => {
            const wrong_direction = my >= 0;
            if (wrong_direction) cancel();

            // If user releases after the threshold we open, othersie close it
            if (last && (my < -75 || vy < -0.5)) hidePopup();
            else if (last) showPopup();
            // If user keeps dragging -> move panel following the position
            else if (!wrong_direction) set({ y: my, immediate: false, config: config.stiff });
        },
        { initial: () => [0, currentY], filterTaps: true, rubberband: true }
    );

    const tapBind = useDrag(({ tap }) => {
        if (tap) hidePopup();
    });

    // Create popup items
    var itemElems = state.items.map(({ name, callbackName, selected }, index) => {
        return (
            <button
                key={index}
                className={"popup_button" + (selected ? " popup_buttonSelected" : "")}
                onClick={() => handleOptionClick(state.callback, callbackName)}
            >
                {name}
            </button>
        );
    });

    return (
        <PopupContext.Provider value={{ openPopup }}>
            <a.div className="popup_wrapper" {...dragBind()} style={{ y }}>
                <div className="popup_mainArea">
                    <div className="popup_titleWrapper">
                        <p className="popup_title">{state.name}</p>
                    </div>

                    <div className="popup_itemList">{itemElems}</div>
                </div>
                <div className="popup_closeArea" {...tapBind()} />
            </a.div>
            {props.children}
        </PopupContext.Provider>
    );
};

export default PopupContextProvider;
