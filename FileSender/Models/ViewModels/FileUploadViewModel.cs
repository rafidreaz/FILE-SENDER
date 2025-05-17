using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace FileSender.Models.ViewModels
{
    public class FileUploadViewModel
    {
        public IFormFile File { get; set; }
        public List<int> ShareWithUserIds { get; set; } = new List<int>();
    }
} 