// @ts-check
//import { test as test_base, expect } from '@playwright/test';
const { test: test_base } = require('@playwright/test');
import { expect } from '@playwright/test';


const TEST_SETTINGS = {
    vendor_name: 'Acme Auto',
    vendor_email: 'acme-auto@test.com',
    vendor_phone: '0412345678',
    vendor_address: '42 Blacktop Road',
    vendor_city: 'Big Town',
    vendor_postcode: '0123',
    vendor_abn: '1234-1234-1234',
    vendor_gst: 10,
    payment_bank: 'Bro-Trust',
    payment_bsb: '111-222',
    payment_name: 'Acme Auto',
    payment_account: '9828934823',
    payment_reference: '%INVOICE_NO%',
    payment_payid_name: 'Acme Auto',
    payment_payid_id: '1234-1234-1234',
    invoice_prefix: '#',
    next_invoice_number: '1234',
    gapi_client_id: '',
    google_drive_path: 'Acme Auto',
    email_subject: '',
    email_body: '',
};

const TEST_CLIENTS = [
    {
        contact: {
            name: 'John',
            surname: 'Doe',
            phone: '0422647383',
            email: 'john@email.com',
        },
    },
    {
        contact: {
            name: 'Sarah',
            surname: 'Jane',
            phone: '0448273482',
            email: 'sarahj@email.com',
            address: '42 Lane Ave',
            city: 'Happy Town',
            postcode: '0123',
        },
    },
    {
        contact: {
            name: 'Dan',
            surname: 'Smith',
            phone: '0422234843',
            email: 'ballerdan@email.com',
        },
        notes: 'Call about Compensator lift kit fitment',
    },
    {
        contact: {
            name: 'Lily',
            surname: 'Waters',
            phone: '0415682177',
            email: 'lily@email.com',
            address: '84 Country Road',
            city: 'Deep Well',
            postcode: '2233',
        },
    },
    {
        contact: {
            name: 'Bazza',
            phone: '0433678243',
        },
    },
];

const TEST_VEHICLES = [
    {
        rego: 'S123ABC',
        make_model: '2000 Sedan Deluxe',
        kms: 450000
    },
    {
        rego: 'S666DEF',
        make_model: '1984 Black Betty',
        kms: 152680
    },
    {
        rego: 'S543ZZZ',
        make_model: '2020 Electric Sparks',
        kms: 81440
    },
    {
        rego: 'S888BBB',
        make_model: '2024 Compensator XL',
        kms: 10100
    },
    {
        rego: 'S982CAS',
        make_model: '',
        kms: 250200
    },
    {
        rego: 'S743AGB',
        make_model: '2016 Farmtruck HD',
        kms: 350200
    },
    {
        rego: '',
        make_model: '2018 Honda Scrambler',
        kms: 20320
    },
];

const TEST_ITEMS = [
    {
        name: 'oil',
        description: 'SAE 20W40',
        price: 20.00,
        qty: 3.5
    },
    {
        name: 'oil filter',
        description: 'D20',
        price: 50.00,
        qty: 1.0
    },
    {
        name: 'air filter',
        description: 'K&N High Flow NoFilter',
        price: 80.00,
        qty: 1.0
    },
    {
        name: 'spark plugs',
        description: 'K5',
        price: 10.00,
        qty: 4.0
    },
    {
        name: 'brake fluid',
        description: 'DOT5',
        price: 2.00,
        qty: 1.2
    },
    {
        name: 'brake pads',
        description: 'Brembo PD75',
        price: 20.00,
        qty: 8.0
    },
];


class SeededRandom {

    constructor(seed) {
        this.seed = seed;
    }

    next() {
        // LCG: x_{n+1} = (a * x_n + c) mod m
        // Constants: a = 1664525, c = 1013904223, m = 2^32
        this.seed = (1664525 * this.seed + 1013904223) % 4294967296;
        return this.seed / 4294967296; // Normalize to [0, 1)
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }

