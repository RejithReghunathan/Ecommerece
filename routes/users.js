const { response } = require("express");
var express = require("express");
var router = express.Router();
var user = require("../helpers/user-helpers");
var productHelper = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

/* GET users listing. */
const isSignedIn = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    req.session.url = req.originalUrl;
    res.render("User/login", { user: true });
  }
};
const categories = (req, res, next) => {
  productHelper.getAllCategory().then((data) => {
    if (data) {
      req.session.category = data;
      next();
    }
  });
};
router.get("/", async function (req, res) {
  let users = req.session.user;
  let cartCount = null;
  if (req.session.isLoggedIn) {
    if (req.session.role == 0) {
      res.render("Admin/index", { admin: true });
    } else {
      cartCount = await userHelpers.getCartCount(users._id);
      productHelper.getAllCategory().then((category) => {
        productHelper
          .getAllProduct()
          .then((product) => {
            if (cartCount) {
              res.render("User/home", {
                user: true,
                product,
                users,
                category,
                cartCount,
              });
            }
          })
          .catch(() => {
            console.log("No Products found");
          });
      });
    }
  } else {
    productHelper.getAllCategory().then((category) => {
      productHelper
        .getAllProduct()
        .then((product) => {
          res.render("User/home", { user: true, product, category });
        })
        .catch(() => {
          console.log("No Products found");
        });
    });
  }
});
router.get("/signup", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/home");
  } else {
    res.render("user/register", { user: true });
  }
});
router.get("/login", isSignedIn, (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/home");
  } else {
    res.render("user/login", { user: true });
  }
});
router.post("/loginuser", (req, res) => {
  user
    .userLogin(req.body)
    .then((response) => {
      req.session.isLoggedIn = true;
      req.session.role = response.user.role;
      req.session.user = response.user;
      if (req.session.role == 0) {
        res.send({ user: true, role: true }); //admin
      } else {
        res.send({ user: true, role: false }); //user
      }
    })
    .catch((response) => {
      res.send({ user: false });
    });
});
router.post("/register", (req, res) => {
  user
    .emailExist(req.body)
    .then((data) => {
      if (data) {
        res.send({ User: false });
      }
    })
    .catch(() => {
      user
        .userSignup(req.body)
        .then((response) => {
          req.session.isLoggedIn = true;
          req.session.role = response.user.role;
          req.session.user = response.user;
          if (response) {
            res.send({ User: true });
          }
        })
        .catch(() => {
          res.send({ User: false });
        });
    });
});
router.get("/home", isSignedIn, categories, async (req, res) => {
  let users = req.session.user;
  let category = req.session.category;
  if (req.session.role == 0) {
    res.render("Admin/index", { admin: true });
  } else {
    cartCount = await userHelpers.getCartCount(users._id);
    productHelper
      .getAllProduct()
      .then((product) => {
        res.render("User/home", {
          user: true,
          product,
          users,
          category,
          cartCount,
        });
      })
      .catch(() => {
        console.log("No Products found");
      });
  }
});
router.get("/productDetails/:id", async (req, res) => {
  console.log("URL:", req.originalUrl);
  let users = req.session.user;
  let proId = req.params.id;
  if (users) {
    cartCount = await userHelpers.getCartCount(users._id);
    productHelper.getAllCategory().then((category) => {
      productHelper
        .getSingleProduct(proId)
        .then((product) => {
          res.render("User/product-details", {
            user: true,
            product,
            users,
            cartCount,
            category,
          });
        })
        .catch(() => {
          console.log("No Products found");
        });
    });
  } else {
    req.session.url = req.originalUrl;
    res.redirect("/login");
  }
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
router.get("/test", (req, res) => {
  if (req.session.url) {
    res.redirect(req.session.url);
  } else {
    res.redirect("home");
  }
});
router.get("/myaccount", categories, async (req, res) => {
  let users = req.session.user;
  let category = req.session.category;
  if (req.session.role == 0) {
    res.render("Admin/index", { admin: true });
  } else {
    cartCount = await userHelpers.getCartCount(users._id);
    res.render("User/myaccount", { user: true, users, category, cartCount });
  }
});
router.get("/cart", isSignedIn, categories, async (req, res) => {
  let users = req.session.user;
  let category = req.session.category;
  if (req.session.role == 0) {
    res.render("Admin/index", { admin: true });
  } else {
    cartCount = await userHelpers.getCartCount(users._id);
    await user.getCart(req.session.user._id).then((data) => {
      let cartPro = data;
      // console.log("CART",cartPro[0]);
      if (cartPro[0]) {
        res.render("User/cart", {
          user: true,
          users,
          category,
          cartPro,
          cartCount,
          cart: true,
        });
      } else {
        res.render("User/cart", { user: true, users, category });
      }
    });
  }
});
router.get("/addToCart/:id", async (req, res) => {
  let users = req.session.user;
  if (users) {
    await userHelpers.getCartCount(users._id).then((countNum) => {
      userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true, count: countNum });
      });
    });
  } else {
    req.session.url = req.originalUrl;
    res.redirect("/login");
  }
});
router.post("/change-product-quanity", (req, res) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then((response) => {
    res.json(response);
  });
});
router.post("/deleteCartProduct", (req, res) => {
  user.deleteCartProduct(req.body.cartId, req.body.proId).then((response) => {
    res.json(response);
  });
});
module.exports = router;
