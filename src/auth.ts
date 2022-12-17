import { IncomingMessage, ServerResponse } from "http";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
//user is the user schema in our database
const {User} = require('./models/schema.js');


import { ERROR_401 } from "./const.js";

// TODO: You need to config SERCRET_KEY in render.com dashboard, under Environment section. (I created a secret file named SECRET_KEY in render.com, not sure if this was the intention).
const secretKey = process.env.SECRET_KEY || "your_secret_key";


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
  if (authHeader.split(" ").length != 2 || authHeader.split(" ")[0] != 'Bearer'){
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "Invalid authentication header format.",
      })
    );
    return ERROR_401;
  }
  let authHeaderSplited = authHeader && authHeader.split(" ");
  const token = authHeaderSplited && authHeaderSplited[1];
  if (!token) {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        message: "No token.",
      })
    );
    return ERROR_401;
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
    return ERROR_401;
  }

  // We are good!
  return user;
};

export const createAdmin = async () => {
  const user = new User({
    ID: uuidv4(),
    Username: 'admin',
    Password: 'admin',
    Permission: 'A'
  });
  await user.save();
}

export const updatePrivilegesRoute = (req: IncomingMessage, res: ServerResponse) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    //TODO: find how to authenticate that the user who sent the request is indeed the admin with the allowed permissions for the update.
    let reqHeader = req.headers['user-agent'] as string;

    // Parse request body as JSON
    const credentials = JSON.parse(body);

    //validate that the body has the "shape" you are expect: { username: <username>, permission: <P>}
    if (!("username" in credentials && "permission" in credentials)){
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid JSON format",
        })
      );
      return;
    }
    // Check if username exists
    const user = await User.find({Username: credentials.username}); 
    if (!user) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid username or permission.",
        })
      );
      return;
    }
    if (!(credentials.permission == 'W' && credentials.permission == 'M')){
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid username or permission.",
        })
      );
      return;
    }
    user.Permission = credentials.permission;
    await user.save();

    res.statusCode = 200; // Successful update!
    res.end(
      JSON.stringify({
        token: credentials.username,
      })
    );
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
    const credentials = JSON.parse(body);

    //validate that the body has the "shape" you are expect: { username: <username>, password: <password>}
    if (!("username" in credentials && "password" in credentials)){
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid JSON format",
        })
      );
      return;
    }
    // Check if username and password match
    const user = await User.find({Username: credentials.username}); 
    if (!user) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid username or password.",
        })
      );
      return;
    }

    // bcrypt.hash create single string with all the informatin of the password hash and salt.
    // Read more here: https://en.wikipedia.org/wiki/Bcrypt
    // Compare password hash & salt.
    const passwordMatch = await bcrypt.compare(
      credentials.password,
      user.Password
    );
    if (!passwordMatch) {
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid username or password.",
        })
      );
      return;
    }

    // Create JWT token.
    // This token contain the userId in the data section.
    const token = jwt.sign({ id: user.ID }, secretKey, {
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
    const credentials = JSON.parse(body);
    const username = credentials.username;
    const password = await bcrypt.hash(credentials.password, 10);

    //validation
    if (!("username" in credentials && "password" in credentials)){
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid JSON format",
        })
      );
      return;
    }
    if (username == '' || credentials.password == ''){
      res.statusCode = 401;
      res.end(
        JSON.stringify({
          message: "Invalid username or password.",
        })
      );
      return;
    }
    else if((await User.find({Username: username}))){
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
      ID: uuidv4(),
      Username: username,
      Password: password
    });
    await user.save();

    res.statusCode = 201; // Created a new user!
    res.end(
      JSON.stringify({
        username,
      })
    );
  });
};