    nextBoolean() {
        return this.next() > 0.5;
    }
}


// Function to generate random client object using seeded random generator
function generateRandomInvoice(random) {

    const invoice = new Invoice();

    invoice.addClient(random.nextInt(0, TEST_CLIENTS.length));

    // Decide randomly to include a vehicle (0 or 1), 50% chance for each
    const includeVehicle = random.nextBoolean();
    if (includeVehicle) {
        invoice.addVehicle(random.nextInt(0, TEST_VEHICLES.length));
    }

    // Randomly choose one or more products (at least one)
    const productCount = random.nextInt(1, TEST_ITEMS.length + 1); // Ensure at least 1 product

    // To avoid duplicates, use a Set
    const productSet = new Set();
    while (invoice.items.length < productCount) {
        const product = random.nextInt(0, TEST_ITEMS.length);
        if (!productSet.has(product)) {
            productSet.add(product);
            invoice.addItem(product);
        }
    }

    return invoice;
}


function getPageLinkDropdown(page_id) {
    const tools = ['page-settings', 'page-reports', 'page-backups', 'page-about'];
    for (const tool of tools) {
        if (tool === page_id) {
            return 'tools';
        }
    }
    return '';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function acceptSLA(page) {
    const accept_btn = page.getByTestId("accept-sla-btn");
    await expect(accept_btn).toBeVisible();
    await accept_btn.click();
}


async function gotoPage(page, name) {
    const page_id = 'page-' + name.toLowerCase().replace(' ', '-');
    const dropdown = getPageLinkDropdown(page_id);
    if (dropdown) {
        await page.getByTestId(dropdown + '-link').click();
    }
    const page_link = page_id + '-link';
    const link = page.getByTestId(page_link)
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByTestId(page_id + '-heading')).toBeVisible();
}

async function setMinimalSettings(page) {
    await gotoPage(page, 'Settings');
    await page.getByTestId('settings-vendor-name').fill(TEST_SETTINGS.vendor_name);
    await page.getByTestId('settings-vendor-phone').fill(TEST_SETTINGS.vendor_phone);
    await page.getByTestId('settings-vendor-email').fill(TEST_SETTINGS.vendor_email);
    await page.getByTestId('settings-vendor-abn').fill(TEST_SETTINGS.vendor_abn);
    await page.getByTestId('settings-vendor-gst').fill(TEST_SETTINGS.vendor_gst);
    await page.getByTestId('save-settings-btn').click();
}

async function setSomeSettings(page) {
    await setMinimalSettings(page);
    await page.getByTestId('settings-bank-name').fill(TEST_SETTINGS.payment_bank);
    await page.getByTestId('settings-bank-bsb').fill(TEST_SETTINGS.payment_bsb);
    await page.getByTestId('settings-bank-account-number').fill(TEST_SETTINGS.payment_account);
    await page.getByTestId('save-settings-btn').click();
}

async function setAllSettings(page) {
    await setSomeSettings(page);
    await page.getByTestId('settings-vendor-address').fill(TEST_SETTINGS.vendor_address);
    await page.getByTestId('settings-vendor-city').fill(TEST_SETTINGS.vendor_city);
    await page.getByTestId('settings-vendor-postcode').fill(TEST_SETTINGS.vendor_postcode);
    await page.getByTestId('settings-bank-account-name').fill(TEST_SETTINGS.payment_name);
    await page.getByTestId('settings-bank-reference').fill(TEST_SETTINGS.payment_reference);
    await page.getByTestId('settings-payid-name').fill(TEST_SETTINGS.payment_payid_name);
    await page.getByTestId('settings-payid-id').fill(TEST_SETTINGS.payment_payid_id);
    await page.getByTestId('settings-invoice-prefix').fill(TEST_SETTINGS.invoice_prefix);
    await page.getByTestId('settings-next-invoice-number').fill(TEST_SETTINGS.next_invoice_number);
    await page.getByTestId('save-settings-btn').click();
}


