const db = require("../confiq/connection");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectID;
const { response } = require("express");

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
            resolve(response)       
        })
    },
    graphSalesData:()=>{
        return new Promise(async(resolve,reject)=>{
            let graphData = await db.get().collection('order').aggregate([
                {
                    $match:{
                        status:'placed'
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
            console.log("The Data",graphData);
            //ajmal ezhuthiya code start
            // for(i=0;i<2;i++){
            //     console.log('Hid',graphData[i].data.month);
            //     console.log('Hello',graphData[i].data.total);
            // }
            console.log(graphData.length);
           var response={
                date:[],
                total:[]
           }
            for(i=0;i<graphData.length;i++){
                // console.log('graph',graphData[i]._id.month)
                // console.log('graph',graphData[i].total)
                response.date[i]=graphData[i]._id.month
                response.total[i]=graphData[i].total
            }
            //ajmal ezhuthiya code end
            resolve(response)
        })
    }
}