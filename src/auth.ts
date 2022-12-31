import { IncomingMessage, ServerResponse } from "http";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { ObjectId } from "mongoose";
//user is the user schema in our database
// const {User} = require('./models/user.js');
import User from "./models/user.js";
import { ADMIN_PERMISSIONS, WAREHOUSE_MANAGER_PERMISSIONS, WAREHOUSE_WORKER_PERMISSIONS } from './const.js';
import { UNAUTHORIZED_ERROR_401 } from "./const.js";

dotenv.config();


// TODO: You need to config SERCRET_KEY in render.com dashboard, under Environment section. (I created a secret file named SECRET_KEY in render.com, not sure if this was the intention).
const secretKey = process.env.SECRET_KEY || 'your_secret_key';


// Verify JWT token
const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, secretKey);
    // Read more here: https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    // Read about the diffrence between jwt.verify and jwt.decode.
  } catch (err) {
    return false;
  }
};

// Middelware for all protected routes. You need to expend it, implement premissions and handle with errors.
export const protectedRout = (req: IncomingMessage, res: ServerResponse) => {
  let authHeader = req.headers["authorization"] as string;

  // authorization header needs to look like that: Bearer <JWT>.
  // So, we just take to <JWT>.
  // You need to validate the header format
  let authHeaderSplitted = authHeader && authHeader.split(" ");
  const token = authHeaderSplitted && authHeaderSplitted[1];
  if (!token) {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "No token.",
      })
    );
    return UNAUTHORIZED_ERROR_401;
  }
  if (authHeaderSplitted.length != 2 || authHeaderSplitted[0] != 'Bearer'){ // TODO: check error codes
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "Invalid authentication header format.",
      })
    );
    return UNAUTHORIZED_ERROR_401;
    ;
  }

  // Verify JWT token
  const user = verifyJWT(token);
  if (!user) {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "Failed to verify JWT.",
      })
    );
    return UNAUTHORIZED_ERROR_401;
  }
  // We are good!
  return user.id;
};

export const updatePrivilegesRoute = (req: IncomingMessage, res: ServerResponse) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    //TODO: find how to authenticate that the user who sent the request is indeed the admin with the allowed permissions for the update.
    const admin_id = protectedRout(req, res);
    if (admin_id === UNAUTHORIZED_ERROR_401)  {
      return;
    }
    const admin = await getUser(admin_id,res);
    if (admin === UNAUTHORIZED_ERROR_401){
      return;
    }
    if (admin.permission !== ADMIN_PERMISSIONS) {
      res.statusCode = 403;
      res.end(
        JSON.stringify({
          message: "Forbidden permission",
        })
      );
      return;
    }
    // Parse request body as JSON
    const credentials = getJSON(body,res);;
    if (!credentials)
      return;
    //validate that the body has the "shape" you are expect: { username: <username>, permission: <P>}
    if (!("username" in credentials && "permission" in credentials)){
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: "Invalid JSON format",
        })
      );
      return;
    }
    // Check if username exists
    const user = await User.findOne({username: credentials.username}); 
    if (!user) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Inexistent username",
        })
      );
      return;
    }
    if (!(credentials.permission == WAREHOUSE_WORKER_PERMISSIONS || credentials.permission == WAREHOUSE_MANAGER_PERMISSIONS)){
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: "Invalid permission input.",
        })
      );
      return;
    }
    user.permission = credentials.permission;
    await user.save();

    res.statusCode = 200; // Successful update!
    res.end();
  });
};

export const loginRoute = (req: IncomingMessage, res: ServerResponse) => {
  // Read request body.
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    const credentials = getJSON(body,res);
    if (!credentials)
      return;
    //validate that the body has the "shape" you are expect: { username: <username>, password: <password>}
    if (!("username" in credentials && "password" in credentials)){
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: "Invalid JSON format",
        })
      );
      return;
    }
    if (credentials.username == '' || credentials.password == ''){
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: "Invalid username or password.",
        })
      );
      return;
    }
    // Check if username and password match
    const user = await User.findOne({username: credentials.username}); 
    if (!user) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Inexistent username",
        })
      );
      return;
    }

    // bcrypt.hash create single string with all the informatin of the password hash and salt.
    // Read more here: https://en.wikipedia.org/wiki/Bcrypt
    // Compare password hash & salt.
    const passwordMatch = await bcrypt.compare(
      credentials.password,
      user.password
    );
    if (!passwordMatch) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid password.",
        })
      );
      return;
    }

    // Create JWT token.
    // This token contain the userId in the data section.
    const token = jwt.sign({ id: user._id }, secretKey, {
      expiresIn: 86400, // expires in 24 hours
    });

    res.statusCode = 200; // Successful login!
    res.end(
      JSON.stringify({
        token: token,
      })
    );
  });
};

export const signupRoute = (req: IncomingMessage, res: ServerResponse) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    const credentials = getJSON(body,res);
    if (!credentials)
      return;
    //validation
    if (!("username" in credentials && "password" in credentials)){
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: "Invalid JSON format",
        })
      );
      return;
    }
    const username = credentials.username;
    const password = await bcrypt.hash(credentials.password, 10);
    if (username == '' || credentials.password == ''){
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: "Invalid username or password.",
        })
      );
      return;
    }
    else if((await User.find({username: username})).length){
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Existing username.",
        })
      );
      return;
    }
    //end of validation

    const user = new User({
      username: username,
      password: password
    });
    await user.save();

    res.statusCode = 201; // Created a new user!
    res.end();
  });
};


export const getJSON = (body: string, res: ServerResponse) => { //TODO: check why body is null
  let cred = null;
  try{
    cred = JSON.parse(body);
  }
  catch{
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        message: "Invalid JSON format",
      })
    );
  }
  return cred;
}

export const getUser = async (id: ObjectId, res: ServerResponse) => {
  const user = await User.findOne({_id: id}); 
  //in case a user gets removed from the database in a mysterious way
  if (!user){ 
    res.statusCode = 401;
    res.write(JSON.stringify({
      message: 'inexistent username'
    }));
    res.end()
    return UNAUTHORIZED_ERROR_401;
  }
  else
    return user;
}