async function fillInClient(page, client) {
    await page.getByTestId('settings-vendor-address').fill(TEST_SETTINGS.vendor_address);
}

async function contactToPage(page, selector, contact) {
    const contact_loc = page.locator(selector);
    if (contact.name !== undefined) {
        const name_loc = await contact_loc.locator('.contact-name');
        await name_loc.fill(contact.name);
    }
    if (contact.surname !== undefined) {
        await contact_loc.locator('.contact-surname').fill(contact.surname);
    }
    if (contact.phone !== undefined) {
        await contact_loc.locator('.contact-phone').fill(contact.phone);
    }
    if (contact.email !== undefined) {
        await contact_loc.locator('.contact-email').fill(contact.email);
    }
    if (contact.address !== undefined) {
        await contact_loc.locator('.contact-address').fill(contact.address);
    }
    if (contact.city !== undefined) {
        await contact_loc.locator('.contact-city').fill(contact.city);
    }
    if (contact.postcode !== undefined) {
        await contact_loc.locator('.contact-postcode').fill(contact.postcode);
    }
}

async function clientToPage(page, selector, client, invoice_client=false) {
    await contactToPage(page, selector, client.contact);
    if (client.notes !== undefined && !invoice_client) {
        const client_notes_loc = page.getByTestId('client-notes');
        await client_notes_loc.fill(client.notes);
    }
}

async function vehicleToPage(page, selector, vehicle, invoice_vehicle=false) {
    const vehicle_info_loc = page.locator(selector);
    if (vehicle.rego !== undefined) {
        await vehicle_info_loc.locator('input.vehicle-rego').fill(vehicle.rego);
    }
    if (vehicle.make_model !== undefined) {
        await vehicle_info_loc.locator('input.vehicle-make-model').fill(vehicle.make_model);
    }
    if (vehicle.kms !== undefined && invoice_vehicle) {
        const kms = vehicle.kms.toString();
        await vehicle_info_loc.locator('input.vehicle-odometer').fill(kms);
    }
    if (vehicle.notes !== undefined && !invoice_vehicle) {
        await vehicle_info_loc.locator('input.vehicle-notes').fill(vehicle.notes);
    }
}

async function productToPage(page, selector, product, invoice_item=false) {
    const item_info_loc = page.locator(selector);
    if (product.name !== undefined) {
        await item_info_loc.locator('input.item-name').fill(product.name);
    }
    if (product.description !== undefined) {
        await item_info_loc.locator('textarea.item-desc').fill(product.description);
    }
    if (product.price !== undefined) {
        await item_info_loc.locator('input.item-price').fill(product.price.toFixed(2));
    }
    if (product.qty !== undefined && invoice_item) {
        await item_info_loc.locator('input.item-qty').fill(product.qty.toFixed(2));
    }
}

async function checkUserNotification(page, heading_text, message_text) {
    var heading_ok = false;
    var message_ok = false;
    const user_notify_loc = page.locator('#modal-notify');
    if (user_notify_loc) {
        const heading = await user_notify_loc.locator('.modal-notify-title').textContent();
        const message = await user_notify_loc.locator('.modal-notify-message').textContent();
        if (heading_text !== '' && heading.includes(heading_text)) {
            heading_ok = true;
        }
        if (message_text !== '' && message.includes(message_text)) {
            message_ok = true;
        }
    }
    return [heading_ok,message_ok];
}

async function acknowledgeUserNotification(page) {
    const user_notify_loc = page.locator('#modal-notify');
    if (user_notify_loc) {
        const close_btn = await user_notify_loc.getByTestId('modal-notify-close-btn');
        await close_btn.click();
        expect(close_btn).toBeHidden();
        await sleep(500); //TODO
    }
}


async function checkSaveSuccess(page) {
    const [heading_ok,message_ok] = await checkUserNotification(page, 'Success', '');
    return heading_ok;
}


