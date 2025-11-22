const List = require("../models/listing");
const Review = require("../models/reviews");

// Add Review
module.exports.createReview = async (req, res) => {
  const listing = await List.findById(req.params.id);

  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "Review added successfully!");
  res.redirect(`/listings/${req.params.id}`);
};

// Delete Review
module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  console.log(`DELETE review route hit for listing=${id} review=${reviewId}`);

  const listing = await List.findById(id);
  if (!listing) {
    console.warn(`Listing not found for id=${id}`);
    throw new ExpressError(404, "Listing not found");
  }

  // Remove reference and delete review document in parallel
  await Promise.all([
    List.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }),
    Review.findByIdAndDelete(reviewId),
  ]);

  req.flash("success", "Review deleted successfully!");
  console.log(`Deleted review ${reviewId} for listing ${id}`);
  res.redirect(`/listings/${id}`);
};
