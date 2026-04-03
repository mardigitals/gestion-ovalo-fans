import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateComercioAliadoDto } from './dto/create-comercio-aliado.dto';
import { UpdateComercioAliadoDto } from './dto/update-comercio-aliado.dto';
import { ComercioAliado } from './entities/comercio-aliado.entity';
import { Repository, Like } from 'typeorm';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';


@Injectable()
export class ComercioAliadoService {
  constructor(
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepo: Repository<Suscripcion>,
    
    @InjectRepository(ComercioAliado)
    private readonly comercioRepository: Repository<ComercioAliado>,
  ) {}

  async create(dto: CreateComercioAliadoDto) {
    const nuevoComercio = this.comercioRepository.create(dto);
    return await this.comercioRepository.save(nuevoComercio);
  }

  async update(id: number, dto: UpdateComercioAliadoDto) {
    await this.comercioRepository.update(id, dto);
    return await this.comercioRepository.findOne({ where: { id } });
  }

  async buscarPorNombre(nombreBusqueda: string) {
    const comercios = await this.comercioRepository.find({
      where: {
        // Usamos Like con los % para que busque coincidencias parciales
        nombre_comercio: Like(`%${nombreBusqueda}%`), 
      },
    });

    if (comercios.length === 0) {
      throw new NotFoundException(`No se encontraron comercios que coincidan con la búsqueda: "${nombreBusqueda}"`);
    }

    return comercios; // Devolvemos el array con todos los que coincidieron
  }

  async findAll() {
    return await this.comercioRepository.find();
  }
  
  //borrado físico, ya que no tenemos FKs en esta version inicial
  async remove(id: number) {
    await this.comercioRepository.delete(id);
    return { message: `El comercio #${id} fue eliminado correctamente de la lista de adheridos.` };
  }
  
  async validarFanParaDescuento(dni: string) {
    const suscripcion = await this.suscripcionRepo.findOne({
      where: {
        perfilFan: {
          usuario: {
            dni: dni,
          },
        },
        estado: 'Activo', 
      },
      relations: ['perfilFan', 'perfilFan.usuario', 'membresia'],
    });

    if (!suscripcion) {
      throw new NotFoundException(`El DNI ${dni} no corresponde a un socio activo de Ovalo Fans.`);
    }

    //  mando al frontend del cajero solo lo que le importa
    return {
      valido: true,
      mensaje: '¡Socio Activo! Aplicar descuento.',
      fan: {
        nombre_completo: `${suscripcion.perfilFan.usuario.nombre} ${suscripcion.perfilFan.usuario.apellido}`
      },
      membresia: {
        plan: suscripcion.membresia.nombre
      },
    };
  }
}