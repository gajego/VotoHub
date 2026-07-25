import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DomainMiddleware } from './shared/domain.middleware';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { RemovePasswordInterceptor } from './shared/interceptors/remove-password.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { CandidatoModule } from './candidato/candidato.module';
import { VotacaoModule } from './votacao/votacao.module';
import { InitialAdminBootstrapService } from './shared/service/initial-admin-bootstrap.service';
import { Client } from 'pg';
import { randomUUID } from 'crypto';

async function prepareVoteIdentifierColumn() {
  if (process.env.DB_TYPE !== 'postgres') {
    return;
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  await client.connect();

  try {
    const tableExists = await client.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'voto'
        ) AS "exists"
      `,
    );

    if (!tableExists.rows[0]?.exists) {
      return;
    }

    await client.query(
      'ALTER TABLE "voto" ADD COLUMN IF NOT EXISTS "identifier" varchar',
    );

    const rowsToFix = await client.query<{ id: number }>(
      'SELECT "id" FROM "voto" WHERE "identifier" IS NULL',
    );

    for (const row of rowsToFix.rows) {
      await client.query(
        'UPDATE "voto" SET "identifier" = $1 WHERE "id" = $2',
        [randomUUID(), row.id],
      );
    }

    await client.query(
      'ALTER TABLE "voto" ALTER COLUMN "identifier" SET NOT NULL',
    );
  } finally {
    await client.end();
  }
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        await prepareVoteIdentifierColumn();

        return {
          type: process.env.DB_TYPE as any,
          host: process.env.DB_HOST,
          port: +process.env.DB_PORT,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          subscribers: [__dirname + '/**/*.subscriber{.ts,.js}'],
        };
      },
    }),
    AuthModule,
    UserModule,
    CandidatoModule,
    VotacaoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    InitialAdminBootstrapService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RemovePasswordInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DomainMiddleware).forRoutes('*');
    Logger.log('Domínios permitidos para acesso: ' + process.env.CORS_MODE);
  }
}
