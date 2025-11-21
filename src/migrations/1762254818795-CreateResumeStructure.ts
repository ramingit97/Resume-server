import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResumeStructure1762254818795 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- 1. ТАБЛИЦА: resume ---
        await queryRunner.query(`
            CREATE TABLE "resume" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "title" character varying NOT NULL,
                "contact" json,
                "hobbies" text,
                "summary" text,
                "design" json,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_resume_id" PRIMARY KEY ("id")
            )
        `);

        // --- 2. ТАБЛИЦА: experience ---
        await queryRunner.query(`
            CREATE TABLE "experience" (
                "id" SERIAL NOT NULL,
                "resume_id" integer NOT NULL,
                "company" character varying NOT NULL,
                "title" character varying NOT NULL,
                "start_date" character varying NOT NULL,
                "end_date" character varying,
                "description" text NOT NULL,
                "order" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_experience_id" PRIMARY KEY ("id")
            )
        `);

        // --- 3. ТАБЛИЦА: education ---
        await queryRunner.query(`
            CREATE TABLE "education" (
                "id" SERIAL NOT NULL,
                "resume_id" integer NOT NULL,
                "institution" character varying NOT NULL,
                "degree" character varying NOT NULL,
                "field_of_study" character varying,
                "end_date" character varying,
                "order" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_education_id" PRIMARY KEY ("id")
            )
        `);

        // --- 4. ТАБЛИЦА: skill ---
        await queryRunner.query(`
            CREATE TABLE "skill" (
                "id" SERIAL NOT NULL,
                "resume_id" integer NOT NULL,
                "category" character varying NOT NULL,
                "name" character varying NOT NULL,
                "level" integer NOT NULL,
                "order" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_skill_id" PRIMARY KEY ("id")
            )
        `);

        // --- 5. ТАБЛИЦА: language ---
        await queryRunner.query(`
            CREATE TABLE "language" (
                "id" SERIAL NOT NULL,
                "resume_id" integer NOT NULL,
                "name" character varying NOT NULL,
                "level" character varying NOT NULL,
                "order" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_language_id" PRIMARY KEY ("id")
            )
        `);

        // --- 6. ВНЕШНИЕ КЛЮЧИ (FOREIGN KEYS) ---

        // Связь Resume с User
        await queryRunner.query(`
            ALTER TABLE "resume" 
            ADD CONSTRAINT "FK_resume_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);

        // Связи контентных таблиц с Resume
        await queryRunner.query(`
            ALTER TABLE "experience" 
            ADD CONSTRAINT "FK_experience_resume" 
            FOREIGN KEY ("resume_id") REFERENCES "resume"("id") 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "education" 
            ADD CONSTRAINT "FK_education_resume" 
            FOREIGN KEY ("resume_id") REFERENCES "resume"("id") 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "skill" 
            ADD CONSTRAINT "FK_skill_resume" 
            FOREIGN KEY ("resume_id") REFERENCES "resume"("id") 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "language" 
            ADD CONSTRAINT "FK_language_resume" 
            FOREIGN KEY ("resume_id") REFERENCES "resume"("id") 
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      // Удаление внешних ключей
      await queryRunner.query(`ALTER TABLE "language" DROP CONSTRAINT "FK_language_resume"`);
      await queryRunner.query(`ALTER TABLE "skill" DROP CONSTRAINT "FK_skill_resume"`);
      await queryRunner.query(`ALTER TABLE "education" DROP CONSTRAINT "FK_education_resume"`);
      await queryRunner.query(`ALTER TABLE "experience" DROP CONSTRAINT "FK_experience_resume"`);
      await queryRunner.query(`ALTER TABLE "resume" DROP CONSTRAINT "FK_resume_user"`);

      // Удаление таблиц
      await queryRunner.query(`DROP TABLE "language"`);
      await queryRunner.query(`DROP TABLE "skill"`);
      await queryRunner.query(`DROP TABLE "education"`);
      await queryRunner.query(`DROP TABLE "experience"`);
      await queryRunner.query(`DROP TABLE "resume"`);
    }

}
