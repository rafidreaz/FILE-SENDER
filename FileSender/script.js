// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const selectBtn = document.getElementById('select-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const nextBtn = document.getElementById('next-btn');
const sendBtn = document.getElementById('send-btn');
const backBtn = document.getElementById('back-btn');
const filesContainer = document.getElementById('files-container');
const receiversGrid = document.getElementById('receivers-grid');
const searchReceiver = document.getElementById('search-receiver');
const savedFilesContainer = document.getElementById('saved-files-container');
const sharedFilesContainer = document.getElementById('shared-files-container');
const searchSharedFiles = document.getElementById('search-shared-files');

document.getElementById('search-receiver-files').addEventListener('input', filterSavedFiles);
searchSharedFiles.addEventListener('input', filterSharedFiles);

// Page Elements
const fileSelectionPage = document.getElementById('file-selection-page');
const receiverSelectionPage = document.getElementById('receiver-selection-page');
const userId = 2;

// Global Variables
let selectedFiles = [];
let savedFiles = [];
let selectedReceivers = new Set();
let sharedFiles = [];

const receivers = [
    {
        id: 1,
        name: "Ratun",
        designation: "IT Executive",
        ip: "000000000",
        branch: "Dhaka",
        email: "ratun@gmail.com"
    },
    {
        id: 2,
        name: "Fahim",
        designation: "Software Engineer",
        ip: "123456789",
        branch: "Chattogram",
        email: "fahim@example.com"
    },
    {
        id: 3,
        name: "Ayesha",
        designation: "HR Manager",
        ip: "987654321",
        branch: "Khulna",
        email: "ayesha@company.com"
    },
    {
        id: 4,
        name: "Karim",
        designation: "Project Manager",
        ip: "456123789",
        branch: "Sylhet",
        email: "karim@company.com"
    },
    {
        id: 5,
        name: "Tania",
        designation: "Marketing Executive",
        ip: "789321654",
        branch: "Rajshahi",
        email: "tania@company.com"
    },
    {
        id: 6,
        name: "Nayeem",
        designation: "Data Analyst",
        ip: "321654987",
        branch: "Barisal",
        email: "nayeem@company.com"
    },
    {
        id: 7,
        name: "Sadia",
        designation: "Finance Manager",
        ip: "147258369",
        branch: "Cumilla",
        email: "sadia@company.com"
    },
    {
        id: 8,
        name: "Hasib",
        designation: "UI/UX Designer",
        ip: "258369147",
        branch: "Mymensingh",
        email: "hasib@company.com"
    },
    {
        id: 9,
        name: "Mariam",
        designation: "Operations Manager",
        ip: "369147258",
        branch: "Jessore",
        email: "mariam@company.com"
    },
    {
        id: 10,
        name: "Rafi",
        designation: "Network Administrator",
        ip: "654987321",
        branch: "Cox's Bazar",
        email: "rafi@company.com"
    },
    {
        id: 11,
        name: "Imran",
        designation: "Cyber Security Analyst",
        ip: "987321654",
        branch: "Gazipur",
        email: "imran@company.com"
    }
];

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
function filterSavedFiles() {
    const searchInput = document.getElementById('search-receiver-files').value.toLowerCase();
    
    const filtered = savedFiles.filter(file => 
        file.name.toLowerCase().includes(searchInput)
    );

    renderSavedFiles(filtered);
}

function init() {
    // Load saved files from local storage
    loadSavedFiles();
    
    // Load shared files
    loadSharedFiles();
    
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
    
    // Save button click
    saveBtn.addEventListener('click', saveFiles);
    
    // Next button click
    nextBtn.addEventListener('click', () => {
        if (selectedFiles.length > 0) {
            showPage(receiverSelectionPage, fileSelectionPage);
        }
    });
    
    // Back button click
    backBtn.addEventListener('click', () => {
        showPage(fileSelectionPage, receiverSelectionPage);
        selectedReceivers.clear();
        updateReceiverSelection();
    });

    // Send button click
    sendBtn.addEventListener('click', shareFiles);
    
    // Search input event
    searchReceiver.addEventListener('input', filterReceivers);
    
    // Load receivers
    loadReceivers();
}

// Page Navigation
function showPage(pageToShow, pageToHide) {
    // Hide current page
    pageToHide.classList.remove('active');
    
    // Show target page
    setTimeout(() => {
        pageToShow.classList.add('active');
    }, 300);
}

// Saved Files Functions
function loadSavedFiles() {
    // Try to get saved files from local storage
    const storedFiles = localStorage.getItem('savedFiles');
    if (storedFiles) {
        try {
            savedFiles = JSON.parse(storedFiles);
            renderSavedFiles();
        } catch (e) {
            console.error('Error loading saved files:', e);
            savedFiles = [];
        }
    }
}

