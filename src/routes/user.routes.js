import { Router } from "express";
import {
  userRegister,
  userLogin,
  userLogout,
} from "../controllers/user.controller.js";
import { upload } from "../Middleware/multer.middleware.js";
import { verifyJWT } from "../Middleware/auth.middleware.js";
import multer from "multer";

//multer middleware
const processForm = multer();
/**
 * By default, if the frontend sends form data with a file, it will be sent as a multipart/form-data request. and when we us our Multer middleware, it will parse the form data and save the file to the specified location.
 * 
 * but if the frontend sends only form data without a file, if need to be parsed as urlencoded form data. So, we need to use the processForm.none() middleware to parse the form data without a file. this comes from the multer package.
 * 
 * we can also send the form data as a JSON object, in that case, we don't need to use any multer middleware. We can directly access the form data from the request body. However to parse json data, we need to use the express.json() middleware.
 */

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userRegister
);

userRouter.route("/login").post(processForm.none(),userLogin);

//secure route
userRouter.route("/logout").post(verifyJWT, userLogout);

export default userRouter;
