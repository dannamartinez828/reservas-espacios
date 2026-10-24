# Design

## Context

Consulte [proposal.md](./proposal.md) para la motivación y las ocho especificaciones de `specs/` para el contrato de comportamiento. El repositorio contiene el plan de ingeniería y la configuración OpenSpec, pero todavía no contiene código de aplicación. La solución prevista es una SPA servida como archivos estáticos por Apache/XAMPP, con reglas independientes del DOM y persistencia local de demostración.

## Goals / Non-Goals

**Goals:**

- Traducir los requisitos a módulos ES sin frameworks ni paso de compilación.
- Mantener reglas de dominio probables con Node.js y repositorios en memoria.
- Asegurar que toda lectura y escritura persistente pase por la interfaz de repositorio.
- Aplicar de manera uniforme permisos, reglas de tiempo, cruces y transiciones.

**Non-Goals:**

- Añadir un servidor, una base de datos remota o concurrencia multiusuario real.
- Proveer autenticación de producción, notificaciones, integración institucional, recurrencia o pagos.
- Hacer que las vistas contengan reglas de negocio.

## Decisions

### Estructura de carpetas

```text
package.json
index.html
css/
js/
  domain/
    entities/
    services/
    policies/
    time/
  storage/
    repositories/
  ui/
    views/
    controllers/
tests/
  domain/
  storage/
  integration/
  ui/
```

- `js/domain` contiene entidades, validaciones, políticas de permisos, transiciones y servicios puros. No importa el DOM ni `localStorage`.
- `js/storage` implementa la interfaz de repositorio sobre `localStorage` y una versión en memoria para pruebas. La serialización JSON queda aislada en esta capa.
- `js/ui` adapta acciones de usuario a operaciones del dominio y representa resultados o errores; no vuelve a implementar reglas.
- `tests` usa el ejecutor integrado de Node, sin frameworks. Las pruebas de dominio e integración no requieren navegador; la interfaz debe probarse con controladores desacoplados y dobles mínimos del DOM cuando proceda.
- Los módulos se conectan mediante dependencias explícitas: la interfaz invoca servicios de dominio y los repositorios se entregan a los servicios, sin que el dominio dependa del adaptador concreto.

### Modelo de datos

- **Usuario**: `id` único, `nombre`, `correo`, `passwordHash`, `rol` (`SOLICITANTE` o `ADMIN`), `estado` (`ACTIVO` o `INACTIVO`).
- **Espacio**: `id` único, `tipo` (`LABORATORIO`, `AUDITORIO`, `SALA_COMPUTO`), `nombre`, `capacidad`, `ubicacion`, `estado` (`ACTIVO` o `INACTIVO`).
- **Reserva/Solicitud**: `id` único, `espacioId`, `solicitanteId`, `fecha` (`AAAA-MM-DD`), `inicio` y `fin` como minutos desde medianoche, `estado` (`PENDIENTE`, `APROBADA`, `RECHAZADA`, `CANCELADA`).
- **Evento de historial**: `id`, `reservaId`, `estadoAnterior` (nulo para la creación), `estadoNuevo`, `fechaHora`, `actorId` y `motivo`. El repositorio de historial solo expone registro y consulta; no ofrece edición ni eliminación.
- Los identificadores se generan de forma única para cada registro. Las relaciones se guardan por identificador y cada repositorio serializa sus registros a JSON mediante la interfaz `obtener`, `guardar`, `listar` y `eliminar`. El repositorio de historial expone solo registro y consulta: la interfaz CRUD general no se usa para editar o eliminar eventos.

### Aplicación de decisiones del plan D1–D5

