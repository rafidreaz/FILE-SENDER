using FileSender.Data;
using FileSender.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace FileSender.Services
{
    public class FileService
    {
        private readonly ApplicationDbContext _context;
        private readonly string _uploadPath;

        public FileService(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _uploadPath = Path.Combine(env.WebRootPath, "uploads");
            Directory.CreateDirectory(_uploadPath);
        }

        public async Task<FileData> UploadFileAsync(IFormFile file, int userId)
        {
            try
            {
                // First verify that the user exists
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new InvalidOperationException($"User with ID {userId} not found");
                }

                Console.WriteLine($"Starting file upload for user {userId}");
                Console.WriteLine($"File details: Name={file.FileName}, Size={file.Length}, ContentType={file.ContentType}");
                
                // Create user directory if it doesn't exist
                var userDirectory = Path.Combine(_uploadPath, userId.ToString());
                if (!Directory.Exists(userDirectory))
                {
                    Console.WriteLine($"Creating user directory: {userDirectory}");
                    Directory.CreateDirectory(userDirectory);
                }

                // Generate unique filename
                var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(userDirectory, uniqueFileName);
                Console.WriteLine($"Generated file path: {filePath}");

                // Save the file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    Console.WriteLine("Copying file to stream...");
                    await file.CopyToAsync(stream);
                }
                
                // Verify the file was saved correctly
                if (!File.Exists(filePath))
                {
                    throw new IOException($"File could not be verified on disk at path: {filePath}");
                }
                
                var fileInfo = new FileInfo(filePath);
                Console.WriteLine($"File successfully saved to disk. Size on disk: {fileInfo.Length} bytes");

                // Create file record
                var fileData = new FileData
                {
                    FileName = uniqueFileName,
                    OriginalFileName = file.FileName,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    StoragePath = Path.Combine(userId.ToString(), uniqueFileName),
                    UploadedById = userId,
                    UploadedAt = DateTime.UtcNow
                };

                Console.WriteLine("Adding file record to database");
                _context.Files.Add(fileData);
                await _context.SaveChangesAsync();
                Console.WriteLine($"File record saved to database with ID: {fileData.Id}");

                return fileData;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UploadFileAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }

                // Clean up the file if it was created but database operation failed
                var filePath = Path.Combine(_uploadPath, userId.ToString(), Path.GetFileName(file.FileName));
                if (File.Exists(filePath))
                {
                    try
                    {
                        File.Delete(filePath);
                        Console.WriteLine($"Cleaned up file at {filePath} after error");
                    }
                    catch (Exception cleanupEx)
                    {
                        Console.WriteLine($"Error cleaning up file: {cleanupEx.Message}");
                    }
                }

                throw; // Rethrow to let the controller handle it
            }
        }

        public async Task ShareFilesAsync(int fileId, int sharedById, List<int> sharedWithIds)
        {
            foreach (var sharedWithId in sharedWithIds)
            {
                // Skip if trying to share with self
                if (sharedWithId == sharedById)
                    continue;

                // Skip if already shared
                var alreadyShared = await _context.SharedFiles
                    .AnyAsync(sf => sf.FileId == fileId && sf.SharedById == sharedById && sf.SharedWithId == sharedWithId);

                if (alreadyShared)
                    continue;

                var sharedFile = new SharedFile
                {
                    FileId = fileId,
                    SharedById = sharedById,
                    SharedWithId = sharedWithId,
                    SharedAt = DateTime.UtcNow
                };

                _context.SharedFiles.Add(sharedFile);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<FileData>> GetUserFilesAsync(int userId)
        {
            return await _context.Files
                .Where(f => f.UploadedById == userId)
                .OrderByDescending(f => f.UploadedAt)
                .ToListAsync();
        }

        public async Task<List<SharedFile>> GetSharedWithUserFilesAsync(int userId)
        {
            try
            {
                Console.WriteLine($"Getting shared files for user {userId}");
                var sharedFiles = await _context.SharedFiles
                    .Include(sf => sf.File)
                        .ThenInclude(f => f.UploadedBy)
                    .Include(sf => sf.SharedBy)
                    .Where(sf => sf.SharedWithId == userId)
                    .OrderByDescending(sf => sf.SharedAt)
                    .ToListAsync();
                
                Console.WriteLine($"Found {sharedFiles.Count} shared files");
                return sharedFiles;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetSharedWithUserFilesAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw; // Rethrow to let the controller handle it
            }
        }

        public async Task<(Stream FileStream, string ContentType, string FileName)> DownloadFileAsync(int fileId, int userId)
        {
            // Check if user has access to file (owner or shared with them)
            var file = await _context.Files
                .FirstOrDefaultAsync(f => f.Id == fileId && 
                    (f.UploadedById == userId || f.SharedWith.Any(sf => sf.SharedWithId == userId)));

            if (file == null)
                throw new UnauthorizedAccessException("You don't have access to this file");

            var filePath = Path.Combine(_uploadPath, file.StoragePath);
            if (!File.Exists(filePath))
                throw new FileNotFoundException("File not found on server");

            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            return (stream, file.ContentType, file.OriginalFileName);
        }

        public async Task DeleteFileAsync(int fileId, int userId)
        {
            var file = await _context.Files
                .FirstOrDefaultAsync(f => f.Id == fileId && f.UploadedById == userId);

            if (file == null)
                throw new UnauthorizedAccessException("You don't have permission to delete this file");

            // Delete physical file
            var filePath = Path.Combine(_uploadPath, file.StoragePath);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            // Delete related shared records
            var sharedRecords = await _context.SharedFiles
                .Where(sf => sf.FileId == fileId)
                .ToListAsync();

            _context.SharedFiles.RemoveRange(sharedRecords);
            _context.Files.Remove(file);
            await _context.SaveChangesAsync();
        }
    }
} 