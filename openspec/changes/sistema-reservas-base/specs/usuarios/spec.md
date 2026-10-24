# Spec Delta

## Purpose

Define el registro, la autenticación de demostración y el estado de las cuentas para que solo usuarios activos puedan ingresar y participar en el sistema.

## ADDED Requirements

### Requirement: USR-01 Registro propio de solicitantes
El sistema debe (MUST) registrar usuarios con nombre, correo único y contraseña guardada como hash, asignando siempre el rol SOLICITANTE y estado activo.

#### Scenario: Registro propio válido
- **CUANDO** una persona se registra con nombre, correo no registrado y contraseña válida
- **ENTONCES** el sistema crea una cuenta activa con rol SOLICITANTE y almacena la contraseña como hash, no como texto plano

#### Scenario: Correo ya registrado
- **CUANDO** una persona intenta registrarse con un correo que ya pertenece a un usuario
- **ENTONCES** el sistema rechaza el registro y no crea una segunda cuenta para ese correo

### Requirement: USR-02 Inicio de sesión de usuario activo
El sistema debe (MUST) autenticar a un usuario activo usando su correo y contraseña correspondientes.

#### Scenario: Inicio de sesión válido
- **CUANDO** un usuario activo presenta su correo y contraseña correctos
- **ENTONCES** el sistema inicia su sesión con el rol asignado a la cuenta

#### Scenario: Usuario inactivo o credenciales incorrectas
- **CUANDO** un usuario inactivo intenta iniciar sesión o se presenta una contraseña incorrecta
- **ENTONCES** el sistema deniega el acceso y no inicia una sesión

### Requirement: USR-03 Usuario administrador semilla de demostración
El sistema debe (MUST) disponer del administrador semilla admin@uninpahu.edu con contraseña de demostración Admin123! almacenada como hash.

#### Scenario: Inicio de sesión con administrador semilla
- **CUANDO** se inicia la aplicación por primera vez y se usan admin@uninpahu.edu y Admin123!
- **ENTONCES** se puede iniciar sesión con una cuenta activa de rol ADMIN

#### Scenario: No duplicar el administrador semilla
- **CUANDO** la inicialización se ejecuta otra vez y la cuenta semilla ya existe
- **ENTONCES** el sistema conserva una sola cuenta admin@uninpahu.edu sin duplicarla

### Requirement: USR-04 Estado de las cuentas
El sistema debe (MUST) permitir a ADMIN activo activar o desactivar usuarios, conservando sus datos y denegando el acceso y las reservas a cuentas inactivas.

#### Scenario: Administrador desactiva una cuenta
- **CUANDO** un ADMIN activo cambia el estado de un usuario a INACTIVO
- **ENTONCES** la cuenta permanece registrada pero no puede iniciar sesión ni crear solicitudes

#### Scenario: Administrador reactiva una cuenta
- **CUANDO** un ADMIN activo cambia el estado de un usuario INACTIVO a ACTIVO
- **ENTONCES** la cuenta puede iniciar sesión y operar de acuerdo con su rol
