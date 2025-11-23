(function () {
  try {
    // Defensive checks to avoid runtime errors when map data is not present
    if (typeof mapToken === "undefined" || !mapToken) {
      console.warn(
        "Map: MAPTILER API token not found (mapToken). Map will not initialize."
      );
      return;
    }
    if (typeof listing === "undefined" || !listing) {
      console.warn(
        "Map: listing data not found on the page. Map will not initialize."
      );
      return;
    }
    if (
      !listing.geometry ||
      !Array.isArray(listing.geometry.coordinates) ||
      listing.geometry.coordinates.length < 2
    ) {
      console.warn(
        "Map: listing.geometry.coordinates missing or invalid. Map will not initialize."
      );
      return;
    }
    if (typeof maptilersdk === "undefined") {
      console.warn(
        "Map: maptilersdk is not loaded. Ensure the MapTiler SDK script is included."
      );
      return;
    }

    const customImageUrl =
      "https://res.cloudinary.com/dxtd9gpz2/image/upload/v1763709720/home_qwpjxq.jpg";

    // configure API key
    maptilersdk.config.apiKey = mapToken;

    const map = new maptilersdk.Map({
      container: "map",
      style: `https://api.maptiler.com/maps/streets/style.json?key=${mapToken}`,
      center: listing.geometry.coordinates,
      zoom: 9,
    });

    // single main marker with popup
    const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(
      `<h4>${
        listing.location || ""
      }</h4><p>Exact Location will be provided after booking</p>`
    );

    const mainMarkerEl = document.createElement("div");
    mainMarkerEl.className = "main-marker";
    mainMarkerEl.style.backgroundImage = `url('${customImageUrl}')`;
    mainMarkerEl.style.width = "34px";
    mainMarkerEl.style.height = "34px";
    mainMarkerEl.style.backgroundSize = "cover";
    mainMarkerEl.style.borderRadius = "50%";

    new maptilersdk.Marker({ element: mainMarkerEl })
      .setLngLat(listing.geometry.coordinates)
      .setPopup(popup)
      .addTo(map);

    // If you have additional feature markers, keep this placeholder for iteration
    if (listing.extraFeatures && Array.isArray(listing.extraFeatures)) {
      listing.extraFeatures.forEach(function (marker) {
        try {
          const el = document.createElement("div");
          el.className = "marker";
          el.style.backgroundImage = `url('${customImageUrl}')`;
          el.style.width = (marker?.properties?.iconSize?.[0] || 20) + "px";
          el.style.height = (marker?.properties?.iconSize?.[1] || 20) + "px";
          el.style.backgroundSize = "50% 50%";
          el.style.borderRadius = "50%";
          el.style.cursor = "pointer";
          el.addEventListener("click", function () {
            window.alert(marker.properties?.message || "Marker");
          });
          new maptilersdk.Marker({ element: el })
            .setLngLat(marker.geometry.coordinates)
            .addTo(map);
        } catch (err) {
          console.warn("Map: failed to add extra feature marker", err);
        }
      });
    }
  } catch (e) {
    console.error("Map initialization error:", e);
  }
})();
