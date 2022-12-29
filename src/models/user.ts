import { url } from "inspector";
// const mongoose = require('mongoose');
import * as mongoose from "mongoose";

import { idText } from "typescript";
import { WAREHOUSE_WORKER_PERMISSIONS } from '../const.js';

const userSchema = new mongoose.Schema(
  {
    username: {type: String, unique: true, required: true},
    password: {type:String, required: true},
    permission: {type: String, default: WAREHOUSE_WORKER_PERMISSIONS}
  }
);

export default mongoose.model('User', userSchema);
