import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ResumeEntity } from '../resume/resume.entity';

@Entity('experience')
export class ExperienceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    company: string;

    @Column()
    title: string;

    @Column({ type: 'varchar',name:"start_date" })
    startDate: string; // Напр., "Январь 2020"

    @Column({ type: 'varchar', nullable: true,name:"end_date" })
    endDate: string | null; // Напр., "Наст. время" или "Июнь 2023"

    @Column({ type: 'simple-array', nullable: true })
    description: string[]; 

    @Column({ type: 'int', default: 0 })
    order: number;
    
    // --- Связи ---

    @Column()
    resume_id: number;

    @ManyToOne(() => ResumeEntity, resume => resume.experience, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'resume_id' })
    resume: ResumeEntity;
}