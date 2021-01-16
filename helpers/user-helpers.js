const db = require("../confiq/connection");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectID;

module.exports = {
  userSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      userData.password = await bcrypt.hash(userData.password, 10);
      userData.role = 1;
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
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.status = true;
            response.user = user;
            resolve(response);
          } else {
            reject({ status: false });
          }
        });
      } else {
        reject({ status: false });
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
    let proObj={
      item:objectId(proId),
      quantity:1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection("cart")
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExists=userCart.products.findIndex(product=>product.item==proId)
        if(proExists!=-1){
          db.get().collection('cart')
          .updateOne({user:objectId(userId),'products.item':objectId(proId)},
          {
            $inc:{'products.$.quantity':1}
          }).then(()=>{
            resolve()
          })
        }else{
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
        .collection('cart')
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind:"$products"
          },
          {
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup:{
              from:'product',
              localField:'item',
              foreignField:'_id',
              as:'product'
            }
          },
          {
            $project:{
              item:1,quantity:1,product:{
                $arrayElemAt:['$product',0]
              }
            }
          }
        ])
        .toArray();

      resolve(cartItems);
    });
  },
  getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let count=0
      let cart = await db.get().collection('cart').findOne({user:objectId(userId)})
      if(cart){
        count=cart.products.length
      }
      resolve(count)

    })
  },
  changeProductQuantity:({cart,product,count,quantity})=>{
    count = parseInt(count)
    quantity = parseInt(quantity)
    console.log("COUNT",count);
    return new Promise((resolve,reject)=>{
      if(count==-1&&quantity==1){
        db.get().collection('cart').updateOne({_id:objectId(cart)},
        {
          $pull:{products:{item:objectId(product)}}
        }
        ).then((response)=>{
          resolve({removeProduct:true})
        })
      }
      else{
        console.log("REACHED");
      db.get().collection('cart')
      .updateOne({_id:objectId(cart),'products.item':objectId(product)},
      {
        $inc:{'products.$.quantity':count}
      }).then(()=>{
        resolve({removeProduct:false})
      })
    }
    })
  },
  deleteCartProduct:(userId,prodId)=>{
   return new Promise((resolve,reject)=>{
    db.get().collection('cart').updateOne({_id:objectId(cart)},
    {
      $pull:{products:{item:objectId(product)}}
    }
    ).then((response)=>{
      resolve({removeProduct:true})
    })
   }) 
  }
};
