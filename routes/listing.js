const express = require("express");
const router = express.Router();
const asyncWrap = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const listings = require("../models/listing.js");
const List = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });


router
  .route("/")
  .get(asyncWrap(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    asyncWrap(listingController.createListing)
  );

// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

//search
router.get("/search", isLoggedIn, listingController.renderSearchForm);

// autocomplete for search suggestions
router.get("/autocomplete", listingController.autocomplete);

// category filter
router.get("/filter/:category", asyncWrap(listingController.filterByCategory));

router
  .route("/:id")
  .get(asyncWrap(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    asyncWrap(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, asyncWrap(listingController.deleteListing));

// Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  asyncWrap(listingController.renderEditForm)
);

// autocomplete for search suggestions
router.get("/autocomplete", asyncWrap(listingController.autocomplete)); // FIX: Wrapped handler with asyncWrap

// category filter
router.get("/filter/:category", asyncWrap(listingController.filterByCategory));

module.exports = router;
