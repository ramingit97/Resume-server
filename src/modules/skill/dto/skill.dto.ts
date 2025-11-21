// src/resume/dto/skill.dto.ts
import { IsString, IsNotEmpty, IsInt, IsOptional, Max, Min } from 'class-validator';

export class SkillDto {
    @IsNotEmpty()
    @IsString()
    category: string; // Категория (напр., "Backend", "Databases")

    @IsNotEmpty()
    @IsString()
    name: string; // Название навыка (напр., "NestJS")

    @IsInt()
    @IsNotEmpty()
    @Min(1) // Минимальный уровень
    @Max(5) // Максимальный уровень (если используется шкала 1-5)
    level: number; // Уровень владения

    @IsInt()
    @IsOptional()
    order: number; // Порядок отображения
}