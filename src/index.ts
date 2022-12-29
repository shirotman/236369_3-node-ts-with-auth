import { createServer, IncomingMessage, ServerResponse } from "http";
import * as mongoose from "mongoose";
// const mongoose = require('mongoose');
import * as dotenv from "dotenv";

// import with .js, and not ts.
// for more info: https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#type-in-package-json-and-new-extensions
import { removeProduct, updateProduct, mainRoute, createRoute, createProduct, getProduct } from "./routes.js";
import { GET_PRODUCT, CREATE_PRODUCT, UPDATE_PRODUCT, REMOVE_PRODUCT, SIGNUP, LOGIN, UPDATE_PRIVILEGES } from "./const.js";
import { loginRoute, signupRoute, updatePrivilegesRoute } from "./auth.js";

// For environment-variables
dotenv.config();

const port = process.env.PORT || 3000;

// Connect to mongoDB
const dbURI = `mongodb+srv://Ido_Kawaz:${process.env.DBPASS}@cluster.p3lsutu.mongodb.net/?retryWrites=true&w=majority`;
await mongoose.connect(dbURI);

let admin: boolean = false;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const route = createRoute(req.url, req.method);
  switch (route) {
    case SIGNUP:
      signupRoute(req, res);
      break;
    case LOGIN:
      loginRoute(req, res);
      break;
    case UPDATE_PRIVILEGES:
      updatePrivilegesRoute(req,res);
      break;
    case CREATE_PRODUCT:
      createProduct(req, res);
      break;
    default:
      if (route.startsWith(GET_PRODUCT)) {
        getProduct(req, res);
        break;
      }
      if (route.startsWith(UPDATE_PRODUCT)) {
        updateProduct(req, res);
        break;
      }
      if (route.startsWith(REMOVE_PRODUCT)) {
        removeProduct(req, res);
        break;
      }
      mainRoute(req, res);
      break;
  }
});

server.listen(port, () => {console.log("Server is running at port " + port);});
