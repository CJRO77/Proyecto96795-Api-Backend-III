import dotenv from "dotenv";

// En modo test se carga .env.test.
// En los demás entornos se carga .env.
// NODE_ENV=test lo define el script npm test mediante cross-env.

const isTest = process.env.NODE_ENV === "test";

dotenv.config({ path: isTest ? ".env.test" : ".env", quiet: isTest });

// Variables obligatorias.
const requiredVariables = ["PORT", "MONGODB_URI", "NODE_ENV"];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`❌ Falta la variable de entorno obligatoria: ${variable}`);
  }
}

// Validar los entornos permitidos.
const allowedEnvironments = ["development", "test", "production"];

if (!allowedEnvironments.includes(process.env.NODE_ENV)) {
  throw new Error(
    `❌ NODE_ENV inválido. Valores permitidos: ${allowedEnvironments.join(", ")}`,
  );
}

// Validar el puerto.
const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("❌ PORT debe ser un número entero entre 1 y 65535.");
}

// Validar la dirección de MongoDB.
const mongoUri = process.env.MONGODB_URI;

if (
  !mongoUri.startsWith("mongodb://") &&
  !mongoUri.startsWith("mongodb+srv://")
) {
  throw new Error("❌ MONGODB_URI debe ser una dirección válida de MongoDB.");
}

export const config = {
  port,
  mongoUri,
  nodeEnv: process.env.NODE_ENV,
};
