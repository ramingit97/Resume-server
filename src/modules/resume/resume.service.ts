// src/resume/resume.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AddResumeDto, CreateResumeRequestDto } from './dto/add-resume.dto';
import { ResumeEntity } from './resume.entity';
import { ExperienceEntity } from '../experience/experience.entity';
import { EducationEntity } from '../education/education.entity';
import { SkillEntity } from '../skill/skill.entity';
import { ResumeRepository } from './resume.repo';
import { LanguageEntity } from '../languages/language.entity';

@Injectable()
export class ResumeService {
    // Инжектируем DataSource для управления транзакциями
    constructor(
        @InjectDataSource()
        private dataSource: DataSource,

        private readonly resumeRepository:ResumeRepository,
    ) {}

    /**
     * Создает полную структуру резюме в единой транзакции.
     * @param userId ID пользователя.
     * @param data DTO со всеми разделами.
     */
    async createFullResume(userId: number, data: CreateResumeRequestDto): Promise<ResumeEntity> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        const {resume,design,template} = data;

        try {

            console.log('data',data)
            // 1. СОЗДАНИЕ ГЛАВНОЙ СУЩНОСТИ (Resume)
            const newResume = queryRunner.manager.create(ResumeEntity, {
                user_id: userId,
                title: resume.title,
                contact: resume.contact || null,
                hobbies: resume.hobbies || [],
                design: design || null,
            });
    
            const savedResume = await queryRunner.manager.save(newResume);
            const resumeId = savedResume.id;
    
            // 2. СОЗДАНИЕ ОПЫТА РАБОТЫ (Experience)
            if (resume.experience && resume.experience.length > 0) {
                console.log('SS',JSON.stringify(resume.experience))
                const experienceEntities = resume.experience.map((exp, index) =>
                    queryRunner.manager.create(ExperienceEntity, {
                        ...exp,
                        resume_id: resumeId,
                        order: exp.order !== undefined ? exp.order : index,
                    })
                );
                await queryRunner.manager.save(experienceEntities);
            }
    
            // 3. СОЗДАНИЕ ОБРАЗОВАНИЯ (Education)
            if (resume.education && resume.education.length > 0) {
                const educationEntities = resume.education.map((edu, index) =>
                    queryRunner.manager.create(EducationEntity, {
                        ...edu,
                        resume_id: resumeId,
                        order: edu.order !== undefined ? edu.order : index,
                    })
                );
                await queryRunner.manager.save(educationEntities);
            }
    
            // 4. СОЗДАНИЕ НАВЫКОВ (Skill)
            if (resume.skills && resume.skills.length > 0) {
                const skillEntities = resume.skills.map((skill, index) =>
                    queryRunner.manager.create(SkillEntity, {
                        ...skill,
                        resume_id: resumeId,
                        order: skill.order !== undefined ? skill.order : index,
                    })
                );
                await queryRunner.manager.save(skillEntities);
            }
    
            // 5. СОЗДАНИЕ ЯЗЫКОВ (Languages)
            if (resume.languages && resume.languages.length > 0) {
                const languageEntities = resume.languages.map((lang, index) =>
                    queryRunner.manager.create(LanguageEntity, {
                        ...lang,
                        resume_id: resumeId,
                        order: lang.order !== undefined ? lang.order : index,
                    })
                );
                await queryRunner.manager.save(languageEntities);
            }
    
            await queryRunner.commitTransaction();
            return savedResume;
    
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
    


    async getAllResumesByUserId(userId: number): Promise<ResumeEntity[]> {
        return this.resumeRepository.findAllByUserId(userId);
    }
    
    /**
     * Получает одно резюме по ID, убеждаясь, что оно принадлежит пользователю.
     */
    async getResumeById(resumeId: number, userId: number): Promise<ResumeEntity> {
        const resume = await this.resumeRepository.findOneById(resumeId, userId);
        
        if (!resume) {
            throw new NotFoundException(`Резюме с ID ${resumeId} не найдено.`);
        }
        return resume;
    }
    
    // Здесь могут быть другие методы, например:
    // async getResumeWithAllDetails(resumeId: number)
    // async deleteResume(resumeId: number)
}