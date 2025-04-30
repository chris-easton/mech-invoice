
async function invoicesSearchFilter(db_item, searchTerm) {
    const invoice = new Invoice();
    invoice.deserialise(db_item);
    var combined = invoice.number + ' ';
    const client = await dbGetClientById(invoice.client_id);
    if (client) {
        combined += client.contact.name + ' ';
    }
    const vehicle = await dbGetVehicleById(invoice.vehicle_id);
    if (vehicle) {
        combined += vehicle.make_model + ' ' + vehicle.rego;
    }
    var match = false;
    if (searchTerm.trim().length > 0) {
        match = combined.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
        match = !invoice.deleted;
    }
    return [match, invoice];
}

function invoicesSortItems(items) {
    return items.sort((a, b) => b.last_change_date.getTime() - a.last_change_date.getTime());
}

function invoicesGetTableHeading() {
    return `
        <th scope="col">#</th>
        <th scope="col">Date</th>
        <th scope="col">Client</th>
        <th scope="col">Vehicle</th>
        <th scope="col">Total</th>`;
}

async function invoicesPopulateTableRow(tr, invoice) {
    tr.innerHTML = `
        <td scope="row">${invoice.number}</td>
        <td>${formatDate(invoice.date)}</td>`;
    const client = await dbGetClientById(invoice.client_id);
    if (client) {
        var client_str = client.contact.name;
        if (client.contact.surname) {
            client_str += ' ' + client.contact.surname;
        }
        tr.innerHTML += `<td>${client_str}</td>`;
    } else {
        tr.innerHTML += '<td>Client not found</td>';
    }
    const vehicle = await dbGetVehicleById(invoice.vehicle_id);
    if (vehicle) {
        var vehicle_description = '';
        if (vehicle.rego) {
            vehicle_description = vehicle_description + `${vehicle.rego}`;
        }
        if (invoice.odo) {
            vehicle_description = vehicle_description + `    ${invoice.odo} km`;
        }
        if (vehicle.make_model) {
            if (vehicle_description !== '') vehicle_description += '<br>';
            vehicle_description = vehicle_description + `${vehicle.make_model}`;
        }
        tr.innerHTML += `<td>${vehicle_description}</td>`;
    } else {
        tr.innerHTML += '<td>None</td>';
    }
    tr.innerHTML += `<td>$${invoice.total.toFixed(2)}</td>`;
}

function updateInvoiceEmailedIndicator(elem, invoice) {
    if (invoice.hasBeenEmailed()) {
        const email_sent_indicator = elem.querySelector('.sent-indicator');
        email_sent_indicator.classList.remove('d-none');
        if (invoice.emailIsCurrent()) {
            email_sent_indicator.classList.add('bg-success');
            email_sent_indicator.classList.remove('bg-danger');
        } else {
            email_sent_indicator.classList.add('bg-danger');
            email_sent_indicator.classList.remove('bg-success');
        }
    }
}
function updateInvoiceUploadedIndicator(elem, invoice) {
    if (invoice.hasBeenUploaded()) {
        const uploaded_indicator = elem.querySelector('.uploaded-indicator');
        uploaded_indicator.classList.remove('d-none');
        if (invoice.uploadIsCurrent()) {
            uploaded_indicator.classList.add('bg-success');
            uploaded_indicator.classList.remove('bg-danger');
        } else {
            uploaded_indicator.classList.add('bg-danger');
            uploaded_indicator.classList.remove('bg-success');
        }
    }
}

function invoicesTableRowAppended(tr, invoice) {
    updateInvoiceEmailedIndicator(tr, invoice);
    updateInvoiceUploadedIndicator(tr, invoice);
}

async function invoicesSendEmail(sid, btn) {
    const id = parseInt(sid);
    if (await sendInvoiceEmail(id)) {
        const invoice = await dbGetInvoiceById(id);
        updateInvoiceEmailedIndicator(btn, invoice);
    }
}

async function invoicesUploadInvoice(sid, btn) {
    const id = parseInt(sid);
    if (await uploadInvoice(id)) {
        const invoice = await dbGetInvoiceById(id);
        updateInvoiceUploadedIndicator(btn, invoice);
    }
}

