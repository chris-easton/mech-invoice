
class Item_chooser {

    item_name = '';
    item_list = null;
    modal = null;

    constructor(item_name, paginated_items=null) {
        this.item_name = item_name;
        const modal_container = document.createElement('div');
        modal_container.innerHTML = `
            <div class="modal modal-lg" id="modal-choose-${this.item_name}" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Choose ${this.item_name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <div id='choose-${this.item_name}-table'></div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  </div>
                </div>
              </div>
            </div>`;
        document.body.appendChild(modal_container);
        if (paginated_items !== null) {
            this.item_list = paginated_items;
        } else {
            const item_actions = new Item_actions();
            item_actions.select = true;
            this.item_list = new Paginated_items('choose-', item_name, `choose-${item_name}-table`, item_actions);
        }
        this.item_list.onItemChosen = (id) => {this.onItemChosen(id);};
        const modal_element = document.getElementById(`modal-choose-${this.item_name}`);
        this.modal = new bootstrap.Modal(modal_element);
    }

    init() {
        this.item_list.setupItemsContainer();
        this.item_list.createItemsTable();
    }

    async showAll() {
        await this.item_list.loadItemsList();
        this.modal.show();
    }

    async showFiltered(searchTerm = '') {
        await this.item_list.loadItemsList(searchTerm);
        this.modal.show();
    }

    async showFilteredById(searchTerm = '') {
        await this.item_list.loadItemsListByIds(searchTerm);
        this.modal.show();
    }

    callback(id) {
    }

    onItemChosen(id) {
        this.callback(id);
        this.modal.hide();
    }
}

