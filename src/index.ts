import scrapAmazonJobs from "./scrapers/amazon";
import scrapGoogleJobs from "./scrapers/google";

// scrapAmazonJobs().catch((error) =>
//   console.error("Amazon Script failed:", error)
// );
scrapGoogleJobs().catch((error) =>
  console.error("Google Script failed : ", error)
);
