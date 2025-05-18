// User Management
const USER_ID_KEY = 'currentUserId';

// Function to get current user ID
function getCurrentUserId() {
    return parseInt(localStorage.getItem(USER_ID_KEY)) || 1; // Default to 1 if not set
}

// Function to set current user ID
function setCurrentUserId(userId) {
    if (!userId || typeof userId !== 'number') {
        console.error('Invalid user ID provided');
        return false;
    }
    
    localStorage.setItem(USER_ID_KEY, userId);
    window.currentUserId = userId;
    
    // Refresh the UI
    loadSavedFiles();
    loadSharedFiles();
    loadReceivers();
    
    // Update the user display if it exists
    const userDisplay = document.getElementById('current-user-display');
    if (userDisplay) {
        const currentUser = receivers.find(u => u.id === userId);
        if (currentUser) {
            userDisplay.textContent = `Current User: ${currentUser.name}`;
        }
    }
    
    return true;
}

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

// Make pages available globally
window.fileSelectionPage = fileSelectionPage;
window.receiverSelectionPage = receiverSelectionPage;

// Initialize current user ID from localStorage or default to 1
window.currentUserId = getCurrentUserId();

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
    console.log("Initializing app");
    
    // Make sure selectedFiles is in the global scope
    window.selectedFiles = selectedFiles;
    window.selectedReceivers = selectedReceivers;
    
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
    saveBtn.addEventListener('click', () => {
        console.log("Save button clicked, selectedFiles:", selectedFiles);
        saveFiles();
    });
    
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
    sendBtn.addEventListener('click', () => {
        console.log("Send button clicked, selectedFiles:", selectedFiles);
        shareFiles();
    });
    
    // Search input event
    searchReceiver.addEventListener('input', filterReceivers);
    
    // Load receivers
    loadReceivers();
}

