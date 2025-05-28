import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Source } from '../../source/entities/source.entity';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'gpt-3.5-turbo' })
  model: string;

  @Column({ type: 'float', default: 0.5 })
  temperature: number;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isFinalized: boolean;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.agents)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Source, source => source.agent)
  sources: Source[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}