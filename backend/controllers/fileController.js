const s3 = require("../config/s3");
const crypto = require("crypto")
const {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const File = require("../models/fileModel");
const dotenv = require("dotenv");
dotenv.config();

const uploadUrl = async (req, res) => {
  try {
    const { fileName, type, size,folderId } = req.body;

    const key = `users/${req.user._id}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,

      Key: key,

      ContentType: type,
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    await File.create({
      user: req.user._id,

      fileName,

      s3Key: key,

      size,

      type,
      folderId: folderId
    });

    res.status(200).json({
      uploadUrl: url,

      key: key,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.find({
      user: req.user._id,
    });

    res.status(200).json({
      files,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getFileUrl = async (req, res) => {
  try {
    const { fileId } = req.body;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,

      Key: file.s3Key,
      ResponseContentDisposition: "inline",
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    res.json({
      url,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.body;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,

      Key: file.s3Key,

      // download force karega
      ResponseContentDisposition: `attachment; filename="${file.fileName}"`,
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    console.log(url);

    res.json({
      url,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // find file
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,

      Key: file.s3Key,
    });

    await s3.send(command);

    // delete from MongoDB

    await File.findByIdAndDelete(fileId);

    res.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const multipartUpload = async (req, res) => {
  const{fileName,type,size,folderId} = req.body
  const key = `users/${req.user._id}/${Date.now()}-${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: type,
  });

  const response = await s3.send(command);

  res.json({
    uploadId: response.UploadId,
    key: response.Key,
  });
  await File.create({
      user: req.user._id,

      fileName,

      s3Key: key,

      size,

      type,
      folderId:folderId
    });
};

const getMultiUrl = async (req, res) => {
  const { uploadId, key, partNumber } = req.body; //uploadid-> konsa upload session
  // key-> kha upload karna hai
  //partNuymber-> konsa part upload karna hai

  const command = new UploadPartCommand({
    Bucket: process.env.AWS_BUCKET_NAME,

    Key: key,

    UploadId: uploadId,

    PartNumber: Number(partNumber),
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  res.json({ url });
};

const completeMultipartUpload = async (req,res)=>{

    try{

        const {
            uploadId,
            key,
            parts
        } = req.body;


        const command = new CompleteMultipartUploadCommand({

            Bucket: process.env.AWS_BUCKET_NAME,

            Key:key,

            UploadId:uploadId,

            MultipartUpload:{
                Parts:parts
            }

        });


        const response = await s3.send(command);


        res.status(200).json({

            message:"File uploaded successfully",

            url:response.Location

        });


    }
    catch(error){

        console.log(error);

        res.status(500).json({

            message:"Multipart completion failed"

        });
    }

};

const generateShareLink = async (req, res) => {
  
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      user: req.user.id,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    if (file.shareToken) {
      return res.status(200).json({
        shareLink: `${process.env.CLIENT_URL}/share/${file.shareToken}`,
      });
    }

   
    const token = crypto.randomBytes(32).toString("hex");

    file.shareToken = token;

    await file.save();

    res.status(200).json({
      message: "Share link generated successfully",
      shareLink: `${process.env.CLIENT_URL}/share/${token}`,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const getSharedFile = async (req, res) => {
  try {
    const { token } = req.params;

   
    const file = await File.findOne({
      shareToken: token,
    });

    if (!file) {
      return res.status(404).json({
        message: "Invalid share link",
      });
    }

   
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    const downloadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300, // 5 minutes
    });

    res.status(200).json({
      fileName: file.fileName,
      size: file.size,
      type: file.type,
      downloadUrl,
      expiresIn: 300
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
module.exports = {
  uploadUrl,
  getFiles,
  getFileUrl,
  downloadFile,
  deleteFile,
  multipartUpload,
  getMultiUrl,
  completeMultipartUpload,
   generateShareLink,
    getSharedFile

};
