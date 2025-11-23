const joi = require("joi");
module.exports.listingSchema = joi.object({
  listing: joi
    .object({
      title: joi.string().required(),
      desc: joi.string().min(10).max(1000).required(),
      image: joi.object({
        filename: joi.string().allow(null, ""),
        url: joi.string().allow(null, ""),
      }),
      price: joi.number().min(0).required(),
      location: joi.string().required(),
      country: joi.string().required(),
      category: joi
        .string()
        .valid(
          "Rooms",
          "Iconic Cities",
          "Mountains",
          "Castles",
          "Arctic",
          "Camping",
          "Farms",
          "Pools",
          "Domes",
          "Boats",
          "Trending"
        )
        .required(),
    })
    .required(),
});

module.exports.reviewSchema = joi.object({
  review: joi
    .object({
      rating: joi.number().min(1).max(5).required(),
      comment: joi.string().min(10).max(500).required(),
    })
    .required(),
});
