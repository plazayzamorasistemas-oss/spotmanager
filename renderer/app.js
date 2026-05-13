window.onload = async () => {
  await api.initDatabase();
  loadTypes();
  loadProviders();
  loadAdServices();
  loadAdPackages();
  loadMaintenanceServices();

};

async function loadTypes() {
  const rows = await api.dbQuery("SELECT * FROM provider_types ORDER BY name");
  const table = document.getElementById("typesTable");
  const select = document.getElementById("provType");

  table.innerHTML = "<tr><th>ID</th><th>Nombre</th></tr>";
  select.innerHTML = "";

  rows.forEach(r => {
    table.innerHTML += `<tr><td>${r.id}</td><td>${r.name}</td></tr>`;
    select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
  });
}

async function saveType() {
  const name = document.getElementById("typeName").value;
  if (!name) return alert("Ingrese un nombre");

  await api.dbQuery("INSERT INTO provider_types (name) VALUES (?)", [name]);
  document.getElementById("typeName").value = "";
  loadTypes();
}

async function saveProvider() {
  const id = document.getElementById("provId").value;
  const name = document.getElementById("provName").value;
  const phone = document.getElementById("provPhone").value;
  const address = document.getElementById("provAddress").value;
  const rif = document.getElementById("provRif").value;
  const legal = document.getElementById("provLegal").value;
  const type = document.getElementById("provType").value;

  if (!name) return alert("El nombre es obligatorio");

  if (id) {
    // UPDATE
    await api.dbQuery(
      `UPDATE providers
       SET name=?, phone=?, address=?, rif=?, legal_rep=?, provider_type_id=?
       WHERE id=?`,
      [name, phone, address, rif, legal, type, id]
    );
  } else {
    // INSERT
    await api.dbQuery(
      `INSERT INTO providers (name, phone, address, rif, legal_rep, provider_type_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, phone, address, rif, legal, type]
    );
  }

  clearProviderForm();
  loadProviders();
}


async function loadProviders() {
  const rows = await api.dbQuery(`
    SELECT p.*, t.name AS type_name
    FROM providers p
    LEFT JOIN provider_types t ON t.id = p.provider_type_id
    ORDER BY p.name
  `);

  const table = document.getElementById("providersTable");

  table.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Dirección</th>
      <th>Teléfono</th>
      <th>RIF</th>
      <th>Representante legal</th>
      <th>Tipo</th>
      <th>Acciones</th>
    </tr>
  `;

  rows.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>${r.address || ""}</td>
        <td>${r.phone || ""}</td>
        <td>${r.rif || ""}</td>
        <td>${r.legal_rep || ""}</td>
        <td>${r.type_name || ""}</td>
        <td>
          <button onclick='editProvider(${JSON.stringify(r)})'>Editar</button>
        </td>
      </tr>
    `;
  });
}

function editProvider(provider) {
  document.getElementById("provId").value = provider.id;
  document.getElementById("provName").value = provider.name;
  document.getElementById("provPhone").value = provider.phone || "";
  document.getElementById("provAddress").value = provider.address || "";
  document.getElementById("provRif").value = provider.rif || "";
  document.getElementById("provLegal").value = provider.legal_rep || "";

  // Seleccionar tipo
  const select = document.getElementById("provType");
  select.value = provider.provider_type_id;
}


function clearProviderForm() {
  document.getElementById("provId").value = "";
  document.getElementById("provName").value = "";
  document.getElementById("provPhone").value = "";
  document.getElementById("provAddress").value = "";
  document.getElementById("provRif").value = "";
  document.getElementById("provLegal").value = "";
}


/* Modulo 2  */

async function saveAdPackage() {
  const id = document.getElementById("packId").value.trim();
  const name = packName.value;
  const cost = packCost.value;
  const start = packStart.value;
  const end = packEnd.value;

  if (!name || !cost || !start || !end) {
    alert("Debe completar todos los campos del paquete.");
    return;
  }

  if (id !== "") {
    // UPDATE del paquete
    await api.dbQuery(
      `UPDATE ad_packages
       SET name = ?, cost = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [name, cost, start, end, id]
    );

    // Borrar servicios anteriores
    await api.dbQuery(
      "DELETE FROM ad_package_items WHERE package_id = ?",
      [id]
    );

    // Insertar servicios nuevos
    const checks = document.querySelectorAll(".pack-service:checked");
    for (let c of checks) {
      await api.dbQuery(
        "INSERT INTO ad_package_items (package_id, service_id) VALUES (?, ?)",
        [id, c.value]
      );
    }

  } else {
    // INSERT del paquete
    await api.dbQuery(
      "INSERT INTO ad_packages (name, cost, start_date, end_date) VALUES (?, ?, ?, ?)",
      [name, cost, start, end]
    );

    const pkg = await api.dbQuery("SELECT last_insert_rowid() AS id");
    const pkgId = pkg[0].id;

    const checks = document.querySelectorAll(".pack-service:checked");
    for (let c of checks) {
      await api.dbQuery(
        "INSERT INTO ad_package_items (package_id, service_id) VALUES (?, ?)",
        [pkgId, c.value]
      );
    }
  }

  // Limpiar formulario
  document.getElementById("packId").value = "";
  packName.value = "";
  packCost.value = "";
  packStart.value = "";
  packEnd.value = "";
  document.querySelectorAll(".pack-service").forEach(cb => cb.checked = false);

  loadAdPackages();
  alert("Paquete guardado correctamente");
}


