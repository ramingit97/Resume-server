import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const Agent = createParamDecorator((key:string,ctx:ExecutionContext)=>{
    const request = ctx.switchToHttp().getRequest()
    return request.headers['user-agent'];
})