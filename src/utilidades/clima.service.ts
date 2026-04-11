import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, map, firstValueFrom } from 'rxjs';

@Injectable()
export class ClimaService {
  constructor(private readonly httpService: HttpService) {}

  private readonly apiKey = process.env.OPENWEATHER_API_KEY;
  private readonly lat = process.env.CITY_LAT;
  private readonly lon = process.env.CITY_LON;

  async obtenerClimaRafaela() {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.lon}&appid=${this.apiKey}&units=metric&lang=es`;

    // 🏎️ Pipe de RxJS para transformar la respuesta de la API
    const observable = this.httpService.get(url).pipe(
      map((res) => res.data),
      map((data) => ({
        ciudad: data.name,
        temperatura: Math.round(data.main.temp),
        descripcion: data.weather[0].description,
        icono: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        humedad: data.main.humidity,
      })),
      catchError((err) => {
        console.error('Error en OpenWeather:', err.response?.data || err.message);
        throw new InternalServerErrorException('No se pudo obtener el clima de Rafaela');
      }),
    );

    // Convertimos a promesa para que el controller sea async/await tradicional
    return await firstValueFrom(observable);
  }
}