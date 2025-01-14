import { app } from "./app.js";
import connectDB from "./database/dbConnection.js";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name from the module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server
const httpServer = http.createServer(app);

const isSSL = process.env.IS_SSL;

if (isSSL == "true") {
    const filePath = process.env.SSL_SERVER_KEY;
    const filePath1 = process.env.SSL_SERVER_CERT;

    // Load SSL certificates
    // const privateKey = fs.readFileSync(filePath, "utf8");
    // const certificate = fs.readFileSync(filePath1, "utf8");
    const privateKey = fs.readFileSync(process.env.SSL_SERVER_KEY, "utf8");
    const certificate = fs.readFileSync(process.env.SSL_SERVER_CERT, "utf8");
    const credentials = { key: privateKey, cert: certificate };
    // Create HTTPS server
    const httpsServer = https.createServer(credentials, app);

    connectDB()
        .then(() => {
            // Try to start the HTTPS server
            httpsServer.listen(process.env.httpsPORT || 8000, () => {
                console.log(
                    `⚙️  HTTPS Server is running at port : ${process.env.httpsPORT}`
                );
            });

            httpsServer.on("error", (err) => {
                console.error("HTTPS Server failed to start:", err.message);
                console.log("Switching to HTTP Server...");

                // Start HTTP server as a fallback
                httpServer.listen(process.env.httpPORT || 8000, () => {
                    console.log(
                        `⚙️  HTTP Server is running at port : ${process.env.httpPORT}`
                    );
                });
            });

            // If HTTPS server starts successfully, the HTTP server won't start
            // HTTP server is only started if HTTPS fails
        })
        .catch((err) => {
            console.log("MONGO db connection failed !!!", err);
        });
} else {
    connectDB()
        .then(() => {
            // Start HTTP server
            httpServer.listen(process.env.httpPORT || 8000, () => {
                console.log(
                    `⚙️  HTTP Server is running at port : ${process.env.httpPORT}`
                );
            });
        })
        .catch((err) => {
            console.log("MONGO DB connection failed !!!", err);
        });
}
