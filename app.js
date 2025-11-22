if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const helmet = require("helmet");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listings = require("./routes/listing.js");
const reviews = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");

// --------------------------------------
// View Engine + Middleware Setup
// --------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// // CSP config: allow images and media from same origin and data: URIs
// app.js (Around line 33, update the variables and the helmet block)
const scriptSrcUrls = [
  "'unsafe-inline'",
  "'self'",
  "https://cdn.jsdelivr.net",
  "https://kit.fontawesome.com",
  "https://cdnjs.cloudflare.com", // Added for font-awesome CSS/fonts
  "https://cdn.maptiler.com",
];

const styleSrcUrls = [
  "'self'",
  "'unsafe-inline'",
  "https://kit-free.fontawesome.com",
  "https://cdn.jsdelivr.net",
  "https://fonts.googleapis.com",
  "https://use.fontawesome.com",
  "https://cdn.maptiler.com",
  "https://cdnjs.cloudflare.com", // Added for font-awesome CSS
];

const connectSrcUrls = [
  "'self'",
  "https://api.maptiler.com",
  "https://ka-f.fontawesome.com", // Font Awesome's dedicated asset domain
  "https://cdnjs.cloudflare.com", // Added based on console errors
];

const fontSrcUrls = [
  "'self'",
  "https://fonts.gstatic.com",
  "https://cdn.maptiler.com",
  "https://ka-f.fontawesome.com", 
  "https://cdnjs.cloudflare.com" // <-- ADD THIS LINE
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://images.unsplash.com",
        "https://res.cloudinary.com",
        "https://api.maptiler.com",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
      mediaSrc: ["https://res.cloudinary.com", "data:"],
      childSrc: ["blob:"],
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      const method = req.body._method;
      delete req.body._method;
      return method;
    }
    if (req.query && req.query._method) {
      return req.query._method;
    }
  })
);

// Request logger
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl} | body keys:`,
    Object.keys(req.body || {})
  );
  next();
});

// --------------------------------------
// MongoDB Connection
// --------------------------------------
const dburl = process.env.ATLASDB_URL;
if (!dburl) {
  console.error("FATAL: ATLASDB_URL is not set.");
  process.exit(1);
}

async function main() {
  await mongoose.connect(dburl);
}
main()
  .then(() => console.log("DB connected"))
  .then(() => {
    try {
      // ------------------------------------------------
      // FIXED SESSION STORE (NO crypto.secret)
      // ------------------------------------------------
      const store = MongoStore.create({
        mongoUrl: dburl,
        touchAfter: 24 * 60 * 60, // 24 hours
      });

      store.on("error", (e) => {
        console.log("SESSION STORE ERROR", e);
      });

      const sessionOptions = {
        store,
        secret: process.env.SECRET || "thisshouldbeabettersecret!",
        resave: false,
        saveUninitialized: true, // MUST be true for connect-mongo stability
        cookie: {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        },
      };

      app.use(session(sessionOptions));
      app.use(flash());

      // --------------------------------------
      // Passport Authentication Setup
      // --------------------------------------
      app.use(passport.initialize());
      app.use(passport.session());

      passport.use(new LocalStrategy(User.authenticate()));
      passport.serializeUser(User.serializeUser());
      passport.deserializeUser(User.deserializeUser());

      // Global middleware
      app.use((req, res, next) => {
        res.locals.currentUser = req.user;
        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        next();
      });

      // --------------------------------------
      // Routes
      // --------------------------------------
      app.get("/", (req, res) => {
        res.redirect("/listings");
      });

      app.use("/", userRouter);
      app.use("/listings", listings);
      app.use("/listings/:id/reviews", reviews);

      // --------------------------------------
      // Server Start
      // --------------------------------------
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    } catch (e) {
      console.error("Error setting up session store:", e);
    }
  })
  .catch((err) => console.log(err));
// module.exports = app;
