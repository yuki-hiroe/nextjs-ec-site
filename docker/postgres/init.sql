-- データベースとユーザーの権限を確実に設定
-- スーパーユーザー権限を付与（開発環境用）
ALTER USER intercambio WITH SUPERUSER;

-- データベースへの接続権限を確認
GRANT ALL PRIVILEGES ON DATABASE intercambio_db TO intercambio;

-- スキーマへの権限を設定
\c intercambio_db
GRANT ALL ON SCHEMA public TO intercambio;
ALTER SCHEMA public OWNER TO intercambio;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO intercambio;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO intercambio;

