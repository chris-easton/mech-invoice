
addPageHeading('page-manage-invoices-heading', 'Invoices', 'Invoice');

function createNewInvoice() {
    current_invoice = new Invoice();
    current_invoice.gst_pct = settings.vendor_gst || 0.0;
    current_invoice.number = settings.getNextInvoiceNumber();
}


function invoiceToEditUi(invoice, client, vehicle) {

    invoice.updateTotal();

    const invoice_page = document.getElementById('page-edit-invoice');

    invoice_page.querySelector('.invoice-date').valueAsDate = new Date(invoice.date);

    if (invoice.due_date !== null) {
        invoice_page.querySelector('.invoice-due-date').valueAsDate = new Date(invoice.due_date);
    }

    var invoice_info = '';
    invoice_info += `<tr><td>Invoice number:</td>
        <td data-testid="page-edit-invoice-number">${invoice.number}</td></tr>`;
    if (invoice.hasBeenUploaded()) {
        invoice_info += `<tr><td>Invoice uploaded:</td>
            <td data-testid="page-edit-invoice-date">${formatDate(invoice.last_upload_date, true)}</td></tr>`;
    } else {
        invoice_info += `<tr><td>Invoice uploaded:</td>
            <td data-testid="page-edit-invoice-uploaded">Not yet uploaded</td></tr>`;
    }
    if (invoice.email_sent_dates.length > 0) {
        var dates = '';
        var first = true;
        for (let i = invoice.email_sent_dates.length - 1; i >= 0; i--) {
            const date = formatDate(invoice.email_sent_dates[i], true);
            if (first) {
                first = false;
            } else {
                dates += '<br>';
            }
            dates += date;
        }
        invoice_info += `<tr><td>Invoice sent:</td>
            <td data-testid="page-edit-invoice-emailed">dates</td></tr>`;
    } else {
        invoice_info += `<tr><td>Invoice sent:</td>
            <td data-testid="page-edit-invoice-emailed">Not yet sent</td></tr>`;
    }

    invoice_page.querySelector('.invoice-info-table').innerHTML = invoice_info;

    if (client) {
        // Loading an existing invoice with a client
        clientToUi(client, '#page-edit-invoice .client-info');
        // Allow the client to be edited
        enableContactUi('#page-edit-invoice .client-info');
        // Allow vehicles to be created or chosen for this client
        enableVehicleButtons();
        // Limit the vehicles that can be chosen to those linked to the client
        vehicle_chooser_filter = client.vehicle_ids;
    }

    if (vehicle) {
        vehicleToUi(vehicle, invoice.odo);
        enableVehicleUi();
    }

    for (const invoice_item of invoice.items) {
        if (!invoice_item.deleted) {
            addInvoiceItemRow(invoice_item.id);
        }
    }

    invoice_page.querySelector('.invoice-sub-total').textContent = invoice.sub_total.toFixed(2);
    invoice_page.querySelector('.invoice-gst-rate').textContent = 'GST(' + invoice.gst_pct.toFixed(0) + '%)';
    invoice_page.querySelector('.invoice-gst').textContent = invoice.gst_value.toFixed(2);

    const invoice_discount_elem = invoice_page.querySelector('.invoice-discount');
    invoice_discount_elem.value = invoice.discount.toFixed(2);
    if (invoice.discount_pct !== 0.0) {
        invoice_discount_elem.disabled = true;
        invoice_discount_elem.readonly = true;
    } else {
        invoice_discount_elem.disabled = false;
        invoice_discount_elem.readonly = false;
    }
    invoice_page.querySelector('.invoice-discount-pct').value = invoice.discount_pct.toFixed(2);
    invoice_page.querySelector('.invoice-received-row').classList.remove('hidden');
    invoice_page.querySelector('.invoice-received').value = invoice.received.toFixed(2);
    invoice_page.querySelector('.invoice-total').textContent = invoice.total.toFixed(2);

    const notes_elem = invoice_page.querySelector('.invoice-notes');
    notes_elem.value = invoice.notes;
    notes_elem.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}


