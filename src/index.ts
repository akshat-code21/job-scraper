import scrapAmazonJobs from "./scrapers/amazon";
import scrapGoogleJobs from "./scrapers/google";
import scrapMicrosoftJobs from "./scrapers/microsoft";
import { JobService } from "./services/jobService";
import app from "./api/server";
const noOfPages = 1;
const jobService = new JobService();

// Function to run all scrapers
async function runScrapers() {
  try {
    // Run scrapers and store results
    const [amazonJobs, googleJobs, microsoftJobs] = await Promise.all([
      scrapAmazonJobs(noOfPages),
      scrapGoogleJobs(noOfPages),
      scrapMicrosoftJobs(noOfPages),
    ]);

    // Store jobs in database
    for (const job of [...amazonJobs, ...googleJobs, ...microsoftJobs]) {
      await jobService.createJob({
        title: job.title,
        company: job.company || determineCompany(job),
        location: job.location,
        description: job.description || "",
        postedDate: job.updateDate,
        jobUrl: job.link,
      });
    }

    console.log("All jobs scraped and stored successfully");
  } catch (error) {
    console.error("Error during scraping:", error);
  }
}

// Helper function to determine company based on job URL
function determineCompany(job: any): string {
  if (job.link.includes("amazon")) return "Amazon";
  if (job.link.includes("google")) return "Google";
  if (job.link.includes("microsoft")) return "Microsoft";
  return "Unknown";
}

setInterval(runScrapers, 60 * 60 * 1000);

runScrapers();

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
