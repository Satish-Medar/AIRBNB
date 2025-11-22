// --- Declare the custom image URL once and reuse it (FIXED) ---
const customImageUrl =
  "https://res.cloudinary.com/dxtd9gpz2/image/upload/v1763709720/home_qwpjxq.jpg";

// const { coordinates } = require("@maptiler/client"); // Kept commented as per original

const geometry = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        message: "Foo",
        iconSize: [20, 20],
      },
      geometry: {
        type: "Point",
        // ✅ CRITICAL FIX: Changed 'cordinates' to 'coordinates'
        coordinates: listing.geometry.coordinates,
      },
    },
    // ... include all your other feature objects here ...
  ],
};

console.log("MAP TOKEN =", mapToken);

maptilersdk.config.apiKey = mapToken;

const map = new maptilersdk.Map({
  container: "map",
  style: `https://api.maptiler.com/maps/streets/style.json?key=${mapToken}`,
  // ✅ CRITICAL FIX: Changed 'cordinates' to 'coordinates'
  center: listing.geometry.coordinates,
  zoom: 9,
});

// add markers to map (The 'geometry.features' loop)
geometry.features.forEach(function (marker) {
  // create a DOM element for the marker
  const el = document.createElement("div");
  el.className = "marker";

  // --- Use the pre-declared custom image URL ---
  el.style.backgroundImage = `url('${customImageUrl}')`;

  // Set dimensions based on your GeoJSON data properties
  el.style.width = marker.properties.iconSize[0] + "px";
  el.style.height = marker.properties.iconSize[1] + "px";
  el.style.backgroundSize = "50% 50%"; // Ensures the image fills the defined size
  el.style.borderRadius = "50%"; // Optional: If your image is square, this makes it a circle
  el.style.cursor = "pointer";

  el.addEventListener("click", function () {
    window.alert(marker.properties.message);
  });

  // add marker to map
  new maptilersdk.Marker({ element: el })
    .setLngLat(marker.geometry.coordinates)
    .addTo(map);
});

// ✅ CRITICAL FIX: Changed 'cordinates' to 'coordinates'
console.log(listing.geometry.coordinates);

// --- UPDATE: Add the single main marker using your custom image ---

// create the popup
const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(
  `<h4>${listing.location}</h4><p>Exact Location will be provided after booking</p>`
);

// 1. Create a custom DOM element for the single main marker
const mainMarkerEl = document.createElement("div");
mainMarkerEl.className = "main-marker";

// --- Use the pre-declared custom image URL (FIXED) ---
mainMarkerEl.style.backgroundImage = `url('${customImageUrl}')`;

// 2. Set fixed size for the main marker (e.g., 50px)
mainMarkerEl.style.width = "30px";
mainMarkerEl.style.height = "30px";
mainMarkerEl.style.backgroundSize = "100% 100%";
mainMarkerEl.style.borderRadius = "50%"; // Optional: To make it look like a badge/pin
mainMarkerEl.style.cursor = "pointer";

// 3. Add the marker to the map
const mainMarker = new maptilersdk.Marker({ element: mainMarkerEl })
  // ✅ CRITICAL FIX: Changed 'cordinates' to 'coordinates'
  .setLngLat(listing.geometry.coordinates)
  .setPopup(popup)
  .addTo(map);
