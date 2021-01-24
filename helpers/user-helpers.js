const db = require("../confiq/connection");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectID;
const { response } = require("express");

module.exports = {
  userSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      userData.password = await bcrypt.hash(userData.password, 10);
      userData.role = 1;
      userData.action = true;
      db.get()
        .collection("user")
        .insertOne(userData)
        .then((response) => {
          response.user = response.ops[0];
          resolve(response);
        });
    });
  },
  userLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let status = false;
      let response = {};
      let user = await db
        .get()
        .collection("user")
        .findOne({ email: userData.email });
      if (user.action) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.status = true;
            response.user = user;
            resolve(response);
          } else {
            response.block=1
            reject(response);
          }
        });
      } else {
        response.block=0
        reject(response);
      }
    });
  },
  emailExist: (userData) => {
    return new Promise(async (resolve, reject) => {
      let email = await db
        .get()
        .collection("user")
        .findOne({ email: userData.email });
      if (email) {
        resolve(email);
      } else {
        reject();
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection("cart")
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExists = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExists != -1) {
          db.get()
            .collection("cart")
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection("cart")
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then(() => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection("cart")
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection("cart")
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
              SingleProTotal: {$multiply:[{$arrayElemAt:["$product.price",0]},"$quantity"]},
            },
          },
        ])
        .toArray();

      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection("cart")
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
 
  changeProductQuantity: ({ cart, product, count, quantity }) => {
    count = parseInt(count);
    quantity = parseInt(quantity);
    console.log("COUNT", count);
    return new Promise((resolve, reject) => {
      if (count == -1 && quantity == 1) {
        db.get()
          .collection("cart")
          .updateOne(
            { _id: objectId(cart) },
            {
              $pull: { products: { item: objectId(product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection("cart")
          .updateOne(
            { _id: objectId(cart), "products.item": objectId(product) },
            {
              $inc: { "products.$.quantity": count },
            }
            
          )
          .then(() => {
            resolve({ removeProduct: false });
          });
      }
    });
  },
  deleteCartProduct: (cartId, prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("cart")
        .updateOne(
          { _id: objectId(cartId) },
          {
            $pull: { products: { item: objectId(prodId) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("user")
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              action: false,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  unBlockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("user")
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              action: true,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  getAllUser: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("user")
        .find({ role: 1 })
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },
  numValidate: (data) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("user")
        .findOne({ phonenum: data.phonenum })
        .then((result) => {
          if (result) {
            resolve(result);
          } else {
            reject();
          }
        });
    });
  },
  OtpLog: (phone) => {
    console.log("MOB", phone);
    var num = phone.toString() 
    return new Promise(async (resolve, reject) => {
      let response = {};
      await db
        .get()
        .collection("user")
        .findOne({ phonenum: num })
        .then((user) => {
          if (user.action) {
              response.user = user;
              resolve(response);
          } else {
            reject();
          }
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection("cart")
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: [
                    "$quantity","$product.price"
                  ],
                },
              },
            },
          },
        ])
        .toArray();
      resolve(total[0].total);
    });
  },
  getPrice:(userId,proId)=>{
    console.log("USER",userId,"PRO",proId);
    return new Promise(async(resolve,reject)=>{
     let SingleTotal= await db
     .get()
     .collection("cart")
     .aggregate([
        {
            $match:
                {
                user:objectId(userId)
                }    
               
        },
        {
             $unwind:"$products"
        },
        {
            $project:{
                item:"$products.item",
                quantity:"$products.quantity"
            }
        },
        {
                    $lookup: {
                      from: "product",
                      localField: "item",
                      foreignField: "_id",
                      as: "product",
                    },
        },
        {
            $match:{
                item:objectId(proId)
            }
        },
        {
          $project:{
            item:1,
               SingleProTotal: {$multiply:[{$arrayElemAt:["$product.price",0]},"$quantity"]}
              
          }
          }
        ]).toArray().then((data)=>{
          
          resolve(data[0].SingleProTotal)
        })          
    })
  },
  placeOrder:(order,products)=>{
    let status
    return new Promise(async(resolve,reject)=>{
      if(order.payment=='cash'){
        status='placed'
      }else{
        status='pending'
      }
      let orderObj={
        deliveryAdrress:{
          fname:order.fname,
          lname:order.lname,
          mobile:order.phone,
          address:order.address,
          city:order.city,
          state:order.state,
          pincode:order.pincode,
          AlternativeNum:order.alphone
        },
        userId:objectId(order.userId),
        paymentMethod:order.payment,
        status:status,
        products:products,
        date:new Date()
      }
     await db.get().collection('order').insertOne(orderObj).then((response)=>{
        db.get().collection('cart').removeOne({user:objectId(order.userId)})
        resolve(response)
      }) 
    })
  },
  getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cart = await db.get().collection('cart').findOne({user:objectId(userId)})
      resolve(cart.products)
    })
  }
};
