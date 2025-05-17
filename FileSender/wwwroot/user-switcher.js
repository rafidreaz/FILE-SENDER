// Create and initialize the user switcher component
function initializeUserSwitcher() {
    // Get the container
    const container = document.getElementById('user-switcher-container');
    if (!container) {
        console.error('User switcher container not found');
        return;
    }

    // Create the user switcher
    const userSwitcher = document.createElement('div');
    userSwitcher.className = 'user-switcher';

    // Create the current user display
    const currentUserDisplay = document.createElement('div');
    currentUserDisplay.id = 'current-user-display';
    const currentUser = receivers.find(u => u.id === window.currentUserId);
    currentUserDisplay.innerHTML = `
        <strong>Current User:</strong><br>
        ${currentUser ? currentUser.name : 'Unknown'}<br>
        <small>${currentUser ? currentUser.designation : ''}</small>
    `;

    // Create the user select dropdown
    const userSelect = document.createElement('select');
    userSelect.className = 'user-select';

    // Add users to dropdown
    receivers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.designation})`;
        if (user.id === window.currentUserId) {
            option.selected = true;
        }
        userSelect.appendChild(option);
    });

    // Handle user change
    userSelect.addEventListener('change', async (e) => {
        const newUserId = parseInt(e.target.value);
        const success = await setCurrentUserId(newUserId);
        
        if (success) {
            // Update the current user display
            const selectedUser = receivers.find(u => u.id === newUserId);
            currentUserDisplay.innerHTML = `
                <strong>Current User:</strong><br>
                ${selectedUser ? selectedUser.name : 'Unknown'}<br>
                <small>${selectedUser ? selectedUser.designation : ''}</small>
            `;
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'User switched successfully!';
            successMessage.style.cssText = `
                color: #28a745;
                font-size: 12px;
                margin-top: 5px;
                text-align: center;
            `;
            userSwitcher.appendChild(successMessage);
            setTimeout(() => successMessage.remove(), 2000);
        }
    });

    // Assemble the component
    userSwitcher.appendChild(currentUserDisplay);
    userSwitcher.appendChild(userSelect);

    // Add to container
    container.appendChild(userSwitcher);
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeUserSwitcher); 