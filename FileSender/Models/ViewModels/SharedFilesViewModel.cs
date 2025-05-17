using System.Collections.Generic;

namespace FileSender.Models.ViewModels
{
    public class SharedFilesViewModel
    {
        public List<FileData> MyFiles { get; set; } = new List<FileData>();
        public List<SharedFile> SharedWithMe { get; set; } = new List<SharedFile>();
        public List<User> AvailableUsers { get; set; } = new List<User>();
    }
} 