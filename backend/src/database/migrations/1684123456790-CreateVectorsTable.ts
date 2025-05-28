import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVectorsTable1684123456790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE vectors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        embedding vector(1536),
        content TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX vectors_embedding_idx ON vectors 
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS vectors_embedding_idx`);
    await queryRunner.query(`DROP TABLE IF EXISTS vectors`);
  }
}