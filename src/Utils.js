import { useRef, useEffect } from "react";

// #######################################
//      INTERPOLATIONS
// #######################################

// Clamp a value between a min and max
export const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));

// Linear interpolation
export const lerp = (start, end, t) => start * (1 - t) + end * t;

// Inverse linear interpolation
export const invlerp = (x, y, a) => clamp((a - x) / (y - x));

// #######################################
//      COOKIE HANDLE
// #######################################

// Set a cookie
export const setCookie = (name, value, cookieDurationInDays) => {
    var d = new Date();
    d.setTime(d.getTime() + cookieDurationInDays * 24 * 60 * 60 * 1000);
    var expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
};

// Get a cookie
export const getCookie = (name) => {
    var formatedName = name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var splitedCookies = decodedCookie.split(";");
    for (var i = 0; i < splitedCookies.length; i++) {
        var currentCookie = splitedCookies[i];
        while (currentCookie.charAt(0) === " ") {
            currentCookie = currentCookie.substring(1);
        }
        if (currentCookie.indexOf(formatedName) === 0) {
            return currentCookie.substring(formatedName.length, currentCookie.length);
        }
    }
    return "";
};

// #######################################
//      HASH PARAMS
// #######################################

// Obtains parameters from the hash of the URL
export const getHashParams = () => {
    var hashParams = {};
    var e;
    var r = /([^&;=]+)=?([^&;]*)/g;
    var q = window.location.hash.substring(1);
    while ((e = r.exec(q))) hashParams[e[1]] = decodeURIComponent(e[2]);
    return hashParams;
};

// #######################################
//      PRETTIFY NAME
// #######################################

// Remove extra info from a song, album or artist name
export const prettifyName = (name) => {
    const separators = [" - ", "(", ":", ",", " /"];

    var index = Number.MAX_SAFE_INTEGER;
    for (var i = 0; i < separators.length; ++i) {
        var result = name.indexOf(separators[i]);
        if (result > 0) index = Math.min(index, name.indexOf(separators[i]));
    }

    if (index > 0 && index < name.length) name = name.substring(0, index);
    return name.trim();
};

// #######################################
//      PRINT
// #######################################

// Prints colored messages
export const print = (object, color) => {
    if (typeof object === "object") console.log(object);
    else if (color) console.log("%c" + object, "color: " + color);
    else console.log("%c" + object, "color: lime");
};

// #######################################
//      EVENT LISTENER HOOK
// #######################################

export const useEventListener = (eventName, handler, element = window) => {
    // Create a ref that stores handler
    const savedHandler = useRef();

    // Update ref.current value if handler changes.
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        // Make sure element supports addEventListener
        const isSupported = element && element.addEventListener;
        if (!isSupported) return;

        // Create event listener that calls handler function stored in ref
        const eventListener = (event) => savedHandler.current(event);

        // Add event listener
        element.addEventListener(eventName, eventListener);

        // Remove event listener on cleanup
        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
};
