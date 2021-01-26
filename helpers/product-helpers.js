const db = require("../confiq/connection");
var objectId =require('mongodb').ObjectID
module.exports = {
    addCategory:(category)=>{
        return new Promise(async(resolve,reject)=>{
           await db.get().collection('category').insertOne(category).then((data)=>{
                if(data){
                resolve(data.ops[0])
                }
            }).catch(()=>{
                reject()
            })
        })
    },
    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category = await db.get().collection('category').find().toArray()
            if(category){
                resolve(category)
            }
            else{
                reject(err)
            }
        })
    },
    categoryExists:(category)=>{
        return new Promise(async(resolve,reject)=>{
            let data = await db.get().collection('category').findOne({name:category.name}).then((data)=>{
                if(data){
                    resolve(data)
                }
                else{
                    reject()
                }
            })
        })
    },
    addProduct:((product,data)=>{
        product.price=parseInt(product.price)
        db.get().collection('product').insertOne(product).then((result)=>{
            data(result.ops[0]._id)
        })
    }),
    getAllProduct:(()=>{
        return new Promise((resolve,reject)=>{
            let data = db.get().collection('product').find().toArray()
            if(data){
                resolve(data)
            }
            else{
                reject()
            }
        })
        
    }),
    getSingleProduct:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection('product').findOne({_id:objectId(proId)}).then((product)=>{
                if(product){
                    resolve(product)
                }
                else{
                    reject()
                }
            })
        })
    },
    deleteCatById:(catId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection('category').removeOne({_id:objectId(catId)}).then(()=>{
                resolve()
            })
        })
    },
    getCategoryById:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('category').findOne({_id:objectId(catId)}).then((data)=>{
                resolve(data)
            })
        })
    },
    UpdateCatById:(data,catId)=>{
        return new Promise(async(resolve,reject)=>{
           await db.get().collection('category').updateOne({_id:objectId(catId)},{
                $set:{
                    name:data.name
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    deleteProdById:(prodId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection('product').removeOne({_id:objectId(prodId)}).then(()=>{
                resolve()
            })
        })
    },
    updateProdById:(data,proId)=>{
        data.price=parseInt(data.price)
        return new Promise((resolve,reject)=>{
            db.get().collection('product').updateOne({_id:objectId(proId)},
                {$set:{
                    name:data.name,
                    brand:data.brand,
                    description:data.description,
                    price:data.price,
                    quanity:data.quanity,
                    category:data.category
                }}).then((response)=>{
                    resolve(response)
                })
        })
    }

}