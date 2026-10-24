# Spec Delta

## Purpose

Define la gestión de espacios académicos para que sus datos y estados sean consistentes y las solicitudes respeten su disponibilidad administrativa.

## ADDED Requirements

### Requirement: ESP-01 Tipo, nombre único y datos obligatorios
El sistema debe (MUST) permitir registrar espacios con un tipo permitido, nombre único, capacidad positiva y ubicación informada.

#### Scenario: Registro de un espacio válido
- **CUANDO** un ADMIN registra un espacio con tipo LABORATORIO, AUDITORIO o SALA_COMPUTO, nombre no usado, capacidad mayor que cero y ubicación
- **ENTONCES** el espacio queda registrado con estado ACTIVO

#### Scenario: Rechazo de datos inválidos o nombre duplicado
- **CUANDO** un ADMIN intenta registrar un espacio con tipo no permitido, nombre vacío o repetido, capacidad cero o negativa, o ubicación vacía
- **ENTONCES** el sistema rechaza el registro e informa el dato inválido

### Requirement: ESP-02 Estado de espacios
El sistema debe (MUST) permitir que un ADMIN active o desactive espacios sin eliminar ni modificar sus reservas existentes.

#### Scenario: Desactivación conserva reservas existentes
- **CUANDO** un ADMIN cambia a INACTIVO un espacio que tiene reservas
- **ENTONCES** el espacio queda INACTIVO y todas sus reservas existentes se conservan sin cambios

#### Scenario: Activación de un espacio inactivo
- **CUANDO** un ADMIN cambia a ACTIVO un espacio INACTIVO
- **ENTONCES** el espacio queda disponible para nuevas solicitudes que cumplan las demás reglas

### Requirement: ESP-03 Administración restringida de espacios
El sistema debe (MUST) permitir la gestión de espacios únicamente a usuarios ADMIN activos y autenticados.

#### Scenario: Solicitante intenta modificar un espacio
- **CUANDO** un SOLICITANTE intenta crear, editar, activar o desactivar un espacio
- **ENTONCES** el sistema deniega la operación y no altera el espacio
