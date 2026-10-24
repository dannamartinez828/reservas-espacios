# Spec Delta

## Purpose

Impide que dos reservas APROBADAS del mismo espacio se solapen y permite solicitudes pendientes concurrentes hasta que una decisión administrativa las confirme.

## ADDED Requirements

### Requirement: SIM-01 Cruce de intervalos semiabiertos
El sistema debe (MUST) determinar cruces para el mismo espacio y fecha usando intervalos semiabiertos [inicio, fin), donde existe cruce solo si inicioA < finB y finA > inicioB.

#### Scenario: Dos intervalos se solapan
- **CUANDO** dos intervalos del mismo espacio y fecha comparten tiempo según inicioA < finB y finA > inicioB
- **ENTONCES** el sistema los identifica como cruzados

#### Scenario: Dos reservas son contiguas
- **CUANDO** una reserva termina exactamente al inicio de la otra
- **ENTONCES** el sistema no las considera cruzadas

### Requirement: SIM-02 Solo las aprobadas bloquean nuevas solicitudes
El sistema debe (MUST) rechazar crear una solicitud si existe una reserva APROBADA cruzada del mismo espacio y fecha, y debe permitir solicitudes PENDIENTES que se crucen entre sí.

#### Scenario: Solicitud cruza reserva aprobada
- **CUANDO** se intenta crear una solicitud cruzada con una reserva APROBADA del mismo espacio y fecha
- **ENTONCES** el sistema rechaza la creación e informa el conflicto

#### Scenario: Solicitudes pendientes cruzadas
- **CUANDO** se crean dos solicitudes que se cruzan entre sí para el mismo espacio y fecha y no existe una APROBADA cruzada
- **ENTONCES** el sistema permite ambas y las conserva en estado PENDIENTE

### Requirement: SIM-03 Revalidación antes de aprobar
El sistema debe (MUST) revalidar los cruces con reservas APROBADAS al aprobar una solicitud y debe fallar si existe un cruce para el mismo espacio y fecha.

#### Scenario: Revalidación detecta aprobación concurrente previa
- **CUANDO** se aprueba una solicitud PENDIENTE y ya existe otra reserva APROBADA cruzada del mismo espacio y fecha
- **ENTONCES** la aprobación falla con error de conflicto y la solicitud no cambia a APROBADA

#### Scenario: Aprobación sin cruce
- **CUANDO** se aprueba una solicitud PENDIENTE sin una reserva APROBADA cruzada
- **ENTONCES** el sistema puede completar la transición a APROBADA
