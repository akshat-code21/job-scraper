import scrapAmazonJobs from "./scrapers/amazon";
import scrapGoogleJobs from "./scrapers/google";
import scrapMicrosoftJobs from "./scrapers/microsoft";
import { JobService } from "./services/jobService";

const jobService = new JobService();

async function runScrapers() {
  try {
    const [amazonJobs, googleJobs, microsoftJobs] = await Promise.all([
      scrapAmazonJobs(),
      scrapGoogleJobs(),
      scrapMicrosoftJobs(),
    ]);

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

function determineCompany(job: any): string {
  if (job.link.includes("amazon")) return "Amazon";
  if (job.link.includes("google")) return "Google";
  if (job.link.includes("microsoft")) return "Microsoft";
  return "Unknown";
}

runScrapers().then(() => process.exit(0));