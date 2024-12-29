document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
        const eyeIcon = this.querySelector('i');
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    });

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Basic validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Email validation
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        submitBtn.disabled = true;
        btnText.textContent = 'Logging in...';
        spinner.classList.remove('d-none');
        hideError();

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Get pending user data if available
            const pendingUserData = localStorage.getItem('pendingUser');
            let userData = null;
            
            if (pendingUserData) {
                userData = JSON.parse(pendingUserData);
            }

            // For demo purposes, check if email matches registered email or contains "admin"
            if ((userData && email === userData.email) || email.includes('admin')) {
                // Store login state
                if (rememberMe) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userEmail', email);
                } else {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userEmail', email);
                }

                // Move pending user to registered user
                if (userData) {
                    localStorage.setItem('registeredUser', pendingUserData);
                    localStorage.removeItem('pendingUser');
                }

                // Show welcome back message
                const loginBox = document.querySelector('.login-box');
                loginBox.innerHTML = `
                    <div class="text-center">
                        <div class="success-icon mb-4">
                            <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                        </div>
                        <h3 class="mb-3">Welcome Back${userData ? ', ' + userData.fullName : ''}!</h3>
                        <p class="lead mb-4">You have successfully logged in.</p>
                        <div class="spinner-border text-primary mb-4" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p>Redirecting to dashboard...</p>
                    </div>
                `;

                // Redirect to dashboard after showing welcome message
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                showError('Invalid email or password');
                submitBtn.disabled = false;
                btnText.textContent = 'Login';
                spinner.classList.add('d-none');
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
            submitBtn.disabled = false;
            btnText.textContent = 'Login';
            spinner.classList.add('d-none');
        }
    });

    // Helper functions
    function showError(message) {
        loginError.textContent = message;
        loginError.classList.remove('d-none');
    }

    function hideError() {
        loginError.classList.add('d-none');
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Check if user is already logged in
    function checkLoginState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            window.location.href = 'dashboard.html';
        }
    }

    // Check login state on page load
    checkLoginState();
});
