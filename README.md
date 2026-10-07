# ShipNow API

API base de **ShipNow**, plataforma orientada a la gestión de operaciones de una empresa de logística.
El proyecto aplica una **arquitectura profesional por capas** (**Controller → Service → Repository**),
con validación de variables de entorno al arranque, un diccionario de
constantes centralizado para roles y estados, un módulo de **mocking** para
generar datos de prueba, un sistema **centralizado de manejo de errores**, y
un sistema de **logging con Winston**.

## 🛠️ Tecnologías utilizadas

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **dotenv**
- **bcryptjs**
- **Winston** + **winston-daily-rotate-file**
- **Nodemon**
- **JavaScript (ES Modules)**

---

## 🏗️ Arquitectura del proyecto

```text
                 HTTP Request
                      │
                      ▼
               httpLogger (logger.http)
                      │
                      ▼
                  Routes
                      │
                      ▼
                 Controller ──── throw CustomError ────┐
                      │                                 │
                      ▼                                 ▼
                   Service ──── throw CustomError ──► next(error)
                      │                                 │
                      ▼                                 ▼
                 Repository                    Middleware global de errores
                      │                        (logea warning/error + responde)
                      ▼                                 │
                    Model                                ▼
                      │                         Respuesta HTTP uniforme
                      ▼
                  MongoDB
```

## 📂 Estructura del proyecto

```
ShipNow/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.config.js
│   │   ├── database.config.js
│   │   └── logger.config.js
│   │
│   ├── constants/
│   │   └── index.js
│   │
│   ├── errors/
│   │   ├── errorDictionary.js
│   │   └── CustomError.js
│   │
│   ├── middlewares/
│   │   ├── httpLogger.js
│   │   ├── errorHandler.js
│   │   └── notFoundHandler.js
│   │
│   ├── utils/
│   │   └── asyncHandler.js
│   │
│   ├── controllers/
│   │   ├── products.controller.js
│   │   ├── users.controller.js
│   │   ├── mocks.controller.js
│   │   └── logger.controller.js
│   │
│   ├── services/
│   │   ├── products.service.js
│   │   ├── users.service.js
│   │   └── mocks.service.js
│   │
│   ├── repositories/
│   │   ├── products.repository.js
│   │   ├── users.repository.js
│   │   ├── orders.repository.js
│   │   └── deliveries.repository.js
│   │
│   ├── models/
│   │   ├── product.model.js
│   │   ├── user.model.js
│   │   ├── order.model.js
│   │   └── delivery.model.js
│   │
│   ├── mocks/
│   │   ├── users.mock.js
│   │   ├── orders.mock.js
│   │   └── deliveries.mock.js
│   │
│   ├── routes/
│   │   ├── products.routes.js
│   │   ├── users.routes.js
│   │   ├── mocks.routes.js
│   │   └── logger.routes.js
│   │
│   ├── app.js
│   └── server.js
│
├── logs/                  ← se genera en tiempo de ejecución, no se sube a Git
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Configuración del proyecto

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/CJRO77/Proyecto96795-Api-Backend-III.git
   cd Proyecto96795-Api-Backend-III
   ```

2. Instalar las dependencias:
   ```bash
   npm install
   ```

3. Crear el archivo `.env` a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```
   El archivo debe contener:
   ```
   PORT=3000
   MONGODB_URI=tu_uri_de_mongodb
   NODE_ENV=development
   ```

4. Ejecutar el proyecto:
   ```bash
   npm run dev     # modo desarrollo, con auto-reload
   # o
   npm start       # modo normal
   ```

   Si la configuración es correcta, vas a ver en consola (ya con el logger
   configurado) que MongoDB se conectó correctamente y que el servidor está
   escuchando. Si falta alguna variable obligatoria (`PORT`, `MONGODB_URI`,
   `NODE_ENV`), la app **no arranca** y muestra un error indicando cuál falta.

## Endpoints

### Productos (`/api/products`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista productos disponibles (`status: AVAILABLE`) |
| GET | `/:id` | Obtiene un producto por id |
| POST | `/` | Crea un producto (valida `name`, `description`, `price`, `stock`) |
| PUT | `/:id` | Actualiza un producto |
| DELETE | `/:id` | Elimina un producto |

### Usuarios (`/api/users`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista usuarios |
| GET | `/:id` | Obtiene un usuario por id |
| POST | `/` | Registra un usuario (password hasheado con bcrypt) |
| PUT | `/:id` | Actualiza un usuario |
| DELETE | `/:id` | Elimina un usuario |

### Mocking (`/api/mocks`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/users?qty=10` | Genera usuarios falsos sin guardarlos |
| GET | `/drivers?qty=10` | Genera repartidores falsos sin guardarlos |
| GET | `/orders?qty=10` | Genera pedidos falsos sin guardarlos |
| GET | `/deliveries?qty=10` | Genera entregas falsas sin guardarlos |
| POST | `/seed?qty=10&entity=users` | Inserta `qty` registros reales (`entity`: `users`, `drivers`, `orders`, `deliveries`) |

### Logger de prueba (`/api/logger-test`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Dispara un log de cada uno de los 6 niveles (debug, http, info, warning, error, fatal). No es una funcionalidad de negocio: es una herramienta interna para confirmar que el logger está bien configurado. |

## 📝 Logging

ShipNow usa **Winston** como logger centralizado (`src/config/logger.config.js`),
en reemplazo de los `console.log()` sueltos.

### Niveles

De menor a mayor gravedad: `debug` → `http` → `info` → `warning` → `error` → `fatal`.

