console.log("Worker starting...");

let isRunning = true;

// Simple worker heartbeat (simulates job processing)
setInterval(() => {
    if (isRunning) {
        console.log("Worker running and ready to process jobs");
    }
}, 5000);

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("Worker stopping...");
    isRunning = false;
    process.exit(0);
});
