import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    ManyToOne, 
    OneToMany, 
    JoinColumn 
} from 'typeorm';
import { UserEntity } from '../user/user.entity'; // Предполагаем, что у вас есть UserEntity
import { ExperienceEntity } from '../experience/experience.entity';
import { EducationEntity } from '../education/education.entity';
import { SkillEntity } from '../skill/skill.entity';
import { LanguageEntity } from '../languages/language.entity';

@Entity('resume')
export class ResumeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    title: string; // Название резюме (напр., "Резюме для IT")

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    // --- Связи ---

    @ManyToOne(() => UserEntity, user => user.resumes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @OneToMany(() => ExperienceEntity, experience => experience.resume)
    experience: ExperienceEntity[];

    @OneToMany(() => EducationEntity, education => education.resume)
    education: EducationEntity[];

    @OneToMany(() => SkillEntity, skill => skill.resume)
    skills: SkillEntity[];

    @OneToMany(() => LanguageEntity, skill => skill.resume)
    languages: LanguageEntity[];


    @Column({ type: 'text', nullable: true })
    summary: string;

    @Column({ type: 'json', nullable: true })
    contact: {
        phone: string;
        email: string;
        linkedin?: string;
        location?: string;
    };

    @Column({ type: 'simple-array', nullable: true })
    hobbies: string[];

    @Column({ type: 'json', nullable: true })
    design: {
        templateLayoutKey: string;
        themeName: string;
        styleOverrides: Record<string, string>;
        justification: string;
    };

}