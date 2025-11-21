import { Injectable } from '@nestjs/common';
import OpenAI from "openai";
import * as puppeteer from 'puppeteer';
import * as markdownit from 'markdown-it'
import * as fs from 'fs';

import { getThemeCss, CvTheme } from './themes/theme.service';
import { parseCvMarkdown } from './utils/markdown.parser';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async generateCvText(data: any): Promise<string> {

    const systemPrompt = `
Ты — профессиональный рекрутер и автор резюме с 10-летним опытом, специализирующийся на создании резюме, ориентированных на результаты.
Твоя задача — создать **качественное и структурированное резюме в Markdown** на основе предоставленных данных, строго следуя новому порядку секций для корректного отображения в двухколоночном макете.

СТРОГАЯ ИЕРАРХИЯ СЕКЦИЙ (Для парсера "Header-First"):

# Имя — Позиция
(Этот блок вместе с Контактами пойдет в Шапку)

## Контакты
Email: ...
Телефон: ...
GitHub: ...
LinkedIn: ...
Локация: ...

---
// НАЧАЛО БЛОКА ЛЕВОЙ КОЛОНКИ (ВТОРОСТЕПЕННЫЕ СЕКЦИИ)
---

## Образование/Курсы
- ...

## Навыки
- ...

## Стек
- ...

## Языки
- ...

## Хобби/Интересы
- ... (Не более 1-2 пунктов, подчеркивающих soft skills или баланс)

---
// НАЧАЛО БЛОКА ПРАВОЙ КОЛОНКИ (КЛЮЧЕВЫЕ СЕКЦИИ)
---

## Summary
Короткий, цепляющий абзац (2-3 предложения), фокусирующийся на ключевой экспертизе и результатах.

## Опыт работы
**Компания** — Должность (мм.гггг — настоящее время / мм.гггг)
* **Глагол** + результат + метрика (обязательно измеримый результат)
* **Глагол** + результат + метрика
* **Глагол** + результат + метрика

## Проекты
**Название проекта** — (Ключевые Технологии: Node.js, NestJS, Docker)
* **Глагол** + результат + метрика
* **Глагол** + результат + метрика
* **Глагол** + результат + метрика

ПРАВИЛА ГЕНЕРАЦИИ КОНТЕНТА:
1.  **Строгое Соблюдение Порядка:** Всегда генерируй секции **точно в указанном выше порядке**.
2.  **Длина Списков:** В секциях Опыт и Проекты всегда ровно **3 пункта** (*).
3.  **Сильные Глаголы:** Каждый пункт должен начинаться с активного глагола (Внедрил, Оптимизировал, Достиг, Спроектировал, Руководил).
4.  **Измеримые Метрики:** Минимум 50% пунктов должны включать **измеримые метрики** (например: сокращение на 40%, увеличение в 2 раза, x3, $50k).
5.  **Форматирование:** Используй только чистый Markdown. **Запрещено** использовать HTML-теги, вложенные списки или дополнительные отступы.
`;


    const client = new OpenAI();

    const resp = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: systemPrompt }, // <-- Используем новый, детальный промпт
        { role: "user", content: JSON.stringify(data) }
       ]
    });

    console.log('res',resp);
  
    return resp.output_text
  }

//   async test(){
//     const markdown = 
//       `
//       ## Опыт работы
//       **Компания:** укажите компанию
//       **Должность:** укажите должность
//       **Период:** мм.гггг — мм.гггг
//       **Обязанности и достижения:**
//       * Опишите ключевые задачи (например, разработка и поддержку REST API на Node.js/NestJS)
//       * Укажите метрики/результаты (производительность, надёжность, снижение затрат и т. п.)
//       * Инструменты и практики: укажите (CI/CD, тестирование, код-ревью и т. д.)
//       `
//       const converter = new showdown.Converter();
//       const html = converter.makeHtml(markdown);
//       // Добавьте этот код для отладки
//       require('fs').writeFileSync('output.html', html);
// }

async convertMarkdownToPdf(markdownContent, outputPath,themeName) {

  // !!! ИСПОЛЬЗУЕМ НОВЫЙ ИНТЕРФЕЙС
  const { header, left, right } = parseCvMarkdown(markdownContent); 


  const h2Index = header.toLowerCase().indexOf('## контакты');
  
  let nameAndTitleMd = header;
  let contactsMd = '';
  
  if (h2Index !== -1) {
      nameAndTitleMd = header.substring(0, h2Index).trim(); // Все до ## Контакты
      contactsMd = header.substring(h2Index).trim();        // Все, начиная с ## Контакты
  }
  
  const themeCss = getThemeCss(themeName);

  const contactsHtml = this.addIconsAndFormatContacts(contactsMd);

  const md = markdownit();
  const nameAndTitleHtml = md.render(nameAndTitleMd);
  const leftHtml = md.render(left);
  const rightHtml = md.render(right);


  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resume</title>
      <style>${themeCss}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>

    <body>
      <div class="cv-container">
        
      <header class="cv-name-title-block"> 
          ${nameAndTitleHtml}
        </header>

        <div class="cv-contacts-block"> 
          ${contactsHtml}
        </div>

        <div class="cv-content-columns"> 
            <aside class="left-column">
              ${leftHtml}
            </aside>

            <main class="right-column">
              ${rightHtml}
            </main>
        </div>

      </div>
    </body>
    </html>
    `, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdf;
}

// В AppService
addIconsAndFormatContacts(markdown: string): string {
  // 1. Убираем заголовок, чтобы работать только с контактами
  const contactsBody = markdown.replace('## Контакты', '').trim();
  
  // 2. Разбиваем текст на отдельные строки (контакты)
  const contactLines = contactsBody.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Убираем пустые строки

  // 3. Оборачиваем каждую строку в <p> и добавляем <span> для иконок
  const finalContactsHtmlArray = contactLines.map(line => {
      let modifiedLine = line;

      // Вставляем <span> с классом перед названием поля
      if (line.startsWith('Email:')) {
          modifiedLine = `<p><span class="icon-email"></span> ${line}</p>`;
      } else if (line.startsWith('Телефон:')) {
          modifiedLine = `<p><span class="icon-phone"></span> ${line}</p>`;
      } else if (line.startsWith('GitHub:')) {
          modifiedLine = `<p><span class="icon-github"></span> ${line}</p>`;
      } else if (line.startsWith('LinkedIn:')) {
          modifiedLine = `<p><span class="icon-linkedin"></span> ${line}</p>`;
      } else if (line.startsWith('Локация:')) {
          modifiedLine = `<p><span class="icon-location"></span> ${line}</p>`;
      }

      // Удаляем два пробела в конце строки, если они есть
      return modifiedLine.replace(/  $/, ''); 
  });

  // 4. Собираем обратно: заголовок H2 (для структуры) + отдельные HTML-параграфы
  return `<h2>Контакты</h2>\n` + finalContactsHtmlArray.join('\n');
}

}
