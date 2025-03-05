import puppeteer from "puppeteer";
import parseDateString from "../utils/parseDateString";

interface MicrosoftJob {
  title: string;
  location: string;
  updateDate: string;
  link: string;
  id: string;
  description?: string;
  company ?: string
}

export default async function scrapMicrosoftJobs() {
  console.log("Starting Microsoft jobs scraper");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    let allJobs: MicrosoftJob[] = [];
    let currentPage = 1;
    const maxPages = 1;

    while (currentPage <= maxPages) {
      console.log(`Scraping MS page ${currentPage}...`);

      await page.goto(
        `https://jobs.careers.microsoft.com/global/en/search?p=Software%20Engineering&l=en_us&pg=${currentPage}&pgSz=20&o=Relevance&flt=true`,
        { waitUntil: "networkidle2" }
      );

      await page.waitForSelector("div.ms-List-page", { timeout: 30000 });

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const pageJobs = await page.evaluate(() => {
        const jobLists = Array.from(
          document.querySelectorAll("div.ms-List-page")
        );
        console.log(`Found ${jobLists.length} job list containers`);

        let allJobItems: Element[] = [];

        jobLists.forEach((list, index) => {
          const jobItems = Array.from(
            list.querySelectorAll("div[role='listitem']")
          );
          console.log(
            `List container ${index + 1} has ${jobItems.length} job items`
          );
          allJobItems = [...allJobItems, ...jobItems];
        });

        console.log(`Total MS job items found: ${allJobItems.length}`);

        return allJobItems
          .map((job) => {
            try {
              const jobContainer = job.querySelector(
                "div[aria-label^='Job item']"
              );
              const jobAriaLabel =
                jobContainer?.getAttribute("aria-label") || "";

              const jobIdMatch = jobAriaLabel.match(/Job item (\d+)/);
              const jobId = jobIdMatch ? jobIdMatch[1] : "";

              const titleMatch = jobAriaLabel.match(/Job item \d+ (.+)/);
              const title = titleMatch ? titleMatch[1] : "";

              let finalTitle = title;
              if (!finalTitle) {
                const seeDetailsButton = job.querySelector(
                  "button.ms-Link[aria-label^='click to see details']"
                );
                const seeDetailsLabel =
                  seeDetailsButton?.getAttribute("aria-label") || "";
                const detailsTitleMatch = seeDetailsLabel.match(
                  /click to see details for (.+)/
                );
                finalTitle = detailsTitleMatch ? detailsTitleMatch[1] : "";
              }

              const locationElement = job.querySelector(
                "i[data-icon-name='POI']"
              );
              const dateElement = job.querySelector(
                "i[data-icon-name='Clock']"
              );

              const formattedTitle = finalTitle.replace(/\s+/g, "-");
              const jobUrl = jobId
                ? `https://jobs.careers.microsoft.com/global/en/job/${jobId}/${formattedTitle}`
                : "";

              return {
                title: finalTitle,
                location:
                  locationElement?.nextElementSibling?.textContent?.trim() ||
                  "",
                updateDate:
                  dateElement?.nextElementSibling?.textContent?.trim() || "",
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
      const validJobs = pageJobs.filter(
        (job): job is MicrosoftJob => job !== null
      );
      console.log(`Found ${validJobs.length} jobs on page ${currentPage}`);
      console.log(`Page ${currentPage} jobs:`, validJobs);
      allJobs = [...allJobs, ...validJobs];
      currentPage++;
    }

    console.log(
      `Found ${allJobs.length} jobs in total `
    );

    const processedJobs = [];

    console.log(`Processing job descriptions...`);
    for (let i = 0; i < allJobs.length; i++) {
      const job = allJobs[i];

      const parsedDate = parseDateString(job.updateDate);

      if (job.link) {
        try {
          await page.goto(job.link, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });

          await page.waitForSelector("body", { timeout: 10000 });

          await new Promise((resolve) => setTimeout(resolve, 3000));

          const jobDescription = await page.evaluate(() => {
            const headings = Array.from(
              document.querySelectorAll("h1, h2, h3, h4, h5, h6, div, p, span")
            );
            const overviewElement = headings.find(
              (el) => el.textContent && el.textContent.trim() === "Overview"
            );

            if (overviewElement) {
              let overviewText = "";
              const overviewContainer = overviewElement.nextElementSibling;
              if (overviewContainer && overviewContainer.textContent) {
                overviewText = overviewContainer.textContent.trim();
              }
              if (!overviewText) {
                const pageContent = document.body.textContent || "";
                const overviewIndex = pageContent.indexOf("Overview");

                if (overviewIndex !== -1) {
                  const nextSections = [
                    "Responsibilities",
                    "Qualifications",
                    "Requirements",
                    "Skills",
                    "Experience",
                  ];
                  let endIndex = -1;

                  for (const section of nextSections) {
                    const sectionIndex = pageContent.indexOf(
                      section,
                      overviewIndex + "Overview".length
                    );
                    if (
                      sectionIndex !== -1 &&
                      (endIndex === -1 || sectionIndex < endIndex)
                    ) {
                      endIndex = sectionIndex;
                    }
                  }

                  if (endIndex !== -1) {
                    overviewText = pageContent
                      .substring(overviewIndex + "Overview".length, endIndex)
                      .trim();
                  }
                }
              }

              return overviewText;
            }

            return "";
          });

          const cleanDescription = jobDescription
            .replace(/\s+/g, " ")
            .replace(/\n+/g, "\n")
            .trim();

          processedJobs.push({
            ...job,
            updateDate: parseDateString(job.updateDate)?.toISOString() || new Date().toISOString(),
            description: cleanDescription || "",
          });
        } catch (error) {
          console.error(
            `Error fetching description for job ${job.title}:`,
            error
          );
          processedJobs.push({
            ...job,
            updateDate: parseDateString(job.updateDate)?.toISOString() || new Date().toISOString(),
            description: "",
          });
        }
      } else {
        processedJobs.push({
          ...job,
          updateDate: parseDateString(job.updateDate)?.toISOString() || new Date().toISOString(),
          description: "",
        });
      }
    }

    console.log(`Successfully processed ${processedJobs.length} jobs in total`);
    return processedJobs;
  } catch (error) {
    console.error("Error scraping Microsoft jobs:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
