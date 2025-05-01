
class Vehicle {
    make_model = '';
    rego = '';
    notes = '';
    deleted = false;
    date = new Date();

    async save() {
        this.date = new Date();
        if (this.id !== undefined) {
            await dbPutVehicle(this);
        } else {
            this.id = await dbCreateVehicle(this);
        }
        return this.id;
    }

    serialise() {
        const data = {
            make_model: this.make_model,
            rego: this.rego,
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
        this.make_model = data.make_model;
        this.rego = data.rego;
        this.notes = data.notes;
        this.deleted = data.deleted;
        this.date = data.date ? new Date(data.date) : new Date();
    }
}

function resetVehicleUi(selector) {
    const element = document.querySelector(selector);
    element.querySelector('.vehicle-rego').value = '';
    element.querySelector('.vehicle-make-model').value = '';
    element.querySelector('.vehicle-odometer').value = '';
    element.removeAttribute('data-id');
}

function vehicleToUi(vehicle, odo=null) {
    const element = document.getElementById('page-edit-invoice').querySelector('.vehicle-info');
    element.setAttribute('data-id', vehicle.id);
    element.querySelector('.vehicle-rego').value = vehicle.rego;
    element.querySelector('.vehicle-make-model').value = vehicle.make_model;
    if (odo) {
        element.querySelector('.vehicle-odometer').value = odo;
    }
}
