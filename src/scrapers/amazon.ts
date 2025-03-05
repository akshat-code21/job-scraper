import puppeteer from "puppeteer";
interface AmazonJob {
  title: string;
  location: string;
  updateDate: string;
  description: string;
  link: string;
  company ?: string
}
export default async function scrapAmazonJobs(noOfPages:number) {
  console.log("Starting Amazon jobs scraper");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    let allJobs: AmazonJob[] = [];
    let currentPage = 1;
    const maxPages = noOfPages || 2;

    while (currentPage <= maxPages) {
      console.log(`Scraping Amazon page ${currentPage}...`);

      if (currentPage === 1) {
        await page.goto(
          `https://www.amazon.jobs/content/en/job-categories/software-development#search`
        );
      } else {
        const nextButton = await page.$('[data-test-id="next-page"]');
        if (!nextButton) {
          console.log("Next button not found - reached last page");
          break;
        }
        await nextButton.click();
        await page.waitForSelector('ul[class*="jobs"]');
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await page.evaluate(() => {
        const readMoreButtons = document.querySelectorAll(
          'button[class*="footer-module"]'
        );
        readMoreButtons.forEach((btn) => {
          (btn as HTMLButtonElement).click();
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pageJobs = await page.evaluate(() => {
        const jobsList = document.querySelector('ul[class*="jobs"]');

        if (!jobsList) return [];

        const jobItems = jobsList.querySelectorAll("li");
        return Array.from(jobItems).map((job) => {
          const titleElement = job.querySelector("h3");
          const locationElement = job.querySelector(
            '[data-test-component="StencilText"]'
          );
          const dateElement = job.querySelectorAll(
            '[data-test-component="StencilText"]'
          )[1];
          const descriptionElement = job.querySelector(
            "div[class*='job-card-module_content'"
          );

          return {
            title: titleElement?.textContent?.trim() || "",
            location: locationElement?.textContent?.trim() || "",
            updateDate: dateElement?.textContent?.split(" ")[1]?.trim() || new Date().toISOString(),
            description:
              descriptionElement?.querySelector("div")?.textContent?.trim() ||
              "",
            link: job.querySelector("a")?.href || "",
          };
        });
      });

      console.log(`Found ${pageJobs.length} jobs on page ${currentPage}`);
      console.log(`Page ${currentPage} jobs:`, pageJobs);

      allJobs = [...allJobs, ...pageJobs];

      const hasNextPage = await page.evaluate(() => {
        const nextButton = document.querySelector('[data-test-id="next-page"]');
        return nextButton && !nextButton.hasAttribute("aria-disabled");
      });

      if (!hasNextPage) {
        console.log("Reached last page");
        break;
      }

      currentPage++;
    }

    console.log(`Scraped ${allJobs.length} jobs in total`);
    return allJobs;
  } catch (error) {
    console.error("Error scraping Amazon jobs:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