async function editInvoice(id, isNew=false) {
    let client = null;
    let vehicle = null;
    if (!isNew) {
        document.getElementById('edit-invoice-title').innerHTML = 'Edit Invoice';
        const invoice = await dbGetInvoiceById(id);
        client = await dbGetClientById(invoice.client_id);
        current_invoice = invoice;
        if (invoice.vehicle_id !== -1) {
            vehicle = await dbGetVehicleById(invoice.vehicle_id);
        }
    } else {
        document.getElementById('edit-invoice-title').innerHTML = 'New Invoice';
    }
    invoiceToEditUi(current_invoice, client, vehicle);
    console.log("Load invoice Id=" + id + " for edit");
}


function resetInvoiceForm() {
    const invoice_page = document.getElementById('page-edit-invoice');
    document.querySelector('.invoice-date').valueAsDate = new Date();
    document.querySelector('.invoice-due-date').value = '';

    var invoice_info = '';
    invoice_info += '<tr><td>Invoice number:</td><td></td></tr>';
    invoice_info += '<tr><td>Invoice uploaded:</td><td>Not yet uploaded</td></tr>';
    invoice_info += '<tr><td>Invoice sent:</td><td>Not yet sent</td></tr>';
    invoice_page.querySelector('.invoice-info-table').innerHTML = invoice_info;

    clearContactUi('#page-edit-invoice .client-info', true);
    document.getElementById('invoice-vehicle-rego').value = '';
    document.getElementById('invoice-vehicle-make-model').value = '';
    document.getElementById('invoice-vehicle-odometer').value = '';
    disableVehicleUi();

    const itemsBody = invoice_page.querySelector('.invoice-items');
    itemsBody.innerHTML = '';
    invoice_page.querySelector('.invoice-sub-total').textContent = '$0.00';
    invoice_page.querySelector('.invoice-discount').value = '0.00';
    invoice_page.querySelector('.invoice-discount-pct').value = '0.0';
    invoice_page.querySelector('.invoice-gst').textContent = '$0.00';
    invoice_page.querySelector('.invoice-received').value = '0.00';
    invoice_page.querySelector('.invoice-total').textContent = '$0.00';
    const notes_elem = invoice_page.querySelector('.invoice-notes')
    notes_elem.value = '';
    notes_elem.style.height = "50px";
    invoice_page.querySelector('.vehicle-info').removeAttribute('data-id');
    invoice_page.removeAttribute('data-id');

    const new_vehicle_btn = document.getElementById('invoice-new-vehicle-btn');
    new_vehicle_btn.disabled = true;
    new_vehicle_btn.readonly = true;
    const select_vehicle_btn = document.getElementById('invoice-select-vehicle-btn');
    select_vehicle_btn.disabled = true;
    select_vehicle_btn.readonly = true;
}