function checkDatesMatch(date, expected_date) {
    expect(date).toStrictEqual(expected_date);
}

async function dateFromString(date_str) {
    // Assuming the displayed date is in DD/MM/YYYY format
    const [displayedDay, displayedMonth, displayedYear] = date_str.split('/').map(Number);
    // Create a Date object from the displayed date
    return new Date(displayedYear, displayedMonth - 1, displayedDay);
}


class Invoice {
    date = null;
    due_date = null;
    client = -1;
    vehicle = -1;
    items = [];
    subtotal = 0.0;
    discount_pct = 0.0;
    discount_amount = 0.0;
    gst_pct = 0.0;
    gst_amount = 0.0;
    received_amount = 0.0;
    total = 0.0;
    amount_due = 0.0;
    notes = '';

    addClient(index) {
        this.client = index;
    }

    addVehicle(index) {
        this.vehicle = index;
    }

    addItem(index) {
        this.items.push(index);
        this.updateTotals();
    }

    updateTotals() {
        this.subtotal = 0.0;
        for (const item_index of this.items) {
            const item = TEST_ITEMS[item_index];
            const item_total = item.qty * item.price;
            this.subtotal += item_total;
        }
        if (this.discount_pct !== 0.0) {
            this.discount_amount = this.subtotal * (this.discount_pct / 100.0);
        }
        this.gst_amount = (this.subtotal - this.discount_amount) * (this.gst_pct / 100.0);
        this.total = this.subtotal - this.discount_amount + this.gst_amount;
        this.amount_due = this.total - this.received_amount;
    }
}


class Manage_invoices_page {

    constructor(app_state) {
        this.app_state = app_state;
        this.page = app_state.page;
    }

    async goto(page=null) {
        if (page) {
            await this.page.goto('http://localhost:8000/#manage-invoices/' + page);
        } else {
            await this.page.goto('http://localhost:8000/#manage-invoices');
        }
        await sleep(100);
    }

    async getPageCount() {
        const pagination_text_loc = await this.page.locator('#invoice-page-info');
        const regex = /Page (\d+) of (\d+)/;
        const page_info = await pagination_text_loc.textContent();
        const match = page_info.match(regex);
        return match;
    }

    async getInvoiceTableRows(page) {
    }

    async search(term) {
        const search_text_loc = await this.page.locator('#invoice-search-term');
        const search_btn_loc = await this.page.locator('#invoice-search-btn');
        await search_text_loc.fill(term);
        await search_btn_loc.click();
        await sleep(500);
    }

    async clearSearch() {
        const clear_search_btn_loc = await this.page.locator('#invoice-search-clear-btn');
        await clear_search_btn_loc.click();
        await sleep(500);
    }

    async getTableRow(invoice) {
        var current_page = 1;
        var found = false;
        var row = null;
        var row_counts = [];
        const page_info = await this.getPageCount();
        while (!found && (current_page <= page_info[2])) {
            await this.goto(current_page);
            const invoice_list_loc = await this.page.locator('#invoice-list-body');
            const rows = await invoice_list_loc.locator('tr');
            const row_count = await rows.count();
            row_counts.push(row_count);
            expect(row_count).toBeGreaterThan(0);
            for (let i = 0; i < row_count; i++) {
                row = await rows.nth(i);
                const cellText = await row.locator('td:nth-child(1)').textContent();
                if (cellText.includes(invoice.number)) {
                    found = true;
                    break;
                }
            }
            current_page++;
        }
        if (found) {
            return row;
        }
        console.log("Failed to find invoice: " + invoice.number + " Checked " + current_page + " pages (" + page_info + "). Rows: " + row_counts);
        return null;
    }

    async checkInvoiceIsListed(invoice) {
        const row = await this.getTableRow(invoice);
        expect(row).toBeTruthy();
    }

