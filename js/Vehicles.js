
function vehiclesSearchFilter(db_item, searchTerm) {
    const vehicle = new Vehicle();
    vehicle.deserialise(db_item);
    var combined = vehicle.rego.toLowerCase() + ' ' + vehicle.make_model.toLowerCase();
    var match = false;
    if (searchTerm.trim().length > 0) {
        match = combined.includes(searchTerm.toLowerCase());
    } else {
        match = !vehicle.deleted;
    }
    return [match, vehicle];
}

function vehiclesTableHeading() {
    return `
      <th scope="col" class="col-md-4">Rego</th>
      <th scope="col">Model</th>`;
}

function vehiclesPopulateTableRow(tr, vehicle) {
    tr.innerHTML = `
        <td>${vehicle.rego}</td>
        <td>${vehicle.make_model}</td>`;
}

function vehiclesSortItems(items) {
    //TODO: Sort vehicles somehow
    return items;
}

async function onVehicleChosen(sid) {
    const id = parseInt(sid);
    console.log("Chose vehicle Id=" + id);
    const vehicle = await dbGetVehicleById(id);
    current_invoice.vehicle_id = id;
    vehicleToUi(vehicle, 0);
}
