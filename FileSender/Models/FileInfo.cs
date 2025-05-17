using System;
using System.Collections.Generic;

namespace FileSender.Models
{
    public class FileData
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string OriginalFileName { get; set; }
        public long FileSize { get; set; }
        public string ContentType { get; set; }
        public string StoragePath { get; set; }
        public int UploadedById { get; set; }
        public DateTime UploadedAt { get; set; }

        public virtual User UploadedBy { get; set; }
        public virtual ICollection<SharedFile> SharedWith { get; set; }

        public FileData()
        {
            SharedWith = new List<SharedFile>();
        }
    }
} 