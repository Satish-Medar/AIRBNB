const { render } = require("ejs");
const List = require("../models/listing");

// MapTiler Client (server-side)
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

// Index Controller
module.exports.index = async (req, res) => {
  const listings = await List.find({});
  res.render("listings/index.ejs", { listings, allListings: listings });
};

// Render New Form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/form.ejs");
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
