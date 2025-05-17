using System;
using System.Collections.Generic;

namespace FileSender.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Designation { get; set; }
        public string Branch { get; set; }
        public string IP { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual ICollection<FileData> UploadedFiles { get; set; }
        public virtual ICollection<SharedFile> SharedByMe { get; set; }
        public virtual ICollection<SharedFile> SharedWithMe { get; set; }

        public User()
        {
            UploadedFiles = new List<FileData>();
            SharedByMe = new List<SharedFile>();
            SharedWithMe = new List<SharedFile>();
        }
    }
} 