import { Router } from "express";
import { userRegister, userLogin, userLogout } from "../controllers/user.controller.js";
import { upload } from "../Middleware/multer.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage", 
            maxCount: 1
        }
    ]),
    userRegister
);

userRouter.route("/login").post(userLogin);
userRouter.route("/logout").post(userLogout);

export default userRouter;