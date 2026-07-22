const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const { uploadUrl, getFiles, getFileUrl, downloadFile, deleteFile, multipartUpload, getMultiUrl, completeMultipartUpload, generateShareLink, getSharedFile } = require("../controllers/fileController");


router.post("/upload-url", authMiddleware, uploadUrl);

router.get("/get-files", authMiddleware, getFiles)

router.post('/view-files', authMiddleware, getFileUrl)
router.post('/download-files', authMiddleware, downloadFile)

router.delete('/delete-file/:fileId', authMiddleware, deleteFile)

router.post('/multipart-start',authMiddleware,multipartUpload)

router.post("/get-multiPart-url", authMiddleware, getMultiUrl)

router.post(
    "/multipart/complete",
    completeMultipartUpload
    
);
router.patch(
    "/share/:fileId",
    authMiddleware,
   generateShareLink
);

router.get("/shared/:token", getSharedFile)



module.exports = router;
