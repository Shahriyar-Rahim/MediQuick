import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import dns from "dns";
import baseUrl from "./utils/getBaseUrl.js";
import connectDB from "./config/db.config.js";
import errorHandler from "./middlewares/errorHandler.js";

import authRouter from "./routes/auth.routes.js";
import medicineRouter from "./routes/medicine.route.js";
import medicineEntryRouter from "./routes/medicineEntry.route.js";
import shopRouter from "./routes/shop.routes.js";
import voteRouter from "./routes/vote.route.js";
import adminRouter from "./routes/admin.route.js";
import uploadRouter from "./routes/upload.route.js";
import dashboardRouter from "./routes/dashboard.route.js";

dns.setServers(['8.8.8.8', '1.1.1.1'])

dotenv.config();

const port = process.env.PORT;
const app = express();

app.use(cors({
    origin: baseUrl(),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/api/auth", authRouter);
app.use("/api/medicines", medicineRouter);
app.use("/api/entries", medicineEntryRouter);
app.use("/api/shops", shopRouter);
app.use("/api/votes", voteRouter);
app.use("/api/admin/accounts", adminRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/admin/dashboard", dashboardRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.use(errorHandler);