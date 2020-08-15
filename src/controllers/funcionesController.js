'use strict'
//var Usuario = require("../models/usuario")
var user = require("../controllers/usuarioController")
var tweet = require("../controllers/tweetController")

function commands(req, res){
    var params =req.body.command;
    var space = params.split(' ');

    switch(space[0].toLowerCase()){
        case 'register':
            user.addUser(req, res);
        break;
        case 'login':
            user.loginUser(req,res);
        break;
        case 'add_tweet':
            tweet.addTweet(req, res);
        break;
        case 'delete_tweet':
            tweet.deleteTweet(req, res);
        break;
        case 'edit_tweet':
            tweet.editTweet(req, res);
        break;
        case 'view_tweet':
            tweet.viewTweets(req, res);
        break;
        case 'follow':
            user.followUs(req,res);
        break;
        case 'unfollow':
            user.unfollowUs(req, res);
        break;
        case 'profile':
            user.viewProfile(req,res);
        break;
        case 'like_tweet':
            tweet.likeTweet(req, res);
        break;
        case 'dislike_tweet':
            tweet.disLike(req, res);
        break;
        case 'reply_tweet':
            tweet.replyTweet(req, res);
        break;
        case 'retweet_':
            tweet.RETWEET(req, res);
        break;


        default: return res.status(200).send({message:"comando incorrecto"})
    }
}
module.exports={
    commands
}
