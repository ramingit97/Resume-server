import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray } from 'class-validator';

export class ExperienceDto {
    @IsNotEmpty()
    @IsString()
    company: string;

    @IsNotEmpty()
    @IsString()
    title:   string;

    @IsNotEmpty()
    @IsString()
    start_date: string;

    @IsOptional()
    @IsString()
    end_date: string | null;

    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    description: string[];

    @IsInt()
    @IsOptional()
    order: number;
}
