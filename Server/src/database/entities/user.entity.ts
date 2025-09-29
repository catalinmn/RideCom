import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RoomParticipant } from './room-participant.entity';
import { Room } from './room.entity';
import { ConnectionLog } from './connection-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Room, room => room.creator)
  createdRooms: Room[];

  @OneToMany(() => RoomParticipant, participant => participant.user)
  roomParticipations: RoomParticipant[];

  @OneToMany(() => ConnectionLog, log => log.user)
  connectionLogs: ConnectionLog[];
}