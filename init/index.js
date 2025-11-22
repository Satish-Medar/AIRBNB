const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const initData = require("./data.js");

main()
  .then((res) => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/airbnb");
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data=initData.data.map((obj) => ({
    ...obj,
    owner: "6919805fd031cf3fa4662d20", // Example owner ID
  }));
  await Listing.insertMany(initData.data);
  console.log("Data was Initialized");
};

initDB();
