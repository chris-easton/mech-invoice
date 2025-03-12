

function generateContactAddress(contact) {
    var contact_address_string = '';
    if (contact.address !== '') {
        contact_address_string += contact.address;
    }
    if (contact.city !== '') {
        if (contact_address_string !== '') contact_address_string += ', ';
        contact_address_string += contact.city;
    }
    if (contact.postcode !== '') {
        if (contact_address_string !== '') contact_address_string += ', ';
        contact_address_string += contact.postcode;
    }
    return contact_address_string;
}

function generateVendorInfo(invoice) {
    var contact_info = [];
    var item_count = 0;
    if (settings.vendor.phone !== '') {
        contact_info.push([
            { image:'call_icon.png', width:10 },
            { text: ` ${settings.vendor.phone}`}
        ]);
        item_count++;
    }
    if (settings.vendor.email !== '') {
        contact_info.push([
            { image:'mail_icon.png', width:10 },
            { text: ` ${settings.vendor.email}` }
        ]);
        item_count++;
    }
    var contact_address_string = generateContactAddress(settings.vendor);
    if (contact_address_string !== '') {
        contact_info.push([
            { image:'location_icon.png', width:10 },
            { text: ` ${contact_address_string}` }
        ]);
        item_count++;
    }
    if (settings.vendor_abn !== '') {
        contact_info.push([
            { text: '' },
            { text: `ABN ${settings.vendor_abn}`, margin:[0, 2, 0, 0] }
        ]);
        item_count++;
    }
    contact_info.push([
        { text: '' },
        { text:`Invoice no. ${invoice.number}`, fontSize:9, margin:[0,2,0,0] }
    ]);
    item_count++;
    contact_info.push([
        { text: '' },
        { text:`Invoice date: ${new Date(invoice.date).toLocaleDateString()}`, fontSize:9, margin:[0,2,0,0]}
    ]);
    item_count++;
    contact_info.push([
        { text: '' },
        { text:`Amout due: $${invoice.amount_due.toFixed(2)}`, fontSize:11, bold:true, margin:[0,8,0,0]}
    ]);
    item_count++;
    if (invoice.due_date !== null) {
        contact_info.push([
            { text: '' },
            { text:`Pay by: ${new Date(invoice.due_date).toLocaleDateString()}`, fontSize:11, bold:true, margin:[0,2,0,0]}
        ]);
        item_count++;
    }
    return [
            {
                table: {
                    body: contact_info
                },
                layout: {
                    paddingTop: function(i) { return 0; },
                    paddingBottom: function(i, node) { return 0; },
                    paddingLeft: function(i) { return 0; },
                    paddingRight: function(i) { return 6; },
                    hLineWidth: function (i, node) { return 0; },
                    vLineWidth: function (i, node) { return 0; },
                    hLineColor: function(i, node) { return null; },
                    vLineColor: function(i, node) { return null; }
                }
            }
        , item_count];
}


function generateClientInfo(client, padding, width) {
    var client_info = [];
    var client_name = '';
    if (client.contact.name !== '') {
        client_name += client.contact.name;
    }
    if (client.contact.surname !== '') {
        if (client_name !== '') {
            client_name += ' ';
        }
        client_name += client.contact.surname;
    }
    if (client_name !== '') {
        client_info.push({ text: client_name });
        padding--;
    }
    if (client.contact.phone !== '') {
        client_info.push({ text: ` ${client.contact.phone}`});
        padding--;
    }
    if (client.contact.email !== '') {
        client_info.push({ text: ` ${client.contact.email}` });
        padding--;
    }
    var client_address_string = generateContactAddress(client.contact);
    if (client_address_string !== '') {
        client_info.push({ text: ` ${client_address_string}` });
        padding--;
    }
    for (let i = 0; i < padding; i++) {
        client_info.push({ text: ' '});
    }
    return generateContentBox(client_info, 'Client', 'person_icon.png', width);
}

function generateVehicleInfo(vehicle, padding, width, odo='') {
    if (vehicle) {
        var vehicle_info = [];
        if (vehicle.rego !== '') {
            vehicle_info.push({ text: `${vehicle.rego}` });
            padding--;
        }
        if (vehicle.make_model !== '') {
            vehicle_info.push({ text: `${vehicle.make_model}` });
            padding--;
        }
        if (odo) {
            vehicle_info.push({ text: `${odo} km` });
            padding--;
        }
        for (let i = 0; i < padding; i++) {
            vehicle_info.push({ text: ' '});
        }
        return {
            stack: [generateContentBox(vehicle_info, 'Vehicle', 'vehicle_icon.png', width)]
        };
    }
    return [];
}

