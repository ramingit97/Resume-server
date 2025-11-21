import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from '@src/modules/tokens/token.service';
import { TokenEntity } from '@src/modules/tokens/token.entity';
import { UserRepository } from './repo/user.repository';
import { UserAiService } from './user-ai.service';

@Module({
    imports:[
        TypeOrmModule.forFeature([UserEntity,TokenEntity]),
        JwtModule.registerAsync({
            imports:[ConfigModule],
            inject:[ConfigService],
            useFactory:(config:ConfigService)=>({
                secret:config.get<string>("JWT_SECRET")
            })
        })
    ],
    providers: [UserService,TokenService,UserRepository,UserAiService],
    controllers:[UserController]
})
export class UserModule {}
