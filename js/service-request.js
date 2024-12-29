// Form data object to store all form inputs
let formData = {};

// Initialize the form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
});

function initializeForm() {
    // Set minimum date for preferred date input
    const preferredDateInput = document.getElementById('preferredDate');
    if (preferredDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        preferredDateInput.min = tomorrow.toISOString().split('T')[0];
    }

    // Initialize service type change handler
    const serviceTypeSelect = document.getElementById('serviceType');
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', handleServiceTypeChange);
    }
}

function setupEventListeners() {
    // Add form submission listeners for each step
    const finalForm = document.getElementById('finalForm');
    if (finalForm) {
        finalForm.addEventListener('submit', handleFinalSubmit);
    }

    // Add image upload handler
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
}

function handleServiceTypeChange(event) {
    const serviceType = event.target.value;
    const transportationOptions = document.querySelector('.transportation-options');
    const lawncareOptions = document.querySelector('.lawncare-options');

    // Hide all service-specific options first
    transportationOptions.classList.add('d-none');
    lawncareOptions.classList.add('d-none');

    // Show relevant options based on selection
    if (serviceType === 'transportation') {
        transportationOptions.classList.remove('d-none');
    } else if (serviceType === 'lawncare') {
        lawncareOptions.classList.remove('d-none');
    }

    // Update required fields
    updateRequiredFields(serviceType);
}

function updateRequiredFields(serviceType) {
    // Transportation fields
    const transportationFields = ['transportationType', 'distance', 'itemSize'];
    // Lawn care fields
    const lawncareFields = ['lawncareType', 'lawnSize', 'lawnCondition'];

    // Reset all fields
    [...transportationFields, ...lawncareFields].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.required = false;
        }
    });

    // Set required fields based on service type
    if (serviceType === 'transportation') {
        transportationFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.required = true;
            }
        });
    } else if (serviceType === 'lawncare') {
        lawncareFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.required = true;
            }
        });
    }
}

function nextStep(currentStep) {
    const currentForm = document.querySelector(`#step${currentStep} form`);
    
    // Validate current form
    if (!validateForm(currentForm)) {
        return;
    }

    // Store form data
    const formFields = new FormData(currentForm);
    for (let [key, value] of formFields.entries()) {
        formData[key] = value;
    }

    // Update progress bar
    updateProgressBar(currentStep + 1);

    // Hide current step and show next step
    document.getElementById(`step${currentStep}`).classList.add('d-none');
    document.getElementById(`step${currentStep + 1}`).classList.remove('d-none');

    // If moving to review step, populate review sections
    if (currentStep === 3) {
        populateReviewSection();
    }
}

function prevStep(currentStep) {
    // Update progress bar
    updateProgressBar(currentStep - 1);

    // Hide current step and show previous step
    document.getElementById(`step${currentStep}`).classList.add('d-none');
    document.getElementById(`step${currentStep - 1}`).classList.remove('d-none');
}

