import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; // file system is used to read, write the file. 
// The Node.js file system module allows you to work with the file system on your computer.
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null;
        // Upload the file to the cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        })
        // File is successfully uploaded.
        // console.log("File is successfully uploaded.", response.url)
        fs.unlinkSync(localfilepath)
        return response
    } catch (error) {
        fs.unlinkSync(localfilepath)
        // remove the locally saved temporary file as the upload operation got failed.
        return null
    }
}

const deleteOnCloudinary = async (url, resource_type) => {
    // Split the URL by '/'
    const parts = url.split('/');

    // Get the second-to-last part which contains the ID
    const idWithExtension = parts[parts.length - 1];

    // Remove the file extension '.jpg' to get the ID only
    const id = idWithExtension.split('.')[0];

    try {
        if (!id) return null;
        const response = await cloudinary.api.delete_resources([id], {"resource_type": resource_type});
        return response
    } catch (error) {
        return null;
    }
}

export {uploadOnCloudinary, deleteOnCloudinary}
