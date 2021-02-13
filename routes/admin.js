const express = require("express");
var router = express.Router();
var product = require("../helpers/product-helpers");
const orderHelper = require("../helpers/order-helpers");
const userHelper = require("../helpers/user-helpers");
const adminHelper = require('../helpers/admin-helpers')
const { json } = require("express");
const moment = require("moment");
const { order } = require("paypal-rest-sdk");
var voucher_codes = require("voucher-code-generator");
const { localeData } = require("moment");

router.get("/admin", async (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      await orderHelper.getDashboardDetails().then((data) => {
        orderHelper.graphSalesData().then((response) => {
          res.render("Admin/index", { admin: true, data, response });
        });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/dashboard", async (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      await orderHelper.getDashboardDetails().then((data) => {
        orderHelper.graphSalesData().then((response) => {
          res.render("Admin/index", { admin: true, data, response });
        });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/addProduct", (req, res) => {
  product.getAllCategory().then((category) => {
    res.render("Admin/addProduct", { category, admin: true });
  });
});
router.post("/addNewProduct", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.addProduct(req.body, (id) => {
        let image = req.files.Image;
        image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
          if (!err) {
            res.redirect("./addProduct");
          } else {
            console.log("Error in adding Image");
          }
        });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/addCategory", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.getAllCategory().then((category) => {
        res.render("Admin/addCategory", { category, admin: true });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.post("/newCategory", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product
        .categoryExists(req.body)
        .then((data) => {
          res.send({ category: false });
        })
        .catch(() => {
          product.addCategory(req.body).then(() => {
            res.send({ category: true });
          });
        });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.post("/loginadmin", (req, res) => {
  userHelper
    .userLogin(req.body)
    .then((response) => {
      req.session.isLoggedIn = true;
      req.session.role = response.user.role;
      req.session.user = response.user;
      console.log(response.user.role);
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
router.get("/deleteCat/:id", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.deleteCatById(req.params.id).then(() => {
        res.redirect("/addCategory");
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/logoutAdmin", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});
router.get("/editCat/:id", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.getCategoryById(req.params.id).then((category) => {
        res.render("Admin/editCat", { admin: true, category });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.post("/updateCat/:id", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  console.log("Name", req.body);
  if (user) {
    if (role == 0) {
      product
        .categoryExists(req.body)
        .then((data) => {
          res.json({ category: false });
        })
        .catch(() => {
          product.UpdateCatById(req.body, req.params.id).then((response) => {
            res.json({ category: true });
          });
        });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/products", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.getAllProduct().then((product) => {
        res.render("Admin/product", { product, admin: true });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/editProd/:id", (req, res) => {
  console.log("REQ", req.params.id);
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.getAllCategory().then((category) => {
        product.getSingleProduct(req.params.id).then((product) => {
          res.render("Admin/editProd", { product, admin: true, category });
        });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.post("/updateProduct/:id", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role === 0) {
      product.updateProdById(req.body, req.params.id).then((data) => {
        res.redirect("/products");
        if (req.files.Image) {
          let image = req.files.Image;
          image.mv("./public/product-images/" + req.params.id + ".jpg");
        }
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/deleteProd/:id", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.deleteProdById(req.params.id).then(() => {
        res.redirect("/products");
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/block/:id", (req, res) => {
  userHelper.blockUser(req.params.id).then(() => {
    userHelper.getAllUser().then((data) => {
      res.render("Admin/users", { admin: true, data });
    });
  });
});
router.get("/unBlock/:id", (req, res) => {
  userHelper.unBlockUser(req.params.id).then(() => {
    userHelper.getAllUser().then((data) => {
      res.render("Admin/users", { admin: true, data });
    });
  });
});
router.get("/users", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      userHelper.getAllUser().then((data) => {
        res.render("Admin/users", { admin: true, data });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/viewOrders", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      orderHelper.getAllOrders().then((orders) => {
        res.render("Admin/orders", { admin: true, orders });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.post("/changeStatus", (req, res) => {
  orderHelper.changeOrderStatus(req.body).then((response) => {
    orderHelper
      .getOrderId(req.body.id)
      .then((order) => {
        res.json({ order });
      })
      .catch(() => {
        console.log("err");
      });
  });
});
router.get("/viewReport", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      res.render("Admin/viewReport", { admin: true });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.post("/salesReport", (req, res) => {
  console.log(req.body);
  var start = moment(req.body.start).format("L");
  var end = moment(req.body.end).format("L");
  orderHelper.salesReport(start, end).then((response) => {
    console.log(response);
    res.json(response);
  });
});
router.get("/voucherGenerate", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      orderHelper.getCoupon().then((data) => {
        console.log("data", data);
        // res.render("Admin/generateVoucher", { admin: true, data });
      res.render("Admin/voucherManagement", { admin: true,data  });
    });

    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/generateCouponCode", (req, res) => {
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      console.log("CALLED");
      orderHelper.getCoupon().then((data) => {
        console.log("data", data);
        res.render("Admin/generateVoucher", { admin: true, data });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
});
router.get("/generateCoupon", (req, res) => {
  let voucher = voucher_codes.generate({
    length: 8,
    count: 1,
  });
  let voucherCode = voucher[0];
  res.send(voucherCode);
});
router.post("/createCoupon", (req, res) => {
  console.log(req.body, "kjhlk");
  orderHelper.createCoupon(req.body).then((data) => {
    console.log(data);
    res.json(data)
  });
});
router.post('/applyCouponCode',(req,res)=>{
  orderHelper.applyCouponCode(req.body).then((data)=>{
    console.log(data);
    res.send(data)
  })
})
router.get('/offer',(req,res)=>{
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      product.getAllCategory().then((category) => {
        res.render("Admin/offer", { category, admin: true });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
})
router.post('/offerByCategoryId',(req,res)=>{
  console.log("vannthite",req.body);
  adminHelper.setOfferBycategoryId(req.body).then((result)=>{
    res.redirect('offerCategory')
  })
})
router.get('/cancelledOrders',(req,res)=>{
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      orderHelper.getCancelledOrder().then((orders) => {
        res.render("Admin/cancelled-orders", { admin: true, orders });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
})
router.get('/completedOrders',(req,res)=>{
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      orderHelper.getCompletedOrder().then((orders) => {
        res.render("Admin/completed-orders", { admin: true, orders });
      });
    }
  } else {
    res.render("Admin/adminLogin");
  }
})
router.get('/offersByproducts',(req,res)=>{
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      adminHelper.getProductByOffer().then((product)=>{
        res.render('Admin/offersByproducts',{ admin: true,product })
      })
     
    }
  } else {
    res.render("Admin/adminLogin");
  }
})
router.get('/offerCategory',(req,res)=>{
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      adminHelper.getCategoryByOffer().then((category)=>{
        res.render('Admin/offerCategory',{ admin: true,category })
      })
     
    }
  } else {
    res.render("Admin/adminLogin");
  }
})
router.get('/removeOfferById',(req,res)=>{
  console.log("id is here",req.body);
  console.log("id is here",);
  var id=req.query.catId
  adminHelper.removeOfferById(id).then(()=>{
    res.json({result:true})
  })
})
router.get('/AddOffertoCategory/:id',(req,res)=>{
  console.log("id id here",req.params.id);
  let user = req.session.user;
  let role = req.session.role;
  if (user) {
    if (role == 0) {
      console.log("here");
      product.getCategoryById(req.params.id).then((category)=>{
        res.render('Admin/offer',{ category, admin: true })
      })
    }
  } else {
    res.render("Admin/adminLogin");
  }
})
router.get('/removeOfferByProductId',(req,res)=>{
  
})
module.exports = router;
