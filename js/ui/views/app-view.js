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

function renderLogin(
  root,
  controller,
  sessionStorage,
  message,
  isError = true,
  adminControllers,
) {
  root.replaceChildren();
  root.classList.remove('admin-app');
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
      renderLogin(root, controller, sessionStorage, result.error, true, adminControllers);
      return;
    }

    try {
      sessionStorage.setItem('userId', result.userId);
    } catch (error) {
      submit.disabled = false;
      renderLogin(root, controller, sessionStorage, error.message, true, adminControllers);
      return;
    }
    showCurrentUser(root, controller, sessionStorage, undefined, adminControllers);
  });
  section.append(form);

  const registerButton = createElement(
    'button',
    'button button-link',
    '¿No tienes cuenta? Regístrate',
  );
  registerButton.type = 'button';
  registerButton.addEventListener('click', () => {
    renderRegistration(root, controller, sessionStorage, undefined, adminControllers);
  });
  section.append(registerButton);
  root.append(section);
}

function renderRegistration(root, controller, sessionStorage, message, adminControllers) {
  root.replaceChildren();
  root.classList.remove('admin-app');
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
      renderRegistration(root, controller, sessionStorage, result.error, adminControllers);
      return;
    }
    renderLogin(
      root,
      controller,
      sessionStorage,
      'Cuenta creada. Ya puedes iniciar sesión.',
      false,
      adminControllers,
    );
  });
  section.append(form);

  const loginButton = createElement(
    'button',
    'button button-link',
    '¿Ya tienes cuenta? Inicia sesión',
  );
  loginButton.type = 'button';
  loginButton.addEventListener('click', () => {
    renderLogin(root, controller, sessionStorage, undefined, true, adminControllers);
  });
  section.append(loginButton);
  root.append(section);
}

function appendAdminNavigation(section, root, sessionStorage, user, adminControllers) {
  const navigation = createElement('nav', 'admin-navigation');
  navigation.setAttribute('aria-label', 'Administración');
  const spacesButton = createElement('button', 'button button-secondary', 'Administrar espacios');
  spacesButton.type = 'button';
  spacesButton.addEventListener('click', () => {
    renderSpaceManagement(root, sessionStorage, user, adminControllers);
  });
  const usersButton = createElement('button', 'button button-secondary', 'Administrar usuarios');
  usersButton.type = 'button';
  usersButton.addEventListener('click', () => {
    renderUserManagement(root, sessionStorage, user, adminControllers);
  });
  navigation.append(spacesButton, usersButton);
  section.append(navigation);
}

function renderWelcome(root, controller, sessionStorage, user, adminControllers) {
  root.replaceChildren();
  root.classList.remove('admin-app');
  const section = createElement('section', 'card welcome-card');
  section.append(
    createElement('p', 'eyebrow', 'Reservas académicas'),
    createElement('h1', '', `Bienvenido, ${user.nombre}`),
    createElement('p', 'intro', `Rol: ${user.rol}`),
  );
  if (user.rol === 'ADMIN' && user.estado === 'ACTIVO') {
    appendAdminNavigation(section, root, sessionStorage, user, adminControllers);
  }
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
    renderLogin(root, controller, sessionStorage, 'Sesión cerrada.', false, adminControllers);
  });
  section.append(logoutButton);
  root.append(section);
}

function appendAdminPageNavigation(section, root, sessionStorage, user, adminControllers) {
  const navigation = createElement('nav', 'admin-navigation');
  navigation.setAttribute('aria-label', 'Navegación de administración');
  const welcomeButton = createElement('button', 'button button-link', 'Volver a bienvenida');
  welcomeButton.type = 'button';
  welcomeButton.addEventListener('click', () => {
    showCurrentUser(
      root,
      adminControllers.authController,
      sessionStorage,
      undefined,
      adminControllers,
    );
  });
  const spacesButton = createElement('button', 'button button-link', 'Espacios');
  spacesButton.type = 'button';
  spacesButton.addEventListener('click', () => {
    renderSpaceManagement(root, sessionStorage, user, adminControllers);
  });
  const usersButton = createElement('button', 'button button-link', 'Usuarios');
  usersButton.type = 'button';
  usersButton.addEventListener('click', () => {
    renderUserManagement(root, sessionStorage, user, adminControllers);
  });
  navigation.append(welcomeButton, spacesButton, usersButton);
  section.append(navigation);
}

