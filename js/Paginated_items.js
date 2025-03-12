
class Item_actions {
    delete = false;
    edit = false;
    select = false;
    print = false;
    email = false;
    upload = false;

    count() {
        var action_count = 0;
        if (this.edit)   { action_count++; }
        if (this.delete) { action_count++; }
        if (this.select) { action_count++; }
        if (this.print)  { action_count++; }
        if (this.email)  { action_count++; }
        if (this.upload) { action_count++; }
        return action_count;
    }

    any() {
        return this.delete || this.edit || this.select || this.print ||
            this.email || this.upload;
    }
}


class Paginated_items {

    prefix = '';
    id_prefix = '';
    selector = '';
    actions = null;
    items = [];
    item_name = '';
    items_name = '';
    page_size = 10;
    current_page = 1;
    items_container_is_setup = false;

    constructor(prefix, item, selector, actions) {
        this.prefix = prefix
        this.id_prefix = prefix + item;
        this.selector = selector;
        this.actions = actions;
        this.item_name = item;
        this.items_name = item + 's';

        const items_container_elem = document.getElementById(selector);
        if (items_container_elem) {
            this.setupItemsContainer();
        }
    }

    setupItemsContainer() {
        if (this.items_container_is_setup) {
            return;
        }
        this.items_container_is_setup = true;
        const items_container_elem = document.getElementById(this.selector);
        items_container_elem.innerHTML = `
            <div class="row-md-6 d-flex flex-row" style="padding-bottom:10px;">
                <input class="form-control me-2" id='${this.id_prefix}-search-term' type="search" placeholder='Search ${this.items_name}' aria-label="Search">
                <button type="button" class="btn btn-danger hidden" id='${this.id_prefix}-search-clear-btn' style="margin-right: 10px;">${BIN_ICON}</button>
                <button class="btn btn-outline-success" type="button" id='${this.id_prefix}-search-btn'>Search</button>
            </div>
            <div id='${this.id_prefix}-items-table'></div>
            <div class="flex-row text-center" style="margin-top:10px;">
                <button class="btn btn-secondary" id='${this.id_prefix}-prev-page-btn' disabled>Previous</button>
                <span id='${this.id_prefix}-page-info'></span>
                <button class="btn btn-secondary" id='${this.id_prefix}-next-page-btn' disabled>Next</button>
            </div>`;

        document.getElementById(`${this.id_prefix}-prev-page-btn`).addEventListener('click', () => {
            this.previousPage();
        });
        document.getElementById(`${this.id_prefix}-next-page-btn`).addEventListener('click', () => {
            this.nextPage();
        });
        document.getElementById(`${this.id_prefix}-search-btn`).addEventListener('click', () => {
            const val = document.getElementById(`${this.id_prefix}-search-term`).value;
            if (val !== '') {
                document.getElementById(`${this.id_prefix}-search-clear-btn`).classList.remove('hidden');
            }
            this.loadItemsList(val);
        });
        document.getElementById(`${this.id_prefix}-search-clear-btn`).addEventListener('click', () => {
            document.getElementById(`${this.id_prefix}-search-term`).value = '';
            document.getElementById(`${this.id_prefix}-search-clear-btn`).classList.add('hidden');
            this.loadItemsList('');
        });
    }

    searchFilter(db_item, filter) {
        console.log("Paginated_items: Default searchFilter() called");
        return false;
    }

    getTableHeading() {
        console.log("Paginated_items: Default getTableHeading() called");
        return "";
    }

    populateTableRow(tr, item) {
        console.log("Paginated_items: Default populateTableRow() called");
    }

    tableRowAppended(tr, item) {
    }

    onItemChosen(id) {
        console.log("Paginated_items: Default onItemChosen() called");
    }

    onPrintItem(id) {
        console.log("Paginated_items: Default onPrintItem() called");
    }

    onEmailItem(id, btn) {
        console.log("Paginated_items: Default onEmailItem() called");
    }

    onUploadItem(id, btn) {
        console.log("Paginated_items: Default onUploadItem() called");
    }

    sortItems(items=undefined) {
        console.log("Paginated_items: Default sortItems() called");
        return items;
    }

    async deleteItem(id) {
        userConfimation(`Delete ${this.item_name}?`).then(async (ans) => {
            if (ans) {
                console.log(`Delete ${this.item_name} Id=` + id);
                const item = await dbGetItemById(parseInt(id), this.items_name);
                if (!item) {
                    return;
                }
                item.deleted = true;
                const item_id = dbPutItem(item, this.items_name);
                if (item_id !== -1) {
                    console.log(`
                        Success: Delete ${this.item_name} Id=` + id);
                    this.loadItemsList();
                } else {
                    console.log(`Failed: Delete ${this.item_name} Id=` + id);
                }
            }
        });
    }

