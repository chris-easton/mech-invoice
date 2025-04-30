
class Invoice_item {
    id = -1;
    product_id = -1;
    name = '';
    description = '';
    price = 0.0;
    qty = 1.0;
    total = 0.0;
    deleted = false;
    date = new Date();

    updateTotal() {
        this.total = this.qty * this.price;
    }

    toProduct() {
        const product = new Product();
        if (this.product_id !== -1) {
            product.id = this.product_id;
        }
        product.name = this.name;
        product.description = this.description;
        product.price = this.price;
        return product;
    }

    async save() {
        this.updateTotal();
        const product = this.toProduct();
        this.product_id = await product.save();
        this.date = new Date();
    }

    serialise() {
        return {
            id: this.id,
            product_id: this.product_id,
            name: this.name,
            description: this.description,
            price: this.price,
            qty: this.qty,
            deleted: this.deleted,
            date: this.date.toISOString(),
        };
    }

    deserialise(data) {
        this.id = data?.id || -1;
        this.product_id = data?.product_id || -1;
        this.name = data.name;
        this.description = data.description;
        this.price = data.price;
        this.qty = data.qty;
        this.deleted = data?.deleted || false;
        this.date = data.date ? new Date(data.date) : new Date();
    }
}


class Invoice {
    number = 0;
    date = new Date();
    due_date = null;
    client_id = 0;
    vehicle_id = -1;
    odo = 0.0;
    items = [];
    sub_total = 0.0;
    discount = 0.0;
    discount_pct = 0.0;
    gst_pct = 0.0;
    gst_value = 0.0;
    received = 0.0;
    amount_due = 0.0;
    total = 0.0;
    notes = '';
    deleted = false;
    drive_id = '';
    last_upload_date = new Date();
    email_sent_dates = [];
    last_change_date = new Date();
    created_date = new Date();

    addItem(product=null) {
        const new_item = new Invoice_item();
        new_item.id = this.items.length;
        if (product !== null) {
            new_item.product_id = product.id;
            new_item.name = product.name;
            new_item.description = product.description;
            new_item.price = product.price;
        }
        this.items.push(new_item);
        this.updateTotal();
        return new_item.id;
    }

    getItem(id) {
        for (const item of this.items) {
            if (item.id === id) {
                return item;
            }
        }
        return null;
    }

    getItemIndex(id) {
        return this.items.findIndex(item => item.id === id);
    }

    removeItem(id) {
        const index = this.getItemIndex(id)
        if (index !== -1) {
            this.items[index].deleted = true;
            this.updateTotal();
        }
    }

    updateItem(id, item) {
        const index = this.getItemIndex(id)
        if (index !== -1) {
            this.items[index] = item;
            this.updateTotal();
        }
    }

    setDiscountValue(discount) {
        this.discount = discount;
        this.updateTotal();
    }

    setDiscountPct(pct) {
        this.discount_pct = pct;
        if (pct < 0.0 || pct > 100.0) {
            userNotification("Invalid value", "Discount percent must be between 0.0 and 100.0");
            this.discount_pct = Math.min(100.0, Math.max(0.0, pct));
        }
        this.updateTotal();
    }

    setReceivedAmount(amount) {
        this.received = amount;
        this.updateTotal();
    }

    updateTotal() {
        this.sub_total = 0;
        for (const item of this.items) {
            if (item.deleted) continue;
            item.updateTotal();
            this.sub_total += item.total;
        }
        if (this.discount_pct !== 0.0) {
            this.discount = this.sub_total * (this.discount_pct / 100.0);
        }
        this.gst_value = (this.sub_total - this.discount) * (this.gst_pct / 100.0);
        this.total = this.sub_total - this.discount + this.gst_value;
        this.amount_due = this.total - this.received;
        invoiceTotalsToUi(this);
    }

    async save() {
        if (this.items.length === 0) {
            userNotification("Incomplete", "Please add at least one item.");
            return false;
        }
        if (this.id === undefined) {
            this.id = await dbCreateInvoice(this);
        } else {
            await dbPutInvoice(this);
        }
        if (this.id !== -1) {
            return true;
        }
        return false;
    }

    updated() {
        this.last_change_date = new Date();
    }

    async emailSent() {
        this.email_sent_dates.push(new Date());
        await this.save();
    }

    hasBeenEmailed() {
        return this.email_sent_dates.length > 0;
    }

    emailIsCurrent() {
        if (this.email_sent_dates.length === 0) {
            return false;
        }
        return this.email_sent_dates[this.email_sent_dates.length - 1] > this.last_change_date;
    }

    async setDriveId(id) {
        this.drive_id = id;
        await this.save();
    }

    hasBeenUploaded() {
        return this.drive_id !== '';
    }

    async setUploadDateNow() {
        this.last_upload_date = new Date();
        await this.save();
    }

    uploadIsCurrent() {
        return this.last_upload_date > this.last_change_date;
    }


    serialise() {
        const data = {
            number: this.number,
            date: this.date.toISOString(),
            due_date: this.due_date?.toISOString() || null,
            client_id: this.client_id,
            vehicle_id: this.vehicle_id,
            odo: this.odo,
            items: this.items.map(item => item.serialise()),
            sub_total: this.sub_total,
            discount: this.discount,
            discount_pct: this.discount_pct,
            gst: this.gst_pct,
            received: this.received,
            total: this.total,
            notes: this.notes,
            deleted: this.deleted,
            email_sent_dates: this.email_sent_dates.map(date => date.toISOString()),
            drive_id: this.drive_id,
            last_upload_date: this.last_upload_date.toISOString(),
            last_change_date: this.last_change_date.toISOString(),
            created_date: this.created_date.toISOString(),
        };
        if (this.id !== undefined) {
            data.id = this.id;
        }
        return data;
    }

    deserialise(data) {
        this.id = data.id !== undefined ? data.id : undefined;
        this.number = data.number;
        this.date = new Date(data.date);
        this.due_date = data.due_date ? new Date(data.due_date) : null;
        this.client_id = data.client_id;
        this.vehicle_id = data.vehicle_id;
        this.odo = data.odo;
        for (const item of data.items) {
            const new_item = new Invoice_item();
            new_item.deserialise(item);
            this.items.push(new_item);
        }
        this.sub_total = data.sub_total;
        this.discount = data.discount;
        this.discount_pct = data.discount_pct || 0.0;
        this.gst_pct = data.gst;
        this.received = data.received;
        this.total = data.total;
        this.notes = data.notes;
        this.deleted = data.deleted;
        this.email_sent_dates = data.email_sent_dates?.map(dateStr => new Date(dateStr)) || [];
        this.drive_id = data.drive_id || '';
        this.last_upload_date = data.last_upload_date ? new Date(data.last_upload_date) : new Date();
        this.last_change_date = data.last_change_date ? new Date(data.last_change_date) : new Date();
        this.created_date = data.created_date ? new Date(data.created_date) : new Date();
        this.updateTotal();
    }
};
