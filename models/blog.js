var mongoose = require("mongoose");

var blogSchema= new mongoose.Schema({
    title: String,
    img: String,
    body: String,
    date: {type: Date , default: Date.now} 
});

module.exports = mongoose.model("blog",blogSchema);
