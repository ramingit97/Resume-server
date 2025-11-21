import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class LanguageDto {
    @IsNotEmpty()
    @IsString()
    name: string; // Название языка, напр. "Английский"

    @IsNotEmpty()
    @IsString()
    level: string; // Уровень владения, напр. "C1", "B2"

    @IsOptional()
    @IsInt()
    order?: number; // Для сортировки, необязательное поле
}
