
import mongoose from "mongoose";

// Este script se puede ejecutar con "node tests/test-mongo-connection.js" para verificar que la conexión a MongoDB Atlas funciona y que la base de datos es la correcta.

try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Conexión establecida con Atlas");
    console.log("Base de datos:", mongoose.connection.name);

    if (mongoose.connection.name !== "shipnow_test") {
        throw new Error("La base de datos no es shipnow_test. Se cancela la prueba.");
    }

    const collection = mongoose.connection.collection(
        "_connection_test"
    );

    const documento = {
        mensaje: "Prueba de conexión ShipNow",
        fecha: new Date()
    };

    const resultado = await collection.insertOne(documento);
    console.log("Escritura: CORRECTA");

    const encontrado = await collection.findOne({
        _id: resultado.insertedId
    });

    if (!encontrado) {
        throw new Error("No se pudo leer el documento insertado");
    }

    console.log("Lectura: CORRECTA");

    await collection.deleteOne({
        _id: resultado.insertedId
    });

    console.log("Eliminación del documento temporal: CORRECTA");
} catch (error) {
    console.error("Falló la comprobación:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