function appendTable(section, headings, rows) {
  const wrapper = createElement('div', 'table-wrap');
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const heading of headings) {
    const cell = createElement('th', '', heading);
    cell.scope = 'col';
    headerRow.append(cell);
  }
  head.append(headerRow);
  const body = document.createElement('tbody');
  for (const row of rows) {
    body.append(row);
  }
  table.append(head, body);
  wrapper.append(table);
  section.append(wrapper);
}

function appendSpaceForm(section, root, user, adminControllers, editingSpace) {
  const form = document.createElement('form');
  form.noValidate = true;
  form.className = 'admin-form';
  const fields = [
    { labelText: 'Tipo', name: 'tipo', type: 'select' },
    { labelText: 'Nombre', name: 'nombre', type: 'text' },
    { labelText: 'Capacidad', name: 'capacidad', type: 'number' },
    { labelText: 'Ubicación', name: 'ubicacion', type: 'text' },
  ];
  const inputs = {};
  for (const field of fields) {
    const label = createElement('label', 'field');
    label.append(createElement('span', '', field.labelText));
    if (field.type === 'select') {
      const select = document.createElement('select');
      select.name = field.name;
      for (const [value, text] of [
        ['LABORATORIO', 'Laboratorio'],
        ['AUDITORIO', 'Auditorio'],
        ['SALA_COMPUTO', 'Sala de cómputo'],
      ]) {
        const option = createElement('option', '', text);
        option.value = value;
        select.append(option);
      }
      inputs[field.name] = select;
      label.append(select);
    } else {
      const input = document.createElement('input');
      input.name = field.name;
      input.type = field.type;
      if (field.name === 'capacidad') {
        input.step = '1';
      }
      inputs[field.name] = input;
      label.append(input);
    }
    form.append(label);
  }
  if (editingSpace) {
    for (const [name, input] of Object.entries(inputs)) {
      input.value = editingSpace[name];
    }
  }
  const submit = createElement(
    'button',
    'button button-primary',
    editingSpace ? 'Guardar cambios' : 'Crear espacio',
  );
  submit.type = 'submit';
  form.append(submit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const changes = {
      tipo: inputs.tipo.value,
      nombre: inputs.nombre.value,
      capacidad: Number(inputs.capacidad.value),
      ubicacion: inputs.ubicacion.value,
    };
    const result = editingSpace
      ? adminControllers.spaceController.edit(user.id, editingSpace.id, changes)
      : adminControllers.spaceController.create(user.id, changes);
    renderSpaceManagement(
      root,
      adminControllers.sessionStorage,
      user,
      adminControllers,
      result.ok ? (editingSpace ? 'Cambios guardados.' : 'Espacio creado.') : result.error,
      undefined,
      result.ok,
    );
  });
  if (editingSpace) {
    const cancel = createElement('button', 'button button-link', 'Cancelar edición');
    cancel.type = 'button';
    cancel.addEventListener('click', () => {
      renderSpaceManagement(
        root,
        adminControllers.sessionStorage,
        user,
        adminControllers,
      );
    });
    form.append(cancel);
  }
  section.append(form);
}

function renderSpaceManagement(
  root,
  sessionStorage,
  user,
  adminControllers,
  message,
  editingSpace,
  isSuccess = false,
) {
  root.replaceChildren();
  root.classList.add('admin-app');
  const section = createElement('section', 'card admin-card');
  section.append(
    createElement('p', 'eyebrow', 'Administración'),
    createElement('h1', '', 'Espacios'),
    createElement('p', 'intro', 'Crea, edita y cambia el estado de los espacios.'),
  );
  const result = adminControllers.spaceController.list(user.id);
  if (!result.ok) {
    renderMessage(section, result.error);
    root.append(section);
    return;
  }
  appendAdminPageNavigation(section, root, sessionStorage, user, adminControllers);
  if (message) {
    renderMessage(section, message, !isSuccess);
  }
  appendSpaceForm(section, root, user, adminControllers, editingSpace);

  const rows = result.spaces.map((space) => {
      const row = document.createElement('tr');
      for (const value of [space.tipo, space.nombre, String(space.capacidad), space.ubicacion, space.estado]) {
        row.append(createElement('td', '', value));
      }
      const actions = document.createElement('td');
      const edit = createElement('button', 'button button-link', 'Editar');
      edit.type = 'button';
      edit.addEventListener('click', () => {
        renderSpaceManagement(
          root,
          sessionStorage,
          user,
          adminControllers,
          undefined,
          space,
        );
      });
      const status = createElement(
        'button',
        'button button-link',
        space.estado === 'ACTIVO' ? 'Desactivar' : 'Activar',
      );
      status.type = 'button';
      status.addEventListener('click', () => {
        const nextStatus = space.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        const statusResult = adminControllers.spaceController.setStatus(user.id, space.id, nextStatus);
        renderSpaceManagement(
          root,
          sessionStorage,
          user,
          adminControllers,
          statusResult.ok ? 'Estado del espacio actualizado.' : statusResult.error,
          undefined,
          statusResult.ok,
        );
      });
      actions.append(edit, status);
      row.append(actions);
      return row;
  });
  appendTable(section, ['Tipo', 'Nombre', 'Capacidad', 'Ubicación', 'Estado', 'Acciones'], rows);
  if (rows.length === 0) {
    renderMessage(section, 'No hay espacios registrados.', false);
  }
  root.append(section);
}

