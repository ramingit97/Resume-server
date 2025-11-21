// src/resume/dto/add-resume.dto.ts
import { 
    IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsInt, IsObject 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExperienceDto } from '@src/modules/experience/dto/experience.dto';
import { EducationDto } from '@src/modules/education/dto/education.dto';
import { SkillDto } from '@src/modules/skill/dto/skill.dto';
import { LanguageDto } from '@src/modules/languages/dto/language.dto';

export class AddResumeDto {
    @IsNotEmpty()
    @IsString()
    title: string; // Название резюме (напр., "Резюме для HR")

    // --- Контактная информация ---
    @IsOptional()
    @IsObject()
    contact?: {
        phone: string;
        email: string;
        linkedin?: string;
        location?: string;
    };

    // --- Хобби ---
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hobbies?: string[];

    // --- Дизайн ---
    @IsOptional()
    @IsObject()
    design?: {
        templateLayoutKey: string;
        themeName: string;
        styleOverrides: Record<string, string>;
        justification: string;
    };

    // --- Контентные разделы ---
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExperienceDto)
    experience?: ExperienceDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EducationDto)
    education?: EducationDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SkillDto)
    skills?: SkillDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LanguageDto)
    languages?: LanguageDto[];
}


export class CreateResumeRequestDto {
    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    @Type(() => AddResumeDto)
    resume: AddResumeDto;

    @IsOptional()
    @IsObject()
    design?: {
        templateLayoutKey: string;
        themeName: string;
        styleOverrides: Record<string, string>;
        justification: string;
    };

    @IsOptional()
    @IsNotEmpty()
    template?: string;
}