const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize user data
    const userData = JSON.parse(localStorage.getItem('registeredUser') || '{}');
    document.getElementById('userName').textContent = userData.fullName || 'User';

    // Create and append overlay for mobile
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Sidebar toggle functionality
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    
    function toggleSidebar() {
        const isMobile = window.innerWidth < 992;
        
        if (isMobile) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        } else {
            sidebar.classList.toggle('collapsed');
        }
    }

    sidebarCollapse.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const isMobile = window.innerWidth < 992;
            if (!isMobile && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }, 250);
    });

    // Tab navigation
    const tabLinks = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Remove active class from all sidebar links
            document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
            
            // Add active class to current link's parent li
            this.closest('li')?.classList.add('active');

            // On mobile, close sidebar when a link is clicked
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Logout functionality
    function handleLogout() {
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    }

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('topLogoutBtn').addEventListener('click', handleLogout);

    // Profile form handling with image upload
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        // Populate profile form with user data
        document.getElementById('profileName').value = userData.fullName || '';
        document.getElementById('profileEmail').value = userData.email || '';
        document.getElementById('profilePhone').value = userData.phone || '';
        document.getElementById('profileAddress').value = userData.address || '';

        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const updatedUserData = {
                ...userData,
                fullName: document.getElementById('profileName').value,
                email: document.getElementById('profileEmail').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value
            };

            // Save updated user data
            localStorage.setItem('registeredUser', JSON.stringify(updatedUserData));
            document.getElementById('userName').textContent = updatedUserData.fullName;

            // Show success toast instead of alert
            showToast('Profile updated successfully!', 'success');
        });
    }

    // Settings form handling
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showToast('Please fill in all password fields', 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                showToast('New passwords do not match!', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showToast('Password must be at least 8 characters long', 'error');
                return;
            }

            // Here you would typically verify the current password with the backend
            showToast('Password updated successfully!', 'success');
            settingsForm.reset();
        });
    }

    // Notification settings with improved feedback
    const saveNotificationSettings = document.getElementById('saveNotificationSettings');
    if (saveNotificationSettings) {
        // Load saved preferences
        const savedSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{"email":true,"sms":true}');
        document.getElementById('emailNotifications').checked = savedSettings.email;
        document.getElementById('smsNotifications').checked = savedSettings.sms;

        saveNotificationSettings.addEventListener('click', function() {
            const emailNotifications = document.getElementById('emailNotifications').checked;
            const smsNotifications = document.getElementById('smsNotifications').checked;

            localStorage.setItem('notificationSettings', JSON.stringify({
                email: emailNotifications,
                sms: smsNotifications
            }));

            showToast('Notification settings saved!', 'success');
        });
    }

    // Toast notification system
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} show`;
        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1060;';
        document.body.appendChild(container);
        return container;
    }

    // Enhanced service table functionality
    function populateServiceTable(tableId, services) {
        const table = document.getElementById(tableId);
        if (!table) return;

        table.innerHTML = services.map(service => `
            <tr>
                <td>${service.id}</td>
                <td>${service.type}</td>
                <td>${formatDate(service.date)}</td>
                <td><span class="badge badge-${service.status.toLowerCase()}">${service.status}</span></td>
                ${tableId === 'allServicesTable' ? `<td class="text-truncate" style="max-width: 150px;" title="${service.description}">${service.description}</td>` : ''}
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="viewServiceDetails('${service.id}')">
                            <i class="fas fa-eye"></i>
                            <span class="d-none d-md-inline ms-1">View</span>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="downloadServiceReport('${service.id}')">
                            <i class="fas fa-download"></i>
                            <span class="d-none d-md-inline ms-1">Report</span>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Initialize tables with mock data
    const mockServices = [
        {
            id: 'SRV001',
            type: 'Lawn Mowing',
            date: '2024-01-15',
            status: 'Pending',
            description: 'Weekly lawn maintenance - front and back yard'
        },
        {
            id: 'SRV002',
            type: 'Transportation',
            date: '2024-01-10',
            status: 'Completed',
            description: 'Airport pickup and drop-off service'
        },
        {
            id: 'SRV003',
            type: 'Lawn Mowing',
            date: '2024-01-20',
            status: 'Scheduled',
            description: 'Lawn mowing and edge trimming for large backyard'
        },
        {
            id: 'SRV004',
            type: 'Transportation',
            date: '2024-01-25',
            status: 'Pending',
            description: 'City tour transportation service'
        }
    ];

    populateServiceTable('recentServicesTable', mockServices.slice(0, 3));
    populateServiceTable('allServicesTable', mockServices);

    // Update service type counters
    function animateCounter(element, target) {
        const duration = 1000;
        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;

        const animate = () => {
            current += increment;
            element.textContent = Math.round(current);
            
            if (increment > 0 ? current < target : current > target) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target;
            }
        };

        animate();
    }

    animateCounter(
        document.getElementById('lawnServicesCount'),
        mockServices.filter(s => s.type === 'Lawn Mowing').length
    );
    animateCounter(
        document.getElementById('transportServicesCount'),
        mockServices.filter(s => s.type === 'Transportation').length
    );
    animateCounter(
        document.getElementById('activeServicesCount'),
        mockServices.filter(s => s.status === 'Pending' || s.status === 'Scheduled').length
    );
    animateCounter(
        document.getElementById('completedServicesCount'),
        mockServices.filter(s => s.status === 'Completed').length
    );

    // Global functions for service actions
    window.viewServiceDetails = function(serviceId) {
        // Show service details in a modal
        showToast(`Viewing details for service ${serviceId}`, 'info');
    };

    window.downloadServiceReport = function(serviceId) {
        // Simulate report download
        showToast(`Downloading report for service ${serviceId}`, 'info');
    };

    async function loadUserData() {
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load user data');
            }

            const user = await response.json();
            document.getElementById('userName').textContent = user.name;
            document.getElementById('profileName').value = user.name;
            document.getElementById('profileEmail').value = user.email;
            document.getElementById('profilePhone').value = user.phone;
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function loadServiceRequests() {
        try {
            const statusFilter = document.getElementById('statusFilter').value;
            const url = statusFilter 
                ? `${API_URL}/service-requests?status=${statusFilter}`
                : `${API_URL}/service-requests`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load service requests');
            }

            const requests = await response.json();
            updateDashboardStats(requests);
            populateRequestsTable(requests);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function updateDashboardStats(requests) {
        const pendingCount = requests.filter(r => r.status === 'pending').length;
        const completedCount = requests.filter(r => r.status === 'completed').length;
        const totalSpent = requests
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + r.price, 0);

        document.getElementById('pendingRequests').textContent = pendingCount;
        document.getElementById('completedRequests').textContent = completedCount;
        document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(2)}`;
    }

    function populateRequestsTable(requests) {
        const tbody = document.getElementById('requestsTableBody');
        tbody.innerHTML = '';

        requests.forEach(request => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="service-info">
                        <span class="service-type">${formatServiceType(request.serviceType)}</span>
                        <small class="text-muted">${truncate(request.taskDetails, 50)}</small>
                    </div>
                </td>
                <td>
                    <div class="date-info">
                        <span>${formatDate(request.serviceDate)}</span>
                        <small class="text-muted">${request.timeSlot}</small>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${request.status}">${formatStatus(request.status)}</span>
                </td>
                <td>$${request.price.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewRequestDetails('${request._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${request.status === 'pending' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="cancelRequest('${request._id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function viewRequestDetails(requestId) {
        try {
            const response = await fetch(`${API_URL}/service-requests/${requestId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load request details');
            }

            const request = await response.json();
            const detailsHtml = `
                <div class="request-details">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h6>Service Type</h6>
                            <p>${formatServiceType(request.serviceType)}</p>
                            
                            <h6>Status</h6>
                            <span class="status-badge status-${request.status}">${formatStatus(request.status)}</span>
                            
                            <h6 class="mt-3">Price</h6>
                            <p>$${request.price.toFixed(2)}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Date & Time</h6>
                            <p>${formatDate(request.serviceDate)} - ${request.timeSlot}</p>
                            
                            <h6>Location</h6>
                            <p>${request.address}</p>
                            
                            <h6>Payment Status</h6>
                            <span class="status-badge status-${request.paymentStatus}">${formatStatus(request.paymentStatus)}</span>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h6>Task Details</h6>
                        <p>${request.taskDetails}</p>
                    </div>
                    
                    ${request.photos.length > 0 ? `
                        <div>
                            <h6>Photos</h6>
                            <div class="request-photos">
                                ${request.photos.map(photo => `
                                    <img src="${photo}" alt="Request photo" class="img-thumbnail">
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            document.getElementById('requestDetails').innerHTML = detailsHtml;
            new bootstrap.Modal(document.getElementById('requestDetailsModal')).show();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function cancelRequest(requestId) {
        if (!confirm('Are you sure you want to cancel this request?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/service-requests/${requestId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cancel request');
            }

            showNotification('Request cancelled successfully', 'success');
            loadServiceRequests();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: document.getElementById('profileName').value,
                    email: document.getElementById('profileEmail').value,
                    phone: document.getElementById('profilePhone').value
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            showNotification('Profile updated successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
            loadUserData();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    // Helper functions
    function formatServiceType(type) {
        return type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    function formatStatus(status) {
        return status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function truncate(str, length) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} notification`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

});
