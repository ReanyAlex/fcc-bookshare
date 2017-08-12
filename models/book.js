const mongoose                = require('mongoose'),
      passportLocalMongoose   = require("passport-local-mongoose");



var BookSchema = new mongoose.Schema({
  title: String,
  image: String,
  previewLink: String,
  user: {
    id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  }
});


module.exports = mongoose.model("Book", BookSchema);
