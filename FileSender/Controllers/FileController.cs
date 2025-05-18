using FileSender.Data;
using FileSender.Models;
using FileSender.Models.ViewModels;
using FileSender.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.Collections.Generic;

namespace FileSender.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly FileService _fileService;
        private readonly ApplicationDbContext _context;
        
        // Current user ID - we'll use a default of 1, but also check for a custom header
        private readonly int _currentUserId = 1; // Default user ID

        public FileController(FileService fileService, ApplicationDbContext context)
        {
            _fileService = fileService;
            _context = context;
        }
        
        // Helperr method to get the current user ID from request headers if available
        private int GetCurrentUserId()
        {
            if (Request.Headers.TryGetValue("X-User-ID", out var userIdHeader) && 
                int.TryParse(userIdHeader, out var userId))
            {
                Console.WriteLine($"Using user ID from header: {userId}");
                return userId;
            }
            
            Console.WriteLine($"Using default user ID: {_currentUserId}");
            return _currentUserId;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                Console.WriteLine($"Getting users for current user {currentUserId}");
                
                var users = await _context.Users
                    .Where(u => u.Id != currentUserId)
                    .ToListAsync();
                    
                Console.WriteLine($"Found {users.Count} users");
                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUsers: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("myfiles")]
        public async Task<IActionResult> GetMyFiles()
        {
            var currentUserId = GetCurrentUserId();
            var files = await _fileService.GetUserFilesAsync(currentUserId);
            return Ok(files);
        }

        [HttpGet("sharedwithme")]
        public async Task<IActionResult> GetSharedWithMe()
        {
            var currentUserId = GetCurrentUserId();
            var sharedFiles = await _fileService.GetSharedWithUserFilesAsync(currentUserId);
            return Ok(sharedFiles);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] FileUploadViewModel model)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"Processing file upload for user {userId}");

                if (model.File == null)
                {
                    return BadRequest(new { success = false, message = "No file provided" });
                }

                var file = await _fileService.UploadFileAsync(model.File, userId);

                // Return a simplified response without circular references
                return Ok(new
                {
                    success = true,
                    file = new
                    {
                        id = file.Id,
                        fileName = file.FileName,
                        originalFileName = file.OriginalFileName,
                        fileSize = file.FileSize,
                        contentType = file.ContentType,
                        uploadedAt = file.UploadedAt,
                        uploadedBy = new
                        {
                            id = file.UploadedBy.Id,
                            name = file.UploadedBy.Name,
                            email = file.UploadedBy.Email
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Upload: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { success = false, message = $"Error uploading file: {ex.Message}" });
            }
        }

        [HttpPost("upload-multiple")]
        public async Task<IActionResult> UploadMultiple([FromForm] IFormFileCollection files)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"Processing multiple file upload for user {userId}, file count: {files?.Count ?? 0}");
                
                // Debug request content
                Console.WriteLine("Request form files:");
                foreach (var key in Request.Form.Files.Select(f => f.Name).Distinct())
                {
                    Console.WriteLine($"Form key: {key}, count: {Request.Form.Files.Count(f => f.Name == key)}");
                }

                if (files == null || files.Count == 0)
                {
                    Console.WriteLine("No files were found in the request");
                    return BadRequest(new { success = false, message = "No files provided" });
                }

                Console.WriteLine($"Found {files.Count} files to process:");
                foreach (var file in files)
                {
                    Console.WriteLine($"File: {file.FileName}, Size: {file.Length}, Content-Type: {file.ContentType}");
                }

                var uploadedFiles = new List<object>();
                
                foreach (var file in files)
                {
                    try
                    {
                        Console.WriteLine($"Starting upload process for {file.FileName}");
                        var fileData = await _fileService.UploadFileAsync(file, userId);
                        
                        uploadedFiles.Add(new
                        {
                            id = fileData.Id,
                            fileName = fileData.FileName,
                            originalFileName = fileData.OriginalFileName,
                            fileSize = fileData.FileSize,
                            contentType = fileData.ContentType,
                            uploadedAt = fileData.UploadedAt,
                            uploadedBy = new
                            {
                                id = fileData.UploadedBy.Id,
                                name = fileData.UploadedBy.Name,
                                email = fileData.UploadedBy.Email
                            }
                        });
                        
                        Console.WriteLine($"Successfully uploaded file: {fileData.OriginalFileName}, ID: {fileData.Id}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error uploading individual file {file.FileName}: {ex.Message}");
                        // Continue with other files even if one fails
                    }
                }

                Console.WriteLine($"Upload complete. Uploaded {uploadedFiles.Count} out of {files.Count} files");
                return Ok(new
                {
                    success = true,
                    filesUploaded = uploadedFiles.Count,
                    totalFilesAttempted = files.Count,
                    files = uploadedFiles
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UploadMultiple: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { success = false, message = $"Error uploading files: {ex.Message}" });
            }
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> Download(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var (fileStream, contentType, fileName) = await _fileService.DownloadFileAsync(id, currentUserId);
                return File(fileStream, contentType, fileName);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("You don't have permission to access this file.");
            }
            catch (FileNotFoundException)
            {
                return NotFound("The requested file was not found.");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error downloading file: {ex.Message}");
            }
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                await _fileService.DeleteFileAsync(id, currentUserId);
                return Ok(new { success = true, message = "File deleted successfully." });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "You don't have permission to delete this file." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error deleting file: {ex.Message}" });
            }
        }

        [HttpPost("share")]
        public async Task<IActionResult> Share([FromBody] ShareRequest request)
        {
            if (request.ShareWithUserIds == null || request.ShareWithUserIds.Count == 0)
            {
                return BadRequest(new { success = false, message = "Please select at least one user to share with." });
            }

            try
            {
                var currentUserId = GetCurrentUserId();
                await _fileService.ShareFilesAsync(request.FileId, currentUserId, request.ShareWithUserIds);
                return Ok(new { success = true, message = "File shared successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error sharing file: {ex.Message}" });
            }
        }

        [HttpPost("batch-upload")]
        public async Task<IActionResult> BatchUpload()
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"Processing batch file upload for user {userId}");
                
                // Get files directly from the request
                var files = Request.Form.Files;
                Console.WriteLine($"Found {files.Count} files in the request");
                
                if (files == null || files.Count == 0)
                {
                    return BadRequest(new { success = false, message = "No files provided" });
                }

                Console.WriteLine($"Files found: {string.Join(", ", files.Select(f => f.FileName))}");
                
                var uploadedFiles = new List<object>();
                
                foreach (var file in files)
                {
                    try
                    {
                        Console.WriteLine($"Processing file: {file.FileName}");
                        var fileData = await _fileService.UploadFileAsync(file, userId);
                        
                        uploadedFiles.Add(new
                        {
                            id = fileData.Id,
                            fileName = fileData.FileName,
                            originalFileName = fileData.OriginalFileName,
                            fileSize = fileData.FileSize,
                            contentType = fileData.ContentType,
                            uploadedAt = fileData.UploadedAt,
                            uploadedBy = new
                            {
                                id = fileData.UploadedBy.Id,
                                name = fileData.UploadedBy.Name,
                                email = fileData.UploadedBy.Email
                            }
                        });
                        
                        Console.WriteLine($"Successfully uploaded file: {fileData.OriginalFileName}, ID: {fileData.Id}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error uploading individual file {file.FileName}: {ex.Message}");
                        // Continue with other files even if one fails
                    }
                }

                Console.WriteLine($"Batch upload complete. Uploaded {uploadedFiles.Count} out of {files.Count} files");
                
                return Ok(new
                {
                    success = true,
                    filesUploaded = uploadedFiles.Count,
                    totalFilesAttempted = files.Count,
                    files = uploadedFiles
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in BatchUpload: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { success = false, message = $"Error uploading files: {ex.Message}" });
            }
        }

        [HttpDelete("unshare/{id}")]
        public async Task<IActionResult> Unshare(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                Console.WriteLine($"Processing unshare request for file ID {id} by user {currentUserId}");
                
                // First, try to find by SharedFile.Id
                var sharedFile = await _context.SharedFiles
                    .FirstOrDefaultAsync(sf => sf.Id == id && sf.SharedWithId == currentUserId);
                
                if (sharedFile == null)
                {
                    // If not found by SharedFile.Id, try to find by FileId
                    sharedFile = await _context.SharedFiles
                        .FirstOrDefaultAsync(sf => sf.FileId == id && sf.SharedWithId == currentUserId);
                        
                    if (sharedFile == null)
                    {
                        Console.WriteLine($"No shared file found for ID {id} and user {currentUserId}");
                        return NotFound(new { success = false, message = "Shared file record not found." });
                    }
                }
                
                Console.WriteLine($"Found shared file record with ID {sharedFile.Id} for File {sharedFile.FileId}");
                
                // Remove the share record
                _context.SharedFiles.Remove(sharedFile);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Successfully removed shared file record");
                return Ok(new { success = true, message = "File removed from shared list." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Unshare: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { success = false, message = $"Error removing shared file: {ex.Message}" });
            }
        }
    }

    public class ShareRequest
    {
        public int FileId { get; set; }
        public List<int> ShareWithUserIds { get; set; }
    }
} 