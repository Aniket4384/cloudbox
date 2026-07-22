const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({

    folderName:{
        type:String,
        required:true
    },

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    parentFolder:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Folder",
        default:null
    }

},{
    timestamps:true
});

module.exports = mongoose.model("Folder",folderSchema);