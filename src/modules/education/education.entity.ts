import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ResumeEntity } from '../resume/resume.entity';

@Entity('education')
export class EducationEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    institution: string; // Название ВУЗа/Курсов

    @Column()
    degree: string; // Степень (Бакалавр, Магистр)

    @Column()
    field_of_study: string; // Специальность

    @Column({ type: 'varchar',nullable:true })
    end_date: string; // Дата окончания

    @Column({ type: 'int', default: 0 })
    order: number;

    // --- Связи ---

    @Column()
    resume_id: number;

    @ManyToOne(() => ResumeEntity, resume => resume.education, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'resume_id' })
    resume: ResumeEntity;
}