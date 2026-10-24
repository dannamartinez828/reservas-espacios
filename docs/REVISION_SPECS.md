# Revisión de especificaciones: change `sistema-reservas-base`

**Fecha:** 24 de octubre de 2026
**Documentos revisados:** PLAN_INGENIERIA.md, proposal.md, design.md, tasks.md y las 8 capacidades en `specs/`.

## 1. Matriz de consistencia

### Módulos del plan

| Módulo del plan | Requisitos / tareas que lo cubren |
|-----------------|-----------------------------------|
| M1 Núcleo y almacenamiento | Tareas del grupo 1; SOL-02 y SIM-01 (validación de tiempo y cruces) |
| M2 Usuarios y roles | USR-01 a USR-04, ROL-01, ROL-02 |
| M3 Espacios | ESP-01 a ESP-04 |
| M4 Reservas y disponibilidad | SOL-01 a SOL-03, DIS-01, DIS-02, SIM-01 a SIM-03 |
| M5 Aprobación e historial | APR-01 a APR-03, CAN-01, HIS-01, HIS-02 |
| M6 Interfaz de usuario | Tareas del grupo 6 (transversal; consume los requisitos anteriores) |

### Necesidades del plan

| Necesidad | Cobertura |
|-----------|-----------|
| N1 Centralizar solicitudes | SOL-01 a SOL-03 |
| N2 Consultar disponibilidad | DIS-01, DIS-02 |
| N3 Impedir cruces aprobados | SIM-01 a SIM-03 |
| N4 Controlar quién solicita y aprueba | ROL-01, ROL-02, USR-01 a USR-04 |
| N5 Historial de cambios | HIS-01, HIS-02, CAN-01 |
| N6 Cambiar reglas sin reescribir | Sin requisito funcional propio: se cubre con la decisión de diseño de centralizar las reglas en un solo módulo (design.md, D4). |

### Verificación mecánica
- Los 24 requisitos tienen al menos un escenario CUANDO/ENTONCES.
- Todos los IDs citados en `tasks.md` existen en las specs.
- `openspec validate sistema-reservas-base --strict`: válido.

## 2. Requisitos ambiguos y cómo se resolvieron

| Ambigüedad | Resolución |
|------------|------------|
| "Fecha pasada" no cubría el día actual con hora ya vencida | SOL-01: el inicio debe ser posterior al momento actual local; las pruebas usan un reloj controlable. |
| "Fin ya pasó" no definía el instante exacto | CAN-01: no se cancela si el momento actual es igual o posterior al fin. |
| Límites 06:00 y 22:00 sin escenarios separados | SOL-02: escenarios para inicio 06:00, fin 22:00 y fuera de rango. |
| Qué pasa con una solicitud pendiente si el espacio se desactiva | APR-01: se puede tramitar si ya existía; solo se impiden solicitudes nuevas. |
| Motivo de rechazo "no vacío" | APR-02: no puede quedar vacío tras eliminar espacios externos. |
| Unicidad del correo | USR-01: sin distinguir mayúsculas y sin espacios externos. |

## 3. Contradicciones detectadas

| Contradicción | Corrección |
|---------------|------------|
| ROL-01 permitía al ADMIN cancelar "cualquier reserva", pero RECHAZADA y CANCELADA son estados finales | ROL-01 ahora dice "cualquier reserva no final", con escenario para el caso de reserva final. |
| El plan exige "edición de espacios" (módulo M3) y no existía requisito | Se creó ESP-04. |
| Las tareas 6.1 a 6.3 prometían pruebas automatizadas de interfaz, pero el plan (sección 5.1 y decisión D3) usa solo `node --test` sin DOM y pruebas manuales de interfaz | Se reescribieron: pruebas automatizadas de controladores sin DOM y lista manual en 6.4. |
| APR-03 no estaba citado en ninguna tarea | Se agregó a la tarea 5.1. |

## 4. Escenarios agregados

- Intervalo contenido en otro (SIM-01).
- Contiguas en ambos órdenes (SIM-01).
- Solicitud para hoy con inicio futuro, igual o anterior a la hora actual (SOL-01).
- Espacio inexistente (SOL-01).
- Usuario inactivo y espacio inactivo, separados (SOL-03).
- Cancelación de reserva ajena, de reserva final y en el instante exacto del fin (CAN-01).
- Aprobación de solicitud existente de un espacio desactivado (APR-01).
- Rechazo con motivo solo de espacios (APR-02).
- Correo duplicado con mayúsculas o espacios (USR-01).
- ADMIN intentando cancelar una reserva final (ROL-01).
- Edición válida e inválida de espacios (ESP-04).

## 5. Decisiones técnicas nuevas o ajustadas

| Decisión | Detalle | Relación con el plan |
|----------|---------|----------------------|
| Reserva e historial en un solo documento JSON | Una única escritura de `localStorage` para evitar guardar solo una parte. | Refina D1; no contradice el plan, que solo exige acceso mediante interfaz de repositorio. |
| Reloj local controlable en pruebas | Permite probar bordes de fecha y hora sin depender del momento real. | Refina D4. |
| Identificadores únicos | Nueva tarea 1.4 con pruebas de no colisión. | Complementa M1. |

## 6. Estado
Especificaciones validadas y tareas finales definidas. La implementación puede iniciar por el grupo 1.