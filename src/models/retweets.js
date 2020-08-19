'use strict'

var moongose = require("mongoose");
var Schema = moongose.Schema;

var RTweetSchema = Schema({
tweet: String,
comment: String,
nombreRe: String,
nombreUs: String,
nombreOriginal: String,
user: {type: Schema.ObjectId, ref: 'usuario'},
tweet: {type: Schema.ObjectId, ref: 'tweets'}
})

module.exports = moongose.model('retweets', RTweetSchema)  