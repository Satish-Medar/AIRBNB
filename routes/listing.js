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

// Debug route: quick check of how many listing documents exist
router.get(
  "/debug/count",
  asyncWrap(async (req, res) => {
    const cnt = await List.countDocuments();
    res.json({ count: cnt });
  })
);

// Debug route: render the cards partial server-side and return raw HTML
router.get(
  "/debug/html",
  asyncWrap(async function (req, res) {
    const docs = await List.find({}).limit(50);
    const ejs = require("ejs");
    const util = require("util");
    const path = require("path");
    const renderFile = util.promisify(ejs.renderFile);
    const partialPath = path.join(
      __dirname,
      "..",
      "views",
      "listings",
      "_cards.ejs"
    );
    try {
      const html = await renderFile(partialPath, { listings: docs });
      res.type("html").send(html);
    } catch (err) {
      console.error("Debug HTML render error", err);
      return res.status(500).send("Render error: " + err.message);
    }
  })
);

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

module.exports = router;
