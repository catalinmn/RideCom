import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { RoomParticipant } from './room-participant.entity';
import { ConnectionLog } from './connection-log.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'room_code', unique: true, length: 10 })
  roomCode: string;

  @Column({ name: 'creator_id' })
  creatorId: string;

  @ManyToOne(() => User, user => user.createdRooms)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ name: 'max_participants', default: 8 })
  maxParticipants: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => RoomParticipant, participant => participant.room)
  participants: RoomParticipant[];

  @OneToMany(() => ConnectionLog, log => log.room)
  connectionLogs: ConnectionLog[];
}