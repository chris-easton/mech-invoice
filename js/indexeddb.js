
const DB_NAME = 'mechanic-invoices-db';
const INDEXEDDB_DB_VERSION = 3;

/**
 * Initialize IndexedDB
 */
function initDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(DB_NAME, INDEXEDDB_DB_VERSION);
    request.onupgradeneeded = function(e) {
      db = e.target.result;
      if(!db.objectStoreNames.contains('invoices')) {
        db.createObjectStore('invoices', {keyPath: 'id', autoIncrement:true});
      }
      if(!db.objectStoreNames.contains('clients')) {
        db.createObjectStore('clients', {keyPath: 'id', autoIncrement:true});
      }
      if(!db.objectStoreNames.contains('vehicles')) {
        db.createObjectStore('vehicles', {keyPath: 'id', autoIncrement:true});
      }
      if(!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', {keyPath: 'id', autoIncrement:true});
      }
      if(!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', {keyPath: 'id'});
      }
    };
    request.onsuccess = function(e) {
      db = e.target.result;
      db.onerror = (event) => {
          // Generic error handler for all errors targeted at this database's
          // requests!
          console.error(`Database error: ${event.target.error?.message}`);
      };
      resolve();
    };
    request.onerror = function() {
      reject("DB init failed");
    };
  });
}

function dbGetItemById(id, store_name) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store_name], 'readonly');
    const store = transaction.objectStore(store_name);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbCreateItem(item, store_name) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store_name], 'readwrite');
    const store = transaction.objectStore(store_name);
    console.log("Create new item in " + store_name + " DB");
    const addReq = store.add(item);
    addReq.onsuccess = function() {
      console.log("Success: Create new item in " + store_name + " DB");
      resolve(addReq.result);
    };
    addReq.onerror = function() {
      console.log("Failed: Create new item in " + store_name + " DB");
      resolve(-1);
    };
  });
}

function dbPutItem(item, store_name) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store_name], 'readwrite');
    const store = transaction.objectStore(store_name);
    console.log("Update existing item in " + store_name + " DB");
    const putReq = store.put(item);
    putReq.onsuccess = function() {
        console.log("Success: Update existing item in " + store_name + " DB");
        resolve(item.id);
    };
    putReq.onerror = function() {
        console.log("Failed: Update existing item in " + store_name + " DB");
        resolve(-1);
    };
  });
}

function dbFindItems(store, filter) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([store], 'readonly');
        const itemsStore = transaction.objectStore(store);
        const request = itemsStore.getAll();
        request.onsuccess = async () => {
            let items = request.result || [];
            let filtered_items = [];
            for (const item of items) {
                const [pass, obj] = await filter(item);
                if (pass) {
                    filtered_items.push(obj);
                }
            }
            resolve(filtered_items);
        };
        request.onerror = async () => {
            console.log("Failed to load items from " + store + " DB");
            reject([]);
        };
    });
}

async function dbGetProductById(id) {
    const data = await dbGetItemById(id, 'products');
    if (!data) {
        console.log("dbGetProductById("+id+") error: product not found");
        return null;
    }
    const product = new Product();
    product.deserialise(data);
    return product;
}

async function dbGetClientById(id) {
    const data = await dbGetItemById(id, 'clients');
    if (!data) {
        console.log("dbGetClientById("+id+") error: client not found");
        return null;
    }
    const client = new Client()
    client.deserialise(data);
    return client;
}

async function dbGetVehicleById(id) {
    if (id === -1) {
        return null;
    }
    const data = await dbGetItemById(id, 'vehicles');
    if (!data) {
        console.log("dbGetVehicleById("+id+") error: vehicle not found");
        return null;
    }
    const vehicle = new Vehicle();
    vehicle.deserialise(data);
    return vehicle;
}

async function dbGetInvoiceById(id) {
    const data = await dbGetItemById(id, 'invoices');
    if (!data) {
        console.log("dbGetInvoiceById("+id+") error: invoice not found");
        return null;
    }
    const invoice = new Invoice();
    invoice.deserialise(data);
    return invoice;
}

function dbCreateProduct(product) {
    const data = product.serialise();
    return dbCreateItem(data, 'products');
}

function dbCreateClient(client) {
    const data = client.serialise();
    return dbCreateItem(data, 'clients');
}

function dbCreateVehicle(vehicle) {
    const data = vehicle.serialise();
    return dbCreateItem(data, 'vehicles');
}

