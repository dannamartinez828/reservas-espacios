const ITERATIONS = 120_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('La API Web Crypto no está disponible para proteger contraseñas.');
  }
  return cryptoApi;
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value) {
  if (typeof value !== 'string' || value.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(value)) {
    throw new TypeError('El valor hexadecimal de la contraseña no es válido.');
  }
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function derivePasswordHash(password, salt, iterations) {
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await cryptoApi.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_LENGTH * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('La contraseña es obligatoria.');
  }

  const cryptoApi = getCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await derivePasswordHash(password, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password, encodedHash) {
  if (typeof password !== 'string' || typeof encodedHash !== 'string') {
    return false;
  }

  const [algorithm, iterationValue, saltHex, hashHex, extra] = encodedHash.split('$');
  const iterations = Number(iterationValue);
  if (algorithm !== 'pbkdf2-sha256' || iterations !== ITERATIONS
    || saltHex === undefined || hashHex === undefined || extra !== undefined) {
    return false;
  }

  const salt = fromHex(saltHex);
  const expected = fromHex(hashHex);
  if (salt.length !== SALT_LENGTH || expected.length !== HASH_LENGTH) {
    return false;
  }

  const actual = await derivePasswordHash(password, salt, iterations);
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected[index] ^ actual[index];
  }
  return difference === 0;
}
