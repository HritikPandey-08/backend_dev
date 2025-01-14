import dotenv from "dotenv";
import connectDB from "./db/index.js";

import { app } from "./app.js";

dotenv.config();

const port = process.env.PORT || 3000;

// Function to handle server shutdown gracefully
const handleShutdown = (server) => {
    process.on("SIGINT", () => {
        server.close(() => {
            console.log("Server shutting down gracefully...");
            process.exit(0);
        });
    });

    process.on("SIGTERM", () => {
        server.close(() => {
            console.log("Server shutting down on SIGTERM...");
            process.exit(0);
        });
    });

    process.on("uncaughtException", (err) => {
        console.error("Uncaught Exception:", err);
        process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
        console.error("Unhandled Rejection:", reason);
        process.exit(1);
    });
};

// Start server and handle database connection
connectDB()
    .then(() => {
        const server = app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        // Attach graceful shutdown handling
        handleShutdown(server);
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
        process.exit(1); // Exit the process to prevent hanging
    });
