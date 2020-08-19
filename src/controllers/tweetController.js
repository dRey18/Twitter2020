'use strict'

var Usuario = require("../models/usuario");
var Tweet = require("../models/tweets");
var Retweet = require("../models/retweets");
const { relativeTimeRounding } = require("moment");
const { response } = require("express");
const { restart } = require("nodemon");

function addTweet(req, res){
    var tweetU = new Tweet();
    var params = req.body.command;
    var com = params.split(' ');
    var id = req.user.sub;
    var tweetD = com[1]

    if(com[1]){
        Usuario.findById(id, (err, SaveUs) => {
            if(err) return res.status(404).send({ message: 'Error al encontrar al usuario'})
            if(!SaveUs) return res.status(500).send({ message: 'EL usuario no existe'})
            if(com.length>=3){
                for(let i=2; i<com.length;i++){
                    tweetD = tweetD + " " + com[i]
                }
            }
            tweetU.descripcion = tweetD;
            tweetU.Likes = 0;
            tweetU.Dislikes = 0;
            tweetU.user = id; 
            tweetU.nombreUs = SaveUs.users;
            tweetU.save((err, saveTweet)=>{
                if(err) return res.status(500).send({ message: 'Error al guardar el tweet'})
                if(saveTweet){
                    res.status(200).send({message: "Tweet añadido correctamente"})
                }else{
                    res.status(404).send({message: 'Fallo al registrar tweet'})
                }
            })
        })
    }else{
        res.status(200).send({
            message: 'Complete los datos'})
    }
}

function editTweet(req, res){
    var id = req.user.sub;
    var params = req.body.command; 
    var com = params.split(' ');
    var tweetIdUs = com[1];
    var newTweet = com[2];

    Tweet.findOne({_id: tweetIdUs}, (err, foundTweet)=>{
        if(foundTweet.user != id) return res.status(500).send({message: 'No cuenta con permisos con permisos para editar el tweet'})
        if(com[1] && com[2]){
            if(com.length>=4){
                for(let i=3; i<com.length; i++){
                    newTweet = newTweet + " " + com[i]
                }
            }
            Tweet.findByIdAndUpdate(tweetIdUs, {descripcion: newTweet}, {new:true}, (err, tweetActualizado)=>{
                if(err) return res.status(500).send({message: 'Error en la peticion del tweet'})
                if(!tweetActualizado) return res.status(404).send({message: 'Err al editar tweet'})
                return res.status(200).send({message: "Tweet editado correctamente", tweetActualizado})
            })
        }else{
            return res.status(400).send({message:"Complete los datos"})
        }
    })
}

function deleteTweet(req, res){
    var params = req.body.command; 
    var com = params.split(' ');
    var tweetIdUs = com[1];
    var id = req.user.sub;

    if(com[1]){
        Tweet.findOne({_id: tweetIdUs}, (err, foundTweet)=>{
            if(foundTweet){
                //console.log(foundTweet)
                if(foundTweet.user != id) return res.status(500).send({message: 'Necesita autorizacion para eliminar el tweet'})
                Retweet.find({tweet:tweetIdUs}, (err, foundRetw)=>{
                    if(foundRetw) eliminarRetweet(req, res, tweetIdUs)
                    Tweet.findByIdAndDelete(tweetIdUs, (err, tweetDepurado)=>{
                        if(err) return res.status(500).send({message:'Err en la peticion de tweet'})
                        if(!tweetDepurado) return res.status(404).send({message:'Err al eliminar tweet'})
                        return res.status(200).send({message:'Tweet eliminado correctamente'})
                    })
                })
            }else{
                return res.status(200).send({message: 'El tweet no existe en la DB'});
            }
        })
    }else{
        return res.status(400).send({message:"Complete los datos"})
    }
}

function eliminarRetweet(req, res, tweetIdUs){
    Retweet.deleteMany({tweet:tweetIdUs}).exec();
}

