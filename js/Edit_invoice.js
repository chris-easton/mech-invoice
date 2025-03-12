
addPageHeading('page-manage-invoices-heading', 'Invoices', 'Invoice');

function createNewInvoice() {
    current_invoice = new Invoice();
    current_invoice.gst_pct = settings.vendor_gst || 0.0;
    current_invoice.number = settings.getNextInvoiceNumber();
}

function invoiceToUi(invoice) {

    current_invoice.updateTotal();

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

    if (current_client) {
        clientToUi(current_client, '#page-edit-invoice .client-info');
    }

    if (current_vehicle) {
        vehicleToUi(current_vehicle, current_invoice.odo);
    }

    for (const invoice_item of current_invoice.items) {
        if (!invoice_item.deleted) {
            addInvoiceItemRow(invoice_item.id);
        }
    }

    invoice_page.querySelector('.invoice-sub-total').textContent = current_invoice.sub_total.toFixed(2);
    invoice_page.querySelector('.invoice-gst-rate').textContent = 'GST(' + current_invoice.gst_pct.toFixed(0) + '%)';
    invoice_page.querySelector('.invoice-gst').textContent = current_invoice.gst_value.toFixed(2);

    const invoice_discount_elem = invoice_page.querySelector('.invoice-discount');
    invoice_discount_elem.value = current_invoice.discount.toFixed(2);
    if (current_invoice.discount_pct !== 0.0) {
        invoice_discount_elem.disabled = true;
        invoice_discount_elem.readonly = true;
    } else {
        invoice_discount_elem.disabled = false;
        invoice_discount_elem.readonly = false;
    }
    invoice_page.querySelector('.invoice-discount-pct').value = current_invoice.discount_pct.toFixed(2);
    invoice_page.querySelector('.invoice-received-row').classList.remove('hidden');
    invoice_page.querySelector('.invoice-received').value = current_invoice.received.toFixed(2);
    invoice_page.querySelector('.invoice-total').textContent = current_invoice.total.toFixed(2);

    const notes_elem = invoice_page.querySelector('.invoice-notes');
    notes_elem.value = current_invoice.notes;
    notes_elem.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}


async function editInvoice(id, isNew=false) {
    if (!isNew) {
        document.getElementById('edit-invoice-title').innerHTML = 'Edit Invoice';
        const invoice = await dbGetInvoiceById(id);
        const client = await dbGetClientById(invoice.client_id);
        current_invoice = invoice;
        current_client = client;
        if (invoice.vehicle_id !== -1) {
            const vehicle = await dbGetVehicleById(invoice.vehicle_id);
            current_vehicle = vehicle;
        }
    } else {
        document.getElementById('edit-invoice-title').innerHTML = 'New Invoice';
        current_client = null;
        current_vehicle = null;
    }
    invoiceToUi(current_invoice);
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

    clearContactUi('#page-edit-invoice .client-info');
    document.getElementById('invoice-vehicle-rego').value = '';
    document.getElementById('invoice-vehicle-make-model').value = '';
    document.getElementById('invoice-vehicle-odometer').value = '';
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

document.getElementById('invoice-add-item-btn').addEventListener('click', () => {
    addInvoiceItemRow(current_invoice.addItem(), true);
});

document.querySelector('#page-edit-invoice').querySelector('.invoice-discount').addEventListener('input',
    (event) => current_invoice.setDiscountValue(parseFloat(event.target.value) || 0.0));

document.querySelector('#page-edit-invoice').querySelector('.invoice-discount-pct').addEventListener('input',
    (event) => current_invoice.setDiscountPct(parseFloat(event.target.value) || 0.0));

document.querySelector('#page-edit-invoice').querySelector('.invoice-received').addEventListener('input',
    (event) => current_invoice.setReceivedAmount(parseFloat(event.target.value) || 0.0));

document.getElementById('invoice-select-client-btn').addEventListener('click', () => {
    client_chooser.showAll();
});

document.getElementById('invoice-select-vehicle-btn').addEventListener('click', () => {
    vehicle_chooser.showFilteredById(vehicle_chooser_filter);
});

document.getElementById('invoice-select-item-btn').addEventListener('click', () => {
    product_chooser.showAll();
});

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

async function saveEditInvoice() {

    const page_elem = document.getElementById('page-edit-invoice');

    const clientName = page_elem.querySelector('.contact-name').value.trim();
    if (!clientName) {
        userNotification("Incomplete", "Please enter a client name or select a client");
        return false;
    }

    const vehicle_info_elem = page_elem.querySelector('.vehicle-info');
    var vehicle_id = -1;
    if (vehicle_info_elem.hasAttribute('data-id')) {
        vehicle_id = parseInt(vehicle_info_elem.getAttribute('data-id'));
    } else {
        const vehicle = new Vehicle();
        vehicle.rego = vehicle_info_elem.querySelector('.vehicle-rego').value.trim();
        vehicle.make_model = vehicle_info_elem.querySelector('.vehicle-make-model').value.trim();
        if ((vehicle.rego !== '') || (vehicle.make_model !== '')) {
            // Vehicle was entered manually, check DB for a match.
            const db_items = await dbFindItems('vehicles', (db_item) => {
                const db_vehicle = new Vehicle();
                db_vehicle.deserialise(db_item);
                const match = vehiclesMatch(db_vehicle, vehicle);
                return [!db_vehicle.deleted && match, db_vehicle];
            });
            if (db_items.length > 0) {
                vehicle_id = db_items[0].id;
                vehicle.id = vehicle_id;
                await dbPutVehicle(vehicle);
            } else {
                vehicle_id = await dbCreateVehicle(vehicle);
            }
            vehicle_info_elem.setAttribute('data-id', vehicle_id);
        }
        // else No vehicle
    }

    var client_id = -1;
    const client_info_elem = document.querySelector('#page-edit-invoice .client-info');
    if (client_info_elem.hasAttribute('data-id')) {
        client_id = parseInt(client_info_elem.getAttribute('data-id'));
    } else {
        const client = new Client();
        uiToContact(client.contact, '#page-edit-invoice .client-info');
        client.vehicle_ids.push(vehicle_id); //TODO: Need to compare to existing client vehicles
        // Client was entered manually, check DB for a match.
        const db_items = await dbFindItems('clients', (db_item) => {
            const db_client = new Client();
            db_client.deserialise(db_item);
            const match = clientsMatch(db_client, client);
            return [!db_client.deleted && match, db_client];
        });
        if (db_items.length > 0) {
            client_id = db_items[0].id;
            client.id = client_id;
            await dbPutClient(client);
        } else {
            client_id = await dbCreateClient(client);
        }
        client_info_elem.setAttribute('data-id', client_id);
    }

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

