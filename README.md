# ShipNow API

API base de **ShipNow**, plataforma orientada a la gestión de operaciones de una empresa de logística.
El proyecto aplica una **arquitectura profesional por capas** (**Controller → Service → Repository**),
con validación de variables de entorno al arranque y un diccionario de
constantes centralizado para roles y estados.

## 🛠️ Tecnologías utilizadas

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **dotenv**
- **Nodemon**
- **JavaScript (ES Modules)**

---

## 🏗️ Arquitectura del proyecto

ShipNow utiliza una arquitectura de tres capas:

```text
                 HTTP Request
                      │
                      ▼
                  Routes
                      │
                      ▼
                 Controller
                      │
                      ▼
                   Service
                      │
                      ▼
                 Repository
                      │
                      ▼
                    Model
                      │
                      ▼
                  MongoDB

```

## 📂 Estructura del proyecto

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
| POST | `/` | Crea un producto (valida `name`, `price`, `stock`) |
| PUT | `/:id` | Actualiza un producto (recalcula `status` si cambia el stock) |
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

Router dedicado a generar datos de prueba, separado de las rutas de negocio reales.
Los endpoints `GET` no modifican la base de datos: solo generan objetos en memoria para previsualizar su estructura.
El endpoint `POST /seed` sí inserta datos reales en MongoDB.

Método	Ruta	Descripción
GET	`/users?qty=10`	Genera qty usuarios falsos (role: CUSTOMER) sin guardarlos
GET	`/drivers?qty=10`	Genera qty repartidores falsos (role: DRIVER, isAvailable) sin guardarlos
GET	`/orders?qty=10`	Genera qty pedidos falsos sin guardarlos
GET	`/deliveries?qty=10`	Genera qty entregas falsas sin guardarlos
POST	`/seed?qty=10&entity=users`	Genera e inserta qty registros reales en MongoDB

Parámetros de `POST /seed:`

- qty (opcional, default 10): cantidad a generar. Debe ser un entero entre 1 y 100.
- entity (opcional, default users): qué se genera. Valores válidos: users, drivers, orders, deliveries.

Generación en cascada: los pedidos necesitan un usuario real (customer) y las entregas necesitan un pedido real (order) y, opcionalmente, un repartidor (driver).
Si pedís `POST /seed?entity=orders o ?entity=deliveries` y todavía no hay usuarios/pedidos/repartidores cargados en la base, el sistema los genera automáticamente
antes de crear lo que pediste, para no romper la relación. Por ejemplo, pedir 5 entregas en una base vacía puede terminar generando también 3 usuarios, 3 pedidos
y 2 repartidores como paso previo — vas a ver esto reflejado en la consola del servidor con mensajes como [mocks] No había pedidos, se generaron 3 automáticamente.

Validaciones: qty debe ser un entero mayor a 0 y menor o igual a 100 (devuelve 400 si no); entity debe ser uno de los cuatro valores válidos
(devuelve 400 con el listado de valores permitidos si no).

Ejemplos:

# Generar 5 usuarios falsos sin guardarlos (solo para ver la estructura)
`GET http://localhost:3000/api/mocks/users?qty=5`

# Insertar 10 usuarios reales en MongoDB
`POST http://localhost:3000/api/mocks/seed?qty=10&entity=users`
# → { "insertados": 10, "coleccion": "usuarios" }

# Insertar 5 repartidores reales
`POST http://localhost:3000/api/mocks/seed?qty=5&entity=drivers`
# → { "insertados": 5, "coleccion": "repartidores" }

# Insertar 8 pedidos reales
`POST http://localhost:3000/api/mocks/seed?qty=8&entity=orders`
# → { "insertados": 8, "coleccion": "pedidos" }

# Insertar 5 entregas reales
`POST http://localhost:3000/api/mocks/seed?qty=5&entity=deliveries`
# → { "insertados": 5, "coleccion": "entregas" }


## ¿Por qué separar la lógica entre Service y Repository?

La regla que seguí fue: **el Repository solo sabe "buscar y guardar datos";
el Service sabe "qué significan esos datos para el negocio"**.

En `productsRepository.getAll` no hay ningún filtro fijo: recibe los
criterios de búsqueda como parámetro. La decisión de negocio de "el listado
general solo muestra productos con `status: AVAILABLE`" vive en
`productsService.getAllProducts`, porque es una regla que puede cambiar según
el caso de uso (por ejemplo, una vista de administración podría necesitar ver
también los productos sin stock), y esa decisión no le corresponde al
Repository.

Lo mismo pasa con el cálculo del `status` de un producto: el Repository sabe
*cómo* guardar o actualizar el documento en MongoDB, pero no sabe *cuándo* un
producto pasa a estar `OUT_OF_STOCK`. Esa regla vive en el Service
(`createProduct` y `updateProduct`), tanto al crear un producto como al
modificarle el stock. Si el día de mañana cambia la lógica de negocio (o
incluso la base de datos), no hace falta tocar la capa de acceso a datos.

En Usuarios aplica el mismo criterio con los roles: nadie puede
auto-asignarse el rol `ADMIN` al registrarse, y esa validación vive en
`usersService.createUser`, no en el Repository ni en el modelo. El hash de la
contraseña con `bcryptjs` también se hace en el Service, antes de delegarle
al Repository el simple trabajo de guardar el documento.

El Controller, por su parte, nunca importa Mongoose ni conoce estas reglas:
solo traduce el request HTTP a una llamada al Service, y el resultado (o el
error, vía `error.statusCode`) a una respuesta HTTP con el status code
correspondiente (`400` en validaciones, `404` si el recurso no existe, `409`
si un email ya está registrado).

## Notas de diseño

- El Controller nunca importa `mongoose` ni los modelos directamente.
- No hay strings sueltos para roles o estados: todo pasa por
  `src/constants/index.js` (`USER_ROLES`, `PRODUCT_STATUS`).
- No hay llamadas a `process.env` fuera de `src/config/env.config.js`.
- Los errores de negocio se propagan con `error.statusCode`, y es el
  Controller quien lo lee para devolver el status HTTP apropiado.
- El router /api/mocks es una herramienta de desarrollo, no una funcionalidad
  de negocio para usuarios finales: está separado de las rutas reales 
  `(/api/products, /api/users)` a propósito.
- Repository, Service y el módulo de mocking fueron probados de punta
  a punta con Thunder Client, incluyendo la cascada completa de dependencias
  `(usuarios → pedidos → repartidores → entregas)` partiendo de una base vacía.

## Próximas etapas

El proyecto ShipNow continuará incorporando funcionalidades relacionadas con una empresa de logística, entre ellas:

- Comercios
- Comprobantes
- Documentos
- Autenticación
- Autorización
- Testing automatizado (unit tests con mocks de las capas)
- Seguridad
- Escalabilidad

## 👨‍💻 Autor

`Carlos Jonathan Rodriguez Osorio`

Proyecto desarrollado como parte del aprendizaje de Programación Backend III — Comisión #96795 — Coderhouse.