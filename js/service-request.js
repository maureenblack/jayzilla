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
    if(document.getElementById('serviceDate')) {
        flatpickr("#serviceDate", {
            minDate: "today",
            maxDate: new Date().fp_incr(30),
            dateFormat: "Y-m-d",
            disable: [
                function(date) {
                    return (date.getDay() === 0); // Disable Sundays
                }
            ]
        });
    }

    // Service type change handler
    serviceType.addEventListener('change', function() {
        const transportationOptions = document.querySelector('.transportation-options');
        const lawncareOptions = document.querySelector('.lawncare-options');
        
        transportationOptions.classList.add('d-none');
        lawncareOptions.classList.add('d-none');
        
        if (this.value === 'transportation') {
            transportationOptions.classList.remove('d-none');
            document.getElementById('transportationType').required = true;
            document.getElementById('distance').required = true;
            document.getElementById('itemSize').required = true;
            document.getElementById('lawncareType').required = false;
            document.getElementById('lawnSize').required = false;
        } else if (this.value === 'lawncare') {
            lawncareOptions.classList.remove('d-none');
            document.getElementById('lawncareType').required = true;
            document.getElementById('lawnSize').required = true;
            document.getElementById('transportationType').required = false;
            document.getElementById('distance').required = false;
            document.getElementById('itemSize').required = false;
        }
        
        calculateEstimatedPrice();
    });

    // Calculate estimated price when relevant fields change
    ['transportationType', 'distance', 'itemSize', 'lawncareType', 'lawnSize', 'lawnCondition'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculateEstimatedPrice);
            if (element.type === 'number') {
                element.addEventListener('input', calculateEstimatedPrice);
            }
        }
    });

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
            if (validateStep(currentStep)) {
                currentStep++;
                updateSteps();
                updateProgress();
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

    function updateSteps() {
        steps.forEach((step, index) => {
            step.classList.toggle('d-none', index !== currentStep);
        });
    }

    function updateProgress() {
        const progress = ((currentStep + 1) / steps.length) * 100;
        progressBar.style.width = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);
    }

    function validateStep(step) {
        const currentStepElement = steps[step];
        const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Make number field not required
    const numberField = document.getElementById('numberField');
    numberField.required = false;

    // Make other fields not required
    const optionalFields = [
        document.getElementById('name'),
        document.getElementById('phone'),
        document.getElementById('email'),
        document.getElementById('address'),
        document.getElementById('serviceDate')
    ];

    optionalFields.forEach(field => {
        field.required = false;
    });

    // Ensure image upload is working
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.addEventListener('change', function() {
        const files = this.files;
        if (files.length > 5) {
            alert('You can upload a maximum of 5 images.');
            return;
        }
        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Each image must be less than 5MB.');
                return;
            }
        }
        const imgPreview = document.getElementById('imgPreview');
        imgPreview.style.display = 'block';
        imgPreview.src = URL.createObjectURL(files[0]); // Display the first image as a preview
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Validate only visible fields
        const currentStepFields = document.querySelectorAll('.form-step:not(.d-none) input[required], .form-step:not(.d-none) select[required]');
        let isValid = true;

        currentStepFields.forEach(field => {
            if (!field.checkValidity()) {
                isValid = false;
                field.reportValidity();
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

        // Display success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success';
        successMessage.textContent = 'Thank you! Your service request has been submitted successfully!';
        document.body.insertBefore(successMessage, form);
        // Clear the form fields
        form.reset();
    });

    // Update request summary
    function updateRequestSummary() {
        const summary = document.getElementById('requestSummary');
        const serviceTypeText = serviceType.options[serviceType.selectedIndex].text;
        let subServiceText = '';
        let estimatedPrice = document.getElementById('estimatedPrice').textContent;
        
        if (serviceType.value === 'transportation') {
            const transportType = document.getElementById('transportationType');
            subServiceText = transportType.options[transportType.selectedIndex].text;
        } else if (serviceType.value === 'lawncare') {
            const lawncareType = document.getElementById('lawncareType');
            subServiceText = lawncareType.options[lawncareType.selectedIndex].text;
        }

        const summaryHTML = `
            <div class="summary-section">
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Service Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Service:</strong> ${serviceTypeText}</p>
                                <p><strong>Type:</strong> ${subServiceText}</p>
                                <p><strong>Timeline:</strong> ${document.getElementById('urgency').options[document.getElementById('urgency').selectedIndex].text}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Estimated Price Range:</strong> ${estimatedPrice}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Contact Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Name:</strong> ${document.getElementById('name').value}</p>
                                <p><strong>Phone:</strong> ${document.getElementById('phone').value}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Email:</strong> ${document.getElementById('email').value}</p>
                                <p><strong>Address:</strong> ${document.getElementById('address').value}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Schedule & Payment</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Date:</strong> ${document.getElementById('serviceDate').value}</p>
                                <p><strong>Time:</strong> ${document.getElementById('timeSlot').options[document.getElementById('timeSlot').selectedIndex].text}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Payment Method:</strong> ${document.querySelector('input[name="paymentMethod"]:checked').parentElement.textContent.trim()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-success mt-4">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Next Steps:</strong> Our team will review your request and contact you within 24 hours with a detailed quote. Once you approve the quote, we'll proceed with the selected payment method.
                </div>
            </div>
        `;
        
        summary.innerHTML = summaryHTML;
    }
});
