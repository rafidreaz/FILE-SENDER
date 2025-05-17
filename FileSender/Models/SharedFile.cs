using System;

namespace FileSender.Models
{
    public class SharedFile
    {
        public int Id { get; set; }
        public int FileId { get; set; }
        public int SharedById { get; set; }
        public int SharedWithId { get; set; }
        public DateTime SharedAt { get; set; }

        public virtual FileData File { get; set; }
        public virtual User SharedBy { get; set; }
        public virtual User SharedWith { get; set; }
    }
} 