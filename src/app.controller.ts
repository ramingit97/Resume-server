import { Body, Controller, Get, Header, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { AppAiService } from './ai.service';
import * as puppeteer from 'puppeteer';
import * as PDFDocument from 'pdfkit';
import { FileInterceptor } from '@nestjs/platform-express';
class ChatInputDto {
  rawText: string;
}

const resume = {
  "fullName": "Виктор Смирнов",
  "title": "Lead Fullstack Engineer / Архитектор Решений",
  "summary": "Опытный Lead Fullstack Engineer с 5-летним стажем, специализирующийся на высоконагруженных распределенных системах. Глубокое знание React, Java/Spring и микросервисной архитектуры.",
  "contact": {
    "phone": "+7 (999) 777-12-34",
    "email": "smirnov.vitya@pro.com",
    "linkedin": "linkedin.com/in/viktor-smirnov-lead"
  },
  "skills": [
    { "category": "Programming Languages", "name": "TypeScript / JavaScript", "level": 5 },
    { "category": "Backend", "name": "Java (Spring Boot)", "level": 4 },
    { "category": "Frontend", "name": "React / Redux / Next.js", "level": 5 },
    { "category": "DevOps & Cloud", "name": "Docker / Kubernetes", "level": 4 },
    { "category": "Database", "name": "PostgreSQL / SQL", "level": 4 }
  ],
  "experience": [
    {
      "company": "СберТех",
      "title": "Senior Fullstack Engineer",
      "start_date": "Август 2022",
      "end_date": "Настоящее время",
      "description": [
        "Возглавил разработку критически важного микросервиса на Spring Boot, обрабатывающего более 100K транзакций в день.",
        "Проектировал и внедрил миграцию фронтенд-монолита на микрофронтенд-архитектуру (React), что улучшило скорость загрузки страниц на 40%.",
        "Оптимизировал запросы к базе данных, сократив время отклика ключевых API-методов на 25%.",
        "Наставлял двух младших разработчиков, проводя код-ревью."
      ]
    },
    {
      "company": "СтартАп «Инновации»",
      "position": "Junior/Middle Fullstack Developer",
      "start_date": "Август 2020",
      "end_date": "Июль 2022",
      "description": [
        "Разработал основные модули пользовательского интерфейса с использованием React и Redux.",
        "Обеспечивал покрытие кода unit-тестами (Jest), поддерживая высокий стандарт качества."
      ]
    }
  ],
  "education": [
    {
      "institution": "МГТУ им. Баумана",
      "degree": "Магистр",
      "field_of_study": "Программная инженерия",
      "end_date": "Июнь 2020"
    }
  ]
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly aiAppService:AppAiService

  ) {}

  @Get()
  async getHello() {

  }


  @Post('cv/generate')
  async generateCv(@Body() data: any,@Res() res: Response) {
    // 1) генерируем markdown (GPT)
    // const markdown = await this.appService.generateCvText(data);

    
//    
    const markdown = '# John Doe — Node.js Backend Developer\n' +
    '\n' +
    '## Контакты\n' +
    'Email: не указано  \n' +
    'Телефон: не указано  \n' +
    'GitHub: не указано  \n' +
    'LinkedIn: не указано  \n' +
    'Локация: не указано\n' +
    '\n' +
    '---\n' +
    '---\n' +
    '\n' +
    '## Образование/Курсы\n' +
    '- Базовое образование / профильные курсы по backend-разработке (Node.js, NestJS) — данные не указаны\n' +
    '\n' +
    '## Навыки\n' +
    '- Разработка серверной логики и API (REST, GraphQL)\n' +
    '- Проектирование микросервисов и архитектуры на Node.js/NestJS\n' +
    '- Оптимизация производительности и работа с БД (SQL/NoSQL)\n' +
    '- CI/CD, Docker, автоматизированное тестирование\n' +
    '- Agile/Scrum, code review, наставничество\n' +
    '\n' +
    '## Стек\n' +
    '- Node.js, NestJS, TypeScript\n' +
    '- PostgreSQL, MongoDB\n' +
    '- Docker, Kubernetes, GitLab CI/GitHub Actions\n' +
    '- Redis, RabbitMQ\n' +
    '\n' +
    '## Языки\n' +
    '- Английский — Upper-Intermediate\n' +
    '- Русский — Родной / Свободно\n' +
    '\n' +
    '## Хобби/Интересы\n' +
    '- Бег и спортивные активности (дисциплина, выносливость)\n' +
    '- Техническое чтение и участие в профессиональных митапах (постоянное обучение)\n' +
    '\n' +
    '---\n' +
    '\n' +
    '## Summary\n' +
    'Результативный Node.js/NestJS backend-разработчик с опытом проектирования масштабируемых API и оптимизации производительности. Фокусируюсь на сокращении времени отклика, автоматизации деплоя и повышении стабильности сервисов, подтверждённом измеримыми результатами.\n' +
    '\n' +
    '## Опыт работы\n' +
    '**Компания A** — Backend Developer (06.2021 — настоящее время)  \n' +
    '* Внедрил архитектуру на NestJS, увеличив пропускную способность сервиса в 2 раза и обеспечив поддержку 100k запросов/мин  \n' +
    '* Оптимизировал запросы к базе данных, сократив среднее время ответа API на 40%  \n' +
    '* Руководил командой из 4 разработчиков, снизив технический долг на 30%\n' +
    '\n' +
    '**Компания B** — Backend Developer (01.2019 — 05.2021)  \n' +
    '* Спроектировал микросервисную архитектуру на Node.js, уменьшив время выхода новых фич на 25%  \n' +
    '* Внедрил CI/CD с Docker и GitLab, сократив время релиза на 50%  \n' +
    '* Достиг SLA 99.9% uptime для ключевых сервисов за счёт автоматизированного мониторинга и алёртинга\n' +
    '\n' +
    '**Freelance / Контракт** — Node.js Backend Developer (01.2017 — 12.2018)  \n' +
    '* Разработал REST API для e‑commerce платформы, увеличив конверсию на 15% за счёт ускорения отклика и стабильности  \n' +
    '* Оптимизировал инфраструктуру на облаке, снизив операционные расходы на $2k/мес  \n' +
    '* Внедрил автоматизированное покрытие тестами и CI, достигнув покрытия модулей на уровне ~80%\n' +
    '\n' +
    '## Проекты\n' +
    '**Сервис авторизации** — (Ключевые Технологии: Node.js, NestJS, Docker)  \n' +
    '* Спроектировал модуль аутентификации и авторизации, сократив время проверки сессии на 50%  \n' +
    '* Внедрил поддержку JWT и MFA, повысив безопасность и снизив число фрод‑инцидентов на 35%  \n' +
    '* Оптимизировал механизмы кеширования с Redis, увеличив пропускную способность на 1.8x\n' +
    '\n' +
    '**Платёжный модуль** — (Ключевые Технологии: Node.js, NestJS, Docker)  \n' +
    '* Разработал и интегрировал платёжный API, обеспечив обработку $1M+ транзакций в месяц  \n' +
    '* Оптимизировал latency платежных операций на 30% через асинхронную обработку и очереди сообщений  \n' +
    '* Руководил интеграцией с платёжными провайдерами и обеспечил соответствие стандартам безопасности\n' +
    '\n' +
    '**Система аналитики и отчётности** — (Ключевые Технологии: Node.js, NestJS, Docker)  \n' +
    '* Внедрил ETL‑конвейер для обработки событий, увеличив скорость обработки данных в 3 раза  \n' +
    '* Оптимизировал формирование отчётов, сократив время генерации сводных отчётов на 60%  \n' +
    '* Достиг уменьшения затрат на хранение данных за счёт регламентной агрегации и архивации\n' +
    '\n'


    // await this.appService.test()
    // 2) конвертируем в PDF
    const pdfBuffer = await this.appService.convertMarkdownToPdf(markdown,'mycv.pdf','5');

    res.setHeader('Content-Type', 'application/pdf'); 
    res.setHeader('Content-Disposition', 'attachment; filename=mycv.pdf');
    // Необязательно, но полезно для бинарных данных:
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    return res.end(pdfBuffer);
  }

  @Post('parse-chat')
  async parseChatToResume(
    @Body() chatInput: ChatInputDto,
  ): Promise<any> {
    const { rawText } = chatInput;
    // Предполагая, что вы используете OpenAI/Gemini сервис, который получает ключ из ConfigService
    // Замените 'chatToResumeData' на нужный вам метод сервиса
    return this.aiAppService.parseChatToResumeDataOpenAI(rawText,"az");
  }



  @Post('optimizeResumeForJob')
  async optimizeResumeForJob(
    @Body() dto: { resume:any, jobDescription: string },
  ): Promise<any> {
    // Предполагая, что вы используете OpenAI/Gemini сервис, который получает ключ из ConfigService
    // Замените 'chatToResumeData' на нужный вам метод сервиса
    return this.aiAppService.analyzeAndOptimizeResume(dto.resume,dto.jobDescription,"az");
  }


  @Post('getAtsScoreAndFeedback')
  async getAtsScoreAndFeedback(
    @Body() dto: { jobDescription: string },
  ): Promise<any> {
    // Предполагая, что вы используете OpenAI/Gemini сервис, который получает ключ из ConfigService
    // Замените 'chatToResumeData' на нужный вам метод сервиса
    // return this.aiAppService.getAtsScoreAndFeedback(resume,dto.jobDescription);
  }


  @Post('recommendDesign')
  async recommendDesign(
    
  ): Promise<any> {
    // Предполагая, что вы используете OpenAI/Gemini сервис, который получает ключ из ConfigService
    // Замените 'chatToResumeData' на нужный вам метод сервиса
    // return this.aiAppService.recommendDesign(resume);
  }


  @Post('pdf')
  @UseInterceptors(FileInterceptor('file'))
  async createPdf(@UploadedFile() file: any, @Res() res: Response) {
    const doc = new PDFDocument({ autoFirstPage: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    doc.pipe(res);

    const img = await doc.openImage(file.buffer);
    doc.addPage({ size: [img.width, img.height] });
    doc.image(img, 0, 0);

    doc.end();
  }


  @Post('analyzeAgainstTopResumes')
  async analyzeAgainstTopResumes(
    @Body() dto: { resume:any, targetRole: string },
  ): Promise<any> {
    // Предполагая, что вы используете OpenAI/Gemini сервис, который получает ключ из ConfigService
    // Замените 'chatToResumeData' на нужный вам метод сервиса
    return this.aiAppService.analyzeAgainstTopResumes(dto.resume,dto.targetRole,"az");
  }


}
