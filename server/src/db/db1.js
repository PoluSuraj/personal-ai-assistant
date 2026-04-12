import mongoose from "mongoose";
import { DB_Name } from "../constants.js";
import colors from "colors";

const connectDb = async () => {
    const mongoUrl = process.env.MONGODB_URL;

    if (!mongoUrl || !/^mongodb(\+srv)?:\/\//.test(mongoUrl)) {
        process.env.DEMO_MODE = "true";
        console.log("MongoDB is not configured. Starting backend in local demo mode.".yellow.bold);
        return false;
    }

    try {
        const connection = await mongoose.connect(mongoUrl, { dbName: DB_Name, serverSelectionTimeoutMS: 5000 });
        if (connection) {
            process.env.DEMO_MODE = "false";
            console.log(`MongoDb connection success`.cyan.underline);
        }
        return true;
    } catch (error) {
        process.env.DEMO_MODE = "true";
        console.log(`MongoDB unavailable: ${error.message}. Continuing in local demo mode.`.yellow.bold);
        return false;
    }
};

export default connectDb;
