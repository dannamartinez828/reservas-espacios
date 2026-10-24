# Spec Delta

## Purpose

Establece los límites de autorización entre administradores y solicitantes para proteger las operaciones de gestión y el ciclo de las reservas.

## ADDED Requirements

### Requirement: ROL-01 Permisos del administrador
El sistema debe (MUST) permitir a ADMIN activo gestionar espacios y usuarios, aprobar o rechazar solicitudes PENDIENTES y cancelar cualquier reserva no final, sujeto a las reglas de transición y vigencia.

#### Scenario: Administrador ejecuta una operación administrativa
- **CUANDO** un ADMIN activo y autenticado gestiona un espacio o usuario, o decide o cancela una reserva
- **ENTONCES** el sistema permite la operación si cumple las reglas de negocio aplicables

#### Scenario: Solicitante intenta operación administrativa
- **CUANDO** un SOLICITANTE intenta gestionar espacios o usuarios, aprobar o rechazar una reserva, o cancelar una reserva ajena
- **ENTONCES** el sistema deniega la operación sin modificar los datos

#### Scenario: Administrador intenta cancelar una reserva final
- **CUANDO** un ADMIN intenta cancelar una reserva RECHAZADA o CANCELADA
- **ENTONCES** el sistema deniega la operación y conserva el estado final

### Requirement: ROL-02 Permisos del solicitante
El sistema debe (MUST) permitir a SOLICITANTE activo consultar disponibilidad, crear solicitudes y cancelar únicamente reservas propias.

#### Scenario: Solicitante realiza operaciones permitidas
- **CUANDO** un SOLICITANTE activo consulta disponibilidad, crea una solicitud válida o cancela una reserva propia dentro de las reglas
- **ENTONCES** el sistema permite la operación y conserva la identidad del solicitante como actor correspondiente

#### Scenario: Usuario inactivo intenta reservar
- **CUANDO** un usuario INACTIVO intenta crear una solicitud aunque conserve una sesión o una referencia a su cuenta
- **ENTONCES** el sistema deniega la operación y no crea una reserva
