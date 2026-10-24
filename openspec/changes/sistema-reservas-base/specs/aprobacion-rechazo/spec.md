# Spec Delta

## Purpose

Define las decisiones administrativas de aprobación o rechazo de solicitudes y las transiciones válidas del ciclo de vida de una reserva.

## ADDED Requirements

### Requirement: APR-01 Aprobar solicitudes pendientes
El sistema debe (MUST) permitir a un ADMIN activo aprobar solicitudes PENDIENTES, siempre que la revalidación de disponibilidad no detecte una reserva APROBADA cruzada.

#### Scenario: Aprobación válida
- **CUANDO** un ADMIN activo aprueba una solicitud PENDIENTE sin conflicto aprobado
- **ENTONCES** el sistema cambia su estado a APROBADA

#### Scenario: Aprobación con conflicto
- **CUANDO** un ADMIN intenta aprobar una solicitud PENDIENTE que cruza una reserva APROBADA del mismo espacio y fecha
- **ENTONCES** la operación falla con error y la solicitud permanece PENDIENTE

### Requirement: APR-02 Rechazar con motivo
El sistema debe (MUST) permitir a un ADMIN activo rechazar una solicitud PENDIENTE únicamente cuando proporciona un motivo no vacío.

#### Scenario: Rechazo con motivo
- **CUANDO** un ADMIN activo rechaza una solicitud PENDIENTE e indica un motivo no vacío
- **ENTONCES** el sistema cambia el estado a RECHAZADA y conserva el motivo

#### Scenario: Rechazo sin motivo
- **CUANDO** un ADMIN activo intenta rechazar una solicitud PENDIENTE sin motivo
- **ENTONCES** el sistema rechaza la operación y conserva el estado PENDIENTE

### Requirement: APR-03 Transiciones permitidas y estados finales
El sistema debe (MUST) permitir únicamente PENDIENTE a APROBADA, RECHAZADA o CANCELADA y APROBADA a CANCELADA; RECHAZADA y CANCELADA deben ser estados finales.

#### Scenario: Transición desde un estado final
- **CUANDO** se intenta cambiar una reserva RECHAZADA o CANCELADA a cualquier otro estado
- **ENTONCES** el sistema deniega la transición y mantiene el estado final

#### Scenario: Transición no permitida desde aprobada
- **CUANDO** se intenta cambiar una reserva APROBADA a PENDIENTE o RECHAZADA
- **ENTONCES** el sistema deniega la transición y mantiene el estado APROBADA
