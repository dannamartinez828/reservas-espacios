import { generateId } from '../ids.js';
import { hashPassword, verifyPassword } from '../passwords.js';
import { assertCanPerform } from '../policies/permissions.js';

function normalizeEmail(email) {
  if (typeof email !== 'string') {
    throw new TypeError('El correo es obligatorio.');
  }
  const normalized = email.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new TypeError('El correo es obligatorio.');
  }
  return normalized;
}

function normalizeName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new TypeError('El nombre es obligatorio.');
  }
  return name.trim();
}

function toPublicUser(user) {
  const { id, nombre, correo, rol, estado } = user;
  return { id, nombre, correo, rol, estado };
}

export function createUserService(usersRepository) {
  if (!usersRepository || typeof usersRepository.listar !== 'function'
    || typeof usersRepository.guardar !== 'function') {
    throw new TypeError('Se requiere un repositorio de usuarios.');
  }

  return Object.freeze({
    async register({ nombre, correo, password } = {}) {
      const normalizedName = normalizeName(nombre);
      const normalizedEmail = normalizeEmail(correo);
      if (typeof password !== 'string' || password.length === 0) {
        throw new TypeError('La contraseña es obligatoria.');
      }
      if (usersRepository.listar().some((user) => user.correo === normalizedEmail)) {
        throw new Error('El correo ya está registrado.');
      }

      const passwordHash = await hashPassword(password);
      if (usersRepository.listar().some((user) => user.correo === normalizedEmail)) {
        throw new Error('El correo ya está registrado.');
      }
      const user = {
        id: generateId(),
        nombre: normalizedName,
        correo: normalizedEmail,
        passwordHash,
        rol: 'SOLICITANTE',
        estado: 'ACTIVO',
      };
      usersRepository.guardar(user);
      return toPublicUser(user);
    },

    async login({ correo, password } = {}) {
      const normalizedEmail = normalizeEmail(correo);
      const user = usersRepository.listar()
        .find((candidate) => candidate.correo === normalizedEmail);
      if (!user || user.estado !== 'ACTIVO'
        || !await verifyPassword(password, user.passwordHash)) {
        throw new Error('Credenciales incorrectas.');
      }
      return toPublicUser(user);
    },

    async ensureSeedAdmin() {
      const correo = 'admin@uninpahu.edu';
      const existing = usersRepository.listar()
        .find((user) => user.correo === correo);
      if (existing) {
        return toPublicUser(existing);
      }

      const passwordHash = await hashPassword('Admin123!');
      const createdWhileHashing = usersRepository.listar()
        .find((user) => user.correo === correo);
      if (createdWhileHashing) {
        return toPublicUser(createdWhileHashing);
      }
      const user = {
        id: generateId(),
        nombre: 'Administrador',
        correo,
        passwordHash,
        rol: 'ADMIN',
        estado: 'ACTIVO',
      };
      usersRepository.guardar(user);
      return toPublicUser(user);
    },

    setAccountStatus(actor, userId, estado) {
      assertCanPerform(actor, 'manageUsers');
     if (estado !== 'ACTIVO' && estado !== 'INACTIVO') {
        throw new TypeError('El estado de la cuenta no es válido.');
      }
      if (typeof userId !== 'string' || userId.length === 0) {
        throw new TypeError('El identificador del usuario no es válido.');
      }

      const user = usersRepository.listar().find((candidate) => candidate.id === userId);
      if (!user) {
        throw new Error('No se encontró el usuario.');
      }
      const updatedUser = { ...user, estado };
      usersRepository.guardar(updatedUser);
      return toPublicUser(updatedUser);
    },
  });
}
