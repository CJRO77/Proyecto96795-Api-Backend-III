import { ERROR_DICTIONARY } from "./errorDictionary.js";

export class CustomError extends Error {
    constructor(code, details = null) {
        const errorDefinition = ERROR_DICTIONARY[code];

        // Si alguien tipea mal un código que no existe en el diccionario,
        // preferimos degradar a un error interno antes que romper el server
        // por una referencia indefinida.
        
        const safeCode = errorDefinition ? code : "INTERNAL_SERVER_ERROR";
        const safeDefinition = errorDefinition || ERROR_DICTIONARY.INTERNAL_SERVER_ERROR;

        super(safeDefinition.message);

        this.name = "CustomError";
        this.code = safeCode;
        this.statusCode = safeDefinition.statusCode;
        this.details = details;
    }
}