function getClientAndVehiclePadding(client, vehicle, odo=null) {
    var client_padding = 0;
    if (client.contact.name !== '') { client_padding++; }
    if (client.contact.number !== '') { client_padding++; }
    if (client.contact.email !== '') { client_padding++; }
    if (client.contact.address !== '') { client_padding++; }
    var vehicle_padding = 0;
    if (vehicle) {
        if (vehicle.rego !== '') { vehicle_padding++; }
        if (vehicle.make_model !== '') { vehicle_padding++; }
    }
    if (odo !== '') { vehicle_padding++; }
    return Math.max(client_padding, vehicle_padding);
}

async function generateInvoiceHeading(invoice, client) {
    const vehicle = await dbGetVehicleById(invoice.vehicle_id);
    const [vendorInfo, item_count] = generateVendorInfo(invoice);
    var vendor_name_mt = (item_count > 2) ? Math.min(item_count * 2, 16) : 0;
    vendor_name_mt += 12;
    const vendor_info_mt = (item_count < 3) ? (14-(item_count * 4)) : 0;
    const padding = getClientAndVehiclePadding(client, vehicle, invoice.odo);
    const invoice_info = [
        vendorInfo,
    ];
    var invoice_heading = [
        {
            columns: [
                {
                    width: '65%',
                    alignment:'center',
                    style: 'h1',
                    margin:[0,vendor_name_mt,24,0],
                    text: settings.vendor.name
                },
                {
                    width: '*',
                    margin:[0,vendor_info_mt,0,0],
                    columns: [
                          {
                              stack: invoice_info
                          },
                    ]
                }
            ]
        },
        {
            margin: [0, 14, 0, 0],
            columns: [
                {
                    width: 'auto',
                    stack: [
                        await generateClientInfo(client, padding, 235),
                    ]
                },
                { width: '*', text: '' },
                {
                    width: 'auto',
                    stack: [
                        await generateVehicleInfo(vehicle, padding, 235, invoice.odo),
                    ]
                },
            ],
        }
    ];
    return invoice_heading;
}


function generatePaymentInfo(width, invoice, client) {
    var payment_info = [];
    if (settings.payment_bank !== '') {
        payment_info.push({ text: `Bank: ${settings.payment_bank}` });
    }
    if (settings.payment_bsb !== '') {
        payment_info.push({ text: `BSB: ${settings.payment_bsb}` });
    }
    if (settings.payment_name !== '') {
        payment_info.push({ text: `Name: ${settings.payment_name}` });
    }
    if (settings.payment_account !== '') {
        payment_info.push({ text: `Account: ${settings.payment_account}` });
    }
    if (settings.payment_reference !== '') {
        const payment_ref = replaceEmailVars(settings.payment_reference, invoice, client);
        payment_info.push({ text: `Reference: ${payment_ref}` });
    }
    var payid_info = [];
    var payid_content = null;
    if (settings.payment_payid_id !== '') {
        payid_info.push({ text: `ID: ${settings.payment_payid_id}` });
    }
    if (settings.payment_payid_name !== '') {
        payid_info.push({ text: `Name: ${settings.payment_payid_name}` });
    }
    if (payid_info.length > 0) {
        payid_content = { columns: [{ image:'payid_icon.png', width:40 },{width:6,text:''},payid_info]};
        if (payment_info.length > 0) {
            payment_info.unshift({ text: 'Bank Transfer', fontSize:10, bold:true, margin:[0,0,0,1] });
        }
    }
    const content_stack = [];
    if (payment_info.length > 0) {
        content_stack.push([{ margin:[0, 6, 0, 0], stack: [payment_info]}]);
    }
    if (payid_content) {
        content_stack.push([{ margin:[0, 8, 0, 0], stack: [payid_content]}]);
    }
    if (content_stack.length > 0) {
        return generateContentBox(content_stack,
            'Payment Information', 'payments_icon.png', width);
    }
    return {};
}

