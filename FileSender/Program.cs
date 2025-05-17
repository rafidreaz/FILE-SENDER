using FileSender.Data;
using FileSender.Models;
using FileSender.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure JSON serialization to handle circular references
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.WriteIndented = true;
});

// Add services to the container.
builder.Services.AddControllersWithViews();

// Explicitly set the port to avoid conflicts
builder.WebHost.UseUrls("http://localhost:5001");

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
builder.Services.AddScoped<FileService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Add error handling middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
});

app.UseHttpsRedirection();

// Enable CORS
app.UseCors();

// Ensure uploads directory exists
var uploadsPath = Path.Combine(app.Environment.WebRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    try
    {
        Directory.CreateDirectory(uploadsPath);
        Console.WriteLine($"Created uploads directory at {uploadsPath}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating uploads directory: {ex.Message}");
    }
}

// Configure static files - simplified approach
app.UseStaticFiles(); // Serve files from wwwroot

app.UseRouting();

app.UseAuthorization();

// Set up a fallback route for your API
app.MapControllerRoute(
    name: "api",
    pattern: "api/{controller}/{action}/{id?}");

// Set up fallback to index.html
app.MapFallbackToFile("index.html");

// Seed initial data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();
        
        // Apply migrations instead of EnsureCreated
        logger.LogInformation("Applying migrations...");
        context.Database.Migrate();
        
        // Seed initial users if none exist
        if (!context.Users.Any())
        {
            logger.LogInformation("Seeding database...");
            context.Users.AddRange(
                new User
                {
                    Name = "Ratun",
                    Email = "ratun@gmail.com",
                    Designation = "IT Executive",
                    Branch = "Dhaka",
                    IP = "000000000",
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Name = "Fahim",
                    Email = "fahim@example.com",
                    Designation = "Software Engineer",
                    Branch = "Chattogram",
                    IP = "123456789",
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Id = 3,
                    Name = "Ayesha",
                    Email = "ayesha@company.com",
                    Designation = "HR Manager",
                    Branch = "Khulna",
                    IP = "987654321",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 4,
                    Name = "Karim",
                    Email = "karim@company.com",
                    Designation = "Project Manager",
                    Branch = "Sylhet",
                    IP = "456123789",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 5,
                    Name = "Tania",
                    Email = "tania@company.com",
                    Designation = "Marketing Executive",
                    Branch = "Rajshahi",
                    IP = "789321654",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 6,
                    Name = "Nayeem",
                    Email = "nayeem@company.com",
                    Designation = "Data Analyst",
                    Branch = "Barisal",
                    IP = "321654987",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 7,
                    Name = "Sadia",
                    Email = "sadia@company.com",
                    Designation = "Finance Manager",
                    Branch = "Cumilla",
                    IP = "147258369",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 8,
                    Name = "Hasib",
                    Email = "hasib@company.com",
                    Designation = "UI/UX Designer",
                    Branch = "Mymensingh",
                    IP = "258369147",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 9,
                    Name = "Mariam",
                    Email = "mariam@company.com",
                    Designation = "Operations Manager",
                    Branch = "Jessore",
                    IP = "369147258",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 10,
                    Name = "Rafi",
                    Email = "rafi@company.com",
                    Designation = "Network Administrator",
                    Branch = "Cox's Bazar",
                    IP = "654987321",
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Id = 11,
                    Name = "Imran",
                    Email = "imran@company.com",
                    Designation = "Cyber Security Analyst",
                    Branch = "Gazipur",
                    IP = "987321654",
                    CreatedAt = DateTime.Now
                }
            );
            context.SaveChanges();
            logger.LogInformation("Database seeded successfully.");
        }
        else
        {
            logger.LogInformation("Database already contains users. Skipping seed.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
        throw; // Rethrow to fail fast if database initialization fails
    }
}

app.Run(); 