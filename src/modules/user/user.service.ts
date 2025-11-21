import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UserCreateDto } from './dto/user-create.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@src/modules/tokens/token.service';
import { IToken } from '@src/modules/tokens/token.interface';
import { Gender, UserRole } from './user.interface';
import { UserRepository } from './repo/user.repository';
import { UpdateProfileDto } from './dto/user-update.dto';

@Injectable()
export class UserService {

    constructor(
            private readonly userRepo:UserRepository,
            private jwtService:JwtService,
            private config:ConfigService,
            private tokenService:TokenService,
    ){}


    async register({email,name,password}:UserCreateDto){
        // check if already user with email
        let candidate = await this.userRepo.findUser(email);
        if(candidate){
            throw new HttpException(
                "User with this email already exists",
                HttpStatus.FOUND
            )
        }
       
        const newUserEntity = await new UserEntity({
            email,
            name,
            // gender:Gender.Male,  
            role:UserRole.User
        }).setPassword(password);


        const newUser = await this.userRepo.createUser(newUserEntity);
        let tokens:IToken = await this.tokenService.generateTokens({email,id:newUser.id})
        await this.tokenService.saveTokens({
            user_id:newUser.id,
            refresh_token:tokens.refresh_token
        })
        return {
            user:newUser,
            access_token:tokens.access_token,
            refresh_token:tokens.refresh_token
        };
    }


    async login(email:string,password:string){
        const user = await this.validate(email,password);
        let tokens:IToken = await this.tokenService.generateTokens({email,id:user.id})
        await this.tokenService.saveTokens({
            user_id:user.id,
            refresh_token:tokens.refresh_token
        })
        return {
            ...tokens,
            user
        };
    }

    async validate(email:string,password:string){
        const user = await this.userRepo.findUser(email);
        if(!user){
            throw new NotFoundException({message:"User with email not found"})
        }

        const userEntity = await new UserEntity(user);
        await userEntity.setHashPassword(user.password);
        const isCorrectPassword = await userEntity.validatePassword(password);
        if(!isCorrectPassword){
            throw new NotFoundException({message:"Email or password not valid"})
        }
        return userEntity;
    }
    

    async refresh_token(refreshToken:string){
        const token = await this.tokenService.findToken(refreshToken);
        
        if(!token){
            throw new UnauthorizedException()
        }
        const user = await this.userRepo.findById(token.user_id);
        if(!user){
            throw new UnauthorizedException()
        }

        const tokens = await this.tokenService.refreshToken({email:user.email,id:user.id},refreshToken);
        await this.tokenService.saveTokens({
            user_id:user.id,
            ...tokens
        })
        return tokens;
    }


    async findAll(){
        return await this.userRepo.findAll();
    }

    async findUserByEmail(email:string){
        return await this.userRepo.findUser(email);
    }

    async findUserById(id:number){
        return await this.userRepo.findById(id);
    }

    async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserEntity> {
        const user = await this.userRepo.findOne(userId);
        if (!user) throw new NotFoundException('Пользователь не найден');
      
        return await this.userRepo.updateUserProfile(userId, {
          fullName: dto.fullName,
          phone: dto.phone,
          location: dto.location,
          about: dto.about,
        });
      }
}
