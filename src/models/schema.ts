import { url } from "inspector";
import * as mongoose from "mongoose";
import { idText } from "typescript";

enum Category {
  T_shirt = 'T-shirt',
  Hoodie = 'Hoodie',
  Hat = 'Hat',
  Necklace = 'Necklace',
  Bracelet = 'Bracelet',
  Shoes = 'Shoes',
  Pillow = 'Pillow',
  Mug = 'Mug',
  Book = 'Book',
  Puzzle = 'Puzzle',
  Cards = 'Cards'
};

const productSchema = new mongoose.Schema(
  {
    ID: { type: mongoose.Schema.Types.ObjectId, unique: true, required: true},
    Name: { type: String, required: true },
    Category: {type: Category, required: true},
    Description: {type: String, required: true},
    Price: {type: Number, min: 0, max: 1000, required: true},
    Stock: {type: Number, required: true},
    image: { type: String }
  });

const userSchema = new mongoose.Schema(
  {
    ID: { type: mongoose.Schema.Types.ObjectId, unique: true, required: true},
    Username: {type: String, unique: true, required: true},
    Password: {type:String, required: true},
    Permission: {type: String, required: true, default: 'W'}
  }
);

module.exports ={
  Product: productSchema,
  User: userSchema
}