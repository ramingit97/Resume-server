import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from "openai";



@Injectable()
export class UserAiService { 
  private readonly logger = new Logger(UserAiService.name);
  private openaiClient: OpenAI;

  constructor() {
    // Клиент OpenAI должен быть инициализирован
    this.openaiClient = new OpenAI({});
  }


  private getUserProfileSchema() {
    return {
      type: 'object',
      properties: {
        fullName: { 
          type: 'string', 
          description: 'Имя и фамилия пользователя. Если не указано, придумайте реалистичное имя.' 
        },
        gender: { 
          type: 'string', 
          enum: ['male', 'female', 'other'], 
          description: 'Пол пользователя, если можно определить по контексту.' 
        },
        about: { 
          type: 'string', 
          description: 'Краткое описание пользователя — 2–3 предложения о его деятельности, интересах, целях.' 
        },
        contact: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Профессиональный или личный email пользователя.' },
            phone: { type: 'string', description: 'Номер телефона в международном формате (если указан).' },
            location: { type: 'string', description: 'Город или страна проживания.' },
            linkedin: { type: 'string', description: 'Ссылка на LinkedIn, если упоминается.' },
            github: { type: 'string', description: 'Ссылка на GitHub, если пользователь разработчик.' },
            website: { type: 'string', description: 'Личный сайт или портфолио, если есть.' },
          },
        },
        skills: {
          type: 'array',
          description: 'Список ключевых навыков пользователя с уровнями (1–5).',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Название навыка, например, JavaScript, Design, Sales.' },
              level: { type: 'number', description: 'Уровень владения от 1 до 5.' },
              category: { type: 'string', description: 'Категория навыка (например, Технические, Коммуникационные).' },
            },
            required: ['name', 'level'],
          },
        },
        hobbies: {
          type: 'array',
          description: 'Хобби и интересы пользователя (спорт, музыка, чтение, путешествия и т.д.).',
          items: { type: 'string' },
        },
        languages: {
          type: 'array',
          description: 'Список языков, которыми владеет пользователь.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Название языка (например, Английский, Русский).' },
              level: { type: 'string', description: 'Уровень владения (например, A2, B1, C1).' },
            },
            required: ['name'],
          },
        },
        goals: {
          type: 'string',
          description: 'Краткое описание профессиональных или личных целей пользователя (опционально).',
        },
        socialPresence: {
          type: 'array',
          description: 'Ссылки на социальные сети (Instagram, Twitter, Telegram и т.д.).',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              url: { type: 'string' },
            },
          },
        },
      },
      required: ['fullName', 'about', 'skills'],
    };
  }

  async parseChatToProfileDataOpenAI(rawText: string): Promise<any> {
    const schema = this.getUserProfileSchema();
  
    const systemPrompt = `Вы — умный карьерный ассистент и эксперт по самопрезентации. 
  Ваша задача — извлечь или дополнить недостающие данные о пользователе на основе его текста или диалога. 
  Результат должен быть представлен в формате JSON, строго соответствующем следующей схеме. 
  Если каких-то данных нет — аккуратно придумайте реалистичные значения (например, имя, краткое описание, город, навыки, интересы).
  Не добавляйте пояснений, только JSON.
  
  Структура JSON:
  ${JSON.stringify(schema, null, 2)}
  `;
  
    try {
      const response = await this.openaiClient.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Создай профиль пользователя из этого текста:\n\n---\n\n${rawText}` },
        ],
        response_format: { type: "json_object" },
      });
  
      const jsonString = response.choices[0].message.content;
  
      if (!jsonString) {
        throw new HttpException('API вернул пустой ответ.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
  
      let cleanedJsonString = jsonString.trim();
      if (cleanedJsonString.startsWith('```json')) {
        cleanedJsonString = cleanedJsonString.substring(7, cleanedJsonString.lastIndexOf('```')).trim();
      }
  
      const parsedData = JSON.parse(cleanedJsonString);
      return parsedData;
    } catch (error) {
      this.logger.error('Error during OpenAI JSON parsing:', error.stack);
      throw new HttpException('Ошибка при обращении к OpenAI API.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}