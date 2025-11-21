import { Body, Controller,  Get,  Headers, Post, Put, Req, Request, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserCreateDto } from './dto/user-create.dto';
import { UserService } from './user.service';
import { CookieOptions, Request as ExpressRequest, Response } from 'express';
import { IToken } from '@src/modules/tokens/token.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@src/modules/tokens/token.service';
import { UserAiService } from './user-ai.service';
import { AuthGuard } from '@src/guards/auth.guard';
import { UpdateProfileDto } from './dto/user-update.dto';

@Controller('user')
export class UserController {
    
    constructor(
        private userService:UserService,
        private userAiService:UserAiService,
        private jwtService:JwtService,
        private config:ConfigService,
        private tokenService:TokenService
        ){}

    @UsePipes(ValidationPipe)
    @Post("register")
    async register(@Body() userData:UserCreateDto){

        let result = await this.userService.register(userData);
        // await this.setRefreshCookie(result.refresh_token,res);
        return {
            userId:result.user.id,
            access_token:result.access_token,
            refresh_token:result.refresh_token
        }

        // res.status(HttpStatus.CREATED).json({
        //     userId:result.user.id,
        //     access_token:result.access_token
        // });
    }


    @Post("login")
    async login(@Body() userData:UserCreateDto){
        console.log('userData',userData)
        let tokens = await this.userService.login(userData.email,userData.password);
        // await this.setRefreshCookie(tokens.refresh_token,res);
        // res.status(HttpStatus.CREATED).json(tokens);
        return {
            ...tokens
        }
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async getMe(@Req() req: any){
        return await this.userService.findUserById(req.user.id)
    }

    async setRefreshCookie(token:string,res:Response){
        if(!token){
            throw new UnauthorizedException({message:"Token not found"});
        }
        let cookieOptions:CookieOptions = {
            maxAge:30 * 24 *60 *60 ,// 30 days
            // domain:'/',
            sameSite:'strict',
            secure:false
        }
        res.cookie("refresh_token",token,cookieOptions)
    }

    // @UseGuards(AuthGuard)
    @Get("all")
    async findAll(@Request() req:ExpressRequest,@Headers("user-agent") agent2:string){
        // console.log("agent",agent2)
        console.log('111111111111111111111');
        
        return await this.userService.findAll();
    }


    @Post("refresh_token")
    async refresh_token(@Body() userData:any){
        const tokens:IToken =  await this.userService.refresh_token(userData.refresh_token)
        // this.setRefreshCookie(tokens.refresh_token,res);
        // res.status(HttpStatus.CREATED).json(tokens);
        return {
            ...tokens
        }
    
    }

    // @Post("refreshToken")
    // async refresh_token(@Res() res:Response,@Request() req:ExpressRequest,@Cookie("refresh_token") token:string){
    //     console.log("token",token);
        
    //     const tokens:IToken =  await this.userService.refresh_token(token)
    //     this.setRefreshCookie(tokens.refresh_token,res);
    //     res.status(HttpStatus.CREATED).json(tokens);
    // }
   

    @Post('parse-profile')
    async parseChatToResume(
        @Body() chatInput: any,
    ): Promise<any> {
        const { rawText } = chatInput;
        return this.userAiService.parseChatToProfileDataOpenAI(rawText);
    }


    @UseGuards(AuthGuard)
    @Put('profile')
    async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
        console.log('dto',dto)
        const userId = req.user.id;
        const updatedUser = await this.userService.updateProfile(userId, dto);
        return updatedUser;
    }

}
