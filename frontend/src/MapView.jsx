import React from "react";
import { Map, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, transformRequest } from "./mapStyle";
const isMobile = window.matchMedia("(max-width:600px)").matches;

/**
 * MapView
 * --------
 * Props
 * ─ children            React nodes to render inside the map ( , Popup, etc.)
 * ─ onClick(latLngObj)  optional callback for map clicks {lng, lat}
 * ─ initial             optional {longitude, latitude, zoom}
 */
export default function MapView({
  
  children,
  onClick,
  initial = { longitude: 0, latitude: 0, zoom: 1.5 },
  style = { width: "100%", height: "100%" },
}) {
  return (
    <Map
      initialViewState={initial}
      mapStyle={MAP_STYLE}
      transformRequest={transformRequest}
      style={style}
      onClick={(e) => onClick && onClick(e.lngLat)}
    >
      <NavigationControl position={isMobile ? "bottom-left" : "top-left"} />
      {children}
    </Map>
  );
}
