'use strict'

const mongoose = require("mongoose")
const app = require("./app")

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/twitter', { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
    console.log('Se conecto correctamente a la base de datos');

    app.set('port', process.env.PORT || 3000) 
    app.listen(app.get('port'), ()=>{
        console.log(`EL servidor esta corriendo en el puerto correcto: ${app.get('port')}`);
    })

}).catch(err => console.log(err))
