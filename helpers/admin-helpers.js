const db = require("../confiq/connection");
var objectId = require("mongodb").ObjectID;
const moment = require("moment");

module.exports = {
  setOfferBycategoryId: (data) => {
    return new Promise(async (resolve, reject) => {
      let operations;
      var end = moment(data.end).format("L");
      var start = moment(data.start).format("L");
      var offer = data.offer;
      let Allproducts = await db
        .get()
        .collection("product")
        .find({ category: objectId(data.category) })
        .toArray();
      console.log("existing products", Allproducts);
      for (i = 0; i < Allproducts.length; i++) {
        operations =
          Allproducts[i].price - (Allproducts[i].price * offer) / 100;
        db.get()
          .collection("product")
          .updateOne(
            { _id: objectId(Allproducts[i]._id) },
            {
              $set: {
                price: operations,
                oldPrice: Allproducts[i].price,
                offer: offer,
                startDate: start,
                endDate: end,
              },
            }
          );
      }
      db.get()
        .collection("category")
        .updateOne(
          { _id: objectId(data.category) },
          {
            $set: {
              offer: offer,
              startDate: start,
              endDate: end,
            },
          }
        );

      resolve();
    });
  },
  getProductByOffer: () => {
    return new Promise(async (resolve, reject) => {
      let offerProducts = await db.get().collection("product").find().toArray();
      resolve(offerProducts);
    });
  },
  getCategoryByOffer: () => {
    return new Promise(async (resolve, reject) => {
      let offerCategory = await db
        .get()
        .collection("category")
        .find()
        .toArray();
      resolve(offerCategory);
    });
  },
  removeOfferById: (catId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("category")
        .updateOne(
          { _id: objectId(catId) },
          {
            $unset: {
              offer: 1,
              startDate: 1,
              endDate: 1,
            },
          }
        );
      resolve();
    });
  },
  removeOfferByProductId: (id) => {
    return new Promise(async (resolve, reject) => {
      let oldPrice;
      db.get()
        .collection("product")
        .findOne({ _id: objectId(id) })
        .then((product) => {
          console.log("Data", product.oldPrice);
          oldPrice = product.oldPrice;
        });
      console.log("hello");
      db.get()
        .collection("product")
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              price: oldPrice,
            },
            $unset: {
              oldPrice: 1,
              startDate: 1,
              endDate: 1,
              offer: 1,
            },
          }
        );
      resolve();
    });
  },
  addOfferByProductId: (data) => {
    return new Promise((resolve, reject) => {
      var startDate = moment(data.startDate).format("L");
      var endDate = moment(data.endDate).format("L");
      var offer = data.offer;
      var totalPrice
      var oldPrice
      db.get().collection('product').findOne({_id:data.proId}).then((product)=>{
        totalPrice = product.price*(100-offer)/100
        oldPrice = product.price
      })
      db.get()
        .collection("product")
        .updateOne(
          { _id: objectId(data.proId) },
          {
            $set: {
              price: totalPrice,
              oldPrice: oldPrice,
              offer: offer,
              startDate: startDate,
              endDate: endDate,
            },
          }
        );
        resolve()
    });
  },
};
