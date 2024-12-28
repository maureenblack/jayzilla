const API_URL = 'http://localhost:3000/api';
let stripe;
let elements;
let paypal;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form elements
    const form = document.getElementById('serviceRequestForm');
    const steps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress-bar');
    const serviceType = document.getElementById('serviceType');
    const phoneInput = document.getElementById('phone');
    
    // Base prices for services
    const prices = {
        transportation: {
            'local-moving': { base: 100, perMile: 2 },
            'furniture': { base: 80, perMile: 1.5 },
            'delivery': { base: 60, perMile: 1 }
        },
        lawncare: {
            'mowing': { base: 50, perSqFt: 0.02 },
            'trimming': { base: 40, perSqFt: 0.015 },
            'cleanup': { base: 60, perSqFt: 0.025 },
            'treatment': { base: 70, perSqFt: 0.03 }
        }
    };

    // Phone number validation
    phoneInput.addEventListener('input', function(e) {
        let x = e.target.value.replace(/\\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    phoneInput.addEventListener('blur', function() {
        const phoneNumber = this.value.replace(/\\D/g, '');
        if (phoneNumber.length !== 10) {
            this.classList.add('is-invalid');
            this.nextElementSibling.textContent = 'Please enter a valid 10-digit US phone number';
        } else {
            this.classList.remove('is-invalid');
        }
    });
    
    // Initialize date picker
    flatpickr("#serviceDate", {
        minDate: "today",
        maxDate: new Date().fp_incr(30),
        disable: [
            function(date) {
                return date.getDay() === 0;
            }
        ],
        locale: {
            firstDayOfWeek: 1
        }
    });

    // Check if API_URL is defined before initializing Dropzone
    console.log('API_URL:', API_URL); // Debug log to check API_URL value

    // Consolidate Dropzone initialization and ensure a valid URL is used
    if (!Dropzone.instances.length) {
        const dropzone = new Dropzone("#uploadArea", {
            url: API_URL + "/upload", // Ensure API_URL is defined and valid
            maxFiles: 5,
            maxFilesize: 5,
            acceptedFiles: "image/*",
            addRemoveLinks: true,
            autoProcessQueue: false,
            previewsContainer: "#preview",
            createImageThumbnails: true,
            thumbnailWidth: 120,
            thumbnailHeight: 120,
            init: function() {
                this.on("addedfile", function(file) {
                    if (this.files.length > 5) {
                        this.removeFile(file);
                        showNotification('Maximum 5 files allowed', 'warning');
                    }
                });
            }
        });
    }

    function calculateEstimatedPrice() {
        const estimatedPriceSection = document.querySelector('.estimated-price-section');
        const estimatedPriceSpan = document.getElementById('estimatedPrice');
        
        if (!serviceType.value) {
            estimatedPriceSection.classList.add('d-none');
            return;
        }

        let basePrice = 0;
        let finalPrice = 0;

        if (serviceType.value === 'transportation') {
            const type = document.getElementById('transportationType').value;
            const distance = parseFloat(document.getElementById('distance').value) || 0;
            const size = document.getElementById('itemSize').value;

            if (type && distance && size) {
                basePrice = prices.transportation[type].base;
                finalPrice = basePrice + (distance * prices.transportation[type].perMile);
                
                // Adjust for load size
                if (size === 'medium') finalPrice *= 1.5;
                if (size === 'large') finalPrice *= 2;

                estimatedPriceSection.classList.remove('d-none');
                estimatedPriceSpan.textContent = `$${Math.round(finalPrice * 0.8)} - $${Math.round(finalPrice * 1.2)}`;
            }
        } else if (serviceType.value === 'lawncare') {
            const type = document.getElementById('lawncareType').value;
            const size = parseFloat(document.getElementById('lawnSize').value) || 0;
            const condition = document.getElementById('lawnCondition').value;

            if (type && size) {
                basePrice = prices.lawncare[type].base;
                finalPrice = basePrice + (size * prices.lawncare[type].perSqFt);
                
                // Adjust for lawn condition
                if (condition === 'fair') finalPrice *= 1.2;
                if (condition === 'poor') finalPrice *= 1.4;

                estimatedPriceSection.classList.remove('d-none');
                estimatedPriceSpan.textContent = `$${Math.round(finalPrice * 0.8)} - $${Math.round(finalPrice * 1.2)}`;
            }
        }
    }

    // Navigation between steps
    let currentStep = 0;
    updateProgress();

    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', () => {
            console.log('Next button clicked'); // Debug log
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
                console.log('Current step:', currentStep); // Debug log
                if (currentStep === steps.length - 1) {
                    updateRequestSummary();
                }
            }
        });
    });

    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            updateSteps();
            updateProgress();
        });
    });

    // Streamlined validation logic
    function validateStep(step) {
        console.log('Validating step:', step);
        const currentStepEl = steps[step];
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (field.offsetParent !== null) { // Check if the field is visible
                console.log('Validating field:', field.id, 'Value:', field.value);
                const feedback = field.nextElementSibling;
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('is-invalid');
                    if (feedback) feedback.textContent = 'This field is required';
                } else {
                    field.classList.remove('is-invalid');
                    if (feedback) feedback.textContent = '';
                }
            }
        });

        if (!isValid) {
            showNotification('Please fill in all required fields', 'error');
        }
        return isValid;
    }

    // Form validation
    const form = document.getElementById('serviceRequestForm');
    const serviceType = document.getElementById('serviceType');
    const phoneInput = document.getElementById('phone');

    // Phone number validation
    phoneInput.addEventListener('input', function(e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    phoneInput.addEventListener('blur', function() {
        const phoneNumber = this.value.replace(/\D/g, '');
        if (phoneNumber.length !== 10) {
            this.classList.add('is-invalid');
            this.nextElementSibling.textContent = 'Please enter a valid 10-digit US phone number';
        } else {
            this.classList.remove('is-invalid');
        }
    });

    // Update service type change event to show/hide relevant fields
    serviceType.addEventListener('change', function() {
        const selectedService = this.value;
        document.querySelectorAll('.transportation-options, .lawncare-options').forEach(option => {
            option.classList.add('d-none');
        });
        if (selectedService === 'transportation') {
            document.querySelectorAll('.transportation-options').forEach(option => {
                option.classList.remove('d-none');
            });
        } else if (selectedService === 'lawncare') {
            document.querySelectorAll('.lawncare-options').forEach(option => {
                option.classList.remove('d-none');
            });
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submission initiated'); // Debug log
        // Validate only visible fields
        const currentStepFields = document.querySelectorAll('.form-step:not(.d-none) input[required], .form-step:not(.d-none) select[required]');
        let isValid = true;

        currentStepFields.forEach(field => {
            console.log('Validating field:', field.id, 'Value:', field.value); // Debug log
            if (!field.checkValidity()) {
                isValid = false;
                field.classList.add('is-invalid');
                if (field.nextElementSibling) { // Check if nextElementSibling exists
                    field.nextElementSibling.textContent = 'This field is required';
                }
            } else {
                field.classList.remove('is-invalid');
                if (field.nextElementSibling) {
                    field.nextElementSibling.textContent = '';
                }
            }
        });

        if (!isValid) return;

        // Validate email format
        const email = document.getElementById('email');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Gather form data
        const formData = new FormData(this);
        dropzone.files.forEach(file => {
            formData.append('photos', file);
        });

        console.log('Form data prepared for submission:', formData); // Debug log

        // Submit the form data to the API
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                const successMessage = document.createElement('div');
                successMessage.className = 'alert alert-success';
                successMessage.textContent = 'Thank you! Your service request has been submitted successfully!';
                form.appendChild(successMessage);
                form.reset();
            } else {
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || 'Failed to submit form.');
            }
        } catch (error) {
            console.error(error);
            alert('There was a problem submitting the form: ' + error.message);
        }
    });

    // Update summary before final submission
    function updateSummary() {
        const summary = {
            service: document.getElementById('serviceType').options[document.getElementById('serviceType').selectedIndex].text,
            details: document.getElementById('taskDetails').value,
            urgency: document.getElementById('urgency').options[document.getElementById('urgency').selectedIndex].text,
            address: document.getElementById('address').value,
            date: document.getElementById('serviceDate').value,
            time: document.getElementById('timeSlot').options[document.getElementById('timeSlot').selectedIndex].text
        };

        document.getElementById('requestSummary').innerHTML = `
            <div class="summary-item">
                <strong>Service Type:</strong> ${summary.service}
            </div>
            <div class="summary-item">
                <strong>Task Details:</strong> ${summary.details}
            </div>
            <div class="summary-item">
                <strong>Urgency:</strong> ${summary.urgency}
            </div>
            <div class="summary-item">
                <strong>Location:</strong> ${summary.address}
            </div>
            <div class="summary-item">
                <strong>Date & Time:</strong> ${summary.date} at ${summary.time}
            </div>
        `;
    }

    // Notification helper
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
});
