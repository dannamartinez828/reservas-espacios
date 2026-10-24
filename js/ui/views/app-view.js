function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function appendField(form, { labelText, name, type, autocomplete }) {
  const label = createElement('label', 'field');
  label.append(createElement('span', '', labelText));
  const input = document.createElement('input');
  input.name = name;
  input.type = type;
  input.autocomplete = autocomplete;
  label.append(input);
  form.append(label);
  return input;
}

function renderMessage(container, text, isError = true) {
  const message = createElement(
    'p',
    isError ? 'message message-error' : 'message message-success',
    text,
  );
  message.setAttribute('role', isError ? 'alert' : 'status');
  container.append(message);
}

function renderLogin(root, controller, sessionStorage, message, isError = true) {
  root.replaceChildren();
  const section = createElement('section', 'card');
  section.append(
    createElement('p', 'eyebrow', 'Reservas académicas'),
    createElement('h1', '', 'Iniciar sesión'),
    createElement('p', 'intro', 'Ingresa con tu correo y contraseña.'),
  );
  if (message) {
    renderMessage(section, message, isError);
  }

  const form = document.createElement('form');
  form.noValidate = true;
  const email = appendField(form, {
    labelText: 'Correo electrónico',
    name: 'correo',
    type: 'text',
    autocomplete: 'email',
  });
  const password = appendField(form, {
    labelText: 'Contraseña',
    name: 'password',
    type: 'password',
    autocomplete: 'current-password',
  });
  const submit = createElement('button', 'button button-primary', 'Iniciar sesión');
  submit.type = 'submit';
  form.append(submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    const result = await controller.login({
      correo: email.value,
      password: password.value,
    });
    password.value = '';
    if (!result.ok) {
      submit.disabled = false;
      renderLogin(root, controller, sessionStorage, result.error);
      return;
    }

    try {
      sessionStorage.setItem('userId', result.userId);
    } catch (error) {
      submit.disabled = false;
      renderLogin(root, controller, sessionStorage, error.message);
      return;
    }
    showCurrentUser(root, controller, sessionStorage);
  });
  section.append(form);

  const registerButton = createElement(
    'button',
    'button button-link',
    '¿No tienes cuenta? Regístrate',
  );
  registerButton.type = 'button';
  registerButton.addEventListener('click', () => {
    renderRegistration(root, controller, sessionStorage);
  });
  section.append(registerButton);
  root.append(section);
}

function renderRegistration(root, controller, sessionStorage, message) {
  root.replaceChildren();
  const section = createElement('section', 'card');
  section.append(
    createElement('p', 'eyebrow', 'Reservas académicas'),
    createElement('h1', '', 'Crear cuenta'),
    createElement('p', 'intro', 'Regístrate como solicitante.'),
  );
  if (message) {
    renderMessage(section, message);
  }

  const form = document.createElement('form');
  form.noValidate = true;
  const name = appendField(form, {
    labelText: 'Nombre',
    name: 'nombre',
    type: 'text',
    autocomplete: 'name',
  });
  const email = appendField(form, {
    labelText: 'Correo electrónico',
    name: 'correo',
    type: 'text',
    autocomplete: 'email',
  });
  const password = appendField(form, {
    labelText: 'Contraseña',
    name: 'password',
    type: 'password',
    autocomplete: 'new-password',
  });
  const submit = createElement('button', 'button button-primary', 'Crear cuenta');
  submit.type = 'submit';
  form.append(submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    const result = await controller.register({
      nombre: name.value,
      correo: email.value,
      password: password.value,
    });
    password.value = '';
    if (!result.ok) {
      renderRegistration(root, controller, sessionStorage, result.error);
      return;
    }
    renderLogin(root, controller, sessionStorage, 'Cuenta creada. Ya puedes iniciar sesión.', false);
  });
  section.append(form);

  const loginButton = createElement(
    'button',
    'button button-link',
    '¿Ya tienes cuenta? Inicia sesión',
  );
  loginButton.type = 'button';
  loginButton.addEventListener('click', () => {
    renderLogin(root, controller, sessionStorage);
  });
  section.append(loginButton);
  root.append(section);
}

function renderWelcome(root, controller, sessionStorage, user) {
  root.replaceChildren();
  const section = createElement('section', 'card welcome-card');
  section.append(
    createElement('p', 'eyebrow', 'Reservas académicas'),
    createElement('h1', '', `Bienvenido, ${user.nombre}`),
    createElement('p', 'intro', `Rol: ${user.rol}`),
  );
  const logoutButton = createElement('button', 'button button-primary', 'Cerrar sesión');
  logoutButton.type = 'button';
  logoutButton.addEventListener('click', () => {
    const result = controller.logout();
    if (!result.ok) {
      renderMessage(section, result.error);
      return;
    }
    try {
      sessionStorage.removeItem('userId');
    } catch (error) {
      renderMessage(section, error.message);
      return;
    }
    renderLogin(root, controller, sessionStorage, 'Sesión cerrada.', false);
  });
  section.append(logoutButton);
  root.append(section);
}

function showCurrentUser(root, controller, sessionStorage, message) {
  let userId;
  try {
    userId = sessionStorage.getItem('userId');
  } catch (error) {
    renderLogin(root, controller, sessionStorage, error.message);
    return;
  }
  const result = controller.getCurrentUser(userId);
  if (!result.ok) {
    try {
      sessionStorage.removeItem('userId');
    } catch (error) {
      renderLogin(root, controller, sessionStorage, error.message);
      return;
    }
    renderLogin(root, controller, sessionStorage, message || result.error);
    return;
  }
  renderWelcome(root, controller, sessionStorage, result.user);
}

export function showAppError(root, message) {
  root.replaceChildren();
  const section = createElement('section', 'card');
  section.append(
    createElement('h1', '', 'No se pudo iniciar la aplicación'),
  );
  renderMessage(section, message);
  root.append(section);
}

export function mountAppView({ root, controller, sessionStorage }) {
  controller.initialize().then((result) => {
    if (!result.ok) {
      showAppError(root, result.error);
      return;
    }

    const userId = sessionStorage.getItem('userId');
    if (userId) {
      showCurrentUser(root, controller, sessionStorage);
      return;
    }
    renderLogin(root, controller, sessionStorage);
  }).catch((error) => {
    showAppError(root, error instanceof Error ? error.message : String(error));
  });
}
