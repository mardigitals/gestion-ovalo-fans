import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  async create(createEventoDto: CreateEventoDto) {
    const nuevoEvento = this.eventoRepository.create(createEventoDto);
    return await this.eventoRepository.save(nuevoEvento);
  }

  async findAll() {
    return await this.eventoRepository.find();
  }

  async findOne(id: number) {
    const evento = await this.eventoRepository.findOne({
      where: { id },
    });

    if (!evento) {
      throw new NotFoundException(`No se encontró el evento con ID #${id}`);
    }

    return evento;
  }

  async buscarPorNombre(nombreBusqueda: string) {
    const eventos = await this.eventoRepository.find({
      where: {
        titulo: Like(`%${nombreBusqueda}%`), 
      },
    });

    if (eventos.length === 0) {
      throw new NotFoundException(`No hay eventos programados que coincidan con "${nombreBusqueda}"`);
    }

    return eventos;
  }

  async update(id: number, updateEventoDto: UpdateEventoDto) {
    await this.findOne(id); 
    await this.eventoRepository.update(id, updateEventoDto);
    return this.findOne(id); 
  }

  //(Soft Delete)
  async remove(id: number) {
    await this.findOne(id);     
    
    await this.eventoRepository.softDelete(id); 
    
    return { mensaje: `El evento #${id} fue cancelado correctamente.` };
  }

  async obtenerEventosTCDisponibles() {
    const hoy = new Date();
    // Clavamos la hora a las 00:00 para que incluya el evento si es hoy mismo
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()); 
    // Último minuto del año en curso
    const finAnio = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59);

    return await this.eventoRepository.find({
      where: {
        tipo_evento: 'Carrera',
        categoria_carrera: 'TC',
        fecha_evento: Between(inicioHoy, finAnio)
      },
      order: {
        fecha_evento: 'ASC' // Ordenamos de la fecha más próxima a la más lejana
      },
      select: ['id', 'titulo', 'fecha_evento'] // Solo traemos lo justo y necesario para el Frontend
    });
  }

  async getMetricasTiposEventos() {
    // Agrupa los eventos del año actual por su tipo (Ej: 'Carrera', 'Recital', Prueba, Otro.)
    const rawData = await this.eventoRepository.query(`
      SELECT tipo_evento as name, COUNT(*) as value
      FROM evento
      WHERE YEAR(fecha_evento) = YEAR(CURDATE())
      GROUP BY tipo_evento
    `);
    
    // Convertimos los valores a números para que Recharts los lea bien
    return rawData.map(item => ({
      name: item.name,
      value: Number(item.value)
    }));
  }
}