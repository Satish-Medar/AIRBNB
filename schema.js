const joi = require("joi");

module.exports.listingSchema = joi.object({
  listing: joi
    .object({
      title: joi.string().required(),
      desc: joi.string().min(10).max(1000).required(),
      image: joi.any(), // <<<<< CHANGE THIS
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
