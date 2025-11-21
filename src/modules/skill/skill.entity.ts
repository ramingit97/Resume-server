import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ResumeEntity } from '../resume/resume.entity';

@Entity('skill')
export class SkillEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    category: string; // Напр., "Языки программирования", "Базы данных"

    @Column()
    name: string; // Напр., "TypeScript"

    @Column({ type: 'int' })
    level: number; // Уровень владения (напр., 1-5)

    @Column({ type: 'int', default: 0 })
    order: number;
    
    // --- Связи ---

    @Column()
    resume_id: number;

    @ManyToOne(() => ResumeEntity, resume => resume.skills, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'resume_id' })
    resume: ResumeEntity;
}