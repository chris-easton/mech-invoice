
let vfs = {
    'GoMono-Regular.ttf':       GO_MONO_REGULAR,
    'GoMono-Bold.ttf':          GO_MONO_BOLD,
    'GoMono-Italic.ttf':        GO_MONO_ITALIC,
    'GoMono-Bold-Italic.ttf':   GO_MONO_BOLD_ITALIC,
    'payid_icon.png':           PAYID_ICON,
    'call_icon.png':            CALL_ICON_FILLED,
    'mail_icon.png':            MAIL_ICON_FILLED,
    'location_icon.png':        LOCATION_ICON_FILLED,
    'person_icon.png':          PERSON_ICON_FILLED,
    'vehicle_icon.png':         VEHICLE_ICON_FILLED,
    'payments_icon.png':        PAYMENTS_ICON_FILLED,
    'notes_icon.png':           NOTES_ICON_FILLED,
};

function initPdfMake() {
    pdfMake.vfs = vfs;
    pdfMake.fonts = {
        GoMono: {
            normal: 'GoMono-Regular.ttf',
            bold: 'GoMono-Bold.ttf',
            italics: 'GoMono-Italic.ttf',
            bolditalics: 'GoMono-BoldItalic.ttf',
        },
    };
}
