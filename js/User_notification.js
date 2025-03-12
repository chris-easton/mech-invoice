
function userNotification(title, message, large=false) {
    const modal_container = document.createElement('div');
    modal_container.innerHTML = `
        <div class="modal fade" id="modal-notify" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h1 class="modal-title fs-5 modal-notify-title"></h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body modal-notify-message"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-testid="modal-notify-close-btn">Close</button>
              </div>
            </div>
          </div>
        </div>`;
    document.body.appendChild(modal_container);

    const modal_element = document.getElementById('modal-notify');

    if (large) {
        modal_element.classList.add('modal-lg');
    }

    const modal = new bootstrap.Modal(modal_element);

    modal_element.querySelector('.modal-notify-title').innerHTML = title;
    modal_element.querySelector('.modal-notify-message').innerHTML = message;
    modal_element.addEventListener('hidden.bs.modal', () => {
        modal.dispose();
        modal_container.remove();
    });

    modal.show();
}
