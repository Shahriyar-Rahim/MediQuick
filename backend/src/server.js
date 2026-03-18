import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import dns from "dns";
import connectDB from "./config/db.config.js";


import authRouter from "./routes/auth.routes.js";
import medicineRouter from "./routes/medicine.route.js";
// import medicineEntryRouter from "./routes/medicineEntry.route.js";
// import shopRouter from "./routes/shop.route.js";
// import voteRouter from "./routes/vote.route.js";
import adminRouter from "./routes/admin.route.js";
// import { connectDB } from "./config/db.config.js";

dns.setServers(['8.8.8.8', '1.1.1.1'])

dotenv.config();

const port = process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/api/auth", authRouter);
app.use("/api/medicine", medicineRouter);
// app.use("/api/medicineEntry", medicineEntryRouter);
// app.use("/api/shop", shopRouter);
// app.use("/api/vote", voteRouter);
app.use("/api/admin", adminRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
