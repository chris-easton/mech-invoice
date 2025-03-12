
/**
 * Navigation
 */
document.getElementById('nav-container').innerHTML = `
   <nav class="navbar navbar-expand-lg bg-body-tertiary">
       <div class="container-fluid">
           <a class="navbar-brand" href="#" id="nav-title">Invoicing</a>
           <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
               <span class="navbar-toggler-icon"></span>
           </button>
           <div class="collapse navbar-collapse" id="navbarSupportedContent">
               <ul class="navbar-nav me-auto mb-2 mb-lg-0" style="position:absolute;">
                   <li class="nav-item">
                       <a class="nav-link" href="#manage-invoices" data-testid="page-manage-invoices-link">Invoices</a>
                   </li>
                   <li class="nav-item">
                       <a class="nav-link" href="#manage-clients" data-testid="page-manage-clients-link">Clients</a>
                   </li>
                   <li class="nav-item">
                       <a class="nav-link" href="#manage-products" data-testid="page-manage-products-link">Products</a>
                   </li>
                   <li class="nav-item">
                   </li>
                   <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false" data-testid="tools-link">
                            Tools
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#settings" data-testid="page-settings-link">Settings</a>
                            <li><a class="dropdown-item" href="#reports" data-testid="page-reports-link">Reports</a></li>
                            <li><a class="dropdown-item" href="#backups" data-testid="page-backups-link">Backups</a></li>
                            <li><a class="dropdown-item" href="#about" data-testid="page-about-link">About</a></li>
                      </ul>
                   </li>
               </ul>
           </div>
       </div>
   </nav>
`;

const menuToggle = document.getElementById('navbarSupportedContent')
const bsCollapse = bootstrap.Collapse.getOrCreateInstance(menuToggle, {toggle: false})
const navLinks = document.querySelectorAll('.nav-item')
navLinks.forEach((l) => {
    l.addEventListener('click', () => {
        bsCollapse.toggle();
    })
})
document.getElementById('nav-title').addEventListener('click', () => { bsCollapse.toggle(); });

async function route() {
    const hash = window.location.hash || '#manage-invoices';

    if (settings.sla_accepted !== true) {
        window.location.hash = '#manage-invoices';
        return;
    }

    document.getElementById('page-manage-invoices').classList.add('hidden');
    document.getElementById('page-edit-invoice').classList.add('hidden');
    document.getElementById('page-manage-clients').classList.add('hidden');
    document.getElementById('page-edit-client').classList.add('hidden');
    document.getElementById('page-manage-products').classList.add('hidden');
    document.getElementById('page-edit-product').classList.add('hidden');
    document.getElementById('page-settings').classList.add('hidden');
    document.getElementById('page-reports').classList.add('hidden');
    document.getElementById('page-backups').classList.add('hidden');
    document.getElementById('page-about').classList.add('hidden');

    if(hash.startsWith('#manage-invoices')) {
        document.getElementById('page-manage-invoices').classList.remove('hidden');
        if (hash.includes('/')) {
            const page = parseInt(hash.split('/')[1], 10);
            await invoices.gotoPage(page);
        } else {
            await invoices.loadItemsList();
        }
    } else if(hash.startsWith('#create-invoice')) {
        document.getElementById('page-edit-invoice').classList.remove('hidden');
        edit_invoice.createNewItem();
    } else if(hash.startsWith('#edit-invoice/')) {
        document.getElementById('page-edit-invoice').classList.remove('hidden');
        const invoiceId = parseInt(hash.split('/')[1], 10);
        edit_invoice.editItem(invoiceId);
    }

    if(hash.startsWith('#manage-clients')) {
        document.getElementById('page-manage-clients').classList.remove('hidden');
        if (hash.includes('/')) {
            const page = parseInt(hash.split('/')[1], 10);
            await clients.gotoPage(page);
        } else {
            await clients.loadItemsList();
        }
    } else if(hash === '#create-client') {
        document.getElementById('page-edit-client').classList.remove('hidden');
        edit_client.createNewItem();
    } else if(hash.startsWith('#edit-client/')) {
        document.getElementById('page-edit-client').classList.remove('hidden');
        const clientId = parseInt(hash.split('/')[1], 10);
        edit_client.editItem(clientId);
    }

    if(hash.startsWith('#manage-products')) {
        document.getElementById('page-manage-products').classList.remove('hidden');
        if (hash.includes('/')) {
            const page = parseInt(hash.split('/')[1], 10);
            await products.gotoPage(page);
        } else {
            await products.loadItemsList();
        }
    } else if(hash === '#create-product') {
        document.getElementById('page-edit-product').classList.remove('hidden');
        edit_product.createNewItem();
    } else if(hash.startsWith('#edit-product/')) {
        document.getElementById('page-edit-product').classList.remove('hidden');
        const productId = parseInt(hash.split('/')[1], 10);
        edit_product.editItem(productId);
    }

    if(hash === '#settings') {
        settings.settingsToUI();
        document.getElementById('page-settings').classList.remove('hidden');
    }

    if(hash === '#reports') {
        document.getElementById('page-reports').classList.remove('hidden');
    }

    if(hash === '#backups') {
        document.getElementById('page-backups').classList.remove('hidden');
    }
 
    if(hash === '#about') {
        document.getElementById('page-about').classList.remove('hidden');
    }
}

