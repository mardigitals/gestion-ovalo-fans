import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
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
}