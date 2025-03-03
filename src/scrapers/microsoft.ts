import puppeteer from "puppeteer";
import parseDateString from "../utils/parseDateString";

export default async function scrapMicrosoftJobs() {
  console.log("Starting Microsoft jobs scraper");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(
      "https://jobs.careers.microsoft.com/global/en/search?p=Software%20Engineering&l=en_us&pg=1&pgSz=20&o=Relevance&flt=true"
    );

    await page.waitForSelector("div.ms-List-page", { timeout: 10000 });
    await page.waitForFunction(
      () => {
        const list = document.querySelector("div.ms-List-page");
        return list && list.children.length > 0;
      },
      { timeout: 10000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const jobs = await page.evaluate(() => {
      const jobsList = document.querySelector("div.ms-List-page");
      console.log("Found jobsList:", !!jobsList);

      if (!jobsList) return [];

      const jobItems = jobsList.querySelectorAll("div[role='listitem']");
      console.log("Number of job items found:", jobItems.length);

      return Array.from(jobItems)
        .map((job) => {
          try {
            const jobContainer = job.querySelector(
              "div[aria-label^='Job item']"
            );
            const jobAriaLabel = jobContainer?.getAttribute("aria-label") || "";
            const titleMatch = jobAriaLabel.match(/Job item \d+ (.+)/);
            const title = titleMatch ? titleMatch[1] : "";

            const saveButton = job.querySelector("div[title='Save']");
            const saveButtonId = saveButton?.getAttribute("id") || "";
            const jobId = saveButtonId.replace(
              "ms-search-searchresult-save-job-callout-",
              ""
            );

            const seeDetailsButton = job.querySelector(
              "button.ms-Link[aria-label^='click to see details']"
            );
            const seeDetailsLabel =
              seeDetailsButton?.getAttribute("aria-label") || "";
            const detailsTitleMatch = seeDetailsLabel.match(
              /click to see details for (.+)/
            );
            const detailsTitle = detailsTitleMatch ? detailsTitleMatch[1] : "";

            const finalTitle = title || detailsTitle;

            const locationElement = job.querySelector(
              "i[data-icon-name='POI']"
            );
            const dateElement = job.querySelector("i[data-icon-name='Clock']");
            const workTypeElement = job.querySelector(
              "div[data-icon-name='Address']"
            );

            const jobUrl = jobId
              ? `https://jobs.careers.microsoft.com/global/en/job/${jobId}`
              : "";

            return {
              title: finalTitle,
              location:
                locationElement?.nextElementSibling?.textContent?.trim() || "",
              updateDate:
                dateElement?.nextElementSibling?.textContent?.trim() || "",
              workType: workTypeElement?.textContent?.trim() || "",
              link: jobUrl,
              id: jobId,
            };
          } catch (error) {
            console.log("Error processing job item:", error);
            return null;
          }
        })
        .filter((job) => job && job.title);
    });

    const processedJobs = jobs
      .filter((job): job is any => job !== null && job !== undefined)
      .map((job) => {
        const parsedDate = parseDateString(job.updateDate);
        return {
          ...job,
          updateDate: parsedDate || job.updateDate,
        };
      });

    console.log(`Found ${processedJobs.length} jobs`);
    console.log("Scraped jobs:", processedJobs);

    return processedJobs;
  } catch (error) {
    console.error("Error scraping Microsoft jobs:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
