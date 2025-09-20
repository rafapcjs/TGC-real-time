# Sistema de Manejo de Estado Global de Peticiones

Este sistema proporciona un manejo completo del estado de las peticiones HTTP en tu aplicación, incluyendo seguimiento en tiempo real, caché, reintentos automáticos, y manejo de errores.

## Características Principales

- ✅ **Seguimiento en tiempo real** de todas las peticiones HTTP
- ✅ **Sistema de caché** inteligente con TTL configurable
- ✅ **Reintentos automáticos** con backoff exponencial
- ✅ **Manejo centralizado de errores**
- ✅ **Cancelación de peticiones** individuales o en lote
- ✅ **Interceptores** para requests, responses y errores
- ✅ **WebSocket** para actualizaciones en tiempo real
- ✅ **Estadísticas y métricas** de rendimiento
- ✅ **Middleware para Fastify** integrado

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Client                         │
├─────────────────────────────────────────────────────────┤
│                Request Interceptors                     │
├─────────────────────────────────────────────────────────┤
│              Request State Service                      │
│  - Estado global de peticiones                         │
│  - Cache management                                     │
│  - Error tracking                                       │
│  - Event emission                                       │
├─────────────────────────────────────────────────────────┤
│             Fastify Middleware                         │
│  - Request tracking                                     │
│  - WebSocket endpoints                                  │
│  - Monitoring routes                                    │
└─────────────────────────────────────────────────────────┘
```

## Archivos del Sistema

### Core Services
- `src/services/requestStateService.js` - Servicio principal de estado
- `src/services/httpClient.js` - Cliente HTTP con interceptores
- `src/middlewares/requestStateMiddleware.js` - Middleware para Fastify

### Utilities
- `src/utils/apiClient.js` - API client con métodos específicos
- `src/examples/requestStateExample.js` - Ejemplos de uso

## Uso Básico

### 1. Realizar Peticiones con Estado Global

```javascript
import { processAPI, requestUtils } from '../utils/apiClient.js';

// Hacer una petición (automáticamente rastreada)
const processes = await processAPI.getProcesses();

// Verificar estado global
const state = requestUtils.getGlobalState();
console.log('Cargando:', state.isLoading);
console.log('Peticiones pendientes:', state.pendingRequests);
console.log('Errores:', state.errors);
```

### 2. Usar Caché

```javascript
// Primera petición (va al servidor)
const data1 = await processAPI.getProcesses();

// Segunda petición (usa caché)
const data2 = await processAPI.getProcesses();

// Limpiar caché específico
requestUtils.clearCache('GET:/processes');
```

### 3. Monitoreo en Tiempo Real

```javascript
// Suscribirse a cambios de estado
const unsubscribe = requestUtils.onStateChange((state) => {
  console.log('Estado actualizado:', state);
});

// Suscribirse a eventos de peticiones
requestUtils.onRequestStart(({ requestId, request }) => {
  console.log(`Petición iniciada: ${request.method} ${request.url}`);
});

requestUtils.onRequestComplete(({ requestId, request }) => {
  console.log(`Petición completada en ${request.duration}ms`);
});

requestUtils.onRequestFail(({ requestId, request, error }) => {
  console.error(`Petición falló: ${error.message}`);
});
```

### 4. Cancelación de Peticiones

```javascript
// Cancelar petición específica
const requestId = 'GET:/processes:{}';
requestUtils.cancelRequest(requestId);

// Cancelar todas las peticiones pendientes
requestUtils.cancelAllRequests();
```

## API Client Específico

### Authentication API
```javascript
import { authAPI, setAuthToken } from '../utils/apiClient.js';

// Login
const result = await authAPI.login({
  email: 'user@example.com',
  password: 'password'
});

// Establecer token para peticiones futuras
setAuthToken(result.token);

// Registro
await authAPI.register({
  name: 'Usuario',
  email: 'user@example.com',
  password: 'password',
  role: 'supervisor'
});
```

### Process API
```javascript
import { processAPI } from '../utils/apiClient.js';

// Obtener procesos (con caché por 2 minutos)
const processes = await processAPI.getProcesses({ 
  status: 'active',
  limit: 10 
});

// Crear proceso (limpia caché automáticamente)
const newProcess = await processAPI.createProcess({
  name: 'Nuevo Proceso',
  description: 'Descripción del proceso'
});

// Actualizar proceso
await processAPI.updateProcess(processId, {
  status: 'completed'
});
```

### Incident API
```javascript
import { incidentAPI } from '../utils/apiClient.js';

// Obtener incidentes
const incidents = await incidentAPI.getIncidents({
  priority: 'high',
  dateFrom: '2024-01-01'
});

// Crear incidente
const incident = await incidentAPI.createIncident({
  title: 'Incidente crítico',
  description: 'Descripción del incidente',
  priority: 'high'
});
```

### Report API
```javascript
import { reportAPI } from '../utils/apiClient.js';

// Generar reporte (timeout extendido)
const report = await reportAPI.generateReport({
  type: 'monthly',
  dateRange: {
    start: '2024-01-01',
    end: '2024-01-31'
  }
});

// Descargar reporte (con caché por 10 minutos)
const pdfData = await reportAPI.downloadReport(reportId, 'pdf');
```

## Configuración Avanzada

### Interceptores Personalizados

```javascript
import httpClient from '../services/httpClient.js';

