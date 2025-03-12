

document.getElementById('settings-email-help-btn').addEventListener('click', showEmailSettingsHelp);

let email_variables = [
    '%CLIENT_NAME%',
    '%CLIENT_SURNAME%',
    '%INVOICE_NO%',
    '%INVOICE_DATE%',
    '%INVOICE_AMOUNT%',
    '%VENDOR_NAME%',
    '%VENDOR_PHONE%',
    '%VENDOR_EMAIL%',
    '%VENDOR_ADDRESS%',
    '%VENDOR_ABN%',
];

const default_email_subject = 'Your Invoice %INVOICE_NO%';
const default_email_body = 'Hello %CLIENT_NAME%,\n\nPlease find attached your invoice.\n\nInvoice Number: %INVOICE_NO%\nIssued on: %INVOICE_DATE%\nAmount: %INVOICE_AMOUNT%\n\nKind regards,\n%VENDOR_NAME%\n\n%VENDOR_NAME%\n%VENDOR_PHONE%\n%VENDOR_EMAIL%\n%VENDOR_ADDRESS%\nABN: %VENDOR_ABN%';

function showEmailSettingsHelp() {
    var msg = `Type in the email subject and body as it should appear on the email.`;
    msg += `<br>Insert the variables below in the text where where needed.`;
    msg += `<br><br>The following variables can be used:`;
    msg += '<div style="padding:5px 0px 5px 15px;">';
    var first = true;
    for (const variable of email_variables) {
        if (first) {
            first = false;
        } else {
            msg += '<br>';
        }
        msg += variable;
    }
    msg += '</div>';

    userNotification('Email Settings', msg, true);
}


function replaceEmailVars(text, invoice, client) {
    return text
        .replace(/%CLIENT_NAME%/g, client.contact.name)
        .replace(/%CLIENT_SURNAME%/g, client.contact.surname)
        .replace(/%INVOICE_NO%/g, invoice.number)
        .replace(/%INVOICE_DATE%/g, new Date(invoice.date).toLocaleDateString())
        .replace(/%INVOICE_AMOUNT%/g, '$' + invoice.amount_due.toFixed(2))
        .replace(/%VENDOR_NAME%/g, settings.vendor.name)
        .replace(/%VENDOR_PHONE%/g, settings.vendor.phone)
        .replace(/%VENDOR_EMAIL%/g, settings.vendor.email)
        .replace(/%VENDOR_ADDRESS%/g, generateContactAddress(settings.vendor))
        .replace(/%VENDOR_ABN%/g, settings.vendor_abn);
}


// This function just opens the user's mail client
async function sendMailTo(to, subject, body_text) {

    const subject_uri = encodeURIComponent(subject);
    const body_uri = encodeURIComponent(body_text);

    // "mailto:" can include subject & body, but cannot directly attach files
    const mailtoLink = `mailto:${encodeURIComponent(to || '')}?subject=${subject_uri}&body=${body_uri}`;
    window.open(mailtoLink, "_blank");
}


function createMimeMessage(toEmail, subject, messageText, invoice_name, invoice_base64) {
    // Basic MIME fields
    const boundary = "boundary999";
    const message = [
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        `MIME-Version: 1.0`,
        `From: me`, // 'me' means the authenticated user
        `To: ${toEmail}`,
        `Subject: ${subject}`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        messageText,
        `--${boundary}`,
        // Now the attachment as base64
        `Content-Type: application/pdf; name="${invoice_name}"`,
        `MIME-Version: 1.0`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${invoice_name}"`,
        ``,
        invoice_base64, // the base64-encoded PDF content
        `--${boundary}--`
    ].join("\r\n");

    // Then base64-encode the entire MIME message again
    return btoa(message)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


async function sendInvoiceEmail(id) {

    console.log("sendInvoiceEmail("+id+")");

    const invoice = await dbGetInvoiceById(id);
    if (!invoice) {
        console.log("sendInvoiceEmail(" + id + ") error: invoice not found!");
        return false;
    }
    const client = await dbGetClientById(invoice.client_id);
    if (!client) {
        console.log("sendInvoiceEmail(" + id + ") error: client not found!");
        return false;
    }

    if (!client.contact.email) {
        userNotification("Error", "No email address for client");
        return false;
    }

    const to = client.contact.email;
    const subject = replaceEmailVars(settings.email_subject ? settings.email_subject : default_email_subject, invoice, client);
    const body_text = replaceEmailVars(settings.email_body ? settings.email_body : default_email_body, invoice, client);

    gapiEnsureTokenValid();

    if (!gapi_token) {
        const use_mailto = await userConfimation('GMail not authorised. Use default mail?');
        if (use_mailto) {
            await sendMailTo(to, subject, body_text);
        }
        return false;
    }

    const [invoice_base64, invoice_filename] = await getInvoiceBase64(id);

    const raw_message = createMimeMessage(to, subject, body_text, invoice_filename, invoice_base64);

    try {
        const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${gapi_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: raw_message })
        });

        if (!resp.ok) {
            throw new Error(`Gmail API error: ${resp.status} ${resp.statusText}`);
        }

        const data = await resp.json();
        await invoice.emailSent();
        console.log('Email sent!', data);
        userNotification('Success', 'Email sent successfully!');
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        userNotification('Failed', 'Failed to send email.');
    }
    return false;
}


