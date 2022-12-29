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
    Name: {type: String, required: true},
    Category: {type: Category, required: true},
    Description: {type: String, required: true},
    Price: {type: Number, min: 0, max: 1000, required: true},
    Stock: {type: Number, required: true},
    image: {type: String}
  });

export default mongoose.model('Product', productSchema);

