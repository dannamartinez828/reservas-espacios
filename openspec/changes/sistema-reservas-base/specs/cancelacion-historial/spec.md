# Spec Delta

## Purpose

Define quién puede cancelar reservas y conserva una trazabilidad inmutable de cada estado alcanzado durante el ciclo de una reserva.

## ADDED Requirements

### Requirement: CAN-01 Cancelación permitida por rol y vigencia
El sistema debe (MUST) permitir a un ADMIN cancelar cualquier reserva no final y a un SOLICITANTE cancelar solo sus propias reservas no finales, únicamente antes de la hora de fin.

#### Scenario: Solicitante cancela reserva propia vigente
- **CUANDO** un SOLICITANTE activo cancela su reserva PENDIENTE o APROBADA antes de su hora de fin
- **ENTONCES** el sistema cambia su estado a CANCELADA

#### Scenario: Administrador cancela reserva ajena vigente
- **CUANDO** un ADMIN activo cancela una reserva no final de otro usuario antes de su hora de fin
- **ENTONCES** el sistema cambia su estado a CANCELADA

#### Scenario: Solicitante intenta cancelar una reserva ajena
- **CUANDO** un SOLICITANTE intenta cancelar una reserva que pertenece a otro usuario
- **ENTONCES** el sistema deniega la operación y conserva el estado actual

#### Scenario: Cancelación de una reserva final
- **CUANDO** cualquier actor intenta cancelar una reserva RECHAZADA o CANCELADA
- **ENTONCES** el sistema deniega la operación y conserva el estado final

#### Scenario: Cancelación en la hora de fin o después
- **CUANDO** cualquier actor intenta cancelar una reserva y el momento actual es igual o posterior a la hora de fin de la reserva
- **ENTONCES** el sistema deniega la operación y conserva el estado actual

### Requirement: HIS-01 Registro de cada transición
El sistema debe (MUST) registrar cada transición de estado de una reserva con estado anterior, estado nuevo, fecha-hora, usuario actor y motivo, incluido el paso inicial a PENDIENTE.

#### Scenario: Registro de una transición
- **CUANDO** una reserva cambia de estado
- **ENTONCES** el historial contiene un registro con estado anterior, estado nuevo, fecha-hora, actor y motivo correspondiente a ese cambio

#### Scenario: Registro de creación
- **CUANDO** se crea una solicitud con estado PENDIENTE
- **ENTONCES** el historial registra la transición inicial desde ausencia de estado a PENDIENTE con fecha-hora, actor solicitante y motivo correspondiente

### Requirement: HIS-02 Historial inmutable
El sistema debe (MUST) conservar los registros de historial sin permitir su edición ni eliminación después de registrarlos.

#### Scenario: Intento de alterar un evento
- **CUANDO** un usuario intenta editar o eliminar un registro existente del historial
- **ENTONCES** el sistema deniega la operación y el evento permanece sin cambios
