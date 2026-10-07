import { ERROR_DICTIONARY } from "./errorDictionary.js";

export class CustomError extends Error {
    constructor(code, details = null) {
        const errorDefinition = ERROR_DICTIONARY[code];

       // Si el código de error no está definido en el diccionario, se utiliza un error genérico.
        
        const safeCode = errorDefinition ? code : "INTERNAL_SERVER_ERROR";
        const safeDefinition = errorDefinition || ERROR_DICTIONARY.INTERNAL_SERVER_ERROR;

        super(safeDefinition.message);

        this.name = "CustomError";
        this.code = safeCode;
        this.statusCode = safeDefinition.statusCode;
        this.details = details;
    }
}