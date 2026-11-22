import { before, beforeEach, after } from "mocha";
import mongoose from "mongoose";
import { config } from "../src/config/env.config.js";
import { cleanDatabase } from "./helpers.js";

// Función para extraer el nombre de la base de datos del URI de MongoDB

const getDatabaseName = (uri) => uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]*)/)?.[1] ?? "";

const assertSafeTestEnvironment = () => {
    if (config.nodeEnv !== "test") {
        throw new Error(
            `[tests] NODE_ENV es "${config.nodeEnv}", no "test". ` +
            `Corré los tests con "npm test" (no con "npx mocha" directo).`
        );
    }

    const databaseName = getDatabaseName(config.mongoUri);

    // "test" a secas NO sirve: es la base que MongoDB usa por defecto cuando el URI no trae
    // nombre, así que ahí podrían estar los datos reales de desarrollo.

    const isDedicatedTestDatabase = /test/i.test(databaseName) && databaseName.toLowerCase() !== "test";

    if (!isDedicatedTestDatabase) {
        throw new Error(
            `[tests] La base de datos "${databaseName || "(sin nombre)"}" no es válida para testing. ` +
            `Tiene que tener un nombre propio que contenga "test" (por ejemplo shipnow-test). ` +
            `Ojo: "test" a secas es la base por defecto de MongoDB y puede tener datos reales. ` +
            `Revisá MONGODB_URI en .env.test.`
        );
    }
};

// Se ejecuta al cargar el archivo: si algo está mal, aborta antes de tocar la base.

assertSafeTestEnvironment();


// Hooks globales (aplican a TODOS los tests de la suite)

before(async () => {
    console.log("1. Iniciando conexión con MongoDB...");
    await mongoose.connect(config.mongoUri);
    console.log("2. Conexión con MongoDB establecida.");

    console.log("3. Iniciando limpieza de la base de datos...");
    await cleanDatabase();
    console.log("4. Base de datos limpia.");
});

// Cada test arranca con la base vacía: ninguno depende de otro ni del orden de ejecución.

beforeEach(async () => {
    await cleanDatabase();
});

after(async () => {
    await cleanDatabase();
    await mongoose.disconnect();
});