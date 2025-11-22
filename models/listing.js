const mongoose = require("mongoose");
const Review = require("./reviews.js");
const { types } = require("joi");
const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
  },
  image: {
    url: String,
    filename: String,
  },
  price: {
    type: Number,
    min: [1, "Price is too low"],
  },
  location: {
    type: String,
  },
  country: {
    type: String,
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ["Point"], // 'location.type' must be 'Point'
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  // category: {
  //   type: String,
  //   enum: [
  //     "Mountains",
  //     "Arctic",
  //     "Farms",
  //     "Pools",
  //     "Rooms",
  //     "Iconic Cities",
  //     "Castles",
  //     "Camping",
  //   ],
  // },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const List = mongoose.model("List", listingSchema);
module.exports = List;
