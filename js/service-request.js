const API_URL = 'http://localhost:3000/api';
let stripe;
let elements;
let paypal;

document.addEventListener('DOMContentLoaded', function() {
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

    // Initialize Dropzone
    const dropzone = new Dropzone("#uploadArea", {
        url: "/upload",
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

    // Form steps navigation
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressBar = document.querySelector('.progress-bar');
    let currentStep = 0;

    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('d-none', index !== stepIndex);
        });
        updateProgress();
    }

    function updateProgress() {
        const progress = ((currentStep + 1) / steps.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }

    // Next step buttons
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
                if (currentStep === steps.length - 1) {
                    updateSummary();
                }
            }
        });
    });

    // Previous step buttons
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
    });

    // Form validation
    function validateStep(step) {
        const currentStepEl = steps[step];
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
                field.nextElementSibling?.classList.add('d-block');
            } else {
                field.classList.remove('is-invalid');
                field.nextElementSibling?.classList.remove('d-block');
            }
        });

        if (!isValid) {
            showNotification('Please fill in all required fields', 'error');
        }

        return isValid;
    }

    // Handle form submission
    const form = document.getElementById('serviceRequestForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStep(currentStep)) {
            return;
        }

        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
        
        try {
            // Gather form data
            const formData = new FormData(this);
            
            // Add files from dropzone
            dropzone.files.forEach(file => {
                formData.append('photos', file);
            });

            // Submit request
            const response = await fetch('/api/service-request', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            showNotification('Success! Your service request has been submitted.', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } catch (error) {
            showNotification(error.message, 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Request';
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
