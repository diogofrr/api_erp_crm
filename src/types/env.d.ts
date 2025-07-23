declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string;

    // JWT Authentication
    JWT_SECRET: string;

    // Application
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;

    // Cloudflare R2 Storage (GRATUITO!)
    R2_ENDPOINT: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_PUBLIC_URL: string;

    // Email Configuration
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;

    // Throttler
    ALLOWED_ORIGINS: string;

    // Throttler
    MINUTE_THROTTLE_TTL: string;
    MINUTE_THROTTLE_LIMIT: string;
    HOUR_THROTTLE_TTL: string;
    HOUR_THROTTLE_LIMIT: string;

    // Cors
    ALLOWED_ORIGINS: string;
  }
}