function saveFiles() {
    if (selectedFiles.length === 0) return;

    const storageKey = `savedFiles_user_${userId}`;

    const newSavedFiles = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
		id: userId
        //id: generateUniqueId()
    }));

    // Load existing saved files for this user
    const existing = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Merge and save
    const updatedFiles = [...existing, ...newSavedFiles];
    localStorage.setItem(storageKey, JSON.stringify(updatedFiles));

    savedFiles = updatedFiles;

    // Feedback animation
    saveBtn.textContent = 'Saved!';
    clearBtn.click();
    saveBtn.style.backgroundColor = '#28a745';

    setTimeout(() => {
        saveBtn.textContent = 'Save Files';
        saveBtn.style.backgroundColor = '';
        renderSavedFiles();
    }, 1500);
}

function renderSavedFiles(filesToRender = null) {
    const storageKey = `savedFiles_user_${userId}`;

    // Only reload from localStorage if not filtering
    if (!filesToRender) {
        const stored = localStorage.getItem(storageKey);
        savedFiles = stored ? JSON.parse(stored) : [];
    }

    const files = filesToRender || savedFiles;

    savedFilesContainer.innerHTML = '';

    if (files.length === 0) {
        const noFiles = document.createElement('p');
        noFiles.className = 'no-files';
        noFiles.textContent = 'No saved files yet.';
        savedFilesContainer.appendChild(noFiles);
        return;
    }

    files.forEach(file => {
        const fileCard = document.createElement('div');
        fileCard.className = 'saved-file-card';
        fileCard.dataset.fileName = file.name;

        const fileInfo = document.createElement('div');
        fileInfo.className = 'saved-file-info';

        // File name
        const fileName = document.createElement('div');
        fileName.className = 'saved-file-name';
        fileName.textContent = file.name;

        // File size
        const fileSize = document.createElement('div');
        fileSize.className = 'saved-file-size';
        fileSize.textContent = formatFileSize(file.size);

        // Delete button
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-saved-file';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSavedFile(file.name);
        });

        // Add all elements in order
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        fileInfo.appendChild(deleteBtn);

        fileCard.appendChild(fileInfo);

        // Check if this file is in selectedFiles and add selected class if it is
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            fileCard.classList.add('selected');
        }

        fileCard.addEventListener('click', () => {
            fileCard.classList.toggle('selected');

            const fileObject = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            };

            if (fileCard.classList.contains('selected')) {
                if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    selectedFiles.push(fileObject);

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

                    updateUI();
                }
            } else {
                removeFile(file.name);
            }
        });

        savedFilesContainer.appendChild(fileCard);
    });
}

function deleteSavedFile(fileId) {
    const storageKey = `savedFiles_user_${userId}`;
    
    // Get current saved files
    const currentSavedFiles = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    // Find the file to be deleted
    const fileToDelete = currentSavedFiles.find(file => file.name === fileId);
    
    if (fileToDelete) {
        // Filter out the file to be deleted
        const updatedFiles = currentSavedFiles.filter(file => file.name !== fileId);
        
        // Update localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
        
        // Update the savedFiles array
        savedFiles = updatedFiles;
        
        // Re-render the saved files
        renderSavedFiles();
        
        // If the file was selected, remove it from selected files
        removeFile(fileId);
    }
}

function loadReceivers(filteredReceivers = receivers) {
    receiversGrid.innerHTML = '';
    
    filteredReceivers.forEach(receiver => {
        if (receiver.id !== userId) {  // Don't show current user
            const receiverCard = document.createElement('div');
            receiverCard.className = `receiver-card ${selectedReceivers.has(receiver.id) ? 'selected' : ''}`;
            receiverCard.innerHTML = `
                <h4>${receiver.name}</h4>
                <p>${receiver.designation}</p>
                <p>${receiver.email}</p>
                <p>${receiver.branch}</p>
            `;
            
            receiverCard.addEventListener('click', () => {
                if (selectedReceivers.has(receiver.id)) {
                    selectedReceivers.delete(receiver.id);
                    receiverCard.classList.remove('selected');
                } else {
                    selectedReceivers.add(receiver.id);
                    receiverCard.classList.add('selected');
                }
                updateSendButtonState();
            });
            
            receiversGrid.appendChild(receiverCard);
        }
    });
}

function filterReceivers() {
    const searchTerm = searchReceiver.value.toLowerCase();

    const filtered = receivers.filter(r => {
        return (
            r.name.toLowerCase().includes(searchTerm) ||
            r.designation.toLowerCase().includes(searchTerm) ||
            r.ip.toLowerCase().includes(searchTerm) ||
            r.branch.toLowerCase().includes(searchTerm) ||
            r.email.toLowerCase().includes(searchTerm)
        );
    });

    loadReceivers(filtered); // reuse loadReceivers to re-render
}

