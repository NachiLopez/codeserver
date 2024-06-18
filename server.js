import environment from "./src/utils/env.util.js";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import exphbs from "express-handlebars";
import { engine } from "express-handlebars";
import session from 'express-session'

import indexRouter from "./src/routers/index.router.js";
import socketCb from "./src/routers/index.socket.js"
import errorHandler from "./src/middlewares/errorHandler.mid.js";
import pathHandler from "./src/middlewares/pathHandler.mid.js";
import __dirname from "./utils.js";
import { dbConnect } from "./src/utils/dbConnect.js";
import cookieParser from "cookie-parser";
import MongoStore from "connect-mongo";
import argsUtil from "./src/utils/args.util.js";

//http server
const server = express();
const port = environment.PORT || argsUtil.p;
const ready = async () => {
    await dbConnect()
    console.log("server ready on port " + port)
};
const nodeServer = createServer(server)
const socketServer = new Server(nodeServer)
socketServer.on("connection", socketCb);
nodeServer.listen(port, ready);

//template engine
const hbs = exphbs.create({
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    }
  });  
server.engine("handlebars", hbs.engine);
server.set("view engine", "handlebars");
server.set("views", __dirname + "/src/views");

//middlewares
server.use(express.urlencoded({ extended: true }));
server.use(express.static(__dirname + '/public'));

server.use(express.json());
server.use(cookieParser(environment.SECRET_COOKIE))
server.use(morgan("dev"));

server.use(session({
  store: new MongoStore({ mongoUrl: environment.MONGO_DATABASE_URI, ttl: 60*60}),
  secret: environment.SECRET_JWT,
  resave: true,
  saveUninitialized: true,
}))

//endpoints
server.use("/", indexRouter);
server.use(errorHandler);
server.use(pathHandler);

// process.on("exit,", (code)=> {
//   console.log("justo antes de cerrarse");
//   console.log(code);
// })

// process.on("uncaughtException", (exc) => {
//   console.log("Excepction no catcheada");
//   console.log(exc);
// })
// process.on("message", (message)=> {
//   console.log("Cuando reciba mensaje de otro proceso");
//   console.log(message);
// })
// //console()
// process.exit()