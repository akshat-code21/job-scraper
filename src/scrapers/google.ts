import puppeteer from "puppeteer";
interface GoogleJob {
  title: string;
  location: string;
  updateDate: string;
  link: string;
  company ?: string
}
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

    let hasMoreJobs = true;
    let allJobs: GoogleJob[] = [];
    let pageNumber = 1;
    const maxPages = 1;

    while (hasMoreJobs && pageNumber <= maxPages) {
      try {
        console.log(`Scraping Googlepage ${pageNumber}...`);
        
        if (pageNumber > 1) {
          const nextButton = await page.$('[aria-label="Go to next page"], [aria-label="Go to next page"]');
          if (!nextButton) {
            console.log("Next button not found - reached last page");
            break;
          }

          const isButtonEnabled = await page.evaluate((btn) => {
            const isVisible = (btn as HTMLElement).offsetWidth > 0 && (btn as HTMLElement).offsetHeight > 0;
            const isDisabled = btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true';
            return isVisible && !isDisabled;
          }, nextButton);

          if (!isButtonEnabled) {
            console.log("Next button is disabled - reached last page");
            break;
          }

          await nextButton.click();
          await page.waitForSelector("ul.spHGqe", { timeout: 10000 });
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const currentPageJobs = await page.evaluate(() => {
          const jobsList = document.querySelector("ul.spHGqe");
          if (!jobsList) return [];

          const jobItems = jobsList.querySelectorAll("li");
          return Array.from(jobItems)
            .map((job) => {
              const titleElement = job.querySelector("h3");
              const locationElement = Array.from(job.querySelectorAll("span")).find(
                (span) => span.textContent?.includes(",")
              );
              const dateElement = job.querySelector('span[data-is-tooltip-wrapper="true"]');
              const learnMoreLink = job.querySelector("a")?.href;

              return {
                title: titleElement?.textContent?.trim() || "",
                location:
                  locationElement?.textContent?.replace("place", "").trim() || "",
                updateDate: new Date().toISOString(),
                link: learnMoreLink || "",
              };
            })
            .filter((job) => job.title && job.link);
        });

        if (currentPageJobs.length === 0) {
          console.log("No jobs found on current page - likely reached the end");
          break;
        }

        console.log(`Found ${currentPageJobs.length} jobs on page ${pageNumber}`);
        allJobs = [...allJobs, ...currentPageJobs];
        console.log(`Total jobs collected so far: ${allJobs.length}`);

        const hasNextPage = await page.evaluate(() => {
          const nextButton = document.querySelector('[aria-label="Next page"], [aria-label="Go to next page"]');
          if (!nextButton) return false;
          
          const isVisible = (nextButton as HTMLButtonElement).offsetWidth > 0 && (nextButton as HTMLButtonElement).offsetHeight > 0;
          const isDisabled = nextButton.hasAttribute('disabled') || nextButton.getAttribute('aria-disabled') === 'true';
          return isVisible && !isDisabled;
        });

        if (!hasNextPage) {
          console.log("No next page button found or button is disabled - reached last page");
          break;
        }

        pageNumber++;
      } catch (error) {
        console.log("Error during pagination:", error);
        hasMoreJobs = false;
      }
    }
    const jobs = allJobs;

    const jobsWithDescriptions = await Promise.all(
      jobs.map(async (job) => {
        const jobPage = await browser.newPage();
        try {
          await jobPage.goto(job.link, { waitUntil: 'networkidle0' });
          
          await jobPage.waitForSelector('h3', { timeout: 10000 });

          const description = await jobPage.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('h3'));
            console.log('Found headings:', headings.map(h => h.textContent?.trim()));

            const aboutJobHeading = headings.find(h3 => 
              h3.textContent?.trim().toLowerCase() === 'about the job' ||
              h3.textContent?.trim().toLowerCase() === 'about this role' ||
              h3.textContent?.trim().toLowerCase() === 'role description'
            );
            
            if (!aboutJobHeading) {
              console.log('Could not find about job heading');
              return "";
            }


            let descriptionText = "";
            let currentElement = aboutJobHeading.nextElementSibling;
            
            while (currentElement && 
                   !(currentElement.tagName.toLowerCase() === 'h3' || 
                     (currentElement.tagName.toLowerCase() === 'h2'))) {
              if (currentElement.textContent) {
                const text = currentElement.textContent.trim();
                if (text) {
                  descriptionText += text + "\n";
                }
              }
              currentElement = currentElement.nextElementSibling;
            }

            return descriptionText.trim();
          });

          return {
            ...job,
            description,
          };
        } catch (error) {
          console.error(`Error fetching description for job ${job.title}:`, error);
          return {
            ...job,
            description: "",
          };
        } finally {
          await jobPage.close();
        }
      })
    );

    console.log("Scraped jobs:", jobsWithDescriptions);
    console.log("jobs length : "+jobsWithDescriptions.length)
    return jobsWithDescriptions;
  } catch (error) {
    console.error("Error scraping Google jobs:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
