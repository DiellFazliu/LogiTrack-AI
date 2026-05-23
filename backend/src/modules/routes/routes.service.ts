import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';

import { Route } from './routes.entity';

@Injectable()
export class RoutesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,

    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
  ) {}

  async optimizeRoute(points: [number, number][]) {
    const apiKey = this.configService.get<string>('ORS_API_KEY');

    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: points,
        },
        {
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }

  async getAllRoutes() {
    return this.routeRepository.find({
      relations: ['stops'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getRouteById(id: string) {
    return this.routeRepository.findOne({
      where: { id },
      relations: ['stops'],
    });
  }
}