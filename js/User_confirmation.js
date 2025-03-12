
function userConfimation(message) {
    return new Promise((resolve) => {
        const modal_container = document.createElement('div');
        modal_container.innerHTML = `
            <div class="modal fade" id="modal-confirm" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h1 class="modal-title fs-5">Confirm</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body modal-confirm-message"></div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-confirm-no-btn" data-bs-dismiss="modal">No</button>
                    <button type="button" class="btn btn-primary modal-confirm-yes-btn">Yes</button>
                  </div>
                </div>
              </div>
            </div>`;
        document.body.appendChild(modal_container);

        const modal_element = document.getElementById('modal-confirm');
        const modal = new bootstrap.Modal(modal_element);

        modal_element.querySelector('.modal-confirm-message').innerHTML = message;
        modal_element.querySelector('.modal-confirm-yes-btn').addEventListener('click', () => {
            modal.hide();
            resolve(true);
        });
        modal_element.querySelector('.modal-confirm-no-btn').addEventListener('click', () => {
            resolve(false);
        });
        modal_element.addEventListener('hidden.bs.modal', event => {
            modal.dispose();
            modal_container.remove();
        });

        modal.show();
    });
}
