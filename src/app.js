import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import helmet from "helmet";
import sanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({
    path: "../.env",
});

// Get the directory name from the module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
import { logReqRes } from "./middlewares/logger.middleware.js";

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*", // Replace with your specific origin or wildcard '*'
        credentials: true, // Enable credentials (cookies, authorization headers) in cross-origin requests
    })
);

app.use(express.json({ limit: process.env.EXPRESS_JSON_LIMIT }));
app.use(sanitize());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(xss());
app.use(express.urlencoded({ extended: true }));
app.use("/image", express.static(path.join(__dirname, "..", "public/uploads")));
// app.use("/public",express.static("public"))
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logReqRes("log.txt")); // Handle Logfile Here
app.use(
    session({
        secret: process.env.ACCESS_TOKEN_SECRET, // Replace with your secret key
        resave: false,
        saveUninitialized: false,
    })
);

app.get("/", function (req, res) {
    res.redirect("/api/v1/");
});
app.get("/api/v1/", (req, res) => {
    res.status(200).json({
        message: "Welcome to the Node.js server!",
    });
});

// Routing Statrt From Here
import userRouter from "./routes/user.routes.js";
import transportmasterRouter from "./routes/transportmaster.routes.js";
import transportsubcategoryRouter from "./routes/transportsubcategory.routes.js";
import stationmasterRouter from "./routes/stationmaster.routes.js";
import routemasterRouter from "./routes/routemaster.routes.js";
import passengermasterRouter from "./routes/passengermaster.routes.js";
import taxmasterRouter from "./routes/taxmaster.routes.js";
import seatmasterRouter from "./routes/seatmaster.routes.js";
import priceMasterRouter from "./routes/pricemaster.routes.js";
import passMasterRouter from "./routes/passmaster.routes.js";
import vechileMasterRouter from "./routes/vehicle.routes.js";
import kioskMasterRouter from "./routes/kioskmaster.routes.js";
import departmentMasterRouter from "./routes/departmentmaster.routes.js"
app.use(logReqRes("log.txt"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/transportmaster", transportmasterRouter);
app.use("/api/v1/transportsubcategory", transportsubcategoryRouter);
app.use("/api/v1/stationmaster", stationmasterRouter);
app.use("/api/v1/routemaster", routemasterRouter);

//Handling Json Limit Here
app.use("/api/v1/passengermaster", passengermasterRouter);
// app.use("/api/v1/stationmaster", stationmaster);
app.use("/api/v1/taxmaster", taxmasterRouter);
app.use("/api/v1/seatmaster", seatmasterRouter);
app.use("/api/v1/pricemaster", priceMasterRouter);
app.use("/api/v1/passmaster", passMasterRouter);
app.use("/api/v1/vechilemaster", vechileMasterRouter);
app.use("/api/v1/kioskmaster",kioskMasterRouter);
app.use("/api/v1/departmentmaster",departmentMasterRouter);
app.use((err, req, res, next) => {
    if (err.type === "entity.too.large") {
        // Error type for payload too large
        res.status(413).json({
            message: "Payload Too Large. The request size exceeds the limit.",
        });
    } else {
        next(err); // Pass other errors to the general error handler
    }
});

// app.use((err,status, req, res, next) => {
//     if (err) {
//         // Log the error to the console
//         console.error('error detected:', err.message);

//         // You can send a response to the client if needed
//         // throw new ApiError(status, err.message);
//         res.status(status).json({
//             status: 'error',
//             statusCode:status,
//             message: `Find Some error. ==>  ${err.message}`
//         });
//     } else {
//         next();
//     }

// });
app.use("*", (req, res) => {
    res.status(404).send("<h1>404! Page not found</h1>");
});

export { app };
