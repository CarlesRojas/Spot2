// Linear interpolation t = [0..1]
export const lerp = (start, end, t) => start * (1 - t) + end * t;
