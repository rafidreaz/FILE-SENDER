// API Adapter for integrating original script.js with .NET backend

// Helper function to create headers with current user ID
function getHeaders() {
    return {
        'X-User-ID': window.currentUserId.toString()
    };
}

// Helper function to make API calls with proper headers
async function makeApiCall(url, options = {}) {
    const headers = {
        ...getHeaders(),
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response;
}

document.addEventListener('DOMContentLoaded', function() {
    // Ensure we're using the global currentUserId from script.js
    console.log("API Adapter initialized with User ID:", window.currentUserId);
    
    // Add a function to switch users (for testing purposes)
    window.switchUser = async function(newUserId) {
        if (newUserId && typeof newUserId === 'number') {
            console.log(`Switching from user ${window.currentUserId} to user ${newUserId}`);
            window.currentUserId = newUserId;
            
            try {
                // Update the UI to reflect the new user
                document.getElementById('current-user').textContent = `Current User: ${window.receivers.find(u => u.id === newUserId)?.name || 'Unknown'} (ID: ${newUserId})`;
                
                // Reload the user's files and shared files
                await window.loadSavedFiles();
                await window.loadSharedFiles();
                
                // Update receivers to exclude current user
                await window.loadReceivers();
                
                return true;
            } catch (error) {
                console.error('Error switching user:', error);
                return false;
            }
        } else {
            console.error("Invalid user ID provided");
            return false;
        }
    };
    
    // Override the existing functions in script.js with API calls

    // Override loadReceivers to fetch from API instead of using hardcoded data
    window.originalLoadReceivers = window.loadReceivers;
    window.loadReceivers = async function(filteredReceivers = null) {
        try {
            const response = await makeApiCall('api/file/users');
            const users = await response.json();
            window.receivers = users;
            
            if (filteredReceivers) {
                window.originalLoadReceivers(filteredReceivers);
            } else {
                window.originalLoadReceivers(users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            window.originalLoadReceivers(window.receivers);
        }
    };

    // Override loadSavedFiles to fetch from API instead of localStorage
    window.originalLoadSavedFiles = window.loadSavedFiles;
    window.loadSavedFiles = async function() {
        try {
            console.log("Loading files from server for user ID:", window.currentUserId);
            const response = await makeApiCall('api/file/myfiles');
            const files = await response.json();
            console.log("Files loaded from server:", files);
            
            window.savedFiles = files.map(file => ({
                id: file.id,
                name: file.originalFileName,
                size: file.fileSize,
                type: file.contentType,
                saved: true,
                lastModified: new Date().getTime()
            }));
            
            window.renderSavedFiles(window.savedFiles);
        } catch (error) {
            console.error('Error loading files from server:', error);
            window.originalLoadSavedFiles();
        }
    };

    // Override loadSharedFiles to fetch from API
    window.originalLoadSharedFiles = window.loadSharedFiles;
    window.loadSharedFiles = async function() {
        try {
            console.log("Loading shared files from server for user ID:", window.currentUserId);
            const response = await makeApiCall('api/file/sharedwithme');
            const sharedFilesData = await response.json();
            console.log("Shared files loaded from server:", sharedFilesData);
            
            window.sharedFiles = sharedFilesData.map(sf => ({
                id: sf.fileId,           // File ID (for download)
                sharedFileId: sf.id,     // Shared file record ID (for unshare)
                name: sf.file.originalFileName,
                size: sf.file.fileSize,
                type: sf.file.contentType,
                sharedById: sf.sharedById,
                sharedByName: sf.sharedBy ? sf.sharedBy.name : 'Unknown User',
                sharedByEmail: sf.sharedBy ? sf.sharedBy.email : '',
                sharedAt: new Date(sf.sharedAt)
            }));
            
            console.log("Processed shared files with user info:", window.sharedFiles);
            window.renderSharedFiles(window.sharedFiles);
        } catch (error) {
            console.error('Error loading shared files from server:', error);
            window.originalLoadSharedFiles();
        }
    };

    // Add file upload function
    window.uploadFile = async function(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await makeApiCall('api/file/upload', {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    // Add file sharing function
    window.shareFile = async function(fileId, shareWithUserIds) {
        if (!fileId || !shareWithUserIds || !Array.isArray(shareWithUserIds)) {
            console.error('Invalid parameters:', { fileId, shareWithUserIds });
            throw new Error('Invalid parameters: fileId and shareWithUserIds array are required');
        }

        try {
            console.log('Sharing file:', { fileId, shareWithUserIds });
            const response = await makeApiCall('api/file/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileId: parseInt(fileId),
                    shareWithUserIds: shareWithUserIds.map(id => parseInt(id))
                })
            });
            const result = await response.json();
            console.log('Share result:', result);
            return result;
        } catch (error) {
            console.error('Error sharing file:', error);
            throw error;
        }
    };

    // Override renderSavedFiles to avoid it reloading from localStorage
    window.originalRenderSavedFiles = window.renderSavedFiles;
    window.renderSavedFiles = function(filesToRender = null) {
        // If we're explicitly passing files, don't try to reload from localStorage
        if (filesToRender) {
            const files = filesToRender;
            savedFilesContainer.innerHTML = '';

            if (files.length === 0) {
                const noFiles = document.createElement('p');
                noFiles.className = 'no-files';
                noFiles.textContent = 'No saved files yet.';
                savedFilesContainer.appendChild(noFiles);
                return;
            }

            files.forEach(file => {
                console.log('Rendering saved file:', file); // Debug log
                
                const fileCard = document.createElement('div');
                fileCard.className = 'saved-file-card';
                fileCard.dataset.fileName = file.name;
                fileCard.dataset.fileId = file.id; // Store the database ID for API operations

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

                // Actions container
                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'file-actions';

                // Download button (new)
                const downloadBtn = document.createElement('a');
                downloadBtn.href = `api/file/download/${file.id}`;
                downloadBtn.className = 'btn-download';
                downloadBtn.innerHTML = '📥';
                downloadBtn.title = 'Download';
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-saved-file';
                deleteBtn.textContent = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.deleteSavedFile(file.id);
                });

                // Add all elements in order
                actionsContainer.appendChild(downloadBtn);
                actionsContainer.appendChild(deleteBtn);
                
                fileInfo.appendChild(fileName);
                fileInfo.appendChild(fileSize);
                fileInfo.appendChild(actionsContainer);

                fileCard.appendChild(fileInfo);

                // Check if this file is in selectedFiles and add selected class if it is
                if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    fileCard.classList.add('selected');
                }

                fileCard.addEventListener('click', () => {
                    fileCard.classList.toggle('selected');

                    const fileObject = {
                        id: file.id, // Ensure we're storing the file ID
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified || new Date().getTime(),
                        fromServer: true  // Flag to indicate this file is from the server
                    };

                    console.log('File object created:', fileObject); // Debug log

                    if (fileCard.classList.contains('selected')) {
                        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                            selectedFiles.push(fileObject);
                            console.log('Added file to selectedFiles:', selectedFiles); // Debug log

                            const fileItem = document.createElement('li');
                            fileItem.className = 'file-item';
                            fileItem.dataset.fileName = file.name;
                            fileItem.dataset.fileId = file.id;

                            const fileName = document.createElement('span');
                            fileName.className = 'file-name';
                            fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;

                            const removeBtn = document.createElement('button');
                            removeBtn.className = 'remove-file';
                            removeBtn.textContent = 'Remove';
                            removeBtn.addEventListener('click', () => window.removeFile(file.name));

                            fileItem.appendChild(fileName);
                            fileItem.appendChild(removeBtn);
                            filesContainer.appendChild(fileItem);

                            window.updateUI();
                        }
                    } else {
                        window.removeFile(file.name);
                    }
                });

                savedFilesContainer.appendChild(fileCard);
            });
        } else {
            // Call original implementation for other cases
            window.originalRenderSavedFiles(filesToRender);
        }
    };

    // Override renderSharedFiles to handle API data
    window.originalRenderSharedFiles = window.renderSharedFiles;
    window.renderSharedFiles = function(filesToRender = null) {
        if (filesToRender) {
            renderSharedFilesFromApi(filesToRender);
        } else {
            window.originalRenderSharedFiles();
        }
    };
    
    // Custom function to render shared files from API data
    function renderSharedFilesFromApi(files) {
        console.log("Rendering shared files from API:", files);
        sharedFilesContainer.innerHTML = '';

        if (!files || files.length === 0) {
            const noFiles = document.createElement('p');
            noFiles.className = 'no-files';
            noFiles.textContent = 'No shared files yet.';
            sharedFilesContainer.appendChild(noFiles);
            return;
        }

        files.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'shared-file-card';
            fileCard.dataset.fileName = file.name;
            fileCard.dataset.fileId = file.id;
            fileCard.dataset.sharedFileId = file.sharedFileId;
            fileCard.dataset.sharedById = file.sharedById;

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

            // Shared by info section - now horizontal
            const sharedByInfo = document.createElement('div');
            sharedByInfo.className = 'shared-by-info';
            
            // Shared by name
            const sharedByName = document.createElement('div');
            sharedByName.className = 'shared-by-name';
            sharedByName.textContent = file.sharedByName || 'Unknown User';

            // Shared by email
            const sharedByEmail = document.createElement('div');
            sharedByEmail.className = 'shared-by-email';
            sharedByEmail.textContent = file.sharedByEmail || '';

            // Action buttons container
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'file-actions';

            // Download button
            const downloadBtn = document.createElement('a');
            downloadBtn.href = `api/file/download/${file.id}`;
            downloadBtn.className = 'btn-download';
            downloadBtn.innerHTML = '📥';
            downloadBtn.title = 'Download';
            
            // Delete button (new)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-shared';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Remove from shared list';
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Confirm before removing
                if (confirm(`Remove "${file.name}" from your shared files?`)) {
                    removeSharedFile(file.sharedFileId);
                }
            });
            
            // Add buttons to container
            actionsContainer.appendChild(downloadBtn);
            actionsContainer.appendChild(deleteBtn);

            // Add all elements in order
            sharedByInfo.appendChild(sharedByName);
            sharedByInfo.appendChild(sharedByEmail);
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);
            fileInfo.appendChild(sharedByInfo);

            fileCard.appendChild(fileInfo);
            fileCard.appendChild(actionsContainer);
            
            sharedFilesContainer.appendChild(fileCard);
        });
    }
    
    // Function to remove a file from shared list
    async function removeSharedFile(sharedFileId) {
        try {
            console.log("Removing shared file record with ID:", sharedFileId);
            const response = await fetch(`api/file/unshare/${sharedFileId}`, {
                method: 'DELETE',
                headers: {
                    'X-User-ID': window.currentUserId.toString()
                }
            });

            if (response.ok) {
                console.log("File removed from shared list successfully");
                // Refresh the shared files list
                window.loadSharedFiles();
            } else {
                const errorMessage = await response.text();
                console.error('Failed to remove shared file:', errorMessage);
                alert("Failed to remove shared file: " + (errorMessage || "Unknown error"));
            }
        } catch (error) {
            console.error('Error removing shared file:', error);
            alert("Error removing shared file: " + error.message);
        }
    }

    // Override saveFiles to use API
    window.originalSaveFiles = window.saveFiles;
    window.saveFiles = async function() {
        console.log("saveFiles called, selectedFiles:", window.selectedFiles);
        
        // Check if selectedFiles exists in both window and local scope
        const filesArray = selectedFiles || window.selectedFiles;
        
        if (!filesArray || filesArray.length === 0) {
            console.error("No files selected for upload");
            console.error("window.selectedFiles:", window.selectedFiles);
            console.error("selectedFiles (local):", selectedFiles);
            alert("Please select a file first");
            return;
        }

        console.log("Selected files for upload:", filesArray);
        
        saveBtn.textContent = 'Uploading...';
        saveBtn.style.backgroundColor = '#007bff';
        
        // Separate files into two categories:
        // 1. New files that need to be uploaded (instanceof File)
        // 2. Files already on the server (have ID)
        const newFiles = filesArray.filter(file => file instanceof File);
        const alreadySavedFiles = filesArray.filter(file => !!file.id);
        
        console.log(`Processing ${newFiles.length} new files and ${alreadySavedFiles.length} already saved files`);
        
        let successCount = alreadySavedFiles.length; // Already count saved files as success
        let failureCount = 0;
        
        // Only proceed with API call if we have new files to upload
        if (newFiles.length > 0) {
            try {
                // Create a single form with all files
                const formData = new FormData();
                
                // CRITICAL FIX: Use the same parameter name 'files' for ALL files
                for (let i = 0; i < newFiles.length; i++) {
                    formData.append('files', newFiles[i]);
                    console.log(`Adding file to form: ${newFiles[i].name}`);
                }
                
                console.log(`Uploading ${newFiles.length} files to server for user ${window.currentUserId}`);
                
                // Use the batch-upload endpoint 
                const response = await fetch('api/file/batch-upload', {
                    method: 'POST',
                    headers: {
                        'X-User-ID': window.currentUserId.toString()
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`Upload result:`, result);
                    
                    // Update success counter
                    successCount += result.filesUploaded;
                    failureCount += (result.totalFilesAttempted - result.filesUploaded);
                    
                    console.log(`${result.filesUploaded} files uploaded successfully out of ${result.totalFilesAttempted} attempted`);
                } else {
                    let errorMessage = "Failed to upload files";
                    try {
                        const errorResponse = await response.text();
                        console.error(`Upload failed with server response:`, errorResponse);
                        errorMessage = errorResponse || "Server rejected the files upload";
                    } catch (e) {
                        console.error('Error reading server response:', e);
                    }
                    
                    failureCount += newFiles.length;
                    console.error(`Failed to upload files: ${errorMessage}`);
                }
            } catch (error) {
                console.error(`Error uploading files to server:`, error);
                failureCount += newFiles.length;
            }
        }
        
        // After all uploads are processed, update UI
        if (failureCount === 0) {
            saveBtn.textContent = `${successCount} Files Saved!`;
            saveBtn.style.backgroundColor = '#28a745';
        } else if (successCount === 0) {
            saveBtn.textContent = 'Failed!';
            saveBtn.style.backgroundColor = '#dc3545';
            alert(`Failed to upload ${failureCount} files.`);
        } else {
            saveBtn.textContent = `${successCount}/${filesArray.length} Saved`;
            saveBtn.style.backgroundColor = '#ffc107'; // Warning color
            alert(`Successfully uploaded ${successCount} files. Failed to upload ${failureCount} files.`);
        }
        
        setTimeout(() => {
            saveBtn.textContent = 'Save Files';
            saveBtn.style.backgroundColor = '';
            
            // Update the UI with the new files
            window.loadSavedFiles();
            
            // Clear selected files
            window.clearAllFiles();
        }, 1500);
    };

    // Override deleteSavedFile to use API
    window.originalDeleteSavedFile = window.deleteSavedFile;
    window.deleteSavedFile = async function(fileId) {
        try {
            console.log("Deleting file with ID:", fileId);
            const response = await fetch(`api/file/delete/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'X-User-ID': window.currentUserId.toString()
                }
            });

            if (response.ok) {
                console.log("File deleted successfully");
                // Remove the file from the UI
                window.loadSavedFiles();
            } else {
                console.error('Failed to delete file from server');
                window.originalDeleteSavedFile(fileId);
            }
        } catch (error) {
            console.error('Error deleting file from server:', error);
            window.originalDeleteSavedFile(fileId);
        }
    };

    // Add download functionality
    window.downloadFile = function(fileId) {
        window.location.href = `api/file/download/${fileId}`;
    };
}); 