    async checkInvoiceDetails(invoice) {
        const row = await this.getTableRow(invoice);
        expect(row).toBeTruthy();
        const number_text = await row.locator('td:nth-child(1)').textContent();
        expect(number_text).toBe(invoice.number);
        const date_text = await row.locator('td:nth-child(2)').textContent();
        checkDatesMatch(await dateFromString(date_text), invoice.date);
        if (invoice.client !== -1) {
            const client_text = await row.locator('td:nth-child(3)').textContent();
            const client = TEST_CLIENTS[invoice.client];
            var expected_client_text = client.contact.name;
            if (client.contact.surname !== undefined) {
                expected_client_text += ' ' + client.contact.surname;
            }
            expect(client_text).toBe(expected_client_text);
        }
        if (invoice.vehicle !== -1) {
            const vehicle_text = await row.locator('td:nth-child(4)').textContent();
            const vehicle = TEST_VEHICLES[invoice.vehicle];
            expect(vehicle_text).toBe(vehicle.rego + '    ' + vehicle.kms + ' km' + vehicle.make_model);
        }
        const total_text = await row.locator('td:nth-child(5)').textContent();
        expect(total_text).toBe('$' + invoice.total.toFixed(2));
    }
}


class Create_invoice_page {

    constructor(app_state) {
        this.app_state = app_state;
        this.page = app_state.page;
    }

    async goto() {
        await this.page.goto('http://localhost:8000/#create-invoice');
        /*
        await this.checkInvoiceNumber('INV-' + this.app_state.next_invoice_number.toString().padStart(6, '0'));
        await this.checkInvoiceDate();
        await this.checkInvoiceDueDate(null);
        */
    }

    async saveInvoice(ack_notification=true) {
        const save_btn_loc = await this.page.locator('#save-invoice-btn');
        expect(save_btn_loc).toBeVisible();
        await save_btn_loc.click();
        if (await checkSaveSuccess(this.page)) {
            this.app_state.next_invoice_number++;
            if (ack_notification) {
                await acknowledgeUserNotification(this.page);
            }
            return true;
        }
        return false;
    }

    async selectClient() {
    }

    async selectClientVehicle() {
    }

    async selectItem() {
    }

    async removeItem() {
    }

    async addItemRow() {
        const add_item_loc = await this.page.locator('#invoice-add-item-btn');
        await add_item_loc.click();
    }

    async fillInvoiceDate(date) {
        const date_loc = this.page.locator('#page-edit-invoice .invoice-date');
        await date_loc.fill(date);
    }

    async fillInvoiceDueDate(date) {
        const date_loc = this.page.locator('#page-edit-invoice .invoice-due-date');
        await date_loc.fill(date);
    }

    async fillDiscountPct(pct) {
        const discount_pct_loc = this.page.locator('#page-edit-invoice .invoice-discount-pct');
        await discount_pct_loc.fill(pct);
    }

    async fillDiscountAmount(amount) {
        const discount_amount_loc = this.page.locator('#page-edit-invoice .invoice-discount');
        await discount_amount_loc.fill(amount);
    }

    async fillReceivedAmount(amount) {
        const received_amount_loc = this.page.locator('#page-edit-invoice .invoice-received');
        await received_amount_loc.fill(amount);
    }

    async fillNotes(notes) {
        const notes_loc = this.page.locator('#page-edit-invoice .invoice-notes');
        await notes_loc.fill(notes);
    }

    async addItem(data) {
        await this.addItemRow();
        await productToPage(this.page, '#modal-edit-item', data, true);
        const save_item_loc = await this.page.locator('#modal-edit-item .modal-save-btn');
        await save_item_loc.click();
        expect(save_item_loc).toBeHidden();
        await sleep(1000); //TODO
    }

    async fillClient(data) {
        await clientToPage(this.page, '#page-edit-invoice .client-info', data, true);
    }

    async fillVehicle(data) {
        await vehicleToPage(this.page, '#page-edit-invoice .vehicle-info', data, true);
    }

