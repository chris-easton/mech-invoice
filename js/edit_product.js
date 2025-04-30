
addPageHeading('page-manage-products-heading', 'Products', 'Product');

function clientsMatch(p1, p2) {
    const combined_p1 = p1.contact.name + ' ' + p1.contact.surname + ' ' + p1.contact.number;
    const combined_p2 = p2.contact.name + ' ' + p2.contact.surname + ' ' + p2.contact.number;
    return (combined_p1.toLowerCase() === combined_p2.toLowerCase());
}

function vehiclesMatch(p1, p2) {
    const combined_p1 = p1.rego;
    const combined_p2 = p2.rego;
    return (combined_p1.toLowerCase() === combined_p2.toLowerCase());
}

function productsMatch(p1, p2) {
    const combined_p1 = p1.name + ' ' + p1.description;
    const combined_p2 = p2.name + ' ' + p2.description;
    return (combined_p1.toLowerCase() === combined_p2.toLowerCase());
}

function createNewProduct() {
    document.getElementById('edit-product-title').innerHTML = 'New Product';
}

async function loadProductForEdit(id) {
    const product = await dbGetProductById(id);
    if (!product) {
        userNotification("Error", "Product not found.");
        return;
    }
    const product_info_elem = document.getElementById('edit-product-info');
    product_info_elem.setAttribute('data-id', id);
    product_info_elem.querySelector('.product-name').value = product.name;
    const desc_elem = product_info_elem.querySelector('.product-description');
    desc_elem.value = product.description;
    desc_elem.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    product_info_elem.querySelector('.product-price').value = product.price;
    document.getElementById('product-notes').value = product.notes;
}

function editProduct(id) {
    console.log("Edit product Id=" + id);
    document.getElementById('edit-product-title').innerHTML = 'Edit Product';
    loadProductForEdit(id);
}

function resetProductForm() {
    const product_info_elem = document.getElementById('edit-product-info');
    product_info_elem.removeAttribute('data-id');
    product_info_elem.querySelector('.product-name').value = '';
    const desc_elem = product_info_elem.querySelector('.product-description');
    desc_elem.value = '';
    desc_elem.style.height = "40px";
    product_info_elem.querySelector('.product-price').value = 0.0;
    document.getElementById('product-notes').value = '';
}

async function saveEditProduct() {
    var product_id = -1;
    const product_info_elem = document.getElementById('edit-product-info');
    if (product_info_elem.hasAttribute('data-id')) {
        product_id = parseInt(product_info_elem.getAttribute('data-id'));
    }
    const product = new Product();
    product.name = product_info_elem.querySelector('.product-name').value.trim();
    product.description = product_info_elem.querySelector('.product-description').value.trim();
    product.price = parseFloat(product_info_elem.querySelector('.product-price').value);
    product.notes = document.getElementById('product-notes').value.trim();
    if (!product.name) {
        userNotification("Incomplete", "Please enter a product name.");
        console.log("Save product failed need product name");
        return false;
    }
    if (product_id === -1) {
        // Not editing an existing product, check if the product matches one in
        // the database.
        const db_items = await dbFindItems('products', (db_item) => {
            const db_product = new Product();
            db_product.deserialise(db_item);
            const match = productsMatch(db_product, product);
            return [!db_product.deleted && match, db_product];
        });
        if (db_items.length > 0) {
            const overwrite = await userConfimation('Product already exists. Overwrite?');
            if (overwrite) {
                console.log("Overwrite product " + product.name);
                product_id = db_items[0].id;
            } else {
                console.log("Don't overwrite product " + product.name);
                return false;
            }
        }
    }
    if (product_id === -1) {
        item_id = await dbCreateProduct(product);
    } else {
        product.id = product_id;
        item_id = await dbPutProduct(product);
    }
    if (item_id !== -1) {
        return true;
    }
    return false;
}

