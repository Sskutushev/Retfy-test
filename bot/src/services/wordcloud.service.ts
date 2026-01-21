import { pool } from '../database/connection';
import { WordCount } from '../types';

export class WordCloudService {
  // A more comprehensive list of stop words for Russian and English
  private static stopWords = new Set([
    'и', 'в', 'не', 'на', 'я', 'что', 'с', 'а', 'как', 'это', 'по',
    'но', 'для', 'за', 'к', 'у', 'о', 'из', 'от', 'то', 'же', 'бы', 'ну',
    'да', 'нет', 'все', 'всё', 'он', 'она', 'они', 'мы', 'вы', 'ты', 'так',
    'вот', 'там', 'тут', 'еще', 'ещё', 'когда', 'где', 'кто',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'is', 'are', 'was', 'were', 'be', 'being', 'been', 'it', 'i', 'you',
    'he', 'she', 'we', 'they', 'of', 'with', 'that', 'this', 'my', 'your',
    'not', 'so', 'if', 'me', 'just', 'do', 'im'
  ]);

  private static getStartDate(period: 'today' | 'week' | 'month' | 'all'): Date {
    const now = new Date();
    if (period === 'today') {
        now.setHours(0, 0, 0, 0);
        return now;
    }
    if (period === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    }
    if (period === 'month') {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(0); 
  }

  /**
   * Gets the top N most frequent words in a chat for a given period.
   * @param chatId - 
   * @param period - 
   * @param limit - 
   * @returns 
   */
  static async getTopWords(
    chatId: number,
    period: 'today' | 'week' | 'month' | 'all',
    limit: number = 20
  ): Promise<{ words: WordCount[], totalMessages: number }> {
    const startDate = this.getStartDate(period);
    
    try {
      // 1. Fetch all messages for the period
      const query = `
        SELECT message_text FROM messages
        WHERE chat_id = $1 AND message_date >= $2;
      `;
      const { rows } = await pool.query(query, [chatId, startDate]);

      if (rows.length === 0) {
        return { words: [], totalMessages: 0 };
      }

      // 2. Process words
      const wordFrequencies = new Map<string, number>();
      
      for (const row of rows) {
        const text = row.message_text;
        
        // Regex to split into words, removing punctuation and handling different scripts
        const words = text.toLowerCase().split(/[\s,.;:!?()"'{}\[\]<>«»—–]+/);

        for (const word of words) {
          // Filter out stop words, short words, mentions, and links
          if (
            word.length > 2 &&
            !this.stopWords.has(word) &&
            !word.startsWith('@') &&
            !word.startsWith('#') &&
            !word.startsWith('http')
          ) {
            wordFrequencies.set(word, (wordFrequencies.get(word) || 0) + 1);
          }
        }
      }

      // 3. Sort and get top N
      const sortedWords = Array.from(wordFrequencies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word, count]) => ({ word, count }));
        
      return { words: sortedWords, totalMessages: rows.length };

    } catch (error) {
      console.error('Error in WordCloudService.getTopWords:', error);
      throw error;
    }
  }
}
