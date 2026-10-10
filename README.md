# Distribuidora La Quinta — Control de despachos

Aplicación Angular con TypeScript, HTML y CSS para el punto B del parcial.

## Entorno

- Node.js 24.15.0 (ver `.nvmrc`).
- Angular 22 y npm 11.

Con nvm para Windows: `nvm install 24.15.0` y `nvm use 24.15.0`.

## Ejecutar

```sh
npm ci
npm start
```

Abrir http://localhost:4200. Para generar la versión de producción: `npm run build`.
Los archivos se generan en `dist/distribuidora-la-5ta/browser`.

## Estructura y responsabilidades

- `src/app/app.*`: estructura visual y navegación general.
- `src/app/app.routes.ts`: rutas; cada vista se carga bajo demanda.
- `src/app/features/dispatches/pages/dispatch-registration/`: vista de registro.
- `src/app/features/movements/pages/movement-history/`: vista de historial.
- `src/styles.css`: estilos y variables visuales compartidos.

Los modelos se encuentran en `features/dispatches/models` y `features/movements/models`. Los servicios se incorporarán en el siguiente paso aprobado. Las integraciones transversales tendrán lugar en `core` y los componentes reutilizables en `shared` cuando sean necesarios.

Aplicamos responsabilidad única: las vistas presentan información, los servicios gestionarán acceso a datos y los modelos definirán sus contratos. La comunicación externa se aislará mediante servicios inyectables. Evitamos abstracciones sin una necesidad concreta.

## Comprobaciones

- `npm run build`: compilación de producción con comprobaciones estrictas de TypeScript y plantillas.
- `npm run format:check`: verificar formato.
- `npm run format`: aplicar formato.

## Estado del desarrollo

Fase 1, paso 1: base Angular standalone, configuración estricta y navegación entre `/despachos/registro` y `/movimientos`.

Fase 2, paso 1: contratos de solicitud de despacho, respuesta de Make y movimiento autorizado.

## Contratos de datos

- `DispatchRequest`: `solicitante`, `correo`, `codigo_producto`, `cantidad`, `destino` y `motivo`. Los motivos admitidos son `despacho`, `traslado entre sedes` y `avería`. La cantidad representa unidades del producto; sus validaciones se implementarán con el formulario.
- `DispatchResponse`: unión de respuestas distinguibles por `resultado`: `APROBADO`, `APROBADO_CON_ALERTA`, `RECHAZADO` o `PRODUCTO_INEXISTENTE`. Todas incluyen `mensaje`. Las autorizadas requieren `existencias_anteriores`, `saldo` y `minimo`; el rechazo puede incluir esos datos y el producto inexistente no los requiere.
- `Movement`: datos de la solicitud más `id`, `fecha_hora`, `producto`, `existencias_anteriores`, `saldo` y `resultado`. La fecha se intercambia como texto ISO 8601 con zona horaria. Solo admite resultados autorizados, para evitar registrar rechazos como movimientos.

Los contratos usan propiedades de solo lectura y nombres compatibles con los campos del enunciado. Estos valores de resultado son el contrato propuesto para el futuro webhook; todavía no se ha configurado Make. Make calculará el saldo y decidirá la autorización. Los tipos de TypeScript no validan JSON externo: esa validación se incorporará en el servicio de integración.

Las vistas contienen mensajes de preparación. El formulario, el historial real y la integración con Make se implementarán en las siguientes fases aprobadas. No hay datos de prueba ni respuestas simuladas.

`home.html` era un archivo vacío previo a la creación del proyecto y se conserva. Angular utiliza `src/index.html`.

Al publicar, el alojamiento debe redirigir las rutas de la aplicación a `index.html` para admitir enlaces directos.

## Servicios y configuración (fase 2, paso 2)

`src/app/core/config/api-config.ts` centraliza el webhook de despacho, la URL de historial y el tiempo máximo de espera. La configuración se inyecta mediante `API_CONFIG` y se puede sustituir para pruebas. La URL de historial está pendiente: configurarla antes de consultar movimientos.

- `DispatchService.submit`: POST JSON con `DispatchRequest` al webhook compartido. Exige JSON con el contrato `DispatchResponse`; el texto genérico `Accepted` de Make no es un resultado de despacho válido.
- `MovementService.list`: GET al webhook de consulta del historial. Contrato de respuesta: `{ "movimientos": [...] }`. Un historial vacío debe devolver `{ "movimientos": [] }`.
- Los analizadores reciben `unknown` y validan los campos antes de entregarlos a las vistas. Los errores técnicos se representan con `ApiError`: configuración, conexión, espera agotada, HTTP o respuesta inválida. `RECHAZADO` y `PRODUCTO_INEXISTENTE` son resultados de negocio, no errores de conexión.
- No hay reintentos automáticos. Si no llega la respuesta, el despacho pudo haberse ejecutado: verificar el resultado antes de reenviar.

Make debe devolver `Content-Type: application/json` usando una respuesta de webhook en cada ruta. Ejemplo de despacho autorizado:

```json
{
  "resultado": "APROBADO",
  "mensaje": "Despacho autorizado",
  "existencias_anteriores": 48,
  "saldo": 38,
  "minimo": 15
}
```

Para rechazo o producto inexistente bastan `resultado` y `mensaje`. Las cantidades y saldos deben enviarse como números JSON, no como texto. La integración desde el navegador requiere que el webhook admita el origen de la página y la petición previa CORS cuando corresponda. Esto se verificará con la conexión real en la fase de integración.

Los servicios todavía no están conectados a las vistas. Se verifican localmente con `node scripts/verify-services.cjs`, usando el backend HTTP de pruebas de Angular; no se hacen llamadas al webhook real.

## Registro de despachos (fase 3, paso 1)

La vista `/despachos/registro` contiene un formulario reactivo tipado con los seis campos obligatorios. Valida correo, texto no vacío y cantidad entera positiva. El código se ingresa libremente para poder ejecutar C4; se envía sin espacios exteriores y en mayúsculas.

El formulario utiliza `DispatchService`, bloquea edición y envío durante la solicitud y muestra las cuatro respuestas de negocio. Los resultados autorizados incluyen existencias anteriores, saldo y mínimo. Los errores técnicos no se muestran como rechazos y conservan los datos para su revisión; antes de reenviar se debe verificar si hubo procesamiento. Las suscripciones se cancelan al abandonar la vista.

Verificación local: `node scripts/verify-registration.cjs`. Cubre validaciones, código inexistente, normalización, doble envío, resultados, errores y destrucción del componente con un servicio controlado. No envía solicitudes reales.

El botón del formulario sí está conectado al webhook configurado: su uso manual puede ejecutar un despacho real. La comprobación de Make y CORS sigue pendiente de la fase de integración.

## Historial de movimientos (fase 4, paso 1)

La vista `/movimientos` consulta al abrir y permite actualizar manualmente. Presenta fecha/hora de Colombia (UTC−5), producto y código, cantidad, destino, solicitante, motivo, saldo y resultado autorizado. La tabla permite desplazamiento horizontal y navegación por teclado en pantallas pequeñas.

Distingue carga, datos, historial vacío, error y consulta aún no configurada. No muestra datos ficticios ni conserva una tabla anterior como si fuera una consulta actual cuando esta falla. Evita consultas simultáneas y cancela su suscripción al abandonar la vista.

La URL `movementsUrl` sigue pendiente. Para conectar el historial, configurar el webhook de consulta con el contrato documentado. Verificación local: `node scripts/verify-history.cjs`, sin llamadas reales.