- **D1 — `localStorage` detrás de repositorio**: los servicios reciben un contrato de repositorio y no acceden al almacenamiento del navegador. Se ofrece adaptador `localStorage` para la aplicación y adaptador en memoria con la misma interfaz para las pruebas. Las operaciones que modifican reserva e historial persisten ambos en un único documento JSON/envoltorio mediante una sola escritura de `localStorage`, evitando confirmar solo una parte. Los errores de lectura o escritura se devuelven explícitamente; no se sustituyen por datos vacíos.
- **D2 — JavaScript puro con módulos ES**: `package.json` declara `"type": "module"`; el navegador carga módulos directamente desde los archivos estáticos de Apache. No se introduce framework, TypeScript ni compilación.
- **D3 — Node `--test`**: `package.json` define `"test": "node --test"`. Las pruebas automatizadas emplean únicamente las APIs nativas de Node y nombran cada caso con su ID de requisito.
- **D4 — intervalos semiabiertos**: el dominio convierte las horas en minutos desde medianoche y determina cruce para misma fecha y espacio con `inicioA < finB && finA > inicioB`. La igualdad de extremos permite reservas contiguas en ambos órdenes. Una función centralizada valida incrementos de 30 minutos y límites de 06:00 a 22:00, permitiendo 06:00 como inicio y 22:00 como fin, pero no fuera del rango. Las pruebas de hora reciben un reloj local controlable para cubrir fechas y horas exactas sin depender del momento real de ejecución.
- **D5 — solo aprobadas bloquean**: disponibilidad y creación filtran reservas `APROBADA`; las solicitudes `PENDIENTE` pueden cruzarse. La desactivación de un espacio impide solicitudes nuevas, pero no elimina solicitudes ya creadas ni impide tramitarlas. El servicio de aprobación vuelve a consultar el repositorio y aplica la misma política antes de cambiar el estado, dejando la solicitud pendiente si detecta conflicto.

### Otras decisiones

- El estado inicial de una reserva se crea junto con su primer evento de historial; cada transición válida persiste el nuevo estado y el evento correspondiente como una sola operación lógica, dentro del mismo documento JSON para requerir una sola escritura de `localStorage`.
- Las fechas de reserva se validan como fechas de calendario `AAAA-MM-DD` y se comparan como fechas locales de calendario, no como instantes UTC. Se asume la zona local del navegador para decidir si una fecha u hora de inicio ya pasó; para el mismo día, el inicio debe ser posterior al momento actual. La cancelación se bloquea cuando el momento actual es igual o posterior al fin. Se mantiene fecha y hora separadas para evitar desplazamientos de día por conversión de zona.
- El correo se normaliza quitando espacios externos y convirtiéndolo a minúsculas para comprobar unicidad; el nombre mostrado se conserva. Para el nombre de espacio se eliminan espacios externos y se exige unicidad sin distinguir mayúsculas/minúsculas, conservando la forma de presentación.
- La contraseña se conserva únicamente como hash mediante una función de hash con sal disponible en las APIs estándar del entorno. Esta autenticación sigue siendo de demostración porque el cliente y el almacenamiento están bajo control del usuario; no se usarán cuentas ni secretos reales.
- Un rechazo exige motivo no vacío después de eliminar espacios externos. Todo evento lleva el campo `motivo`; cuando una operación no solicita explicación específica, se conserva vacío o nulo sin omitir el campo.

## Risks / Trade-offs

- [Datos locales pueden borrarse o editarse desde el navegador] → declarar la limitación de demostración, centralizar persistencia tras repositorios y validar los datos leídos antes de usarlos.
- [La autenticación cliente no protege frente a un usuario que controla el navegador] → almacenar solo hash, no usar información sensible y no presentar la solución como autenticación de producción.
- [Fallos entre escritura de reserva e historial pueden romper trazabilidad] → persistir ambos en un solo documento JSON con una única escritura, comprobar errores y no confirmar la acción en la interfaz si la persistencia falla.
- [La zona horaria del navegador puede diferir de la institucional] → comparar fechas como calendario local sin conversión UTC; una zona institucional fija requeriría una decisión posterior si el alcance cambia.
- [Sin bloqueo distribuido no se evita una carrera entre dispositivos] → alcance de esta versión de un solo navegador; la aprobación revalida antes de guardar y la concurrencia real en red queda fuera de alcance.

## Migration Plan

No hay datos de aplicación existentes que migrar. Implementar en orden: núcleo/repositorios, usuarios y roles, espacios, reservas/disponibilidad, decisiones e historial, y finalmente interfaz. La persistencia comienza vacía salvo la creación idempotente del usuario administrador semilla de demostración. Para revertir la aplicación basta con retirar la versión estática; los datos locales permanecen en el navegador y pueden borrarse desde el almacenamiento del sitio, sin prometer compatibilidad de datos entre versiones.
