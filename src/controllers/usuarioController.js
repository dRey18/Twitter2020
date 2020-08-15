'use strict'

var Usuario = require("../models/usuario")
var bcrypt = require("bcrypt-nodejs");
var jwt = require("../services/jwt");



function addUser(req,res){
    var params = req.body.command; 
    var usuario = new Usuario();
    var com = params.split(' ');
    if(com[1] && com[2]){
        usuario.users = com[1];
        usuario.password = com[2];
        Usuario.find({$or:[
            {users: com[1]},
            {password: com[2]}
        ]}).exec((err, usuarioss)=>{
            if(err) return res.status(500).send({message: 'ERR en la peticion de usuarios'})
            if(usuarioss && usuarioss.length >=1){
                return res.status(500).send({message:'Este usuario ya existe en la base de datos'})
            }else{
                
                bcrypt.hash(com[2], null, null, (err, hash)=>{
                    usuario.password = hash;
                    usuario.save((err, saveUser)=>{
                        if(err) return res.status(500).send({message:'Err al guardar usuario'})
                        if(saveUser){
                            res.status(200).send({usuario: saveUser})
                        }else{
                            res.status(404).send({message:'Fallo al registrar usuario'})
                        }
                    })
                })
            }
        })
    }else{
        res.status(200).send({message:'Complete todos los datos requeridos'
    })
}
}

function loginUser(req, res){
    var a = req.body.command;
    var b = a.split(' ');
    var key = b[3]; 
    Usuario.findOne({users: b[1]}, (err, usuarioss)=>{
        if(err) return res.status(500).send({message: 'ERROR'})
        if(usuarioss){
            bcrypt.compare(b[2], usuarioss.password, (err, check)=>{
                if(check){
                    if(key){
                        return res.status(200).send({ message:"Logueado",
                        token: jwt.createToken(usuarioss)
                    })
                }else{
                    usuarioss.password = undefined;
                    return res.status(200).send({usuarioss})}
                }else{
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'})
                }
            })
        }else{
            return res.status(404).send({message: 'El usuario no se ha podido logear'})
        }
    })
}

function followUs(req, res){
    var params = req.body.command; 
    var com = params.split(' ');
    var id = req.user.sub

    if(com[1]){
        Usuario.findOne({users: {$regex: com[1], $options: "i"}} , (err, searchedProfile)=>{
            if(err) return res.status(500).send({ message: 'error en la peticion del usuario' })
            if(!searchedProfile) return res.status(404).send({ message: 'El usuario no existe :('})
            if(searchedProfile._id == id) return res.status(404).send({ message: 'No puede autoseguirse):'})
            Usuario.findOne({_id: id, 'follow._id': searchedProfile._id}, (err, userEncontrado)=>{
                if( userEncontrado == null){
                    Usuario.findByIdAndUpdate(id, {$push:{follow:{_id: searchedProfile._id, user: searchedProfile.users}}},
                        {new: true}, (err, followUs)=>{
                            console.log(followUs)
                            console.log(searchedProfile)
                            if(err)
                            return res.status(500).send({message:"Error en la peticion de usuario"})
                            if(!followUs){
                                return res.status(404).send({message:"Error al seguir al usuario"})
                            }
                            followersUs(req, searchedProfile._id, followUs.users);
                            return res.status(200).send({message:"Se ha seguido al usuario " + searchedProfile.users})
                        })
                }else{
                    return res.status(200).send({message: 'Ya sigue a este usuario'})
                }
            }) 
        })
    }else{
        res.status(200).send({message: 'Rellene todos los datos necesarios'}) 
    }
}

function followersUs(req, id, name){
    //var id = req.user.sub;
    //var name = req.user.usuario;
    Usuario.findByIdAndUpdate(id, {$push:{followers:{_id: id, user: name}}},{new: true}, (err, followUs)=>{   
        //console.log(usuario) 
    })
}

function unfollowUs(req, res){
    var params = req.body.command; 
    var com = params.split(' ');
    var id = req.user.sub

    if(com[1]){
        Usuario.findOne({users: {$regex: com[1], $options: "i"}} , (err, searchedProfile)=>{
            if(err) return res.status(500).send({ message: 'error en la peticion del usuario' })
            if(!searchedProfile) return res.status(404).send({ message: 'El usuario no existe :('})
            Usuario.findOne({_id: id, 'follow._id': searchedProfile._id}, (err, userEncontrado)=>{
                if( userEncontrado == null){
                    return res.status(303).send({message:"No sigue a este usuario"})
                }else{
                    Usuario.findByIdAndUpdate(id, {$pull:{follow:{_id: searchedProfile._id}}},
                        {new: true}, (err, followUs)=>{
                            //console.log(followUs)
                            console.log(searchedProfile)
                            if(err)
                            return res.status(500).send({message:"Error en la peticion de usuario"})
                            if(!followUs){
                                return res.status(404).send({message:"Error al seguir al usuario"})
                            }
                            unfollow(req, searchedProfile._id);
                            return res.status(200).send({message:"Se ha dejado de seguir al usuario " + searchedProfile.users})
                        })
                }
            }) 
        })
    }else{
        res.status(200).send({message: 'Rellene todos los datos necesarios'}) 
    }
}

function unfollow(req, id){
    Usuario.findByIdAndUpdate(id, {$pull:{followers:{_id: id}}},{new: true}, (err, followUs)=>{   
        //console.log(usuario) 
    })
}

function viewProfile(req, res){
    var params = req.body.command;
    var com = params.split(' ');

    Usuario.findOne({users:{$regex:com[1]}}, (err, tweetsList)=>{
        if(err) return res.status(500).send({message: 'Error en la petición'})
        if(!tweetsList) return res.status(404).send({message: 'No hay tweets para mostrar'})
        return res.status(200).send({tweets: tweetsList})
    })
}



module.exports = {
    addUser,
    loginUser,
    followUs,
    followersUs,
    unfollowUs,
    viewProfile
    
    
}
