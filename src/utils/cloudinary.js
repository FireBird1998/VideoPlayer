import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(fs.existsSync(localFilePath)){
            const result = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"});
            // console.log("The result from cloudinary is :-  \n",result);    
            fs.unlinkSync(localFilePath);
            return result;
        }else {
            return null;
        }
    } catch(error){
        fs.unlinkSync(localFilePath);
        console.log("Error in uploading file to cloudinary, this is from  :- ", error);
        return null;
    }
}

export default uploadOnCloudinary;