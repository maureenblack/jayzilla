const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Load user data and service requests
    loadUserData();
    loadServiceRequests();

    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('statusFilter').addEventListener('change', loadServiceRequests);
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
});

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
