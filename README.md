# ShipNow API

API base de **ShipNow**, plataforma orientada a la gestión de operaciones de una empresa de logística.
El proyecto aplica una **arquitectura profesional por capas** (**Controller → Service → Repository**),
con validación de variables de entorno al arranque, un diccionario de
constantes centralizado para roles y estados, un módulo de **mocking** para
generar datos de prueba, y un sistema **centralizado de manejo de errores**.

## 🛠️ Tecnologías utilizadas

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **dotenv**
- **bcryptjs**
- **Nodemon**
- **JavaScript (ES Modules)**

---

## 🏗️ Arquitectura del proyecto

ShipNow utiliza una arquitectura de tres capas, con los errores derivados a un middleware global:

```text
                 HTTP Request
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
                      │                                 │
                      ▼                                 ▼
                    Model                      Respuesta HTTP uniforme
                      │
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
│   │   └── database.config.js
│   │
│   ├── constants/
│   │   └── index.js
│   │
│   ├── errors/
│   │   ├── errorDictionary.js
│   │   └── CustomError.js
│   │
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   └── notFoundHandler.js
│   │
│   ├── utils/
│   │   └── asyncHandler.js
│   │
│   ├── controllers/
│   │   ├── products.controller.js
│   │   ├── users.controller.js
│   │   └── mocks.controller.js
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
│   │   └── mocks.routes.js
│   │
│   ├── app.js
│   └── server.js
│
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

   Si la configuración es correcta, vas a ver un mensaje indicando que MongoDB
   se conectó correctamente y que el servidor está ejecutándose. Si falta
   alguna variable obligatoria (`PORT`, `MONGODB_URI`, `NODE_ENV`), la app
   **no arranca** y muestra un error indicando cuál falta.

## Endpoints

### Productos (`/api/products`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista productos disponibles (`status: AVAILABLE`) |
| GET | `/:id` | Obtiene un producto por id |
| POST | `/` | Crea un producto (valida `name`, `description`, `price`, `stock`) |
| PUT | `/:id` | Actualiza un producto (misma validación que POST, campos opcionales) |
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

Router dedicado a generar datos de prueba. Los `GET` no modifican la base;
`POST /seed` sí inserta datos reales en MongoDB.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/users?qty=10` | Genera `qty` usuarios falsos (`role: CUSTOMER`) sin guardarlos |
| GET | `/drivers?qty=10` | Genera `qty` repartidores falsos (`role: DRIVER`) sin guardarlos |
| GET | `/orders?qty=10` | Genera `qty` pedidos falsos sin guardarlos |
| GET | `/deliveries?qty=10` | Genera `qty` entregas falsas sin guardarlos |
| POST | `/seed?qty=10&entity=users` | Genera e **inserta** `qty` registros reales (`entity`: `users`, `drivers`, `orders` o `deliveries`) |

La generación en cascada sigue vigente: si pedís `orders` o `deliveries` sin
que existan usuarios/pedidos/repartidores previos, el sistema los genera
automáticamente antes de crear lo pedido.

## 🚨 Manejo de errores

Todos los errores esperados de la API pasan por una capa centralizada, en
vez de responderse de forma aislada en cada ruta o controller.

### Cómo viaja un error

```
Service detecta el problema
        ↓
throw new CustomError("CODIGO_DE_ERROR", detalle_opcional)
        ↓
Controller: catch (error) { next(error) }   ← con asyncHandler, esto es automático
        ↓
Middleware global de errores (src/middlewares/errorHandler.js)
        ↓
Respuesta HTTP uniforme
```

Ningún Controller ni Service arma una respuesta HTTP de error directamente.
Todos derivan al middleware global, que es el único lugar que decide el
status code y el formato final de la respuesta.

### Estructura de respuesta

Todo error esperado responde con esta forma:

```json
{
    "status": "error",
    "error": "USER_NOT_FOUND",
    "message": "El usuario solicitado no existe"
}
```

En modo `development` (`NODE_ENV=development`), se agrega un campo `details`
opcional con información adicional para debugging:

```json
{
    "status": "error",
    "error": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": "price no puede ser negativo"
}
```