function renderUserManagement(
  root,
  sessionStorage,
  user,
  adminControllers,
  message,
  isSuccess = false,
) {
  root.replaceChildren();
  root.classList.add('admin-app');
  const section = createElement('section', 'card admin-card');
  section.append(
    createElement('p', 'eyebrow', 'Administración'),
    createElement('h1', '', 'Usuarios'),
    createElement('p', 'intro', 'Consulta las cuentas y cambia su estado.'),
  );
  const result = adminControllers.userController.list(user.id);
  if (!result.ok) {
    renderMessage(section, result.error);
    root.append(section);
    return;
  }
  appendAdminPageNavigation(section, root, sessionStorage, user, adminControllers);
  if (message) {
    renderMessage(section, message, !isSuccess);
  }
  const rows = result.users.map((account) => {
      const row = document.createElement('tr');
      for (const value of [account.nombre, account.correo, account.rol, account.estado]) {
        row.append(createElement('td', '', value));
      }
      const actions = document.createElement('td');
      const status = createElement(
        'button',
        'button button-link',
        account.estado === 'ACTIVO' ? 'Desactivar' : 'Activar',
      );
      status.type = 'button';
      status.addEventListener('click', () => {
        const nextStatus = account.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        const statusResult = adminControllers.userController.setStatus(
          user.id,
          account.id,
          nextStatus,
        );
        renderUserManagement(
          root,
          sessionStorage,
          user,
          adminControllers,
          statusResult.ok ? 'Estado de la cuenta actualizado.' : statusResult.error,
          statusResult.ok,
        );
      });
      actions.append(status);
      row.append(actions);
      return row;
  });
  appendTable(section, ['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'], rows);
  if (rows.length === 0) {
    renderMessage(section, 'No hay usuarios registrados.', false);
  }
  root.append(section);
}

function showCurrentUser(root, controller, sessionStorage, message, adminControllers) {
  let userId;
  try {
    userId = sessionStorage.getItem('userId');
  } catch (error) {
    renderLogin(root, controller, sessionStorage, error.message, true, adminControllers);
    return;
  }
  const result = controller.getCurrentUser(userId);
  if (!result.ok) {
    try {
      sessionStorage.removeItem('userId');
    } catch (error) {
      renderLogin(root, controller, sessionStorage, error.message, true, adminControllers);
      return;
    }
    renderLogin(root, controller, sessionStorage, message || result.error, true, adminControllers);
    return;
  }
  renderWelcome(root, controller, sessionStorage, result.user, adminControllers);
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

export function mountAppView({
  root,
  controller,
  sessionStorage,
  spaceController,
  userController,
}) {
  const adminControllers = {
    root,
    sessionStorage,
    authController: controller,
    spaceController,
    userController,
  };
  controller.initialize().then((result) => {
    if (!result.ok) {
      showAppError(root, result.error);
      return;
    }

    const userId = sessionStorage.getItem('userId');
    if (userId) {
      showCurrentUser(root, controller, sessionStorage, undefined, adminControllers);
      return;
    }
    renderLogin(root, controller, sessionStorage, undefined, true, adminControllers);
  }).catch((error) => {
    showAppError(root, error instanceof Error ? error.message : String(error));
  });
}
