// require("dotenv").config({path:"./env"})
import dotenv from "dotenv"
import connectDB from "./db/dbConnect.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is listening at http://localhost:${process.env.PORT}`);
    });
})
.catch((error)=>{
    throw error
})




























// import { Express } from "express";

// const app = Express()

// ;(async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error" , (err) => {
//             console.log("ERROR", err);
//             throw err
//         } )

//         app.listen(process.env.MONGODB_URI, () => {
//             console.log(`App is listening on PORT : ${process.env.MONGODB_URI}`)
//         })
        
        
//     } catch (error) {
//         console.log("Error", error)
//         throw error
//     }
// })()