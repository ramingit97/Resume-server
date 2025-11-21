import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeEntity } from './resume.entity';
import { ResumeService } from './resume.service';
import { ResumeRepository } from './resume.repo';
import { ResumeController } from './resume.controller';
import { JwtModule } from '@nestjs/jwt';
import { TokensModule } from '../tokens/tokens.module';

@Module({
    imports:[
        TypeOrmModule.forFeature([ResumeEntity]),
        JwtModule,
        TokensModule
    ],
    providers: [ResumeService,ResumeRepository],
    controllers:[ResumeController]
})
export class ResumeModule {}