// Interceptor de request
const removeRequestInterceptor = httpClient.addRequestInterceptor((config) => {
  // Agregar headers personalizados
  config.headers['X-Custom-Header'] = 'valor';
  return config;
});

// Interceptor de response
const removeResponseInterceptor = httpClient.addResponseInterceptor((response, config) => {
  // Procesar response
  console.log('Response recibido:', response);
  return response;
});

// Interceptor de errores
const removeErrorInterceptor = httpClient.addErrorInterceptor((error, config) => {
  // Manejar errores específicos
  if (error.status === 401) {
    // Redirigir a login
    window.location.href = '/login';
  }
  return error;
});

// Remover interceptores cuando no se necesiten
removeRequestInterceptor();
removeResponseInterceptor();
removeErrorInterceptor();
```

### Opciones de Request Personalizadas

```javascript
// Request con opciones avanzadas
const result = await httpClient.request('/api/endpoint', {
  method: 'POST',
  body: { data: 'value' },
  timeout: 10000,        // 10 segundos
  retries: 5,            // 5 reintentos
  cache: true,           // Habilitar caché
  cacheTime: 300000,     // Caché por 5 minutos
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value'
  }
});
```

## Endpoints de Monitoreo

El middleware agrega automáticamente estos endpoints a tu servidor Fastify:

### HTTP Endpoints
- `GET /api/request-state` - Estado global actual
- `GET /api/request-state/stats` - Estadísticas de peticiones
- `POST /api/request-state/clear-cache` - Limpiar caché
- `POST /api/request-state/clear-errors` - Limpiar errores
- `DELETE /api/request-state/cancel/:requestId` - Cancelar petición
- `DELETE /api/request-state/cancel-all` - Cancelar todas las peticiones

### WebSocket Endpoint
- `WS /ws/request-state` - Actualizaciones en tiempo real

```javascript
// Conectar al WebSocket para actualizaciones en tiempo real
const ws = new WebSocket('ws://localhost:3001/ws/request-state');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'stateChange':
      console.log('Estado cambió:', message.data);
      break;
    case 'requestStart':
      console.log('Petición iniciada:', message.data);
      break;
    case 'requestComplete':
      console.log('Petición completada:', message.data);
      break;
    case 'requestFail':
      console.log('Petición falló:', message.data);
      break;
  }
};

// Enviar comandos al servidor
ws.send(JSON.stringify({ type: 'getState' }));
ws.send(JSON.stringify({ type: 'clearCache' }));
ws.send(JSON.stringify({ type: 'cancelAllRequests' }));
```

## Estadísticas y Métricas

```javascript
const stats = requestUtils.getStats();
console.log(stats);
// {
//   total: 25,
//   completed: 20,
//   failed: 3,
//   pending: 2,
//   cancelled: 0,
//   averageDuration: 234,
//   cacheHitRate: 15.5,
//   errorRate: 12.0
// }
```

## Ejemplos Completos

Ejecuta los ejemplos incluidos para ver el sistema en acción:

```bash
# Ejecutar todos los ejemplos
node src/examples/requestStateExample.js

# O importar ejemplos específicos
import { basicExample, cacheExample } from '../examples/requestStateExample.js';
await basicExample();
await cacheExample();
```

## Integración con Frontend

Para integrar con aplicaciones frontend (React, Vue, etc.), puedes:

1. **Usar WebSocket** para recibir actualizaciones en tiempo real
2. **Polling** de los endpoints HTTP para obtener estado
3. **Server-Sent Events** (puedes agregar soporte fácilmente)

### Ejemplo React Hook

```javascript
import { useEffect, useState } from 'react';

function useRequestState() {
  const [state, setState] = useState({
    isLoading: false,
    pendingRequests: 0,
    errors: []
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws/request-state');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'stateChange') {
        setState(message.data);
      }
    };

    return () => ws.close();
  }, []);

  return state;
}

// Usar en componente
function App() {
  const { isLoading, pendingRequests, errors } = useRequestState();
  
  return (
    <div>
      {isLoading && <div>Cargando... ({pendingRequests} peticiones)</div>}
      {errors.length > 0 && (
        <div>Errores: {errors.map(e => e.message).join(', ')}</div>
      )}
    </div>
  );
}
```

## Consideraciones de Rendimiento

- El caché usa TTL automático para evitar acumulación de memoria
- Las peticiones completadas se limpian automáticamente después de 10 segundos
- Los errores se limitan a un máximo de 10 en el estado global
- Los event listeners se pueden remover para evitar memory leaks

## Troubleshooting

### Error: "Cannot read property of undefined"
- Asegúrate de que el middleware esté registrado antes de las rutas
- Verifica que el servicio esté correctamente importado

### WebSocket no funciona
- Verifica que el plugin `@fastify/websocket` esté instalado y registrado
- Confirma que el puerto y host sean correctos

### Caché no funciona
- Asegúrate de que la opción `cache: true` esté habilitada
- Verifica que el TTL no haya expirado
- Confirma que la URL y parámetros sean idénticos

### Reintentos no funcionan
- Verifica que el error sea "retryable" (5xx, timeout, network)
- Confirma que no se haya alcanzado el máximo de reintentos
- Revisa la configuración de `maxRetries`

## Próximas Mejoras

- [ ] Soporte para Server-Sent Events
- [ ] Persistencia de caché en Redis
- [ ] Métricas más detalladas (percentiles, histogramas)
- [ ] Rate limiting integrado
- [ ] Compresión automática de responses
- [ ] Soporte para GraphQL subscriptions