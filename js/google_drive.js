
async function getOrCreateFolder(folder) {
    var folderId;
    try {
        folderId = await getOrCreateFolderIdByPathPrivate(settings.google_drive_path + "/" + folder);
    } catch (error) {
        console.error('Error creating folder in Google Drive:', error);
        return ['', `Failed to create Google Drive folder: "${settings.google_drive_path}/${folder}"`];
    }
    return folderId;
}

async function getOrCreateFolderIdByPathPrivate(path) {
    // Split the path, e.g. "SomeFolder/SubFolder" -> ["SomeFolder", "SubFolder"]
    const parts = path.split('/').filter(Boolean);

    // Start from the root ("My Drive"), or 'root' keyword in Drive
    let currentParentId = 'root';

    for (const folderName of parts) {
        // 1) Check if a folder named `folderName` exists under the current parent
        const folderId = await findFolderIdByNameAndParent(folderName, currentParentId);
        if (folderId) {
            // Found an existing folder
            currentParentId = folderId;
        } else {
            // Create a new folder in the current parent
            currentParentId = await createFolder(folderName, currentParentId);
        }
    }

    // After the loop, currentParentId is the innermost folder ID
    return currentParentId;
}

// Helper to find a folder by name under a given parent
async function findFolderIdByNameAndParent(folderName, parentId) {
    // mimeType='application/vnd.google-apps.folder'
    // name='folderName'
    // parents in 'parentId'
    const queryParts = [
        `mimeType='application/vnd.google-apps.folder'`,
        `name='${folderName}'`,
        `'${parentId}' in parents`,
        `trashed=false`
    ];
    const query = queryParts.join(' and ');

    const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
        headers: {
            Authorization: `Bearer ${gapi_token}`
        }
    });

    if (!resp.ok) {
        throw new Error(`Error searching for folder: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json();
    if (data.files && data.files.length > 0) {
        // Return the first match
        return data.files[0].id;
    }
    // No folder found
    return null;
}

// Helper to create a folder under a given parent
async function createFolder(folderName, parentId) {
    const body = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };

    const resp = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${gapi_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!resp.ok) {
        throw new Error(`Error creating folder: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json();
    return data.id; // newly created folder ID
}

async function getFileList(folder) {
    const folderId = await getOrCreateFolder(folder);
    // Example query: all files with that folderId as a parent, not trashed
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id%2Cname%2CmimeType)`;

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${gapi_token}`,
      },
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => {});
      console.error('Error listing files:', err || resp.statusText);
      throw new Error(`List files failed: ${resp.statusText}`);
    }

    const data = await resp.json();
    // data.files is an array of { id, name, mimeType }
    return data.files || [];
}

async function uploadInvoice(id) {
    console.log('uploadInvoice('+id+')');
    const invoice = await dbGetInvoiceById(id);
    const [fileContent, fileName] = await getInvoiceBase64(id);
    if (!fileContent || !fileName) {
        userNotification('Failed', `Failed to generate invoice. ID: "${id}"`);
        return false;
    }
    var errorMsg = ''
    if (invoice.drive_id !== '') {
        errorMsg = await updateFile(invoice.drive_id, '', fileContent, 'application/pdf');
    }
    if (invoice.drive_id === '' || errorMsg !== '') {
        [fileId, errorMsg] = await uploadFile("invoices", fileName, fileContent, 'application/pdf');
        await invoice.setDriveId(fileId);
    }
    if (errorMsg !== '') {
        const download = await userConfimation(errorMsg + ' Download pdf?');
        if (download) {
            await downloadInvoice(id);
        }
        return false;
    }
    await invoice.setUploadDateNow();
    return true;
}

async function uploadDbBackup(file) {
    console.log('uploadDbBackup(..)');
    const dateStr = formatDate(new Date()).replace(' ', '-');
    const fileName = `backup-${dateStr}.json`;
    const file_base64 = btoa(file);
    [fileId, errorMsg] = await uploadFile('backup', fileName , file_base64, 'application/json');
    if (errorMsg !== '') {
        const download = await userConfimation(errorMsg + ' Download backup?');
        if (download) {
            await downloadDbBackup(id);
        }
        return false;
    }
    return true;
}

async function getDbBackupList() {
    const list = await getFileList('backup');
    return list;
}


async function uploadFile(folder, fileName, fileContent, contentType) {

    if (settings.google_drive_path === '') {
        console.error('uploadFile error: google_drive_path not set');
        return ['', 'Google Drive path not set. See settings.'];
    }

    gapiEnsureTokenValid();

    if (!gapi_token) {
        console.error('uploadFile error: not authorised');
        return ['', 'Google Drive not authorised.'];
    }

    const folderId = await getOrCreateFolder(folder);

    const metadata = {
        name: fileName,
        parents: [folderId],  // place file in target folder
    };

    const boundary = 'myBoundary123';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        fileContent +
        closeDelimiter;

    try {
        const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${gapi_token}`,
                'Content-Type': 'multipart/related; boundary=' + boundary,
            },
            body: multipartRequestBody,
        });
        if (!resp.ok) {
            console.error(`uploadFile error: Drive API error: ${resp.status} ${resp.statusText}`);
            return ['', `Drive API error: ${resp.status} ${resp.statusText}`];
        }
        const data = await resp.json();
        console.log('File uploaded:', data);
        userNotification('Success', `File ${fileName} uploaded!`);
        return [data.id, ''];
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        return ['', 'Failed to upload file.'];
    }
}


async function updateFile(fileId, newFileName, newContent, contentType) {

    gapiEnsureTokenValid();

    if (!gapi_token) {
        console.error('uploadFile error: not authorised');
        return 'Google Drive not authorised.';
    }

    // Build metadata. You can omit `name` if you want to keep the old filename.
    const metadata = {
    };
    if (newFileName) {
        metadata.name = newFileName;
    }

    // Build multipart/related body
    const boundary = 'boundary123';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' + 
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        newContent +
        closeDelimiter;

    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;

    const resp = await fetch(url, {
        method: 'PATCH', // or 'PUT'
        headers: {
            'Authorization': `Bearer ${gapi_token}`,
            'Content-Type': 'multipart/related; boundary=' + boundary,
        },
        body: multipartRequestBody,
    });

    const data = await resp.json();

    if (!resp.ok) {
        console.error(`updateFile error: Drive API error: ${resp.status} ${resp.statusText}`);
        console.log('Details:', data);
        return `Drive API update error: ${resp.status} ${resp.statusText}`;
    }

    userNotification('Success', `File updated!`);
    return '';
}


async function downloadFile(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${gapi_token}`,
    },
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => {});
    console.error('Error downloading file:', errText || resp.statusText);
    throw new Error(`Download failed: ${resp.statusText}`);
  }

  // The response body is the raw file data (JSON string in our case)
  return resp.text();
}