En `production`, el campo `details` no se incluye, para no exponer
información interna del servidor.

Un error **inesperado** (un bug, una falla de MongoDB no contemplada, etc.)
siempre responde `500` con el código `INTERNAL_SERVER_ERROR`, sin exponer el
mensaje ni el stack trace original del error técnico — ese error sí queda
registrado en la consola del servidor con `console.error`, para poder
investigarlo, pero nunca se lo mostramos tal cual al cliente.

### Diccionario de errores (`src/errors/errorDictionary.js`)

| Código | Status HTTP | Cuándo ocurre |
|---|---|---|
| `USER_NOT_FOUND` | 404 | Se busca/edita/borra un usuario por un id que no existe |
| `USER_ALREADY_EXISTS` | 409 | Se intenta registrar un usuario con un email ya usado |
| `PRODUCT_NOT_FOUND` | 404 | Se busca/edita/borra un producto por un id que no existe |
| `VALIDATION_ERROR` | 400 | Faltan campos obligatorios, o vienen con valores inválidos (ej. `price`/`stock` negativos) |
| `INVALID_MOCK_AMOUNT` | 400 | `qty` no es un entero positivo, o supera el máximo permitido (100) |
| `INVALID_MOCK_ENTITY` | 400 | `entity` en `POST /api/mocks/seed` no es `users`, `drivers`, `orders` ni `deliveries` |
| `MOCK_GENERATION_ERROR` | 500 | Falla la inserción de datos de prueba en MongoDB |
| `ROUTE_NOT_FOUND` | 404 | Se pide una ruta que no existe en la API |
| `INTERNAL_SERVER_ERROR` | 500 | Cualquier error inesperado no contemplado |

> El diccionario también incluye algunos códigos pensados para los módulos de
> Pedidos y Entregas (`ORDER_NOT_FOUND`, `INVALID_ORDER_STATUS`,
> `ORDER_ALREADY_DELIVERED`, `INVALID_USER_ROLE`, etc.), dejados preparados
> para cuando esos módulos tengan endpoints reales de negocio. Hoy ningún
> endpoint los dispara todavía.

### Cómo probar el manejo de errores

Todos estos casos se probaron con Thunder Client:

**Rutas inexistentes**
```
GET /api/ruta-que-no-existe
→ 404 ROUTE_NOT_FOUND
```

**Productos — validaciones**
```
POST /api/products
Body: { "name": "Test", "price": 100, "stock": 5 }   (sin description)
→ 400 VALIDATION_ERROR

PUT /api/products/:id
Body: { "stock": -3 }
→ 400 VALIDATION_ERROR

PUT /api/products/:id
Body: { "price": -50 }
→ 400 VALIDATION_ERROR

GET /api/products/507f1f77bcf86cd799439011   (id válido pero inexistente)
→ 404 PRODUCT_NOT_FOUND
```

**Usuarios**
```
POST /api/users
Body: { "firstName": "Ana" }   (incompleto)
→ 400 VALIDATION_ERROR

POST /api/users   (con el mismo email dos veces)
→ 409 USER_ALREADY_EXISTS

GET /api/users/507f1f77bcf86cd799439011
→ 404 USER_NOT_FOUND
```

**Mocks — cantidad inválida**
```
GET /api/mocks/users?qty=abc
GET /api/mocks/users?qty=-5
GET /api/mocks/users?qty=0
GET /api/mocks/users?qty=500
→ los cuatro devuelven 400 INVALID_MOCK_AMOUNT
```

**Mocks — entidad inválida**
```
POST /api/mocks/seed?qty=5&entity=vehiculos
→ 400 INVALID_MOCK_ENTITY
```

**Casos exitosos (para confirmar que nada se rompió)**
```
GET /api/mocks/orders?qty=3
→ 200

POST /api/mocks/seed?qty=5&entity=deliveries
→ 201, { "insertados": 5, "coleccion": "entregas" }
```

## ¿Por qué separar la lógica entre Service y Repository?

La regla que seguí fue: **el Repository solo sabe "buscar y guardar datos";
el Service sabe "qué significan esos datos para el negocio"**.

