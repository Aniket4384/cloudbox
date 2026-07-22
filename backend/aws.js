const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dotenv = require("dotenv")

dotenv.config()




// GET OBJECT
const s3Client = new S3Client({
    region: process.env.REGION,
    //iam user ki 
    credentials:{
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY
    }
})


async function getObjectURL(Key){
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
         Key: Key
    })

    const url = await getSignedUrl(s3Client,command)
    return url
}

async function putObject(fileName,contentType){
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
         Key: `/uploads/user-uploads/${fileName}`,
         ContentType: contentType
        
    })

    const url = await getSignedUrl(s3Client,command)
    return url
}

async function main(){
    const url = await getObjectURL('/uploads/user-uploads/image-1782124527752.jpeg')
    console.log(url)

    // console.log(await putObject(`image-${Date.now()}.jpeg`,"image/jpeg"))
}

main()
