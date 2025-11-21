import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from "openai";
import * as markdownit from 'markdown-it'

// Простая заглушка для типа ResumeData, теперь полностью соответствует Entity
interface ResumeData {
  fullName: string;
  title: string;
  contact: { phone: string; email: string; linkedin: string; };
  // АДАПТИРОВАНО ПОД SkillEntity
  skills: { category: string; name: string; level: number; }[];
  // АДАПТИРОВАНО ПОД ExperienceEntity
  experience: { company: string; title: string; start_date: string; end_date: string | null; description: string[]; }[]; 
  // АДАПТИРОВАНО ПОД EducationEntity
  education: { institution: string; degree: string; field_of_study: string; end_date: string; }[];
}


export interface StyleOverrides {
  resumeContainerClasses: string; // Tailwind классы для общего контейнера (например, 'shadow-xl p-8')
  headerClasses: string;          // Tailwind классы для блока имени/заголовка
  sectionTitleClasses: string;    // Tailwind классы для заголовков секций (Опыт, Навыки)
  primaryColorHex: string;        // Основной цвет (например, для границ секций)
  accentColorHex: string;         // Акцентный цвет (например, для иконок, буллитов)
  sidebarClasses?: string;        // Классы для боковой панели (только для макета B)
}

// Интерфейс для финальных настроек дизайна
export interface DesignSettings {
  templateLayoutKey: 'A' | 'B';   // Выбор макета: 'A' (Классика) или 'B' (Боковая панель)
  themeName: string;              // Название темы
  styleOverrides: StyleOverrides;
  justification: string;          // Объяснение выбора
}


@Injectable()
export class AppAiService {
  private readonly logger = new Logger(AppAiService.name);
  private openaiClient: OpenAI;

  constructor() {
    this.openaiClient = new OpenAI({});
  }