En `productsRepository.getAll` no hay ningún filtro fijo: recibe los
criterios de búsqueda como parámetro, y aplica una proyección por defecto
(excluye `__v`) para no exponer campos internos de Mongoose. La decisión de
negocio de "el listado general solo muestra productos con
`status: AVAILABLE`" vive en `productsService.getAllProducts`, porque es una
regla que puede cambiar según el caso de uso, y esa decisión no le
corresponde al Repository.

Lo mismo pasa con el cálculo del `status` de un producto, o con la
validación de que `price`/`stock` no sean negativos: son reglas de negocio,
y viven en `productsService` (compartidas entre `createProduct` y
`updateProduct` a través de una función `validateProductData`, para que
nunca vuelvan a desalinearse entre sí).

## ¿Por qué separar la generación de mocks del router?

`mocks.routes.js` solo conecta rutas con métodos del controller.
`mocks.controller.js` solo lee `qty`/`entity` de la query, delega al service
y responde. Toda la lógica real vive en dos lugares distintos:

- **`src/mocks/*.mock.js`**: funciones puras que solo generan un objeto
  falso con la forma correcta, usando las constantes del proyecto. No saben
  nada de MongoDB ni de reglas de negocio.
- **`mocks.service.js`**: decide qué hacer con esos datos falsos — valida
  `qty`, hashea passwords, resuelve la cascada de dependencias, y traduce
  cualquier falla de MongoDB durante la inserción a un
  `MOCK_GENERATION_ERROR` controlado en vez de dejar pasar el error técnico
  crudo.

## ¿Por qué un middleware global en vez de manejar errores en cada controller?

Antes de este módulo, cada controller tenía su propio `catch (error) { ... }`
armando la respuesta HTTP a mano, repetido de forma casi idéntica en los diez
métodos del proyecto. Eso generaba dos problemas: código repetido, y el
riesgo real de que dos controllers respondieran errores parecidos con
formatos distintos (por ejemplo, uno con `message` y otro con `error`).

Ahora:

- Los Services lanzan `CustomError` con un código del diccionario.
- Los Controllers están envueltos en `asyncHandler` (`src/utils/asyncHandler.js`),
  que atrapa cualquier rechazo de una promesa y llama a `next(error)`
  automáticamente, sin repetir `try/catch` en cada uno.
- El middleware global (`src/middlewares/errorHandler.js`) es el único lugar
  que arma la respuesta final: revisa si el error es un `CustomError`
  conocido (responde con su código y status real) o si es un error inesperado
  (siempre responde `500 INTERNAL_SERVER_ERROR`, sin exponer detalles
  internos, pero registrando el error completo en la consola del servidor).

Esto significa que si mañana queremos cambiar el formato de respuesta de
error de toda la API, se cambia en un solo archivo.

## Notas de diseño

- El Controller nunca importa `mongoose` ni los modelos directamente.
- No hay strings sueltos para roles, estados o prioridades: todo pasa por
  `src/constants/index.js`.
- No hay llamadas a `process.env` fuera de `src/config/env.config.js`.
- No hay respuestas de error armadas a mano en controllers: todo pasa por
  `CustomError` + el middleware global.
- El router `/api/mocks` es una herramienta de desarrollo, separada de las
  rutas reales (`/api/products`, `/api/users`).
- Todo el manejo de errores fue probado de punta a punta con Thunder Client:
  rutas inexistentes, validaciones de Products (create y update), usuarios
  duplicados, recursos inexistentes, y las validaciones del módulo de mocks
  (cantidad y entidad inválidas).

## Próximas etapas

El proyecto ShipNow continuará incorporando funcionalidades relacionadas con una empresa de logística, entre ellas:

- Endpoints reales de negocio para Pedidos y Entregas (hoy solo existen sus modelos y repositories, usados por el módulo de mocking)
- Comercios
- Comprobantes
- Documentos
- Autenticación
- Autorización
- Testing automatizado (unit tests con mocks de las capas)
- Logger y Swagger
- Seguridad
- Escalabilidad

## 👨‍💻 Autor

Carlos Jonathan Rodriguez Osorio

Proyecto desarrollado como parte del aprendizaje de Programación Backend III — Comisión #96795 — Coderhouse.