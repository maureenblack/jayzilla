document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerError = document.getElementById('registerError');

    // Toggle password visibility
    function togglePasswordVisibility(button, input) {
        button.addEventListener('click', function() {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle eye icon
            const eyeIcon = this.querySelector('i');
            eyeIcon.classList.toggle('fa-eye');
            eyeIcon.classList.toggle('fa-eye-slash');
        });
    }

    togglePasswordVisibility(togglePasswordBtn, passwordInput);
    togglePasswordVisibility(toggleConfirmPasswordBtn, confirmPasswordInput);

    // Form validation
    function validatePassword(password) {
        const minLength = 8;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        return password.length >= minLength && hasLetter && hasNumber;
    }

    function validatePhone(phone) {
        // Basic phone validation - can be enhanced based on your requirements
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return phoneRegex.test(phone);
    }

    function showError(message) {
        registerError.textContent = message;
        registerError.classList.remove('d-none');
    }

    function hideError() {
        registerError.classList.add('d-none');
    }

    // Form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();

        // Get form values
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!fullName || !email || !phone || !password || !confirmPassword) {
            showError('Please fill in all fields');
            return;
        }

        if (!validatePassword(password)) {
            showError('Password must be at least 8 characters long with letters and numbers');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (!validatePhone(phone)) {
            showError('Please enter a valid phone number');
            return;
        }

        if (!agreeTerms) {
            showError('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        submitBtn.disabled = true;
        btnText.textContent = 'Creating Account...';
        spinner.classList.remove('d-none');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Store registration data (temporary - should be handled by backend)
            const userData = {
                fullName,
                email,
                phone,
                registrationDate: new Date().toISOString()
            };
            localStorage.setItem('pendingUser', JSON.stringify(userData));

            // Replace form with success message
            const formWrapper = document.querySelector('.login-box');
            formWrapper.innerHTML = `
                <div class="text-center">
                    <div class="success-icon mb-4">
                        <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                    </div>
                    <h3 class="mb-3">Account Created Successfully!</h3>
                    <p class="lead mb-4">Thank you for registering with Jayzilla!</p>
                    <div class="card mb-4">
                        <div class="card-body text-start">
                            <h5 class="card-title mb-3">Account Information</h5>
                            <div class="mb-2">
                                <strong><i class="fas fa-user me-2"></i>Name:</strong>
                                <span class="ms-2">${fullName}</span>
                            </div>
                            <div class="mb-2">
                                <strong><i class="fas fa-envelope me-2"></i>Email:</strong>
                                <span class="ms-2">${email}</span>
                            </div>
                            <div class="mb-2">
                                <strong><i class="fas fa-phone me-2"></i>Phone:</strong>
                                <span class="ms-2">${phone}</span>
                            </div>
                        </div>
                    </div>
                    <div class="next-steps mb-4">
                        <h5 class="mb-3">Next Steps:</h5>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <p class="mb-2">Please proceed to login using:</p>
                            <ul class="text-start mb-0">
                                <li>Your registered email address</li>
                                <li>The password you just created</li>
                            </ul>
                        </div>
                    </div>
                    <div class="mt-4">
                        <button onclick="window.location.href='login.html'" class="btn btn-primary btn-lg">
                            <i class="fas fa-sign-in-alt me-2"></i>Proceed to Login
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            showError('An error occurred. Please try again.');
            
            // Reset button state
            submitBtn.disabled = false;
            btnText.textContent = 'Create Account';
            spinner.classList.add('d-none');
        }
    });
});
