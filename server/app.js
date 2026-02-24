import env from "dotenv"
env.config()

import express from "express";

import connectDB from "./src/utils/db.js";
import cors from 'cors';
import cookieParser from 'cookie-parser'
import morgan from "morgan"
import apiRoutes from "./src/routes/index.js";
import { generalRateLimit } from "./src/middlerwares/rateLimiter.middleware.js";
import http from "http";
import { initSocket } from "./src/sockets/socket.js";
import passport from "./src/utils/passport.js";


const port = process.env.PORT ?? 8000
const corsOptions = {
  origin: [
    "http://localhost:5501",
    "http://localhost:5173",
    process.env.CLIENT_URL,
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};




const app = express();
connectDB();


const server = http.createServer(app);
const io = initSocket(server, corsOptions);
app.set("io", io);

app.use(cors(corsOptions));



app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan("tiny"))


app.use("/api/v1", generalRateLimit, apiRoutes);



app.get("/", (req, res) => {
  res.send("Hello from the Server")
})

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});


server.listen(port, () => console.log(`Server is running on: http://localhost:${port}`));