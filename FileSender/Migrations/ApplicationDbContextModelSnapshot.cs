﻿// <auto-generated />
using System;
using FileSender.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace FileSender.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "6.0.10")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder, 1L, 1);

            modelBuilder.Entity("FileSender.Models.FileData", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"), 1L, 1);

                    b.Property<string>("ContentType")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("FileName")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<long>("FileSize")
                        .HasColumnType("bigint");

                    b.Property<string>("OriginalFileName")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("StoragePath")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("UploadedAt")
                        .HasColumnType("datetime2");

                    b.Property<int>("UploadedById")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("UploadedById");

                    b.ToTable("Files");
                });

            modelBuilder.Entity("FileSender.Models.SharedFile", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"), 1L, 1);

                    b.Property<int>("FileId")
                        .HasColumnType("int");

                    b.Property<DateTime>("SharedAt")
                        .HasColumnType("datetime2");

                    b.Property<int>("SharedById")
                        .HasColumnType("int");

                    b.Property<int>("SharedWithId")
                        .HasColumnType("int");

                    b.Property<int?>("UserId")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("FileId");

                    b.HasIndex("SharedById");

                    b.HasIndex("SharedWithId");

                    b.HasIndex("UserId");

                    b.ToTable("SharedFiles");
                });

            modelBuilder.Entity("FileSender.Models.User", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"), 1L, 1);

                    b.Property<string>("Branch")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<string>("Designation")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("IP")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Id");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("FileSender.Models.FileData", b =>
                {
                    b.HasOne("FileSender.Models.User", "UploadedBy")
                        .WithMany("UploadedFiles")
                        .HasForeignKey("UploadedById")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("UploadedBy");
                });

            modelBuilder.Entity("FileSender.Models.SharedFile", b =>
                {
                    b.HasOne("FileSender.Models.FileData", "File")
                        .WithMany("SharedWith")
                        .HasForeignKey("FileId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("FileSender.Models.User", "SharedBy")
                        .WithMany()
                        .HasForeignKey("SharedById")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("FileSender.Models.User", "SharedWith")
                        .WithMany("SharedWithMe")
                        .HasForeignKey("SharedWithId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("FileSender.Models.User", null)
                        .WithMany("SharedByMe")
                        .HasForeignKey("UserId");

                    b.Navigation("File");

                    b.Navigation("SharedBy");

                    b.Navigation("SharedWith");
                });

            modelBuilder.Entity("FileSender.Models.FileData", b =>
                {
                    b.Navigation("SharedWith");
                });

            modelBuilder.Entity("FileSender.Models.User", b =>
                {
                    b.Navigation("SharedByMe");

                    b.Navigation("SharedWithMe");

                    b.Navigation("UploadedFiles");
                });
#pragma warning restore 612, 618
        }
    }
}
