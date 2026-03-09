import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Suscripcion } from './entities/suscripcion.entity';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { Membresia } from 'src/membresia/entities/membresia.entity';

@Injectable()
export class SuscripcionService {
  constructor(
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
    
    @InjectRepository(Membresia)
    private readonly membresiaRepository: Repository<Membresia>,
  ) {}

  /**
   * 1. INICIAR SUSCRIPCIÓN (Estado: Pendiente)
   * Se dispara cuando el fan elige un plan en el frontend.
   */
  async crearIntencion(createSuscripcionDto: CreateSuscripcionDto) {
    // Validar que no tenga otra suscripción ya activa
    const activa = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: createSuscripcionDto.perfil_fan_id, estado: 'Activo' }
    });
    
    if (activa) {
      throw new BadRequestException('Ya posees una suscripción activa en el sistema.');
    }

    const nueva = this.suscripcionRepository.create({
      ...createSuscripcionDto,
      estado: 'Pendiente', // No da acceso hasta que se acredite el pago
    });

    return await this.suscripcionRepository.save(nueva);
  }

  /**
   * 2. ACTIVACIÓN AUTOMÁTICA (Estado: Activo)
   * Se dispara al recibir confirmación de pago (Mercado Pago).
   */
  async activarSuscripcion(id: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['membresia']
    });

    if (!suscripcion) throw new NotFoundException('La suscripción no existe.');

    const ahora = new Date();
    const fechaFin = new Date();

    // Lógica automática de fechas según el nombre de la membresía
    if (suscripcion.membresia.nombre.toLowerCase().includes('anual')) {
      fechaFin.setFullYear(ahora.getFullYear() + 1);
    } else {
      fechaFin.setDate(ahora.getDate() + 30);
    }

    return await this.suscripcionRepository.save({
      ...suscripcion,
      estado: 'Activo',
      fecha_inicio: ahora,
      fecha_fin: fechaFin,
    });
  }

  /**
   * 3. VALIDACIÓN DE ACCESO (Incluye 72hs de Gracia)
   * Verifica si el fan puede entrar al contenido exclusivo.
   */
  async validarAccesoFan(fanId: number): Promise<boolean> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: fanId, estado: 'Activo' },
      order: { fecha_fin: 'DESC' }
    });

    if (!suscripcion) return false;

    const ahora = new Date();
    const limiteGracia = new Date(suscripcion.fecha_fin);
    limiteGracia.setHours(limiteGracia.getHours() + 72); // Sumamos las 72hs de gracia

    return ahora < limiteGracia;
  }

  /**
   * 4. PROCESO DE VENCIMIENTO (Cron Job)
   * Ejecuta la limpieza de socios que excedieron las 72hs de gracia.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async limpiarExpirados() {
    const limiteCorte = new Date();
    limiteCorte.setHours(limiteCorte.getHours() - 72); 

    const resultado = await this.suscripcionRepository.update(
      { 
        estado: 'Activo', 
        fecha_fin: LessThan(limiteCorte) // Más de 72hs vencido
      },
      { estado: 'Vencido' }
    );

    console.log(`[Cron] ${resultado.affected} socios pasaron a Vencido.`);
  }

  /**
   * 5. CANCELACIÓN VOLUNTARIA
   */
  async cancelar(id: number, fanId: number) {
    const suscripcion = await this.suscripcionRepository.findOneBy({ id, perfil_fan_id: fanId });
    
    if (!suscripcion) throw new BadRequestException('No se pudo cancelar la suscripción.');

    suscripcion.estado = 'Cancelado';
    return await this.suscripcionRepository.save(suscripcion);
  }

  async findAll() {
    return await this.suscripcionRepository.find({ relations: ['perfilFan', 'membresia'] });
  }

  async findOne(id: number) {
    return await this.suscripcionRepository.findOne({ 
      where: { id }, 
      relations: ['perfilFan', 'membresia'] 
    });
  }

  async findByEstado(estado: string) {
    return await this.suscripcionRepository.find({
      where: { estado },
      relations: ['perfilFan', 'membresia'],
      order: { fecha_fin: 'DESC' }
    });
  }

  async findByDni(dni: string) {
    return await this.suscripcionRepository.find({
      // Relación profunda: Buscamos en el PerfilFan -> Usuario -> DNI
      where: { 
        perfilFan: { 
          usuario: { dni } 
        } 
      },
      relations: ['perfilFan', 'perfilFan.usuario', 'membresia']
    });
  }

  async countByMembresia() {
    return await this.suscripcionRepository
      .createQueryBuilder('suscripcion')
      .select('membresia.nombre', 'plan')
      .addSelect('COUNT(suscripcion.id)', 'cantidad')
      .innerJoin('suscripcion.membresia', 'membresia')
      .groupBy('membresia.id')
      .getRawMany();
  }
}