function editInvoiceItem(item_id) {
    console.log("Edit item id=" + item_id);
    const item = current_invoice.getItem(item_id);
    if (!item) {
        console.log("editInvoiceItem("+item_id+"): Item not found");
    }
    return new Promise((resolve) => {
        const modal_container = document.createElement('div');
        modal_container.innerHTML = `
            <div class="modal fade modal-lg" id="modal-edit-item" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h1 class="modal-title fs-5">Edit item</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body modal-confirm-message">
                    <div class="input-group mb-3">
                        <span class="input-group-text">Name</span>
                        <input type="text" class="form-control item-name" value="${item.name}">
                    </div>
                    <div class="row">
                        <div class="col">
                            <label for="product-price" class="form-label">Quantity</label>
                            <div class="input-group mb-3">
                                <input type="number" class="form-control item-qty text-end" value="${item.qty}">
                            </div>
                        </div>
                        <div class="col">
                            <label for="product-price" class="form-label">Unit Price</label>
                            <div class="input-group mb-3">
                                <span class="input-group-text">$</span>
                                <input type="text" inputmode="numeric" class="form-control item-price text-end" value="${item.price}" step="0.01">
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="product-description" class="form-label">Description</label>
                        <textarea class="form-control item-desc" aria-multiline="true"></textarea>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel-btn" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary modal-update-btn">Update</button>
                    <button type="button" class="btn btn-success modal-save-btn">Save</button>
                  </div>
                </div>
              </div>
            </div>`;
        document.body.appendChild(modal_container);

        const modal_element = document.getElementById('modal-edit-item');
        const modal = new bootstrap.Modal(modal_element);

        const text_elem = modal_container.querySelector('.item-desc');
        text_elem.style.height = text_elem.scrollHeight + "px";
        text_elem.style.overflowY = "hidden";
        text_elem.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        });
        text_elem.value = item.description;
        text_elem.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        modal_element.querySelector('.modal-cancel-btn').addEventListener('click', () => {
            modal.hide();
            resolve(item);
        });
        modal_element.querySelector('.modal-update-btn').addEventListener('click', () => {
            item.name = modal_element.querySelector('.item-name').value;
            item.description = modal_element.querySelector('.item-desc').value;
            item.qty = parseFloat(modal_element.querySelector('.item-qty').value.trim()) || 0.0;
            item.price = parseFloat(modal_element.querySelector('.item-price').value.trim()) || 0.0;
            current_invoice.updateItem(item.id, item);
            modal.hide();
            resolve(item);
        });
        modal_element.querySelector('.modal-save-btn').addEventListener('click', () => {
            item.name = modal_element.querySelector('.item-name').value;
            item.description = modal_element.querySelector('.item-desc').value;
            item.qty = parseFloat(modal_element.querySelector('.item-qty').value.trim()) || 0.0;
            item.price = parseFloat(modal_element.querySelector('.item-price').value.trim()) || 0.0;
            item.save();
            current_invoice.updateItem(item.id, item);
            modal.hide();
            resolve(item);
        });
        modal_element.addEventListener('shown.bs.modal', event => {
            text_elem.style.height = "auto";
            text_elem.style.height = text_elem.scrollHeight + "px";
        });
        modal_element.addEventListener('hidden.bs.modal', event => {
            modal.dispose();
            modal_container.remove();
        });

        modal.show();
    });
}


function invoiceItemToRow(item, tr) {
    const item_name_elem = tr.querySelector('.item-name');
    const item_desc_elem = tr.querySelector('.item-desc');
    const item_qty_elem = tr.querySelector('.item-qty');
    const item_price_elem = tr.querySelector('.item-price');
    const item_total_elem = tr.querySelector('.item-total');

    item_name_elem.innerHTML = item.name;
    item_desc_elem.innerHTML = item.description;
    item_qty_elem.innerHTML = item.qty;
    item_price_elem.innerHTML = '$' + item.price.toFixed(2);
    item_total_elem.innerHTML = '$' + item.total.toFixed(2);
}


function addInvoiceItemRow(item_id, edit_item=false) {
    const item = current_invoice.getItem(item_id);
    const itemsBody = document.getElementById('page-edit-invoice').querySelector('.invoice-items');
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', item_id);
    tr.innerHTML = `
        <td><pre class="item-name"></pre></td>
        <td><pre class="item-desc"></pre></td>
        <td class="item-qty"></td>
        <td class="item-price"></td>
        <td class="item-total"></td>
        <td>
            <button type="button" class="btn btn-danger remove-item-btn">${BIN_ICON}</button>
            <button type="button" class="btn btn-warning edit-btn edit-item-btn">${TOOL_ICON}</button>
        </td>
    `;
    itemsBody.appendChild(tr);

    tr.querySelector('.remove-item-btn').addEventListener('click', () => {
        const iid = parseInt(tr.getAttribute('data-id'));
        tr.remove();
        current_invoice.removeItem(iid);
    });
    tr.querySelector('.edit-item-btn').addEventListener('click', async () => {
        const iid = parseInt(tr.getAttribute('data-id'));
        editInvoiceItem(iid).then(async (item) => {
            invoiceItemToRow(item, tr);
        });
    });

    invoiceItemToRow(item, tr);

    if (edit_item) {
        editInvoiceItem(item_id).then(async (item) => {
            invoiceItemToRow(item, tr);
        });
    }

    return tr;
}


document.getElementById('invoice-new-client-btn').addEventListener('click', () => {
    newInvoiceClient();
});

document.getElementById('invoice-select-client-btn').addEventListener('click', () => {
    client_chooser.showAll(); // onClientChosen() called
});

document.getElementById('invoice-new-vehicle-btn').addEventListener('click', () => {
    newInvoiceVehicle();
});

