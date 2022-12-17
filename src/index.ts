import { createServer, IncomingMessage, ServerResponse } from "http";
import * as mongoose from "mongoose";
import * as dotenv from "dotenv";

// import with .js, and not ts.
// for more info: https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#type-in-package-json-and-new-extensions
import { getExample, mainRoute, createRoute } from "./routes.js";
import { GET_PRODUCT, CREATE_PRODUCT, UPDATE_PRODUCT, REMOVE_PRODUCT, SIGNUP, LOGIN, UPDATE_PRIVILEGES } from "./const.js";
import { createAdmin, loginRoute, signupRoute, updatePrivilegesRoute } from "./auth.js";

// For environment-variables
dotenv.config();

const port = process.env.PORT || 3000;

// Connect to mongoDB
const dbURI = `mongodb+srv://Ido_Kawaz:1JgSDtWby4oHVqv2@cluster.p3lsutu.mongodb.net/?retryWrites=true&w=majority`;
await mongoose.connect(dbURI);

let admin: boolean = false;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (!admin){
    createAdmin();
    admin = true;
  }
  const route = createRoute(req.url, req.method);
  switch (route) {
    //not real GET_PRODUCT implementation, the example they provided. TODO:replace with the required GET_PRODUCT implementation logic.
    case GET_PRODUCT:
      getExample(req, res);
      break;
    case SIGNUP:
      signupRoute(req, res);
      break;
    case LOGIN:
      loginRoute(req, res);
      break;
    case UPDATE_PRIVILEGES:
      updatePrivilegesRoute(req,res);
      break;
    default:
      mainRoute(req, res);
      break;
  }
});

server.listen(port, () => {console.log("Server is running at port " + port);});
