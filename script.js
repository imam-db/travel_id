// Travel Expense Manager - Main JavaScript File

// Global app state
const appState = {
    currentUser: {
        name: 'John Doe',
        email: 'john.doe@company.com',
        department: 'Sales',
        budget: 15000000,
        used: 8500000
    },
    currentPage: 'dashboard',
    isOnline: navigator.onLine
};

// Authentication check
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname;
    
    if (!isLoggedIn && !currentPage.includes('login.html')) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (isLoggedIn && currentPage.includes('login.html')) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// PWA Installation
let deferredPrompt;
let installButton;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
});

function showInstallPromotion() {
    // Show install button or banner
    console.log('PWA install prompt available');
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateAvailable();
                        }
                    });
                });
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

function showUpdateAvailable() {
    if (confirm('A new version is available. Reload to update?')) {
        window.location.reload();
    }
}

// Online/Offline status
window.addEventListener('online', () => {
    appState.isOnline = true;
    showNotification('You are back online!', 'success');
    syncOfflineData();
});

window.addEventListener('offline', () => {
    appState.isOnline = false;
    showNotification('You are offline. Changes will be synced when online.', 'warning');
});

function syncOfflineData() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('expense-sync');
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    if (!checkAuthentication()) {
        return;
    }
    
    // Load user data from localStorage if available
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        appState.currentUser.email = userEmail;
    }
    
    // Update user info in header
    updateUserInfo();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize page-specific features
    const currentPage = getCurrentPage();
    switch(currentPage) {
        case 'index':
            initializeDashboard();
            break;
        case 'mwp':
            initializeMWP();
            break;
        case 'expenses':
            initializeExpenses();
            break;
        case 'approvals':
            initializeApprovals();
            break;
        case 'profile':
            initializeProfile();
            break;
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().split('.')[0];
    return filename || 'index';
}

function updateUserInfo() {
    const userInfoElements = document.querySelectorAll('.user-info span');
    userInfoElements.forEach(element => {
        if (element.textContent.includes('Hello,')) {
            element.textContent = `Hello, ${appState.currentUser.name}`;
        }
    });
}

function initializeNavigation() {
    // Add click handlers for navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

// Dashboard specific functions
function initializeDashboard() {
    // Initialize quick action buttons
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', function() {
            const actionType = this.querySelector('span').textContent;
            handleQuickAction(actionType);
        });
    });
    
    // Initialize recent activities
    loadRecentActivities();
    
    // Initialize weekly schedule
    loadWeeklySchedule();
}

function handleQuickAction(actionType) {
    switch(actionType) {
        case 'New MWP':
            window.location.href = 'mwp.html';
            break;
        case 'Add Expense':
            window.location.href = 'expenses.html';
            break;
        case 'View Reports':
            window.location.href = 'expenses.html';
            break;
        case 'Approvals':
            window.location.href = 'approvals.html';
            break;
        default:
            showNotification('Feature coming soon!', 'info');
    }
}

