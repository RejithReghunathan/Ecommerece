const db = require("../confiq/connection");
var objectId = require("mongodb").ObjectID;
const moment = require("moment");


module.exports = {
  setOfferBycategoryId: (data) => {
    return new Promise(async(resolve, reject) => {
      let operations
    var end = moment(data.end).format('L');
    var start = moment(data.start).format('L')
    var offer = data.offer
    let Allproducts = await db
    .get()
    .collection('product')
    .find({ category: objectId(data.category) })
    .toArray();
  console.log("existing products", Allproducts);
  for (i = 0; i < Allproducts.length; i++) {
    operations =
      Allproducts[i].price -
      (Allproducts[i].price * offer) / 100;
    db.get()
      .collection('product')
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
    .collection('category')
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
  getProductByOffer:()=>{
    return new Promise(async(resolve,reject)=>{
      let offerProducts = await db
      .get()
      .collection("product").find()
      .toArray();
      resolve(offerProducts)
    })
  },
  getCategoryByOffer:()=>{
    return new Promise(async(resolve,reject)=>{
      let offerCategory = await db.get().collection('category').find().toArray()
      resolve(offerCategory)
    })
  },
  removeOfferById:(catId)=>{
    return new Promise(async(resolve,reject)=>{
      await  db.get()
      .collection('category')
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
      resolve()
    })  
  }
};