| Nivel | Cuándo se usa en el proyecto |
|---|---|
| `debug` | Detalle técnico fino. Hoy solo se usa en `/api/logger-test`. |
| `http` | Se registra automáticamente en **cada** request que entra a la API (middleware `httpLogger`). |
| `info` | Servidor iniciado, Mongo conectado, producto/usuario creado o eliminado, datos de mock insertados. |
| `warning` | Errores de negocio esperados (404, 400, 409 — usuario no encontrado, validación fallida, email duplicado) y rutas inexistentes. |
| `error` | Errores de negocio graves (500, ej. falla al insertar mocks) y cualquier error inesperado no contemplado (incluye el `stack trace`). |
| `fatal` | Solo cuando falla la conexión a MongoDB al arrancar — el proceso se corta después de loguearlo. |

### Comportamiento según el entorno

- **`NODE_ENV=development`** → `level: "debug"`: se muestran los 6 niveles en consola.
- **`NODE_ENV=production`** → `level: "info"`: en consola solo se muestran `info`, `warning`, `error` y `fatal` (se excluyen `http` y `debug`, para no generar ruido).

En ambos entornos, el archivo de errores (ver abajo) **siempre** se limita a `error`/`fatal`, sin importar `NODE_ENV`.

### Persistencia y rotación de archivos

Los niveles `error` y `fatal` se guardan, además de en consola, en archivos dentro de `logs/`, con rotación diaria.

Se conservan los últimos **15 días** (`maxFiles: "15d"` en `winston-daily-rotate-file`); los archivos más viejos se eliminan automáticamente. La carpeta `logs/` **no se sube al repositorio** — está en `.gitignore`:

### Cómo probar el logger

1. Levantar el servidor (`npm run dev`).
2. `GET http://localhost:3000/api/logger-test` → responde `200` y dispara un log de cada nivel.
3. Mirar la consola del servidor: deberían verse las 6 líneas (más una de nivel `http` por la propia petición), cada una con fecha, nivel entre corchetes y color distinto.
4. Revisar la carpeta `logs/`: debería existir un archivo `error-<fecha-de-hoy>.log` que contenga **solo** las líneas de `error` y `fatal` generadas por ese mismo request (nada de `debug`/`http`/`info`/`warning`).
5. Para confirmar la integración con errores reales (no solo el endpoint de prueba):
   - `GET /api/no-existe` → genera un `warning` en consola (`ROUTE_NOT_FOUND`).
   - `GET /api/mocks/users?qty=-5` → genera un `warning` (`INVALID_MOCK_AMOUNT`).
   - `POST /api/products` con datos válidos → genera un `info` ("Producto creado...").

## 🚨 Manejo de errores

(sin cambios respecto al módulo anterior — ver detalle completo de la
estructura de respuesta, el diccionario de errores y los casos de prueba en
el historial del proyecto)

Todo error esperado responde:
```json
{
    "status": "error",
    "error": "USER_NOT_FOUND",
    "message": "El usuario solicitado no existe"
}
```

Lo nuevo en este módulo es que, además de responder al cliente, el middleware
global de errores (`src/middlewares/errorHandler.js`) ahora **loguea** cada
error con el nivel que corresponde (`warning` si es un error de negocio
esperado con status < 500, `error` si es grave o inesperado), para que quede
registrado internamente además de responderse al cliente.

Antes de este módulo, el proyecto tenía mensajes como `console.log("🍃 MongoDB conectado correctamente")` o `console.error(...)` dispersos en distintos archivos, sin clasificar por importancia ni posibilidad de guardarse en archivo.

Con Winston:

- Todo pasa por un único punto de configuración (`logger.config.js`), así que si mañana queremos cambiar el formato de los logs o agregar un transporte nuevo (por ejemplo, enviar errores a un servicio externo), se cambia en un solo lugar.
- Los niveles permiten filtrar: en producción no queremos ver cada `debug` ni cada request (`http`) mezclado con los errores reales.
- Los errores importantes (`error`/`fatal`) quedan persistidos en archivo, con rotación, para poder investigarlos después de que ocurrieron — algo que `console.log` no ofrece por sí solo.
- El middleware global de errores y el logger se complementan: uno responde al cliente, el otro registra internamente. Ninguno reemplaza al otro.

## ¿Por qué separar la lógica entre Service y Repository?

La regla que seguí fue: **el Repository solo sabe "buscar y guardar datos";
el Service sabe "qué significan esos datos para el negocio"**. Ver el detalle
completo (con ejemplos de `productsRepository`/`productsService`) en las
versiones anteriores del README, conservado en el historial de commits.

## Notas de diseño

- El Controller nunca importa `mongoose` ni los modelos directamente.
- No hay strings sueltos para roles, estados o prioridades: todo pasa por `src/constants/index.js`.
- No hay llamadas a `process.env` fuera de `src/config/env.config.js` (el logger lee `NODE_ENV` a través de ese mismo módulo, no accede a `process.env` directamente).
- No hay respuestas de error armadas a mano en controllers: todo pasa por `CustomError` + el middleware global.
- El router `/api/mocks` y `/api/logger-test` son herramientas de desarrollo, separadas de las rutas reales de negocio.
- Los archivos de log generados por la aplicación nunca se suben al repositorio.

## Próximas etapas

- Endpoints reales de negocio para Pedidos y Entregas
- Comercios, Comprobantes, Documentos
- Autenticación y Autorización
- Testing automatizado
- Swagger
- Seguridad y Escalabilidad

## 👨‍💻 Autor

Carlos Jonathan Rodriguez Osorio

Proyecto desarrollado como parte del aprendizaje de Programación Backend III — Comisión #96795 — Coderhouse.