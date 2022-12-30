import { createServer, IncomingMessage, ServerResponse } from "http";
import * as mongoose from "mongoose";
import * as dotenv from "dotenv";

// import with .js, and not ts.
// for more info: https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#type-in-package-json-and-new-extensions
import { removeProduct, updateProduct, NotFoundRoute, createRoute, createProduct, getProduct } from "./routes.js";
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
      const parameter_arr= route.split("/");
      const parameter = parameter_arr[parameter_arr.length-1];
      if (route.startsWith(GET_PRODUCT)) {
        getProduct(parameter, req, res);
        break;
      }
      if (route.startsWith(UPDATE_PRODUCT)) {

        updateProduct(parameter, req, res);
        break;
      }
      if (route.startsWith(REMOVE_PRODUCT)) {
        removeProduct(parameter, req, res);
        break;
      }
      NotFoundRoute(req, res);
      break;
  }
});

server.listen(port, () => {console.log("Server is running at port " + port);});
