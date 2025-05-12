// @ts-check
//import { test as test_base, expect } from '@playwright/test';
const { test: test_base } = require('@playwright/test');
import { expect } from '@playwright/test';
const fs = require('fs');


const VENDOR_INFO = {
    name: 'Acme Auto',
    email: 'acme-auto@test.com',
    phone: '0412345678',
    address: '42 Blacktop Road',
    city: 'Big Town',
    postcode: '0123',
}

const TEST_SETTINGS = {
    id: 'main',
    vendor: VENDOR_INFO,
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
    next_invoice_number: 1234,
    gapi_client_id: '',
    google_drive_path: 'Acme Auto',
    email_subject: '',
    email_body: '',
    sla_accepted: true,
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
    {
        rego: 'S464BAD',
        make_model: '2023 BYD GOLDFISH',
        kms: 0
    },
    {
        rego: '',
        make_model: 'Not sure',
        kms: 666888
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

function getExportedContactInfo(contact) {
    return {
        name: contact.name || '',
        surname: contact.surname || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        city: contact.city || '',
        postcode: contact.postcode || '',
        date: ''
    };
}

function getExportedClientInfo(client, id, vehicles, skip_notes=false) {
    const info = {
        contact: getExportedContactInfo(client.contact),
        vehicle_ids: vehicles,
        notes: '',
        deleted: false,
        date: '',
        id: id
    };
    if (!skip_notes) {
        info.notes = client.notes || "";
    }
    return info;
}

function getExportedVehicleInfo(vehicle, id) {
    return {
        make_model: vehicle.make_model || '',
        rego: vehicle.rego || '',
        notes: vehicle.notes || '',
        deleted: false,
        date: '',
        id: id
    };
}

function getExportedProductInfo(product, id, skip_notes=false) {
    const info = {
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        notes: '',
        deleted: false,
        date: '',
        id: id
    };
    if (!skip_notes) {
        info.notes = product.notes || '';
    }
    return info;
}

function getExportedSettingsInfo(settings, number_of_invoices=0) {
        const data = {
            //vendor: getExportedContactInfo(settings.vendor),
            vendor_name: settings.vendor.name,
            vendor_email: settings.vendor.email,
            vendor_phone: settings.vendor.phone,
            vendor_address: settings.vendor.address,
            vendor_city: settings.vendor.city,
            vendor_postcode: settings.vendor.postcode,
            vendor_abn: settings.vendor_abn,
            vendor_gst: settings.vendor_gst,
            payment_bank: settings.payment_bank,
            payment_bsb: settings.payment_bsb,
            payment_name: settings.payment_name,
            payment_account: settings.payment_account,
            payment_reference: settings.payment_reference,
            payment_payid_name: settings.payment_payid_name,
            payment_payid_id: settings.payment_payid_id,
            invoice_prefix: settings.invoice_prefix,
            next_invoice_number: settings.next_invoice_number + number_of_invoices,
            sla_accepted: settings.sla_accepted,
            gapi_client_id: settings.gapi_client_id,
            google_drive_path: settings.google_drive_path,
            email_subject: settings.email_subject,
            email_body: settings.email_body,
        };
        if (settings.id !== undefined) {
            data.id = settings.id;
        }
        return data;
}

function getInvoiceItemInfo(item_index) {
    const item = TEST_ITEMS[item_index];
    return {
        id: item.id,
        product_id: item_index,
        name: item.name,
        description: item.description,
        price: item.price,
        qty: item.qty,
        deleted: false,
        date: ''
    };
}

function getExportedInvoiceInfo(invoice, id) {
    const data = {
        number: invoice.number,
        date: '',
        due_date: invoice.due_date?.toISOString() || null,
        client_id: invoice.client_id,
        vehicle_id: invoice.vehicle_id,
        odo: invoice.odo,
        items: invoice.items.map(item => getInvoiceItemInfo(item)),
        sub_total: invoice.subtotal,
        discount: invoice.discount_amount,
        discount_pct: invoice.discount_pct,
        gst: invoice.gst_pct,
        received: invoice.received_amount,
        total: invoice.total,
        notes: invoice.notes,
        deleted: false,
        email_sent_dates: invoice.email_sent_dates.map(date => date.toISOString()),
        drive_id: "",
        last_upload_date: '',
        last_change_date: '',
        created_date: '',
    };
    if (id !== undefined) {
        data.id = id;
    }
    return data;
}

// Function to generate random client object using seeded random generator
function generateRandomInvoice(random, settings_loaded=false) {

    const invoice = new Invoice();

    if (settings_loaded) {
        invoice.gst_pct = TEST_SETTINGS.vendor_gst;
    }

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
    const link = await page.getByTestId(page_link)
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByTestId(page_id + '-heading')).toBeVisible();
}

async function setMinimalSettings(page, save=true) {
    await gotoPage(page, 'Settings');
    await page.getByTestId('settings-vendor-name').fill(TEST_SETTINGS.vendor.name);
    await page.getByTestId('settings-vendor-phone').fill(TEST_SETTINGS.vendor.phone);
    await page.getByTestId('settings-vendor-email').fill(TEST_SETTINGS.vendor.email);
    await page.getByTestId('settings-vendor-abn').fill(TEST_SETTINGS.vendor_abn);
    await page.getByTestId('settings-vendor-gst').fill(TEST_SETTINGS.vendor_gst.toFixed(2));
    if (save) {
        await page.getByTestId('save-settings-btn').click();
        await acknowledgeUserNotification(page);
    }
}

async function setSomeSettings(page, save=true) {
    await setMinimalSettings(page, false);
    await page.getByTestId('settings-bank-name').fill(TEST_SETTINGS.payment_bank);
    await page.getByTestId('settings-bank-bsb').fill(TEST_SETTINGS.payment_bsb);
    await page.getByTestId('settings-bank-account-number').fill(TEST_SETTINGS.payment_account);
    if (save) {
        await page.getByTestId('save-settings-btn').click();
        await acknowledgeUserNotification(page);
    }
}

async function setAllSettings(page, save=true) {
    await setSomeSettings(page, false);
    await page.getByTestId('settings-vendor-address').fill(TEST_SETTINGS.vendor.address);
    await page.getByTestId('settings-vendor-city').fill(TEST_SETTINGS.vendor.city);
    await page.getByTestId('settings-vendor-postcode').fill(TEST_SETTINGS.vendor.postcode);
    await page.getByTestId('settings-bank-account-name').fill(TEST_SETTINGS.payment_name);
    await page.getByTestId('settings-bank-reference').fill(TEST_SETTINGS.payment_reference);
    await page.getByTestId('settings-payid-name').fill(TEST_SETTINGS.payment_payid_name);
    await page.getByTestId('settings-payid-id').fill(TEST_SETTINGS.payment_payid_id);
    await page.getByTestId('settings-invoice-prefix').fill(TEST_SETTINGS.invoice_prefix);
    await page.getByTestId('settings-next-invoice-number').fill(TEST_SETTINGS.next_invoice_number.toFixed());
    await page.getByTestId('settings-gapi-client-id').fill(TEST_SETTINGS.gapi_client_id);
    await page.getByTestId('settings-google-drive-path').fill(TEST_SETTINGS.google_drive_path);
    if (save) {
        await page.getByTestId('save-settings-btn').click();
        await sleep(500);
        await acknowledgeUserNotification(page);
    }
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
    if (vehicle.kms !== undefined && vehicle.kms !== 0 && invoice_vehicle) {
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
        await sleep(500);
    }
}


async function checkSaveSuccess(page) {
    const [heading_ok,message_ok] = await checkUserNotification(page, 'Success', '');
    return heading_ok;
}


function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}