    async fill(invoice) {
        if (invoice.date !== null) {
            await this.fillInvoiceDate(invoice.date);
        }
        if (invoice.due_date !== null) {
            await this.fillInvoiceDueDate(invoice.due_date);
        }
        if (invoice.client !== -1) {
            await this.fillClient(TEST_CLIENTS[invoice.client]);
        }
        if (invoice.vehicle !== -1) {
            await this.fillVehicle(TEST_VEHICLES[invoice.vehicle]);
        }
        for (const item_index of invoice.items) {
            await this.addItem(TEST_ITEMS[item_index]);
        }
        if (invoice.discount_pct !== 0.0) {
            await this.fillDiscountPct(invoice.discount_pct);
        }
        if (invoice.discount_amount !== 0.0) {
            await this.fillDiscountAmount(invoice.discount_amount);
        }
        if (invoice.received_amount !== 0.0) {
            await this.fillReceivedAmount(invoice.received_amount);
        }
        if (invoice.notes !== '') {
            await this.fillNotes(invoice.notes);
        }
        const invoice_number_loc = this.page.getByTestId('page-edit-invoice-number');
        invoice.number = await invoice_number_loc.textContent();
        const invoice_date_loc = this.page.locator('#page-edit-invoice .invoice-date');
        invoice.date = new Date(await invoice_date_loc.inputValue());
    }

    async checkInvoiceNumber(expected) {
        const invoice_number_loc = this.page.getByTestId('page-edit-invoice-number');
        await expect(invoice_number_loc).toBeVisible();
        await expect(invoice_number_loc).toHaveText(expected);
    }

    async checkInvoiceDate(date=new Date()) {
        const invoice_date_loc = this.page.locator('#page-edit-invoice .invoice-date');
        await expect(invoice_date_loc).toBeVisible();
        checkDatesMatch(new Date(await invoice_date_loc.inputValue()), date);
    }

    async checkInvoiceDueDate(date=new Date()) {
        const invoice_due_date_loc = this.page.locator('#page-edit-invoice .invoice-due-date');
        await expect(invoice_due_date_loc).toBeVisible();
        checkDatesMatch(new Date(await invoice_due_date_loc.inputValue()), date);
    }

    async checkInvoiceTotals(invoice) {
        invoice.updateTotals();
        const invoice_subtotal_loc = this.page.locator('#page-edit-invoice .invoice-sub-total');
        expect(invoice_subtotal_loc).toHaveText(invoice.subtotal.toFixed(2));
        const invoice_discount_pct_loc = this.page.locator('#page-edit-invoice .invoice-discount-pct');
        expect(await invoice_discount_pct_loc.inputValue()).toBe(invoice.discount_pct.toFixed(2));
        const invoice_discount_amount_loc = this.page.locator('#page-edit-invoice .invoice-discount');
        expect(await invoice_discount_amount_loc.inputValue()).toBe(invoice.discount_amount.toFixed(2));
        const invoice_gst_amount_loc = this.page.locator('#page-edit-invoice .invoice-gst');
        expect(invoice_gst_amount_loc).toHaveText(invoice.gst_amount.toFixed(2));
        const invoice_received_loc = this.page.locator('#page-edit-invoice .invoice-received');
        expect(await invoice_received_loc.inputValue()).toBe(invoice.received_amount.toFixed(2));
        const invoice_total_loc = this.page.locator('#page-edit-invoice .invoice-total');
        expect(invoice_total_loc).toHaveText(invoice.total.toFixed(2));
    }
}


class App_state {

    invoices = [];
    next_invoice_number = 1;

    create_invoice_page = null;
    manage_invoices_page = null;

    seed = 12345;
    seeded_random = null;

    constructor(page) {
        this.page = page;
        this.create_invoice_page = new Create_invoice_page(this);
        this.manage_invoices_page = new Manage_invoices_page(this);
        this.seeded_random = new SeededRandom(this.seed);
    }

