import { Body, Controller,  Get,  Headers, Param, Post, Req, Request, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { AuthGuard } from '@src/guards/auth.guard';
import { AddResumeDto, CreateResumeRequestDto } from './dto/add-resume.dto';

@UseGuards(AuthGuard) 
@Controller('resume') 
export class ResumeController {
    constructor(private readonly resumeService: ResumeService) {}

    
    @Post('add')
    async addResume(@Body() resumeData: CreateResumeRequestDto, @Req() req) {
        // ID пользователя берется из токена (req.user.id, если так настроен Guard)
        const userId = req.user.id; 

        // Логика сохранения в ResumeService
        const newResume = await this.resumeService.createFullResume(userId, resumeData);

        return {
            message: 'Резюме успешно создано',
            resumeId: newResume.id
        };
    }



    @Get()
    async getMyResumes(@Req() req) {
        // ID пользователя берется из токена (req.user.id)
        const userId = req.user.id; 
        
        const resumes = await this.resumeService.getAllResumesByUserId(userId);

        // Возвращаем массив резюме, каждое из которых содержит experience, education, skills
        return resumes;
    }
    
    @Get(':id')
    async getSingleResume(@Req() req, @Param('id') resumeId: string) {
        const userId = req.user.id;
        
        // Преобразуем строковый параметр в число
        const id = parseInt(resumeId, 10);
        
        const resume = await this.resumeService.getResumeById(id, userId);
        
        return resume;
    }
}