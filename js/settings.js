
class Settings {
    vendor = new Contact_info();
    vendor_abn = '';
    vendor_gst = 0.0;
    payment_bank = '';
    payment_bsb = '';
    payment_name = '';
    payment_account = '';
    payment_reference = '';
    payment_payid_name = '';
    payment_payid_id = '';
    invoice_prefix = 'INV-';
    next_invoice_number = 1;
    sla_accepted = false;
    gapi_client_id = '';
    google_drive_path = '';
    email_subject = default_email_subject;
    email_body = default_email_body;

    serialise() {
        const data = {
            vendor: this.vendor.serialise(),
            vendor_abn: this.vendor_abn,
            vendor_gst: this.vendor_gst,
            payment_bank: this.payment_bank,
            payment_bsb: this.payment_bsb,
            payment_name: this.payment_name,
            payment_account: this.payment_account,
            payment_reference: this.payment_reference,
            payment_payid_name: this.payment_payid_name,
            payment_payid_id: this.payment_payid_id,
            invoice_prefix: this.invoice_prefix,
            next_invoice_number: this.next_invoice_number,
            sla_accepted: this.sla_accepted,
            gapi_client_id: this.gapi_client_id,
            google_drive_path: this.google_drive_path,
            email_subject: this.email_subject,
            email_body: this.email_body,
        };
        if (this.id !== undefined) {
            data.id = this.id;
        }
        return data;
    }

    deserialise(data) {
        this.id = data.id !== undefined ? data.id : undefined;
        this.vendor = data.vendor.deserialise(data.vendor);
        this.vendor_abn = data.vendor_abn;
        this.vendor_gst = data.vendor_gst;
        this.payment_bank = data.payment_bank;
        this.payment_bsb = data.payment_bsb;
        this.payment_name = data.payment_name;
        this.payment_reference = data.payment_reference;
        this.payment_payid_name = data.payment_payid_name;
        this.payment_payid_id = data.payment_payid_id;
        this.invoice_prefix = data.invoice_prefix;
        this.next_invoice_number = data.next_invoice_number;
        this.sla_accepted = data.sla_accepted;
        this.gapi_client_id = data.gapi_client_id || '';
        this.google_drive_path = data.google_drive_path || '';
        this.email_subject = data.email_subject || '';
        this.email_body = data.email_body || '';
    }

