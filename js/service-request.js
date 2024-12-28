document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('serviceRequestForm');
    const steps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress-bar');
    const prevButton = document.getElementById('prevStep');
    const nextButton = document.getElementById('nextStep');
    const submitButton = document.getElementById('submitForm');
    let currentStep = 0;
    let uploadedImages = [];

    // Price calculation constants
    const PRICES = {
        transportation: {
            'local-moving': { base: 100, mileageRate: 2.5, sizes: { small: 1, medium: 1.5, large: 2 } },
            'furniture': { base: 80, mileageRate: 2, sizes: { small: 1, medium: 1.75, large: 2.5 } },
            'delivery': { base: 50, mileageRate: 1.5, sizes: { small: 1, medium: 1.25, large: 1.75 } }
        },
        lawncare: {
            'mowing': { base: 30, ratePerSqFt: 0.02, conditions: { good: 1, fair: 1.2, poor: 1.5 } },
            'trimming': { base: 25, ratePerSqFt: 0.015, conditions: { good: 1, fair: 1.2, poor: 1.4 } },
            'cleanup': { base: 40, ratePerSqFt: 0.03, conditions: { good: 1, fair: 1.3, poor: 1.6 } },
            'treatment': { base: 35, ratePerSqFt: 0.025, conditions: { good: 1, fair: 1.25, poor: 1.5 } }
        }
    };

    // Image upload handler
    function handleImageUpload(input) {
        const files = input.files;
        const errorDiv = document.getElementById('uploadError');
        const previewContainer = document.getElementById('imagePreviewContainer');
        
        // Clear previous error messages
        errorDiv.textContent = '';
        
        // Validate number of files
        if (files.length > 5) {
            errorDiv.textContent = 'Maximum 5 files allowed';
            input.value = '';
            return;
        }

        // Clear previous previews if starting fresh
        if (files.length + uploadedImages.length > 5) {
            errorDiv.textContent = 'Total number of files cannot exceed 5';
            input.value = '';
            return;
        }

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file size (5MB = 5 * 1024 * 1024 bytes)
            if (file.size > 5 * 1024 * 1024) {
                errorDiv.textContent = `${file.name} exceeds 5MB limit`;
                input.value = '';
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                errorDiv.textContent = `${file.name} is not an image file`;
                input.value = '';
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'position-relative';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" 
                        style="padding: 0.2rem 0.4rem; margin: -0.5rem -0.5rem 0 0;"
                        onclick="this.parentElement.remove(); uploadedImages.splice(uploadedImages.indexOf('${file.name}'), 1);">×</button>
                `;
                previewContainer.appendChild(preview);
            };
            reader.readAsDataURL(file);
            uploadedImages.push(file.name);
        }
    }
    window.handleImageUpload = handleImageUpload;

    // Calculate final price details
    function calculatePriceDetails() {
        const serviceType = document.getElementById('serviceType').value;
        let priceDetails = { breakdown: [], total: 0 };

        if (serviceType === 'transportation') {
            const type = document.getElementById('transportationType').value;
            const distance = parseFloat(document.getElementById('distance').value) || 0;
            const size = document.getElementById('itemSize').value;

            if (type && distance && size) {
                const pricing = PRICES.transportation[type];
                const basePrice = pricing.base;
                const distanceCost = distance * pricing.mileageRate;
                const sizeMultiplier = pricing.sizes[size];
                const sizeAdjustment = (basePrice + distanceCost) * (sizeMultiplier - 1);
                const total = (basePrice + distanceCost) * sizeMultiplier;

                priceDetails = {
                    breakdown: [
                        { label: 'Base Price', amount: basePrice },
                        { label: 'Distance Cost', amount: distanceCost },
                        { label: 'Size Adjustment', amount: sizeAdjustment }
                    ],
                    total: total
                };
            }
        } else if (serviceType === 'lawncare') {
            const type = document.getElementById('lawncareType').value;
            const size = parseFloat(document.getElementById('lawnSize').value) || 0;
            const condition = document.getElementById('lawnCondition').value;

            if (type && size && condition) {
                const pricing = PRICES.lawncare[type];
                const basePrice = pricing.base;
                const areaCost = size * pricing.ratePerSqFt;
                const conditionMultiplier = pricing.conditions[condition];
                const conditionAdjustment = (basePrice + areaCost) * (conditionMultiplier - 1);
                const total = (basePrice + areaCost) * conditionMultiplier;

                priceDetails = {
                    breakdown: [
                        { label: 'Base Price', amount: basePrice },
                        { label: 'Area Cost', amount: areaCost },
                        { label: 'Condition Adjustment', amount: conditionAdjustment }
                    ],
                    total: total
                };
            }
        }

        return priceDetails;
    }

    // Update review sections
    function updateReviewSections() {
        const serviceType = document.getElementById('serviceType').value;
        
        // Update Service Review
        let serviceDetails = `
            <div class="review-item">
                <div class="review-label">Service Type:</div>
                <div class="review-value">${serviceType === 'transportation' ? 'Transportation Services' : 'Lawn Care Services'}</div>
            </div>
        `;

        if (serviceType === 'transportation') {
            const type = document.getElementById('transportationType').value;
            const distance = document.getElementById('distance').value;
            const size = document.getElementById('itemSize').value;

            serviceDetails += `
                <div class="review-item">
                    <div class="review-label">Transportation Type:</div>
                    <div class="review-value">${type ? type.replace('-', ' ').toUpperCase() : ''}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Distance:</div>
                    <div class="review-value">${distance} miles</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Load Size:</div>
                    <div class="review-value">${size ? size.charAt(0).toUpperCase() + size.slice(1) : ''}</div>
                </div>
            `;
        } else if (serviceType === 'lawncare') {
            const type = document.getElementById('lawncareType').value;
            const size = document.getElementById('lawnSize').value;
            const condition = document.getElementById('lawnCondition').value;

            serviceDetails += `
                <div class="review-item">
                    <div class="review-label">Lawn Care Type:</div>
                    <div class="review-value">${type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Lawn Size:</div>
                    <div class="review-value">${size} sq ft</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Lawn Condition:</div>
                    <div class="review-value">${condition ? condition.charAt(0).toUpperCase() + condition.slice(1) : ''}</div>
                </div>
            `;
        }

        // Update Contact Review
        const contactDetails = `
            <div class="review-item">
                <div class="review-label">Name:</div>
                <div class="review-value">${document.getElementById('name').value}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Email:</div>
                <div class="review-value">${document.getElementById('email').value}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Phone:</div>
                <div class="review-value">${document.getElementById('phone').value || 'Not provided'}</div>
            </div>
        `;

        // Update Schedule Review
        const scheduleDetails = `
            <div class="review-item">
                <div class="review-label">Service Address:</div>
                <div class="review-value">${document.getElementById('address').value}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Preferred Date:</div>
                <div class="review-value">${document.getElementById('preferredDate').value}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Additional Details:</div>
                <div class="review-value">${document.getElementById('additionalDetails').value || 'None provided'}</div>
            </div>
            <div class="review-item">
                <div class="review-label">Uploaded Images:</div>
                <div class="review-value">${uploadedImages.length > 0 ? uploadedImages.length + ' image(s) uploaded' : 'No images uploaded'}</div>
            </div>
        `;

        document.getElementById('serviceReview').innerHTML = serviceDetails;
        document.getElementById('contactReview').innerHTML = contactDetails;
        document.getElementById('scheduleReview').innerHTML = scheduleDetails;
    }

    // Update price display
    function updatePriceDisplay() {
        const priceDetails = calculatePriceDetails();
        const finalPriceBreakdown = document.getElementById('finalPriceBreakdown');
        const finalTotalPrice = document.getElementById('finalTotalPrice');

        finalPriceBreakdown.innerHTML = priceDetails.breakdown
            .map(item => `
                <div class="price-item">
                    <span>${item.label}:</span>
                    <span>$${item.amount.toFixed(2)}</span>
                </div>
            `).join('');

        finalTotalPrice.textContent = `$${priceDetails.total.toFixed(2)}`;
    }

    // Service type change handler
    document.getElementById('serviceType').addEventListener('change', function(e) {
        const transportationOptions = document.querySelector('.transportation-options');
        const lawncareOptions = document.querySelector('.lawncare-options');
        
        transportationOptions.classList.add('d-none');
        lawncareOptions.classList.add('d-none');
        
        if (e.target.value === 'transportation') {
            transportationOptions.classList.remove('d-none');
        } else if (e.target.value === 'lawncare') {
            lawncareOptions.classList.remove('d-none');
        }

        if (currentStep === steps.length - 1) {
            updatePriceDisplay();
            updateReviewSections();
        }
    });

    // Add price update listeners
    ['transportationType', 'distance', 'itemSize', 'lawncareType', 'lawnSize', 'lawnCondition'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                if (currentStep === steps.length - 1) {
                    updatePriceDisplay();
                    updateReviewSections();
                }
            });
            element.addEventListener('input', () => {
                if (currentStep === steps.length - 1) {
                    updatePriceDisplay();
                    updateReviewSections();
                }
            });
        }
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0,3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
            }
        }
        e.target.value = value;
    });

    // Navigation functions
    function showStep(step) {
        steps.forEach((s, index) => {
            s.classList.toggle('d-none', index !== step);
        });

        const progress = ((step + 1) / steps.length) * 100;
        progressBar.style.width = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);

        prevButton.style.display = step === 0 ? 'none' : 'block';
        nextButton.style.display = step === steps.length - 1 ? 'none' : 'block';
        submitButton.style.display = step === steps.length - 1 ? 'block' : 'none';

        if (step === steps.length - 1) {
            updatePriceDisplay();
            updateReviewSections();
        }
    }

    // Validation functions
    function validateStep(step) {
        const currentStepElement = steps[step];
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value) {
                isValid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });

        if (step === 0) {
            const serviceType = document.getElementById('serviceType').value;
            if (serviceType === 'transportation') {
                const transportationType = document.getElementById('transportationType');
                const distance = document.getElementById('distance');
                const itemSize = document.getElementById('itemSize');

                if (!transportationType.value || !distance.value || !itemSize.value) {
                    isValid = false;
                    if (!transportationType.value) transportationType.classList.add('is-invalid');
                    if (!distance.value) distance.classList.add('is-invalid');
                    if (!itemSize.value) itemSize.classList.add('is-invalid');
                }
            } else if (serviceType === 'lawncare') {
                const lawncareType = document.getElementById('lawncareType');
                const lawnSize = document.getElementById('lawnSize');
                const lawnCondition = document.getElementById('lawnCondition');

                if (!lawncareType.value || !lawnSize.value || !lawnCondition.value) {
                    isValid = false;
                    if (!lawncareType.value) lawncareType.classList.add('is-invalid');
                    if (!lawnSize.value) lawnSize.classList.add('is-invalid');
                    if (!lawnCondition.value) lawnCondition.classList.add('is-invalid');
                }
            }
        }

        return isValid;
    }

    // Navigation event listeners
    prevButton.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });

    nextButton.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateStep(currentStep)) {
            const priceDetails = calculatePriceDetails();
            const formData = {
                serviceType: document.getElementById('serviceType').value,
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value || 'Not provided',
                address: document.getElementById('address').value,
                preferredDate: document.getElementById('preferredDate').value,
                additionalDetails: document.getElementById('additionalDetails').value || 'None provided',
                paymentMethod: document.getElementById('paymentMethod').value,
                totalPrice: priceDetails.total,
                uploadedImages: uploadedImages
            };

            if (formData.serviceType === 'transportation') {
                formData.transportationType = document.getElementById('transportationType').value;
                formData.distance = document.getElementById('distance').value;
                formData.itemSize = document.getElementById('itemSize').value;
            } else if (formData.serviceType === 'lawncare') {
                formData.lawncareType = document.getElementById('lawncareType').value;
                formData.lawnSize = document.getElementById('lawnSize').value;
                formData.lawnCondition = document.getElementById('lawnCondition').value;
            }

            console.log('Form submitted:', formData);
            
            // Create a detailed confirmation message
            let confirmationMessage = 'Service request submitted successfully!\n\n';
            confirmationMessage += `Service Type: ${formData.serviceType === 'transportation' ? 'Transportation' : 'Lawn Care'}\n`;
            
            if (formData.serviceType === 'transportation') {
                confirmationMessage += `Transportation Type: ${formData.transportationType}\n`;
                confirmationMessage += `Distance: ${formData.distance} miles\n`;
                confirmationMessage += `Load Size: ${formData.itemSize}\n`;
            } else {
                confirmationMessage += `Lawn Care Type: ${formData.lawncareType}\n`;
                confirmationMessage += `Lawn Size: ${formData.lawnSize} sq ft\n`;
                confirmationMessage += `Lawn Condition: ${formData.lawnCondition}\n`;
            }
            
            confirmationMessage += `\nContact Information:\n`;
            confirmationMessage += `Name: ${formData.name}\n`;
            confirmationMessage += `Email: ${formData.email}\n`;
            confirmationMessage += `Phone: ${formData.phone}\n`;
            confirmationMessage += `Address: ${formData.address}\n`;
            confirmationMessage += `Preferred Date: ${formData.preferredDate}\n`;
            confirmationMessage += `\nTotal Price: $${priceDetails.total.toFixed(2)}\n`;
            confirmationMessage += `Payment Method: ${formData.paymentMethod}\n`;
            confirmationMessage += `Images Uploaded: ${uploadedImages.length}\n\n`;
            confirmationMessage += `We will contact you soon to confirm your appointment.`;
            
            alert(confirmationMessage);
            
            // Reset form
            form.reset();
            currentStep = 0;
            showStep(currentStep);
            
            // Reset UI elements
            document.querySelector('.transportation-options').classList.add('d-none');
            document.querySelector('.lawncare-options').classList.add('d-none');
            document.getElementById('finalPriceBreakdown').innerHTML = '';
            document.getElementById('finalTotalPrice').textContent = '$0.00';
            document.getElementById('imagePreviewContainer').innerHTML = '';
            uploadedImages = [];
        }
    });

    // Initialize form
    showStep(currentStep);
});