  // --- Вспомогательный метод для определения JSON-схемы (Entity-Aligned) ---
  private getResumeSchema() {
    return {
      type: 'object',
      properties: {
        fullName: { 
          type: 'string', 
          description: 'Full name and surname. If not specified, generate a realistic name.' 
        },
        title: { 
          type: 'string', 
          description: 'Desired or current job title / resume headline.' 
        },
        summary: { 
          type: 'string', 
          description: 'Brief professional summary. If missing, generate 2-3 sentences about professional experience.' 
        },
        contact: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Realistic phone number in international format.' },
            email: { type: 'string', description: 'Professional email address.' },
            linkedin: { type: 'string', description: 'LinkedIn profile link.' },
            location: { type: 'string', description: 'City/country of residence.' },
          },
          required: ['email'],
        },
        skills: {
          type: 'array',
          description: 'List of key skills, grouped by categories with proficiency level (1-5).',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Skill category (e.g., Programming Languages, Databases).' },
              name: { type: 'string', description: 'Skill name (e.g., Python, PostgreSQL).' },
              level: { type: 'number', description: 'Proficiency level (number from 1 to 5).' },
            },
            required: ['category', 'name', 'level'],
          },
        },
        experience: {
          type: 'array',
          description: 'List of work experiences. If experience is missing, generate 1-2 realistic positions.',
          items: {
            type: 'object',
            properties: {
              company: { type: 'string', description: 'Company name.' },
              title: { type: 'string', description: 'Job position / role.' },
              location: { type: 'string', description: 'City or office location.' },
              startDate: { type: 'string', description: 'Employment start date (e.g., 2020-09-01).' },
              endDate: { type: 'string', description: 'Employment end date or null for current position.' },
              description: {
                type: 'array',
                description: 'List of key achievements or responsibilities (3-5 points). Use action verbs and measurable results.',
                items: { type: 'string' },
              },
            },
            required: ['company', 'title', 'startDate', 'description'],
          },
        },
        education: {
          type: 'array',
          description: 'List of educational institutions and degrees. Specify startDate and endDate.',
          items: {
            type: 'object',
            properties: {
              institution: { type: 'string', description: 'Educational institution name.' },
              degree: { type: 'string', description: 'Degree or qualification (e.g., Bachelor, Master).' },
              fieldOfStudy: { type: 'string', description: 'Field of study / major.' },
              startDate: { type: 'string', description: 'Education start date.' },
              endDate: { type: 'string', description: 'Education end date.' },
            },
            required: ['institution', 'startDate', 'endDate'],
          },
        },
        hobbies: {
          type: 'array',
          description: 'List of user hobbies. If missing, AI can generate realistic interests.',
          items: { type: 'string' },
        },
        languages: {
          type: 'array',
          description: 'List of languages with proficiency level (e.g., A1, B2, C1).',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Language name (e.g., English).' },
              level: { type: 'string', description: 'Proficiency level (e.g., A1, B2, C1).' },
            },
            required: ['name'],
          },
        },
      },
      required: ['fullName', 'title', 'contact', 'skills', 'experience', 'summary'],
    };
  }
  
  


  // --- 1. МЕТОД ПАРСИНГА В JSON (для эндпоинта /parse-chat) ---
  /**
   * Преобразует необработанный текст пользователя в структурированный JSON-объект ResumeData.
   * @param rawText Необработанный текст от пользователя (из чата).
   * @param targetLanguage Целевой язык для текстовых полей (по умолчанию 'ru').
   * @returns Структурированные данные резюме.
   */
  async parseChatToResumeDataOpenAI(
    rawText: string,
    targetLanguage: string = 'ru' 
  ): Promise<ResumeData> {
    
    const schema = this.getResumeSchema();
    
    const systemPrompt = `You are a career growth expert and high-precision resume parser.
Your task is to extract all data from the user's text and present it in JSON format, strictly following the provided schema.

🚨 CRITICAL LANGUAGE REQUIREMENT:
ALL text fields in the JSON output (fullName, title, summary, description, skills names, company names, education details, hobbies, languages, etc.) MUST be written in: ${this.getLanguageNameEnglish(targetLanguage)}.

If any data is missing (e.g., summary, hobbies, languages), use your knowledge to generate realistic data IN THE TARGET LANGUAGE: ${this.getLanguageNameEnglish(targetLanguage)}.

Example for Azerbaijani (az):
{
  "fullName": "Əli Məmmədov",
  "title": "Proqram Təminatı Mühəndisi",
  "summary": "5 illik təcrübəyə malik bacarıqlı proqram mühəndisi...",
  "skills": [
    {
      "category": "Proqramlaşdırma Dilləri",
      "name": "Python",
      "level": 5
    }
  ],
  "experience": [
    {
      "company": "TechAz MMC",
      "title": "Senior Proqramçı",
      "description": [
        "Backend sistemlərini optimallaşdırdım və performansı 40% artırdım"
      ]
    }
  ]
}

Do not add any explanations, ONLY JSON.

JSON Structure:
${JSON.stringify(schema, null, 2)}
`;

    this.logger.log(`Parsing resume with target language: ${targetLanguage}`);
    
    try {
        const response = await this.openaiClient.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0.3, // Снижаем креативность для точного следования инструкциям
          messages: [
              { role: "system", content: systemPrompt },
              { 
                role: "user", 
                content: `Extract and complete resume data from the following text. Remember: ALL output must be in ${this.getLanguageNameEnglish(targetLanguage)}.\n\n---\n\n${rawText}` 
              }
          ],
          response_format: { type: "json_object" }, 
        });

        const jsonString = response.choices[0].message.content;

        if (!jsonString) {
             throw new HttpException('API returned empty response.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        let cleanedJsonString = jsonString.trim();
        if (cleanedJsonString.startsWith('```json')) {
            cleanedJsonString = cleanedJsonString.substring(7, cleanedJsonString.lastIndexOf('```')).trim();
        }

        const parsedData: ResumeData = JSON.parse(cleanedJsonString);
        return parsedData;

    } catch (error) {
        this.logger.error('Error during OpenAI JSON parsing:', error.stack);
        throw new HttpException('Unexpected error while calling OpenAI API.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- 2. МЕТОД ГЕНЕРАЦИИ MARKDOWN (для эндпоинта /generate-cv) ---
  
  async generateCvText(
    data: any,
    targetLanguage: string = 'ru'
  ): Promise<string> {

    const systemPrompt = `You are a professional recruiter and resume writer with 10 years of experience, specializing in results-oriented resumes.
Your task is to create a **high-quality and structured resume in Markdown format** based on the provided JSON data.

🚨 CRITICAL LANGUAGE REQUIREMENT:
The ENTIRE resume text MUST be written in: ${this.getLanguageNameEnglish(targetLanguage)}.

Example for Azerbaijani (az):
# Əli Məmmədov
## Proqram Təminatı Mühəndisi

📧 ali@example.com | 📞 +994 50 123 4567 | 🔗 linkedin.com/in/alimammadov

## Haqqımda
5 illik təcrübəyə malik bacarıqlı proqram mühəndisi...

## İş Təcrübəsi
### Senior Proqramçı | TechAz MMC
*2020-01 - Hal-hazırda*
- Backend sistemlərini optimallaşdırdım və performansı 40% artırdım
- Mikroservis arxitekturasını tətbiq etdim

**KEY RULES FOR INFERENCE AND ENHANCEMENT (MUST HAVE):**
1. **Proactive Enhancement:** If fields (especially achievements in "Experience" and "Skills") look sparse or missing, use the position and experience to **enhance** them with impressive, measurable, results-oriented achievements typical for this level.
2. **Action Verbs:** Start each achievement bullet with strong action verbs (e.g., "Developed," "Optimized," "Accelerated").
3. **Measurability:** Add numbers, percentages, or metrics where possible (e.g., "increased by 30%", "reduced costs by $10k").
4. **Format:** Use only standard Markdown.

**MARKDOWN STRUCTURE (MANDATORY):**
You must strictly follow this hierarchy for correct display in the target layout:

1. **Full Name (H1) and Title/Position (H2).**
2. **Contact Information:** Always goes next.
3. **Professional Summary / About Me (H2):** Professional, compelling paragraph.
4. **Work Experience (H2):**
   * Each experience is a separate block with dates, company, and list of achievements (in Markdown list format).
5. **Skills (H2):**
   * Skills list should be presented as a bulleted list, grouping them by categories as specified in the input data.
6. **Education (H2).**

Start generating the resume immediately with the name and position.
`;

    try {
        const resp = await this.openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0.4,
            messages: [
                { role: "system", content: systemPrompt }, 
                { 
                  role: "user", 
                  content: `Generate a Markdown resume in ${this.getLanguageNameEnglish(targetLanguage)} using the following data:\n\n${JSON.stringify(data)}` 
                } 
            ]
        });

        const outputText = resp.choices[0].message.content;
        
        if (!outputText) {
             throw new HttpException('API returned empty content for resume.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
  
        return outputText;

    } catch (error) {
        this.logger.error('Error during OpenAI CV text generation:', error.stack);
        throw new HttpException('Unexpected error during resume generation.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }




  // --- 3. МЕТОД ОПТИМИЗАЦИИ ПОД ВАКАНСИЮ (НОВЫЙ) ---
  
  /**
   * Принимает текущее резюме и текст вакансии, возвращает оптимизированное ResumeData.
   * @param currentResumeData Текущий JSON резюме пользователя.
   * @param jobDescription Текст вакансии.
   * @param targetLanguage Целевой язык для оптимизации.
   * @returns Оптимизированное ResumeData.
   */
  async optimizeResumeForJob(
    currentResumeData: ResumeData, 
    jobDescription: string,
    targetLanguage: string = 'ru'
  ): Promise<ResumeData> {
    
    const schema = this.getResumeSchema();
    
    const systemPrompt = `You are a highly qualified career strategist specializing in ATS optimization. 
Your goal is to rewrite and strengthen the provided JSON resume to maximize alignment with the specified job posting.

🚨 CRITICAL LANGUAGE REQUIREMENT:
ALL text fields in the JSON output MUST be written in: ${this.getLanguageNameEnglish(targetLanguage)}.

Example for Azerbaijani (az):
{
  "summary": "5 illik təcrübəyə malik Python backend developer. Mikroservis arxitekturası və REST API-lərin inkişafında ekspert...",
  "experience": [
    {
      "description": [
        "RESTful API-lər hazırladım və performansı 35% artırdım",
        "PostgreSQL verilənlər bazası strukturunu optimallaşdırdım"
      ]
    }
  ]
}

**OPTIMIZATION RULES:**
1. **Preserve Facts:** Do not change workplaces, dates, or names. Change ONLY wording to match the job posting.
2. **Keywords (ATS):** Incorporate key terms, skills, and requirements from the job posting into the "summary" (add it if missing), experience "description", and "skills" sections.
3. **Strengthen Achievements:** Ensure achievements in work experience use action verbs and metrics that directly address job requirements.
4. **'summary' Section:** Rewrite it to immediately hook the recruiter, addressing core job requirements.
5. **Format:** Return in STRICT JSON format matching the schema.

**JSON SCHEMA (STRICT):**
${JSON.stringify(schema, null, 2)}
    `;

    const userPrompt = `
--- CURRENT USER RESUME ---
${JSON.stringify(currentResumeData, null, 2)}

--- JOB REQUIREMENTS ---
${jobDescription}

Please rewrite the 'summary' section, 'description' points in the 'experience' section, and adjust 'skills' for maximum optimization for this job posting. Output in ${this.getLanguageNameEnglish(targetLanguage)}.
    `;
    
    try {
        this.logger.log('Sending optimization request to OpenAI...');
        
        const response = await this.openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0.3,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }, 
        });

        const jsonString = response.choices[0].message.content;

        if (!jsonString) {
             throw new HttpException('API returned empty response during optimization.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        let cleanedJsonString = jsonString.trim();
        if (cleanedJsonString.startsWith('```json')) {
            cleanedJsonString = cleanedJsonString.substring(7, cleanedJsonString.lastIndexOf('```')).trim();
        }

        const optimizedData: ResumeData = JSON.parse(cleanedJsonString);
        return optimizedData;

    } catch (error) {
        this.logger.error('Error during OpenAI Job Optimization:', error.stack);
        throw new HttpException('Unexpected error during job optimization.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  // --- 4. МЕТОД ОЦЕНКИ ATS (НОВЫЙ) ---
  
  /**
   * Оценивает резюме на соответствие вакансии и дает советы по улучшению.
   * @param currentResumeData Текущий JSON резюме пользователя.
   * @param jobDescription Текст вакансии.
   * @param targetLanguage Язык для вывода фидбека.
   * @returns Текст с оценкой и советами в Markdown.
   */
  async getAtsScoreAndFeedback(
    currentResumeData: ResumeData, 
    jobDescription: string,
    targetLanguage: string = 'ru'
  ): Promise<string> {

    const systemPrompt = `You are an ATS (Applicant Tracking System) simulator and career consultant. 
Your task is to evaluate the provided resume against the job posting, assign an estimated ATS score (0-100), and provide three specific, concise improvement tips.

🚨 CRITICAL LANGUAGE REQUIREMENT:
The ENTIRE response MUST be written in: ${this.getLanguageNameEnglish(targetLanguage)}.

Example for Azerbaijani (az):
## ATS Qiymətləndirməsi

### 📊 ATS Balı: **73/100**

### 💡 Təkmilləşdirmə Üçün Tövsiyələr:
1. **Açar sözləri artırın**: Vakansiyada qeyd olunan "Docker", "Kubernetes" və "CI/CD" terminlərini təcrübə hissəsinə əlavə edin.
2. **Nəticələri ölçülə bilən edin**: Hər bir nailiyyət üçün rəqəmlər və ya faizlər əlavə edin.
3. **Xülasə hissəsini gücləndir**: İlk paraqrafda vakansiya tələblərinə birbaşa istinad edin.

**OUTPUT FORMAT (Markdown, strict):**
Output only text. Start with H2 header (##).
1. **ATS SCORE (H3):** Must be bold and obvious.
2. **IMPROVEMENT TIPS:** Numbered list.
`;

    const userPrompt = `
Analyze how well the following resume data matches the job requirements:

--- JOB POSTING ---
${jobDescription}

--- RESUME ---
${JSON.stringify(currentResumeData, null, 2)}

Provide analysis in ${this.getLanguageNameEnglish(targetLanguage)}.
    `;

    try {
        const response = await this.openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0.5,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        const feedbackText = response.choices[0].message.content;
        if (!feedbackText) {
             throw new HttpException('API returned empty response for evaluation.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return feedbackText;

    } catch (error) {
        this.logger.error('Error during ATS Score generation:', error.stack);
        throw new HttpException('Unexpected error during ATS score generation.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  /**
   * Возвращает JSON-схему для структурированного вывода настроек дизайна.
   */
  private getDesignSchema() {
    const styleOverridesSchema: { [key in keyof StyleOverrides]: any } = {
        resumeContainerClasses: { type: "string", description: 'Tailwind classes for the main resume container (e.g., "shadow-xl p-8 font-serif").' },
        headerClasses: { type: "string", description: 'Tailwind classes for the header block (Name, Title).' },
        sectionTitleClasses: { type: "string", description: 'Tailwind classes for section headers (e.g., "text-lg font-bold uppercase").' },
        primaryColorHex: { type: "string", description: 'HEX code for the primary brand color (for borders, major titles), e.g., #153A6A.' },
        accentColorHex: { type: "string", description: 'HEX code for the accent color (for icons, highlights). Must contrast with primaryColorHex, e.g., #4CAF50.' },
        sidebarClasses: { type: "string", description: 'Tailwind classes for the sidebar background and text color (only for templateLayoutKey: "B").' }
    };

    return {
        type: "object",
        properties: {
            templateLayoutKey: { 
                type: "string", 
                enum: ['A', 'B'], 
                description: 'Layout choice: "A" (Classic/Single-column) or "B" (Modern/Two-column with sidebar).' 
            },
            themeName: { 
                type: "string", 
                description: 'Short, descriptive theme name (e.g., "Professional Navy" or "Minimalist Dark").' 
            },
            styleOverrides: {
                type: "object",
                properties: styleOverridesSchema,
                required: ["resumeContainerClasses", "headerClasses", "sectionTitleClasses", "primaryColorHex", "accentColorHex"]
            },
            justification: { 
                type: "string", 
                description: 'Brief justification why this design suits the user\'s role.' 
            }
        },
        required: ['templateLayoutKey', 'themeName', 'styleOverrides', 'justification']
    };
  }

  /**
   * Анализирует резюме и генерирует оптимальные настройки дизайна (макет + стили).
   * @param currentResumeData Текущее JSON резюме пользователя.
   * @returns DesignSettings с выбранным макетом и классами Tailwind.
   */
  async recommendDesign(
    currentResumeData: ResumeData
  ): Promise<DesignSettings> {
    
    const schema = this.getDesignSchema();
    
    const systemPrompt = `You are a leading resume designer specializing in UI/UX and Tailwind CSS. 
Your task is to analyze the user's position and recommend the ideal visual style.

**LAYOUT SELECTION RULES:**
1. **Senior/Executive/Corporate Roles (Manager, Finance, Legal):** Recommend **'A' (Classic/Formal)**. Colors should be conservative and professional (dark blue, gray, black).
2. **Tech/Creative/Startup Roles (Developer, Designer, Analyst, Architect):** Recommend **'B' (Modern/With Sidebar)**. Colors should be modern and contrasting (indigo, teal, orange).

**MANDATORY CONTRAST (Critical Bug Fix):**
* **Primary Text Color (styleOverrides.textColorHex):** Requires a **DARK HEX CODE** (e.g., **#333333, #222222, or #111111**). This prevents the bug with white text on white background in the main resume section.
* **styleOverrides.textColorHex CANNOT be #FFFFFF or any other light color.**
* **sidebarClasses:** If you generate a dark background (e.g., 'bg-gray-900'), **you MUST** use light text ('text-white').

**Example (if Classic 'A'):** "textColorHex": "#333333"
**Example (if Tech 'B'):** "textColorHex": "#222222"

**OUTPUT FORMAT:** Return STRICTLY a JSON object matching this schema:
${JSON.stringify(schema, null, 2)}
    `;

    const userPrompt = `
User's position: ${currentResumeData.title}.
Key skills: ${currentResumeData.skills.map(s => s.name).join(', ')}.

Generate a design that will make this resume maximally professional and ensure excellent readability.
    `;
    
    try {
        this.logger.log('Sending design generation request to OpenAI...');
        
        const response = await this.openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }, 
        });

        const jsonString = response.choices[0].message.content;

        if (!jsonString) {
             throw new HttpException('API returned empty response during design generation.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        let cleanedJsonString = jsonString.trim();
        if (cleanedJsonString.startsWith('```json')) {
            cleanedJsonString = cleanedJsonString.substring(7, cleanedJsonString.lastIndexOf('```')).trim();
        }

        const designSettings: DesignSettings = JSON.parse(cleanedJsonString);
        
        if (!['A', 'B'].includes(designSettings.templateLayoutKey)) {
             throw new Error('AI returned invalid layout key.');
        }

        return designSettings;

    } catch (error) {
        this.logger.error('Error during OpenAI Design Generation:', error.stack);
        throw new HttpException('Unexpected error during AI design generation.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async analyzeAndOptimizeResume(
    resume: ResumeData, 
    jobDescription: string,
    targetLanguage: string = 'ru'
  ) {
    const atsFeedbackPromise = this.getAtsScoreAndFeedback(resume, jobDescription, targetLanguage);
    const optimizedResumePromise = this.optimizeResumeForJob(resume, jobDescription, targetLanguage);
  
    const [atsFeedback, optimizedResume] = await Promise.all([atsFeedbackPromise, optimizedResumePromise]);
  
    return { atsFeedback, optimizedResume };
  }


  async analyzeAgainstTopResumes(
    resume: ResumeData, 
    targetRole: string,
    targetLanguage: string = 'ru'
  ) {
    const schema = this.getResumeSchema();
  
    const systemPrompt = `You are a professional career analyst and resume expert.
Your task is to compare the provided resume with the most successful examples for the "${targetRole}" position.

🚨 CRITICAL LANGUAGE REQUIREMENT:
ALL text fields in the JSON output MUST be written in: ${this.getLanguageNameEnglish(targetLanguage)}.

Example for Azerbaijani (az):
{
  "benchmarkSummary": "Sizin rezumeniz ümumi olaraq yaxşıdır, lakin top namizədlərlə müqayisədə bəzi zəif tərəflər var:\n\n**Güclü tərəflər:** 5 illik təcrübə və Python bacarığınız çox yaxşıdır.\n\n**Zəif tərəflər:** Mikroservis təcrübəsi və cloud platformalar (AWS, Azure) haqqında məlumat çatışmır.\n\n**Tövsiyələr:** Docker/Kubernetes təcrübənizi əlavə edin və nailiyyətlərinizə ölçülə bilən nəticələr daxil edin.",
  "idealResume": {
    "fullName": "İdeal Namizəd",
    "title": "Senior Backend Developer",
    "summary": "7+ illik təcrübəyə malik yüksək ixtisaslı backend developer. Python, Django, və mikroservis arxitekturasında ekspert...",
    "skills": [
      {
        "category": "Backend Texnologiyaları",
        "name": "Python (Django, FastAPI)",
        "level": 5
      },
      {
        "category": "DevOps",
        "name": "Docker, Kubernetes",
        "level": 4
      }
    ]
  }
}

Analyze the candidate's strengths and weaknesses, providing:
1. Overall fit assessment (as a percentage, like ATS score).
2. Specific improvement recommendations.
3. Which skills or sections need to be added to approach top candidates.
4. Example of an ideal resume for this position (in JSON format per the schema below).

⚠️ You MUST return JSON with the following structure:
{
  "benchmarkSummary": "Text analysis and recommendations",
  "idealResume": { ... per schema below ... }
}

Ideal resume structure schema:
${JSON.stringify(schema, null, 2)}

Do not add any Markdown or explanations, only a JSON object.
`;
  
    try {
      const response = await this.openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Here is the candidate's current resume. Analyze in ${this.getLanguageNameEnglish(targetLanguage)}:\n\n${JSON.stringify(resume, null, 2)}` 
          },
        ],
        response_format: { type: "json_object" },
      });
  
      const jsonString = response.choices[0].message.content;
      if (!jsonString) {
        throw new HttpException("API returned empty response.", HttpStatus.INTERNAL_SERVER_ERROR);
      }
  
      let cleaned = jsonString.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.substring(7, cleaned.lastIndexOf("```")).trim();
      }
  
      const result = JSON.parse(cleaned);
  
      return {
        benchmarkSummary: result.benchmarkSummary,
        idealResume: result.idealResume as ResumeData,
      };
    } catch (error) {
      this.logger.error("Error during OpenAI benchmark analysis:", error.stack);
      throw new HttpException("Error comparing with successful resumes.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- HELPER METHODS ---

  /**
   * Возвращает полное название языка на английском (с нативным названием в скобках)
   * @param langCode Код языка (например, 'az', 'ru', 'en')
   * @returns Полное название языка
   */
  private getLanguageNameEnglish(langCode: string): string {
    const languages: Record<string, string> = {
      'ru': 'Russian (русский)',
      'az': 'Azerbaijani (Azərbaycan dili)',
      'en': 'English',
      'tr': 'Turkish (Türkçe)',
      'de': 'German (Deutsch)',
      'fr': 'French (Français)',
      'es': 'Spanish (Español)',
      'it': 'Italian (Italiano)',
      'pt': 'Portuguese (Português)',
      'ar': 'Arabic (العربية)',
      'zh': 'Chinese (中文)',
      'ja': 'Japanese (日本語)',
      'ko': 'Korean (한국어)',
    };
    return languages[langCode] || languages['en'];
  }
  
  /**
   * Возвращает название языка в родительном падеже для русских промптов
   * @param langCode Код языка
   * @returns Название языка в родительном падеже
   */
  private getLanguageName(langCode: string): string {
    const languages: Record<string, string> = {
      'ru': 'русском',
      'az': 'азербайджанском',
      'en': 'английском',
      'tr': 'турецком',
      'de': 'немецком',
      'fr': 'французском',
      'es': 'испанском',
      'it': 'итальянском',
      'pt': 'португальском',
      'ar': 'арабском',
      'zh': 'китайском',
      'ja': 'японском',
      'ko': 'корейском',
    };
    return languages[langCode] || languages['ru'];
  }
  
}