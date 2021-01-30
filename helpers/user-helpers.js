const db = require("../confiq/connection");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectID;
const { response } = require("express");
const Razorpay = require('razorpay');
const { resolve } = require("path");
const moment = require('moment') 
const paypal = require('paypal-rest-sdk');

var instance = new Razorpay({
  key_id: 'rzp_test_VQhP9t51w4WZYW',
  key_secret: 'Vc7ocS2CYtfgTGayZs8Hatdk',
});


paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AZeT8PU69pAs5JxZ2Lc-ejNdzBdV9rXm6FJvhwckeLiYRgH0BaU4hWVGx4y1CU5unlnLgD7TqaKHRkUa',
  'client_secret': 'EOAytA7Ig8F4gtSrRb0NUuWWc562MCVysbaxtXd9R4iIJCLsg3RhWNSdblH5FrsJzHGwxGsSAKzYImg7'
});

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
    console.log("ORDER TOTAL",order);
    order.total=parseInt(order.total)
    return new Promise(async(resolve,reject)=>{
      if(order.payment==='cash'){
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
        total:parseInt(order.total),
        userId:objectId(order.userId),
        paymentMethod:order.payment,
        status:status,
        products:products,
        date:moment(new Date()).format('LL')
      }
     await db.get().collection('order').insertOne(orderObj).then((response)=>{
        db.get().collection('cart').removeOne({user:objectId(order.userId)})
        console.log('response on manga2',response.ops[0]);
        resolve(response.ops[0]._id)
        
      }) 
    })
  },
  getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cart = await db.get().collection('cart').findOne({user:objectId(userId)})
      resolve(cart.products)
    })
  },
  getOrderDetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let orderItem = await db.get().collection('order').aggregate([
        {
          $match:{userId:objectId(userId)}
        },
  
        {
          $project:{
              item:'$products.item',
              quantity:'$products.quantity',
              address:'$deliveryAdrress',
              status:'$status',
              total:'$total',
              date:'$date',
              paymentMethod:'$paymentMethod'
          }
      },
      {
          $lookup:{
              from:'product',
              localField:'item',
              foreignField:'_id',
              as:'products'
          }
      },
      {
        $project:{
            item:1,
            quantity:1,
            address:1,
            status:1,
            date:1,
            total:1,
            paymentMethod:1,
            sum: { 
              $sum: { $sum: "$quantity" } 
          },
            product: {
              $arrayElemAt: ["$product", 0],
            },
        }
    },
      ]).toArray()
      console.log(orderItem[0],'ORDER');
      resolve(orderItem)
    })
  },
  generateRazorpay:(orderId,totals)=>{
    return new Promise((resolve,reject)=>{
      var options = {
        amount:parseInt(totals)*100,
        currency:'INR',
        receipt:""+orderId
      };
      instance.orders.create(options,function(err,order){
        console.log(order);
        resolve(order)
      })
    })
  },
  verifyPaymentDetails:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto')
      let hmac = crypto.createHmac('sha256', 'Vc7ocS2CYtfgTGayZs8Hatdk')
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },
  changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection('order').updateOne({_id:objectId(orderId)},
      {
        $set:{
          paymentMethod: 'Razorpay',
          status:'placed'
        }
      }
      ).then(()=>{
        resolve()
      })
    })
  },
  
};
