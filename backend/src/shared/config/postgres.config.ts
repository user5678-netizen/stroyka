export type PostgresConnection = {
  type: 'postgres';
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl: false | { rejectUnauthorized: boolean };
};

function read(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

export function postgresSslEnabled(databaseUrl?: string): boolean {
  return (
    read('DB_SSL') === 'true' ||
    read('NODE_ENV') === 'production' ||
    Boolean(databaseUrl?.includes('sslmode=require'))
  );
}

/** Neon отдаёт одну строку DATABASE_URL. Локальный Docker по-прежнему использует DB_HOST и соседние переменные. */
export function postgresConnectionFromEnv(): PostgresConnection {
  const databaseUrl = read('DATABASE_URL');
  const ssl = postgresSslEnabled(databaseUrl)
    ? { rejectUnauthorized: false }
    : false;

  if (databaseUrl) {
    return { type: 'postgres', url: databaseUrl, ssl };
  }

  return {
    type: 'postgres',
    host: read('DB_HOST'),
    port: Number(read('DB_PORT') ?? 5432),
    username: read('DB_USERNAME'),
    password: read('DB_PASSWORD'),
    database: read('DB_NAME'),
    ssl,
  };
}
