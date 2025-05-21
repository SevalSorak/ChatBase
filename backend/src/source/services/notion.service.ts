import { Injectable, BadRequestException } from '@nestjs/common';
import { Client } from '@notionhq/client';

@Injectable()
export class NotionService {
  async fetchNotionContent(pageId: string, accessToken: string): Promise<{ title: string; content: string }> {
    try {
      const notion = new Client({ auth: accessToken });
      
      // Fetch page metadata
      const page = await notion.pages.retrieve({ page_id: pageId });
      
      // Extract title from page properties
      const title = this.extractTitleFromPage(page);
      
      // Fetch page blocks (content)
      const blocks = await this.fetchAllBlocksRecursively(notion, pageId);
      
      // Convert blocks to text
      const content = this.blocksToText(blocks);
      
      return { title, content };
    } catch (error) {
      console.error(`Error fetching Notion content for page ${pageId}:`, error);
      throw new BadRequestException(`Failed to fetch Notion content: ${error.message}`);
    }
  }

  private extractTitleFromPage(page: any): string {
    // The title is usually in the "Name" or "Title" property
    const titleProperty = page.properties?.Name || page.properties?.Title;
    
    if (titleProperty?.title && Array.isArray(titleProperty.title)) {
      return titleProperty.title.map((t: any) => t.plain_text).join('');
    }
    
    return 'Untitled Notion Page';
  }

  private async fetchAllBlocksRecursively(notion: Client, blockId: string): Promise<any[]> {
    const blocks: any[] = [];
    let cursor: string | undefined;
    
    while (true) {
      const response = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
      });
      
      blocks.push(...(response.results as any[]));
      
      if (!response.has_more) break;
      cursor = response.next_cursor || undefined;
    }
    
    // Fetch children for blocks that can have them
    for (const block of blocks) {
      if (block.has_children) {
        block.children = await this.fetchAllBlocksRecursively(notion, block.id);
      }
    }
    
    return blocks;
  }

  private blocksToText(blocks: any[]): string {
    let text = '';
    
    for (const block of blocks) {
      text += this.blockToText(block);
      
      if (block.children && block.children.length > 0) {
        text += this.blocksToText(block.children);
      }
    }
    
    return text;
  }

  private blockToText(block: any): string {
    const type = block.type;
    
    if (!type || !block[type]) {
      return '';
    }
    
    switch (type) {
      case 'paragraph':
        return this.richTextToPlainText(block.paragraph.rich_text) + '\n\n';
      case 'heading_1':
        return '# ' + this.richTextToPlainText(block.heading_1.rich_text) + '\n\n';
      case 'heading_2':
        return '## ' + this.richTextToPlainText(block.heading_2.rich_text) + '\n\n';
      case 'heading_3':
        return '### ' + this.richTextToPlainText(block.heading_3.rich_text) + '\n\n';
      case 'bulleted_list_item':
        return '• ' + this.richTextToPlainText(block.bulleted_list_item.rich_text) + '\n';
      case 'numbered_list_item':
        return '1. ' + this.richTextToPlainText(block.numbered_list_item.rich_text) + '\n';
      case 'to_do':
        const checked = block.to_do.checked ? '[x]' : '[ ]';
        return `${checked} ${this.richTextToPlainText(block.to_do.rich_text)}\n`;
      case 'toggle':
        return this.richTextToPlainText(block.toggle.rich_text) + '\n\n';
      case 'code':
        return '```\n' + this.richTextToPlainText(block.code.rich_text) + '\n```\n\n';
      case 'quote':
        return '> ' + this.richTextToPlainText(block.quote.rich_text) + '\n\n';
      case 'divider':
        return '---\n\n';
      default:
        return '';
    }
  }

  private richTextToPlainText(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) {
      return '';
    }
    
    return richText.map(text => text.plain_text || '').join('');
  }
}