import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Organization } from '../organizations/organization.entity';

@Entity('reports')
export class Report {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column()
  type!: string;

  @Column({ nullable: true })
  title!: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  data!: any;

  @Column({
    name: 'generated_by',
    nullable: true,
  })
  generatedBy!: string;

  @Column({
    name: 'file_url',
    nullable: true,
  })
  fileUrl!: string;

  @CreateDateColumn({
    name: 'generated_at',
  })
  generatedAt!: Date;
}