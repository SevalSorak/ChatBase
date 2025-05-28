import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Agent } from './agent.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agentId: string;

  @ManyToOne(() => Agent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}