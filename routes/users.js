const { response } = require("express");
var express = require("express");
var router = express.Router();
var user = require("../helpers/user-helpers");
var productHelper = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var axios = require("axios");
var FormData = require("form-data");
const paypal = require("paypal-rest-sdk");
var otpid;
var phone;
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AZeT8PU69pAs5JxZ2Lc-ejNdzBdV9rXm6FJvhwckeLiYRgH0BaU4hWVGx4y1CU5unlnLgD7TqaKHRkUa",
  client_secret:
    "EOAytA7Ig8F4gtSrRb0NUuWWc562MCVysbaxtXd9R4iIJCLsg3RhWNSdblH5FrsJzHGwxGsSAKzYImg7",
});
const moment = require("moment");

moment().format();

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
    res.render("User/register", { user: true });
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
      // req.session.=true
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
    userHelpers.getAddressById(users._id).then((address)=>{
    res.render("User/myaccount", { user: true, users, category, cartCount,address });
    })
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
router.get("/addToCart/:id", isSignedIn, async (req, res) => {
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
      userHelpers
        .getPrice(req.session.user._id, req.body.product)
        .then((singleProTotal) => {
          response.total = result;
          response.singleProTotal = singleProTotal;
          console.log("PROCE", response);
          console.log("CPQ", response);
          res.json(response);
        });
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
      data.append("message", "Your One Time Password code for login is {code}");
      data.append("expiry", "900");

      var config = {
        method: "post",
        url: "https://d7networks.com/api/verifier/send",
        headers: {
          Authorization: "Token 195efabf13094246b70eaa5086d975a4765f8039",
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
      Authorization: "Token 195efabf13094246b70eaa5086d975a4765f8039",
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
router.get("/checkout", isSignedIn, categories, async (req, res) => {
  let users = req.session.user;
  let category = req.session.category;
  let total = 0;
  if (req.session.role == 0) {
    res.render("Admin/index", { admin: true });
  } else {
    await user.getTotalAmount(req.session.user._id).then((result) => {
      total = result;
    });
    if (total) {
      userHelpers.getAddressById(req.session.user._id).then((address)=>{

     
      userHelpers.getCart(req.session.user._id).then(async (data) => {
        let cartPro = data;
        console.log("CART", cartPro);
        cartCount = await userHelpers.getCartCount(users._id);
        res.render("User/checkout", {
          user: true,
          users,
          category,
          cartCount,
          cartPro,
          total,
          address
        });
      });
    })
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
  }
});
router.post("/place-order", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  await user.getTotalAmount(req.session.user._id, products).then((result) => {
    console.log("req.body.total"), result;
    req.body.total = result;
  });
  userHelpers.placeOrder(req.body, products).then((orderId) => {
    req.session.orderId = orderId;
    req.session.total = req.body.total;
    if (req.body.payment == "cash") {
      res.json({
        codSuccess: "COD",
      });
    } else if (req.body.payment === "razorpay") {
      userHelpers.generateRazorpay(orderId, req.body.total).then((response) => {
        response.codSuccess = "razorpay";
        res.json(response);
      });
    } else if (req.body.payment === "paypal") {
      response.codSuccess = "paypal";
      res.json(response);
    }
  });
});

router.get("/order", isSignedIn, categories, async (req, res) => {
  let users = req.session.user;
  let category = req.session.category;
  cartCount = await userHelpers.getCartCount(users._id);
  userHelpers.getOrderDetails(req.session.user._id).then((orders) => {
    res.render("User/order", {
      user: true,
      users,
      category,
      cartCount,
      orders,
    });
  });
});
router.post("/verify-payment", (req, res) => {
  userHelpers
    .verifyPaymentDetails(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: "payment failed" });
    });
});

router.get("/orderSuccess", isSignedIn, categories, async (req, res) => {
  let users = req.session.user;
  let category = req.session.category;
  cartCount = await userHelpers.getCartCount(users._id);
  res.render("User/orderSuccess", {
    user: true,
    users,
    category,
    cartCount,
  });
});
router.get("/cancel", (req, res) => res.send("Payment Failed"));
router.get("/paypalOrder", (req, res) => {
  {
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Red Sox Hat",
                sku: "001",
                price: req.session.total,
                currency: "INR",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "INR",
            total: req.session.total,
          },
          description: "Hat for the best team ever",
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            console.log("LINK");
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  }
});
router.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "INR",
          total: req.session.total,
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (
    error,
    payment
  ) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      res.render("/orderSuccess");
    }
  });
});
router.get(
  "/productBasedCategory/:catId",
  isSignedIn,
  categories,
  async(req, res) => {
    let category = req.session.category;
    let users = req.session.user;
    let catId = req.params.catId;
    if (users) {
      cartCount =await userHelpers.getCartCount(users._id);
      productHelper.getAllProductByCategory(catId).then((product) => {
        res.render("User/product-category", {
          user: true,
          product,
          users,
          cartCount,
          category,
        });
      });
    } else {
      req.session.url = req.originalUrl;
      res.redirect("/login");
    }
  }
);
router.post('/veriefyCoupon',(req,res)=>{
  userHelpers.veriefyCoupon(req.body).then((data)=>{
    console.log("vannu",data);
    res.json(data)
  })
})
module.exports = router;
