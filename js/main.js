
let db;
let settings;
let invoices;
let clients;
let products;
let client_chooser;
let vehicle_chooser;
let vehicle_chooser_filter = [];
let product_chooser;

let current_invoice;
let current_client;
let current_vehicle;

const GO_MONO_REGULAR = '@GO_MONO_REGULAR@';
const GO_MONO_BOLD = '@GO_MONO_BOLD@';
const GO_MONO_ITALIC = '@GO_MONO_ITALIC@';
const GO_MONO_BOLD_ITALIC = '@GO_MONO_BOLD_ITALIC@';
const PAYID_ICON = '@PAYID_ICON@';
const CALL_ICON_FILLED = '@CALL_ICON_FILLED@';
const MAIL_ICON_FILLED = '@MAIL_ICON_FILLED@';
const LOCATION_ICON_FILLED = '@LOCATION_ICON_FILLED@';
const PERSON_ICON_FILLED = '@PERSON_ICON_FILLED@';
const VEHICLE_ICON_FILLED = '@VEHICLE_ICON_FILLED@';
const PAYMENTS_ICON_FILLED = '@PAYMENTS_ICON_FILLED@';
const NOTES_ICON = '@NOTES_ICON@';
const NOTES_ICON_FILLED = '@NOTES_ICON_FILLED@';
const BIN_ICON = '@BIN_ICON@';
const TOOL_ICON = '@TOOL_ICON@';
const CHECK_ICON = '@CHECK_ICON@';
const PRINT_ICON = '@PRINT_ICON@';
const EMAIL_ICON = '@EMAIL_ICON@';
const CLOUD_ICON = '@CLOUD_ICON@';
const APP_LICENSE = `@APP_LICENSE@`;

@PAGINATED_ITEMS@
@ITEM_CHOOSER@
@EDIT_ITEM@
@CONTACT_INFO@
@VEHICLE@
@VEHICLES@
@CLIENT@
@CLIENTS@
@EDIT_CLIENT@
@PRODUCT@
@PRODUCTS@
@EDIT_PRODUCT@
@INVOICE@
@INVOICES@
@EDIT_INVOICE@
@SETTINGS@
@PAGE_ELEMENTS@
@USER_NOTIFICATION@
@USER_CONFIRMATION@
@SLA@
@PDFMAKE@

settings = new Settings();

/**
 * Initialize and populate data on load
 */
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', init);

window.onload = () => {
    gapiInitClient();
    gapiEnsureTokenValid();
};

async function initClasses() {

    const client_actions = new Item_actions();
    client_actions.delete = true;
    client_actions.edit = true;
    clients = new Paginated_items('', 'client', 'page-manage-clients-table', client_actions);
    clients.searchFilter = clientsSearchFilter;
    clients.sortItems = clientsSortItems;
    clients.getTableHeading = clientsTableHeading;
    clients.populateTableRow = clientsPopulateTableRow;
    clients.createItemsTable();
    await clients.loadItemsList();

    client_chooser = new Item_chooser('client');
    client_chooser.callback = onClientChosen;
    client_chooser.item_list.searchFilter = clientsSearchFilter;
    client_chooser.item_list.getTableHeading = clientsTableHeading;
    client_chooser.item_list.populateTableRow = clientsPopulateTableRow;
    client_chooser.init();

    vehicle_chooser = new Item_chooser('vehicle');
    vehicle_chooser.callback = onVehicleChosen;
    vehicle_chooser.item_list.searchFilter = vehiclesSearchFilter;
    vehicle_chooser.item_list.getTableHeading = vehiclesTableHeading;
    vehicle_chooser.item_list.populateTableRow = vehiclesPopulateTableRow;
    vehicle_chooser.init();

    const product_actions = new Item_actions();
    product_actions.delete = true;
    product_actions.edit = true;
    products = new Paginated_items('', 'product', 'page-manage-products-table', product_actions);
    products.searchFilter = productsSearchFilter;
    products.sortItems = productsSortItems;
    products.getTableHeading = productsTableHeading;
    products.populateTableRow = productsPopulateTableRow;
    products.createItemsTable();
    await products.loadItemsList();

    product_chooser = new Item_chooser('product');
    product_chooser.callback = onProductChosen;
    product_chooser.item_list.searchFilter = productsSearchFilter;
    product_chooser.item_list.getTableHeading = productsTableHeading;
    product_chooser.item_list.populateTableRow = productsPopulateTableRow;
    product_chooser.init();

    const invoice_actions = new Item_actions();
    invoice_actions.delete = true;
    invoice_actions.edit = true;
    invoice_actions.print = true;
    invoice_actions.email = true;
    invoice_actions.upload = true;
    invoices = new Paginated_items('', 'invoice', 'page-manage-invoices-table', invoice_actions);
    invoices.searchFilter = invoicesSearchFilter;
    invoices.sortItems = invoicesSortItems;
    invoices.getTableHeading = invoicesGetTableHeading;
    invoices.populateTableRow = invoicesPopulateTableRow;
    invoices.tableRowAppended = invoicesTableRowAppended;
    invoices.onPrintItem = printInvoice;
    invoices.onEmailItem = invoicesSendEmail;
    invoices.onUploadItem = invoicesUploadInvoice;
    invoices.createItemsTable();
    await invoices.loadItemsList();

    edit_invoice = new Edit_item('invoice');
    edit_invoice.createNewItem = () => {
        resetInvoiceForm();
        createNewInvoice();
        editInvoice(null, true);
    }
    edit_invoice.editItem = (id) => {
        resetInvoiceForm();
        editInvoice(id);
    }
    edit_invoice.cancelEdit = () => {
        window.location.hash = '#manage-invoices';
    }
    edit_invoice.saveItem = async () => {
        const success = await saveEditInvoice();
        if (success) {
            userNotification("Success", "Invoice saved");
            window.location.hash = '#manage-invoices';
        } else {
            console.log("Failed to save invoice");
        }
    }

    edit_client = new Edit_item('client');
    edit_client.createNewItem = () => {
        resetClientForm();
        createNewClient();
    }
    edit_client.editItem = (id) => {
        resetClientForm();
        editClient(id);
    }
    edit_client.cancelEdit = () => {
        window.location.hash = '#manage-clients';
    }
    edit_client.saveItem = async () => {
        success = await saveEditClient();
        if (success) {
            userNotification("Success", "Client saved");
            window.location.hash = '#manage-clients';
        } else {
            console.log("Failed to save client");
        }
    }

    edit_product = new Edit_item('product');
    edit_product.createNewItem = () => {
        resetProductForm();
        createNewProduct();
    }
    edit_product.editItem = (id) => {
        resetProductForm();
        editProduct(id);
    }
    edit_product.cancelEdit = () => {
        window.location.hash = '#manage-products';
    }
    edit_product.saveItem = async () => {
        success = await saveEditProduct();
        if (success) {
            window.location.hash = '#manage-products';
        } else {
            console.log("Failed to save product");
        }
    }

    route();
}

async function init() {

    initDB().then(() => {
        setTimeout(() => {
            settings.loadSettings().then(() => {
                setTimeout(initClasses, 0);
                if (settings.sla_accepted !== true) {
                    showSLA('Agree').then((ans) => {
                        if (ans) {
                            settings.setSLAConfirmed();
                        }
                    });
                }
            });
        }, 0);
    });

    initPdfMake();
}