function compareJsonObjects(obj1, obj2, ignoredFields = [], path = '') {
    const differences = [];

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
        const fullPath = path ? `${path}.${key}` : key;

        const val1 = obj1[key];
        const val2 = obj2[key];

        if (ignoredFields.includes(key)) {
            // Ensure that ignored keys exist in both JSON objects
            if (!keys1.includes(key)) {
                differences.push(`Missing ignored key in template JSON: ${fullPath}`);
            }
            if (!keys2.includes(key)) {
                differences.push(`Missing ignored key in downloaded JSON: ${fullPath}`);
            }
            continue;
        }

        if (!keys2.includes(key)) {
            differences.push(`Missing key in downloaded JSON: ${fullPath}`);
            continue;
        }
        if (!keys1.includes(key)) {
            differences.push(`Extra key in downloaded JSON: ${fullPath}`);
            continue;
        }

        if (isObject(val1) && isObject(val2)) {
            const nestedDiffs = compareJsonObjects(val1, val2, ignoredFields, fullPath);
            differences.push(...nestedDiffs);
        } else if (Array.isArray(val1) && Array.isArray(val2)) {
            // Compare arrays
            if (val1.length !== val2.length) {
                differences.push(`Mismatch in key "${fullPath}": array lengths differ`);
            } else {
                // Compare array elements
                for (let i = 0; i < val1.length; i++) {
                    const elementPath = `${fullPath}[${i}]`;
                    const elementDiffs = compareJsonObjects({ item: val1[i] }, { item: val2[i] }, ignoredFields, elementPath);
                    differences.push(...elementDiffs);
                }
            }
        } else if (val1 !== val2) {
            differences.push(`Mismatch in key "${fullPath}": template = ${JSON.stringify(val1)}, downloaded = ${JSON.stringify(val2)}`);
        }
    }

    return differences;
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
    odo = null;
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

    email_sent_dates = [];
    last_uploaded_date = [];

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

    getTotalsStr() {
        let discount = ' Disc(' + this.dicount_pct + '%): $' + this.discount_amount.toFixed(2) + ' ';
        let gst = ' GST(' + this.gst_pct + '%): $' + this.gst_amount.toFixed(2) + ' ';
        return 'Sub: $' + this.subtotal.toFixed(2) + discount + gst + 'Rec: $' + this.received_amount.toFixed(2) + ' Total: $' + this.total.toFixed(2) + ' Due: $' + this.amount_due.toFixed(2);
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
        await sleep(500);
    }

    async getPageCount() {
        const pagination_text_loc = await this.page.locator('#invoice-page-info');
        const regex = /Page (\d+) of (\d+)/;
        const page_info = await pagination_text_loc.textContent();
        const match = await page_info.match(regex);
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

    async getTableRow(invoice, check_pages=true) {
        var current_page = 0;
        var found = false;
        var row = null;
        var row_counts = [];
        const page_info = await this.getPageCount();
        while (!found && (current_page < page_info[2])) {
            if (check_pages) {
                await this.goto(current_page+1); // Index to page number
            }
            const invoice_list_loc = await this.page.locator('#invoice-list-body');
            const rows = await invoice_list_loc.locator('tr');
            const row_count = await rows.count();
            row_counts.push(row_count);
            expect(row_count).toBeGreaterThan(0);
            for (let i = 0; i < row_count; i++) {
                row = await rows.nth(i);
                const cell = await row.locator('td:nth-child(1)');
                const cellText = await cell.textContent();
                if (cellText.includes(invoice.number)) {
                    found = true;
                    break;
                }
            }
            current_page++;
            if (!check_pages) {
                break;
            }
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

    async checkInvoiceDetails(invoice, check_pages=true) {
        const row = await this.getTableRow(invoice, check_pages);
        if (!row) {
            await this.app_state.page.screenshot({ path: 'checkInvoiceDetails_screenshot.png' });
        }
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
            let expected_vehicle_text = '';
            if (vehicle.rego !== '') {
                expected_vehicle_text += vehicle.rego;
            }
            if (vehicle.kms !== 0) {
                if (expected_vehicle_text !== '') {
                    expected_vehicle_text += '    ';
                }
                expected_vehicle_text += vehicle.kms + ' km';
            }
            expected_vehicle_text += vehicle.make_model;
            expect(vehicle_text).toBe(expected_vehicle_text);
        }
        const total_text = await row.locator('td:nth-child(5)').textContent();
        expect(total_text, 'INV: ' + invoice.number + ' ' + invoice.getTotalsStr()).toBe('$' + invoice.total.toFixed(2));
    }
}


class Edit_invoice_page {

    constructor(app_state) {
        this.app_state = app_state;
        this.page = app_state.page;
    }

    async goto(id) {
        await this.page.goto('http://localhost:8000/#edit-invoice/' + id);
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

    async selectItem() {
    }

    async removeItem() {
    }

    async addItemRow() {
        const add_item_loc = await this.page.locator('#invoice-add-item-btn');
        await add_item_loc.click();
        await sleep(500);
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
        await sleep(1000); //TODO
        expect(save_item_loc).toBeHidden();
    }

    async fillClient(data) {
        // Assuming the client UI has been made editable
        await clientToPage(this.page, '#page-edit-invoice .client-info', data, true);
    }

    async fillVehicle(data) {
        // Assuming the vehicle UI has been made editable
        await vehicleToPage(this.page, '#page-edit-invoice .vehicle-info', data, true);
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

class Create_invoice_page extends Edit_invoice_page {

    constructor(app_state) {
        super(app_state);
    }

    async goto() {
        await this.page.goto('http://localhost:8000/#create-invoice');
    }

    async selectClient() {
    }

    async selectClientVehicle() {
    }

    async clickNewClientButton() {
        const new_client_btn = this.app_state.page.getByTestId("invoice-new-client-btn");
        await expect(new_client_btn).toBeVisible();
        await new_client_btn.click();
    }

    async clickNewVehicleButton() {
        const new_vehicle_btn = this.app_state.page.getByTestId("invoice-new-vehicle-btn");
        await expect(new_vehicle_btn).toBeVisible();
        await new_vehicle_btn.click();
    }

    async fill(invoice) {
        if (invoice.date !== null) {
            await this.fillInvoiceDate(invoice.date);
        }
        if (invoice.due_date !== null) {
            await this.fillInvoiceDueDate(invoice.due_date);
        }
        if (invoice.client !== -1) {
            // TODO(CE): Assuming all clients are 'new' for now, should select existing ones instead.
            this.clickNewClientButton();
            await this.fillClient(TEST_CLIENTS[invoice.client]);
        }
        if (invoice.vehicle !== -1) {
            // TODO(CE): Assuming all vehicles are 'new' for now, should select existing ones instead.
            this.clickNewVehicleButton();
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
}


class Backups_page {

    constructor(app_state) {
        this.app_state = app_state;
        this.page = app_state.page;
    }

    async goto() {
        await this.page.goto('http://localhost:8000/#backups');
        await sleep(500);
    }

    async clickDownloadBackup() {
        const dl_backup_btn = this.page.getByTestId('create-file-backup-btn');
        await expect(dl_backup_btn).toBeVisible();
        await dl_backup_btn.click();
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            dl_backup_btn.click()
        ]);
        const path = await download.path();
        //console.log("Got file path: " + path);
        const downloadedJson = fs.readFileSync(path, 'utf-8');
        const parsedData = JSON.parse(downloadedJson);
        //console.log("File content: ")
        //console.log(parsedData);
        return [parsedData,path];
    }

}


class App_state {

    invoices = [];
    next_invoice_number = 1;

    seed = 12345;
    seeded_random = null;

    create_invoice_page = null;
    manage_invoices_page = null;
    edit_invoice_page = null;
    backups_page = null;

    constructor(page, browserName) {
        this.page = page;
        this.browserName = browserName;
        this.seeded_random = new SeededRandom(this.seed);

        this.create_invoice_page = new Create_invoice_page(this);
        this.manage_invoices_page = new Manage_invoices_page(this);
        this.edit_invoice_page = new Edit_invoice_page(this);
        this.backups_page = new Backups_page(this);
    }

    generateInvoice(save=false, settings_loaded=false) {
        const invoice = generateRandomInvoice(this.seeded_random, settings_loaded);
        if (save) {
            this.invoices.push(invoice);
        }
        return invoice;
    }

    generateExpectedJsonBackupData() {
        const all_clients = [];
        const productSet = new Set();
        const all_products = [];
        const all_vehicles = [];
        const all_invoices = [];
        var id = 1;
        for (const invoice of this.invoices) {
            var client_vehicles = [];
            if (invoice.vehicle !== -1) {
                all_vehicles.push(getExportedVehicleInfo(TEST_VEHICLES[invoice.vehicle], all_vehicles.length + 1));
                client_vehicles.push(all_vehicles.length);
            }
            all_clients.push(getExportedClientInfo(TEST_CLIENTS[invoice.client], id, client_vehicles, true));
            for (const product of invoice.items) {
                if (!productSet.has(product)) {
                    productSet.add(product);
                }
            }
            all_invoices.push(getExportedInvoiceInfo(invoice, id));
            id++;
        }
        id = 0;
        for (const product of productSet) {
            all_products.push(getExportedProductInfo(TEST_ITEMS[product], id, true));
            id++;
        }
        return {
            db_version: 3,
            app_version: '2025.0',
            date: '',
            data: {
                clients: all_clients,
                vehicles: all_vehicles,
                products: all_products,
                settings: [getExportedSettingsInfo(TEST_SETTINGS, this.invoices.length)],
                invoices: all_invoices
            }
        };
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
    app_state: async ({page, browserName}, use) => {
        const app_state = new App_state(page, browserName);
        await app_state.goto();
        await use(app_state);
    },
});

test('Check create invoice info', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    // The invoice number and dates are checked in the fixture setup
});

test('Check create invoice save error when no client created or selected', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Incomplete', 'new client or select');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Check create invoice save error when no client entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.clickNewClientButton();
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Incomplete', 'client name');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Create invoice enter client info', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.clickNewClientButton();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[0]);
});

test('Create invoice enter vehicle info', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.clickNewClientButton();
    await app_state.create_invoice_page.clickNewVehicleButton();
    await app_state.create_invoice_page.fillVehicle(TEST_VEHICLES[0]);
});

