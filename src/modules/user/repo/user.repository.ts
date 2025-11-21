import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../user.entity";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserRepository{
    constructor(
        @InjectRepository(UserEntity) private userRepo:Repository<UserEntity>
    ){}

    async createUser(user:UserEntity){
        return await this.userRepo.save(user) 
    }

    async findAll(){
        return await this.userRepo.find();
    }


    async findById(id:number){
        return await this.userRepo.findOne({where:{id}});
    }

    async findUser(email: string): Promise<UserEntity | null> {
        return await this.userRepo.findOne({ 
            where: { email },
            // !!! ДОБАВЛЯЕМ СВЯЗИ !!!
            relations: ['resumes'] // Загружаем все резюме пользователя
        });
    }

    async findByIdWithRelations(id: number): Promise<UserEntity | null> {
        return await this.userRepo.findOne({
            where: { id },
            relations: [
                'resumes', 
                // Если нужно загрузить контент резюме сразу
                'resumes.experience', 
                'resumes.education', 
                'resumes.skills',
            ]
        });
    }

    async deleteUser(email:string){
        return await this.userRepo.delete({email});
    }

    async findOne(id: number): Promise<UserEntity | null> {
        return await this.userRepo.findOne({ where: { id } });
    }
      
    async updateUserProfile(id: number, data: Partial<UserEntity>): Promise<UserEntity> {
        await this.userRepo.update({ id }, data);
        return await this.findOne(id); // вернуть обновлённого юзера
    }
}