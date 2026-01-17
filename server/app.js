import express from "express";
import env from "dotenv"
import connectDB from "./src/utils/db.js";
import cors from 'cors';
import cookieParser from 'cookie-parser'
import morgan from "morgan"
import apiRoutes from "./src/routes/index.js";

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
env.config()
connectDB(process.env.MONGOD_URI);

app.use(cors(corsOptions));



app.use(express.json());
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(cookieParser());
app.use(morgan("tiny"))


app.use("/api/v1", apiRoutes);



app.get("/",(req,res)=>{
    res.send("Hello from the Server")
})




app.listen(port,()=> console.log(`Server is running on: http://localhost:${port}`));