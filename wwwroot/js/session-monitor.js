// Session monitoring script
let sessionTimeoutWarningShown = false;
let sessionTimeoutMinutes = 10;
let warningBeforeTimeoutMinutes = 1;
let checkInterval = 30000; // Check every 30 seconds

// Function to ping the server and update the session activity
function updateActivity() {
    fetch('/api/FilesApi/updateActivity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    }).catch(error => console.error('Error updating activity:', error));
}

// Function to show session timeout warning
function showSessionTimeoutWarning() {
    if (!sessionTimeoutWarningShown) {
        sessionTimeoutWarningShown = true;
        
        const warningDiv = document.createElement('div');
        warningDiv.className = 'session-timeout-warning';
        warningDiv.innerHTML = `
            <div class="session-timeout-content">
                <h3>Session Timeout Warning</h3>
                <p>Your session will expire in less than ${warningBeforeTimeoutMinutes} minute(s).</p>
                <button id="extend-session-btn" class="btn primary-btn">Extend Session</button>
            </div>
        `;
        
        document.body.appendChild(warningDiv);
        
        document.getElementById('extend-session-btn').addEventListener('click', function() {
            updateActivity();
            warningDiv.remove();
            sessionTimeoutWarningShown = false;
        });
    }
}

// Initialize session monitoring
let lastActivity = new Date();

// Update activity on user interactions
function setupActivityTracking() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
        document.addEventListener(event, function() {
            lastActivity = new Date();
            
            // If warning is showing and user is active, automatically extend
            if (sessionTimeoutWarningShown) {
                updateActivity();
                document.querySelector('.session-timeout-warning')?.remove();
                sessionTimeoutWarningShown = false;
            }
        }, true);
    });
}

// Periodically check session status
function startSessionMonitoring() {
    setInterval(() => {
        const now = new Date();
        const timeSinceLastActivity = (now - lastActivity) / 1000 / 60; // in minutes
        
        // If user has been active recently, update the server
        if (timeSinceLastActivity < 2) {
            updateActivity();
        }
        
        // Show warning before timeout
        if (timeSinceLastActivity >= (sessionTimeoutMinutes - warningBeforeTimeoutMinutes) && 
            timeSinceLastActivity < sessionTimeoutMinutes) {
            showSessionTimeoutWarning();
        }
        
        // Redirect to login if session has expired
        if (timeSinceLastActivity >= sessionTimeoutMinutes) {
            window.location.href = '/Auth/Logout';
        }
    }, checkInterval);
    
    // Initial activity update
    updateActivity();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupActivityTracking();
    startSessionMonitoring();
}); 