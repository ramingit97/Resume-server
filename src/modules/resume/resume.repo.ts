// src/resume/resume.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeEntity } from './resume.entity';

@Injectable()
export class ResumeRepository {
    constructor(
        @InjectRepository(ResumeEntity)
        private resumeRepo: Repository<ResumeEntity>,
        // Здесь можно инжектировать другие репозитории для транзакций, 
        // или поручить это сервисному слою.
    ) {}

    async create(resumeData: Partial<ResumeEntity>): Promise<ResumeEntity> {
        const newResume = this.resumeRepo.create(resumeData);
        return this.resumeRepo.save(newResume);
    }
    
    async findById(id: number): Promise<ResumeEntity | null> {
        return this.resumeRepo.findOne({
            where: { id },
            relations: ['experience', 'education', 'skills'],
        });
    }


    async findAllByUserId(userId: number): Promise<ResumeEntity[]> {
        return this.resumeRepo.find({
            where: { user_id: userId },
            relations: ['experience', 'education', 'skills', 'languages'], // добавили languages
            order: {
                created_at: 'DESC',
                experience: { order: 'ASC' },
                education: { order: 'ASC' },
                skills: { order: 'ASC' },
                languages: { id: 'ASC' }, // сортировка языков по id
            },
        });
    }
    async findOneById(resumeId: number, userId: number): Promise<ResumeEntity | null> {
        return this.resumeRepo.findOne({
            where: { id: resumeId, user_id: userId },
            relations: ['experience', 'education', 'skills', 'languages'], // добавляем languages
            order: {
                experience: { order: 'ASC' },
                education: { order: 'ASC' },
                skills: { order: 'ASC' },
            }
        });
    }

}