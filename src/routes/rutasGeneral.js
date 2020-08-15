'use strict'

var express = require("express")
var usuarioController = require("../controllers/funcionesController")
var md_aut = require("../middlewares/authenticated")

var api = express.Router()

api.post('/commands', md_aut.ensureAuth, usuarioController.commands)

module.exports = api;