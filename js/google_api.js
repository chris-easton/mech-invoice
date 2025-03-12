
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
];

// Ask for permission to send emails via Gmail and to upload files to Drive
const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.file';

let gapi_inited = false;
let gapi_token_client;
let gapi_token = null;
let gapi_token_expiry_time = 0;


document.getElementById('settings-gapi-client-id').addEventListener(
    "input", function() {
        const gapi_client_id =
            document.getElementById('settings-gapi-client-id').value;
        settings.gapi_client_id = gapi_client_id;
        gapiInitClient();
    });


document.getElementById('gapi-signin-btn').addEventListener(
    "click", function() {
        gapiHandleSignIn();
    });


function gapiInitClient() {
    if (settings.gapi_client_id !== '' && gapi_inited == false) {
        updateSigninStatus(false);
        gapi_token_client = google.accounts.oauth2.initTokenClient({
            client_id: settings.gapi_client_id,
            scope: SCOPES,
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    console.error('Token error:', tokenResponse);
                    updateSigninStatus(false);
                    return;
                }
                gapi_token = tokenResponse.access_token;
                gapi_token_expiry_time = Date.now() + tokenResponse.expires_in * 1000;
                updateSigninStatus(true);
            },
        });
        gapi_inited = true;
    }
}

async function gapiEnsureTokenValid() {
    if (gapi_inited && (!gapi_token || (Date.now() + 60000 > gapi_token_expiry_time))) {
        try {
            await new Promise((resolve, reject) => {
                gapi_token_client.callback = (tokenResponse) => {
                    if (tokenResponse.error) {
                        return reject(tokenResponse);
                    }
                    gapi_token = tokenResponse.access_token;
                    gapi_token_expiry_time = Date.now() + tokenResponse.expires_in * 1000;
                    updateSigninStatus(true);
                    resolve();
                };
                gapi_token_client.requestAccessToken({ prompt: '' });
            });
        } catch (err) {
            console.warn('Silent refresh failed, showing consent prompt...');
            await new Promise((resolve, reject) => {
                gapi_token_client.callback = (tokenResponse) => {
                    if (tokenResponse.error) {
                        updateSigninStatus(false);
                        userNotification("Failed", "Failed to acquire access token");
                        return reject(tokenResponse);
                    }
                    gapi_token = tokenResponse.access_token;
                    gapi_token_expiry_time = Date.now() + tokenResponse.expires_in * 1000;
                    updateSigninStatus(true);
                    resolve();
                };
                gapi_token_client.requestAccessToken({ prompt: 'consent' });
            });
        }
    }
}

function updateSigninStatus(isSignedIn) {
  const signInBtn = document.getElementById('gapi-signin-btn');

  if (isSignedIn) {
    console.log("App authenticated");
    console.log("Token expires: ");
    console.log(new Date(gapi_token_expiry_time).toLocaleTimeString());
    signInBtn.textContent = 'Authorised';
    signInBtn.disabled = true;
    signInBtn.classList.add('btn-success');
    signInBtn.classList.remove('btn-primary');
  } else {
    gapi_token = null;
    console.log("App NOT authenticated");
    signInBtn.textContent = 'Authorise';
    signInBtn.disabled = false;
    signInBtn.classList.add('btn-primary');
    signInBtn.classList.remove('btn-success');
  }

    backupsUpdateGoogleSignInStatus(isSignedIn);
}

// Sign in the user
function gapiHandleSignIn() {
    gapi_token_client.requestAccessToken({promt: 'consent'});
}

