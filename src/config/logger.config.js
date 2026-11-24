import winston from "winston";
import { config } from "./env.config.js";

// Niveles de registro y colores personalizados.

const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    http: 4,
    debug: 5,
  },
  colors: {
    fatal: "red",
    error: "red",
    warning: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
  },
};

winston.addColors(customLevels.colors);

const basePrintf = winston.format.printf(
  ({ timestamp, level, message, stack }) => {
    const line = `${timestamp} [${level}] ${message}`;
    return stack ? `${line}\n${stack}` : line;
  },
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  basePrintf,
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  basePrintf,
);

// Configuración del nivel de registro.
// Si LOG_LEVEL no está definido, utiliza debug en desarrollo e info en producción.
const defaultLevel = config.nodeEnv === "production" ? "info" : "debug";
const logLevel = process.env.LOG_LEVEL || defaultLevel;

// Comprueba que el nivel configurado exista.
if (!Object.hasOwn(customLevels.levels, logLevel)) {
  throw new Error(`Nivel de log inválido: ${logLevel}`);
}

// Configuración de transportes según el entorno.
const transports = [];

if (config.nodeEnv !== "test") {
  // Archivo que registra errores y niveles más graves.
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
    }),
  );

  // Archivo que registra todos los niveles permitidos.
  transports.push(
    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat,
    }),
  );

  // La consola se utiliza exclusivamente durante el desarrollo.
  if (config.nodeEnv === "development") {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      }),
    );
  }
}

// Creación del logger.
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: logLevel,
  silent: config.nodeEnv === "test",
  transports,
});

export default logger;
