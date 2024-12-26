const API_URL = 'http://localhost:3000/api';
let stripe;
let elements;
let paypal;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Stripe
    stripe = Stripe('pk_test_51Qa4q3ERUeJN1aRVQXNxWvfNwFgHGJ5J8J0YqZKGZ8J9J0YqZKGZ8J9');
    
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
    const uploadArea = new Dropzone("#uploadArea", {
        url: `${API_URL}/service-request`,
        maxFiles: 5,
        maxFilesize: 5,
        acceptedFiles: "image/*",
        addRemoveLinks: true,
        autoProcessQueue: false,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    // Form step navigation
    const steps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress-bar');
    let currentStep = 0;

    // Next step buttons
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep === 2) {
                    updateSummary();
                }
                steps[currentStep].classList.add('d-none');
                currentStep++;
                steps[currentStep].classList.remove('d-none');
                updateProgress();
            }
        });
    });

    // Previous step buttons
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', () => {
            steps[currentStep].classList.add('d-none');
            currentStep--;
            steps[currentStep].classList.remove('d-none');
            updateProgress();
        });
    });

    // Handle form submission
    document.getElementById('serviceRequestForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
        
        try {
            // Create payment intent
            const price = calculatePrice();
            const { clientSecret } = await fetch(`${API_URL}/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: price })
            }).then(res => res.json());

            // Confirm payment
            const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement('card'),
                    billing_details: {
                        name: document.getElementById('name').value
                    }
                }
            });

            if (paymentError) {
                throw new Error(paymentError.message);
            }

            // Submit form data
            const formData = new FormData(this);
            formData.append('price', price);
            
            // Process uploaded files
            uploadArea.files.forEach(file => {
                formData.append('photos', file);
            });

            const response = await fetch(`${API_URL}/service-request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            showNotification('Service request submitted successfully! Check your email for confirmation.', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
        } catch (error) {
            showNotification(error.message, 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Request';
        }
    });

    // Handle login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: document.getElementById('loginEmail').value,
                    password: document.getElementById('loginPassword').value
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }

            localStorage.setItem('token', data.token);
            window.location.reload();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Handle registration form
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: document.getElementById('registerName').value,
                    email: document.getElementById('registerEmail').value,
                    phone: document.getElementById('registerPhone').value,
                    password
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }

            localStorage.setItem('token', data.token);
            showNotification('Registration successful!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Initialize Stripe Elements
    elements = stripe.elements();
    const card = elements.create('card');
    card.mount('#card-element');

    card.addEventListener('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });

    // Initialize PayPal
    paypal = PayPal;
    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: calculatePrice().toString()
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                handlePaymentSuccess('paypal', details.id);
            });
        }
    }).render('#paypal-button-container');

    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
        input.addEventListener('change', function() {
            document.querySelectorAll('.payment-container').forEach(container => {
                container.classList.add('d-none');
            });
            document.getElementById(`${this.value}Container`).classList.remove('d-none');
        });
    });

    async function handlePaymentSuccess(method, paymentId) {
        try {
            const formData = new FormData(document.getElementById('serviceRequestForm'));
            formData.append('paymentMethod', method);
            formData.append('paymentId', paymentId);
            
            const response = await fetch(`${API_URL}/service-request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            showNotification('Service request submitted successfully! Check your email for confirmation.', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    // Update progress bar
    function updateProgress() {
        const progress = ((currentStep + 1) / steps.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `Step ${currentStep + 1} of ${steps.length}`;
    }

    // Validate each step
    function validateStep(step) {
        const currentStepElement = steps[step];
        const inputs = currentStepElement.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value) {
                isValid = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Calculate price based on service type and inputs
    function calculatePrice() {
        const serviceType = document.getElementById('serviceType').value;
        const priceBreakdown = document.getElementById('priceBreakdown');
        let basePrice = 0;
        let additionalCosts = 0;

        switch(serviceType) {
            case 'local_moving':
                basePrice = 150; // Base price for local moving
                // Add distance calculation here
                break;
            case 'lawn_mowing':
                basePrice = 40; // Base price per yard
                // Add yard size calculation here
                break;
            case 'landscaping':
                basePrice = 200; // Base price for landscaping
                break;
            case 'property_maintenance':
                basePrice = 100; // Base price for maintenance
                break;
        }

        const urgency = document.getElementById('urgency').value;
        if (urgency === 'urgent') {
            additionalCosts = basePrice * 0.2; // 20% urgency fee
        }

        const total = basePrice + additionalCosts;

        // Update price breakdown display
        priceBreakdown.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <span>Base Price:</span>
                <span>$${basePrice.toFixed(2)}</span>
            </div>
            ${additionalCosts > 0 ? `
            <div class="d-flex justify-content-between mb-2">
                <span>Urgency Fee:</span>
                <span>$${additionalCosts.toFixed(2)}</span>
            </div>` : ''}
            <div class="d-flex justify-content-between fw-bold">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        `;
        return total;
    }

    // Update summary before final submission
    function updateSummary() {
        const summary = document.getElementById('requestSummary');
        summary.innerHTML = `
            <div class="summary-item mb-3">
                <strong>Service Type:</strong> ${document.getElementById('serviceType').options[document.getElementById('serviceType').selectedIndex].text}
            </div>
            <div class="summary-item mb-3">
                <strong>Task Details:</strong> ${document.getElementById('taskDetails').value}
            </div>
            <div class="summary-item mb-3">
                <strong>Location:</strong> ${document.getElementById('address').value}
            </div>
            <div class="summary-item mb-3">
                <strong>Date:</strong> ${document.getElementById('serviceDate').value}
            </div>
            <div class="summary-item mb-3">
                <strong>Time Slot:</strong> ${document.getElementById('timeSlot').options[document.getElementById('timeSlot').selectedIndex].text}
            </div>
        `;
        calculatePrice();
    }

    // Notification helper
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '1000';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});
