namespace WebApp.Models
{
    public class Project
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageName { get; set; } = string.Empty;
        public List<string> Technologies { get; set; } = new List<string>();
    }
}
