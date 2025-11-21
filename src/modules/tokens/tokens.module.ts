import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from './token.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([TokenEntity]),
    JwtModule
  ],
  providers: [
    TokenService
  ],
  exports:[TokenService]
})
export class TokensModule {}
