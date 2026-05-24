// backend/src/modules/drivers/drivers.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Driver, DriverStatus } from './driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { DriverLocation } from './location.entity';

@Injectable()
export class DriversService {

  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(DriverLocation)
    private locationRepository: Repository<DriverLocation>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreateDriverDto, organizationId: string): Promise<Driver> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let savedUser: User | null = null;

      if (createDto.userId) {
        savedUser = await queryRunner.manager.findOne(User, {
          where: { id: createDto.userId, organizationId },
        });

        if (!savedUser) {
          throw new ConflictException('User not found in this organization');
        }
      } else {
        if (!createDto.email || !createDto.password || !createDto.name) {
          throw new ConflictException(
            'Provide either userId OR { name, email, password } to create a driver user',
          );
        }

        const existingUser = await queryRunner.manager.findOne(User, {
          where: { email: createDto.email },
        });

        if (existingUser) {
          if (existingUser.organizationId !== organizationId) {
            throw new ConflictException('User already exists in a different organization');
          }
          savedUser = existingUser;
        } else {
          const hashedPassword = await bcrypt.hash(createDto.password, 10);

          const user = queryRunner.manager.create(User, {
            email: createDto.email,
            name: createDto.name,
            password: hashedPassword,
            organizationId,
            phone: createDto.phone,
            isActive: true,
          });

          savedUser = await queryRunner.manager.save(user);

          await queryRunner.manager.query(
            `
            INSERT INTO user_roles (user_id, role_id)
            SELECT $1, id FROM roles WHERE name = 'driver'
            `,
            [savedUser.id],
          );
        }
      }

      await queryRunner.manager.query(
        `
        INSERT INTO user_roles (user_id, role_id)
        SELECT $1, id FROM roles WHERE name = 'driver'
        `,
        [savedUser!.id],
      );

      const driver = queryRunner.manager.create(Driver, {
        userId: savedUser!.id,
        organizationId,
        licenseNumber: createDto.licenseNumber,
        phone: createDto.phone,
        emergencyContact: createDto.emergencyContact ?? undefined,
        emergencyPhone: createDto.emergencyPhone ?? undefined,
        status: DriverStatus.AVAILABLE,
        isActive: true,
        totalDeliveries: 0,
        rating: 0,
      });

      const savedDriver = await queryRunner.manager.save(driver);

      await queryRunner.commitTransaction();
      return savedDriver;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(organizationId: string, status?: DriverStatus): Promise<Driver[]> {
    const where: any = { organizationId, isActive: true };
    if (status) where.status = status;

    return this.driverRepository.find({
      where,
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['user', 'organization', 'shipments'],
    });

    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }
// backend/src/modules/drivers/drivers.service.ts
// Shto këtë metodë:

async getLastLocationByDriverId(driverId: string): Promise<DriverLocation | null> {
  const lastLocation = await this.locationRepository.findOne({
    where: { driverId },
    order: { createdAt: 'DESC' },
  });
  return lastLocation;
}

  async findByUserId(userId: string): Promise<Driver | null> {
    return this.driverRepository.findOne({
      where: { userId: userId, isActive: true },
    });
  }
  

  async update(
    id: string,
    updateDto: UpdateDriverDto,
    organizationId: string,
  ): Promise<Driver> {
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, updateDto);
    return this.findOne(id, organizationId);
  }

  async updateStatus(
    id: string,
    status: DriverStatus,
    organizationId: string,
  ): Promise<Driver> {
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, { status });
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, { isActive: false });
  }

  async getAvailable(organizationId: string): Promise<any[]> {
    const drivers = await this.driverRepository.find({
      where: {
        organizationId,
        status: DriverStatus.AVAILABLE,
        isActive: true,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return drivers.map((driver) => ({
      id: driver.id,
      name: driver.user?.name ?? '',
      email: driver.user?.email ?? '',
      phone: driver.phone,
      status: driver.status,
      totalDeliveries: driver.totalDeliveries,
      rating: driver.rating,
      licenseNumber: driver.licenseNumber,
    }));
  }

  // ==================== LOCATION METHODS ====================

// backend/src/modules/drivers/drivers.service.ts
async updateLocation(
  driverId: string,  // kjo është driver.id, jo userId
  latitude: number,
  longitude: number,
  address?: string,
): Promise<DriverLocation> {
  console.log('updateLocation called with driverId:', driverId);
  
  // Gjej driver-in duke përdorur ID direkte
  const driver = await this.driverRepository.findOne({
    where: { id: driverId, isActive: true }
  });
  
  if (!driver) {
    throw new NotFoundException('Driver not found');
  }

  const location = this.locationRepository.create({
    driverId: driver.id,
    latitude,
    longitude,
    address,
  });

  const saved = await this.locationRepository.save(location);
  console.log('Location saved:', saved);
  
  return saved;
}

  async getLocationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ items: DriverLocation[]; total: number }> {
    const driver = await this.findByUserId(userId);
    
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const [items, total] = await this.locationRepository.findAndCount({
      where: { driverId: driver.id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { items, total };
  }

  async getLastLocation(userId: string): Promise<DriverLocation | null> {
    const driver = await this.findByUserId(userId);
    
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const lastLocation = await this.locationRepository.findOne({
      where: { driverId: driver.id },
      order: { createdAt: 'DESC' },
    });

    return lastLocation;
  }
}