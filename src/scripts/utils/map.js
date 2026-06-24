import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CONFIG from "../config";

const markerIcon = L.divIcon({
  className: "custom-map-marker",
  html: `
    <svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true" focusable="false">
      <path d="M16 1C7.72 1 1 7.72 1 16c0 11.25 15 25 15 25s15-13.75 15-25C31 7.72 24.28 1 16 1Z" fill="#12372a" stroke="#fffdf8" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#d9a441"/>
    </svg>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -38],
});

L.Marker.prototype.options.icon = markerIcon;

export function createMap(element, options = {}) {
  const street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
  const light = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20,
    },
  );
  const map = L.map(element, {
    center: CONFIG.DEFAULT_MAP,
    zoom: 5,
    layers: [street],
    ...options,
  });
  L.control
    .layers({ "Peta Jalan": street, "Peta Terang": light }, null, {
      position: "topright",
    })
    .addTo(map);
  return map;
}

export { L };
