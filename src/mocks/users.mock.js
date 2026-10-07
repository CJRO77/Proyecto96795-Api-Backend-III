import { USER_ROLES } from "../constants/index.js";

// Mock data generation para usuarios

const FIRST_NAMES = ["Camila", "Martina", "Diego", "Lucía", "Mateo", "Valentina", "Joaquín", "Sofía", "Bruno", "Julieta"];
const LAST_NAMES = ["Gómez", "Pérez", "Torres", "Rodríguez", "Fernández", "López", "Díaz", "Romero", "Sosa", "Molina"];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// Genera un objeto de usuario de mock con un role opcional (por defecto CUSTOMER).

export const generateMockUser = (role = USER_ROLES.CUSTOMER) => {
    const firstName = pickRandom(FIRST_NAMES);
    const lastName = pickRandom(LAST_NAMES);
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

    return {
        firstName,
        lastName,
        email: `${firstName}.${lastName}.${uniqueSuffix}@test.com`.toLowerCase(),
        password: "coder123",
        role
    };
};

export const generateMockUsers = (qty, role = USER_ROLES.CUSTOMER) => {
    return Array.from({ length: qty }, () => generateMockUser(role));
};

// Genera un objeto de repartidor de mock con un role DRIVER y un estado de disponibilidad aleatorio.

export const generateMockDriver = () => {
    return {
        ...generateMockUser(USER_ROLES.DRIVER),
        isAvailable: Math.random() > 0.3
    };
};

export const generateMockDrivers = (qty) => {
    return Array.from({ length: qty }, () => generateMockDriver());
};