# Spec Delta

## Purpose

Define la creación de solicitudes de reserva de un solo día con datos y horarios válidos, asociadas a un solicitante y a un espacio activo.

## ADDED Requirements

### Requirement: SOL-01 Datos de solicitud de un día
El sistema debe (MUST) permitir que un SOLICITANTE activo cree una solicitud indicando espacio, fecha AAAA-MM-DD, hora de inicio y hora de fin para un solo día. La fecha y hora de inicio deben ser posteriores al momento actual local.

#### Scenario: Solicitud para una fecha futura
- **CUANDO** un SOLICITANTE activo solicita un espacio ACTIVO para una fecha futura válida con un horario válido
- **ENTONCES** el sistema crea la solicitud para ese espacio, fecha y día

#### Scenario: Solicitud para hoy con inicio futuro
- **CUANDO** un SOLICITANTE activo solicita un espacio ACTIVO para hoy y la hora de inicio es posterior al momento actual local
- **ENTONCES** el sistema acepta la fecha si las demás validaciones se cumplen

#### Scenario: Fecha mal formada, pasada o inicio ya alcanzado
- **CUANDO** se intenta crear una solicitud con fecha mal formada o pasada, o para hoy con hora de inicio igual o anterior al momento actual local
- **ENTONCES** el sistema rechaza la solicitud e informa la validación fallida

#### Scenario: Espacio inexistente
- **CUANDO** se intenta crear una solicitud para un espacio que no existe
- **ENTONCES** el sistema rechaza la solicitud e informa que no se encontró el espacio

### Requirement: SOL-02 Validación de horario de solicitud
El sistema debe (MUST) exigir que el inicio sea anterior al fin y que ambos horarios sean múltiplos de 30 minutos dentro del rango de 06:00 a 22:00.

#### Scenario: Inicio en la apertura del rango
- **CUANDO** se solicita un horario que comienza a las 06:00 y termina después de las 06:00 en un múltiplo de 30 minutos
- **ENTONCES** el sistema acepta el límite inferior del horario

#### Scenario: Fin en el cierre del rango
- **CUANDO** se solicita un horario que comienza antes de las 22:00 y termina exactamente a las 22:00 en un múltiplo de 30 minutos
- **ENTONCES** el sistema acepta el límite superior como hora de fin

#### Scenario: Inicio anterior a la apertura o fin posterior al cierre
- **CUANDO** el inicio es anterior a las 06:00 o el fin es posterior a las 22:00
- **ENTONCES** el sistema rechaza la solicitud sin guardarla

#### Scenario: Hora no alineada a intervalos de 30 minutos
- **CUANDO** el inicio o el fin incluye minutos distintos de 00 o 30
- **ENTONCES** el sistema rechaza la solicitud sin guardarla

#### Scenario: Inicio no anterior al fin
- **CUANDO** el inicio es igual o posterior al fin
- **ENTONCES** el sistema rechaza la solicitud sin guardarla

### Requirement: SOL-03 Estado inicial de la solicitud
El sistema debe (MUST) crear cada solicitud aceptada en estado PENDIENTE y asociarla con el usuario que la envió.

#### Scenario: Solicitud válida queda pendiente
- **CUANDO** se guarda una solicitud que supera las validaciones de creación
- **ENTONCES** su estado inicial es PENDIENTE y su solicitante es el usuario autenticado

#### Scenario: Usuario inactivo
- **CUANDO** un usuario INACTIVO intenta originar una nueva solicitud
- **ENTONCES** el sistema rechaza la operación y no registra una solicitud nueva

#### Scenario: Espacio inactivo
- **CUANDO** un SOLICITANTE intenta crear una solicitud nueva para un espacio INACTIVO
- **ENTONCES** el sistema rechaza la operación y no registra una solicitud nueva
