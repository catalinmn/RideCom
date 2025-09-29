import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Room } from './entities/room.entity';
import { RoomParticipant } from './entities/room-participant.entity';
import { ConnectionLog } from './entities/connection-log.entity';
import { UserService } from './services/user.service';
import { RoomService } from './services/room.service';
import { RoomParticipantService } from './services/room-participant.service';
import { ConnectionLogService } from './services/connection-log.service';
import { MigrationService } from './services/migration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Room,
      RoomParticipant,
      ConnectionLog,
    ]),
  ],
  providers: [
    UserService,
    RoomService,
    RoomParticipantService,
    ConnectionLogService,
    MigrationService,
  ],
  exports: [
    UserService,
    RoomService,
    RoomParticipantService,
    ConnectionLogService,
    MigrationService,
  ],
})
export class DatabaseServicesModule {}