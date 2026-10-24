# Proposal

## Why

La gestión actual mediante correos y hojas de cálculo dificulta consultar disponibilidad, evitar conflictos y mantener trazabilidad de las decisiones. Este cambio define la base funcional verificable del sistema de reservas académicas descrito en el plan de ingeniería antes de implementar sus módulos.

## What Changes

- Establecer requisitos de gestión de espacios, usuarios, roles y permisos.
- Definir solicitudes de reserva, consulta de disponibilidad y prevención de cruces conforme a intervalos semiabiertos y reservas aprobadas.
- Especificar aprobación, rechazo, cancelación y un historial inmutable de transiciones.
- Documentar arquitectura, modelo de datos, decisiones técnicas D1–D5 y una secuencia de implementación con pruebas automatizadas.

## Capabilities

### New Capabilities

- `gestion-espacios`: ciclo de vida y validaciones de los espacios académicos.
- `usuarios`: registro, autenticación de demostración y administración del estado de usuarios.
- `roles-permisos`: autorización diferenciada para ADMIN y SOLICITANTE.
- `solicitudes-reserva`: creación y validación de solicitudes de reserva.
- `disponibilidad`: consulta de espacios disponibles por fecha y horario.
- `prevencion-simultaneas`: reglas para detectar cruces y revalidar antes de aprobar.
- `aprobacion-rechazo`: decisiones administrativas sobre solicitudes pendientes.
- `cancelacion-historial`: cancelación permitida y registro inmutable de transiciones.

### Modified Capabilities

Ninguna. El inventario inicial de OpenSpec no contiene capacidades existentes.

## Impact

El cambio establece el contrato funcional para la futura aplicación web cliente en JavaScript puro con módulos ES. Orienta `js/domain`, `js/storage`, `js/ui` y `tests`, y requiere persistencia detrás de una interfaz de repositorio con `localStorage` y una implementación en memoria para pruebas. No introduce dependencias de aplicación: las pruebas usarán el ejecutor nativo `node --test`. El alcance no incluye pagos, notificaciones por correo, integración académica, reservas recurrentes ni concurrencia multiusuario real en red.
