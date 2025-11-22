const User = require("../models/user");

// Signup Form Controller
module.exports.renderSignupForm = (req, res) => {
  res.render("user/signup.ejs");
};

// Login Form Controller
module.exports.renderLoginForm = (req, res) => {
  res.render("user/login.ejs");
};

// User Signup Controller
module.exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Successfully signed up! Please log in.");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

// User Login Controller
module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

// User Logout Controller
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have logged out successfully.");
    res.redirect("/login");
  });
};
