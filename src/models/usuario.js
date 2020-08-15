'use strict'

var moongose = require("mongoose")
var Schema = moongose.Schema;

var UserSchema = Schema({
    users: String,
    password: String,

    follow: [{
        user: String
    }],
    followers:[{
        user: String
    }],
})

module.exports = moongose.model('usuario', UserSchema)  