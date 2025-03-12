
class Edit_item {

    item_name = '';
    items_name = '';

    constructor(item_name) {
        this.item_name = item_name.toLowerCase();
        this.items_name = this.item_name + 's';
        this.addEditPageHeading();
    }

    addEditPageHeading() {
        document.getElementById(`page-edit-${this.item_name}-heading`).innerHTML = `
            <div class="d-flex" style="margin-bottom:10px;align-items:center;">
                <div style="margin-right:auto;">
                    <h1 id='edit-${this.item_name}-title'></h1>
                </div>
                <div style="padding-right:10px;">
                     <button type="button" class="btn btn-danger" id="cancel-${this.item_name}-btn">Cancel</button>
                </div>
                <div>
                     <button type="button" class="btn btn-primary" id="save-${this.item_name}-btn">Save ${this.item_name}</button>
                </div>
            </div>`;
        document.getElementById(`cancel-${this.item_name}-btn`).addEventListener('click', async () => {
            this.cancelEdit();
        });
        document.getElementById(`save-${this.item_name}-btn`).addEventListener('click', async () => {
            this.saveItem();
        });
    }

    createNewItem() {
        console.log("Edit_item: Default createNewItem() called.");
    }

    editItem(id) {
        console.log("Edit_item: Default editItem() called.");
    }

    cancelEdit() {
        console.log("Edit_item: Default cancelEdit() called.");
    }

    saveItem() {
        console.log("Edit_item: Default saveItem() called.");
    }
}

