/**
 * HERRAMIENTA OPCIONAL: cobertura de Swagger.
 *
 * Se ejecuta con "npm run test:docs". Corre toda la suite y, al final, cruza las respuestas
 * que documenta Swagger (src/docs/*.yaml) con las que los tests produjeron realmente.
 * Falla si hay alguna respuesta documentada que ningún test provoca: así la documentación
 * y los tests no pueden desalinearse sin que nos enteremos.
 *
 * No forma parte de "npm test" a propósito: si se corre una sola parte de la suite
 * (por ejemplo "npm test -- --grep Orders"), la cobertura obviamente no sería completa.
 
import express from "express";
import { swaggerSpecs } from "../../src/docs/swagger.config.js";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

// "METODO /ruta/{id}|status" -> conjunto de códigos de error producidos
const produced = new Map();

// Convierte cada ruta documentada ("/api/users/{id}") en una expresión regular, para
// saber a qué endpoint documentado corresponde la URL real de cada petición.
const templates = Object.keys(swaggerSpecs.paths).map((template) => ({
    template,
    regex: new RegExp("^" + template.replace(/\{[^}]+\}/g, "[^/]+") + "/?$")
}));

const originalJson = express.response.json;

express.response.json = function (body) {
    const req = this.req;
    const urlPath = req.originalUrl.split("?")[0];
    const match = templates.find(({ regex }) => regex.test(urlPath));

    // Se registran solo las rutas que existen (un 404 de ruta inexistente no es un endpoint).
    if (match && req.route) {
        const key = `${req.method} ${match.template}|${this.statusCode}`;

        if (!produced.has(key)) produced.set(key, new Set());
        produced.get(key).add(body?.error ?? "-");
    }

    return originalJson.call(this, body);
};

const getExamples = (response) => {
    let media = response.content?.["application/json"];

    if (response.$ref) {
        const name = response.$ref.split("/").pop();
        media = swaggerSpecs.components.responses[name]?.content?.["application/json"];
    }

    if (media?.examples) return Object.values(media.examples).map((example) => example.value);
    if (media?.example) return [media.example];
    return [];
};

after(() => {
    const documentedKeys = new Set();
    const withoutTest = [];
    let documentedCount = 0;

    Object.entries(swaggerSpecs.paths).forEach(([path, pathItem]) => {
        HTTP_METHODS.filter((method) => pathItem[method]).forEach((method) => {
            Object.entries(pathItem[method].responses).forEach(([status, response]) => {
                const key = `${method.toUpperCase()} ${path}|${status}`;
                documentedKeys.add(key);
                documentedCount++;

                const producedCodes = produced.get(key);

                if (!producedCodes) {
                    withoutTest.push(`${method.toUpperCase()} ${path} → ${status}`);
                    return;
                }

                // Cada ejemplo de error documentado también tiene que producirse de verdad.
                getExamples(response).forEach((example) => {
                    if (example?.error && !producedCodes.has(example.error)) {
                        withoutTest.push(`${method.toUpperCase()} ${path} → ${status} (${example.error})`);
                    }
                });
            });
        });
    });

    const undocumented = [...produced.keys()]
        .filter((key) => !documentedKeys.has(key))
        .map((key) => key.replace("|", " → "));

    console.log("\n=== Cobertura Swagger ⇄ tests ===");
    console.log(`Respuestas documentadas en Swagger: ${documentedCount}`);
    console.log(`Documentadas sin test: ${withoutTest.length}`);
    withoutTest.forEach((item) => console.log(`   ✗ ${item}`));
    console.log(`Producidas por los tests pero no documentadas: ${undocumented.length}`);
    undocumented.forEach((item) => console.log(`   ? ${item}`));

    if (withoutTest.length > 0 || undocumented.length > 0) {
        throw new Error("Swagger y los tests no coinciden (ver el detalle arriba).");
    }
});*/