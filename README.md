# ShipNow API

API de **ShipNow**, plataforma orientada a la gestión de operaciones de una empresa de logística.
El proyecto aplica una **arquitectura profesional por capas** (**Controller → Service → Repository**),
con validación de variables de entorno al arranque, constantes centralizadas para roles y estados,
un módulo de **mocking** para generar datos de prueba, un sistema **centralizado de manejo de errores**,
**logging con Winston** y **documentación interactiva con Swagger/OpenAPI**.

## Tecnologías utilizadas

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **dotenv**
- **bcryptjs**
- **Winston** + **winston-daily-rotate-file**
- **swagger-jsdoc** + **swagger-ui-express**
- **Nodemon**
- **JavaScript (ES Modules)**

## Índice

- [Configuración y ejecución](#configuración-y-ejecución)
- [Documentación interactiva (Swagger)](#documentación-interactiva-swagger)
- [Endpoints](#endpoints)
- [Formato de las respuestas](#formato-de-las-respuestas)
- [Manejo de errores](#manejo-de-errores)
- [Mocking](#mocking)
- [Logging](#logging)
- [Arquitectura y estructura](#arquitectura-y-estructura)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Próximas etapas](#próximas-etapas)
- [Autor](#autor)

---

## Configuración y ejecución

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

Si todo está bien, la consola muestra que MongoDB se conectó y que el servidor está escuchando.
Si falta alguna variable obligatoria (`PORT`, `MONGODB_URI`, `NODE_ENV`), la app **no arranca** y
muestra un error indicando cuál falta.

---

## Documentación interactiva (Swagger)

La documentación vive en **`/api/docs`**. Con el servidor levantado, abrir en el navegador:

```
http://localhost:3000/api/docs
```

> El puerto es el que definas en `PORT` dentro de tu `.env` (3000 en el ejemplo). La URL del servidor
> que muestra Swagger se arma automáticamente a partir de ese valor.

Desde esa página se puede consultar cada endpoint y probarlo con el botón **"Try it out"**.

### Módulos documentados

La documentación está agrupada por **tags**:

| Tag | Qué documenta |
|---|---|
| **Users** | Registro, consulta, actualización y baja de usuarios |
| **Products** | Catálogo de productos (CRUD) |
| **Orders** | Alta y consulta de pedidos, y cambio de estado |
| **Deliveries** | Alta y consulta de entregas, y cambio de estado |
| **Mocks** | Herramienta de desarrollo: generación de datos de prueba |
| **Logger** | Herramienta de desarrollo: validación del sistema de logs |

Cada endpoint documenta método HTTP, ruta, descripción, parámetros de ruta y de query, body esperado,
respuesta exitosa y los errores que la API puede devolver. Hay **schemas reutilizables** para usuario,
producto, pedido, item de pedido, entrega, respuesta exitosa, respuesta de error y los bodies de entrada.

### Dónde está la configuración

La configuración de Swagger está separada de las rutas:

```
src/docs/
├── swagger.config.js   ← configuración general (título, versión, servidor, tags)
├── schemas.yaml        ← schemas y respuestas de error reutilizables
├── users.yaml
├── products.yaml
├── orders.yaml
├── deliveries.yaml
├── mocks.yaml
└── logger.yaml
```

Los routers (`src/routes/`) solo conectan paths con controllers: no contienen documentación.

### Aclaraciones para probar los endpoints

- **Flujo sugerido para probar Orders y Deliveries** (los ids se copian de las respuestas):
  1. `POST /api/mocks/seed?entity=drivers&qty=5` para tener repartidores, y `POST /api/users` (o `POST /api/mocks/seed?entity=users`) para tener un usuario.
  2. `GET /api/users` → copiar el `_id` de un usuario.
  3. `POST /api/orders` usando ese `_id` como `customer`.
  4. `POST /api/deliveries` con el `_id` del pedido y, opcionalmente, un `driver` (el `_id` de un usuario con rol `DRIVER`).
  5. `PATCH /api/orders/{id}/status` y `PATCH /api/deliveries/{id}/status` para cambiar estados.
- Los usuarios creados con `POST /api/users` siempre quedan con rol `USER` (nadie se auto-asigna `ADMIN`). Los generados por mocks son `CUSTOMER` o `DRIVER`.
- Un repartidor generado por mocks puede venir con `isAvailable: false`; en ese caso, crear una entrega con él responde `409 DRIVER_NOT_AVAILABLE`.
- Los ids deben ser ObjectId válidos de MongoDB (24 caracteres hexadecimales). Un id mal formado responde `400 INVALID_ID`.
- `GET /api/products` lista solo productos `AVAILABLE`; los `OUT_OF_STOCK` no aparecen en el listado general.
- `POST /api/mocks/seed` **no recibe body**: `qty` y `entity` van como query params.
- Al abrir un endpoint en Swagger, la tabla "Responses" muestra **ejemplos** de lo que puede devolver; el resultado real de la prueba aparece más arriba, en **Server response**, después de tocar **Execute**.
- **Autenticación:** la API todavía no implementa autenticación ni autorización, por eso no hay respuestas `401`/`403` documentadas.
- `Mocks` y `Logger` son herramientas internas de desarrollo, no funcionalidades de negocio.
- El campo `details` de los errores solo aparece cuando `NODE_ENV` no es `production`.
- Si se envía un body que no es un JSON válido a cualquier endpoint que reciba body, la respuesta es `400 VALIDATION_ERROR`.

---

## Endpoints

La referencia completa, con ejemplos y respuestas, está en Swagger (`/api/docs`). Resumen:

### Usuarios (`/api/users`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista usuarios (nunca incluye el password) |
| GET | `/:id` | Obtiene un usuario por id |
| POST | `/` | Registra un usuario (password hasheado con bcrypt, rol siempre `USER`) |
| PUT | `/:id` | Actualiza un usuario |
| DELETE | `/:id` | Elimina un usuario |

### Productos (`/api/products`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista productos disponibles (`status: AVAILABLE`) |
| GET | `/:id` | Obtiene un producto por id |
| POST | `/` | Crea un producto (valida `name`, `description`, `price`, `stock`) |
| PUT | `/:id` | Actualiza un producto |
| DELETE | `/:id` | Elimina un producto |

### Pedidos (`/api/orders`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/?status=` | Lista pedidos, opcionalmente filtrados por estado |
| GET | `/:id` | Obtiene un pedido por id |
| POST | `/` | Crea un pedido para un usuario existente (el total lo calcula el servidor) |
| PATCH | `/:id/status` | Cambia el estado del pedido (un pedido `DELIVERED` queda cerrado) |

### Entregas (`/api/deliveries`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/?status=` | Lista entregas, opcionalmente filtradas por estado |
| GET | `/:id` | Obtiene una entrega por id |
| POST | `/` | Crea una entrega para un pedido existente, con repartidor opcional |
| PATCH | `/:id/status` | Cambia el estado de la entrega |

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
| GET | `/` | Dispara un log de cada uno de los 6 niveles. Herramienta interna, no es funcionalidad de negocio. |

---


## Manejo de errores

Todos los errores esperados pasan por una capa centralizada, en vez de responderse de forma aislada
en cada ruta o controller.

### Cómo viaja un error

```
Service detecta el problema
        ↓
throw new CustomError("CODIGO_DE_ERROR", detalle_opcional)
        ↓
Controller envuelto en asyncHandler → next(error) automático
        ↓
Middleware global de errores (src/middlewares/errorHandler.js)
        ↓
Respuesta HTTP uniforme
```

Ningún Controller ni Service arma una respuesta HTTP de error. Todos derivan al middleware global, que
es el único lugar que decide el status code y el formato final.

En modo `development`, la respuesta de error incluye además un campo `details` con información para
debugging (por ejemplo `"price no puede ser negativo"`). En `production` ese campo no se incluye.

Un error **inesperado** (un bug, una falla de MongoDB no contemplada) siempre responde `500` con el
código `INTERNAL_SERVER_ERROR`, sin exponer el mensaje ni el stack trace original. Ese error sí queda
registrado completo en el log del servidor.

El middleware también traduce dos errores técnicos que en realidad son errores del cliente: un id con
formato inválido (`CastError` de Mongoose → `400 INVALID_ID`) y un body que no es un JSON válido
(→ `400 VALIDATION_ERROR`).

### Diccionario de errores (`src/errors/errorDictionary.js`)

| Código | Status | Cuándo ocurre |
|---|---|---|
| `USER_NOT_FOUND` | 404 | Un usuario no existe (por id, o como `customer`/`driver` de un pedido/entrega) |
| `USER_ALREADY_EXISTS` | 409 | Se registra un usuario con un email ya usado |
| `INVALID_USER_ROLE` | 400 | El usuario indicado como `driver` no tiene rol `DRIVER` |
| `PRODUCT_NOT_FOUND` | 404 | Un producto no existe |
| `ORDER_NOT_FOUND` | 404 | Un pedido no existe |
| `ORDER_ITEMS_REQUIRED` | 400 | Se crea un pedido sin items |
| `INVALID_ORDER_STATUS` | 400 | El estado de pedido enviado (en el body o en el filtro) no es válido |
| `ORDER_ALREADY_DELIVERED` | 409 | Se intenta modificar un pedido ya entregado |
| `DELIVERY_NOT_FOUND` | 404 | Una entrega no existe |
| `INVALID_DELIVERY_STATUS` | 400 | El estado de entrega enviado (en el body o en el filtro) no es válido |
| `DRIVER_NOT_AVAILABLE` | 409 | El repartidor indicado no está disponible |
| `INVALID_MOCK_AMOUNT` | 400 | `qty` no es un entero positivo, o supera el máximo permitido (100) |
| `INVALID_MOCK_ENTITY` | 400 | `entity` de `POST /api/mocks/seed` no es una de las permitidas |
| `MOCK_GENERATION_ERROR` | 500 | Falla la inserción de datos de prueba en MongoDB |
| `VALIDATION_ERROR` | 400 | Faltan campos obligatorios, hay valores inválidos, o el body no es un JSON válido |
| `INVALID_ID` | 400 | Un id enviado no tiene formato de ObjectId |
| `ROUTE_NOT_FOUND` | 404 | Se pide una ruta que no existe |
| `INTERNAL_SERVER_ERROR` | 500 | Cualquier error inesperado |

### Cómo probar los casos inválidos

Se pueden probar desde Swagger, desde el navegador (los `GET`) o con `curl`/Thunder Client/Postman:

**Rutas e ids**
```
GET /api/ruta-que-no-existe              → 404 ROUTE_NOT_FOUND
GET /api/users/abc                       → 400 INVALID_ID
GET /api/users/665f4d0a8f9a1b001234abce  → 404 USER_NOT_FOUND
```

**Usuarios y productos**
```
POST /api/users      Body: { "firstName": "Ana" }                         → 400 VALIDATION_ERROR
POST /api/users      (mismo email dos veces)                              → 409 USER_ALREADY_EXISTS
POST /api/products   Body sin "description"                               → 400 VALIDATION_ERROR
PUT  /api/products/:id   Body: { "stock": -3 }                            → 400 VALIDATION_ERROR
```

**Pedidos**
```
POST  /api/orders   Body con "items": []                                  → 400 ORDER_ITEMS_REQUIRED
POST  /api/orders   customer inexistente                                  → 404 USER_NOT_FOUND
GET   /api/orders?status=en camino                                        → 400 INVALID_ORDER_STATUS
PATCH /api/orders/:id/status   Body: { "status": "en camino" }            → 400 INVALID_ORDER_STATUS
PATCH /api/orders/:id/status   (pedido ya DELIVERED)                      → 409 ORDER_ALREADY_DELIVERED
```

**Entregas**
```
POST  /api/deliveries   order inexistente                                 → 404 ORDER_NOT_FOUND
POST  /api/deliveries   driver con un usuario que no es DRIVER            → 400 INVALID_USER_ROLE
POST  /api/deliveries   driver con isAvailable: false                     → 409 DRIVER_NOT_AVAILABLE
PATCH /api/deliveries/:id/status   Body: { "status": "en camino" }        → 400 INVALID_DELIVERY_STATUS
```

**Mocks**
```
GET  /api/mocks/users?qty=abc                  → 400 INVALID_MOCK_AMOUNT
GET  /api/mocks/users?qty=-5                   → 400 INVALID_MOCK_AMOUNT
GET  /api/mocks/users?qty=0                    → 400 INVALID_MOCK_AMOUNT
GET  /api/mocks/users?qty=500                  → 400 INVALID_MOCK_AMOUNT
POST /api/mocks/seed?qty=5&entity=vehiculos    → 400 INVALID_MOCK_ENTITY
```

**Body vacío o JSON roto** (con `curl`; Swagger no permite enviarlos):
```bash
curl -i -X POST http://localhost:3000/api/users
curl -i -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"firstName": "Ana",'
```
Ambos responden `400 VALIDATION_ERROR`.

---

## Mocking

El router `/api/mocks` genera datos de prueba que respetan los modelos reales y las constantes del
proyecto (nunca strings sueltos). Los `GET` no modifican la base de datos; `POST /seed` sí inserta
datos reales.

**Generación en cascada:** los pedidos necesitan un usuario real (`customer`) y las entregas necesitan
un pedido real (`order`) y, opcionalmente, un repartidor (`driver`). Si se pide `entity=orders` o
`entity=deliveries` y todavía no hay usuarios, pedidos o repartidores cargados, el sistema los genera
automáticamente antes de crear lo pedido, para no romper las relaciones.

**Validaciones:** `qty` debe ser un entero entre 1 y 100 (`400 INVALID_MOCK_AMOUNT` si no), y `entity`
debe ser una de las cuatro permitidas (`400 INVALID_MOCK_ENTITY` si no). Si falla la inserción en
MongoDB, la respuesta es `500 MOCK_GENERATION_ERROR` sin exponer el error técnico de la base.

---

## Logging

ShipNow usa **Winston** como logger centralizado (`src/config/logger.config.js`), en reemplazo de los
`console.log()` sueltos.

### Niveles

De menor a mayor gravedad: `debug` → `http` → `info` → `warning` → `error` → `fatal`.

| Nivel | Cuándo se usa en el proyecto |
|---|---|
| `debug` | Detalle técnico fino. Hoy solo se usa en `/api/logger-test`. |
| `http` | Se registra automáticamente en **cada** request que entra a la API (middleware `httpLogger`). |
| `info` | Servidor iniciado, Mongo conectado, recursos creados, actualizados o eliminados (usuarios, productos, pedidos y entregas), datos de mock insertados. |
| `warning` | Errores de negocio esperados (400, 404, 409) y rutas inexistentes. |
| `error` | Errores de negocio graves (500) y cualquier error inesperado (incluye el `stack trace`). |
| `fatal` | Solo cuando falla la conexión a MongoDB al arrancar; el proceso se corta después de loguearlo. |


### Comportamiento según el entorno

- **`NODE_ENV=development`** → `level: "debug"`: se muestran los 6 niveles en consola.
- **`NODE_ENV=production`** → `level: "info"`: en consola solo `info`, `warning`, `error` y `fatal` (se excluyen `http` y `debug`, para no generar ruido).

En ambos entornos, el archivo de errores **siempre** se limita a `error`/`fatal`, sin importar `NODE_ENV`.

### Persistencia y rotación de archivos

Los niveles `error` y `fatal` se guardan, además de en consola, en archivos dentro de `logs/`, con
rotación diaria:

```
logs/error-2026-10-18.log
logs/error-2026-10-19.log
```

Se conservan los últimos **15 días** (`maxFiles: "15d"` en `winston-daily-rotate-file`); los archivos
más viejos se eliminan automáticamente. La carpeta `logs/` **no se sube al repositorio**: está en
`.gitignore`.

```
logs/
*.log
```

### Cómo probar el logger

1. Levantar el servidor (`npm run dev`).
2. `GET http://localhost:3000/api/logger-test` → responde `200` y dispara un log de cada nivel.
3. Mirar la consola del servidor: deberían verse las 6 líneas (más una de nivel `http` por la propia petición), cada una con fecha, nivel entre corchetes y color distinto.
4. Revisar la carpeta `logs/`: debería existir `error-<fecha-de-hoy>.log` con **solo** las líneas de `error` y `fatal` generadas por ese mismo request (nada de `debug`/`http`/`info`/`warning`).
5. Para confirmar la integración con errores reales (no solo el endpoint de prueba):
   - `GET /api/no-existe` → genera un `warning` (`ROUTE_NOT_FOUND`).
   - `GET /api/mocks/users?qty=-5` → genera un `warning` (`INVALID_MOCK_AMOUNT`).
   - `POST /api/products` con datos válidos → genera un `info` ("Producto creado...").

---

## Arquitectura y estructura

```text
                 HTTP Request
                      │
                      ▼
          express.json + normalizeBody
                      │
                      ▼
               httpLogger (logger.http)
                      │
                      ▼
                  Routes
                      │
                      ▼
                 Controller (asyncHandler)
                      │
                      ▼
                   Service ──── throw CustomError ───► next(error)
                      │                                    │
                      ▼                                    ▼
                 Repository                   Middleware global de errores
                      │                       (loguea warning/error + responde)
                      ▼                                    │
                    Model                                  ▼
                      │                           Respuesta HTTP uniforme
                      ▼
                  MongoDB
```

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
│   ├── docs/                      ← documentación Swagger/OpenAPI
│   │   ├── swagger.config.js
│   │   ├── schemas.yaml
│   │   ├── users.yaml
│   │   ├── products.yaml
│   │   ├── orders.yaml
│   │   ├── deliveries.yaml
│   │   ├── mocks.yaml
│   │   └── logger.yaml
│   │
│   ├── errors/
│   │   ├── errorDictionary.js
│   │   └── CustomError.js
│   │
│   ├── middlewares/
│   │   ├── normalizeBody.js
│   │   ├── httpLogger.js
│   │   ├── errorHandler.js
│   │   └── notFoundHandler.js
│   │
│   ├── utils/
│   │   └── asyncHandler.js
│   │
│   ├── controllers/               ← products, users, orders, deliveries, mocks, logger
│   ├── services/                  ← products, users, orders, deliveries, mocks
│   ├── repositories/              ← products, users, orders, deliveries
│   ├── models/                    ← product, user, order, delivery
│   ├── mocks/                     ← users, orders, deliveries (generadores de datos falsos)
│   ├── routes/                    ← products, users, orders, deliveries, mocks, logger
│   │
│   ├── app.js
│   └── server.js
│
├── logs/                          ← se genera en tiempo de ejecución, no se sube a Git
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Decisiones de diseño

### ¿Por qué separar la lógica entre Service y Repository?

La regla que seguí fue: **el Repository solo sabe "buscar y guardar datos"; el Service sabe "qué
significan esos datos para el negocio"**.

En `productsRepository.getAll` no hay ningún filtro fijo: recibe los criterios de búsqueda como
parámetro y aplica una proyección por defecto (excluye `__v`) para no exponer campos internos de
Mongoose. La decisión de negocio de "el listado general solo muestra productos con
`status: AVAILABLE`" vive en `productsService.getAllProducts`, porque es una regla que puede cambiar
según el caso de uso, y esa decisión no le corresponde al Repository.

Lo mismo pasa con las reglas de pedidos y entregas: el Repository sabe *cómo* guardar un pedido, pero
es `ordersService` quien calcula el `total` (nunca lo manda el cliente), verifica que el `customer`
exista y cierra un pedido `DELIVERED`. Y es `deliveriesService` quien decide que un repartidor debe
tener rol `DRIVER` y estar disponible. Si mañana cambia la base de datos, nada de eso se toca.

El `usersRepository` aplica una proyección que excluye siempre el hash del `password`, así que ninguna
consulta normal puede filtrarlo hacia afuera.

### ¿Por qué separar la generación de mocks del router?

`mocks.routes.js` solo conecta rutas con métodos del controller. `mocks.controller.js` lee `qty` y
`entity` de la query, delega al service y responde. Toda la lógica real vive en dos lugares distintos:

- **`src/mocks/*.mock.js`**: funciones puras que generan un objeto falso con la forma correcta, usando
  las constantes del proyecto. No saben nada de MongoDB ni de reglas de negocio.
- **`mocks.service.js`**: valida `qty`, hashea passwords, resuelve la cascada de dependencias y traduce
  cualquier falla de MongoDB a un `MOCK_GENERATION_ERROR` controlado.

### ¿Por qué un middleware global de errores y un logger centralizado?

Antes, cada controller armaba su propia respuesta de error a mano y el proyecto tenía `console.log`
dispersos, sin clasificar por importancia ni posibilidad de guardarse en archivo.

Ahora los Services lanzan `CustomError` con un código del diccionario, los Controllers están envueltos
en `asyncHandler` (sin `try/catch` repetido), y el middleware global es el único lugar que arma la
respuesta final y decide qué nivel de log corresponde. Con Winston, todo pasa por un único punto de
configuración, los niveles permiten filtrar según el entorno y los errores importantes quedan
persistidos en archivo con rotación. El middleware responde al cliente y el logger registra
internamente: se complementan.

### Notas

- El Controller nunca importa `mongoose` ni los modelos directamente.
- No hay strings sueltos para roles, estados o prioridades: todo pasa por `src/constants/index.js`.
- No hay llamadas a `process.env` fuera de `src/config/env.config.js` (el logger y Swagger leen la configuración a través de ese módulo).
- No hay respuestas de error armadas a mano en controllers: todo pasa por `CustomError` + el middleware global.
- Los endpoints y sus errores documentados en Swagger se probaron manualmente (Swagger UI, navegador, `curl` y Thunder Client), tanto en casos exitosos como inválidos.
- `/api/mocks` y `/api/logger-test` son herramientas de desarrollo, separadas de las rutas de negocio.
- Los archivos de log generados por la aplicación nunca se suben al repositorio.

---

## Próximas etapas

- Comercios, Comprobantes y Documentos
- Autenticación y Autorización
- Testing automatizado
- Seguridad y Escalabilidad

## Autor

Carlos Jonathan Rodriguez Osorio

Proyecto desarrollado como parte del aprendizaje de Programación Backend III — Comisión #96795 — Coderhouse.