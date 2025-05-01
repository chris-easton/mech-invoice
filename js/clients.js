
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

