# PLAN DE INGENIERÍA: Sistema de Gestión de Reservas de Espacios Académicos

**Estudiante:** [Danna Paola martinez Olva]
**Institución:** UNINPAHU, Ingeniería de Software
**Fecha:** Octubre de 2026
**Versión del documento:** 1.0 (planificación inicial, anterior a las especificaciones)

---

## 1. Análisis del problema

### 1.1 Problemática
La institución gestiona hoy las reservas de laboratorios, auditorios y salas de cómputo mediante correos electrónicos y hojas de cálculo. Esto produce:
- **Duplicidad de solicitudes:** la misma solicitud llega por varios canales.
- **Conflictos de horario:** dos grupos creen tener el mismo espacio a la misma hora, porque no existe una fuente única de verdad.
- **Consulta difícil de disponibilidad:** para saber si un espacio está libre hay que revisar hojas manualmente o preguntar por correo.
- **Falta de trazabilidad:** no hay un historial confiable de quién pidió, quién aprobó y qué pasó con cada reserva.

### 1.2 Necesidades de la institución
| ID | Necesidad |
|----|-----------|
| N1 | Centralizar las solicitudes de reserva en un solo sistema. |
| N2 | Consultar la disponibilidad de cada espacio en tiempo real. |
| N3 | Impedir reservas aprobadas que se crucen en el mismo espacio. |
| N4 | Controlar quién puede solicitar y quién puede aprobar. |
| N5 | Conservar el historial de cada reserva y de sus cambios de estado. |
| N6 | Poder cambiar reglas de negocio sin reescribir el sistema. |

### 1.3 Actores
| Actor | Descripción | Interés principal |
|-------|-------------|-------------------|
| Solicitante (docente o estudiante autorizado) | Pide y cancela sus propias reservas. | Conseguir el espacio sin conflictos. |
| Administrador | Gestiona espacios y usuarios; aprueba o rechaza solicitudes. | Uso ordenado de los espacios. |
| Institución | Dueña del proceso; define las reglas de negocio. | Reducir conflictos y tener trazabilidad. |

### 1.4 Alcance
**Incluido:** gestión de espacios; registro y administración de usuarios; roles y permisos; creación de solicitudes; validación de disponibilidad; prevención de reservas simultáneas; aprobación y rechazo; cancelación e historial.

**Excluido (fuera de alcance):** pagos, notificaciones por correo, integración con sistemas académicos, reservas recurrentes, aplicación móvil nativa, multiusuario concurrente real en red.

### 1.5 Limitaciones
- Proyecto individual con herramientas gratuitas (XAMPP, Node.js, Git, GitHub, OpenSpec, agente de IA gratuito).
- Sin servidor de base de datos propio: la persistencia es local al navegador (ver decisión D1).
- La autenticación es **de demostración**: no ofrece seguridad de producción, porque todo el código corre en el cliente.
- Tiempo académico limitado, por eso se prioriza el núcleo de reglas de negocio sobre el diseño visual.

---

## 2. Propuesta de solución

### 2.1 Descripción general
Aplicación web de una sola página (HTML, CSS y JavaScript sin frameworks), servida por Apache de XAMPP. Las reglas de negocio viven en un **núcleo de dominio independiente de la interfaz**, por lo que se pueden probar con pruebas automáticas sin abrir el navegador. Los datos se guardan mediante una capa de repositorio que oculta dónde se almacenan.

### 2.2 Funcionalidades prioritarias (MoSCoW)
| Prioridad | Funcionalidad |
|-----------|---------------|
| Must | Gestión de espacios; usuarios y roles; crear solicitud; validar disponibilidad; prevenir simultaneidad; aprobar/rechazar; cancelar; historial. |
| Should | Vista de disponibilidad por espacio y fecha; filtros por tipo de espacio. |
| Could | Exportar historial a CSV. |
| Won't (esta versión) | Notificaciones, reservas recurrentes, pagos. |

### 2.3 Módulos
| Módulo | Responsabilidad |
|--------|-----------------|
| M1 Núcleo y almacenamiento | Utilidades de fecha/hora, identificadores y repositorio de datos. |
| M2 Usuarios y roles | Registro, administración, autenticación de demostración, permisos. |
| M3 Espacios | Alta, edición y activación/desactivación de espacios. |
| M4 Reservas y disponibilidad | Creación de solicitudes, validación y prevención de cruces. |
| M5 Flujo de aprobación e historial | Aprobar, rechazar, cancelar y registrar cada transición. |
| M6 Interfaz de usuario | Pantallas que consumen los módulos anteriores. |

