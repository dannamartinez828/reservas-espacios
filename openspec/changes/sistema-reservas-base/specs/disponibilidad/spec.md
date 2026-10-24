# Spec Delta

## Purpose

Permite consultar los espacios que pueden solicitarse en una fecha y franja horaria, mostrando la disponibilidad conforme a las reservas aprobadas.

## ADDED Requirements

### Requirement: DIS-01 Consulta por fecha y horario
El sistema debe (MUST) permitir a un usuario activo consultar disponibilidad para una fecha y un horario válidos y devolver los espacios ACTIVO que no estén bloqueados por una reserva APROBADA cruzada.

#### Scenario: Consulta devuelve espacios disponibles
- **CUANDO** un usuario activo consulta una fecha y horario válidos
- **ENTONCES** el sistema devuelve los espacios ACTIVO que no tienen una reserva APROBADA cruzada en ese día y horario

#### Scenario: Reserva aprobada bloquea espacio
- **CUANDO** existe una reserva APROBADA del espacio en la fecha consultada con un intervalo que se cruza con el horario consultado
- **ENTONCES** el espacio no aparece como disponible para esa consulta

### Requirement: DIS-02 Solicitudes pendientes no bloquean
El sistema debe (MUST) considerar disponibles los espacios cuyas únicas solicitudes cruzadas para la fecha y horario consultados estén en estado PENDIENTE.

#### Scenario: Solicitud pendiente cruzada
- **CUANDO** un espacio tiene una solicitud PENDIENTE cruzada y ninguna reserva APROBADA cruzada para el horario consultado
- **ENTONCES** el sistema incluye el espacio entre los disponibles

#### Scenario: Intervalos contiguos
- **CUANDO** una reserva APROBADA termina exactamente cuando comienza el horario consultado, o comienza exactamente cuando este termina
- **ENTONCES** el sistema considera que los intervalos no se cruzan y el espacio está disponible