function generateInvoiceItems(invoice, client) {
    invoice.updateTotal();
    var items = [];
    items.push([
        {text: 'Item', style: 'invoiceItemHead', margin:[6, 4, 0, 0]},
        {text: 'Description', style: 'invoiceItemHead'},
        {text: 'Qty', style: 'invoiceItemHead'},
        {text: 'Unit Price', style: 'invoiceItemHead'},
        {text: 'Total', style: 'invoiceItemHead', margin:[0, 4, 6, 0]}]);
    for (const item of invoice.items) {
        if (item.deleted) continue;
        items.push([
            {text: item.name, style:'invoiceItems', margin:[6, 0, 0, 0]},
            {text: item.description, style:'invoiceItems'},
            {text: item.qty, alignment:'right', style:'invoiceItems'},
            {text: '$' + item.price.toFixed(2), style:'invoiceItems', alignment:'right'},
            {text: '$' + item.total.toFixed(2),  style:'invoiceItems',alignment:'right', margin:[0, 0, 6, 0]},
        ]);
    }
    var invoice_totals = [];
    invoice_totals.push([
        { text: 'Subtotal', style:'invoiceTotals', alignment:'center' },
        { text: '$' + invoice.sub_total.toFixed(2), alignment:'right', margin:[0,0,9,0] }
    ]);
    if (invoice.discount !== 0.0) {
        var discount_title = 'Discount';
        if (invoice.discount_pct !== 0.0) {
            discount_title = [
                'Discount',
                { text: ` (${(invoice.discount_pct).toFixed(0)}%)`, bold:false}
            ]
        }
        invoice_totals.push([
            { text: discount_title, style:'invoiceTotals', alignment:'center' },
            { text: '$' + invoice.discount.toFixed(2), alignment:'right', margin:[0,0,9,0] }
        ]);
    }
    invoice_totals.push([
        { text: ['GST', { text: ' (' + (invoice.gst_pct).toFixed(0) + '%)', bold:false}], style:'invoiceTotals', alignment:'center' },
        { text: '$' + invoice.gst_value.toFixed(2), alignment:'right', margin:[8,0,9,0] }
    ]);
    invoice_totals.push([
        { text: 'Total', style:'h7', margin:[0, 2, 0, 0], alignment:'center' },
        { text: '$' + invoice.total.toFixed(2), style:'h7', bold:false, alignment:'right', margin:[0,2,6,0] }
    ]);
    if (invoice.received !== 0.0) {
        invoice_totals.push([
            { text: 'Received', style:'invoiceTotals', alignment:'center' },
            { text: '$' + invoice.received.toFixed(2), alignment:'right', margin:[0,0,9,0] }
        ]);
    }
    invoice_totals.push([
        { text: 'Amount due', style:'h6', margin:[0, 2, 0, 0], alignment:'center' },
        { text: '$' + invoice.amount_due.toFixed(2), style:'h6', alignment:'right', margin:[0,2,6,0] }
    ]);
    if (invoice.due_date !== null) {
        invoice_totals.push([
            { text: 'Pay by date', style:'h6', margin:[0, 2, 0, 0], alignment:'center' },
            { text: `${new Date(invoice.due_date).toLocaleDateString()}`, style:'h6', alignment:'right', margin:[0,2,6,0] }
        ]);
    }
    invoice_totals.push([
        { text: 'Invoice date', style:'invoiceTotals', bold:false, margin:[0, 2, 0, 0], alignment:'center' },
        { text: `${new Date(invoice.date).toLocaleDateString()}`, style:'h6', bold:false, alignment:'right', margin:[0,2,6,0] }
    ]);
    return {
        stack: [
            {
                margin: [0, 22, 0, 2],
                table: {
                    headerRows: 1,
                    widths: [ 'auto', '*', '6%', '15%', '15%'],
                    body: items
                },
                layout: {
                    hLineColor: function (i, node) {
                        return '#888888';
                    },
                    vLineColor: function (i) {
                        return '#888888';
                    },
                    paddingLeft: function (i) {
                        return i === 0 ? 0 : 8;
                    },
                    paddingRight: function (i, node) {
                        return (i === node.table.widths.length - 1) ? 0 : 8;
                    },
                    fillColor: function (i, node) {
                        return (i % 2 === 1) ? '#f8f8f8' : null;
                    }
                }
            },
            {
                margin: [0, 20, 0, 0],
                unbreakable: true,
                columns: [
                    {
                        width: 'auto',
                        stack: [
                            generatePaymentInfo(235, invoice, client)
                        ]
                    },
                    { width: '*', text: '' },
                    {
                        width:'auto',
                        stack: [
                            {
                                table: {
                                    widths:[100,145],
                                    headerRows: 0,
                                    body: invoice_totals
                                },
                                layout: {
                                    hLineWidth: function (i, node) {
                                        if (i === node.table.body.length) return 1;
                                        if (i === (node.table.body.length - 1)) return 1;
                                        return 1;
                                    },
                                    vLineWidth: function (i) {
                                        return 1;
                                    },
                                    hLineColor: function (i, node) {
                                        return '#888888';
                                    },
                                    vLineColor: function (i) {
                                        return '#888888';
                                    },
                                    paddingLeft: function (i) {
                                        return i === 0 ? 0 : 0;
                                    },
                                    paddingRight: function (i, node) {
                                        return (i === node.table.widths.length - 1) ? 0 : 0;
                                    },
                                    fillColor: function (i, node) {
                                        return null;
                                    }
                                }
                            },
                        ]
                    },
                ]
            }
        ]
    };
}

