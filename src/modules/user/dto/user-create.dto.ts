import { IS_LENGTH, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UserCreateDto{
    @IsEmail()
    email:string;

    @IsString()
    @IsNotEmpty()
    name:string;
    
    @IsNotEmpty()
    @Matches(/[a-zA-Z0-9\d]{5,}/,{message:"Too weak password"})    
    password:string

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

