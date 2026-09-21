/* utils/isValidCoord.js — or inline in the file */

export const isValidCoord = (lat, lon) => {
    const la = Number(lat);
    const lo = Number(lon);
    return (
      !Number.isNaN(la) &&
      !Number.isNaN(lo) &&
      la >= -90 &&
      la <= 90 &&
      lo >= -180 &&
      lo <= 180
    );
  };
  