### 2.4 Estrategia progresiva
Se desarrolla de adentro hacia afuera: primero el dominio y sus pruebas (M1 a M5), luego la interfaz (M6). Cada módulo se especifica, revisa, implementa, prueba y se registra en Git antes de pasar al siguiente.

---

## 3. Decisiones de arquitectura y tecnología

### 3.1 Arquitectura
**Aplicación cliente en capas:** Dominio (reglas puras) → Almacenamiento (repositorios) → Interfaz (HTML/DOM).
Justificación:
- Aísla las reglas de negocio, así que un cambio de regla (N6) toca un solo lugar.
- Permite probar el dominio con Node sin navegador.
- La interfaz no contiene reglas, solo las invoca.

### 3.2 Stack
| Componente | Tecnología |
|-----------|------------|
| Servidor de archivos | Apache (XAMPP) |
| Lenguaje | JavaScript (módulos ES), HTML5, CSS3 |
| Pruebas | Ejecutor nativo de Node.js (`node --test`) |
| Control de versiones | Git y GitHub |
| Especificaciones | OpenSpec |
| Asistente de programación | Agente de IA gratuito |

### 3.3 Persistencia
`localStorage` del navegador, con los datos serializados en JSON, accedido **solo** a través de una interfaz de repositorio (`obtener`, `guardar`, `listar`, `eliminar`). En las pruebas se usa una implementación en memoria de la misma interfaz.

### 3.4 Organización de componentes
Carpetas previstas: `js/domain` (reglas), `js/storage` (repositorios), `js/ui` (vistas y eventos), `tests` (pruebas), `openspec` (especificaciones). La interfaz importa del dominio; el dominio no importa de la interfaz.

### 3.5 Decisiones técnicas y alternativas descartadas
| ID | Decisión | Alternativas descartadas | Justificación |
|----|----------|--------------------------|---------------|
| D1 | Persistencia en `localStorage` detrás de una interfaz de repositorio. | **PHP + MySQL (XAMPP):** más realista, pero añade un segundo lenguaje, servidor y base de datos para un proyecto individual con enfoque en SDD. **IndexedDB:** más capacidad, pero API asíncrona más compleja sin beneficio para el volumen esperado. | Mínima complejidad y cero configuración. El riesgo (datos solo en un navegador) se acepta, se documenta y se reduce con la interfaz de repositorio, que permitiría migrar a MySQL sin tocar el dominio. |
| D2 | JavaScript puro con módulos ES. | **TypeScript:** da tipado, pero exige compilación. **React u otro framework:** exige herramientas de build y esconde conceptos básicos. | Apache sirve los archivos tal cual, sin paso de compilación, y el proyecto es manejable para un perfil de aprendizaje. |
| D3 | Pruebas con `node --test` (ejecutor nativo). | **Jest** y **Vitest:** potentes, pero añaden dependencias y configuración. | Cero dependencias; basta para pruebas unitarias del dominio. |
| D4 | Intervalos de tiempo semiabiertos `[inicio, fin)` para detectar cruces. | **Intervalos cerrados:** impedirían reservas contiguas (una termina a las 10:00 y otra empieza a las 10:00). | Cruce si `inicioA < finB` y `finA > inicioB`; permite turnos seguidos y la fórmula es simple de probar. |
| D5 | Solo las reservas **aprobadas** bloquean la disponibilidad; al aprobar se revalida. | **Que las pendientes también bloqueen:** un solicitante podría ocupar un espacio sin aprobación y bloquear a otros. | Evita bloqueos injustos y mantiene el control en el administrador. La revalidación al aprobar garantiza que nunca existan dos aprobadas cruzadas. |

---

## 4. Estrategia de desarrollo

### 4.1 Metodología
Desarrollo **iterativo e incremental**, individual, con **Spec-Driven Development**: ningún código sin especificación revisada. Seguimiento con un tablero Kanban simple (Por hacer, En curso, Hecho) basado en `tasks.md` de OpenSpec. Commits pequeños con mensajes convencionales (`docs`, `spec`, `feat`, `test`, `fix`, `chore`).

