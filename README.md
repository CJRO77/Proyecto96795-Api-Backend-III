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
- **Multer** | Recibe, valida y almacena archivos enviados mediante `multipart/form-data` |
- **Winston** + **winston-daily-rotate-file**
- **swagger-jsdoc** + **swagger-ui-express**
- **Nodemon**
- **JavaScript (ES Modules)**
- **Mocha** | Organiza y ejecuta los tests (`describe`, `it` y los hooks `before`/`beforeEach`/`after`) |
- **Chai** | Valida los resultados (`expect(...)`) |
- **Supertest** | Hace las peticiones HTTP a la app de Express, sin abrir un puerto |
- **cross-env** | Define `NODE_ENV=test` de forma que funcione igual en Windows, Mac y Linux |

## Índice

- [Configuración y ejecución](#configuración-y-ejecución)
- [Documentación interactiva (Swagger)](#documentación-interactiva-swagger)
- [Endpoints](#endpoints)
- [Carga de archivos (Multer)](#carga-de-archivos-multer)
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

### Requisitos previos

- Node.js y npm instalados.
- Una instancia de MongoDB local o una base de datos MongoDB Atlas.
- Git para clonar el repositorio.

### Instalación

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

4. Configurar las variables de entorno según el ambiente de ejecución.

### Variables de entorno

ShipNow utiliza variables de entorno para separar la configuración del código y evitar almacenar credenciales directamente en el repositorio.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | Sí | Puerto donde escucha la API. Debe ser un número entero entre 1 y 65535. |
| `MONGODB_URI` | Sí | URI de conexión a MongoDB. Debe utilizar `mongodb://` o `mongodb+srv://`. |
| `NODE_ENV` | Sí | Entorno de ejecución: `development`, `test` o `production`. |
| `LOG_LEVEL` | No | Nivel mínimo de registro de Winston. Si no se define, utiliza `debug` en desarrollo e `info` en producción. |

El archivo `.env.example` contiene una configuración inicial para desarrollo:

```env
PORT=3000
MONGODB_URI=mongodb://localhost/shipnow
NODE_ENV=development
LOG_LEVEL=debug
```

### Entornos de ejecución

**Desarrollo (`development`)**

Utiliza el archivo `.env`.

```env
PORT=3000
MONGODB_URI=mongodb://localhost/shipnow
NODE_ENV=development
LOG_LEVEL=debug
```

Iniciar el servidor:

```bash
npm run dev
```

Nodemon reinicia automáticamente la aplicación cuando detecta cambios en los archivos.

**Testing (`test`)**

Utiliza el archivo `.env.test`, creado a partir de `.env.test.example`:

```bash
cp .env.test.example .env.test
```

Configurar una base de datos exclusiva para las pruebas:

```env
PORT=3001
MONGODB_URI=mongodb://localhost/shipnow_test
NODE_ENV=test
```

Ejecutar la suite:

```bash
npm test
```

El script de testing establece `NODE_ENV=test` mediante `cross-env` y carga la configuración de `.env.test`.

**Producción (`production`)**

En producción se debe establecer `NODE_ENV=production` y proporcionar las variables necesarias mediante el entorno de despliegue o un gestor seguro de variables.

Ejemplo de configuración:

```env
PORT=3000
MONGODB_URI=tu_uri_de_mongodb
NODE_ENV=production
LOG_LEVEL=info
```

No se deben utilizar credenciales de ejemplo ni almacenar archivos `.env` con datos reales en el repositorio.

En este entorno, Winston utiliza `info` como nivel mínimo predeterminado y no muestra registros en consola.

### Validación de configuración

Al iniciar, la aplicación comprueba las variables obligatorias y valida:

- Que `PORT` sea un número entero entre 1 y 65535.
- Que `MONGODB_URI` tenga un formato válido de conexión a MongoDB.
- Que `NODE_ENV` corresponda a uno de los entornos permitidos.
- Que `LOG_LEVEL`, si está definido, corresponda a uno de los niveles admitidos por Winston.

Si una variable obligatoria falta o contiene un valor inválido, la aplicación interrumpe el arranque y muestra el error correspondiente.

### Archivos de configuración

| Archivo | Propósito |
|---|---|
| `.env.example` | Plantilla de configuración para desarrollo y referencia para producción. |
| `.env.test.example` | Plantilla de configuración para testing. |
| `.env` | Variables locales de desarrollo. No se sube a GitHub. |
| `.env.test` | Variables locales de testing. No se sube a GitHub. |

Los archivos `.env` y `.env.test` están excluidos del repositorio mediante `.gitignore`.
En GitHub solamente deben publicarse los archivos de ejemplo, sin credenciales reales.

---

## Docker y despliegue

ShipNow incluye una configuración de Docker para ejecutar la API en un entorno de producción junto con MongoDB.

### Arquitectura de contenedores

La aplicación utiliza Docker Compose para administrar dos servicios:

| Servicio | Descripción |
|---|---|
| `api` | Ejecuta la API ShipNow mediante Node.js 24 sobre Alpine Linux. |
| `mongodb` | Ejecuta MongoDB 8 y almacena los datos de la aplicación. |

La API espera a que MongoDB supere su comprobación de salud (`healthcheck`) antes de iniciar, evitando intentar conectarse a una base de datos que todavía no está disponible.

### Características del Dockerfile

El Dockerfile utiliza una construcción de dos etapas:

1. **production-deps:** instala únicamente las dependencias necesarias para producción mediante `npm ci --omit=dev`.
2. **runtime:** construye la imagen final, copia el código fuente y las dependencias de producción, y ejecuta la aplicación con el usuario no privilegiado `node`.

La imagen expone el puerto `3000`.

### Ejecución con Docker Compose

Con Docker y Docker Compose instalados, ejecutar desde la raíz del proyecto:

```bash
docker compose up --build -d
```

Este comando construye la imagen de la API e inicia los contenedores de ShipNow y MongoDB.

Para consultar el estado de los servicios:

```bash
docker compose ps
```

Para consultar los registros:

```bash
docker compose logs -f api
```

Para detener los servicios:

```bash
docker compose down
```

Los datos de MongoDB y los archivos de uploads y logs se conservan mediante volúmenes persistentes.

Para detener los servicios y eliminar también los volúmenes y sus datos:

```bash
docker compose down -v
```

**Atención:** este último comando elimina los datos persistidos de MongoDB, uploads y logs.

### Variables de entorno en Docker

Docker Compose configura las siguientes variables para el contenedor de la API:

| Variable | Valor en Docker Compose | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto interno de la API. |
| `MONGODB_URI` | `mongodb://mongodb:27017/shipnow` | Conexión con el servicio MongoDB dentro de la red de Docker. |
| `NODE_ENV` | `production` | Entorno de ejecución. |

No se incluyen credenciales reales ni archivos `.env` dentro de la imagen.

### Health Check

La API dispone de un endpoint para comprobar su estado y la conexión con MongoDB:

```http
GET /health
```

Con Docker en ejecución, se puede consultar desde el navegador o mediante:

```bash
curl http://localhost:3000/health
```

La respuesta incluye:

- `status`: estado general (`healthy` o `unhealthy`).
- `environment`: entorno de ejecución.
- `uptime`: tiempo de actividad de la aplicación.
- `timestamp`: fecha y hora de la comprobación.
- `database`: estado de la conexión con MongoDB.

La API responde con:

- **HTTP 200:** cuando MongoDB está conectado.
- **HTTP 503:** cuando MongoDB no está conectado.

Docker Compose también incorpora un `healthcheck` para MongoDB, que verifica su disponibilidad mediante `mongosh` antes de iniciar la API.

### Persistencia y archivos excluidos

Docker Compose define tres volúmenes:

| Volumen | Contenido |
|---|---|
| `mongodb_data` | Datos persistentes de MongoDB. |
| `uploads_data` | Archivos recibidos mediante Multer. |
| `logs_data` | Archivos de registro generados por Winston. |

El archivo `.dockerignore` excluye del contexto de construcción:

- `node_modules/`
- `.env` y archivos de entorno locales.
- `logs/` y `uploads/`.
- `tests/` y `coverage/`.
- Archivos y directorios de Git.

Esto evita copiar dependencias locales, información sensible y archivos innecesarios a la imagen de producción.


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

| Tag            | Qué documenta                                                             |
| -------------- | ------------------------------------------------------------------------- |
| **Users**      | Registro, consulta, actualización, baja de usuarios y carga de documentos |
| **Products**   | Catálogo de productos (CRUD)                                              |
| **Orders**     | Alta y consulta de pedidos, y cambio de estado                            |
| **Deliveries** | Alta y consulta de entregas, cambio de estado y carga de comprobantes     |
| **Mocks**      | Herramienta de desarrollo: generación de datos de prueba                  |
| **Logger**     | Herramienta de desarrollo: validación del sistema de logs                 |

Cada endpoint documenta método HTTP, ruta, descripción, parámetros de ruta y de query, body esperado,
respuesta exitosa y los errores que la API puede devolver. Los endpoints de carga documentan el envío `multipart/form-data`. Hay **schemas reutilizables** para usuario,
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
- `Mocks` y `Logger` son herramientas internas de desarrollo y testing, no funcionalidades de negocio.
- Los endpoints `/api/mocks` y `/api/logger-test` están habilitados únicamente en los entornos `development` y `test`. En `production` no se registran en Express.
- En producción, Swagger también excluye la documentación de los módulos `Mocks` y `Logger`.
- El campo `details` de los errores solo aparece cuando `NODE_ENV` no es `production`.
- Si se envía un body que no es un JSON válido a cualquier endpoint que reciba body, la respuesta es `400 VALIDATION_ERROR`.

---

## Endpoints

La referencia completa, con ejemplos y respuestas, está en Swagger (`/api/docs`). Resumen:

### Usuarios (`/api/users`)

| Método | Ruta             | Descripción                                                                                                       |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| GET    | `/?page=&limit=` | Lista usuarios con paginación (nunca incluye el password)                                                         |
| GET    | `/:id`           | Obtiene un usuario por id                                                                                         |
| POST   | `/`              | Registra un usuario (password hasheado con bcrypt, rol siempre `USER`)                                            |
| PUT    | `/:id`           | Actualiza un usuario                                                                                              |
| DELETE | `/:id`           | Elimina un usuario                                                                                                |
| POST   | `/:id/documents` | Carga un documento del usuario (`multipart/form-data`, campo `document`, tipo `USER_DOCUMENT` o `DRIVER_LICENSE`) |

### Productos (`/api/products`)

| Método | Ruta   | Descripción                                                       |
| ------ | ------ | ----------------------------------------------------------------- |
| GET    | `/`    | Lista productos disponibles (`status: AVAILABLE`)                 |
| GET    | `/:id` | Obtiene un producto por id                                        |
| POST   | `/`    | Crea un producto (valida `name`, `description`, `price`, `stock`) |
| PUT    | `/:id` | Actualiza un producto                                             |
| DELETE | `/:id` | Elimina un producto                                               |

### Pedidos (`/api/orders`)

| Método | Ruta          | Descripción                                                                |
| ------ | ------------- | -------------------------------------------------------------------------- |
| GET    | `/?status=&page=&limit=` | Lista pedidos con paginación y filtro opcional por estado       |
| GET    | `/:id`        | Obtiene un pedido por id                                                   |
| POST   | `/`           | Crea un pedido para un usuario existente (el total lo calcula el servidor) |
| PATCH  | `/:id/status` | Cambia el estado del pedido (un pedido `DELIVERED` queda cerrado)          |

### Entregas (`/api/deliveries`)

| Método | Ruta          | Descripción                                                            |
| ------ | ------------- | ---------------------------------------------------------------------- |
| GET    | `/?status=&page=&limit=` | Lista entregas con paginación y filtro opcional por estado  |
| GET    | `/:id`        | Obtiene una entrega por id                                             |
| POST   | `/`           | Crea una entrega para un pedido existente, con repartidor opcional     |
| PATCH  | `/:id/status` | Cambia el estado de la entrega                                         |
| POST   | `/:id/proof`  | Carga el comprobante de entrega (`multipart/form-data`, campo `proof`) |

### Mocking (`/api/mocks`)

| Método | Ruta                        | Descripción                                                                           |
| ------ | --------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/users?qty=10`             | Genera usuarios falsos sin guardarlos                                                 |
| GET    | `/drivers?qty=10`           | Genera repartidores falsos sin guardarlos                                             |
| GET    | `/orders?qty=10`            | Genera pedidos falsos sin guardarlos                                                  |
| GET    | `/deliveries?qty=10`        | Genera entregas falsas sin guardarlos                                                 |
| POST   | `/seed?qty=10&entity=users` | Inserta `qty` registros reales (`entity`: `users`, `drivers`, `orders`, `deliveries`) |

### Logger de prueba (`/api/logger-test`)

| Método | Ruta | Descripción                                                                                       |
| ------ | ---- | ------------------------------------------------------------------------------------------------- |
| GET    | `/`  | Dispara un log de cada uno de los 6 niveles. Herramienta interna, no es funcionalidad de negocio. |

### Paginación y rendimiento

Los endpoints de listado de **usuarios, pedidos y entregas** implementan paginación para evitar devolver todos los registros de la base de datos en una sola respuesta.

La paginación utiliza los parámetros `page` y `limit` enviados mediante la URL.

#### Parámetros disponibles

| Parámetro | Valor predeterminado | Descripción                                                                   |
| --------- | -------------------- | ----------------------------------------------------------------------------- |
| `page`    | `1`                  | Número de página solicitada. Debe ser un entero mayor o igual a 1.            |
| `limit`   | `10`                 | Cantidad máxima de registros por página. Debe ser un entero entre 1 y 100.    |
| `status`  | Sin filtro           | Filtro opcional por estado. Disponible en los listados de pedidos y entregas. |

#### Ejemplos de consultas

```http
GET /api/users?page=1&limit=10
GET /api/orders?page=2&limit=5&status=CREATED
GET /api/deliveries?page=1&limit=20&status=DELIVERED
```

Si no se envían `page` ni `limit`, la API utiliza los valores predeterminados: página 1 y 10 registros por página.

#### Formato de respuesta

Las respuestas incluyen los registros solicitados dentro de `payload` y un objeto `pagination` con información sobre el resultado:

```json
{
  "status": "success",
  "payload": [],
  "pagination": {
    "page": 2,
    "limit": 5,
    "totalPages": 4,
    "totalOrders": 20
  }
}
```

El campo de total cambia según el recurso consultado:

- `totalUsers`: cantidad total de usuarios.
- `totalOrders`: cantidad total de pedidos.
- `totalDeliveries`: cantidad total de entregas.

`totalPages` indica la cantidad de páginas disponibles según el total de registros y el límite solicitado.

#### Funcionamiento interno

La implementación distribuye las responsabilidades entre las capas de la arquitectura:

- **Controller:** obtiene los parámetros de la URL y los convierte a valores numéricos.
- **Service:** valida que `page` y `limit` sean enteros positivos y que `limit` no supere 100.
- **Repository:** utiliza `skip()` y `limit()` de Mongoose para recuperar solamente los registros de la página solicitada. También utiliza `countDocuments()` para calcular el total de registros que coinciden con los filtros.

Los listados se ordenan por fecha de creación, del más reciente al más antiguo.

Si los parámetros son inválidos, la API responde con un error de validación en lugar de ejecutar una consulta con valores incorrectos.

---

## Carga de archivos (Multer)

ShipNow permite asociar documentos a usuarios y comprobantes a entregas mediante solicitudes
`multipart/form-data`. La recepción y el almacenamiento físico se gestionan con **Multer**.

### Reglas de carga

- Formatos admitidos: **PDF, JPEG y PNG**.
- Tamaño máximo: **5 MB** por archivo.
- Se valida el MIME type, la extensión y la firma interna del archivo.
- Cada archivo recibe un nombre único generado con `randomUUID()`.
- Los metadatos se guardan en MongoDB; el contenido del archivo se almacena en el servidor.
- Los archivos se organizan en `uploads/users/` y `uploads/deliveries/proofs/`.
- La carpeta `uploads/` está excluida de Git mediante `.gitignore`; no se deben subir documentos reales al repositorio.

### Cargar un documento de usuario

```
POST /api/users/:id/documents
```

Enviar el body como `multipart/form-data` con estos campos:

| Campo      | Tipo    | Descripción                        |
| ---------- | ------- | ---------------------------------- |
| `document` | Archivo | PDF, JPEG o PNG de hasta 5 MB      |
| `type`     | Texto   | `USER_DOCUMENT` o `DRIVER_LICENSE` |

La API verifica que el usuario exista y que el tipo de documento sea válido. Luego guarda los metadatos
del archivo en el usuario correspondiente.

### Cargar un comprobante de entrega

```
POST /api/deliveries/:id/proof
```

Enviar el body como `multipart/form-data` con:

| Campo   | Tipo    | Descripción                   |
| ------- | ------- | ----------------------------- |
| `proof` | Archivo | PDF, JPEG o PNG de hasta 5 MB |

La API verifica que la entrega exista y asocia a ella los metadatos del comprobante.

### Metadatos almacenados

MongoDB guarda el nombre original, nombre generado, ruta relativa, MIME type, tamaño y fecha de carga.
El archivo físico **no** se almacena dentro de MongoDB.

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

| Código                    | Status | Cuándo ocurre                                                                       |
| ------------------------- | ------ | ----------------------------------------------------------------------------------- |
| `USER_NOT_FOUND`          | 404    | Un usuario no existe (por id, o como `customer`/`driver` de un pedido/entrega)      |
| `USER_ALREADY_EXISTS`     | 409    | Se registra un usuario con un email ya usado                                        |
| `INVALID_USER_ROLE`       | 400    | El usuario indicado como `driver` no tiene rol `DRIVER`                             |
| `PRODUCT_NOT_FOUND`       | 404    | Un producto no existe                                                               |
| `ORDER_NOT_FOUND`         | 404    | Un pedido no existe                                                                 |
| `ORDER_ITEMS_REQUIRED`    | 400    | Se crea un pedido sin items                                                         |
| `INVALID_ORDER_STATUS`    | 400    | El estado de pedido enviado (en el body o en el filtro) no es válido                |
| `ORDER_ALREADY_DELIVERED` | 409    | Se intenta modificar un pedido ya entregado                                         |
| `DELIVERY_NOT_FOUND`      | 404    | Una entrega no existe                                                               |
| `FILE_REQUIRED`           | 400    | No se envió el archivo obligatorio                                                  |
| `INVALID_FILE_TYPE`       | 400    | El archivo no es PDF, JPEG o PNG válido (se valida MIME, extensión y firma interna) |
| `FILE_TOO_LARGE`          | 413    | El archivo supera el límite de 5 MB                                                 |
| `INVALID_FILE_FIELD`      | 400    | El nombre del campo de archivo no es el esperado                                    |
| `INVALID_DOCUMENT_TYPE`   | 400    | El tipo de documento de usuario no es válido                                        |
| `UPLOAD_ERROR`            | 500    | Ocurrió un error al procesar o asociar el archivo                                   |
| `INVALID_DELIVERY_STATUS` | 400    | El estado de entrega enviado (en el body o en el filtro) no es válido               |
| `DRIVER_NOT_AVAILABLE`    | 409    | El repartidor indicado no está disponible                                           |
| `INVALID_MOCK_AMOUNT`     | 400    | `qty` no es un entero positivo, o supera el máximo permitido (100)                  |
| `INVALID_MOCK_ENTITY`     | 400    | `entity` de `POST /api/mocks/seed` no es una de las permitidas                      |
| `MOCK_GENERATION_ERROR`   | 500    | Falla la inserción de datos de prueba en MongoDB                                    |
| `VALIDATION_ERROR`        | 400    | Faltan campos obligatorios, hay valores inválidos, o el body no es un JSON válido   |
| `INVALID_ID`              | 400    | Un id enviado no tiene formato de ObjectId                                          |
| `ROUTE_NOT_FOUND`         | 404    | Se pide una ruta que no existe                                                      |
| `INTERNAL_SERVER_ERROR`   | 500    | Cualquier error inesperado                                                          |

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

**Carga de archivos**

```
POST /api/users/:id/documents sin archivo                          → 400 FILE_REQUIRED
POST /api/users/:id/documents con tipo inválido                    → 400 INVALID_DOCUMENT_TYPE
POST /api/deliveries/:id/proof con entrega inexistente             → 404 DELIVERY_NOT_FOUND
Archivo que no es PDF/JPEG/PNG válido                              → 400 INVALID_FILE_TYPE
Archivo de más de 5 MB                                             → 413 FILE_TOO_LARGE
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

ShipNow utiliza **Winston** como sistema de logging centralizado (`src/config/logger.config.js`), para registrar los eventos importantes de la aplicación y evitar el uso de `console.log()` dispersos por el código.

### Niveles de registro

De menor a mayor gravedad: `debug` → `http` → `info` → `warning` → `error` → `fatal`.

| Nivel     | Cuándo se utiliza en el proyecto                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `debug`   | Información técnica detallada. Se utiliza en `/api/logger-test` para comprobar el funcionamiento del logger.                                   |
| `http`    | Registra automáticamente las solicitudes que ingresan a la API mediante el middleware `httpLogger`.                                            |
| `info`    | Eventos normales de la aplicación: servidor iniciado, conexión con MongoDB y operaciones de creación, actualización o eliminación de recursos. |
| `warning` | Situaciones esperadas que requieren atención, como errores de negocio (400, 404, 409) y rutas inexistentes.                                    |
| `error`   | Errores graves (500) y errores inesperados. Puede incluir información técnica y el `stack trace` en los registros internos.                    |
| `fatal`   | Errores críticos que impiden continuar la ejecución, como una falla de conexión con MongoDB durante el arranque.                               |

### Configuración según el entorno

El comportamiento del logger depende de `NODE_ENV` y de la variable opcional `LOG_LEVEL`.

- **`NODE_ENV=development`**: por defecto utiliza `debug` como nivel mínimo. Muestra los registros en consola y los almacena en archivos.
- **`NODE_ENV=production`**: por defecto utiliza `info` como nivel mínimo. No muestra registros en consola; los almacena en archivos.
- **`NODE_ENV=test`**: el logger queda silenciado y no utiliza transportes de consola ni de archivos, evitando generar registros durante las pruebas.

La variable `LOG_LEVEL` permite modificar el nivel mínimo de registro. Si no se define, se utiliza `debug` en desarrollo e `info` en producción.

Por ejemplo:

```env
LOG_LEVEL=debug
```

### Persistencia de los registros

Fuera del entorno de testing, Winston utiliza dos archivos dentro de la carpeta `logs/`:

| Archivo             | Contenido                                                                   |
| ------------------- | --------------------------------------------------------------------------- |
| `logs/error.log`    | Registros de nivel `error` y `fatal`.                                       |
| `logs/combined.log` | Registros de todos los niveles habilitados por la configuración del logger. |

El nivel mínimo configurado determina qué registros se generan. Por ejemplo, en producción, con el nivel predeterminado `info`, no se registran los niveles `http` ni `debug`.

La carpeta `logs/` se genera durante la ejecución y está excluida del repositorio mediante `.gitignore`. Los archivos de registro no deben subirse a GitHub.

### Cómo probar el logger

1. Levantar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

2. Consultar el endpoint de prueba:

   ```http
   GET http://localhost:3000/api/logger-test
   ```

3. La API responde con HTTP `200` y genera un registro de cada uno de los seis niveles.

4. Revisar la consola: deberían aparecer los registros con fecha, nivel y colores.

5. Revisar la carpeta `logs/`:
   - `combined.log` debe contener los registros generados.
   - `error.log` debe contener solamente los registros `error` y `fatal`.

6. También se puede comprobar el registro de eventos reales:
   - `GET /api/no-existe` → genera un `warning` (`ROUTE_NOT_FOUND`).
   - `GET /api/mocks/users?qty=-5` → genera un `warning` (`INVALID_MOCK_AMOUNT`).
   - `POST /api/products` con datos válidos → genera un `info` por la creación del producto.

**Importante:** `/api/logger-test` es una herramienta interna disponible en desarrollo y testing. No se encuentra habilitada en producción.

---

## Testing

ShipNow cuenta con una suite de pruebas funcionales que verifica el comportamiento de los endpoints reales, incluyendo rutas, controllers, services, repositories y MongoDB. Las pruebas realizan solicitudes HTTP y comprueban tanto los casos exitosos como los errores.

### Herramientas

| Herramienta   | Para qué se utiliza                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| **Mocha**     | Organiza y ejecuta los tests mediante `describe`, `it` y los hooks `before`, `beforeEach` y `after`. |
| **Chai**      | Comprueba los resultados mediante aserciones como `expect(...)`.                                     |
| **Supertest** | Realiza solicitudes HTTP a la aplicación Express sin necesidad de abrir un puerto manualmente.       |
| **cross-env** | Define `NODE_ENV=test` de forma compatible con Windows, macOS y Linux.                               |

La aplicación se importa desde `src/app.js`, que exporta Express sin iniciar el servidor. El método `listen` se ejecuta únicamente desde `src/server.js`.
Esta separación permite probar la aplicación sin levantar un servidor HTTP independiente.

### Preparar el entorno de testing

Las pruebas utilizan una base de datos exclusiva para testing, separada de la base de desarrollo. Puede estar alojada en el mismo cluster de MongoDB Atlas, siempre que tenga un nombre diferente y permisos de conexión adecuados.

1. Instalar las dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env.test` a partir del ejemplo:

   ```bash
   cp .env.test.example .env.test
   ```

3. Completar `.env.test` con los datos de conexión y el nombre de una base de testing:

   ```env
   PORT=3001
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/shipnow_test
   NODE_ENV=test
   ```

El archivo `.env.test` está excluido de Git mediante `.gitignore`. En el repositorio solamente se incluye `.env.test.example`, sin credenciales reales.

### Variables necesarias para testing

| Variable      | Valor          | Descripción                                                                                                   |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`    | `test`         | Activa el entorno de pruebas y permite cargar `.env.test`.                                                    |
| `MONGODB_URI` | URI de MongoDB | Debe apuntar a una base exclusiva cuyo nombre contenga `test`, por ejemplo `shipnow_test`.                    |
| `PORT`        | `3001`         | Puerto requerido por la validación de configuración. Supertest no necesita abrirlo para ejecutar las pruebas. |

### Ejecutar los tests

Para ejecutar toda la suite:

```bash
npm test
```

Para ejecutar solamente las pruebas de pedidos:

```bash
npm test -- --grep "Orders API"
```

El script `test` configura `NODE_ENV=test` mediante `cross-env`, carga la configuración de testing y ejecuta Mocha con el archivo de preparación global.

### Estructura de testing

```text
tests/
├── fixtures/                  ← archivos de prueba, como el PDF utilizado en las cargas.
├── tools/
│   └── swagger-coverage.js    ← herramienta opcional para verificar cobertura de Swagger.
├── setup.js                   ← conexión, limpieza global y protección de la base de datos.
├── helpers.js                 ← fábricas de datos y funciones de aserción.
├── app.test.js                ← configuración y comportamiento de la aplicación Express.
├── users.test.js
├── products.test.js
├── orders.test.js
├── deliveries.test.js
├── uploads.test.js
├── mocks.test.js
├── logger.test.js
├── docs.test.js
├── health.test.js             ← disponibilidad y respuesta del endpoint de salud.
├── general.test.js
└── server-errors.test.js
```

### Módulos cubiertos

| Archivo                 | Qué se comprueba                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `users.test.js`         | Listado, creación, consulta, actualización, eliminación, protección de datos sensibles y paginación.                            |
| `products.test.js`      | Operaciones CRUD y cálculo automático del estado según el stock.                                                                |
| `orders.test.js`        | Listado, filtros, paginación, creación, consulta por ID y actualización de estados.                                             |
| `deliveries.test.js`    | Listado, filtros, paginación, creación con y sin repartidor, consulta y actualización de estados.                               |
| `uploads.test.js`       | Carga de documentos y comprobantes, archivos obligatorios, formatos, firma interna, límite de tamaño y validaciones de negocio. |
| `mocks.test.js`         | Generación de usuarios, repartidores, pedidos y entregas, además de inserción y generación en cascada.                          |
| `logger.test.js`        | Endpoint de prueba y configuración de los niveles y transportes del logger.                                                     |
| `docs.test.js`          | Disponibilidad de Swagger y coherencia entre la documentación y la API.                                                         |
| `general.test.js`       | Comportamiento general de la API y rutas inexistentes.                                                                          |
| `server-errors.test.js` | Manejo de errores inesperados en operaciones que interactúan con la base de datos.                                              |
| `app.test.js`           | Funcionamiento general de la API, acceso a Swagger, logger, rutas inexistentes y validaciones de los mocks.                     |
| `health.test.js`        | Estado de salud de la API, conexión con MongoDB, información del servicio y protección de credenciales.                         |

**Último resultado verificado:** 231 pruebas exitosas (`231 passing`), sin fallos. Resultado de la última ejecución completa de la suite.

### Qué valida cada test

Las pruebas no se limitan a comprobar que un endpoint responde correctamente. También verifican:

- El **status HTTP** correspondiente a cada operación.
- La **estructura de las respuestas**: `{ status: "success", payload }` en los casos exitosos y `{ status: "error", error, message }` en los errores.
- Los **datos devueltos**, incluyendo propiedades importantes y ausencia de información sensible, como el hash del password y el campo `__v`.
- Las **reglas de negocio**, como el cálculo del total de un pedido, sus estados y la disponibilidad de los repartidores.
- Los **efectos sobre MongoDB**, comprobando que las operaciones exitosas persistan correctamente y que los errores no produzcan modificaciones indebidas.
- La **paginación**, incluyendo separación de resultados entre páginas, límites y metadatos.
- La **carga de archivos**, incluyendo formatos permitidos, tamaño máximo, firma interna y asociación de metadatos a los recursos correspondientes.

**Casos exitosos:** listados, filtros, paginación, creación, consultas por ID, actualizaciones, generación de mocks, documentación, logging y cargas válidas de archivos.

**Casos de error:** datos incompletos, JSON inválido, identificadores incorrectos, recursos inexistentes, estados inválidos, reglas de negocio incumplidas, cantidades inválidas en mocks, rutas inexistentes, errores inesperados y archivos inválidos o demasiado grandes.

### Datos de prueba y limpieza

- **Datos controlados:** cada prueba crea los registros que necesita mediante las funciones de `tests/helpers.js`, como `createUser`, `createOrder` y `createDelivery`.
- **Limpieza:** el hook global `beforeEach`, definido en `tests/setup.js`, elimina los registros de las colecciones antes de cada test. Esto evita dependencias entre pruebas y permite ejecutar la suite repetidamente.
- **Base de datos protegida:** la suite comprueba que `NODE_ENV` sea `test` y que el nombre de la base contenga `test`, sin aceptar una base llamada únicamente `test`. Si no se cumplen estas condiciones, las pruebas no comienzan.
- **Logger:** durante el testing permanece silenciado y no genera archivos de registro.

### Problemas frecuentes

| Mensaje                                                    | Qué hacer                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `[tests] NODE_ENV es "...", no "test"`                     | Ejecutar `npm test` en lugar de utilizar `npx mocha` directamente.                         |
| `[tests] La base de datos "..." no es válida para testing` | Revisar `MONGODB_URI` en `.env.test` y utilizar un nombre como `shipnow_test`.             |
| `Falta la variable de entorno obligatoria`                 | Crear y completar `.env.test` a partir de `.env.test.example`.                             |
| Timeout en el hook `before`                                | Revisar la URI de MongoDB y comprobar que la IP esté autorizada en Atlas (Network Access). |

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
│   │   ├── multer.config.js
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
├── uploads/                       ← almacena los archivos cargados; excluida de Git
├── *.log                          ← archivos de log; excluidos de Git
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

Lo mismo pasa con las reglas de pedidos y entregas: el Repository sabe _cómo_ guardar un pedido, pero
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

### ¿Por qué centralizar la carga de archivos con Multer?

La configuración de `src/config/multer.config.js` concentra el almacenamiento, los nombres únicos,
los formatos admitidos, el límite de tamaño y las validaciones de los archivos. Los Services verifican
las reglas del negocio (por ejemplo, que exista el usuario o la entrega) y guardan únicamente los
metadatos en MongoDB. Así se separa el archivo físico de la información que necesita consultar la API.

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

- **Gestión de comercios:** incorporación de comercios y ampliación de sus funcionalidades.
- **Gestión documental:** administración ampliada de documentos asociados a usuarios, repartidores y entregas.
- **Autenticación y autorización:** implementación y ampliación de mecanismos de identificación, roles y permisos.
- **Seguridad y escalabilidad:** incorporación de nuevas medidas de protección y optimización para soportar un mayor volumen de operaciones.

## Autor

**Carlos Jonathan Rodriguez Osorio**

Proyecto desarrollado como parte de la formación en desarrollo Backend, integrando los conocimientos adquiridos durante la cursada en el diseño, desarrollo, testing y despliegue de una API REST.

*Programación Backend III*
*Coderhouse — Comisión #96795*
