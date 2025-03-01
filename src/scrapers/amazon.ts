import puppeteer from "puppeteer";

export default async function scrapAmazonJobs() {
  console.log("Starting Amazon jobs scraper");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(
      "https://www.amazon.jobs/content/en/job-categories/software-development#search"
    );

    await page.waitForSelector('ul[class*="jobs"]');

    await page.evaluate(() => {
      const readMoreButtons = document.querySelectorAll(
        'button[class*="footer-module"]'
      );
      readMoreButtons.forEach((btn) => {
        (btn as HTMLButtonElement).click();
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const jobs = await page.evaluate(() => {
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
          updateDate: dateElement?.textContent?.split(" ")[1]?.trim() || "",
          description:
            descriptionElement?.querySelector("div")?.textContent?.trim() || "",
          link: job.querySelector("a")?.href || "",
        };
      });
    });

    console.log("Scraped jobs:", jobs);
    return jobs;
  } catch (error) {
    console.error("Error scraping Amazon jobs:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