function loadRecentActivities() {
    // Simulate loading recent activities
    const activities = [
        {
            type: 'expense',
            title: 'Expense Report Approved',
            description: 'Jakarta Trip - $2,450',
            time: '2 hours ago',
            icon: 'fas fa-check-circle',
            status: 'success'
        },
        {
            type: 'mwp',
            title: 'MWP Submitted',
            description: 'March 2024 Monthly Plan',
            time: '1 day ago',
            icon: 'fas fa-calendar-alt',
            status: 'pending'
        },
        {
            type: 'expense',
            title: 'New Expense Added',
            description: 'Hotel booking - $850',
            time: '2 days ago',
            icon: 'fas fa-plus-circle',
            status: 'info'
        }
    ];
    
    // Update recent activities section if it exists
    const activitiesContainer = document.querySelector('.recent-activities .activity-list');
    if (activitiesContainer) {
        activitiesContainer.innerHTML = activities.map(activity => `
            <div class="activity-item ${activity.status}">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }
}

function loadWeeklySchedule() {
    // Simulate loading weekly schedule
    const schedule = [
        { day: 'Mon', date: '4', trips: 0, status: 'free' },
        { day: 'Tue', date: '5', trips: 1, status: 'busy', trip: 'Jakarta Meeting' },
        { day: 'Wed', date: '6', trips: 1, status: 'busy', trip: 'Jakarta Meeting' },
        { day: 'Thu', date: '7', trips: 0, status: 'free' },
        { day: 'Fri', date: '8', trips: 1, status: 'busy', trip: 'Surabaya Training' },
        { day: 'Sat', date: '9', trips: 0, status: 'weekend' },
        { day: 'Sun', date: '10', trips: 0, status: 'weekend' }
    ];
    
    const scheduleContainer = document.querySelector('.schedule-grid');
    if (scheduleContainer) {
        scheduleContainer.innerHTML = schedule.map(day => `
            <div class="schedule-day ${day.status}">
                <div class="day-header">
                    <span class="day-name">${day.day}</span>
                    <span class="day-date">${day.date}</span>
                </div>
                <div class="day-content">
                    ${day.trips > 0 ? `<div class="trip-indicator">${day.trip}</div>` : '<div class="no-trips">No trips</div>'}
                </div>
            </div>
        `).join('');
    }
}

// MWP specific functions
function initializeMWP() {
    // Initialize MWP form if exists
    const mwpForm = document.querySelector('#mwpForm');
    if (mwpForm) {
        mwpForm.addEventListener('submit', handleMWPSubmit);
    }
    
    // Initialize file upload
    const fileUpload = document.querySelector('#excelUpload');
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }
}

function handleMWPSubmit(e) {
    e.preventDefault();
    showNotification('MWP submitted successfully!', 'success');
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        showNotification(`File ${file.name} uploaded successfully!`, 'success');
    }
}

// Expenses specific functions
function initializeExpenses() {
    // Initialize expense filters
    initializeExpenseFilters();
}

function initializeExpenseFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const periodFilter = document.getElementById('periodFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) statusFilter.addEventListener('change', filterExpenses);
    if (periodFilter) periodFilter.addEventListener('change', filterExpenses);
    if (searchInput) searchInput.addEventListener('input', filterExpenses);
}

function filterExpenses() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const periodFilter = document.getElementById('periodFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const cards = document.querySelectorAll('.expense-card');
    
    cards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        const cardPeriod = card.getAttribute('data-period');
        const cardText = card.textContent.toLowerCase();
        
        let showCard = true;
        
        // Status filter
        if (statusFilter !== 'all' && cardStatus !== statusFilter) {
            showCard = false;
        }
        
        // Period filter
        if (periodFilter !== 'all' && cardPeriod !== periodFilter) {
            showCard = false;
        }
        
        // Search filter
        if (searchTerm && !cardText.includes(searchTerm)) {
            showCard = false;
        }
        
        card.style.display = showCard ? 'block' : 'none';
    });
}

// Approvals specific functions
function initializeApprovals() {
    // Initialize approval tabs
    initializeApprovalTabs();
}

function initializeApprovalTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabType = this.textContent.toLowerCase().includes('mwp') ? 'mwp' : 
                           this.textContent.toLowerCase().includes('expense') ? 'expense' :
                           this.textContent.toLowerCase().includes('urgent') ? 'urgent' : 'all';
            showApprovalTab(tabType);
        });
    });
}

function showApprovalTab(tabType) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter cards
    const cards = document.querySelectorAll('.approval-card');
    cards.forEach(card => {
        if (tabType === 'all') {
            card.style.display = 'block';
        } else if (tabType === 'urgent') {
            card.style.display = card.classList.contains('urgent') ? 'block' : 'none';
        } else {
            card.style.display = card.getAttribute('data-type') === tabType ? 'block' : 'none';
        }
    });
}

// Profile specific functions
function initializeProfile() {
    // Initialize toggle switches
    initializeToggleSwitches();
}

function initializeToggleSwitches() {
    const toggles = document.querySelectorAll('.toggle-switch input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const settingName = this.closest('.setting-item').querySelector('.setting-title').textContent;
            const isEnabled = this.checked;
            showNotification(`${settingName} ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
        });
    });
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function closeNotification(button) {
    const notification = button.closest('.notification');
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
}

// Common action handlers
function createNewExpense() {
    showNotImplementedPopup('Create New Expense');
}

function createNewMWP() {
    showNotImplementedPopup('Create New MWP');
}

function exportData() {
    showNotImplementedPopup('Export Data');
}

