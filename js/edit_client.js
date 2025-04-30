
addPageHeading('page-manage-clients-heading', 'Clients', 'Client');

function createNewClient() {
    document.getElementById('edit-client-title').innerHTML = 'New Client';
}

async function loadClientVehicles(client, selector) {
    const itemsBody = document.querySelector(selector);
    itemsBody.innerHTML = '';
    for (const vehicle_id of client.vehicle_ids) {
        const vehicle = await dbGetVehicleById(vehicle_id);
        if (vehicle) {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', vehicle_id);
            tr.innerHTML = `
                <td><button type="button" class="btn btn-danger remove-vehicle-btn">${BIN_ICON}</button></td>
                <td>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Rego</span>
                        <input type="text" class="form-control vehicle-rego" placeholder="Rego" value="${vehicle.rego}">
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Model</span>
                        <input type="text" class="form-control vehicle-make-model" placeholder="Make and model" value="${vehicle.make_model}">
                    </div>
                    <div>
                        <label for="vehicle-notes" class="form-label">Vehicle Notes</label>
                        <textarea class="form-control vehicle-notes" aria-multiline="true">${vehicle.notes}</textarea>
                    </div>
                </td>
            `;
            itemsBody.appendChild(tr);
            tr.querySelector('.remove-vehicle-btn').addEventListener('click', () => {
                tr.remove();
            });
            const text_elem = tr.querySelector('.vehicle-notes');
            text_elem.value = vehicle.notes;
            text_elem.style.height = text_elem.scrollHeight + "px";
            text_elem.style.overflowY = "hidden";
            text_elem.addEventListener("input", function() {
                this.style.height = "auto";
                this.style.height = this.scrollHeight + "px";
            });
        }
    }
}

function editVehicle(vehicle) {
    return new Promise((resolve, reject) => {
        const modal_container = document.createElement('div');
        modal_container.innerHTML = `
            <div class="modal fade modal-lg" id="modal-edit-vehicle" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h1 class="modal-title fs-5">Edit vehicle</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body modal-confirm-message">
                    <div class="input-group mb-3">
                        <span class="input-group-text">Rego</span>
                        <input type="text" class="form-control vehicle-rego" value="${vehicle.rego}">
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Make and model</span>
                        <input type="text" class="form-control vehicle-make-model" value="${vehicle.make_model}">
                    </div>
                    <div class="mb-3">
                        <label for="vehicle-notes" class="form-label">Notes</label>
                        <textarea class="form-control vehicle-notes" aria-multiline="true"></textarea>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel-btn" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-success modal-save-btn">Save</button>
                  </div>
                </div>
              </div>
            </div>`;
        document.body.appendChild(modal_container);

        const modal_element = document.getElementById('modal-edit-vehicle');
        const modal = new bootstrap.Modal(modal_element);

        const text_elem = modal_container.querySelector('.vehicle-notes');
        text_elem.style.height = text_elem.scrollHeight + "px";
        text_elem.style.overflowY = "hidden";
        text_elem.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        });
        text_elem.value = vehicle.notes;
        text_elem.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        modal_element.querySelector('.modal-cancel-btn').addEventListener('click', () => {
            modal.hide();
            reject(vehicle);
        });
        modal_element.querySelector('.modal-save-btn').addEventListener('click', async () => {
            vehicle.rego = modal_element.querySelector('.vehicle-rego').value;
            vehicle.make_model = modal_element.querySelector('.vehicle-make-model').value;
            vehicle.notes = modal_element.querySelector('.vehicle-notes').value.trim();
            const id = await vehicle.save();
            await current_client.addVehicle(id);
            modal.hide();
            resolve(vehicle);
        });
        modal_element.addEventListener('shown.bs.modal', function() {
            text_elem.style.height = "auto";
            text_elem.style.height = text_elem.scrollHeight + "px";
        });
        modal_element.addEventListener('hidden.bs.modal', function() {
            modal.dispose();
            modal_container.remove();
        });

        modal.show();
    });
}


