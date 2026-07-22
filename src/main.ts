import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activamos el motor de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora cualquier campo que no esté en el DTO
      forbidNonWhitelisted: true, // Lanza un error si envían campos que no están en el DTO
      transform: true, // Convierte los datos de los parámetros a los tipos definidos en el DTO
      exceptionFactory: (errors) => {
      const erroresFormateados = {};
      
      errors.forEach((err) => {
        // err.property es el nombre del campo (ej: 'fecha_nacimiento')
        // Object.values(err.constraints)[0] extrae el primer mensaje de error que falló
        if (err.constraints) {
            erroresFormateados[err.property] = Object.values(err.constraints)[0];
        }
      });

      // Lanzamos la excepción con la estructura exacta que el frontend necesita
      return new BadRequestException({
        message: 'Error de validación en el formulario',
        errores: erroresFormateados,
      });
    },
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173', // La URL de tu proyecto Vite
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Usamos el puerto del .env o el 3000 por defecto
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Aplicación corriendo en: ${await app.getUrl()}`);

}
bootstrap();