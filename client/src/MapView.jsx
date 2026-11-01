
import { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import { CATEGORIES } from "./categories";

// Fix Leaflet marker assets when using Vite.
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const FALLBACK_CENTER = {
  lat: 13.0827,
  lon: 80.2707,
};

const TILE_PROVIDERS = {
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  carto: {
    name: "CARTO",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

function createCategoryIcon(category) {
  const definition = CATEGORIES[category];

  const color = definition?.color || "#374151";
  const emoji = definition?.icon || "📍";

  return L.divIcon({
    className: "travelsense-map-marker",
    html: `
      <div style="
        width:34px;
        height:34px;
        border-radius:50%;
        background:${color};
        border:2px solid white;
        box-shadow:0 2px 7px rgba(0,0,0,.35);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:18px;
      ">${emoji}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

const userIcon = L.divIcon({
  className: "travelsense-user-marker",
  html: `
    <div style="
      width:20px;
      height:20px;
      background:#2563eb;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 0 5px rgba(37,99,235,.22);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const memberIcon = L.divIcon({
  className: "travelsense-member-marker",
  html: `
    <div style="
      width:23px;
      height:23px;
      background:#059669;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
    "></div>
  `,
  iconSize: [23, 23],
  iconAnchor: [11, 11],
});

function RecenterControl({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    const lat = Number(position.lat);
    const lon = Number(position.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    map.flyTo([lat, lon], 15, {
      animate: true,
      duration: 0.8,
    });
  }, [position?.lat, position?.lon, map]);

  return null;
}

function MapControls({ position }) {
  const map = useMap();

  function zoomToMe() {
    if (!position) return;

    map.flyTo(
      [Number(position.lat), Number(position.lon)],
      16,
      { animate: true }
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 500,
        right: 12,
        top: 12,
      }}
    >
      <button
        type="button"
        onClick={zoomToMe}
        disabled={!position}
        title="Center map on my location"
        style={{
          background: "white",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: "9px 12px",
          cursor: position ? "pointer" : "not-allowed",
          boxShadow: "0 1px 5px rgba(0,0,0,.15)",
        }}
      >
        ◎ My location
      </button>
    </div>
  );
}

function validCoordinates(place) {
  const lat = Number(place?.lat);
  const lon = Number(place?.lon ?? place?.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function safeWebsite(value) {
  if (!value) return null;

  try {
    const url = new URL(
      value.startsWith("http") ? value : `https://${value}`
    );

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function PlacePopup({ place }) {
  const definition = CATEGORIES[place.category];
  const mapUrl = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=18/${place.lat}/${place.lon}`;
  const website = safeWebsite(place.website);

  return (
    <div style={{ minWidth: 180, maxWidth: 250 }}>
      <strong style={{ fontSize: 15 }}>
        {definition?.icon || "📍"}{" "}
        {place.name || "Nearby place"}
      </strong>

      <div style={{ marginTop: 5, color: "#475569" }}>
        {definition?.label || place.category || "Place"}
      </div>

      {place.subtype && (
        <div style={{ marginTop: 4 }}>
          {place.subtype}
        </div>
      )}

      {place.address && (
        <div style={{ marginTop: 5 }}>
          📍 {place.address}
        </div>
      )}

      {Number.isFinite(Number(place.distance)) && (
        <div style={{ marginTop: 5 }}>
          📏 {place.distance >= 1000
            ? `${(place.distance / 1000).toFixed(1)} km`
            : `${Math.round(place.distance)} m`} away
        </div>
      )}

      {place.phone && (
        <div style={{ marginTop: 5 }}>
          ☎️ <a href={`tel:${place.phone}`}>{place.phone}</a>
        </div>
      )}

      {place.openingHours && (
        <div style={{ marginTop: 5 }}>
          Opening hours: {place.openingHours}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 10,
        }}
      >
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          View on OpenStreetMap
        </a>

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
          >
            Website
          </a>
        )}
      </div>
    </div>
  );
}

export default function MapView({
  position,
  places = [],
  extendedPlaces = [],
  radius = 0,
  extendedRadius = 0,
  members = [],
}) {
  const [tileProvider, setTileProvider] = useState("osm");
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  const validPosition = useMemo(() => {
    if (!position) return null;

    const lat = Number(position.lat);
    const lon = Number(position.lon ?? position.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return null;
    }

    return { lat, lon };
  }, [position]);

  const center = validPosition || FALLBACK_CENTER;

  const validPlaces = useMemo(
    () => (Array.isArray(places) ? places : []).filter(validCoordinates),
    [places]
  );

  const validExtendedPlaces = useMemo(
    () =>
      (Array.isArray(extendedPlaces) ? extendedPlaces : [])
        .filter(validCoordinates),
    [extendedPlaces]
  );

  const validMembers = useMemo(
    () =>
      (Array.isArray(members) ? members : [])
        .filter(validCoordinates),
    [members]
  );

  const allPlaces = [...validPlaces, ...validExtendedPlaces];

  const categoryCounts = allPlaces.reduce((counts, place) => {
    counts[place.category] = (counts[place.category] || 0) + 1;
    return counts;
  }, {});

  function handleTileError() {
    if (tileProvider === "osm") {
      console.warn(
        "[TravelSense] OpenStreetMap tiles failed. Switching to CARTO."
      );
      setTileProvider("carto");
      setTilesUnavailable(false);
    } else {
      setTilesUnavailable(true);
    }
  }

  function switchTileProvider() {
    setTilesUnavailable(false);
    setTileProvider((current) =>
      current === "osm" ? "carto" : "osm"
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 480,
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "#e5e7eb",
      }}
    >
      {!validPosition && (
        <div
          style={{
            position: "absolute",
            zIndex: 1000,
            top: 12,
            left: 12,
            right: 12,
            padding: 10,
            background: "#fff7ed",
            color: "#9a3412",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          Location not detected. Allow browser location permission
          and use the Locate me button to search nearby places.
          The map is showing a default Chennai view.
        </div>
      )}

      {tilesUnavailable && (
        <div
          style={{
            position: "absolute",
            zIndex: 1000,
            top: validPosition ? 12 : 65,
            left: 12,
            right: 12,
            padding: 10,
            background: "#fff7ed",
            color: "#9a3412",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          Map tiles are unavailable from both tile providers.
          Nearby search results may still be available.
          Check your internet connection or DNS settings.
        </div>
      )}

      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          bottom: 12,
          left: 12,
          background: "white",
          borderRadius: 8,
          padding: "8px 11px",
          boxShadow: "0 1px 5px rgba(0,0,0,.18)",
          fontSize: 12,
        }}
      >
        <strong>{allPlaces.length}</strong> nearby places
        {validMembers.length > 0 && (
          <> · <strong>{validMembers.length}</strong> members</>
        )}
      </div>

      <button
        type="button"
        onClick={switchTileProvider}
        style={{
          position: "absolute",
          zIndex: 1000,
          right: 12,
          bottom: 12,
          border: "1px solid #d1d5db",
          borderRadius: 8,
          background: "white",
          padding: "8px 11px",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Map: {TILE_PROVIDERS[tileProvider].name} ↻
      </button>

      <MapContainer
        center={[center.lat, center.lon]}
        zoom={validPosition ? 15 : 11}
        scrollWheelZoom
        style={{
          width: "100%",
          height: "100%",
          minHeight: 480,
        }}
      >
        <TileLayer
          key={tileProvider}
          attribution={TILE_PROVIDERS[tileProvider].attribution}
          url={TILE_PROVIDERS[tileProvider].url}
          eventHandlers={{
            tileerror: handleTileError,
          }}
        />

        <RecenterControl position={validPosition} />
        <MapControls position={validPosition} />

        {validPosition && (
          <>
            <Marker
              position={[validPosition.lat, validPosition.lon]}
              icon={userIcon}
            >
              <Popup>
                <strong>You are here</strong>
                {position?.accuracy && (
                  <div>
                    Accuracy: ±{Math.round(position.accuracy)} m
                  </div>
                )}
              </Popup>
            </Marker>

            {Number(position?.accuracy) > 0 && (
              <Circle
                center={[validPosition.lat, validPosition.lon]}
                radius={Number(position.accuracy)}
                pathOptions={{
                  color: "#2563eb",
                  fillColor: "#2563eb",
                  fillOpacity: 0.08,
                }}
              />
            )}

            {Number(radius) > 0 && (
              <Circle
                center={[validPosition.lat, validPosition.lon]}
                radius={Number(radius)}
                pathOptions={{
                  color: "#16a34a",
                  fillOpacity: 0.025,
                  dashArray: "6 6",
                }}
              />
            )}

            {Number(extendedRadius) > 0 && (
              <Circle
                center={[validPosition.lat, validPosition.lon]}
                radius={Number(extendedRadius)}
                pathOptions={{
                  color: "#9333ea",
                  fillOpacity: 0,
                  dashArray: "3 7",
                }}
              />
            )}
          </>
        )}

        {validMembers.map((member, index) => (
          <Marker
            key={member.userId ?? member.id ?? `member-${index}`}
            position={[
              Number(member.lat),
              Number(member.lon ?? member.lng),
            ]}
            icon={memberIcon}
          >
            <Popup>
              <strong>{member.name || "Trip member"}</strong>
              <div>Sharing live location</div>
            </Popup>
          </Marker>
        ))}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={55}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {validPlaces.map((place, index) => (
            <Marker
              key={place.id || `place-${index}`}
              position={[
                Number(place.lat),
                Number(place.lon),
              ]}
              icon={createCategoryIcon(place.category)}
            >
              <Popup>
                <PlacePopup place={place} />
              </Popup>
            </Marker>
          ))}

          {validExtendedPlaces.map((place, index) => (
            <Marker
              key={place.id || `extended-${index}`}
              position={[
                Number(place.lat),
                Number(place.lon),
              ]}
              icon={createCategoryIcon(place.category)}
            >
              <Popup>
                <PlacePopup place={place} />
                <div
                  style={{
                    color: "#9333ea",
                    marginTop: 6,
                    fontSize: 12,
                  }}
                >
                  Extended search result
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {Object.keys(categoryCounts).length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 1000,
            top: validPosition ? 58 : 110,
            left: 12,
            maxWidth: "calc(100% - 24px)",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {Object.entries(categoryCounts).map(([key, count]) => (
            <span
              key={key}
              style={{
                background: "white",
                borderRadius: 20,
                padding: "5px 9px",
                fontSize: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,.15)",
              }}
            >
              {CATEGORIES[key]?.icon || "📍"}{" "}
              {CATEGORIES[key]?.label || key}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
