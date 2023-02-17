const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");




// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port

let server;


const DB_URI = config.mongoose.url;

mongoose.connect(DB_URI)
    .then(()=>{
        console.log('connected to db..');
        app.listen(config.port,()=>{
            console.log(`-------------- Listening on port ${config.port} --------------`);
        });
    })
    .catch((e)=>{
        console.log('db connection failed : ',e);
    })