    getItemById(id) {
        for (const item of this.items) {
            if (item.id === id) {
                return item;
            }
            return null;
        }
    }


    async displayItemsPage() {
        const totalItems = this.items.length;
        const startIndex = (this.current_page - 1) * this.page_size;
        const endIndex = startIndex + this.page_size;
        const pageItems = this.items.slice(startIndex, endIndex);

        await this.populateItemsTable(pageItems);

        if (this.actions.edit) {
            document.querySelectorAll(`.edit-${this.item_name}-btn`).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const spinner = e.currentTarget.querySelector(`.edit-${this.item_name}-spin`);
                    const icon = e.currentTarget.querySelector(`.edit-${this.item_name}-icon`);
                    spinner.classList.remove('d-none');
                    icon.classList.add('d-none');
                    this.edit_item(id);
                    icon.classList.remove('d-none');
                    spinner.classList.add('d-none');
                });
            });
        }
        if (this.actions.delete) {
            document.querySelectorAll(`.delete-${this.item_name}-btn`).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const spinner = e.currentTarget.querySelector(`.edit-${this.item_name}-spin`);
                    const icon = e.currentTarget.querySelector(`.delete-${this.item_name}-icon`);
                    icon.classList.add('d-none');
                    spinner.classList.remove('d-none');
                    this.deleteItem(id);
                    icon.classList.remove('d-none');
                    spinner.classList.add('d-none');
                });
            });
        }
        if (this.actions.select) {
            document.querySelectorAll(`.select-${this.item_name}-btn`).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    this.onItemChosen(id);
                });
            });
        }
        if (this.actions.print) {
            document.querySelectorAll(`.print-${this.item_name}-btn`).forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const spinner = e.currentTarget.querySelector(`.print-${this.item_name}-spin`);
                    const icon = e.currentTarget.querySelector(`.print-${this.item_name}-icon`);
                    icon.classList.add('d-none');
                    spinner.classList.remove('d-none');
                    await this.onPrintItem(id);
                    icon.classList.remove('d-none');
                    spinner.classList.add('d-none');
                });
            });
        }
        if (this.actions.email) {
            document.querySelectorAll(`.email-${this.item_name}-btn`).forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const spinner = e.currentTarget.querySelector(`.email-${this.item_name}-spin`);
                    const icon = e.currentTarget.querySelector(`.email-${this.item_name}-icon`);
                    icon.classList.add('d-none');
                    spinner.classList.remove('d-none');
                    await this.onEmailItem(id, e.target);
                    icon.classList.remove('d-none');
                    spinner.classList.add('d-none');
                });
            });
        }
        if (this.actions.upload) {
            document.querySelectorAll(`.upload-${this.item_name}-btn`).forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const spinner = e.currentTarget.querySelector(`.upload-${this.item_name}-spin`);
                    const icon = e.currentTarget.querySelector(`.upload-${this.item_name}-icon`);
                    icon.classList.add('d-none');
                    spinner.classList.remove('d-none');
                    await this.onUploadItem(id, e.target);
                    icon.classList.remove('d-none');
                    spinner.classList.add('d-none');
                });
            });
        }

        // Update pagination controls
        const totalPages = Math.ceil(totalItems / this.page_size);
        document.getElementById(`${this.id_prefix}-page-info`).textContent = `Page ${this.current_page} of ${totalPages}`;
        document.getElementById(`${this.id_prefix}-prev-page-btn`).disabled = (this.current_page <= 1);
        document.getElementById(`${this.id_prefix}-next-page-btn`).disabled = (this.current_page >= totalPages);
    }

    haveTable() {
        return this.selector !== '';
    }

    async loadItemsList(searchTerm = '') {
        this.items = await this.findItems(searchTerm);
        if (this.haveTable()) {
            this.current_page = 1; // reset page when searching
            await this.displayItemsPage();
        }
    }

    async loadItemsListByIds(ids) {
        this.items = await this.findItemsById(ids);
        if (this.haveTable()) {
            this.current_page = 1; // reset page when searching
            await this.displayItemsPage();
        }
    }

    async findItems(searchTerm = '') {
        const items = await dbFindItems(this.items_name, async (item) => {
            return await this.searchFilter(item, searchTerm);
        });
        return this.sortItems(items);
    }

    async findItemsById(ids) {
        return await dbFindItems(this.items_name, (item) => {
            return [!item.deleted && ids.includes(item.id), item];
        });
    }

    edit_item(id) {
        console.log("Paginated_items.edit_item("+id+")");
        window.location.hash = `#edit-${this.item_name}/` + id;
    }

    createItemsTable() {
        if (!this.haveTable()) {
            return;
        }
        var table_heading = '';
        const action_item_count = this.actions.count();
        if (action_item_count !== 0) {
            table_heading = this.getTableHeading() + '<th scope="col" class="" style=""></th>';
        } else {
            table_heading = this.getTableHeading();
        }
        document.getElementById(`${this.id_prefix}-items-table`).innerHTML = `
            <table class="table table-striped" style="">
              <thead>
                <tr>
                  ${table_heading}
                </tr>
              </thead>
              </tbody>
              <tbody id='${this.id_prefix}-list-body'>
                  <!-- Populated by JS -->
              </tbody>
            </table>`;
    }

    async populateItemsTable(items) {
        if (!this.haveTable()) {
            return;
        }
        const tbody = document.getElementById(`${this.id_prefix}-list-body`);
        tbody.innerHTML = '';
        for (const item of items) {
            const tr = document.createElement('tr');
            await this.populateTableRow(tr, item);
            if (this.actions.any()) {
                var actions_html = '';
                if (this.actions.delete) {
                    actions_html += `<button data-id="${item.id}" type="button" class='btn btn-danger delete-${this.item_name}-btn' style="margin-left:6px;">
                        <span class="spinner-border spinner-border-sm d-none delete-${this.item_name}-spin" style="pointer-events:none;" aria-hidden="true"></span>
                        <span class="delete-${this.item_name}-icon">${BIN_ICON}</span>
                        </button>`;
                }
                if (this.actions.edit) {
                    actions_html += `<button data-id="${item.id}" type="button" class='btn btn-warning edit-btn edit-${this.item_name}-btn' style="margin-left:6px;">
                        <span class="spinner-border spinner-border-sm d-none edit-${this.item_name}-spin" style="pointer-events:none;" aria-hidden="true"></span>
                        <span class="edit-${this.item_name}-icon">${TOOL_ICON}</span>
                        </button>`;
                }
                if (this.actions.select) {
                    actions_html += `<button data-id="${item.id}" type="button" class='btn btn-warning select-${this.item_name}-btn' style="margin-left:6px;">
                        <span>${CHECK_ICON}</span>
                        </button>`;
                }
                if (this.actions.print) {
                    actions_html += `<button data-id="${item.id}" type="button" class='btn btn-success print-${this.item_name}-btn' style="margin-left:6px;">
                        <span class="spinner-border spinner-border-sm d-none print-${this.item_name}-spin" style="pointer-events:none;" aria-hidden="true"></span>
                        <span class="print-${this.item_name}-icon">${PRINT_ICON}</span>
                        </button>`;
                }
                if (this.actions.email) {
                    actions_html += `<button data-id="${item.id}" type="button" class='btn btn-primary position-relative email-${this.item_name}-btn' style="margin-left:6px;">
                        <span class="spinner-border spinner-border-sm d-none email-${this.item_name}-spin" style="pointer-events:none;" aria-hidden="true"></span>
                        <span class="email-${this.item_name}-icon">${EMAIL_ICON}</span>
                        <span class="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle d-none sent-indicator"><span class="text-white">${CHECK_ICON}</span></span>
                        </button>`;
                }
                if (this.actions.upload) {
                    actions_html += `<button data-id="${item.id}" type="button" class='btn btn-primary position-relative upload-${this.item_name}-btn' style="margin-left:6px;">
                        <span class="spinner-border spinner-border-sm d-none upload-${this.item_name}-spin" style="pointer-events:none;" aria-hidden="true"></span>
                        <span class="upload-${this.item_name}-icon">${CLOUD_ICON}</span>
                        <span class="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle d-none uploaded-indicator"><span class="text-white">${CHECK_ICON}</span></span>
                        </button>`;
                }
                tr.innerHTML += '<td class="text-end" style="">' + actions_html + '</td>';
            }
            tbody.appendChild(tr);
            this.tableRowAppended(tr, item);
        };
    }

    async previousPage() {
        if (!this.haveTable()) {
            return;
        }
        if(this.current_page > 1) {
            this.current_page--;
            await this.displayItemsPage();
        }
    }

    async nextPage() {
        if (!this.haveTable()) {
            return;
        }
        const totalItems = this.items.length;
        const totalPages = Math.ceil(totalItems / this.page_size);
        if(this.current_page < totalPages) {
            this.current_page++;
            await this.displayItemsPage();
        }
    }

    async gotoPage(page) {
        if (!this.haveTable()) {
            return;
        }
        const totalItems = this.items.length;
        const totalPages = Math.ceil(totalItems / this.page_size);
        if ((page > 0) && (page <= totalPages)) {
            this.current_page = page;
        }
        await this.displayItemsPage();
    }
}

