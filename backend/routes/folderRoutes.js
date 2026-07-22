const express = require("express");
const {createFolder,getFolders, renameFolder, deleteFolder, moveFile} = require("../controllers/folderController");
const authMiddleware = require("../middleware/authMiddleware");

const frouter = express.Router();

frouter.post("/create-folder", authMiddleware, createFolder)
frouter.get("/get-folders",authMiddleware,getFolders)
frouter.put('/rename-folder/:folderId',authMiddleware,renameFolder)
frouter.delete('/delete-folder/:folderId',authMiddleware,deleteFolder)
frouter.patch('/move-file/:fileId',authMiddleware,moveFile)

module.exports = frouter