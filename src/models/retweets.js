'use strict'

var moongose = require("mongoose");
var Schema = moongose.Schema;

var RTweetSchema = Schema({
tweet: String,
comment: String,
nombreUs: String,
user: {type: Schema.ObjectId, ref: 'usuario'},
})

module.exports = moongose.model('retweets', RTweetSchema)  