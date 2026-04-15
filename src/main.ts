import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activamos el motor de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora cualquier campo que no esté en el DTO
      forbidNonWhitelisted: true, // Lanza un error si envían campos que no están en el DTO
      transform: true, // Convierte los datos de los parámetros a los tipos definidos en el DTO
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173', // La URL de tu proyecto Vite
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Usamos el puerto del .env o el 3000 por defecto
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Aplicación corriendo en: ${await app.getUrl()}`);
}
bootstrap();