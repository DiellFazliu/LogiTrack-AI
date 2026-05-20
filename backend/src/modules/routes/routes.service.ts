import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RoutesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
}