test('Check create invoice save error when no items entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.clickNewClientButton();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[0]);
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Incomplete', 'one item');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Check create invoice save ok when client and items entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.clickNewClientButton();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[1]);
    await app_state.create_invoice_page.addItem(TEST_ITEMS[0]);
    await app_state.create_invoice_page.saveInvoice(false);
    const [heading_ok,message_ok] = await checkUserNotification(app_state.page, 'Success', 'saved');
    expect(heading_ok).toBe(true);
    expect(message_ok).toBe(true);
});

test('Check create invoice save ok when client, vehicle and items entered', async ({app_state}) => {
    await app_state.create_invoice_page.goto();
    await app_state.create_invoice_page.clickNewClientButton();
    await app_state.create_invoice_page.fillClient(TEST_CLIENTS[2]);
    await app_state.create_invoice_page.clickNewVehicleButton();
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
        if (app_state.browserName === "webkit") {
            await app_state.page.screenshot({ path: 'screenshot_' + i + '.png' });
        }
        await app_state.manage_invoices_page.checkInvoiceDetails(app_state.invoices[i], false);
        await app_state.manage_invoices_page.clearSearch();
    }
});


test('Check exported DB data with a few invoices', async ({app_state}) => {

    await sleep(500);

    await setAllSettings(app_state.page);

    const TEST_NUM_INVOICES = 5;

    for (let i = 0; i < TEST_NUM_INVOICES; i++) {
        const invoice = app_state.generateInvoice(true, true);
        await app_state.create_invoice_page.goto();
        await app_state.create_invoice_page.fill(invoice);
        await app_state.create_invoice_page.saveInvoice(true);
    }

    const expected_data = app_state.generateExpectedJsonBackupData();

    await app_state.backups_page.goto();
    const [received_data,file_path] = await app_state.backups_page.clickDownloadBackup();

    const differences = compareJsonObjects(expected_data, received_data, [
        'id',
        'product_id',
        'client_id',
        'vehicle_id',
        'app_version',
        'date',
        'created_date',
        'last_change_date',
        'last_upload_date',
    ]);

    if (differences.length > 0) {
        console.log("Differences found:");
        differences.forEach(diff => console.log(diff));
    }

    expect(differences.length).toBe(0);
});
