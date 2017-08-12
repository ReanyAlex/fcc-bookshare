const mongoose                = require('mongoose'),
      passportLocalMongoose   = require("passport-local-mongoose");



var TradeSchema = new mongoose.Schema({
  currentOwner: {
    id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  currentOwner_id:String,
  requester:{
    id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  title: String,
  image: String,
  previewLink: String
});


module.exports = mongoose.model("Trade", TradeSchema);
