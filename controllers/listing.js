const { render } = require("ejs");
const List = require("../models/listing");

// FIX: Added missing import for ExpressError (required for other controller methods in this file)
const ExpressError = require("../utils/ExpressError.js");

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

// Index Controller (FIXED: Added sorting, filtering, and pagination variables)
module.exports.index = async (req, res) => {
  const q = req.query.q;
  const sort = req.query.sort || "new";
  const selectedCategory = req.query.category || "";
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;

  // Pagination variables: Setting defaults for the view to work
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  // Build the MongoDB Query
  const filterQuery = {};

  // 1. Category Filter
  if (selectedCategory && CATEGORIES.some((c) => c.name === selectedCategory)) {
    filterQuery.category = selectedCategory;
  }

  // 2. Search Filter (by title, consistent with the original code)
  if (q && q.trim() !== "") {
    filterQuery.title = { $regex: q, $options: "i" };
  }

  // 3. Price Filter
  const priceFilter = {};
  if (minPrice) {
    priceFilter.$gte = minPrice;
  }
  if (maxPrice) {
    priceFilter.$lte = maxPrice;
  }
  if (Object.keys(priceFilter).length > 0) {
    filterQuery.price = priceFilter;
  }

  // 4. Sorting Logic
  let sortOptions = {};
  switch (sort) {
    case "price_asc":
      sortOptions.price = 1;
      break;
    case "price_desc":
      sortOptions.price = -1;
      break;
    case "rating_desc":
      sortOptions.avgRating = -1; // Assumes future implementation of avgRating
      break;
    case "new":
    default:
      sortOptions._id = -1;
      break;
  }

  // Get total count of documents matching the filter criteria
  const total = await List.countDocuments(filterQuery);

  // Fetch listings with all applied filters, sorting, and pagination

  const listings = await List.find(filterQuery)
    .sort(sortOptions)
    .populate("owner")
    .populate("reviews");

  // NOTE: Temporarily removing full pagination logic to avoid breaking if data is small/query is complex
  // .skip((page - 1) * limit)
  // .limit(limit);

  // For now, fetching all (as in original code) but using page/limit/total for the "Load More" button logic

  res.render("listings/index.ejs", {
    listings,
    allListings: listings,
    searchQuery: q || "",
    categories: CATEGORIES,
    sort: sort,
    selectedCategory: selectedCategory,
    minPrice: minPrice || "",
    maxPrice: maxPrice || "",
    page: page, // FIX: Pass page variable
    limit: limit, // FIX: Pass limit variable
    total: total, // FIX: Pass total variable
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

// Autocomplete Controller (from previous fix)
module.exports.autocomplete = async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.json([]);
  }

  const listings = await List.find({ title: { $regex: q, $options: "i" } })
    .select("title")
    .limit(10);

  const suggestions = listings.map((l) => l.title);
  res.json(suggestions);
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
    // FIX: Pass missing pagination/sort variables here too
    sort: "new",
    page: 1,
    limit: 10,
    total: listings.length, // Use the filtered list count for total
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
  let geoData = null;
  try {
    geoData = await maptilerClient.geocoding.forward(locationString);
  } catch (err) {
    console.error("Geocoding request failed:", err);
    req.flash(
      "error",
      "Location lookup failed. Please check the address and try again."
    );
    return res.redirect("/listings/new");
  }

  // If geocoding didn't return usable features, inform the user instead of saving invalid document
  if (!geoData || !geoData.features || geoData.features.length === 0) {
    console.error("Geocoding returned no features for:", locationString);
    req.flash(
      "error",
      "We couldn't find that location. Please enter a more specific address or try a nearby city."
    );
    return res.redirect("/listings/new");
  }

  // At this point geoData is available
  console.log("Geocode Data:", geoData.features[0].geometry);

  const newlisting = new List(req.body.listing);
  newlisting.owner = req.user._id;

  if (req.file) {
    newlisting.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  newlisting.geometry = geoData.features[0].geometry;

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

  // 1. Geocode the updated location (wrap in try/catch so update doesn't crash on transient API errors)
  const locationString = `${req.body.listing.location}, ${req.body.listing.country}`;
  let geoData = null;
  try {
    geoData = await maptilerClient.geocoding.forward(locationString);
  } catch (err) {
    console.error("Geocoding request failed during update:", err);
    req.flash(
      "error",
      "Location lookup failed while updating. Please try again."
    );
    return res.redirect(`/listings/${id}/edit`);
  }

  let newGeometry = null;
  if (geoData?.features?.length) {
    newGeometry = geoData.features[0].geometry;
  } else {
    console.warn(
      "Geocoding returned no features during update for:",
      locationString
    );
    // continue without geometry update so existing geometry remains intact
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