### 4.2 Etapas, orden y dependencias
| Etapa | Contenido | Depende de |
|-------|-----------|------------|
| E1 | M1 Núcleo y almacenamiento | Ninguna |
| E2 | M2 Usuarios y roles | E1 |
| E3 | M3 Espacios | E1, E2 (permisos) |
| E4 | M4 Reservas y disponibilidad | E1, E2, E3 |
| E5 | M5 Aprobación, cancelación e historial | E4 |
| E6 | M6 Interfaz de usuario | E2 a E5 |
| E7 | Gestión de cambios, verificación y cierre | E6 |

### 4.3 Criterios de terminado (Definition of Done)
Una etapa está terminada cuando:
1. Sus requisitos tienen escenarios de aceptación y fueron revisados.
2. Cada escenario tiene al menos una prueba automatizada, nombrada con el ID del requisito.
3. Todas las pruebas (nuevas y anteriores) pasan con `npm test`.
4. Revisé el código generado y entiendo qué hace cada archivo.
5. Los cambios están en Git con mensajes claros.

---

## 5. Estrategia de calidad

### 5.1 Tipos de pruebas
- **Unitarias** del dominio (reglas de tiempo, cruces, transiciones de estado, permisos).
- **De integración** entre dominio y repositorio en memoria (flujos completos de reserva).
- **De regresión:** se ejecuta toda la suite en cada etapa y en cada cambio.
- **Manuales de interfaz:** lista de verificación en el navegador sobre XAMPP.

### 5.2 Riesgos y mitigación
| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R1 | La IA implementa funcionalidades fuera de la especificación o con reglas incorrectas. | Alta | Alto | Prompts acotados a una tarea de `tasks.md`; revisión del diff antes de cada commit; pruebas por escenario. |
| R2 | Requisitos ambiguos (por ejemplo, qué reservas bloquean la disponibilidad). | Media | Alto | Decisiones D4 y D5 documentadas; revisión formal de especificaciones antes de implementar. |
| R3 | Pérdida o inconsistencia de datos en `localStorage` (límite del navegador, borrado de caché). | Media | Medio | Interfaz de repositorio; validación al leer; limitación documentada; posible exportación. |
| R4 | Errores de fechas y zonas horarias. | Media | Alto | Un único módulo de tiempo; horas manejadas como minutos del día y fecha `AAAA-MM-DD`; pruebas de bordes. |
| R5 | Seguridad débil por ejecutarse todo en el cliente. | Alta | Medio | Declarada como limitación; contraseñas con hash; sin datos sensibles reales; migración a servidor como trabajo futuro. |
| R6 | Un cambio de regla rompe funcionalidades existentes. | Media | Alto | Reglas centralizadas en un módulo; suite de regresión; cambios solo vía OpenSpec. |
| R7 | Límites de uso del agente de IA gratuito. | Media | Medio | Tareas pequeñas; progreso guardado en Git; alternar entre herramientas gratuitas. |

### 5.3 Verificación del cumplimiento de requisitos
- Cada requisito tiene un **ID** (por ejemplo `SIM-01`) y el nombre de sus pruebas incluye ese ID.
- Matriz de trazabilidad Requisito → Prueba → Archivo de código (en `INFORME_FINAL.md`).
- `openspec validate` para comprobar el formato de las especificaciones.
- Historial de Git que evidencia la secuencia plan → especificación → implementación.

---

## 6. Uso de SDD e inteligencia artificial

**¿Cómo se usará OpenSpec?** Se inicializará después de este plan. Cada bloque de trabajo será un *change* con propuesta, especificaciones, diseño y tareas. Al terminar, el change se archiva y las especificaciones quedan consolidadas.

**¿Cómo se transformará el plan en especificaciones?** Cada módulo (M1 a M6) y cada necesidad (N1 a N6) se traduce en requisitos con ID, redactados con "debe", y en escenarios CUANDO/ENTONCES verificables. Las decisiones D1 a D5 pasan al diseño del change.

**¿Qué se delegará a la IA?** Redactar borradores de especificaciones, generar código y pruebas por tarea, y detectar inconsistencias entre documentos.

**¿Cómo se verificará el código generado?** Revisión línea a línea del diff, ejecución de pruebas, comparación con el escenario de aceptación y rechazo de lo que no esté en la especificación.

**Decisiones que son responsabilidad del estudiante:** la arquitectura y el stack, las reglas de negocio y sus interpretaciones, qué entra y qué no en el alcance, la aprobación final de cada especificación, la aceptación de cada commit y la sustentación del sistema.

---

## 7. Registro de cambios del plan
| Fecha | Versión | Cambio |
|-------|---------|--------|
| Octubre 2026 | 1.0 | Versión inicial. |