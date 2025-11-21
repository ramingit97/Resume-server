import { IsOptional, IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsEmail()
  email:string;

  @IsString()
  @IsNotEmpty()
  fullName: string; 

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  about?: string;
}