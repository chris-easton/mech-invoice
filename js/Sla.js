
document.getElementById('view-sla-btn').addEventListener('click', () => {
    showSLA('Accept');
});

function showSLA(btn_text) {
    return new Promise((resolve) => {
        const modal_container = document.createElement('div');
        modal_container.innerHTML = `
            <div class="modal fade modal-lg" id="modal-confirm" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                      <div>
                      <div><h1 class="modal-title fs-5">Software License Agreement</h1></div>
                      <div>Please read the following license agreement. To use this software you must accept the agreement.</div>
                      </div>
                  </div>
                  <div class="modal-body modal-confirm-message">
                      <pre>${APP_LICENSE}</pre>
                  </div>
                  <div class="modal-footer" style="">
                      <div style="padding-right:20px;">Click Agree to accept the agreement</div>
                      <button type="button" class="btn btn-primary modal-confirm-yes-btn" data-testid="accept-sla-btn">${btn_text}</button>
                  </div>
                </div>
              </div>
            </div>`;
        document.body.appendChild(modal_container);

        const modal_element = document.getElementById('modal-confirm');
        modal_element.setAttribute('data-bs-backdrop', 'static');
        const modal = new bootstrap.Modal(modal_element);

        //modal_element.querySelector('.modal-confirm-message').innerHTML = message;
        modal_element.querySelector('.modal-confirm-yes-btn').addEventListener('click', () => {
            modal.hide();
            resolve(true);
        });
        modal_element.addEventListener('hidden.bs.modal', event => {
            modal.dispose();
            modal_container.remove();
        });

        modal.show();
    });
}
