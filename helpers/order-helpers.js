const db = require("../confiq/connection");
var objectId = require("mongodb").ObjectID;

const { resolve } = require("path");

module.exports={
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
             let order= await db.get().collection('order').find().toArray()
             resolve(order)
        })
    },
    getDashboardDetails:()=>{
        let response={}
        return new Promise(async(resolve,reject)=>{
            response.allUsers=await db.get().collection('user').find().count()   
            response.totalOrders=await db.get().collection('order').find().count()
            response.totalEarning=await db.get().collection('order').aggregate([
                {
                    $match:{
                        status:'Deliver'
                    }
                },
                {
                    $project:{
                        total:1
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{
                            $sum:"$total"
                        }
                    }
                }
            ]).toArray()
            response.completedOrders= await db.get().collection('order').find({status:'Deliver'}).count()
            response.totalEarning=response.totalEarning[0].total
            resolve(response)       
        })
    },
    graphSalesData:()=>{
        return new Promise(async(resolve,reject)=>{
            let graphData = await db.get().collection('order').aggregate([
                {
                    $match:{
                        status:'Deliver'
                    }
                },
                {
                    $project:{
                        date:1,
                        _id:0,
                        total:1
                    }
                },
                {
                    $group:{
                        _id:{month:"$date"},
                        count:{$sum:1},
                        total:{$sum:"$total"},

                    }
                },
                
                {
                    $project:{
                        _id:1,
                        total:1,
                       
                    }
                },
                
            ]).toArray()
           var response={
                date:[],
                total:[]
           }
            for(i=0;i<graphData.length;i++){
                response.date[i]=graphData[i]._id.month
                response.total[i]=graphData[i].total
            }
            resolve(response)
        })
    },
    changeOrderStatus:(data)=>{
        console.log("data",data);
        return new Promise(async(resolve,reject)=>{
          let result=  await db.get().collection('order').updateOne({_id:objectId(data.id)},
           { $set:{
                status:data.status
            }})
            resolve(result)
        })
    },
    getOrderId:(id)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection('order').findOne({_id:objectId(id)}).then((data)=>{
                if(data){
                    resolve(data)
                }else{
                    reject()
                }
            })
        })
    },
    salesReport:(start,end)=>{
        return new Promise(async(resolve,reject)=>{
            let report =await db.get().collection('order').aggregate([
                {
                    $match:{
                        date:{
                            $gte:start,$lte:end
                        }
                    }
                },
                {
                    $project:{
                        total:1,
                        paymentMethod:1,
                        status:1,
                        date:1,
                        deliveryAdrress:1
                    }
                }
            ]).toArray()
            resolve(report)
        })
    }
}