function viewTweets(req, res){ 
    var id = req.user.sub;
    var params = req.body.command; 
    var com = params.split(' ');

    if(com[1]){
        Tweet.findOne({nombreUs: {$regex: com[1], $options: "i"}} , (err, foundTweet)=>{
            if(err) return res.status(500).send({ message: 'error en la peticion de tweets' })
            if(!foundTweet) return res.status(500).send({ message: 'No se ha podido mostrar la lista tqeweet'})
            
            Usuario.findOne({_id: id, 'follow._id': foundTweet.user}, (err, foundUser)=>{
                if(foundUser == null && foundTweet.user != id){
                    return res.status(200).send({Message: "Debe de seguir a este usuario para poder ver sus Tweets"})
                }else{
                    Tweet.aggregate([
                        {$match: {nombreUs: {$regex: com[1], $options: 'i'}}}, {$lookup: {from: 'retweets',
                        localField: "_id", foreignField: "tweet", as: "retweets"}}, {$project:{ reacciones:0, user:0,
                            __v:0, nombreUs:0}}
                        ], (err, saved)=>{
                            return res.status(200).send({tweets: saved})
                        })
                    }
                })
            })
        }else{
        return res.status(400).send({message:"Complete los datos"})
    }
}

function likeTweet(req, res){
    var id = req.user.sub;
    var params = req.body.command;
    var com = params.split(' ');
    var tweetId = com[1];
    
    if(com[1]){
        Tweet.findOne({_id: tweetId}, (err, wantedTweet)=>{
            if(err) return res.status(500).send({message:'Err en la peticion del tweet'})
            if(!wantedTweet) return res.status(404).send({message: 'El tweet no existe'})
            Usuario.findOne({_id: id, 'follow._id': wantedTweet.user}, (err, findedUser)=>{
                console.log(findedUser)
                if(err) res.status(500).send({message: 'Err en la peticion de usuario '})
                if(findedUser == null){
                    if(wantedTweet.user == id) return res.status(200).send({message:'Denegado, no se permite el auto like'})
                    return res.status(200).send({message:'Es necesario seguir al usuario para dar like a sus tweets'})
                }else{
                    for (let i = 0; i<wantedTweet.reacciones.length; i++){
                        if(wantedTweet.reacciones[i].idUs == id)
                        return res.status(200).send({message:'Este tweet ya tiene like'})
                        var x = wantedTweet.reacciones[i].idUs;
                    }

                    if(x != id){
                        console.log()
                        var likeCounter = wantedTweet.like + 1;
                        Tweet.findByIdAndUpdate({_id: tweetId}, {like: likeCounter, $push:{reacciones:{idUs:id,
                        nombreUs: findedUser.user, like:true}}}, {new: true}, (err, likesTweet)=>{
                            if(err) res.status(500).send({message:'Err en la peticion de like tweet'})
                            if(!likesTweet) return res.status(404).send({message:'El tweet no existe'})
                            return res.status(200).send({message:'Se ha registrado el like del tweet'+ likesTweet.nombreUs})
                        })
                    }else{
                        return res.status(200).send({message:'Anteriormente ya le dio like al tweet'})
                    }
                }

            })
        })

    }else{
        return res.status(400).send({message:'Complete los datos'})
    }

}

function disLike(req, res){
    var id = req.user.sub;
    var params = req.body.command; 
    var com = params.split(' ');
    var tweetId = com[1];

    if(com[1]){
        Tweet.findOne({_id: tweetId}, (err, wantedTweet) =>{
            if(err) return res.status(500).send({ message: 'Err en la peticion de tweets' })
            if(!wantedTweet) return res.status(404).send({message: 'El tweet no existe :(('})
            Usuario.findOne({_id: id, 'follow._id': wantedTweet.user}, (err, findedUser)=>{
               if (err) res.status(500).send({ message: 'Err en la peticion de tweets' })
               if(findedUser == null){
                   if(wantedTweet.user == id) return res.status(200).send({Message: 'Denegado, no se permite el auto dislike'})  
                   return res.status(200).send({Message: "Es necesario seguir a este usuario para poder dar dislike a sus Tweets"})  
               }else{
                for(let i = 0; i < wantedTweet.reacciones.length; i++){
                     if(wantedTweet.reacciones[i].idUs == id){
                        var likeCounter = wantedTweet.like - 1;
                        Tweet.findOneAndUpdate({_id: tweetId},{like: likeCounter, $pull:{reacciones:{idUs: id}}}
                            ,{new:true}, (err, dislikeTweet)=>{ 
                                if(err) return res.status(500).send({message: 'Err en la peticion del tweet'})
                                if(!dislikeTweet) return res.status(404).send({message: 'El tweet no existe :(('})
                                return res.status(200).send({message: "Se ha registrado el dislike de tweet" + dislikeTweet.nombreUs})
                            }) 
                     }
                     var x = wantedTweet.reacciones[i].idUs;
                }
                if(x != id) return res.status(200).send({message: "No ha dado like a este tweet"}) 
               }
           })
       })
    }else{
        return res.status(400).send({message:"Complete los datos"})
    }
}

