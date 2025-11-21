import { MigrationInterface, QueryRunner } from "typeorm";

// Обратите внимание: имя файла миграции должно оставаться прежним
export class Users1694892272940 implements MigrationInterface {
    name = 'Users1694892272940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Создание таблицы 'users'
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "full_name" character varying,
                "email" character varying NOT NULL,
                "phone" character varying,
                "location" character varying,
                "about" text,
                "password" character varying,
                "role" character varying NOT NULL DEFAULT 'user',
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Если вы используете PostgreSQL ENUMs, вам, возможно,
        // придется создать тип ENUM явно, например:
        // await queryRunner.query(`CREATE TYPE "users_gender_enum" AS ENUM ('male', 'female', 'other')`);
        // await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')`);
        // И затем использовать их в таблице: "gender" "users_gender_enum" NOT NULL, ...

        // Для простоты и гибкости я пока оставил поля "gender" и "role" как `character varying` (строка) 
        // и добавил DEFAULT для "role", так как ваш предыдущий код не показывал ENUM-типы.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        
        // Если вы создавали ENUMs, их тоже нужно удалить:
        // await queryRunner.query(`DROP TYPE "users_role_enum"`);
        // await queryRunner.query(`DROP TYPE "users_gender_enum"`);
    }

}