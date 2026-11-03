import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "./env.config.js";

// Niveles de registro y colores personalizados.

const customLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warning: 2,
        info: 3,
        http: 4,
        debug: 5
    },
    colors: {
        fatal: "red",
        error: "red",
        warning: "yellow",
        info: "green",
        http: "magenta",
        debug: "blue"
    }
};

winston.addColors(customLevels.colors);

const basePrintf = winston.format.printf(({ timestamp, level, message, stack }) => {
    const line = `${timestamp} [${level}] ${message}`;
    return stack ? `${line}\n${stack}` : line;
});

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize({ all: true }),
    basePrintf
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    basePrintf
);


// En modo test no se instancia el transporte de archivos: DailyRotateFile crea el
// archivo (y uno de auditoría) apenas se construye, aunque el logger esté silenciado.
const isTest = config.nodeEnv === "test";

const errorFileTransport = isTest ? null : new DailyRotateFile({
    filename: "logs/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxFiles: "15d",
    format: fileFormat
});

const logger = winston.createLogger({
    levels: customLevels.levels,
    level: config.nodeEnv === "production" ? "info" : "debug",
    // Durante los tests el logger se silencia: no ensucia la consola ni crea archivos en logs/.
    silent: isTest,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        ...(errorFileTransport ? [errorFileTransport] : [])
    ]
});

export default logger;