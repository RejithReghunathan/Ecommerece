var express = require("express");
var router = express.Router();
const products = require("../products");


let user = { name: "Rejith", password: "12345" };

router.get("/", function (req, res) {
  let sess =req.session.name
  if (sess) {
    res.render("home", { userName: sess, products });
  } else {
     res.render("index");
  }
});
router.post("/login", (req, res) => {
  if (req.body.uname == user.name && req.body.password == user.password) { 
    req.session.name = req.body.uname;
    res.json({ user: true });
  } else {
    res.json({ user: false});
  }
});

router.get("/login",(req, res) => {
  let sess = req.session.name
  if (sess) {
    res.render("home", { userName: sess, products });
  } else {
    res.render("index");
  }
});



// signout route
router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
