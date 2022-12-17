import { IncomingMessage, ServerResponse } from "http";
import { protectedRout } from "./auth.js";
import { ERROR_401 } from "./const.js";
const {Product} = require('./models/schema.js');

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
  if (user !== ERROR_401) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ data: { ...exampleData }, user: { ...user } })); // build in js function, to convert json to a string
    res.end();
  }
};