function generateContentBox(content, title='', icon='', width=null) {
    var box = {
        table: {
            body: [
                 [{
                    table: {
                        body: [
                            [{ image:icon, width:13, alignment:'center' },
                             { text: ' '+title, style:'h6' }]
                        ]
                    },
                    layout: {
                        paddingTop: function(i) { return 0; },
                        paddingBottom: function(i, node) { return 0; },
                        paddingLeft: function(i) { return 0; },
                        paddingRight: function(i) { return 5; },
                        hLineWidth: function (i, node) { return 0; },
                        vLineWidth: function (i, node) { return 0; },
                        hLineColor: function(i, node) { return null; },
                        vLineColor: function(i, node) { return null; }
                    }
                }],
                [{
                    stack: [content]
                }]
            ]
        },
        layout: {
            paddingTop: function(i) {
                var padding = 6;
                if (i !== 0) {
                    padding = 0;
                }
                return padding;
            },
            paddingBottom: function(i, node) {
                var padding = 0;
                if (i === (node.table.body.length-1)) {
                    padding = 4;
                }
                return padding;
            },
            paddingLeft: function(i) {
                return 6;
            },
            paddingRight: function(i) {
                return 6;
            },
            hLineWidth: function (i, node) {
                if (i === 0) return 1;
                if (i === node.table.body.length) return 1;
                return 0;
            },
            hLineColor: function(i, node) {
                return (i === 0 || i === node.table.body.length) ? '#888888' : null;
            },
            vLineColor: function(i, node) {
                return (i === 0 || i === node.table.widths.length) ? '#888888' : null;
            }
        }
    };
    if (width !== null) {
        box.table.widths=[width];
    }
    return box;
}

function generateInvoiceNotes(invoice) {
    if (invoice.notes !== '') {
        const notes_content = {
            text: invoice.notes
        };
        return {
            margin: [0, 20, 0, 2],
            stack: [generateContentBox(notes_content, 'Notes', 'notes_icon.png', '100%')]
        };
    }
    return { text: ''};
}

async function generateInvoiceDoc(id) {
    invoice_totals_break = false;
    payment_details_break = false;
    const invoice = await dbGetInvoiceById(id);
    if (!invoice) {
        console.log("generateInvoiceDoc(" + id + ") error: invoice not found!");
        return ['', -1];
    }
    const client = await dbGetClientById(invoice.client_id);
    if (!client) {
        console.log("generateInvoiceDoc(" + id + ") error: client not found!");
        return ['', -1];
    }
    var dd = {
        info: {
            title: invoice.number,
            author: settings.vendor.name,
            subject: 'Invoice',
            keywords: ''
        },
        defaultStyle: { font: 'GoMono', fontSize: 9, lineHeight:1.2 },
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 60],
        content: [
            await generateInvoiceHeading(invoice, client),
            generateInvoiceItems(invoice, client),
            generateInvoiceNotes(invoice)
        ],
        footer: function (currentPage, pageCount) {
            return {
                text: `Page ${currentPage} of ${pageCount}\n${settings.vendor.name}  ABN ${settings.vendor_abn}  ${invoice.number}  ${new Date(invoice.date).toLocaleDateString()}`,
                alignment: 'center'
            };
        },
        styles: {
            h1: {
                fontSize: 24,
                margin: [0, 0, 0, 0]
            },
            h6: {
                fontSize: 10,
                bold: true,
            },
            h7: {
                fontSize: 10,
                bold: true,
            },
            invoiceItemHead: {
                fontSize: 9,
                bold: true,
                margin: [0, 4, 0, 2]
            },
            invoiceItems: {
                fontSize: 8,
            },
            invoiceTotals: {
                bold: true,
            },
        }
    };
    return [dd, invoice.number];
}

async function printInvoice(id) {
    console.log("printInvoice("+id+")");
    const [docDefinition, filename] = await generateInvoiceDoc(parseInt(id));
    pdfMake.createPdf(docDefinition).open();
}

async function downloadInvoice(id) {
    console.log("printInvoice("+id+")");
    const [docDefinition, filename] = await generateInvoiceDoc(parseInt(id));
    pdfMake.createPdf(docDefinition).download(filename + '.pdf');
}

async function getInvoiceBase64(id) {
    const [docDefinition, filename] = await generateInvoiceDoc(id);
    const base64 = await new Promise((resolve) => {
        pdfMake.createPdf(docDefinition).getBase64(resolve);
    });
    return [base64, filename+'.pdf'];
}