function dbCreateInvoice(invoice) {
    const data = invoice.serialise();
    const id = dbCreateItem(data, 'invoices');
    if (id !== -1) {
        settings.incrementNextInvoiceNumber();
    }
    return id;
}

function dbPutProduct(product) {
    const data = product.serialise();
    return dbPutItem(data, 'products');
}

function dbPutClient(client) {
    const data = client.serialise();
    return dbPutItem(data, 'clients');
}

function dbPutVehicle(vehicle) {
    const data = vehicle.serialise();
    return dbPutItem(data, 'vehicles');
}

function dbPutInvoice(invoice) {
    const data = invoice.serialise();
    return dbPutItem(data, 'invoices');
}

function getIndexedDBDataRaw(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const backupData = {};

            // Iterate over each object store in the database
            const transaction = db.transaction(db.objectStoreNames, 'readonly');
            transaction.oncomplete = () => {
                resolve(backupData);
            };

            transaction.onerror = (err) => {
                reject(`Error during export: ${err}`);
            };

            // Collect data from each object store
            Array.from(db.objectStoreNames).forEach((storeName) => {
                const store = transaction.objectStore(storeName);
                const allDataRequest = store.getAll();
                allDataRequest.onsuccess = () => {
                    backupData[storeName] = allDataRequest.result;
                };
            });
        };

        request.onerror = (err) => {
            reject(`indexeddb: Error opening database for backup: ${err.target.error}`);
        };
    });
}


async function getIndexedDBDataJson(dbName) {
    return getIndexedDBDataRaw(dbName).then(rawData => {
        const currentDate = new Date().toISOString();
        const backupData = {
            db_version: INDEXEDDB_DB_VERSION,
            app_version: '@VERSION@',
            date: currentDate,
            data: rawData
        };
        return JSON.stringify(backupData,null,2);
    });
}

async function createLocalIndexedDBBackup(dbName) {
    getIndexedDBDataJson(DB_NAME).then((file) => {
        const currentDate = new Date().toISOString().replace(/[:\-T]/g, '_').split('.')[0]; // Formats to YYYY_MM_DD_HH_MM_SS
        const backupKey = `backup_${dbName}_${currentDate}`;
        try {
            localStorage.setItem(backupKey, file);
            console.log(`indexeddb: Successfully created local backup: ${backupKey}`);
            userNotification("Success", "Local backup created successfully");
            manageLocalIndexedDBBackups(dbName);
        } catch (error) {
            console.log(`indexeddb: Failed to set backup in localStorage. Error: ${error}`);
            userNotification("Error", "Failed to create backup");
        }
    }).catch((error) => {
        console.log(`indexeddb: Failed to get DB data. Error: ${error}`);
        userNotification("Error", "Failed to create backup");
    });
}


function manageLocalIndexedDBBackups(dbName) {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(`backup_${dbName}_`));
    const maxBackups = 5;
    if (keys.length > maxBackups) {
        keys.sort(); // Sort keys ( chronological order )
        while (keys.length > maxBackups) {
            const backup_to_delete = keys.shift(); // Remove the oldest backup
            localStorage.removeItem(backup_to_delete);
            console.log(`indexeddb: Deleted oldest backup: ${backup_to_delete}`);
        }
    }
}


function importIndexedDB(dbName, data) {
  return new Promise((resolve, reject) => {

      const request = indexedDB.open(dbName);

      request.onsuccess = (event) => {
        const db = event.target.result;

        // Check if object stores exist, and create them if necessary
        const transaction = db.transaction(db.objectStoreNames, 'readwrite');
        transaction.oncomplete = () => {
          resolve('Import completed successfully!');
        };

        transaction.onerror = (err) => {
          reject(`Error during import: ${err}`);
        };

        // Ensure object stores exist
        Object.keys(data).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log(`Object store "${storeName}" does not exist. Creating it.`);
            // Create the object store if it doesn't exist
            // You may need to handle versioning and upgrading the schema here
            const store = transaction.objectStore(storeName, { autoIncrement: true });
            data[storeName].forEach((item) => {
              store.put(item); // Insert the data
            });
          } else {
            // If the store exists, just insert data
            const store = transaction.objectStore(storeName);
            data[storeName].forEach((item) => {
              store.put(item); // Insert the data
            });
          }
        });
      };

      request.onerror = (err) => {
        reject(`Error opening database: ${err}`);
      };
    });
}


