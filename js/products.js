
function productsSearchFilter(db_item, searchTerm) {
    const product = new Product();
    product.deserialise(db_item);
    const combined = product.name + ' ' + product.description;
    var match = false;
    if (searchTerm.trim().length > 0) {
        match = combined.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
        match = !product.deleted;
    }
    return [match, product];
}

function productsTableHeading() {
    return `
      <th scope="col" class="col-md-3">Name</th>
      <th scope="col">Description</th>
      <th scope="col" class="col-md-2">Unit Price</th>`;
}

function productsPopulateTableRow(tr, product) {
    tr.innerHTML = `
        <td><pre>${product.name}</pre></td>
        <td><pre>${limitString(product.description, 80, 2)}</pre></td>
        <td>$${product.price}</td>`;
}

function productsSortItems(items) {
    return items.sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
        return 0;
    });
}

async function onProductChosen(sid) {
    const id = parseInt(sid);
    console.log("Chose product Id=" + id);
    const product = await dbGetProductById(id);
    addInvoiceItemRow(current_invoice.addItem(product));
}
