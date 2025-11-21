import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '@src/modules/user/user.module';
import { dataSource } from './ormconfig';
import { TokensModule } from '@src/modules/tokens/tokens.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResumeModule } from './modules/resume/resume.module';
import { AppAiService } from './ai.service';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath:'./.env'
    }),
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory:()=>dataSource.options
    }),
    CacheModule.register({
      isGlobal:true
    }),
    UserModule,
    TokensModule,
    ResumeModule,
  ],
  controllers: [AppController],
  providers: [AppService,AppAiService],
})
export class AppModule {}
