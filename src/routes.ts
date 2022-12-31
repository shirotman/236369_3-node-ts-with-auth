import { IncomingMessage, ServerResponse } from "http";
import { protectedRout, getJSON, getUser } from "./auth.js";
import { ADMIN_PERMISSIONS, BAD_REQUEST_ERROR_400, NOT_FOUND_ERROR_404, UNAUTHORIZED_ERROR_401, WAREHOUSE_WORKER_PERMISSIONS } from "./const.js";
import Product, {Category} from "./models/product.js";
import { isValidObjectId } from "mongoose";

export const createRoute = (url: string, method: string) => {
  return `${method} ${url}`;
};

export const NotFoundRoute = (req: IncomingMessage, res: ServerResponse) => {
  if (req)   {
    res.statusCode = 404;
    res.write(JSON.stringify({
      message: 'Path not found.'
    }));
    res.end()
    return;}
};

export const getProduct = async (idOrType: string, req: IncomingMessage, res: ServerResponse) => {
  const userId = protectedRout(req, res);
  if (userId === UNAUTHORIZED_ERROR_401) {
    return;
  }
  const user = await getUser(userId,res);
  if (user === UNAUTHORIZED_ERROR_401) {
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    //validation
    if (body != "") {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid input format.",
        })
      );
      return;
    }
    //end of validation
    // Case of 'get by type':
    if ((Object.values(Category)).includes(idOrType as Category)) {
      const productsOfType = await Product.find({category: idOrType});
      // filter out '__v' field to match the requested format
      productsOfType.forEach(product => product.set('__v', undefined, {strict: false}));
      res.statusCode = 200; // returned product
      res.end(JSON.stringify(
        productsOfType));
      return;
    }
    // Case of 'get by type':
    const product = await getProductObject(idOrType, res);
    if (product === NOT_FOUND_ERROR_404)
      return;
    else if (product === BAD_REQUEST_ERROR_400) {
      res.statusCode = 404
      res.end(
        JSON.stringify({
          message: "invalid id.",
        })
      );
      return;
    }
    product.set('__v', undefined, {strict: false});
    res.statusCode = 200; // returned product
    res.end(JSON.stringify(
      product));
  });
};

export const createProduct = async (req: IncomingMessage, res: ServerResponse) => {
  const userId = protectedRout(req, res);
  if (userId === UNAUTHORIZED_ERROR_401)  {
    return;
  }
  const user = await getUser(userId,res);
  if (user === UNAUTHORIZED_ERROR_401) {
    return;
  }
  if (user.permission === WAREHOUSE_WORKER_PERMISSIONS) {
    res.statusCode = 403;
    res.end(
      JSON.stringify({
        message: "Forbidden permission.",
      })
    );
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    const product = getJSON(body,res);
    if (!product)
      return;
    //validation
    let valid : Boolean = validateProduct(product, res);
    if (!valid)
      return;
    //end of validation
    try{
      const newProduct =  new Product({
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        stock: product.stock,
      });
      if (product.image) {
        newProduct.image = product.image;
      }
      await newProduct.save();
      res.statusCode = 201; // Created a new user!
      res.end(JSON.stringify({
        id: newProduct._id
      }));
    }
    catch{
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid input value.",
        })
      );
    }
  });
};
  
export const updateProduct = async (id: string ,req: IncomingMessage, res: ServerResponse) => {
  const userId = protectedRout(req, res);
  if (userId === UNAUTHORIZED_ERROR_401)  {
    return;
  }
  const user = await getUser(userId,res);
  if (user === UNAUTHORIZED_ERROR_401) {
    return;
  }
  else if (user.permission === WAREHOUSE_WORKER_PERMISSIONS) {
    res.statusCode = 403;
    res.end(
      JSON.stringify({
        message: "Forbidden permission.",
      })
    );
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    const product = await getProductObject(id,res);
    if (product === NOT_FOUND_ERROR_404)
      return;
    else if (product === BAD_REQUEST_ERROR_400) {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid id.",
        })
      );
      return;
    }
    // Parse request body as JSON
    const fieldsToUpdate = getJSON(body,res);
    if (!fieldsToUpdate)
      return;
    const jointFields = Object.keys(Product.schema.paths).filter(value => Object.keys(fieldsToUpdate).includes(value));
    // validation of request body
    let illegalInt: boolean = false;
    // verify price and stock are legal
    ["price", "stock"].forEach(att => {
      if (Object.keys(fieldsToUpdate).includes(att) && (typeof fieldsToUpdate[att] === 'string' || !Number.isInteger(fieldsToUpdate[att]))) {
        illegalInt = illegalInt || true;
    }});
    // verify category is legal
    if (Object.keys(fieldsToUpdate).includes('category') && !(fieldsToUpdate['category'] && Object.values(Category).includes(fieldsToUpdate['category']))) {
      illegalInt = illegalInt || true;
    }
    if (illegalInt || !jointFields.length) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        message: "invalid input."
      }))
      return;
    }
    //end of validation
    try{
      jointFields.forEach(att => product.set(att, fieldsToUpdate[att]));
      await product.save();
      res.statusCode = 200; // updated an existing user!
      res.end(JSON.stringify({
        id: product._id
      }));
    }
    catch{
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid input value.",
        })
      );
    }
  });
};
  
export const removeProduct = async (id: string, req: IncomingMessage, res: ServerResponse) => {
  const userId = protectedRout(req, res);
  if (userId === UNAUTHORIZED_ERROR_401) {
    return;
  }
  const user = await getUser(userId,res);
  if (user === UNAUTHORIZED_ERROR_401) {
    return;
  }
  if (user.permission !== ADMIN_PERMISSIONS) {
    res.statusCode = 403;
    res.end(
      JSON.stringify({
        message: "Forbidden permission.",
      })
    );
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    //validation
    if (body != "") {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid input format.",
        })
      );
      return;
    }
    //end of validation
    const product = await getProductObject(id,res);
    if (product === NOT_FOUND_ERROR_404)
      return;
    else if (product === BAD_REQUEST_ERROR_400) {
      res.statusCode = 200;
      res.end();
      return;
    }
    await product.remove(); 
    res.statusCode = 200; // deleted product
    res.end();
  });
}


// Auxilary functions:

const validateProduct = (product, res: ServerResponse) =>{
  let valid: Boolean = true;
  // verify all required fields exist
  if (!("name" in product && "category" in product && "description" in product && "price" in product && "stock" in product)) {
    valid = false;
  }
  const stringAttributes = [product.name, product.description, product.category];
  stringAttributes.forEach(att => {
    valid = valid && (typeof att === 'string' || att instanceof String);
  });
  if (!(valid && (Object.values(Category)).includes(product.category))) {
    valid = false;
  }
  else if ("image" in product && !(typeof product.image === 'string' || product.image instanceof String)) {
    valid = false;
  }
  // verify type and format of price and stock
  else if (!(Number.isInteger(product.price) && typeof product.price !== 'string' &&
             Number.isInteger(product.stock) && typeof product.stock !== 'string')) {
    valid = false;
  }
  if (!valid) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        message: "Invalid format",
      })
    );
  }
  return valid;
}

const getProductObject = async (id, res: ServerResponse) => {
  const isvalidId = isValidObjectId(id);
  let product = null;
  if (isvalidId)
    product = await Product.findOne({_id: id}); 
  else 
    {return BAD_REQUEST_ERROR_400;}
  if (!product) { 
    res.statusCode = 404;
    res.write(JSON.stringify({
      message: "product doesn't exist."
    }));
    res.end()
    return NOT_FOUND_ERROR_404;
  }
  else
    return product;
}
