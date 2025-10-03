import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('room_participants')
@Unique(['roomId', 'userId'])
export class RoomParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room, room => room.participants)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.roomParticipations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}