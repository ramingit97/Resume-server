import {Entity,Column,PrimaryGeneratedColumn, OneToMany} from 'typeorm'
import { Gender, IUser, UserRole } from './user.interface';
import { compare, compareSync, genSalt, hash } from 'bcryptjs';
import { ResumeEntity } from '../resume/resume.entity';



@Entity('users')
export class UserEntity implements IUser {

    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    name:string;

    @Column({name:"full_name"})
    fullName:string;

    @Column({unique:true})
    email:string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true, type: 'text' })
    about: string;

    @Column({})
    password:string;


    // @Column("enum",{enum:Gender})
    // gender:Gender;

    @Column("enum",{enum:UserRole})
    role: UserRole;

    @OneToMany(() => ResumeEntity, resume => resume.user)
    resumes: ResumeEntity[];

    constructor(user?: Partial<UserEntity>) {
        if (user) Object.assign(this, user);
    }


    public async setPassword(password:string) {
        const salt = await genSalt(10);
        this.password = await hash(password,salt);
        return this;
    }

    public async setHashPassword(password:string){
        this.password = password;
        return this;
    }

    public async validatePassword(password:string){
        console.log("compare error",password,this.password);
        return await compare(password,this.password);
    }
}
