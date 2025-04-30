
class Product {
    name = '';
    description = '';
    price = 0.0;
    notes = '';
    deleted = false;
    date = new Date();

    async save() {
        this.date = new Date();
        if (this.id !== undefined) {
            await dbPutProduct(this);
        } else {
            // This product was created manually, check if it matches an existing
            // product. If not create a new one.
            const db_products = await dbFindItems('products', (db_item) => {
                const db_product = new Product();
                db_product.deserialise(db_item);
                const match = productsMatch(db_product, this);
                return [!db_product.deleted && match, db_product];
            });
            if (db_products.length > 0) {
                this.id = db_products[0].id;
                await dbPutProduct(this);
            } else {
                this.id = await dbCreateProduct(this);
            }
        }
        return this.id;
    }

    serialise() {
        const data = {
            name: this.name,
            description: this.description,
            price: this.price,
            notes: this.notes,
            deleted: this.deleted,
            date: this.date,
        };
        if (this.id !== undefined) {
            data.id = this.id;
        }
        return data;
    }

    deserialise(data) {
        this.id = data.id !== undefined ? data.id : undefined;
        this.name = data.name;
        this.description = data.description;
        this.price = data.price;
        this.notes = data.notes;
        this.deleted = data.deleted;
        this.date = data.date ? new Date(data.date) : new Date();
    }
}
