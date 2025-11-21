import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ResumeEntity } from '../resume/resume.entity';

@Entity('language')
export class LanguageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  resume_id: number;

  @Column()
  name: string;

  @Column()
  level: string;

  @ManyToOne(() => ResumeEntity, resume => resume.languages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume: ResumeEntity;
}