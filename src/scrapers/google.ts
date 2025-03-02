import puppeteer from "puppeteer";

export default async function scrapGoogleJobs() {
  console.log("Starting Google jobs scraper");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(
      "https://www.google.com/about/careers/applications/jobs/results/"
    );

    await page.waitForSelector("ul.spHGqe", { timeout: 10000 });
    await page.waitForFunction(
      () => {
        const list = document.querySelector("ul.spHGqe");
        return list && list.children.length > 0;
      },
      { timeout: 10000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Increased wait time

    const jobs = await page.evaluate(() => {
      const jobsList = document.querySelector("ul.spHGqe");
      console.log("Found jobsList:", !!jobsList);

      if (!jobsList) return [];

      const jobItems = jobsList.querySelectorAll("li");
      console.log("Number of job items found:", jobItems.length);

      return Array.from(jobItems)
        .map((job) => {
          const titleElement = job.querySelector("h3");
          const locationElement = Array.from(job.querySelectorAll("span")).find(
            (span) => span.textContent?.includes(",")
          );
          const dateElement = job.querySelector("span:last-child");

          const allDivs = Array.from(job.querySelectorAll("div")).filter(
            (div) => div.textContent?.trim()
          );
          const descriptionElement =
            allDivs.length > 0
              ? allDivs.reduce((longest, current) =>
                  (current.textContent?.length || 0) >
                  (longest.textContent?.length || 0)
                    ? current
                    : longest
                )
              : null;

          console.log("Job element contents:", {
            titleFound: !!titleElement,
            locationFound: !!locationElement,
            dateFound: !!dateElement,
            descFound: !!descriptionElement,
            titleText: titleElement?.textContent,
            locationText: locationElement?.textContent,
          });

          return {
            title: titleElement?.textContent?.trim() || "",
            location:
              locationElement?.textContent?.replace("place", "").trim() || "",
            updateDate: dateElement?.textContent?.trim() || "",
            description: descriptionElement?.textContent?.trim() || "",
            link: job.querySelector("a")?.href || "",
          };
        })
        .filter((job) => job.title || job.description);
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