// Page Navigation
function showPage(pageToShow, pageToHide) {
    if (!pageToShow || !pageToHide) {
        console.error('Invalid page elements provided to showPage function');
        return;
    }

    // Hide current page
    if (pageToHide.classList) {
        pageToHide.classList.remove('active');
    }
    
    // Show target page after a brief delay
    requestAnimationFrame(() => {
        if (pageToShow.classList) {
            pageToShow.classList.add('active');
        }
    });
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

    const storageKey = `savedFiles_user_${window.currentUserId}`;

    const newSavedFiles = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        id: window.currentUserId  // Using the current user's ID for file ownership
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
    const storageKey = `savedFiles_user_${window.currentUserId}`;

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
        // Store file ID if present
        if (file.id) {
            fileCard.dataset.fileId = file.id;
        }

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
                lastModified: file.lastModified,
                id: file.id || null
            };

            if (fileCard.classList.contains('selected')) {
                if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    selectedFiles.push(fileObject);
                    // Update global variable too
                    window.selectedFiles = selectedFiles;

                    const fileItem = document.createElement('li');
                    fileItem.className = 'file-item';
                    fileItem.dataset.fileName = file.name;
                    if (file.id) {
                        fileItem.dataset.fileId = file.id;
                    }

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
    const storageKey = `savedFiles_user_${window.currentUserId}`;
    
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
    
    console.log('Loading receivers, current user:', window.currentUserId);
    console.log('All receivers:', filteredReceivers);
    
    filteredReceivers.forEach(receiver => {
        if (receiver.id !== window.currentUserId) {  // Don't show current user
            const receiverCard = document.createElement('div');
            receiverCard.className = `receiver-card ${selectedReceivers.has(receiver.id) ? 'selected' : ''}`;
            receiverCard.dataset.receiverId = receiver.id; // Add receiver ID to dataset
            receiverCard.innerHTML = `
                <h4>${receiver.name}</h4>
                <p>${receiver.designation}</p>
                <p>${receiver.email}</p>
                <p>${receiver.branch}</p>
            `;
            
            receiverCard.addEventListener('click', () => {
                console.log('Receiver clicked:', receiver);
                if (selectedReceivers.has(receiver.id)) {
                    console.log('Removing receiver:', receiver.id);
                    selectedReceivers.delete(receiver.id);
                    receiverCard.classList.remove('selected');
                } else {
                    console.log('Adding receiver:', receiver.id);
                    selectedReceivers.add(receiver.id);
                    receiverCard.classList.add('selected');
                }
                console.log('Selected receivers after click:', Array.from(selectedReceivers));
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
    console.log("File input change event triggered");
    const files = e.target.files;
    console.log(`Number of files selected: ${files.length}`);
    if (files.length > 0) {
        const fileTypes = Array.from(files).map(f => f.type).join(', ');
        console.log(`Selected file types: ${fileTypes}`);
    }
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
    
    console.log("Files dropped on drop area");
    const files = e.dataTransfer.files;
    console.log(`Number of files dropped: ${files.length}`);
    if (files.length > 0) {
        const fileTypes = Array.from(files).map(f => f.type).join(', ');
        console.log(`Dropped file types: ${fileTypes}`);
    }
    addFilesToList(files);
}

function addFilesToList(files) {
    if (!files || files.length === 0) {
        console.log("No files to add to list");
        return;
    }
    
    console.log(`Adding ${files.length} files to list`);
    
    Array.from(files).forEach(file => {
        console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
        
        // Check if file is already in the list
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            console.log(`File ${file.name} already in list, skipping`);
            return;
        }
        
        // Ensure we're storing the actual File object
        if (file instanceof File) {
            console.log(`Adding file object to selectedFiles: ${file.name}`);
            selectedFiles.push(file);
            // Make sure the global array is updated too
            window.selectedFiles = selectedFiles;
        } else {
            console.error(`Not a valid File object: ${file.name}`);
            return;
        }
        
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
    // Update global variable too
    window.selectedFiles = selectedFiles;
    
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
    // Update global variable too
    window.selectedFiles = [];
    
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
    const sharedFilesKey = `sharedFiles_user_${window.currentUserId}`;
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
    if (selectedFiles.length === 0 || selectedReceivers.size === 0) {
        console.log('No files or receivers selected:', {
            filesCount: selectedFiles.length,
            receiversCount: selectedReceivers.size
        });
        return;
    }

    console.log('Selected Files before sharing:', selectedFiles);
    console.log('Selected Receivers before sharing:', Array.from(selectedReceivers));

    // Get the file IDs and receiver IDs
    const fileIds = selectedFiles.map(file => {
        console.log('Processing file for ID:', file);
        return file.id;
    }).filter(id => {
        console.log('Checking file ID:', id);
        return id;
    });
    const shareWithUserIds = Array.from(selectedReceivers);

    console.log('File IDs to share:', fileIds);
    console.log('User IDs to share with:', shareWithUserIds);

    if (fileIds.length === 0) {
        alert('Please select files that have been saved to the server first.');
        return;
    }

    // Share each file with the selected receivers
    const sharePromises = fileIds.map(fileId => {
        console.log('Attempting to share file ID:', fileId, 'with users:', shareWithUserIds);
        return window.shareFile(fileId, shareWithUserIds);
    });

    Promise.all(sharePromises)
    .then(() => {
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
            window.loadSharedFiles();
        }, 1500);
    })
    .catch(error => {
        console.error('Error sharing files:', error);
        alert('Failed to share one or more files. Please try again.');
        
        sendBtn.textContent = 'Share Files';
        sendBtn.style.backgroundColor = '';
    });
}

function updateReceiverSelection() {
    console.log('Updating receiver selection, selected receivers:', Array.from(selectedReceivers));
    const receiverCards = document.querySelectorAll('.receiver-card');
    receiverCards.forEach(card => {
        const receiverId = parseInt(card.dataset.receiverId);
        console.log('Checking receiver card:', receiverId, 'is selected:', selectedReceivers.has(receiverId));
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

// User IDs are static and managed through the user switcher