# Tasks

## 1. Núcleo y almacenamiento

- [x] 1.1 Crear la estructura inicial de carpetas `js/domain`, `js/storage`, `js/ui` y `tests`, más `package.json` con `"type": "module"` y el script `"test": "node --test"`; verificar que `npm test` se ejecuta correctamente con la suite inicial.
- [x] 1.2 Definir la interfaz común de repositorio (`obtener`, `guardar`, `listar`, `eliminar`) y sus adaptadores en memoria y `localStorage`; persistir estado e historial juntos en un único documento JSON y verificar CRUD, historial sin edición/eliminación y errores de escritura con pruebas automatizadas.
- [x] 1.3 Centralizar validación de fecha calendario, reloj local y conversión hora/minutos; crear pruebas con nombres que incluyan `SOL-01` para fecha pasada, hoy con inicio pasado/actual/futuro; `SOL-02` para inicio 06:00, fin 22:00, fuera de rango, minutos no válidos e inicio ≥ fin; y `SIM-01` para intervalos superpuestos, anidados, disjuntos y contiguos en ambos órdenes; verificar con `npm test`.
- [x] 1.4 Implementar generación de identificadores únicos para cada registro; verificar con pruebas automatizadas que múltiples identificadores generados no colisionan dentro del conjunto almacenado.

## 2. Usuarios y roles

- [x] 2.1 Implementar registro con correo único tras quitar espacios externos y comparar sin distinguir mayúsculas, contraseña almacenada como hash, rol propio SOLICITANTE y estado inicial activo; verificar casos `USR-01` de registro válido, duplicado exacto y duplicado con capitalización/espacios distintos.
- [x] 2.2 Implementar inicio de sesión de usuarios activos y creación idempotente del administrador semilla de demostración; verificar con pruebas `USR-02` para credenciales correctas/incorrectas e inactividad y `USR-03` para credenciales semilla, hash y ausencia de duplicados.
- [x] 2.3 Implementar activación/desactivación de cuentas y autorización para ADMIN/SOLICITANTE; verificar con pruebas `USR-04` y `ROL-01`/`ROL-02` que los inactivos no inician sesión ni reservan y los roles no exceden sus permisos.

## 3. Espacios

- [x] 3.1 Implementar alta y edición con tipo permitido, nombre único, capacidad positiva, ubicación y estado inicial ACTIVO; verificar con pruebas `ESP-01` para alta y validaciones, y `ESP-04` para edición válida, datos inválidos, nombre duplicado y conservación de reservas/estado.
- [x] 3.2 Implementar activación/desactivación y restricciones de rol para la gestión de espacios; verificar con pruebas `ESP-02` que las reservas existentes se conservan y `ESP-03` que un solicitante no puede modificar espacios.

## 4. Reservas y disponibilidad

- [x] 4.1 Implementar creación de solicitudes de un día con espacio activo, inicio posterior al reloj local, horario válido y estado PENDIENTE; verificar con pruebas `SOL-01`, `SOL-02` y `SOL-03` para fecha pasada, hoy con inicio vencido/actual/futuro, cada borde horario, usuario inactivo, espacio inactivo y casos válidos.
- [x] 4.2 Implementar consulta de disponibilidad por fecha y horario, incluyendo solo espacios activos y considerando bloqueantes únicamente las reservas APROBADAS; verificar con pruebas `DIS-01` y `DIS-02` para aprobadas, pendientes y extremos contiguos.
- [x] 4.3 Implementar detección de cruces semiabiertos y rechazo de nuevas solicitudes que crucen reservas APROBADAS sin bloquear solicitudes pendientes entre sí; verificar con pruebas `SIM-01` y `SIM-02`, incluidas reservas contiguas y escenarios de conflicto.

## 5. Aprobación, cancelación e historial

- [x] 5.1 Implementar aprobación solo desde PENDIENTE con revalidación de cruces, incluso para una solicitud existente cuyo espacio luego se desactivó, y rechazo solo con motivo no vacío tras recortar espacios; aplicar la tabla de transiciones y estados finales; verificar con pruebas `APR-01`, `APR-02`, `APR-03` y `SIM-03` los casos exitosos, conflictos, motivo solo con espacios, transiciones inválidas y estados finales.
- [x] 5.2 Implementar cancelación por rol, propiedad, estado y hora de fin; verificar con pruebas `CAN-01` que ADMIN cancele cualquier reserva no final, SOLICITANTE solo las propias, estados finales no se cancelen y el límite exacto de fin (ahora igual o posterior) se rechace.
- [x] 5.3 Registrar el evento inicial y cada transición con estado anterior/nuevo, fecha-hora, actor y motivo, y hacer el historial append-only; verificar con pruebas `HIS-01` y `HIS-02` la integridad de los datos y el rechazo de edición/eliminación.
- [x] 5.4 Integrar los flujos completos de creación, aprobación/rechazo y cancelación con repositorios en memoria; verificar con `npm test` que reserva e historial permanecen coherentes también cuando falla la persistencia.

## 6. Interfaz de usuario

- [ ] 6.1 Implementar vistas y controladores para registro, inicio de sesión, administración de usuarios/roles y espacios sin duplicar reglas de dominio; verificar con pruebas automatizadas de los controladores (funciones sin DOM) y con la lista manual de 6.4 los requisitos `USR-01`, `USR-02`, `USR-04`, `ROL-01` y `ESP-01`.
- [ ] 6.2 Implementar formularios de solicitud y consulta de disponibilidad sin duplicar reglas de dominio; verificar con pruebas automatizadas de los controladores (funciones sin DOM) y con la lista manual de 6.4 los requisitos `SOL-01`, `SOL-02`, `SOL-03`, `DIS-01` y `SIM-02`.
- [ ] 6.3 Implementar pantallas de decisiones, cancelación y consulta del historial sin duplicar reglas de dominio; verificar con pruebas automatizadas de los controladores (funciones sin DOM) y con la lista manual de 6.4 los requisitos `APR-01`, `APR-02`, `CAN-01`, `HIS-01` y `HIS-02`.
- [ ] 6.4 Ejecutar la suite completa y comprobar en Apache/XAMPP los flujos principales por rol; verificar `npm test` y una lista manual de navegación, persistencia, estados y mensajes de error en el navegador.
