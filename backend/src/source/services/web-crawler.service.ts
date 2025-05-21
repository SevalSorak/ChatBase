import { Injectable, BadRequestException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as xmlParser from 'fast-xml-parser';
import { URL } from 'url';

@Injectable()
export class WebCrawlerService {
  async crawlWebsite(
    url: string,
    includePaths?: string,
    excludePaths?: string,
  ): Promise<{ content: string; pageCount: number }> {
    try {
      const baseUrl = new URL(url);
      const includePatterns = includePaths ? this.parsePathPatterns(includePaths) : [];
      const excludePatterns = excludePaths ? this.parsePathPatterns(excludePaths) : [];
      
      // For simplicity, we'll just crawl the main page in this example
      // In a real implementation, you would recursively crawl links
      const content = await this.fetchSinglePage(url);
      
      return {
        content,
        pageCount: 1,
      };
    } catch (error) {
      console.error(`Error crawling website ${url}:`, error);
      throw new BadRequestException(`Failed to crawl website: ${error.message}`);
    }
  }

  async processSitemap(
    url: string,
    includePaths?: string,
    excludePaths?: string,
  ): Promise<{ content: string; pageCount: number }> {
    try {
      const response = await axios.get(url);
      const sitemapXml = response.data;
      
      const parser = new xmlParser.XMLParser();
      const parsedSitemap = parser.parse(sitemapXml);
      
      // Extract URLs from sitemap
      const urls = parsedSitemap.urlset?.url?.map(item => item.loc) || [];
      
      // Filter URLs based on include/exclude patterns
      const includePatterns = includePaths ? this.parsePathPatterns(includePaths) : [];
      const excludePatterns = excludePaths ? this.parsePathPatterns(excludePaths) : [];
      
      const filteredUrls = urls.filter(urlString => {
        const urlObj = new URL(urlString);
        const path = urlObj.pathname;
        
        // Check exclude patterns first
        if (excludePatterns.length > 0 && this.matchesAnyPattern(path, excludePatterns)) {
          return false;
        }
        
        // Then check include patterns if specified
        if (includePatterns.length > 0) {
          return this.matchesAnyPattern(path, includePatterns);
        }
        
        return true;
      });
      
      // For simplicity, we'll just fetch the first URL in this example
      // In a real implementation, you would fetch all URLs
      let content = '';
      if (filteredUrls.length > 0) {
        content = await this.fetchSinglePage(filteredUrls[0]);
      }
      
      return {
        content,
        pageCount: filteredUrls.length,
      };
    } catch (error) {
      console.error(`Error processing sitemap ${url}:`, error);
      throw new BadRequestException(`Failed to process sitemap: ${error.message}`);
    }
  }

  async fetchSinglePage(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      const html = response.data;
      
      // Use cheerio to parse HTML and extract text content
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style').remove();
      
      // Get text content
      const text = $('body').text().trim()
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n+/g, '\n'); // Replace multiple newlines with single newline
      
      return text;
    } catch (error) {
      console.error(`Error fetching page ${url}:`, error);
      throw new BadRequestException(`Failed to fetch page: ${error.message}`);
    }
  }

  private parsePathPatterns(pathsString: string): RegExp[] {
    return pathsString.split(',')
      .map(pattern => pattern.trim())
      .filter(pattern => pattern.length > 0)
      .map(pattern => {
        // Convert glob-like patterns to regex
        const regexPattern = pattern
          .replace(/\*/g, '.*') // Convert * to .*
          .replace(/\?/g, '.'); // Convert ? to .
        
        return new RegExp(`^${regexPattern}$`);
      });
  }

  private matchesAnyPattern(path: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(path));
  }
}