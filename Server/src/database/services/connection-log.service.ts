import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { ConnectionLog } from '../entities/connection-log.entity';

export interface CreateConnectionLogDto {
  userId: string;
  roomId: string;
  eventType: string;
  connectionQuality?: any;
}

export interface ConnectionQualityMetrics {
  bandwidth?: number;
  latency?: number;
  packetLoss?: number;
  jitter?: number;
  audioLevel?: number;
  networkType?: string;
}

@Injectable()
export class ConnectionLogService {
  private readonly logger = new Logger(ConnectionLogService.name);

  constructor(
    @InjectRepository(ConnectionLog)
    private readonly connectionLogRepository: Repository<ConnectionLog>,
  ) { }

  async create(createDto: CreateConnectionLogDto): Promise<ConnectionLog> {
    try {
      const log = this.connectionLogRepository.create(createDto);
      const savedLog = await this.connectionLogRepository.save(log);

      this.logger.debug(`Connection log created: ${createDto.eventType} for user ${createDto.userId}`);
      return savedLog;
    } catch (error) {
      this.logger.error(`Failed to create connection log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUser(userId: string, limit: number = 100): Promise<ConnectionLog[]> {
    try {
      return await this.connectionLogRepository.find({
        where: { userId },
        relations: ['room'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          room: {
            id: true,
            name: true,
            roomCode: true,
          },
        },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to find logs by user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByRoom(roomId: string, limit: number = 100): Promise<ConnectionLog[]> {
    try {
      return await this.connectionLogRepository.find({
        where: { roomId },
        relations: ['user'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          user: {
            id: true,
            username: true,
          },
        },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to find logs by room ${roomId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEventType(eventType: string, limit: number = 100): Promise<ConnectionLog[]> {
    try {
      return await this.connectionLogRepository.find({
        where: { eventType },
        relations: ['user', 'room'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          user: {
            id: true,
            username: true,
          },
          room: {
            id: true,
            name: true,
            roomCode: true,
          },
        },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to find logs by event type ${eventType}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ConnectionLog[]> {
    try {
      return await this.connectionLogRepository.find({
        where: {
          timestamp: Between(startDate, endDate),
        },
        relations: ['user', 'room'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          user: {
            id: true,
            username: true,
          },
          room: {
            id: true,
            name: true,
            roomCode: true,
          },
        },
        order: { timestamp: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find logs by date range: ${error.message}`, error.stack);
      throw error;
    }
  }

  async logConnectionEvent(
    userId: string,
    roomId: string,
    eventType: 'connected' | 'disconnected' | 'reconnected' | 'failed',
    connectionQuality?: ConnectionQualityMetrics,
  ): Promise<ConnectionLog> {
    return await this.create({
      userId,
      roomId,
      eventType,
      connectionQuality,
    });
  }

  async logQualityMetrics(
    userId: string,
    roomId: string,
    metrics: ConnectionQualityMetrics,
  ): Promise<ConnectionLog> {
    return await this.create({
      userId,
      roomId,
      eventType: 'quality_update',
      connectionQuality: metrics,
    });
  }

  async getConnectionStats(userId: string, roomId: string, hours: number = 24): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      const logs = await this.connectionLogRepository.find({
        where: {
          userId,
          roomId,
          timestamp: Between(startDate, new Date()),
        },
        order: { timestamp: 'ASC' },
      });

      const stats = {
        totalEvents: logs.length,
        connectionEvents: logs.filter(log => ['connected', 'disconnected', 'reconnected', 'failed'].includes(log.eventType)).length,
        qualityUpdates: logs.filter(log => log.eventType === 'quality_update').length,
        averageQuality: this.calculateAverageQuality(logs),
        connectionUptime: this.calculateUptime(logs),
        reconnectionCount: logs.filter(log => log.eventType === 'reconnected').length,
        failureCount: logs.filter(log => log.eventType === 'failed').length,
      };

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get connection stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRoomConnectionStats(roomId: string, hours: number = 24): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      const logs = await this.connectionLogRepository.find({
        where: {
          roomId,
          timestamp: Between(startDate, new Date()),
        },
        relations: ['user'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          user: {
            id: true,
            username: true,
          },
        },
        order: { timestamp: 'ASC' },
      });

