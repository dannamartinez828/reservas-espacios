# Tasks

## 1. Núcleo y almacenamiento

- [ ] 1.1 Crear la estructura inicial de carpetas `js/domain`, `js/storage`, `js/ui` y `tests`, más `package.json` con `"type": "module"` y el script `"test": "node --test"`; verificar que `npm test` se ejecuta correctamente con la suite inicial.
- [ ] 1.2 Definir la interfaz común de repositorio (`obtener`, `guardar`, `listar`, `eliminar`) y sus adaptadores en memoria y `localStorage`; verificar operaciones CRUD y aislamiento de la persistencia con pruebas automatizadas.
- [ ] 1.3 Centralizar validación de fecha calendario, conversión hora/minutos y límites de horario; crear pruebas con nombres que incluyan `SOL-02` para intervalos válidos, inválidos y bordes 06:00–22:00, y `SIM-01` para intervalos superpuestos, disjuntos y contiguos; verificar con `npm test`.

## 2. Usuarios y roles

- [ ] 2.1 Implementar registro con correo único, contraseña almacenada como hash, rol propio SOLICITANTE y estado inicial activo; verificar casos con nombres de prueba `USR-01` para registro válido y correo duplicado.
- [ ] 2.2 Implementar inicio de sesión de usuarios activos y creación idempotente del administrador semilla de demostración; verificar con pruebas `USR-02` para credenciales correctas/incorrectas e inactividad y `USR-03` para credenciales semilla, hash y ausencia de duplicados.
- [ ] 2.3 Implementar activación/desactivación de cuentas y autorización para ADMIN/SOLICITANTE; verificar con pruebas `USR-04` y `ROL-01`/`ROL-02` que los inactivos no inician sesión ni reservan y los roles no exceden sus permisos.

## 3. Espacios

- [ ] 3.1 Implementar alta y validación de tipo permitido, nombre único, capacidad positiva, ubicación y estado inicial ACTIVO; verificar con pruebas `ESP-01` para alta válida y cada dato inválido o duplicado.
- [ ] 3.2 Implementar activación/desactivación y restricciones de rol para la gestión de espacios; verificar con pruebas `ESP-02` que las reservas existentes se conservan y `ESP-03` que un solicitante no puede modificar espacios.

## 4. Reservas y disponibilidad

- [ ] 4.1 Implementar creación de solicitudes de un día con espacio activo, fecha `AAAA-MM-DD` no pasada, horario válido y estado PENDIENTE; verificar con pruebas `SOL-01`, `SOL-02` y `SOL-03` para casos válidos y errores.
- [ ] 4.2 Implementar consulta de disponibilidad por fecha y horario, incluyendo solo espacios activos y considerando bloqueantes únicamente las reservas APROBADAS; verificar con pruebas `DIS-01` y `DIS-02` para aprobadas, pendientes y extremos contiguos.
- [ ] 4.3 Implementar detección de cruces semiabiertos y rechazo de nuevas solicitudes que crucen reservas APROBADAS sin bloquear solicitudes pendientes entre sí; verificar con pruebas `SIM-01` y `SIM-02`, incluidas reservas contiguas y escenarios de conflicto.

## 5. Aprobación, cancelación e historial

- [ ] 5.1 Implementar aprobación solo desde PENDIENTE con revalidación de cruces y rechazo solo con motivo no vacío; verificar con pruebas `APR-01`, `APR-02` y `SIM-03` los casos exitosos, transiciones inválidas y errores de conflicto.
- [ ] 5.2 Implementar cancelación por rol, propiedad, estado y hora de fin; verificar con pruebas `CAN-01` que ADMIN cancele cualquier reserva no final, SOLICITANTE solo las propias y que una reserva vencida no se cancele.
- [ ] 5.3 Registrar el evento inicial y cada transición con estado anterior/nuevo, fecha-hora, actor y motivo, y hacer el historial append-only; verificar con pruebas `HIS-01` y `HIS-02` la integridad de los datos y el rechazo de edición/eliminación.
- [ ] 5.4 Integrar los flujos completos de creación, aprobación/rechazo y cancelación con repositorios en memoria; verificar con `npm test` que reserva e historial permanecen coherentes también cuando falla la persistencia.

## 6. Interfaz de usuario

- [ ] 6.1 Implementar vistas y controladores para registro, inicio de sesión, administración de usuarios/roles y espacios; verificar con pruebas automatizadas `USR-01`, `USR-02`, `USR-04`, `ROL-01` y `ESP-01` que las acciones y errores se reflejan sin duplicar reglas de dominio.
- [ ] 6.2 Implementar formularios de solicitud y consulta de disponibilidad; verificar con pruebas automatizadas `SOL-01`, `SOL-02`, `SOL-03`, `DIS-01` y `SIM-02` el envío válido, validaciones visibles y conflictos.
- [ ] 6.3 Implementar pantallas de decisiones, cancelación y consulta del historial; verificar con pruebas automatizadas `APR-01`, `APR-02`, `CAN-01`, `HIS-01` y `HIS-02` las acciones permitidas, los errores y la trazabilidad.
- [ ] 6.4 Ejecutar la suite completa y comprobar en Apache/XAMPP los flujos principales por rol; verificar `npm test` y una lista manual de navegación, persistencia, estados y mensajes de error en el navegador.