document.getElementById('invoice-select-vehicle-btn').addEventListener('click', () => {
    vehicle_chooser.showFilteredById(vehicle_chooser_filter); // onVehicleChosen() called
});

document.getElementById('invoice-select-item-btn').addEventListener('click', () => {
    product_chooser.showAll();
});

document.getElementById('invoice-add-item-btn').addEventListener('click', () => {
    addInvoiceItemRow(current_invoice.addItem(), true);
});

document.querySelector('#page-edit-invoice').querySelector('.invoice-discount').addEventListener('input',
    (event) => current_invoice.setDiscountValue(parseFloat(event.target.value) || 0.0));

document.querySelector('#page-edit-invoice').querySelector('.invoice-discount-pct').addEventListener('input',
    (event) => current_invoice.setDiscountPct(parseFloat(event.target.value) || 0.0));

document.querySelector('#page-edit-invoice').querySelector('.invoice-received').addEventListener('input',
    (event) => current_invoice.setReceivedAmount(parseFloat(event.target.value) || 0.0));


function invoiceTotalsToUi(invoice) {
    const page_elem = document.getElementById('page-edit-invoice');
    page_elem.querySelectorAll('.invoice-items tr').forEach(tr => {
        const iid = parseInt(tr.getAttribute('data-id'));
        const item = invoice.getItem(iid);
        if (item) {
            tr.querySelector('.item-total').innerHTML = '$' + item.total.toFixed(2);
        }
    });
    page_elem.querySelector('.invoice-sub-total').textContent = invoice.sub_total.toFixed(2);
    const invoice_discount_elem = page_elem.querySelector('.invoice-discount');
    invoice_discount_elem.value = invoice.discount.toFixed(2);
    if (invoice.discount_pct !== 0.0) {
        invoice_discount_elem.disabled = true;
        invoice_discount_elem.readonly = true;
    } else {
        invoice_discount_elem.disabled = false;
        invoice_discount_elem.readonly = false;
    }
    page_elem.querySelector('.invoice-gst').textContent = invoice.gst_value.toFixed(2);
    page_elem.querySelector('.invoice-total').textContent = invoice.total.toFixed(2);
}


function enableVehicleButtons(enable_select=true) {

    const new_vehicle_btn = document.getElementById('invoice-new-vehicle-btn');
    new_vehicle_btn.disabled = false;
    new_vehicle_btn.readonly = false;

    if (enable_select) {
        const select_vehicle_btn = document.getElementById('invoice-select-vehicle-btn');
        select_vehicle_btn.disabled = false;
        select_vehicle_btn.readonly = false;
    }
}


function disableVehicleUi() {
    document.getElementById('invoice-vehicle-rego').disabled = true;
    document.getElementById('invoice-vehicle-make-model').disabled = true;
    document.getElementById('invoice-vehicle-odometer').disabled = true;
}


function enableVehicleUi() {
    document.getElementById('invoice-vehicle-rego').disabled = false;
    document.getElementById('invoice-vehicle-make-model').disabled = false;
    document.getElementById('invoice-vehicle-odometer').disabled = false;
}


async function newInvoiceClient() {
    const client = new Client();
    const client_id = await dbCreateClient(client);
    if (client_id !== -1) {
        const client_info_elem = document.querySelector('#page-edit-invoice .client-info');
        client_info_elem.setAttribute('data-id', client_id);
        enableContactUi('#page-edit-invoice .client-info');
        console.log("edit_invoice: New client Id=" + client_id);

        // Clear the vehicle fields in case there was a vehicle from an previous client
        resetVehicleUi('#page-edit-invoice .vehicle-info');

        // Now that a client has been added, allow a vehicle to be created
        enableVehicleButtons(false);

        vehicle_chooser_filter = client.vehicle_ids;
    } else {
        console.log("edit_invoice: Failed to create a new client");
        userNotification("Error", "Failed to create a new client!");
    }
}


