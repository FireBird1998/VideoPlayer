// Importing the mongoose module
import mongoose from "mongoose";

// Importing the database name from constants
import { DB_NAME } from "../constants.js";

// Function to connect to the MongoDB database
const connectDB = async () => {
    try {
        
        // Attempt to connect to the MongoDB database using the URI stored in environment variables
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`); 
        
        // If the connection is successful, log the host name of the database
        console.log(`MONGODB connection Success, DB HOST: ${connectionInstance.connection.host}`);
    }catch(error) {
        // If there is an error during connection, log the error and exit the process with a failure code (1)
        console.log("MONGODB connection Failed ", error);
        process.exit(1);
    }
}

// Export the connectDB function as a module
export default connectDB;