// Show not implemented popup
function showNotImplementedPopup(featureName) {
    const popup = document.createElement('div');
    popup.className = 'not-implemented-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <i class="fas fa-tools"></i>
                <h3>Feature Under Development</h3>
            </div>
            <div class="popup-body">
                <p><strong>${featureName}</strong> is not yet implemented.</p>
                <p>This feature will be available in the next version.</p>
            </div>
            <div class="popup-footer">
                <button onclick="closeNotImplementedPopup()" class="btn-primary">OK</button>
            </div>
        </div>
        <div class="popup-overlay" onclick="closeNotImplementedPopup()"></div>
    `;
    
    document.body.appendChild(popup);
    
    // Add CSS if not already added
    if (!document.querySelector('#popup-styles')) {
        const style = document.createElement('style');
        style.id = 'popup-styles';
        style.textContent = `
            .not-implemented-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .popup-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
            }
            .popup-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                position: relative;
                z-index: 1;
                animation: popupSlideIn 0.3s ease-out;
            }
            .popup-header {
                padding: 20px 20px 10px;
                text-align: center;
                border-bottom: 1px solid #eee;
            }
            .popup-header i {
                font-size: 2rem;
                color: #ff9800;
                margin-bottom: 10px;
            }
            .popup-header h3 {
                margin: 0;
                color: #333;
                font-size: 1.2rem;
            }
            .popup-body {
                padding: 20px;
                text-align: center;
            }
            .popup-body p {
                margin: 10px 0;
                color: #666;
                line-height: 1.5;
            }
            .popup-footer {
                padding: 10px 20px 20px;
                text-align: center;
            }
            .btn-primary {
                background: #2196F3;
                color: white;
                border: none;
                padding: 10px 30px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.3s;
            }
            .btn-primary:hover {
                background: #1976D2;
            }
            @keyframes popupSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function closeNotImplementedPopup() {
    const popup = document.querySelector('.not-implemented-popup');
    if (popup) {
        popup.remove();
    }
}

function viewMWP(url) {
    window.location.href = url;
}

function editMWP(id) {
    showNotification(`Editing MWP ${id}`, 'info');
}

function deleteMWP(id) {
    if (confirm('Are you sure you want to delete this MWP?')) {
        showNotification(`MWP ${id} deleted`, 'success');
    }
}

function viewExpense(url) {
    window.location.href = url;
}

function exportReports() {
    showNotification('Export feature coming soon!', 'info');
}

function viewApproval(url) {
    window.location.href = url;
}

function approveItem(event, itemId) {
    event.stopPropagation();
    if (confirm('Are you sure you want to approve this item?')) {
        showNotification(`Item ${itemId} approved!`, 'success');
    }
}

function rejectItem(event, itemId) {
    event.stopPropagation();
    const reason = prompt('Enter rejection reason:');
    if (reason) {
        showNotification(`Item ${itemId} rejected: ${reason}`, 'warning');
    }
}

function addComment(event, itemId) {
    event.stopPropagation();
    const comment = prompt('Enter your comment:');
    if (comment) {
        showNotification(`Comment added to item ${itemId}`, 'info');
    }
}

// Profile action handlers
function changePhoto() {
    showNotification('Photo change feature coming soon!', 'info');
}

function editPersonalInfo() {
    showNotification('Edit personal info feature coming soon!', 'info');
}

function editTravelPrefs() {
    showNotification('Edit travel preferences feature coming soon!', 'info');
}

function changePassword() {
    showNotification('Change password feature coming soon!', 'info');
}

function enable2FA() {
    showNotification('Two-Factor Authentication feature coming soon!', 'info');
}

function viewLoginHistory() {
    showNotification('Login history feature coming soon!', 'info');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('You have been logged out!', 'info');
        // Redirect to login page would go here
        // window.location.href = 'login.html';
    }
}

// Add notification styles to head
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 1000;
    border-left: 4px solid #667eea;
}

.notification.show {
    transform: translateX(0);
}

.notification.success {
    border-left-color: #28a745;
}

.notification.error {
    border-left-color: #dc3545;
}

.notification.warning {
    border-left-color: #ffc107;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification-content i {
    color: #667eea;
}

.notification.success .notification-content i {
    color: #28a745;
}

.notification.error .notification-content i {
    color: #dc3545;
}

.notification.warning .notification-content i {
    color: #ffc107;
}

.notification-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 5px;
}

.notification-close:hover {
    color: #666;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);