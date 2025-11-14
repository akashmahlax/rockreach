// Define tool shape without importing specific Tool type to avoid SDK typing friction
import { z } from 'zod';
import puppeteer from 'puppeteer';

export const visitWebsiteTool = {
  description: `Visit a website and extract its content. Use this to research companies, find contact information, or analyze web pages. Returns the page title, meta description, and main text content.`,
  inputSchema: z.object({
    url: z.string().url().describe('The URL to visit'),
    extractLinks: z.boolean().optional().describe('Whether to extract links from the page'),
  }),
  execute: async ({ url, extractLinks }: { url: string; extractLinks?: boolean }) => {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // Set a reasonable timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Extract page content
      const content = await page.evaluate((shouldExtractLinks) => {
        // Get title
        const title = document.title;

        // Get meta description
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        // Get main text content (remove scripts, styles, etc.)
        const bodyClone = document.body.cloneNode(true) as HTMLElement;
        bodyClone.querySelectorAll('script, style, nav, footer, iframe').forEach(el => el.remove());
        const mainText = bodyClone.innerText.trim().slice(0, 5000); // Limit to 5000 chars

        // Extract links if requested
        let links: string[] = [];
        if (shouldExtractLinks) {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          links = anchors
            .map(a => a.getAttribute('href'))
            .filter(href => href && (href.startsWith('http') || href.startsWith('/')))
            .slice(0, 50) as string[];
        }

        return { title, metaDescription, mainText, links };
      }, extractLinks || false);

      return {
        success: true,
        url,
        ...content,
      };
    } catch (error) {
      console.error('Website visit error:', error);
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : 'Failed to visit website',
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
} as const;
