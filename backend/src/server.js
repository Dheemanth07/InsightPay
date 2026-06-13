import "./config/env.js";
import app from "./app.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
    logger.info(`Server is running on ${HOST}:${PORT}`);
});
