
function addPageHeading(selector, page_title, item_name) {
    const page_heading_elem = document.getElementById(selector);
    const item_name_lower = item_name.toLowerCase();
    page_heading_elem.innerHTML = `
        <div class="d-flex" style="padding:15px 0px 15px 0px;">
            <div style="margin-right:auto;">
                <h2 data-testid="page-manage-${item_name_lower}s-heading">Manage ${page_title}</h2>
            </div>
            <div style="display:flex;align-items:center;">
                <a class="btn btn-primary" href='#create-${item_name_lower}'
                    data-testid="create-${item_name_lower}-btn">New ${item_name}</a>
            </div>
        </div>`;
}

document.querySelectorAll("textarea").forEach(function(textarea) {
  textarea.style.height = textarea.scrollHeight + "px";
  textarea.style.overflowY = "hidden";

  textarea.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
  });
});

// Build a <style> block with @font-face rules
const fontFaceCSS = `
@font-face {
  font-family: 'GoMono';
  font-weight: 400; /* normal weight */
  font-style: normal;
  src: url('data:application/font-ttf;base64,${GO_MONO_REGULAR}') format('truetype');
}
@font-face {
  font-family: 'GoMono';
  font-weight: 700; /* bold weight */
  font-style: normal;
  src: url('data:application/font-ttf;base64,${GO_MONO_BOLD}') format('truetype');
}
@font-face {
  font-family: 'GoMono';
  font-weight: 400;
  font-style: italic;
  src: url('data:application/font-ttf;base64,${GO_MONO_ITALIC}') format('truetype');
}
@font-face {
  font-family: 'GoMono';
  font-weight: 700;
  font-style: italic;
  src: url('data:application/font-ttf;base64,${GO_MONO_BOLD_ITALIC}') format('truetype');
}
`;

// Inject the <style> into document <head>
const styleTag = document.createElement('style');
styleTag.textContent = fontFaceCSS;
document.head.appendChild(styleTag);

// Now "GoMono" is available for CSS usage anywhere on the page
document.body.style.fontFamily = 'GoMono, monospace';

const date_formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

function formatDate(date, hours=false) {
    var date_str = date_formatter.format(date);
    if (hours) {
        date_str += ' ' + date.toLocaleTimeString();
    }
    return date_str;
}

function limitString(inputString, maxLength, maxLines) {
  let truncatedString = inputString.slice(0, maxLength);
  let lines = truncatedString.split('\n');
  lines = lines.slice(0, maxLines);
  let resultString = lines.join('\n');
  return resultString;
}
