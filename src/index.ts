import scrapAmazonJobs from "./scrapers/amazon";

scrapAmazonJobs().catch((error) => console.error("Script failed:", error));
