import { url } from "inspector";
// const mongoose = require('mongoose');
import * as mongoose from "mongoose";
import { idText } from "typescript";

enum Category {
  Tshirt = 't-shirt',
  Hoodie = 'hoodie',
  Hat = 'hat',
  Necklace = 'necklace',
  Bracelet = 'bracelet',
  Shoes = 'shoes',
  Pillow = 'pillow',
  Mug = 'mug',
  Book = 'book',
  Puzzle = 'puzzle',
  Cards = 'cards'
};

const productSchema = new mongoose.Schema(
  {
    name: {type: String, required: true},
    category: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, min: 0, max: 1000, required: true},
    stock: {type: Number, required: true},
    image: {type: String}
  });

export default mongoose.model('Product', productSchema);

