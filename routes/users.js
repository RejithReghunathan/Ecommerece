const { response } = require("express");
var express = require("express");
var router = express.Router();
var user = require("../helpers/user-helpers");
var productHelper = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var axios = require("axios");
var FormData = require("form-data");
var otpid;
var phone;

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
  userHelpers
    .userLogin(req.body)
    .then((response) => {
      req.session.isLoggedIn = true;
      req.session.role = response.user.role;
      req.session.user = response.user;
      if (req.session.role == 0) {
        res.json({ user: true, role: true }); //admin
      } else {
        res.json({ block: 2, role: false }); //user
      }
    })
    .catch((response) => {
      res.json(response);
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
  let total;
  if (req.session.role == 0) {
    res.render("Admin/index", { admin: true });
  } else {
    cartCount = await userHelpers.getCartCount(users._id);

    await user.getCart(req.session.user._id).then(async (data) => {
      let cartPro = data;
      console.log("DATA", cartPro);
      if (cartPro[0]) {
        await user.getTotalAmount(req.session.user._id).then((result) => {
          total = result;
        });
        if (total) {
          res.render("User/cart", {
            user: true,
            users,
            category,
            cartPro,
            cartCount,
            totals: total,
            cart: true,
          });
        }
      } else {
        res.render("User/cart", { user: true, users, category });
      }
    });
  }
});
router.get("/addToCart/:id", async (req,res) => {
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
router.post("/change-product-quanity", async (req, res) => {
  let response = {};
  console.log(req.body);
  await userHelpers.changeProductQuantity(req.body).then((response) => {
    userHelpers.getTotalAmount(req.session.user._id).then((result) => {
      response.total = result;
      console.log("CPQ", response);
      res.json(response);
    });
  });
});
router.post("/deleteCartProduct", (req, res) => {
  user.deleteCartProduct(req.body.cartId, req.body.proId).then((response) => {
    res.json(response);
  });
});
router.post("/requestotp", (req, res) => {
  userHelpers
    .numValidate(req.body)
    .then((data) => {
      phone = parseInt(data.phonenum);
      var data = new FormData();
      data.append("mobile", "+91" + phone);
      data.append("sender_id", "SMSINFO");
      data.append("message", "Your otp code for login is {code}");
      data.append("expiry", "900");

      var config = {
        method: "post",
        url: "https://d7networks.com/api/verifier/send",
        headers: {
          Authorization: "Token ffeaeab023b4bbd5c8348a74e33d2d788eeb3a52",
          ...data.getHeaders(),
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          otpid = response.data.otp_id;
        })
        .catch(function (error) {
          console.log(error);
        });
      res.json({ num: true });
    })
    .catch(() => {
      res.json({
        num: false,
      });
    });
});
router.post("/verifyotp", (req, res) => {
  console.log("Verify otp here", req.body);
  var axios = require("axios");
  var FormData = require("form-data");
  var data = new FormData();
  data.append("otp_id", otpid);
  data.append("otp_code", req.body.otp);

  var config = {
    method: "post",
    url: "https://d7networks.com/api/verifier/verify",
    headers: {
      Authorization: "Token ffeaeab023b4bbd5c8348a74e33d2d788eeb3a52",
      ...data.getHeaders(),
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      userHelpers.OtpLog(phone).then((response) => {
        req.session.isLoggedIn = true;
        req.session.role = response.user.role;
        req.session.user = response.user;
        if (req.session.role == 0) {
          res.json({ user: true }); //admin
        } else {
          res.json({ user: true }); //user
        }
      });
    })
    .catch(() => {
      res.send({ user: false });
    })
    .catch(function (error) {
      res.send({ user: false });
    });
});
router.get('/checkout',async(req,res)=>{
  let users = req.session.user;
  let category = req.session.category;
  if (req.session.role == 0) {
    res.render("Admin/index", { admin: true });
  } else {
    cartCount = await userHelpers.getCartCount(users._id);
    res.render("User/checkout", { user: true, users, category, cartCount });
  }
})
module.exports = router;
