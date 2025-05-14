// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const selectBtn = document.getElementById('select-btn');
const clearBtn = document.getElementById('clear-btn');
const sendBtn = document.getElementById('send-btn');
const filesContainer = document.getElementById('files-container');

// Global Variables
let selectedFiles = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', init);

function init() {
    // File selection button click
    selectBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop events
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);

    // Clear button click
    clearBtn.addEventListener('click', clearAllFiles);

    // Send button click
    sendBtn.addEventListener('click', sendFiles);
}

// File Handling Functions
function handleFileSelect(e) {
    const files = e.target.files;
    addFilesToList(files);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.style.borderColor = 'var(--primary-lighter)';
    dropArea.style.backgroundColor = 'rgba(26, 75, 140, 0.1)';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.style.borderColor = 'var(--primary-color)';
    dropArea.style.backgroundColor = '';
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.style.borderColor = 'var(--primary-color)';
    dropArea.style.backgroundColor = '';
    
    const files = e.dataTransfer.files;
    addFilesToList(files);
}

function addFilesToList(files) {
    if (files.length === 0) return;
    
    Array.from(files).forEach(file => {
        // Check if file is already in the list
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            return;
        }
        
        selectedFiles.push(file);
        
        // Create file list item
        const fileItem = document.createElement('li');
        fileItem.className = 'file-item';
        fileItem.dataset.fileName = file.name;
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeFile(file.name));
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        filesContainer.appendChild(fileItem);
    });
    
    // Reset the file input
    fileInput.value = '';
    
    // Update UI based on file list
    updateUI();
}

function removeFile(fileName) {
    selectedFiles = selectedFiles.filter(file => file.name !== fileName);
    
    const fileItem = document.querySelector(`.file-item[data-file-name="${fileName}"]`);
    if (fileItem) {
        // Add remove animation
        fileItem.style.opacity = '0';
        fileItem.style.height = '0';
        
        setTimeout(() => {
            fileItem.remove();
            updateUI();
        }, 300);
    }
}

function clearAllFiles() {
    selectedFiles = [];
    
    // Get all file items
    const fileItems = document.querySelectorAll('.file-item');
    
    // Add fade out animation to all items
    fileItems.forEach(item => {
        item.style.opacity = '0';
        item.style.height = '0';
    });
    
    // Remove after animation
    setTimeout(() => {
        filesContainer.innerHTML = '';
        updateUI();
    }, 300);
}

function updateUI() {
    // Enable/disable buttons based on file selection
    if (selectedFiles.length > 0) {
        clearBtn.disabled = false;
        sendBtn.disabled = false;
    } else {
        clearBtn.disabled = true;
        sendBtn.disabled = true;
    }
}

function sendFiles() {
    // Animation for send button
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;
    
    // Simulate sending files (would be replaced with actual API call)
    setTimeout(() => {
        // Success animation
        sendBtn.textContent = 'Sent!';
        sendBtn.style.backgroundColor = '#28a745';
        
        // Reset after 2 seconds
        setTimeout(() => {
            sendBtn.textContent = 'Send Files';
            sendBtn.style.backgroundColor = '';
            sendBtn.disabled = false;
            
            // Clear files after successful send
            clearAllFiles();
        }, 2000);
    }, 1500);
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}