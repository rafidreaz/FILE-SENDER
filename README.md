# NRB Share

A file sharing application built with ASP.NET Core MVC that allows users to upload files and share them with other users.

## Features

- File uploads with drag-and-drop support
- File sharing with specific users
- Shared files section to see files shared with you
- Search functionality for both your files and shared files
- Modern responsive UI

## Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- SQL Server (LocalDB is used by default)

## Setup and Running

1. Clone the repository or navigate to the FileSender directory
2. Open a terminal/command prompt in the FileSender folder
3. Restore dependencies:
   ```
   dotnet restore
   ```
4. Build the application:
   ```
   dotnet build
   ```
5. Run the application:
   ```
   dotnet run
   ```
6. Open a browser and navigate to:
   - https://localhost:7253 (with HTTPS)
   - or http://localhost:5253 (with HTTP)

## Database Setup

The application uses Entity Framework Core with SQL Server. The database will be automatically created on first run with the connection string in `appsettings.json`.

By default, it uses LocalDB with the following connection string:
```
Server=(localdb)\\mssqllocaldb;Database=FileSender;Trusted_Connection=True;MultipleActiveResultSets=true
```

If you need to change the database connection:
1. Update the connection string in `appsettings.json`
2. Run `dotnet ef database update` if you have the EF Core CLI tools installed

## Default Users

The application creates 4 default users on first run:
- Ratun (IT Executive, Dhaka)
- Fahim (Software Engineer, Chattogram)
- Ayesha (HR Manager, Khulna)
- Karim (Project Manager, Sylhet)

By default, you are logged in as user ID 1 (Ratun).

## Authentication Note

This is a demo application with a simulated authentication system. In a real application, you would implement proper authentication using ASP.NET Core Identity or another authentication system.

## Development Notes

- File uploads are stored in the `wwwroot/uploads` directory
- File metadata is stored in the database
- To change the currently logged-in user, modify the `_currentUserId` value in `FileController.cs` 