function updateSendButtonState() {
    const hasSelectedReceivers = selectedReceivers.size > 0;
    const hasSelectedFiles = selectedFiles.length > 0;
    
    sendBtn.disabled = !(hasSelectedReceivers && hasSelectedFiles);
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
    // Clear selected files array
    selectedFiles = [];
    
    // Clear the files container
    filesContainer.innerHTML = '';
    
    // Remove selection from all saved file cards
    document.querySelectorAll('.saved-file-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Update UI
    updateUI();
}

function updateUI() {
    // Enable/disable buttons based on file selection
    const hasFiles = selectedFiles.length > 0;
    
    clearBtn.disabled = !hasFiles;
    saveBtn.disabled = !hasFiles;
    nextBtn.disabled = !hasFiles;
    
    updateSendButtonState();
}

function loadSharedFiles() {
    const sharedFilesKey = `sharedFiles_user_${userId}`;
    const storedSharedFiles = localStorage.getItem(sharedFilesKey);
    
    if (storedSharedFiles) {
        try {
            sharedFiles = JSON.parse(storedSharedFiles);
            renderSharedFiles();
        } catch (e) {
            console.error('Error loading shared files:', e);
            sharedFiles = [];
        }
    }
}

function renderSharedFiles(filesToRender = null) {
    const files = filesToRender || sharedFiles;
    sharedFilesContainer.innerHTML = '';

    if (files.length === 0) {
        const noFiles = document.createElement('p');
        noFiles.className = 'no-files';
        noFiles.textContent = 'No shared files yet.';
        sharedFilesContainer.appendChild(noFiles);
        return;
    }

    files.forEach(file => {
        const sharedBy = receivers.find(r => r.id === file.sharedBy);
        const fileCard = document.createElement('div');
        fileCard.className = 'shared-file-card';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'shared-file-info';

        // File name
        const fileName = document.createElement('div');
        fileName.className = 'shared-file-name';
        fileName.textContent = file.name;

        // File size
        const fileSize = document.createElement('div');
        fileSize.className = 'shared-file-size';
        fileSize.textContent = formatFileSize(file.size);

        // Shared by name
        const sharedByName = document.createElement('div');
        sharedByName.className = 'shared-by';
        sharedByName.textContent = sharedBy ? sharedBy.name : 'Unknown';

        // Shared by email
        const sharedByEmail = document.createElement('div');
        sharedByEmail.className = 'shared-by';
        sharedByEmail.textContent = sharedBy ? sharedBy.email : '';

        // Add all elements in order
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        fileInfo.appendChild(sharedByName);
        fileInfo.appendChild(sharedByEmail);

        fileCard.appendChild(fileInfo);
        sharedFilesContainer.appendChild(fileCard);
    });
}

function filterSharedFiles() {
    const searchInput = searchSharedFiles.value.toLowerCase();
    
    const filtered = sharedFiles.filter(file => 
        file.name.toLowerCase().includes(searchInput) ||
        receivers.find(r => r.id === file.sharedBy)?.name.toLowerCase().includes(searchInput) ||
        receivers.find(r => r.id === file.sharedBy)?.email.toLowerCase().includes(searchInput)
    );

    renderSharedFiles(filtered);
}

function shareFiles() {
    if (selectedFiles.length === 0 || selectedReceivers.size === 0) return;

    const sharedFilesData = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        sharedBy: userId,
        sharedAt: new Date().toISOString()
    }));

    // Share files with each selected receiver
    selectedReceivers.forEach(receiverId => {
        const receiverSharedFilesKey = `sharedFiles_user_${receiverId}`;
        const existingSharedFiles = JSON.parse(localStorage.getItem(receiverSharedFilesKey)) || [];
        
        const updatedSharedFiles = [...existingSharedFiles, ...sharedFilesData];
        localStorage.setItem(receiverSharedFilesKey, JSON.stringify(updatedSharedFiles));
    });

    // Show success message
    sendBtn.textContent = 'Shared!';
    sendBtn.style.backgroundColor = '#28a745';

    setTimeout(() => {
        sendBtn.textContent = 'Share Files';
        sendBtn.style.backgroundColor = '';
        
        // Clear selections and go back to file selection page
        selectedFiles = [];
        selectedReceivers.clear();
        updateReceiverSelection();
        showPage(fileSelectionPage, receiverSelectionPage);
        
        // Refresh the shared files view
        loadSharedFiles();
    }, 1500);
}

function updateReceiverSelection() {
    const receiverCards = document.querySelectorAll('.receiver-card');
    receiverCards.forEach(card => {
        const receiverId = parseInt(card.querySelector('h4').textContent);
        if (selectedReceivers.has(receiverId)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    updateSendButtonState();
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}