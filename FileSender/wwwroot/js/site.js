// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const fileInput = document.getElementById('file-input');
    const filesContainer = document.getElementById('files-container');
    const dropArea = document.getElementById('drop-area');
    const receiverCards = document.querySelectorAll('.receiver-card');
    const searchMyFiles = document.getElementById('search-my-files');
    const searchSharedFiles = document.getElementById('search-shared-files');
    
    // File input change event
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Drag and drop events
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
    }
    
    // Search functionality
    if (searchMyFiles) {
        searchMyFiles.addEventListener('input', function() {
            filterFiles('saved-files-container', this.value);
        });
    }
    
    if (searchSharedFiles) {
        searchSharedFiles.addEventListener('input', function() {
            filterFiles('shared-files-container', this.value);
        });
    }
    
    // Receiver card selection
    receiverCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
            }
        });
    });
    
    // Utility Functions
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file) {
            fileInput.files = dt.files;
            handleFileSelect({target: fileInput});
        }
    }
    
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        filesContainer.innerHTML = '';
        
        const fileItem = document.createElement('li');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" class="remove-file" onclick="clearSelectedFile()">Remove</button>
        `;
        
        filesContainer.appendChild(fileItem);
    }
});

// Global functions
function clearSelectedFile() {
    const fileInput = document.getElementById('file-input');
    const filesContainer = document.getElementById('files-container');
    
    fileInput.value = '';
    filesContainer.innerHTML = '';
}

function filterFiles(containerId, searchText) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const cards = container.querySelectorAll('.saved-file-card, .shared-file-card');
    const searchLower = searchText.toLowerCase();
    
    cards.forEach(card => {
        const fileName = card.dataset.filename ? card.dataset.filename.toLowerCase() : '';
        if (fileName.includes(searchLower)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 