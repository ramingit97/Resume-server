import { MigrationInterface, QueryRunner } from "typeorm";

export class Tokens1694957583670 implements MigrationInterface {
    name = 'Tokens1694957583670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tokens" ("id" SERIAL NOT NULL, "refresh_token" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_66b773780ac1e48b1494885208b" UNIQUE ("refresh_token"), CONSTRAINT "UQ_8769073e38c365f315426554ca5" UNIQUE ("user_id"), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tokens"`);
    }

}
