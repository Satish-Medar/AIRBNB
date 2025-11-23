const List = require("./models/listing");
const Review = require("./models/reviews");
const { listingSchema, reviewSchema } = require("./schema");
const ExpressError = require("./utils/ExpressError");

module.exports = {
  isLoggedIn: (req, res, next) => {
    if (!req.isAuthenticated()) {
      // Only save redirect for GET requests. Do not store POST/DELETE/PUT
      // routes as redirect targets because a redirect performs a GET.
      if (req.method === "GET") {
        req.session.redirectUrl = req.originalUrl;
      }
      req.flash("error", "You must be logged in to do that.");
      return res.redirect("/login");
    }
    next();
  },
};

module.exports.saveRedirectUrl = (req, res, next) => {
  // Prefer redirect stored in session, otherwise default to listings index
  res.locals.redirectUrl = req.session.redirectUrl || "/listings";
  // Clear it after reading so it doesn't persist across future logins
  delete req.session.redirectUrl;
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await List.findById(id);
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that.");
    return res.redirect("/listings");
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  // Build payload that matches the Joi schema: { listing: { ... } }
  let candidate =
    req.body && req.body.listing ? req.body.listing : { ...req.body };
  // Remove helper fields injected by method-override or other middleware
  if (candidate._method) delete candidate._method;
  if (candidate._csrf) delete candidate._csrf;

  // Validate against schema
  let { error } = listingSchema.validate({ listing: candidate });
  if (error) {
    // Build readable error message and log payload for debugging
    const errormsg = error.details.map((el) => el.message).join(", ");
    console.error("validateListing - payload:", candidate, "errors:", errormsg);
    // Provide friendly feedback and redirect to the new listing form
    req.flash("error", "Invalid listing data: " + errormsg);
    // Persist the submitted fields so the user doesn't lose their input
    try {
      if (req.session) req.session.formData = candidate;
    } catch (e) {
      console.warn("Could not persist form data in session", e);
    }
    return res.redirect("/listings/new");
  }
  next();
};

// Validate Review
module.exports.validateReview = (req, res, next) => {
  // Accept either `{ review: { ... } }` or `{ rating: ..., comment: ... }`
  const payload =
    req.body && req.body.review
      ? { review: req.body.review }
      : { review: req.body };
  // Log incoming body for debugging when validation fails
  console.log("validateReview - incoming req.body:", req.body);

  // Coerce rating to number if it's a string (forms send values as strings)
  if (payload && payload.review && typeof payload.review.rating === "string") {
    const parsed = Number(payload.review.rating);
    // If parsed is a valid number, assign it; otherwise leave as-is to trigger validation
    if (!Number.isNaN(parsed)) payload.review.rating = parsed;
  }
  let { error } = reviewSchema.validate(payload);
  if (error) {
    let errormsg = error.details.map((el) => el.message).join(",");
    console.error(
      "validateReview - validation failed. payload:",
      payload,
      "errors:",
      errormsg
    );
    throw new ExpressError(400, errormsg);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
