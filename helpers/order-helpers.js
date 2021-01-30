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
    }
}