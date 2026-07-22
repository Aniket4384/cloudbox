const Folder = require("../models/folderModel");
const File = require("../models/fileModel")

const createFolder = async (req, res) => {
 
  try {

    const { folderName, parentFolderId } = req.body;
    console.log(folderName,parentFolderId)

    if (!folderName) {
      return res.status(400).json({
        message: "Folder name is required",
      });
    }

    const folder = await Folder.create({
      folderName,
      userId: req.user.id,
      parentFolder: parentFolderId || null,
    });

    res.status(201).json({
      message: "Folder created successfully",
      folder,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const getFolders = async (req, res) => {

  try {

    const { parentFolder } = req.query;
    console.log(req.query);
console.log(parentFolder);

    const folders = await Folder.find({
      userId: req.user.id,
      parentFolder: parentFolder || null,
    }).sort({ createdAt: -1 });

    res.json({
      folders,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

const renameFolder = async (req, res) => {

  try {

    const { folderId } = req.params;

    const { folderName } = req.body;
    console.log(folderId,folderName)
    const folder = await Folder.findOneAndUpdate(
      {
        _id: folderId,
        userId: req.user.id,
      },
      {
        folderName,
      },
      {
        returnDocument: "after"
      }
    );

    if (!folder) {

      return res.status(404).json({
        message: "Folder not found",
      });

    }

    res.json({
      message: "Folder renamed successfully",
      folder,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

const deleteFolderRecursively = async (folderId) => {

  // 1. Current folder ki files delete karo
  await File.deleteMany({
    folderId: folderId,
  });

  // 2. Child folders nikalo
  const childFolders = await Folder.find({
    parentFolder: folderId,
  });

  // 3. Har child ko recursively delete karo
  for (const child of childFolders) {
    await deleteFolderRecursively(child._id);
  }

  // 4. Current folder delete karo
  await Folder.findByIdAndDelete(folderId);
};

const deleteFolder = async (req, res) => {
  console.log("called")
  try {
    const { folderId } = req.params;
    console.log(folderId)

    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user.id,
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found",
      });
    }

    await deleteFolderRecursively(folderId);

    res.json({
      message: "Folder and all its contents deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const moveFile = async (req, res) => {
  try {
    const { fileId} = req.params;
    const{folderId} = req.body

    // File exists?
    const file = await File.findOne({
      _id: fileId,
      user: req.user.id,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    if (folderId === null || folderId === "") {
      file.folderId = null;
      await file.save();

      return res.json({
        message: "File moved to My Drive successfully",
      });
    }

  
    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user.id,
    });

    if (!folder) {
      return res.status(404).json({
        message: "Destination folder not found",
      });
    }

   
    file.folderId = folderId;
    await file.save();

    res.json({
      message: "File moved successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
module.exports = {createFolder,getFolders,renameFolder,deleteFolder,moveFile};