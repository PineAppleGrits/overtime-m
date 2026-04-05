import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { SportsModule } from './sports/sports.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { VenuesModule } from './venues/venues.module';
import { MatchesModule } from './matches/matches.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { FixturesModule } from './fixtures/fixtures.module';
import { StaffModule } from './staff/staff.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { FranchisesModule } from './franchises/franchises.module';
import { EligibilityModule } from './eligibility/eligibility.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppValidationPipe } from './common/pipes/app-validation.pipe';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import supabaseConfig from './config/supabase.config';
import resendConfig from './config/resend.config';
import mercadopagoConfig from './config/mercadopago.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        supabaseConfig,
        resendConfig,
        mercadopagoConfig,
      ],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('app.throttle.ttl') || 60,
            limit: config.get<number>('app.throttle.limit') || 100,
          },
        ],
      }),
    }),
    DatabaseModule,
    AuthModule,
    TeamsModule,
    SportsModule,
    TournamentsModule, // Maneja Torneos, Categorías y Zonas
    VenuesModule, // Maneja Canchas y Locaciones
    MatchesModule, // Maneja Partidos y Comunicados
    RegistrationsModule, // Maneja Inscripciones de Equipos a Torneos
    EligibilityModule,
    FixturesModule,
    StaffModule, // Maneja Personal (árbitros, oficiales, fotógrafos)
    NotificationsModule, // Maneja Sistema de Notificaciones
    PaymentsModule, // Maneja Pagos (inscripciones, partidos)
    UsersModule,
    FranchisesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: AppValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
