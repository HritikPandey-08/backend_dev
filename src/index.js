import dotenv from "dotenv";
import connectDB from "./db/index.js";

import { app } from "./app.js";

dotenv.config();

const port = process.env.PORT || 3000;

connectDB().then(()=>{
    app.listen(port,()=>{
        console.log(`Server is runnig on port no. ${port}`)
    })
}).catch(error => console.log(error));