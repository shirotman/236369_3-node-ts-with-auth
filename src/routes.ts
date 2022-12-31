import { IncomingMessage, ServerResponse } from "http";
import { protectedRout, getJSON, getUser } from "./auth.js";
import { ADMIN_PERMISSIONS, BAD_REQUEST_ERROR_400, NOT_FOUND_ERROR_404, UNAUTHORIZED_ERROR_401, WAREHOUSE_WORKER_PERMISSIONS } from "./const.js";
import Product, {Category} from "./models/product.js";
import { isValidObjectId } from "mongoose";

export const createRoute = (url: string, method: string) => {
  return `${method} ${url}`;
};

export const NotFoundRoute = (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 404;
    res.write(JSON.stringify({
      message: 'Path not found'
    }));
    res.end()
    return;
};

export const getProduct = async (id_or_type: string, req: IncomingMessage, res: ServerResponse) => {
  const user_id = protectedRout(req, res);
  if (user_id === UNAUTHORIZED_ERROR_401)  {
    return;
  }
  const user = await getUser(user_id,res);
  if (user === UNAUTHORIZED_ERROR_401){
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    //validation
    if (body != ""){
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid input format",
        })
      );
      return;
    }
    //end of validation
    if ((Object.values(Category)).includes(id_or_type as Category)){
      const type_products = await Product.find({category: id_or_type});
      type_products.forEach(product => product.set('__v', undefined, {strict: false} ));
      res.statusCode = 200; // returned product
      res.end(JSON.stringify(
        type_products));
      return;
    }
    const product = await getProductObject(id_or_type,res);
    if (product  === NOT_FOUND_ERROR_404)
      return;
    else if (product === BAD_REQUEST_ERROR_400){
      res.statusCode = 404
      res.end(
        JSON.stringify({
          message: "invalid id",
        })
      );
      return;
    }
    product.set('__v', undefined, {strict: false} );
    res.statusCode = 200; // returned product
    res.end(JSON.stringify(
      product));
  });
};

export const createProduct = async (req: IncomingMessage, res: ServerResponse) => {
  const user_id = protectedRout(req, res);
  if (user_id === UNAUTHORIZED_ERROR_401)  {
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
    //TODO: validate product fields values
    //end of validation
    try{
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
      res.end(JSON.stringify({
        id: new_product._id
      }));
    }
    catch{
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid input value",
        })
      );
    }
  });
};
  
export const updateProduct = async (id: string ,req: IncomingMessage, res: ServerResponse) => {
  const user_id = protectedRout(req, res);
  if (user_id === UNAUTHORIZED_ERROR_401)  {
    return;
  }
  const user = await getUser(user_id,res);
  if (user === UNAUTHORIZED_ERROR_401){
    return;
  }
  else if (user.permission === WAREHOUSE_WORKER_PERMISSIONS){
    res.statusCode = 403;
    res.end(
      JSON.stringify({
        message: "Forbidden permission",
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
    if (product  === NOT_FOUND_ERROR_404)
      return;
    else if (product === BAD_REQUEST_ERROR_400){
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid id",
        })
      );
      return;
    }
    // Parse request body as JSON
    const fields_to_update = getJSON(body,res);
    if (!fields_to_update)
      return;
    const joint_fields = Object.keys(Product.schema.paths).filter(value => Object.keys(fields_to_update).includes(value));
    //validation
    let illegalInt: boolean = false;
    ["price", "stock"].forEach(att => {
      if (Object.keys(fields_to_update).includes(att) && (typeof fields_to_update[att] === 'string' || !Number.isInteger(fields_to_update[att]))) {
        illegalInt = illegalInt || true;
    }});
    if (Object.keys(fields_to_update).includes('category') && !(fields_to_update['category'] && Object.values(Category).includes(fields_to_update['category']))) {
      illegalInt = illegalInt || true;
    }
    if (!joint_fields.length || illegalInt){
      res.statusCode = 400;
      res.end(JSON.stringify({
        message: "invalid input"
      }))
      return;
    }
    //end of validation
    try{
      joint_fields.forEach(att => product.set(att, fields_to_update[att]));
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
          message: "Invalid input value",
        })
      );
    }
  });
};
  
export const removeProduct = async (id: string, req: IncomingMessage, res: ServerResponse) => {
  const user_id = protectedRout(req, res);
  if (user_id === UNAUTHORIZED_ERROR_401)  {
    return;
  }
  const user = await getUser(user_id,res);
  if (user === UNAUTHORIZED_ERROR_401){
    return;
  }
  if (user.permission !== ADMIN_PERMISSIONS) {
    res.statusCode = 403;
    res.end(
      JSON.stringify({
        message: "Forbidden permission",
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
    if (body != ""){
      res.statusCode = 400
      res.end(
        JSON.stringify({
          message: "Invalid input format",
        })
      );
      return;
    }
    //end of validation
    const product = await getProductObject(id,res);
    if (product  === NOT_FOUND_ERROR_404)
      return;
    else if (product === BAD_REQUEST_ERROR_400){
      res.statusCode = 200;
      res.end();
      return;
    }
    await product.remove(); 
    res.statusCode = 200; // deleted product
    res.end();
  });
}

const validateProduct = (product, res: ServerResponse) =>{
  let valid: Boolean = true;
  if (!("name" in product && "category" in product && "description" in product && "price" in product && "stock" in product)){
    valid = false;
  }
  const stringAttributes = [product.name, product.description, product.category];
  stringAttributes.forEach(att => {
    valid = valid && (typeof att === 'string' || att instanceof String);
  });
  if (!(valid && (Object.values(Category)).includes(product.category))) {
    valid = false;
  }
  else if ("image" in product && !(typeof product.image === 'string' || product.image instanceof String)){
    valid = false;
  }
  else if (!(Number.isInteger(product.price) && typeof product.price !== 'string' &&
             Number.isInteger(product.stock) && typeof product.stock !== 'string')){
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
  if (!product){ 
    res.statusCode = 404;
    res.write(JSON.stringify({
      message: 'Inexistent product'
    }));
    res.end()
    return NOT_FOUND_ERROR_404;
  }
  else
    return product;
}
