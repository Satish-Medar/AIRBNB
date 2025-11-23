const User = require("../models/user");

// ======================
// Render Signup Form
// ======================
module.exports.renderSignupForm = (req, res) => {
  res.render("user/signup.ejs");
};

// ======================
// Render Login Form
// ======================
module.exports.renderLoginForm = (req, res) => {
  res.render("user/login.ejs");
};

// ======================
// User Signup
// ======================
module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    // Automatically log the user in after signup
    req.login(registeredUser, (err) => {
      if (err) return next(err);

      req.flash("success", "Successfully signed up! Welcome!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

// ======================
// User Login
// ======================
module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");

  // Redirect user to the page they were trying to access or default
  const redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

// ======================
// User Logout
// ======================
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.flash("success", "You have logged out successfully.");
    res.redirect("/login");
  });
};