function vehicleToRow(vehicle, tr) {
    const vehicle_rego_elem = tr.querySelector('.vehicle-rego');
    const vehicle_make_model_elem = tr.querySelector('.vehicle-make-model');
    const vehicle_notes_elem = tr.querySelector('.vehicle-notes');
    vehicle_rego_elem.innerHTML = vehicle.rego;
    vehicle_make_model_elem.innerHTML = vehicle.make_model;
    vehicle_notes_elem.innerHTML = limitString(vehicle.notes, 80, 1);
}

async function addClientVehicleRow(vehicle, edit=false) {
    const page_elem = document.getElementById('page-edit-client');
    const itemsBody = page_elem.querySelector('.client-vehicles-body');
    const tr = document.createElement('tr');
    if (vehicle.id !== undefined) {
        tr.setAttribute('data-id', vehicle.id);
    }
    tr.innerHTML = `
        <td><pre class="vehicle-rego"></pre></td>
        <td><pre class="vehicle-make-model"></pre></td>
        <td><pre class="vehicle-notes"></pre></td>
        <td class="text-end">
            <button type="button" class="btn btn-danger remove-vehicle-btn">${BIN_ICON}</button>
            <button type="button" class="btn btn-warning edit-btn edit-vehicle-btn">${TOOL_ICON}</button>
        </td>
    `;
    itemsBody.appendChild(tr);

    tr.querySelector('.remove-vehicle-btn').addEventListener('click', () => {
        if (tr.hasAttribute('data-id')) {
            const id = parseInt(tr.getAttribute('data-id'));
            current_client.removeVehicle(id);
        }
        tr.remove();
    });
    tr.querySelector('.edit-vehicle-btn').addEventListener('click', async () => {
        const id = parseInt(tr.getAttribute('data-id'));
        const vehicle = await dbGetVehicleById(id);
        editVehicle(vehicle).then(async (vehicle) => {
            vehicleToRow(vehicle, tr);
        });
    });

    vehicleToRow(vehicle, tr);

    if (edit) {
        editVehicle(vehicle).then(async (vehicle) => {
            tr.setAttribute('data-id', vehicle.id);
            vehicleToRow(vehicle, tr);
        }).catch(() => {
            tr.remove();
        });
    }

    return tr;
}

document.getElementById('client-vehicles-add-btn').addEventListener('click', () => {
    addClientVehicleRow(new Vehicle(), true);
});


async function loadClientForEdit(id) {
    const client = await dbGetClientById(id);
    if (!client) {
        userNotification("Error", "Client not found.");
        return;
    }
    current_client = client;
    contactToUi(client.contact, '#page-edit-client .client-info', id);
    for (const id of client.vehicle_ids) {
        const vehicle = await dbGetVehicleById(id);
        if (vehicle) {
            addClientVehicleRow(vehicle);
        }
    }
    const notes_elem = document.getElementById('client-notes')
    notes_elem.value = client.notes;
    notes_elem.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

function editClient(id) {
    console.log("Edit client Id=" + id);
    document.getElementById('edit-client-title').innerHTML = 'Edit Client';
    loadClientForEdit(id);
}

function resetClientForm() {
    const page_elem = document.getElementById('page-edit-client');
    clearContactUi('#page-edit-client .client-info');
    const itemsBody = page_elem.querySelector('.client-vehicles-body');
    itemsBody.innerHTML = '';
    const notes_elem = document.getElementById('client-notes');
    notes_elem.value = '';
    notes_elem.style.height = "50px";
}

async function saveEditClient() {
    uiToContact(current_client.contact, '#page-edit-client .client-info');
    if (!current_client.contact.name) {
        userNotification("Incomplete", "Please enter a client name.");
        console.log("Failed need client name");
        return false;
    }
    current_client.notes = document.getElementById('client-notes').value.trim();
    await current_client.save();
    if (current_client.id !== undefined) {
        return true;
    }
    return false;
}

