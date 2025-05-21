import { Injectable } from '@nestjs/common';

interface QaPair {
  question: string;
  answer: string;
}

@Injectable()
export class QaProcessorService {
  async processQaPairs(qaPairs: QaPair[]): Promise<string> {
    // Format Q&A pairs into a structured text format
    return qaPairs.map(pair => {
      return `Q: ${pair.question}\nA: ${pair.answer}`;
    }).join('\n\n');
  }
}