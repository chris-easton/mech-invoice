
function clientsSearchFilter(db_item, searchTerm) {
    const client = new Client();
    client.deserialise(db_item);
    var match = false;
    if (searchTerm.trim().length > 0) {
        match = client.contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
        match = !client.deleted;
    }
    return [match, client];
}

function clientsTableHeading() {
    return `
      <th scope="col" class="col-md-4">Name</th>
      <th scope="col" class="col-md-3">Phone</th>
      <th scope="col" class="col-md-3">Email</th>`;
}

function clientsPopulateTableRow(tr, client) {
    tr.innerHTML = `
        <td scope="row">${client.contact.name} ${client.contact.surname}</td>
        <td>${client.contact.phone}</td>
        <td>${client.contact.email}</td>`;
}

function clientsSortItems(items) {
    return items.sort((a, b) => {
        if (a.contact.name.toLowerCase() < b.contact.name.toLowerCase()) return -1;
        if (a.contact.name.toLowerCase() > b.contact.name.toLowerCase()) return 1;
        return 0;
    });
}

async function onClientChosen(sid) {
    const id = parseInt(sid);
    console.log("Chose client Id=" + id);
    const client = await dbGetClientById(id);
    current_invoice.client_id = id;
    contactToUi(client.contact, '#page-edit-invoice .client-info', id);
    resetVehicleUi('#page-edit-invoice .vehicle-info');
    const select_vehicle_btn = document.getElementById('invoice-select-vehicle-btn');
    select_vehicle_btn.disabled = false;
    select_vehicle_btn.readonly = false;
    vehicle_chooser_filter = client.vehicle_ids;
}

