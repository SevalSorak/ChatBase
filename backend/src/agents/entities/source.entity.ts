import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Agent } from './agent.entity';

@Entity('sources')
export class Source {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agentId: string;

  @ManyToOne(() => Agent, agent => agent.sources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column()
  name: string;

  @Column()
  type: string; // 'file', 'text', 'website', etc.

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  vectorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}