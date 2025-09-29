-- Create indexes for better performance
-- This migration adds indexes to improve query performance

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Room indexes
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);

-- Room participant indexes
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_is_active ON room_participants(is_active);
CREATE INDEX IF NOT EXISTS idx_room_participants_joined_at ON room_participants(joined_at);

-- Connection log indexes
CREATE INDEX IF NOT EXISTS idx_connection_logs_user_id ON connection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_room_id ON connection_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_timestamp ON connection_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_connection_logs_event_type ON connection_logs(event_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_room_participants_room_active ON room_participants(room_id, is_active);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_active ON room_participants(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_connection_logs_user_room ON connection_logs(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_timestamp_desc ON connection_logs(timestamp DESC);