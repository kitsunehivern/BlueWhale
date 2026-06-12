-- Run this file once to initialise the database.
-- Order matters: baucua_bets references baucua_games; chat_messages is self-referencing.

CREATE TABLE IF NOT EXISTS players (
    id               INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id          VARCHAR(64)  NOT NULL UNIQUE,
    balance          BIGINT       NOT NULL DEFAULT 0,
    daily_claimed_at DATETIME     NOT NULL DEFAULT '1970-01-01 00:00:00',
    steal_claimed_at DATETIME     NOT NULL DEFAULT '1970-01-01 00:00:00',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS baucua_games (
    id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    channel_id  VARCHAR(64)  NOT NULL,
    started_by  VARCHAR(64)  NOT NULL,
    status      ENUM('active','settled','refunded') NOT NULL DEFAULT 'active',
    message_id  VARCHAR(64),
    dices       JSON,
    ends_at     DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at  DATETIME,
    refunded_at DATETIME
);

CREATE TABLE IF NOT EXISTS baucua_bets (
    id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    game_id    INT          NOT NULL,
    user_id    VARCHAR(64)  NOT NULL,
    symbol     ENUM('calabash','crab','prawn','fish','cock','stag') NOT NULL,
    amount     BIGINT       NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bet_game FOREIGN KEY (game_id) REFERENCES baucua_games(id)
);

CREATE TABLE IF NOT EXISTS user_memories (
    id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    VARCHAR(64)  NOT NULL,
    fact       TEXT         NOT NULL,
    deleted_at DATETIME     NULL DEFAULT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_memory_user_active (user_id, deleted_at)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id     VARCHAR(64)  NOT NULL PRIMARY KEY,
    user_id        VARCHAR(64)  NOT NULL,
    channel_id     VARCHAR(64)  NOT NULL,
    text           TEXT         NOT NULL,
    ref_message_id VARCHAR(64),
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_ref FOREIGN KEY (ref_message_id) REFERENCES chat_messages(message_id) ON DELETE SET NULL,
    INDEX idx_chat_ref (ref_message_id)
);
