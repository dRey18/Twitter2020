'use strict'

var jwt = require("jwt-simple")
var moment = require("moment")
var secret = 'clave_secreta_IN6BM'

exports.ensureAuth = function (req, res, next){
    var a = req.body.command;
    var b = a.split(" ");
    var command = b[0] != null && b.length > 0 ? b[0]: "";

    if(!req.headers.authorization){
        if(command === "register"){
            next();
        }else if(command === "login"){
            next();

        }else{
            return res.status(400).send({message:"la peticion no tiene la cabecera de autenticacion"})
        }
    }else{
        var token = req.headers.authorization.replace(/['"]+/g, '')

        try{
            var payload = jwt.decode(token, secret)
            if(payload.exp<= moment().unix()){
            return res.status(401).send({
                message: 'El Token ha expirado'
            })
        }
        }catch(ex){
        return res.status(404).send({
            message: 'El Token no es valido'})
        }
        req.user = payload;
        next();
    }
}   