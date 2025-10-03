import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('connection_logs')
export class ConnectionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.connectionLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room, room => room.connectionLogs)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'event_type', length: 50 })
  eventType: string;

  @Column({ name: 'connection_quality', type: 'jsonb', nullable: true })
  connectionQuality: any;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}