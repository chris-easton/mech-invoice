
class Contact_info {
    name = '';
    surname = '';
    email = '';
    phone = '';
    address = '';
    city = '';
    postcode = '';
    date = new Date();

    serialise() {
        return {
            name: this.name,
            surname: this.surname,
            email: this.email,
            phone: this.phone,
            address: this.address,
            city: this.city,
            postcode: this.postcode,
            date: this.date.toISOString(),
        };
    }

    deserialise(data) {
        this.name = data.name;
        this.surname = data.surname || '';
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.city = data.city;
        this.postcode = data.postcode;
        this.date = data.date ? new Date(data.date) : new Date();
    }
}

function clearContactUi(selector) {
    const element = document.querySelector(selector);
    element.querySelector('.contact-name').value = '';
    element.querySelector('.contact-surname').value = '';
    element.querySelector('.contact-email').value = '';
    element.querySelector('.contact-phone').value = '';
    element.querySelector('.contact-address').value = '';
    element.querySelector('.contact-city').value = '';
    element.querySelector('.contact-postcode').value = '';
    element.removeAttribute('data-id');
}

function uiToContact(contact, selector) {
    const element = document.querySelector(selector);
    contact.name = element.querySelector('.contact-name').value || '';
    const surname_elem = element.querySelector('.contact-surname');
    if (surname_elem) contact.surname = element.querySelector('.contact-surname').value || '';
    contact.email = element.querySelector('.contact-email').value || '';
    contact.phone = element.querySelector('.contact-phone').value || '';
    contact.address = element.querySelector('.contact-address').value || '';
    contact.city = element.querySelector('.contact-city').value || '';
    contact.postcode = element.querySelector('.contact-postcode').value || '';
}

function contactToUi(contact, selector, id=null) {
    const element = document.querySelector(selector);
    element.querySelector('.contact-name').value = contact.name;
    const surname_elem = element.querySelector('.contact-surname');
    if (surname_elem) surname_elem.value = contact.surname;
    element.querySelector('.contact-email').value = contact.email;
    element.querySelector('.contact-phone').value = contact.phone;
    element.querySelector('.contact-address').value = contact.address;
    element.querySelector('.contact-city').value = contact.city;
    element.querySelector('.contact-postcode').value = contact.postcode;
    if (id !== null) {
        element.setAttribute('data-id', id);
    }
}
