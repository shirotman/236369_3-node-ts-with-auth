import { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongoose";
import { server } from "typescript";
import { protectedRout, getBody, getJSON } from "./auth.js";
import { BAD_REQUEST_ERROR_400, UNAUTHORIZED_ERROR_401, WAREHOUSE_WORKER_PERMISSIONS } from "./const.js";
// const {Product} = require('./models/schema.js');
import Product from "./models/product.js";
import User from "./models/user.js";

const exampleData = {
  title: "This is a nice example!",
  subtitle: "Good Luck! :)",
};

export const createRoute = (url: string, method: string) => {
  return `${method} ${url}`;
};

export const mainRoute = (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.write("<h1>Hello Yedidi! API:</h1>");
  res.write(`<ul>
      <li>segel info. GET /api/segel</li>
      <li>signin. POST /api/signin</li>
      <li>login. POST /api/login</li>      
  </ul>`);
  res.end();
};

export const getExample = (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user !== UNAUTHORIZED_ERROR_401) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ data: { ...exampleData }, user: { ...user } })); // build in js function, to convert json to a string
    res.end();
  }
};

export const getProduct = async (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;

  const user = protectedRout(req, res);
  if (user !== UNAUTHORIZED_ERROR_401) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ data: { ...exampleData }, user: { ...user } })); // build in js function, to convert json to a string
    res.end();
  }
};

export const createProduct = async (req: IncomingMessage, res: ServerResponse) => {
  const user_id = protectedRout(req, res);
  if (user_id === UNAUTHORIZED_ERROR_401 || user_id === BAD_REQUEST_ERROR_400)  {
    return;
  }
  const user = await getUser(user_id,res);
  if (user === UNAUTHORIZED_ERROR_401){
    return;
  }
  if (user.permission === WAREHOUSE_WORKER_PERMISSIONS) {
    res.statusCode = 403;
    res.end(
      JSON.stringify({
        message: "Forbidden permission",
      })
    );
    return;
  }
  let body = getBody(req);
  req.on("end", async () => {
    // Parse request body as JSON
    const product = getJSON(body,res);
    //validation
    if (!("name" in product && "category" in product && "description" in product && "price" in product && "stock" in product)){
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          message: "Invalid JSON format",
        })
      );
      return;
    }
    //TODO: validate product fields values
    //end of validation

    // const user = new User({
    //   // ID: uuidv4(),
    //   username: username,
    //   password: password
    // });
    // await user.save();
    const new_product =  new Product({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
    });
    if (product.image) {
      new_product.image = product.image;
    }
    
    await new_product.save();

    res.statusCode = 201; // Created a new user!
    res.end();
  });
};
  
export const updateProduct = async (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;

  const user = protectedRout(req, res);
  if (user !== UNAUTHORIZED_ERROR_401) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ data: { ...exampleData }, user: { ...user } })); // build in js function, to convert json to a string
    res.end();
  }
};
  
export const removeProduct = async (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;

  const user = protectedRout(req, res);
  if (user !== UNAUTHORIZED_ERROR_401) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ data: { ...exampleData }, user: { ...user } })); // build in js function, to convert json to a string
    res.end();
  }
};

const getUser = async (id: ObjectId, res: ServerResponse) => {
  const user = await User.findOne({_id: id}); 
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

