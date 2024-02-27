// Importing required modules
import express from "express"; // Importing the Express module
import cors from "cors"; // Importing the CORS module
import cookieParser from "cookie-parser"; // Importing the cookie-parser module
import errorHandler from "./Middleware/errorHandler.middleware.js";

const app = express(); // Creating an instance of the Express application

// Adding middleware

//this middleware will allow the frontend to make requests to the backend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Setting the CORS origin to the value of the environment variable CORS_ORIGIN
    credentials: true, // Allowing credentials to be included in CORS requests
  })
);

//this middleware will parse the request body and attach it to the request object
app.use(
  express.json({
    limit: "64kb", // Setting the maximum request body size to 16kb for JSON requests
  })
);

//this middleware will parse the URL-encoded request body and attach it to the request object
app.use(
  express.urlencoded({
    extended: true, // Allowing the use of nested objects in URL-encoded requests
    limit: "64kb", // Setting the maximum request body size to 16kb for URL-encoded requests
  })
);


app.use(express.static("public")); // Serving static files from the "public" directory

app.use(cookieParser()); // Parsing cookies and attaching them to the request object


//Routes Import and Declaration
import userRouter from "./routes/user.routes.js";

//Routes Declaration
app.use("/api/v1/users", userRouter);


// Custom error handler middleware for handling errors in the application.
app.use(errorHandler);

export { app }; // Exporting the Express application
