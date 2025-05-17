using FileSender.Models;
using Microsoft.EntityFrameworkCore;

namespace FileSender.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<FileData> Files { get; set; }
        public DbSet<SharedFile> SharedFiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // File to UploadedBy relationship
            modelBuilder.Entity<FileData>()
                .HasOne(f => f.UploadedBy)
                .WithMany(u => u.UploadedFiles)
                .HasForeignKey(f => f.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);

            // SharedFile to File relationship
            modelBuilder.Entity<SharedFile>()
                .HasOne(sf => sf.File)
                .WithMany(f => f.SharedWith)
                .HasForeignKey(sf => sf.FileId)
                .OnDelete(DeleteBehavior.Cascade);

            // SharedFile to SharedBy relationship
            modelBuilder.Entity<SharedFile>()
                .HasOne(sf => sf.SharedBy)
                .WithMany()
                .HasForeignKey(sf => sf.SharedById)
                .OnDelete(DeleteBehavior.Restrict);

            // SharedFile to SharedWith relationship
            modelBuilder.Entity<SharedFile>()
                .HasOne(sf => sf.SharedWith)
                .WithMany(u => u.SharedWithMe)
                .HasForeignKey(sf => sf.SharedWithId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
} 