async function editAdPackage(pkg) {
  // Cargar datos básicos
  document.getElementById("packId").value = pkg.id;
  document.getElementById("packName").value = pkg.name;
  document.getElementById("packCost").value = pkg.cost;
  document.getElementById("packStart").value = pkg.start_date;
  document.getElementById("packEnd").value = pkg.end_date;

  // Cargar servicios del paquete
  const selected = await api.dbQuery(
    "SELECT service_id FROM ad_package_items WHERE package_id = ?",
    [pkg.id]
  );

  const selectedIds = selected.map(s => s.service_id);

  // Marcar checkboxes
  document.querySelectorAll(".pack-service").forEach(cb => {
    cb.checked = selectedIds.includes(parseInt(cb.value));
  });
}


async function loadAdPackages() {
  const rows = await api.dbQuery("SELECT * FROM ad_packages ORDER BY name");
  const table = document.getElementById("adPackagesTable");

  table.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Costo</th>
      <th>Inicio</th>
      <th>Fin</th>
      <th>Servicios incluidos</th>
      <th>Acciones</th>
    </tr>
  `;

  for (let pkg of rows) {
    const services = await api.dbQuery(`
      SELECT s.name
      FROM ad_package_items i
      JOIN ad_services s ON s.id = i.service_id
      WHERE i.package_id = ?
    `, [pkg.id]);

    const serviceList = services.map(s => s.name).join(", ");

    table.innerHTML += `
      <tr>
        <td>${pkg.id}</td>
        <td>${pkg.name}</td>
        <td>${pkg.cost}</td>
        <td>${pkg.start_date}</td>
        <td>${pkg.end_date}</td>
        <td>${serviceList}</td>
        <td>
          <button onclick='editAdPackage(${JSON.stringify(pkg)})'>Editar</button>
        </td>
      </tr>
    `;
  }
}



async function loadAdServicesForPackages() {
  const rows = await api.dbQuery("SELECT * FROM ad_services ORDER BY name");
  const container = document.getElementById("packServicesList");

  container.innerHTML = "";

  rows.forEach(r => {
    const div = document.createElement("div");
    div.className = "service-item";

    div.innerHTML = `
      <label>
        <input type="checkbox" class="pack-service" value="${r.id}">
        ${r.name} — $${r.cost}
      </label>
    `;

    container.appendChild(div);
  });
}

function editAdService(service) {
  document.getElementById("adId").value = service.id;
  document.getElementById("adName").value = service.name;
  document.getElementById("adCost").value = service.cost;
  document.getElementById("adFreq").value = service.frequency;
}


async function loadAdServices() {
  const rows = await api.dbQuery("SELECT * FROM ad_services ORDER BY name");
  const table = document.getElementById("adServicesTable");

  table.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Costo</th>
      <th>Frecuencia</th>
      <th>Acciones</th>
    </tr>
  `;

  rows.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>${r.cost}</td>
        <td>${r.frequency}</td>
        <td>
          <button class="edit" onclick='editAdService(${JSON.stringify(r)})'>Editar</button>
        </td>
      </tr>
    `;
  });

  loadAdServicesForPackages();
}


async function saveAdService() {
  const id = document.getElementById("adId").value.trim();
  const name = document.getElementById("adName").value.trim();
  const cost = document.getElementById("adCost").value.trim();
  const freq = document.getElementById("adFreq").value.trim();


  if (!name || !cost) {
    alert("Debe completar nombre y costo");
    return;
  }

  if (id !== "")
 {
    // UPDATE
    await api.dbQuery(
      `UPDATE ad_services
       SET name = ?, cost = ?, frequency = ?
       WHERE id = ?`,
      [name, cost, freq, id]
    );
  } else {
    // INSERT
    await api.dbQuery(
      "INSERT INTO ad_services (name, cost, frequency) VALUES (?, ?, ?)",
      [name, cost, freq]
    );
  }

  // Limpiar formulario
  document.getElementById("adId").value = "";
  document.getElementById("adName").value = "";
  document.getElementById("adCost").value = "";

  loadAdServices();
}

/* Modulo 3 */

async function loadMaintenanceServices() {
  const rows = await api.dbQuery("SELECT * FROM maintenance_services ORDER BY name");
  const table = document.getElementById("mntServicesTable");

  table.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Costo</th>
      <th>Acciones</th>
    </tr>
  `;

  rows.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>${r.cost}</td>
        <td>
          <button class="edit" onclick='editMaintenanceService(${JSON.stringify(r)})'>Editar</button>
        </td>
      </tr>
    `;
  });
}

function editMaintenanceService(service) {
  document.getElementById("mntId").value = service.id;
  document.getElementById("mntName").value = service.name;
  document.getElementById("mntCost").value = service.cost;
}


async function saveMaintenanceService() {
  const id = document.getElementById("mntId").value.trim();
  const name = document.getElementById("mntName").value.trim();
  const cost = document.getElementById("mntCost").value.trim();

  if (!name || !cost) {
    alert("Debe completar nombre y costo");
    return;
  }

  if (id !== "") {
    // UPDATE
    await api.dbQuery(
      `UPDATE maintenance_services
       SET name = ?, cost = ?
       WHERE id = ?`,
      [name, cost, id]
    );
  } else {
    // INSERT
    await api.dbQuery(
      "INSERT INTO maintenance_services (name, cost) VALUES (?, ?)",
      [name, cost]
    );
  }

  // Limpiar formulario
  document.getElementById("mntId").value = "";
  document.getElementById("mntName").value = "";
  document.getElementById("mntCost").value = "";

  loadMaintenanceServices();
}



