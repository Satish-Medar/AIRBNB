const { render } = require("ejs");
const List = require("../models/listing");

// MapTiler Client (server-side)
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

// Categories with optional icon classes (used in the index view)
const CATEGORIES = [
  { name: "Trending", iconClass: "fa-solid fa-fire" },
  { name: "Rooms", iconClass: "fa-solid fa-bed" },
  { name: "Iconic Cities", iconClass: "fa-solid fa-city" },
  { name: "Mountains", iconClass: "fa-solid fa-mountain" },
  { name: "Castles", iconClass: "fa-brands fa-fort-awesome" },
  { name: "Arctic", iconClass: "fa-solid fa-snowflake" },
  { name: "Camping", iconClass: "fa-solid fa-campground" },
  { name: "Farms", iconClass: "fa-solid fa-cow" },
  { name: "Pools", iconClass: "fa-solid fa-person-swimming" },
  { name: "Domes", iconClass: "fa-solid fa-igloo" },
  { name: "Boats", iconClass: "fa-solid fa-sailboat" },
];

// Index Controller
module.exports.index = async (req, res) => {
  const q = req.query.q;
  let listings;
  if (q && q.trim() !== "") {
    // Case-insensitive partial match on title
    listings = await List.find({ title: { $regex: q, $options: "i" } });
  } else {
    listings = await List.find({});
  }
  res.render("listings/index.ejs", {
    listings,
    allListings: listings,
    searchQuery: q || "",
    categories: CATEGORIES,
  });
};

// Render New Form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/form.ejs", { categories: CATEGORIES });
};

// Render Search Form
module.exports.renderSearchForm = async (req, res) => {
  const listings = await List.find({});
  res.render("listings/search.ejs", {
    listings,
    allListings: listings,
    categories: CATEGORIES,
  });
};

// Filter by category
module.exports.filterByCategory = async (req, res) => {
  const { category } = req.params;
  const listings = await List.find({ category });
  res.render("listings/index.ejs", {
    listings,
    allListings: listings,
    searchQuery: "",
    categories: CATEGORIES,
    selectedCategory: category,
  });
};

// Show Controller
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await List.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/showroute.ejs", { listing });
};

// Create Controller (with geocoding)
module.exports.createListing = async (req, res) => {
  const locationString = `${req.body.listing.location}, ${req.body.listing.country}`;
  const geoData = await maptilerClient.geocoding.forward(locationString);
  console.log("Geocode Data:", geoData.features[0].geometry);

  if (geoData?.features?.length) {
    lng = geoData.features[0].center[0];
    lat = geoData.features[0].center[1];
  }

  const newlisting = new List(req.body.listing);
  newlisting.owner = req.user._id;

  if (req.file) {
    newlisting.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  newlisting.geometry = geoData.features[0].geometry;

  // listing.lng = lng;
  // listing.lat = lat;

  let sl = await newlisting.save();
  console.log(sl);
  req.flash("success", "Listing created successfully!");
  res.redirect("/listings");
};
// Render Edit Form
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await List.findById(id).populate("owner"); // Fetch the listing

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing, categories: CATEGORIES });
};

// Update Controller (with geocoding)
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // 1. Geocode the updated location
  const locationString = `${req.body.listing.location}, ${req.body.listing.country}`;
  const geoData = await maptilerClient.geocoding.forward(locationString);

  let newGeometry;
  if (geoData?.features?.length) {
    newGeometry = geoData.features[0].geometry;
  }

  // 2. Update the Listing document
  const listing = await List.findByIdAndUpdate(
    id,
    { ...req.body.listing }, // Apply all form data
    { new: true, runValidators: true }
  );

  // 3. Update Image if a new one was uploaded
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  // 4. Update Geometry
  if (newGeometry) {
    listing.geometry = newGeometry;
  }

  await listing.save(); // Save changes including file and geometry

  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

// Delete Controller
module.exports.deleteListing = async (req, res) => {
  // <-- RENAME to deleteListing
  let { id } = req.params;
  // The Mongoose findByIdAndDelete triggers your cascading delete middleware
  await List.findByIdAndDelete(id);

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
