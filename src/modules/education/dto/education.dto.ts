// src/resume/dto/education.dto.ts
import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class EducationDto {
    @IsNotEmpty()
    @IsString()
    institution: string; // Название учебного заведения

    @IsNotEmpty()
    @IsString()
    degree: string; // Полученная степень/квалификация

    @IsNotEmpty()
    @IsString()
    field_of_study: string; // Специальность

    @IsString()
    @IsOptional()
    end_date: string; // Дата окончания (или ожидаемая)

    @IsInt()
    @IsOptional()
    order: number; // Порядок отображения
}