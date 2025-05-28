import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';

export enum SourceType {
  FILE = 'file',
  TEXT = 'text',
  LINK = 'link',
  QA = 'qa',
  NOTION = 'notion',
}

@Entity()
export class Source {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SourceType,
    default: SourceType.FILE,
  })
  type: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'int', default: 0 })
  size: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  processingResult: any;

  @Column()
  agentId: string;

  @ManyToOne(() => Agent, agent => agent.sources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column()
  userId: string;

  @Column({ nullable: true })
  url: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}