"use strict";
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// Form Handling
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href') || '');
            target === null || target === void 0 ? void 0 : target.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
// Contact Form Handler
function handleContactSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };
    // Here you would typically send the data to a server
    console.log('Form submitted:', contactData);
    // Show success message
    showNotification('Message sent successfully!', 'success');
    form.reset();
}
// Notification Helper
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
// Service Request Handler
function requestService(service) {
    // This would typically open a modal or navigate to a booking page
    console.log(`Requesting service: ${service}`);
    showNotification('Service request initiated', 'success');
}
// Image Upload Handler
function handleImageUpload(event) {
    const input = event.target;
    const files = input.files;
    if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            const preview = document.getElementById('imagePreview');
            if (preview && ((_a = e.target) === null || _a === void 0 ? void 0 : _a.result)) {
                preview.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}
// Initialize any third-party components or additional features
function initializeComponents() {
    // Add any initialization code here
    console.log('Components initialized');
}
