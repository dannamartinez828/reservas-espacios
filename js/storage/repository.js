function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new TypeError('El documento de almacenamiento debe ser un objeto.');
  }

  if (document.collections === undefined) {
    document.collections = {};
  }
  if (!document.collections || typeof document.collections !== 'object'
    || Array.isArray(document.collections)) {
    throw new TypeError('El documento de almacenamiento tiene colecciones inválidas.');
  }

  return document;
}

function validateCollectionName(name) {
  if (typeof name !== 'string' || !/^[a-z][a-z0-9_-]*$/i.test(name)) {
    throw new TypeError('El nombre de la colección no es válido.');
  }
}

function validateRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)
    || typeof record.id !== 'string' || record.id.length === 0) {
    throw new TypeError('Cada registro debe ser un objeto con un identificador no vacío.');
  }
}

function createStore(adapter) {
  return {
    createRepository(collectionName) {
      validateCollectionName(collectionName);

      function getCollection(document) {
        const collection = document.collections[collectionName];
        if (collection === undefined) {
          document.collections[collectionName] = [];
          return document.collections[collectionName];
        }
        if (!Array.isArray(collection)) {
          throw new TypeError(`La colección "${collectionName}" no es válida.`);
        }
        return collection;
      }

      return {
        obtener(id) {
          if (typeof id !== 'string' || id.length === 0) {
            throw new TypeError('El identificador debe ser una cadena no vacía.');
          }
          const document = validateDocument(adapter.read());
          const record = getCollection(document).find((item) => item.id === id);
          return record === undefined ? null : clone(record);
        },

        guardar(record) {
          validateRecord(record);
          const document = validateDocument(adapter.read());
          const collection = getCollection(document);
          const index = collection.findIndex((item) => item.id === record.id);
          if (index === -1) {
            collection.push(clone(record));
          } else {
            collection[index] = clone(record);
          }
          adapter.write(document);
          return clone(record);
        },

        listar() {
          const document = validateDocument(adapter.read());
          return clone(getCollection(document));
        },

        eliminar(id) {
          if (typeof id !== 'string' || id.length === 0) {
            throw new TypeError('El identificador debe ser una cadena no vacía.');
          }
          const document = validateDocument(adapter.read());
          const collection = getCollection(document);
          const index = collection.findIndex((item) => item.id === id);
          if (index === -1) {
            return false;
          }
          collection.splice(index, 1);
          adapter.write(document);
          return true;
        },
      };
    },
  };
}

export function createMemoryStore() {
  let document = { collections: {} };
  return createStore({
    read() {
      return clone(document);
    },
    write(nextDocument) {
      document = clone(nextDocument);
    },
  });
}

export function createLocalStorageStore(storage, key = 'reservas-academicas') {
  if (!storage || typeof storage.getItem !== 'function'
    || typeof storage.setItem !== 'function') {
    throw new TypeError('El almacenamiento debe implementar getItem y setItem.');
  }
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('La clave de almacenamiento debe ser una cadena no vacía.');
  }

  return createStore({
    read() {
      const serialized = storage.getItem(key);
      if (serialized === null) {
        return { collections: {} };
      }
      return validateDocument(JSON.parse(serialized));
    },
    write(document) {
      storage.setItem(key, JSON.stringify(validateDocument(document)));
    },
  });
}

export function createHistoryRepository(store) {
  if (!store || typeof store.createRepository !== 'function') {
    throw new TypeError('Se requiere un almacén con createRepository.');
  }

  const repository = store.createRepository('historial');
  return Object.freeze({
    agregar(event) {
      validateRecord(event);
      if (repository.obtener(event.id) !== null) {
        throw new Error(`El identificador "${event.id}" ya existe en el historial.`);
      }
      return repository.guardar(event);
    },
    listar(reservationId) {
      if (typeof reservationId !== 'string' || reservationId.length === 0) {
        throw new TypeError('El identificador de reserva debe ser una cadena no vacía.');
      }
      return repository.listar().filter((event) => event.reservaId === reservationId);
    },
  });
}
