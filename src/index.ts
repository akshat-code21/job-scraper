import scrapAmazonJobs from "./scrapers/amazon";
import scrapGoogleJobs from "./scrapers/google";
import scrapMicrosoftJobs from "./scrapers/microsoft";
// scrapAmazonJobs().catch((error) =>
//   console.error("Amazon Script failed:", error)
// );
// scrapGoogleJobs().catch((error) =>
//   console.error("Google Script failed : ", error)
// );
scrapMicrosoftJobs().catch((error) => {
  console.error("Microsoft script failed : ", error);
});
