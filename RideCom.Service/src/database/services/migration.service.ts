import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  async runMigrations(): Promise<void> {
    try {
      this.logger.log('Starting database migrations...');

      const migrationsDir = path.join(__dirname, '../migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        await this.runMigration(file);
      }

      this.logger.log('All migrations completed successfully');
    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async runMigration(filename: string): Promise<void> {
    try {
      const migrationPath = path.join(__dirname, '../migrations', filename);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      this.logger.log(`Running migration: ${filename}`);

      await this.dataSource.query(sql);

      this.logger.log(`Migration completed: ${filename}`);
    } catch (error) {
      this.logger.error(`Failed to run migration ${filename}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error(`Database connection failed: ${error.message}`, error.stack);
      return false;
    }
  }

  async createDatabase(databaseName: string): Promise<void> {
    try {
      // Connect to postgres database to create the target database
      const tempDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: 'postgres', // Connect to default postgres database
      });

      await tempDataSource.initialize();

      // Check if database exists
      const result = await tempDataSource.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [databaseName]
      );

      if (result.length === 0) {
        this.logger.log(`Creating database: ${databaseName}`);
        await tempDataSource.query(`CREATE DATABASE "${databaseName}"`);
        this.logger.log(`Database created: ${databaseName}`);
      } else {
        this.logger.log(`Database already exists: ${databaseName}`);
      }

      await tempDataSource.destroy();
    } catch (error) {
      this.logger.error(`Failed to create database ${databaseName}: ${error.message}`, error.stack);
      throw error;
    }
  }
}