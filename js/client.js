
class Client {
    contact = new Contact_info();
    vehicle_ids = [];
    notes = '';
    deleted = false;
    date = new Date();

    async addVehicle(id) {
        if (!this.vehicle_ids.includes(id)) {
            this.vehicle_ids.push(id);
        }
        this.save();
    }

    removeVehicle(id) {
        const index = this.vehicle_ids.indexOf(id);
        if (index > -1) {
            this.vehicle_ids.splice(index, 1);
        }
    }

    async save() {
        if (this.id !== undefined) {
            await dbPutClient(this);
        } else {
            this.id = await dbCreateClient(this);
        }
        return this.id;
    }

    serialise() {
        const data = {
            contact: this.contact.serialise(),
            vehicle_ids: this.vehicle_ids,
            notes: this.notes,
            deleted: this.deleted,
            date: this.date.toISOString(),
        };
        if (this.id !== undefined) {
            data.id = this.id;
        }
        return data;
    }

    deserialise(data) {
        this.id = data.id !== undefined ? data.id : undefined;
        this.contact.deserialise(data.contact);
        this.vehicle_ids = data.vehicle_ids;
        this.notes = data.notes;
        this.deleted = data.deleted;
        this.date = data.date ? new Date(data.date) : new Date();
    }
}

function uiToClient(client, selector) {
    uiToContact(client.contact, selector);
}

function clientToUi(client, selector) {
    contactToUi(client.contact, selector, client.id);
}
