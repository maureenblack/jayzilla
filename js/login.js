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
        btnText.textContent = 'Verifying...';
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

                // Move pending user to registered user if exists
                if (userData) {
                    localStorage.setItem('registeredUser', pendingUserData);
                    localStorage.removeItem('pendingUser');
                }

                // Get first name (limited to 20 characters)
                const firstName = userData ? 
                    userData.fullName.split(' ')[0].substring(0, 20) : 
                    'User';

                // Replace form with welcome message
                const loginBox = document.querySelector('.login-box');
                loginBox.innerHTML = `
                    <div class="text-center">
                        <div class="success-icon mb-4">
                            <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                        </div>
                        <h3 class="text-dark mb-3">Welcome Back, ${firstName}!</h3>
                        <p class="text-dark lead mb-4">Login successful</p>
                        <div class="card mb-4">
                            <div class="card-body">
                                <h5 class="card-title mb-3">What would you like to do?</h5>
                                <div class="d-grid gap-3">
                                    <a href="dashboard.html" class="btn btn-primary">
                                        <i class="fas fa-columns me-2"></i>Go to Dashboard
                                    </a>
                                    <a href="service-request.html" class="btn btn-outline-primary">
                                        <i class="fas fa-tools me-2"></i>Request a Service
                                    </a>
                                    <a href="index.html" class="btn btn-outline-secondary">
                                        <i class="fas fa-home me-2"></i>Return to Home
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

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
        const params = new URLSearchParams(window.location.search);
        const isLoggingOut = params.get('logout') === 'true';
        const isLoginAction = params.get('action') === 'login';
        
        // Only redirect to dashboard if user is logged in AND not logging out AND not explicitly trying to login
        if (isLoggedIn === 'true' && !isLoggingOut && !isLoginAction) {
            window.location.replace('dashboard.html');
        }
    }

    // Check login state on page load
    checkLoginState();
});
