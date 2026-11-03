import dotenv from "dotenv";

// En modo test se carga .env.test (otra base de datos, otras variables).
// En cualquier otro modo se carga .env, como siempre.
// NODE_ENV=test lo define el script "npm test" (con cross-env).

const isTest = process.env.NODE_ENV === "test";

dotenv.config({ path: isTest ? ".env.test" : ".env", quiet: isTest });

const requiredVariables = [
    "PORT",
    "MONGODB_URI",
    "NODE_ENV"
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(
            `❌ Falta la variable de entorno obligatoria: ${variable}`
        );
    }
}

export const config = {
    port: process.env.PORT,
    mongoUri: process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV
};