      const userStats = new Map();

      logs.forEach(log => {
        if (!userStats.has(log.userId)) {
          userStats.set(log.userId, {
            userId: log.userId,
            username: log.user?.username,
            events: [],
            connectionTime: 0,
            reconnections: 0,
            failures: 0,
          });
        }

        const stats = userStats.get(log.userId);
        stats.events.push(log);

        if (log.eventType === 'reconnected') stats.reconnections++;
        if (log.eventType === 'failed') stats.failures++;
      });

      return {
        totalParticipants: userStats.size,
        totalEvents: logs.length,
        participantStats: Array.from(userStats.values()),
        averageQuality: this.calculateAverageQuality(logs),
      };
    } catch (error) {
      this.logger.error(`Failed to get room connection stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.connectionLogRepository.delete({
        timestamp: LessThan(cutoffDate),
      });

      const deletedCount = result.affected || 0;
      this.logger.log(`Cleaned up ${deletedCount} old connection logs`);

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup old logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  private calculateAverageQuality(logs: ConnectionLog[]): any {
    const qualityLogs = logs.filter(log => log.connectionQuality && typeof log.connectionQuality === 'object');

    if (qualityLogs.length === 0) {
      return null;
    }

    const totals = {
      bandwidth: 0,
      latency: 0,
      packetLoss: 0,
      jitter: 0,
      audioLevel: 0,
      count: {
        bandwidth: 0,
        latency: 0,
        packetLoss: 0,
        jitter: 0,
        audioLevel: 0,
      },
    };

    qualityLogs.forEach(log => {
      const quality = log.connectionQuality;
      if (quality.bandwidth !== undefined) {
        totals.bandwidth += quality.bandwidth;
        totals.count.bandwidth++;
      }
      if (quality.latency !== undefined) {
        totals.latency += quality.latency;
        totals.count.latency++;
      }
      if (quality.packetLoss !== undefined) {
        totals.packetLoss += quality.packetLoss;
        totals.count.packetLoss++;
      }
      if (quality.jitter !== undefined) {
        totals.jitter += quality.jitter;
        totals.count.jitter++;
      }
      if (quality.audioLevel !== undefined) {
        totals.audioLevel += quality.audioLevel;
        totals.count.audioLevel++;
      }
    });

    return {
      bandwidth: totals.count.bandwidth > 0 ? totals.bandwidth / totals.count.bandwidth : null,
      latency: totals.count.latency > 0 ? totals.latency / totals.count.latency : null,
      packetLoss: totals.count.packetLoss > 0 ? totals.packetLoss / totals.count.packetLoss : null,
      jitter: totals.count.jitter > 0 ? totals.jitter / totals.count.jitter : null,
      audioLevel: totals.count.audioLevel > 0 ? totals.audioLevel / totals.count.audioLevel : null,
    };
  }

  private calculateUptime(logs: ConnectionLog[]): number {
    const connectionEvents = logs.filter(log =>
      ['connected', 'disconnected', 'reconnected', 'failed'].includes(log.eventType)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let totalUptime = 0;
    let lastConnectedTime: Date | null = null;

    connectionEvents.forEach(log => {
      if (log.eventType === 'connected' || log.eventType === 'reconnected') {
        lastConnectedTime = log.timestamp;
      } else if ((log.eventType === 'disconnected' || log.eventType === 'failed') && lastConnectedTime !== null) {
        totalUptime += log.timestamp.getTime() - lastConnectedTime.getTime();
        lastConnectedTime = null;
      }
    });

    // If still connected, add time until now
    if (lastConnectedTime !== null) {
      totalUptime += new Date().getTime() - (lastConnectedTime as Date).getTime();
    }

    return totalUptime; // in milliseconds
  }
}