function replyTweet(req, res){
    var id = req.user.sub;
    var params = req.body.command; 
    var com = params.split(' ');
    var tweetId = com[1];
    var comments = com[2];

    if(com[1] && com[2]){
        if(com.length>=3){
            for(let i=3; i<com.length; i++){
                comments = comments + " " + com[i]
            }
        }
        Tweet.findOne({_id: tweetId}, (err, wantedTweet) =>{
            if(err) return res.status(500).send({ message: 'Err en la peticion de tweets' })
            if(!wantedTweet) return res.status(404).send({message: 'El tweet no existe :(('})
            Usuario.findOne({_id: id, 'follow._id': wantedTweet.user}, (err, findedUser)=>{
               if (err) res.status(500).send({ message: 'Err en la peticion de tweets' })
               if(findedUser == null){ 
                   return res.status(200).send({Message: "Es necesario seguir a este usuario para poder responder a sus Tweets"})
               }else{
                Tweet.findOneAndUpdate({_id: tweetId},{$push:{answers:{idUs: id, nombreUs: findedUser.user, comment: comments}}}
                    ,{new:true}, (err, answersTweet)=>{ 
                        if(err) return res.status(500).send({message: 'Err en la peticion del tweet'})
                        if(!answersTweet) return res.status(404).send({message: 'Este tweet no existe :(('})
                        return res.status(200).send({Tweet: answersTweet.descripcion, Conversacion: answersTweet.answers})
                    });
               }
           })
       })
    }else{
        return res.status(400).send({message:"Complete los datos"})
    }
}

function RETWEET(req, res){
    var retweet = new Retweet();
    var params = req.body.command;
    var com = params.split(' ');
    var id = req.user.sub;
    var tweetId = com[1];
    var comments = com[2];

    if(com[1]){
    Tweet.findOne({_id: tweetId}, (err, tweetEncontrado)=>{
        if(err) return res.status(404).send({message:'ERR al buscar tweet'})
        if(!tweetEncontrado) return res.status(500).send({message:'El tweet no existe en la DB'})
        Usuario.findOne({_id: id, 'follow._id': tweetEncontrado.user}, (err, usEncontrado)=>{
            if(err) return res.status(500).send({message:'ERR en la peticion de tweet'})
            if(usEncontrado == null){
            if(tweetEncontrado.user == id) return res.status(200).send({message:'No se puede dar auto retweet'})
            return res.status(200).send({message:'Es necesario seguir al usuario para poder hacer retweet'})
        }
        Retweet.find({tweet: tweetId, user: id}, (err, findedR)=>{
            if(findedR.length>=1){
                Retweet.findOneAndDelete({tweet: tweetId, user: id}, (err, retweetDepurado)=>{
                    if(err) return res.status(500).send({message:'ERR en la peticion de tweet'})
                    if(!retweetDepurado) return res.status(404).send({message:'No se encontro el tweet'})
                    return res.status(200).send({message:'Retweet eliminado:)'})
                })
            }else{
                if(com.length>=3){
                    for(let i =3; i<com.length; i++){
                        comments = comments + " " + com[i]
                    }
                }

                retweet.tweet = tweetEncontrado.descripcion;
                retweet.comment = comments;
                retweet.nombreRe = usEncontrado.user;
                retweet.nombreUs = tweetEncontrado.user;
                retweet.nombreOriginal = tweetEncontrado.nombreUs;
                retweet.user = id;
                retweet.tweet = tweetId;
                Tweet.findOneAndUpdate({_id: tweetId}, {retweet: findedR._id}, {new: true}).exec();
                retweet.save((err, savedRetweet)=>{
                    if(err) return res.status(500).send({message:'ERR el guardar tweet'})
                    if(savedRetweet){
                        res.status(200).send({message:'Congratulation'})
                    }else{
                        res.status(400).send({message:'Fallo al hacer retweet'})
                    }
                })
            }
        })
    })
})
    }else{
        res.status(200).send({message:'Complete los datos'})
    }
}


module.exports = {
    addTweet,
    deleteTweet,
    editTweet,
    viewTweets,
    likeTweet,
    disLike,
    replyTweet,
    RETWEET,
    eliminarRetweet
}