    constructor() {
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveUiSettings();
        });
    }

    async loadSettings(is_restore=false) {
        return new Promise((resolve) => {
            const transaction = db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const req = store.get('main');
            req.onsuccess = () => {
                const v = req.result;
                this.vendor.name = v?.vendor_name || '';
                this.vendor.email = v?.vendor_email || '';
                this.vendor.phone = v?.vendor_phone || '';
                this.vendor.address = v?.vendor_address || '';
                this.vendor.city = v?.vendor_city || '';
                this.vendor.postcode = v?.vendor_postcode || '';
                this.vendor_abn = v?.vendor_abn || '';
                this.vendor_gst = v?.vendor_gst || 0;
                this.payment_bank = v?.payment_bank || '';
                this.payment_bsb = v?.payment_bsb || '';
                this.payment_name = v?.payment_name || '';
                this.payment_account = v?.payment_account || '';
                this.payment_reference = v?.payment_reference || '';
                this.payment_payid_name = v?.payment_payid_name || '';
                this.payment_payid_id = v?.payment_payid_id || '';
                this.invoice_prefix = v?.invoice_prefix || 'INV-';
                this.next_invoice_number = v?.next_invoice_number || 1;
                this.sla_accepted = v?.sla_accepted || false;
                if (!is_restore) {
                    this.gapi_client_id = v?.gapi_client_id || '';
                    this.google_drive_path = v?.google_drive_path || '';
                }
                this.email_subject = v?.email_subject || '';
                this.email_body = v?.email_body || '';
                this.settingsToUI();
                resolve();
            };
        });
    }

    settingsToUI() {
        contactToUi(this.vendor, '#page-settings .vendor-info');

        document.querySelector('#page-settings .payment-bank').value = this.payment_bank;
        document.querySelector('#page-settings .payment-bsb').value = this.payment_bsb;
        document.querySelector('#page-settings .payment-name').value = this.payment_name;
        document.querySelector('#page-settings .payment-account').value = this.payment_account;
        document.querySelector('#page-settings .payment-reference').value = this.payment_reference;
        document.querySelector('#page-settings .payment-payid-name').value = this.payment_payid_name;
        document.querySelector('#page-settings .payment-payid-id').value = this.payment_payid_id;

        document.getElementById('settings-vendor-abn').value = this.vendor_abn;
        document.getElementById('settings-vendor-gst').value = this.vendor_gst;

        document.getElementById('page-title').innerHTML = this.vendor.name;
        document.getElementById('nav-title').innerHTML = this.vendor.name;

        document.getElementById('settings-invoice-prefix').value = this.invoice_prefix;
        document.getElementById('settings-next-invoice-number').value = this.next_invoice_number;

        document.getElementById('settings-email-subject').value = this.email_subject;
        const email_body_elem = document.getElementById('settings-email-body');
        email_body_elem.value = this.email_body;
        setTimeout(() => {
            email_body_elem.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        }, 0);

        document.getElementById('settings-gapi-client-id').value = this.gapi_client_id;
        document.getElementById('settings-google-drive-path').value = this.google_drive_path;

        document.getElementById('sla-accepted').innerHTML = this.sla_accepted ? 'Accepted' : 'Not accepted';
    }

    uiToSettings() {
        uiToContact(this.vendor, '#page-settings .vendor-info');

        this.payment_bank = document.querySelector('#page-settings .payment-bank').value;
        this.payment_bsb = document.querySelector('#page-settings .payment-bsb').value;
        this.payment_name = document.querySelector('#page-settings .payment-name').value;
        this.payment_account = document.querySelector('#page-settings .payment-account').value;
        this.payment_reference = document.querySelector('#page-settings .payment-reference').value;
        this.payment_payid_name = document.querySelector('#page-settings .payment-payid-name').value;
        this.payment_payid_id = document.querySelector('#page-settings .payment-payid-id').value;

        this.vendor_abn = document.getElementById('settings-vendor-abn').value;
        this.vendor_gst = parseFloat(document.getElementById('settings-vendor-gst').value);

        this.invoice_prefix = document.getElementById('settings-invoice-prefix').value;
        this.next_invoice_number =
            parseInt(document.getElementById('settings-next-invoice-number').value) || this.next_invoice_number;

        this.email_subject = document.getElementById('settings-email-subject').value;
        this.email_body = document.getElementById('settings-email-body').value;

        this.gapi_client_id = document.getElementById('settings-gapi-client-id').value;
        this.google_drive_path = document.getElementById('settings-google-drive-path').value;
    }

    saveUiSettings() {
        this.uiToSettings();
        this.saveSettings();
        document.getElementById('page-title').innerHTML = this?.vendor.name || 'Invoicing';
        document.getElementById('nav-title').innerHTML = this?.vendor.name || 'Invoicing';
        userNotification("Success", "Settings saved");
    }

    saveSettings() {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const db_settings = {
            id: 'main',
            vendor_name: this.vendor.name,
            vendor_email: this.vendor.email,
            vendor_phone: this.vendor.phone,
            vendor_address: this.vendor.address,
            vendor_city: this.vendor.city,
            vendor_postcode: this.vendor.postcode,
            vendor_abn: this.vendor_abn,
            vendor_gst: this.vendor_gst,
            payment_bank: this.payment_bank,
            payment_bsb: this.payment_bsb,
            payment_name: this.payment_name,
            payment_account: this.payment_account,
            payment_reference: this.payment_reference,
            payment_payid_name: this.payment_payid_name,
            payment_payid_id: this.payment_payid_id,
            invoice_prefix: this.invoice_prefix,
            next_invoice_number: this.next_invoice_number,
            sla_accepted: this.sla_accepted,
            gapi_client_id: this.gapi_client_id,
            google_drive_path: this.google_drive_path,
            email_subject: this.email_subject,
            email_body: this.email_body,
        };
        store.put(db_settings);
    }

    getNextInvoiceNumber() {
        return this.invoice_prefix + this.next_invoice_number.toString().padStart(6, "0");
    }

    incrementNextInvoiceNumber() {
        this.next_invoice_number++;
        this.saveSettings();
    }

    setSLAConfirmed() {
        this.sla_accepted = true;
        this.saveSettings();
        console.log("SLA Accepted");
    }
};