async function onClientChosen(sid) {
    const id = parseInt(sid);
    console.log("edit_invoice: Chose client Id=" + id);
    const client = await dbGetClientById(id);
    if (!client) {
        console.log("edit_invoice: Failed to load chosen client from database. ID: " + sid);
        userNotification("Error", "Failed to load chosen client from database!");
        return;
    }
    current_invoice.client_id = id;
    contactToUi(client.contact, '#page-edit-invoice .client-info', id);
    enableContactUi('#page-edit-invoice .client-info');

    // Clear the vehicle fields in case there was a vehicle from an previous client
    resetVehicleUi('#page-edit-invoice .vehicle-info');

    // Now that a client has been chosen, allow a vehicle to be created or selected
    enableVehicleButtons();

    // Limit the scope of vehicles that can be chosen to the vehicles linked to the client
    vehicle_chooser_filter = client.vehicle_ids;
}


async function saveInvoiceClient() {
    const client_info_elem = document.querySelector('#page-edit-invoice .client-info');
    if (!client_info_elem.hasAttribute('data-id')) {
        userNotification("Incomplete", "Please create a new client or select an existing client");
        return -1;
    }
    const clientName = client_info_elem.querySelector('.contact-name').value.trim();
    if (!clientName) {
        userNotification("Incomplete", "Please enter a client name");
        return -1;
    }
    const client_id = parseInt(client_info_elem.getAttribute('data-id'));
    const client = new Client();
    client.id = client_id;
    uiToContact(client.contact, '#page-edit-invoice .client-info');
    await dbPutClient(client);
    return client_id;
}


async function newInvoiceVehicle() {
    const vehicle = new Vehicle();
    const vehicle_id = await dbCreateVehicle(vehicle);
    if (vehicle_id !== -1) {
        const vehicle_info_elem = document.querySelector('#page-edit-invoice .vehicle-info');
        vehicle_info_elem.setAttribute('data-id', vehicle_id);
        enableVehicleUi();
        console.log("edit_invoice: New vehicle Id=" + vehicle_id);
    } else {
        console.log("edit_invoice: Failed to create a new vehicle");
        userNotification("Error", "Failed to create a new vehicle!");
    }
}


async function onVehicleChosen(sid) {
    const id = parseInt(sid);
    console.log("edit_invoice: Chose vehicle Id=" + id);
    const vehicle = await dbGetVehicleById(id);
    if (!vehicle) {
        console.log("edit_invoice: Failed to load chosen vehicle from database. ID: " + sid);
        userNotification("Error", "Failed to load chosen vehicle from database!");
        return;
    }
    current_invoice.vehicle_id = id;
    vehicleToUi(vehicle, 0);
    enableVehicleUi();
}

async function saveInvoiceVehicle() {
    const vehicle_info_elem = document.querySelector('#page-edit-invoice .vehicle-info');
    if (vehicle_info_elem.hasAttribute('data-id')) {
        const vehicle_id = parseInt(vehicle_info_elem.getAttribute('data-id'));
        const vehicle = new Vehicle();
        vehicle.id = vehicle_id;
        vehicle.rego = vehicle_info_elem.querySelector('.vehicle-rego').value.trim();
        vehicle.make_model = vehicle_info_elem.querySelector('.vehicle-make-model').value.trim();
        await dbPutVehicle(vehicle);
        return vehicle_id;
    }
    // else No vehicle
    return -1;
}


async function updateClientVehicles(client_id, vehicle_id) {
    const client = await dbGetClientById(client_id);
    if (!client.vehicle_ids.includes(vehicle_id)) {
        client.vehicle_ids.push(vehicle_id);
    }
    await dbPutClient(client);
}


async function saveEditInvoice() {

    const client_id = await saveInvoiceClient();
    const vehicle_id = await saveInvoiceVehicle();

    if (client_id === -1) {
        return false;
    }

    if (vehicle_id !== -1) {
        await updateClientVehicles(client_id, vehicle_id);
    }

    const page_elem = document.getElementById('page-edit-invoice');
    current_invoice.odo = parseFloat(document.getElementById('invoice-vehicle-odometer').value);
    current_invoice.notes = document.getElementById('invoice-notes').value.trim();
    current_invoice.date = new Date(page_elem.querySelector('.invoice-date').value);
    const due_date_elem = page_elem.querySelector('.invoice-due-date');
    if (due_date_elem.value !== '') {
        current_invoice.due_date = new Date(due_date_elem.value);
    }
    current_invoice.client_id = client_id;
    current_invoice.vehicle_id = vehicle_id;
    current_invoice.updated();

    return await current_invoice.save();
}