    generateInvoice(save=false) {
        const invoice = generateRandomInvoice(this.seeded_random);
        if (save) {
            this.invoices.push(invoice);
        }
        return invoice;
    }

    async goto() {
        await this.page.goto('http://localhost:8000');
        await acceptSLA(this.page);
    }
}


test_base.describe('SLA', () => {

    test_base.beforeEach(async ({page}) => {
        await page.goto('http://localhost:8000');
    });

    test_base('SLA is shown', async ({page}) => {
        // The SLA can only be accepted if it is shown.
        await acceptSLA(page);
    });

    test_base('SLA prevents any other actions', async ({page}) => {
        // The SLA should be modal and prevent any other actions from taking place.
        // TODO
        await acceptSLA(page);
    });
});



const test = test_base.extend({
    app_state: async ({page}, use) => {
        const app_state = new App_state(page);
        await app_state.goto();
        await use(app_state);
    },
});

test('Check create invoice info', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    // The invoice number and dates are checked in the fixture setup
});

test('Check create invoice save error when no client entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Incomplete', 'client name');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Create invoice enter client info', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[0]);
});

test('Create invoice enter vehicle info', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.fillVehicle(TEST_VEHICLES[0]);
});

test('Check create invoice save error when no items entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[0]);
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Incomplete', 'one item');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Check create invoice save ok when client and items entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[1]);
    await app_state.create_invoice_page.addItem(TEST_ITEMS[0]);
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Success', 'saved');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Check create invoice save ok when client, vehicle and items entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[2]);
    await app_state.create_invoice_page.fillVehicle(TEST_VEHICLES[0]);
    await app_state.create_invoice_page.addItem(TEST_ITEMS[0]);
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Success', 'saved');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Check create invoice totals with one item', async ({app_state}) => {
    const invoice = new Invoice();
    invoice.addClient(3);
    invoice.addVehicle(1);
    invoice.addItem(0);
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.fill(invoice);
    await app_state.create_invoice_page.checkInvoiceTotals(invoice);
});

test('Check create invoice totals with multiple items', async ({app_state}) => {
    const invoice = new Invoice();
    invoice.addClient(3);
    invoice.addVehicle(1);
    for (var i = 0; i < TEST_ITEMS.length; i++) {
        invoice.addItem(i);
    }
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.fill(invoice);
    await app_state.create_invoice_page.checkInvoiceTotals(invoice);
});

test('Check single saved invoice is shown in list', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    const invoice = app_state.generateInvoice();
    await app_state.create_invoice_page.fill(invoice);
    await app_state.create_invoice_page.saveInvoice(true);
    await app_state.manage_invoices_page.checkInvoiceIsListed(invoice);
});

test('Check single saved invoice details in list', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    const invoice = app_state.generateInvoice();
    await app_state.create_invoice_page.fill(invoice);
    await app_state.create_invoice_page.saveInvoice(true);
    await app_state.manage_invoices_page.checkInvoiceDetails(invoice);
});

test('Check multiple saved invoice details in list', async ({app_state}) => {
    const TEST_NUM_INVOICES = 12;
    for (let i = 0; i < TEST_NUM_INVOICES; i++) {
        const invoice = app_state.generateInvoice(true);
        await app_state.create_invoice_page.goto();
        await app_state.create_invoice_page.fill(invoice);
        await app_state.create_invoice_page.saveInvoice(true);
    }
/*
    for (let i = 0; i < TEST_NUM_INVOICES; i++) {
        // Use pagination
        await app_state.manage_invoices_page.checkInvoiceDetails(app_state.invoices[i]);
    }
*/

    for (let i = 0; i < TEST_NUM_INVOICES; i++) {
        // Use search
        await app_state.manage_invoices_page.search(app_state.invoices[i].number);
        await app_state.manage_invoices_page.checkInvoiceDetails(app_state.invoices[i]);
        await app_state.manage_invoices_page.clearSearch();
    }
});
