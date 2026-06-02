import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../modules/users/user.entity';
import { Organization } from '../modules/organizations/organization.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesModule } from '../modules/roles/roles.module';
import { Driver } from '../modules/drivers/driver.entity';
import { JobsModule } from '../jobs/jobs.module';  // ✅ Importo JobsModule për EmailService
@Module({
  imports: [
    RolesModule,
    TypeOrmModule.forFeature([User, Organization, Driver]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        let expiresIn = configService.get('JWT_EXPIRES_IN');
        if (typeof expiresIn === 'string' && /^\d+$/.test(expiresIn)) {
          expiresIn = parseInt(expiresIn, 10);
        }
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: { expiresIn },
        };
      },
    }),
    JobsModule,  
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}