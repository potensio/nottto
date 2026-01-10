import app from "./app";

// For local development
const port = process.env.PORT || 3001;
console.log(`🚀 Nottto API running on http://localhost:${port}`);

export default app;
export { app };
