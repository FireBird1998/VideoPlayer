
import dotenv from 'dotenv';

import connectDB from './DB/index.js';
import { app } from './app.js';

dotenv.config({
    path: './.env'
});


connectDB()
.then( () => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
        
    })
    app.on('error', (error) => {
        console.log("Error occured in express app !! from index.js", error);
        process.exit(1); // Exiting the process with a non-zero exit code to indicate an error occurred.
    });
})
.catch(err => console.log("MONGO db connection failed !! from index.js",err));







