'use strict'

var moongose = require("mongoose");
var Schema = moongose.Schema;

var TweetSchema = Schema({
    descripcion: String,
    Likes: String, 
    reacciones:[{
        idUs: {type: Schema.ObjectId, ref: 'user'},
        nombreUs: String,
        like: Boolean
    }],
    answers:[{
        idUs: {type: Schema.ObjectId, ref: 'user'},
        nombreUs: String,
        comment: String
    }],
    user:{type: Schema.ObjectId, ref: 'user'},
    nombreUs: String

})

module.exports = moongose.model('tweets', TweetSchema)  