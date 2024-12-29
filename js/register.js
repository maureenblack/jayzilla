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
            localStorage.setItem('registeredUser', JSON.stringify({
                fullName,
                email,
                phone
            }));

            // Redirect to login page
            window.location.href = 'login.html?registered=true';
        } catch (error) {
            showError('An error occurred. Please try again.');
            
            // Reset button state
            submitBtn.disabled = false;
            btnText.textContent = 'Create Account';
            spinner.classList.add('d-none');
        }
    });
});