function validateForm(form) {
    if (!form.checkValidity()) {
        // Add was-validated class to show validation feedback
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

function updateProgressBar(step) {
    const progressBar = document.querySelector('.progress-bar');
    const percentage = (step / 4) * 100;
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
}

function handleImageUpload(input) {
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const previewContainer = document.getElementById('imagePreviewContainer');
    const errorDiv = document.getElementById('uploadError');

    // Clear previous error messages
    errorDiv.textContent = '';
    
    // Validate number of files
    if (input.files.length > maxFiles) {
        errorDiv.textContent = `Maximum ${maxFiles} files allowed`;
        input.value = '';
        return;
    }

    // Clear previous previews
    previewContainer.innerHTML = '';

    // Process each file
    Array.from(input.files).forEach(file => {
        if (file.size > maxSize) {
            errorDiv.textContent = `File ${file.name} exceeds 5MB limit`;
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <span class="filename">${file.name}</span>
            `;
            previewContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

function populateReviewSection() {
    const reviewSection = document.getElementById('reviewSections');
    if (!reviewSection) return;

    reviewSection.innerHTML = '';

    // Service Details Review
    const serviceDetails = document.createElement('div');
    serviceDetails.className = 'review-section';
    serviceDetails.innerHTML = `
        <h5>Service Details</h5>
        <p><strong>Service Type:</strong> ${formData.serviceType ? formData.serviceType.charAt(0).toUpperCase() + formData.serviceType.slice(1) : ''}</p>
        ${getServiceSpecificReview()}
    `;
    reviewSection.appendChild(serviceDetails);

    // Contact Information Review
    const contactInfo = document.createElement('div');
    contactInfo.className = 'review-section';
    contactInfo.innerHTML = `
        <h5>Contact Information</h5>
        <p><strong>Name:</strong> ${formData.name || ''}</p>
        <p><strong>Email:</strong> ${formData.email || ''}</p>
        ${formData.phone ? `<p><strong>Phone:</strong> ${formData.phone}</p>` : ''}
    `;
    reviewSection.appendChild(contactInfo);

    // Location & Schedule Review
    const locationSchedule = document.createElement('div');
    locationSchedule.className = 'review-section';
    locationSchedule.innerHTML = `
        <h5>Location & Schedule</h5>
        <p><strong>Address:</strong> ${formData.address || ''}</p>
        <p><strong>State:</strong> ${formData.state || ''}</p>
        <p><strong>Preferred Date:</strong> ${formData.preferredDate ? new Date(formData.preferredDate).toLocaleDateString() : ''}</p>
        ${formData.additionalDetails ? `<p><strong>Additional Details:</strong> ${formData.additionalDetails}</p>` : ''}
    `;
    reviewSection.appendChild(locationSchedule);

    // Calculate and display price
    calculateFinalPrice();
}

function getServiceSpecificReview() {
    if (formData.serviceType === 'transportation') {
        return `
            <p><strong>Transportation Type:</strong> ${formData.transportationType || ''}</p>
            <p><strong>Distance:</strong> ${formData.distance ? `${formData.distance} miles` : ''}</p>
            <p><strong>Load Size:</strong> ${formData.itemSize || ''}</p>
        `;
    } else if (formData.serviceType === 'lawncare') {
        return `
            <p><strong>Lawn Care Type:</strong> ${formData.lawncareType || ''}</p>
            <p><strong>Lawn Size:</strong> ${formData.lawnSize ? `${formData.lawnSize} sq ft` : ''}</p>
            <p><strong>Lawn Condition:</strong> ${formData.lawnCondition || ''}</p>
        `;
    }
    return '';
}

function calculateFinalPrice() {
    let basePrice = 0;
    let additionalCosts = [];

    if (formData.serviceType === 'transportation') {
        // Calculate transportation service price
        basePrice = 50; // Base price for transportation
        const distancePrice = parseFloat(formData.distance) * 2; // $2 per mile
        additionalCosts.push({
            description: 'Distance Cost',
            amount: distancePrice
        });

        // Add load size cost
        let loadSizeCost = 0;
        switch (formData.itemSize) {
            case 'small':
                loadSizeCost = 25;
                break;
            case 'medium':
                loadSizeCost = 50;
                break;
            case 'large':
                loadSizeCost = 100;
                break;
        }
        additionalCosts.push({
            description: 'Load Size Cost',
            amount: loadSizeCost
        });

    } else if (formData.serviceType === 'lawncare') {
        // Calculate lawn care service price
        basePrice = 30; // Base price for lawn care
        const areaCost = (parseFloat(formData.lawnSize) / 1000) * 20; // $20 per 1000 sq ft
        additionalCosts.push({
            description: 'Area Cost',
            amount: areaCost
        });

        // Add condition cost
        let conditionCost = 0;
        switch (formData.lawnCondition) {
            case 'good':
                conditionCost = 0;
                break;
            case 'fair':
                conditionCost = 20;
                break;
            case 'poor':
                conditionCost = 40;
                break;
        }
        additionalCosts.push({
            description: 'Condition Cost',
            amount: conditionCost
        });
    }

    // Display price breakdown
    const breakdownDiv = document.getElementById('finalPriceBreakdown');
    breakdownDiv.innerHTML = `
        <div class="price-item">
            <span>Base Price:</span>
            <span>$${basePrice.toFixed(2)}</span>
        </div>
        ${additionalCosts.map(cost => `
            <div class="price-item">
                <span>${cost.description}:</span>
                <span>$${cost.amount.toFixed(2)}</span>
            </div>
        `).join('')}
    `;

    // Calculate and display total
    const total = basePrice + additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
    document.getElementById('finalTotalPrice').textContent = `$${total.toFixed(2)}`;
}

async function handleFinalSubmit(event) {
    event.preventDefault();
    console.log('Form submitted'); // Debug log

    const form = event.target;
    if (!validateForm(form)) {
        return;
    }

    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';

        // Add payment method to form data
        formData.paymentMethod = document.getElementById('paymentMethod').value;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

        console.log('Showing success message'); // Debug log

        // Get the form wrapper
        const formWrapper = document.getElementById('serviceRequestFormWrapper');
        
        // Create success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div class="success-icon">
                <i class="fas fa-check-circle fa-4x"></i>
            </div>
            <h4 class="mt-4">Thank You for Choosing Our Services!</h4>
            <p class="lead">Your request has been successfully submitted.</p>
            
            <div class="order-details mt-4">
                <h5>Order Details</h5>
                <div class="detail-item">
                    <span>Reference Number:</span>
                    <span>SR-${Date.now()}</span>
                </div>
                <div class="detail-item">
                    <span>Service Type:</span>
                    <span>${formData.serviceType ? formData.serviceType.charAt(0).toUpperCase() + formData.serviceType.slice(1) : ''}</span>
                </div>
                <div class="detail-item">
                    <span>Total Amount:</span>
                    <span>${document.getElementById('finalTotalPrice').textContent}</span>
                </div>
            </div>

            <div class="next-steps mt-4">
                <h5>What Happens Next?</h5>
                <ul>
                    <li>You'll receive a confirmation email shortly</li>
                    <li>Our team will review your request within 24 hours</li>
                    <li>We'll contact you to confirm the details</li>
                </ul>
            </div>

            <div class="action-buttons mt-4">
                <button onclick="window.location.reload()" class="btn btn-primary me-3">
                    Submit Another Request
                </button>
                <a href="index.html" class="btn btn-outline-primary">
                    Return Home
                </a>
            </div>
        `;

        // Clear the form wrapper and add success message
        formWrapper.innerHTML = '';
        formWrapper.appendChild(successMessage);

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Submission error:', error); // Debug log
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = 'There was an error submitting your request. Please try again.';
        form.insertBefore(errorDiv, form.firstChild);
        
        // Re-enable submit button
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Request';
    }
}

// Function to handle submitting another request
function submitAnotherRequest() {
    // Reset all forms
    document.getElementById('serviceDetailsForm').reset();
    document.getElementById('contactForm').reset();
    document.getElementById('locationForm').reset();
    document.getElementById('finalForm').reset();
    
    // Clear form data
    formData = {};
    
    // Reset validation classes
    document.querySelectorAll('form').forEach(form => {
        form.classList.remove('was-validated');
    });
    
    // Show first step and hide others
    document.querySelectorAll('.form-step').forEach((step, index) => {
        if (index === 0) {
            step.classList.remove('d-none');
        } else {
            step.classList.add('d-none');
        }
    });
    
    // Reset progress bar
    updateProgressBar(1);
    
    // Clear image previews
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }

    // Scroll to top of form
    document.querySelector('.service-request-section').scrollIntoView({ behavior: 'smooth' });
}

function showMessage(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const formWrapper = document.getElementById('serviceRequestFormWrapper');
    formWrapper.insertBefore(alertDiv, formWrapper.firstChild);
}

function resetForm() {
    // Reset form data
    formData = {};
    
    // Reset all forms
    document.getElementById('serviceDetailsForm').reset();
    document.getElementById('contactForm').reset();
    document.getElementById('locationForm').reset();
    document.getElementById('finalForm').reset();
    
    // Remove validation classes
    document.querySelectorAll('form').forEach(form => {
        form.classList.remove('was-validated');
    });
    
    // Hide all steps except first
    document.querySelectorAll('.form-step').forEach((step, index) => {
        if (index === 0) {
            step.classList.remove('d-none');
        } else {
            step.classList.add('d-none');
        }
    });
    
    // Reset progress bar
    updateProgressBar(1);
    
    // Clear image previews
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}
