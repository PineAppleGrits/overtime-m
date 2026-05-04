import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
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
import { StorageModule } from './common/storage/storage.module';
import { SportRulesModule } from './common/sport-rules/sport-rules.module';
import { CronSupportModule } from './common/cron/cron.module';
import { CategoryLevelsModule } from './category-levels/category-levels.module';
import { TeamCategorizationModule } from './team-categorization/team-categorization.module';
import { FriendliesModule } from './friendlies/friendlies.module';
import { PricingModule } from './pricing/pricing.module';
import { DebtsModule } from './debts/debts.module';
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
    EventEmitterModule.forRoot({
      // Wildcard listeners ('match.*') habilitados.
      wildcard: true,
      delimiter: '.',
      // Permitimos múltiples listeners por evento (default es ilimitado).
      maxListeners: 20,
    }),
    ScheduleModule.forRoot(), // habilita @Cron en jobs (W1.4 — friendlies expire)
    DatabaseModule,
    StorageModule,        // PR0 — Supabase storage + MediaAsset (global)
    SportRulesModule,     // PR0 — strategies de reglas por deporte+modalidad (global)
    CronSupportModule,    // PR0 — advisory locks para crons (global)
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
    CategoryLevelsModule, // W1.3 — niveles globales por deporte (RN-044, RN-058)
    TeamCategorizationModule, // W1.3 — asignación de niveles a equipos (RN-039, RN-044)
    FriendliesModule, // W1.4 — solicitud, generación y ciclo del amistoso (RN-022/023/039/059)
    PricingModule, // W2.3 — pricing periods (+method) RN-048, descuentos manuales RN-020, franquicia stub RN-012/DP-011
    DebtsModule, // W2.1 — deudas, cron de cargos diarios y auto-borrado de comprobantes (RN-025-031, RN-053, RN-060)
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
