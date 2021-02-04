const db = require("../confiq/connection");
var objectId = require("mongodb").ObjectID;
const moment = require("moment");


module.exports = {
  setOfferBycategoryId: (data) => {
    return new Promise((resolve, reject) => {
    var expiration = moment(data.end).format("YYYY-MM-DD");
    var current_date = moment().format("YYYY-MM-DD");
    var days = moment(expiration).diff(current_date, 'days');
        
    });
  },
};
