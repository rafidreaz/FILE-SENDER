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
        
        // Helper method to get the current user ID from request headers if available
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
    }

    public class ShareRequest
    {
        public int FileId { get; set; }
        public List<int> ShareWithUserIds { get; set; }
    }
} 