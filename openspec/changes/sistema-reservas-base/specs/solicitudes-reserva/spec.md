# Spec Delta

## Purpose

Define la creación de solicitudes de reserva de un solo día con datos y horarios válidos, asociadas a un solicitante y a un espacio activo.

## ADDED Requirements

### Requirement: SOL-01 Datos de solicitud de un día
El sistema debe (MUST) permitir que un SOLICITANTE activo cree una solicitud indicando espacio, fecha AAAA-MM-DD, hora de inicio y hora de fin para un solo día.

#### Scenario: Creación de solicitud válida
- **CUANDO** un SOLICITANTE activo solicita un espacio ACTIVO para una fecha futura con fecha AAAA-MM-DD y un horario válido
- **ENTONCES** el sistema crea la solicitud para ese espacio, fecha y día

#### Scenario: Fecha o espacio inválido
- **CUANDO** se intenta crear una solicitud con fecha mal formada, fecha pasada o espacio inexistente
- **ENTONCES** el sistema rechaza la solicitud e informa la validación fallida

### Requirement: SOL-02 Validación de horario de solicitud
El sistema debe (MUST) exigir que el inicio sea anterior al fin y que ambos horarios sean múltiplos de 30 minutos dentro del rango de 06:00 a 22:00.

#### Scenario: Horario válido en los límites
- **CUANDO** se solicita un horario de 06:00 a 22:00 con inicio menor que fin y ambos tiempos en incrementos de 30 minutos
- **ENTONCES** el sistema acepta el horario como válido

#### Scenario: Horario fuera de regla
- **CUANDO** el inicio no precede al fin, una hora incluye minutos distintos de 00 o 30, o el horario sale del rango 06:00–22:00
- **ENTONCES** el sistema rechaza la solicitud sin guardarla

### Requirement: SOL-03 Estado inicial de la solicitud
El sistema debe (MUST) crear cada solicitud aceptada en estado PENDIENTE y asociarla con el usuario que la envió.

#### Scenario: Solicitud válida queda pendiente
- **CUANDO** se guarda una solicitud que supera las validaciones de creación
- **ENTONCES** su estado inicial es PENDIENTE y su solicitante es el usuario autenticado

#### Scenario: Usuario inactivo o espacio inactivo
- **CUANDO** un usuario INACTIVO o un espacio INACTIVO intenta originar una nueva solicitud
- **ENTONCES** el sistema rechaza la operación y no registra una solicitud nueva
