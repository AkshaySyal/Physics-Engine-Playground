import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  const geminiKey = process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_AI_API_KEY"] ?? "";
  if (!geminiKey) {
    logger.warn("GEMINI_API_KEY / GOOGLE_AI_API_KEY not set — AI classification and image generation will fail");
  } else {
    logger.info("Gemini AI integration available");
  }
});
