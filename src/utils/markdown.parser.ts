// src/utils/markdown.parser.ts
import * as markdownit from 'markdown-it';

export interface ParsedCv {
  header: string; // Имя и Контакты
  left: string;   // Образование/Навыки/Стек
  right: string;  // Summary/Опыт работы/Проекты
}

export function parseCvMarkdown(markdownString: string): ParsedCv {
  const parts = markdownString.split(/(^##\s.*$)/m);
  // Фильтруем, убирая пустые строки, которые могут возникнуть из-за split
  const sections = parts.map(s => s.trim()).filter(s => s.length > 0);

  let header = '';
  let left = '';
  let right = '';

  const headerStarts = ['контакты'];
  // Важно: 'навыки' и 'стек' должны быть в 'left'
  const leftStarts = ['образование', 'курсы', 'навыки', 'стек', 'языки', 'хобби', 'интересы']; 
  const rightStarts = ['summary', 'опыт работы', 'проекты'];

  let currentTarget: 'header' | 'left' | 'right' = 'header';

  for (const part of sections) {
    let sectionTitle = '';
    
    // 1. Обработка заголовка первого уровня (# Имя)
    if (part.startsWith('# ')) {
      header += part + '\n\n'; // Гарантируем перенос после H1
      continue;
    }

    // 2. Определение текущей зоны
    if (part.startsWith('##')) {
      sectionTitle = part.replace(/##\s*/, '').toLowerCase();

      if (headerStarts.some(t => sectionTitle.includes(t))) {
        currentTarget = 'header';
      } else if (leftStarts.some(t => sectionTitle.includes(t))) {
        currentTarget = 'left';
      } else if (rightStarts.some(t => sectionTitle.includes(t))) {
        currentTarget = 'right';
      }
    }
    
    // 3. Конкатенация с ДОБАВЛЕНИЕМ ГАРАНТИРОВАННОГО РАЗДЕЛИТЕЛЯ
    // Это ключевое изменение! Мы добавляем '\n\n' перед каждой новой частью, 
    // чтобы Markdown-парсер не склеивал текст.
    if (currentTarget === 'header') {
        if (!header.endsWith('\n\n') && header.length > 0) header += '\n\n';
        header += part;
    } 
    else if (currentTarget === 'left') {
        if (!left.endsWith('\n\n') && left.length > 0) left += '\n\n';
        left += part;
    }
    else { // currentTarget === 'right'
        if (!right.endsWith('\n\n') && right.length > 0) right += '\n\n';
        right += part;
    }
  }

  return { header, left, right };
}

// ... в generateCvText, вам просто нужно убедиться,
// что секции идут в правильном порядке, чтобы парсер их поймал:
// # Имя -> ## Контакты -> ## Образование -> ## Навыки -> ## Стек -> ## Summary -> ## Опыт работы -> ## Проекты


export function renderContactsBlock(contactsMarkdown: string) {
  // контакты идут строками
  const lines = contactsMarkdown
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('##'));

  // превращаем в спаны
  const itemsHTML = lines.map(line => `<span class="contact-item">${line}</span>`).join('');

  return `<div class="contacts-inline">${itemsHTML}</div>`;
}