function backupsSearchFilter(item, searchTerm) {
    const file_name = item.name;
    const file_type = item.mimeType;
    var match = file_type === 'application/json';
    if (searchTerm.trim().length > 0) {
        match &= file_name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return [match, item];
}

function backupsSortItems(items) {
    return items;
}

function backupsTableHeading() {
    return `<th scope="col">Filename</th>`;
}

function backupsPopulateTableRow(tr, file) {
    tr.innerHTML = `<td>${file.name}</td>`;
}

async function findBackupFiles(searchTerm = '') {
    if (this.files === undefined || this.files.length === 0) {
        this.files = await getDbBackupList();
    }
    const matches = [];
    for (const file of this.files) {
        const [match, item] = this.searchFilter(file, searchTerm);
        if (match) {
            matches.push(file);
        }
    }
    return matches;
}

async function findBackupFilesById(ids) {
    if (this.files === undefined || this.files.length === 0) {
        this.files = await getDbBackupList();
    }
    const matches = [];
    for (const file of this.files) {
        if (ids.includes(file.id)) {
            matches.push(file);
        }
    }
    return matches;
}

async function onBackupChosen(id) {
    console.log("onBackupChosen('"+id+"')");
    document.getElementById('restore-drive-backup-spin').classList.remove('d-none');
    const raw = await downloadFile(id);
    const data = JSON.parse(raw);
    await importIndexedDB(DB_NAME, data);
    settings.loadSettings(true);
    document.getElementById('restore-drive-backup-spin').classList.add('d-none');
    userNotification("Success", "Backup restored");
}

async function restoreFromBackup() {

    const backup_files = new Paginated_items('choose-', 'backup', 'choose-backup-table', false, false, true);
    backup_files.findItems = findBackupFiles;
    backup_files.findItemsById = findBackupFilesById;
    backup_files.searchFilter = backupsSearchFilter;
    backup_files.sortItems = backupsSortItems;
    backup_files.getTableHeading = backupsTableHeading;
    backup_files.populateTableRow = backupsPopulateTableRow;

    const backup_chooser = new Item_chooser('backup', backup_files);
    backup_chooser.callback = onBackupChosen;
    backup_chooser.init();

    await backup_chooser.showAll();

    document.getElementById('restore-drive-backup-spin').classList.add('d-none');
}

async function downloadDbBackup() {
    getIndexedDBDataJson(DB_NAME).then((file) => {
        // Convert the export data into a Blob (JSON format)
        const blob = new Blob([file], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        // Create a download link for the backup
        const a = document.createElement('a');
        a.href = url;
        a.download = 'indexedDB-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        console.log("File backup created successfully");
    }).catch((error) => {
        console.log("Failed to create backup, error:");
        console.log(error);
        userNotification("Error", "Failed to create backup");
    });
}

function backupsUpdateGoogleSignInStatus(isSignedIn) {
    if (isSignedIn) {
        document.getElementById('create-drive-backup-btn').disabled = false;
        document.getElementById('restore-drive-backup-btn').disabled = false;
    } else {
        document.getElementById('create-drive-backup-btn').disabled = true;
        document.getElementById('restore-drive-backup-btn').disabled = true;
        document.getElementById('create-drive-backup-spin').classList.add('d-none');
        document.getElementById('restore-drive-backup-spin').classList.add('d-none');
    }
}

document.getElementById('create-drive-backup-btn').addEventListener('click', async () => {
    document.getElementById('create-drive-backup-spin').classList.remove('d-none');
    getIndexedDBDataJson(DB_NAME).then(async (file) => {
        await uploadDbBackup(file);
        document.getElementById('create-drive-backup-spin').classList.add('d-none');
        console.log("Drive backup created successfully");
        userNotification("Success", "Backup saved");
    }).catch((error) => {
        console.log("Failed to create backup, error:");
        console.log(error);
        userNotification("Error", "Failed to create backup");
    });
});

document.getElementById('restore-drive-backup-btn').addEventListener('click', async () => {
    document.getElementById('restore-drive-backup-spin').classList.remove('d-none');
    await restoreFromBackup();
});


document.getElementById('create-file-backup-btn').addEventListener('click', async () => {
    await downloadDbBackup();
});

document.getElementById('create-local-backup-btn').addEventListener('click', async () => {
    await createLocalIndexedDBBackup(DB_NAME);
});

document.getElementById('import-file-backup-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    importIndexedDB(DB_NAME, file).then((message) => {
        console.log(message);
        userNotification("Success", message);
    }).catch((error) => {
        console.error(error);
        userNotification("Error", "Failed to import backup");
    });
  }
});

