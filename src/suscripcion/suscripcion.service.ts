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
   */
  async crearIntencion(dto: CreateSuscripcionDto, usuarioId: number) {
    const perfil = await this.suscripcionRepository.manager.getRepository('PerfilFan').findOne({
      where: { usuario_id: usuarioId }
    });

    if (!perfil) throw new NotFoundException('No se encontró un perfil de Fan para este usuario.');

    // Validar que no tenga otra suscripción ya activa
    const activa = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: perfil.id, estado: 'Activo' }
    });
    
    if (activa) {
      throw new BadRequestException('Ya posees una suscripción activa.');
    }

    // 🔥 EL BLINDAJE ANTI-SPAM: Buscamos si ya tiene una intención pendiente
    const pendienteExistente = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: perfil.id, estado: 'Pendiente' }
    });

    if (pendienteExistente) {
      // Si ya tiene una pendiente, simplemente le actualizamos el plan que eligió ahora
      pendienteExistente.membresia_id = dto.membresia_id;
      return await this.suscripcionRepository.save(pendienteExistente);
    }

    // Solo si no tenía nada pendiente, creamos una nueva
    const nueva = this.suscripcionRepository.create({
      membresia_id: dto.membresia_id,
      perfil_fan_id: perfil.id,
      estado: 'Pendiente',      
    });

    return await this.suscripcionRepository.save(nueva);
  }

  /**
   * 2. ACTIVACIÓN AUTOMÁTICA
   */
  async activarSuscripcion(id: number) {
    const suscripcionNueva = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['membresia', 'perfilFan']
    });

    if (!suscripcionNueva) throw new NotFoundException('La suscripción no existe.');

    // 🔥 BLINDAJE ANTI-CLONES: Buscamos si el usuario ya tenía otra activa y la matamos
    const suscripcionesViejas = await this.suscripcionRepository.find({
      where: { 
        perfil_fan_id: suscripcionNueva.perfil_fan_id, 
        estado: 'Activo' 
      }
    });

    for (const vieja of suscripcionesViejas) {
      if (vieja.id !== suscripcionNueva.id) {
        vieja.estado = 'Cancelado'; // Damos de baja la anterior (Upgrade/Reemplazo)
        await this.suscripcionRepository.save(vieja);
      }
    }

    // Procedemos a activar la nueva
    const ahora = new Date();
    const fechaFin = new Date();

    if (suscripcionNueva.membresia.nombre.toLowerCase().includes('anual')) {
      fechaFin.setFullYear(ahora.getFullYear() + 1);
    } else {
      fechaFin.setDate(ahora.getDate() + 30);
    }

    return await this.suscripcionRepository.save({
      ...suscripcionNueva,
      estado: 'Activo',
      fecha_inicio: ahora,
      fecha_fin: fechaFin,
    });
  }

  /**
   * 3. VALIDACIÓN DE ACCESO (Incluye 72hs de Gracia)
   * Verifica si el fan puede entrar al contenido exclusivo.
   */
  async validarAccesoFan(usuarioId: number): Promise<boolean> {
    // Buscamos la suscripción activa usando el ID de Auth (el 8 que ves en el debugger)
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
        // busca el perfil que pertenece a ese usuario logueado
        perfilFan: { usuario_id: usuarioId },
        estado: 'Activo' 
      },
      order: { fecha_fin: 'DESC' }
    });

    // Si no encuentra ninguna suscripción para ese usuario, acceso denegado
    if (!suscripcion) return false;

    const ahora = new Date();
    const limiteGracia = new Date(suscripcion.fecha_fin);
    limiteGracia.setHours(limiteGracia.getHours() + 72); 

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
  async cancelar(id: number, usuarioId: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
      id: id,
      perfilFan: { usuario_id: usuarioId } 
      }
   });
    
    if (!suscripcion) throw new BadRequestException('No se pudo cancelar la suscripción.');

    suscripcion.estado = 'Cancelado';
    return await this.suscripcionRepository.save(suscripcion);
  }

  /**
   * 6. OBTENER ESTADO PARA EL FRONTEND
   * Devuelve el string exacto del estado para manejar el PitStopOverlay
   */
  async obtenerEstadoParaFrontend(usuarioId: number): Promise<string> {
    const perfil = await this.suscripcionRepository.manager.getRepository('PerfilFan').findOne({
      where: { usuario_id: usuarioId }
    });

    if (!perfil) return 'Sin Suscripcion';

    // Buscamos la última suscripción que haya intentado hacer
    const ultimaSuscripcion = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: perfil.id },
      order: { id: 'DESC' }
    });

    return ultimaSuscripcion ? ultimaSuscripcion.estado : 'Sin Suscripcion';
  }

  async findAll(pagina: number = 1, limite: number = 10) {
    const saltar = (pagina - 1) * limite;

    const [data, total] = await this.suscripcionRepository.findAndCount({
      relations: ['perfilFan', 'membresia', 'perfilFan.usuario'],
      take: limite,
      skip: saltar,
      order: { id: 'DESC' }
    });

    return {
      data,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  async findOne(usuarioId: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
        perfilFan: { usuario_id: usuarioId },
        estado: 'Activo' // Siempre traemos la que está vigente
      },
      order: { id: 'DESC' }, // La más nueva por si acaso
      relations: ['membresia'] // Traemos los datos del plan (Precio, nombre, etc.)
    });

    if (!suscripcion) {
      throw new NotFoundException('No tienes ninguna suscripción activa actualmente.');
    }
    return suscripcion;
  }
  
  async findByEstado(estado: string) {
    return await this.suscripcionRepository.find({
      where: { estado },
      relations: ['perfilFan', 'membresia'],
      order: { fecha_fin: 'DESC' }
    });
  }

  async findByDni(dni: string) {
    const resultado = await this.suscripcionRepository.find({
      // Relación profunda: Buscamos en el PerfilFan -> Usuario -> DNI
      where: { 
        perfilFan: { 
          usuario: { dni } 
        } 
      },
      relations: ['perfilFan', 'perfilFan.usuario', 'membresia']
    })
    if (resultado.length === 0) throw new NotFoundException(`No hay suscripciones para el DNI ${dni}`);
    return resultado;
  }

  async countBySuscripcion() {
    // Usamos un query builder para contar eficientemente agrupado por estado
    return await this.suscripcionRepository
      .createQueryBuilder('suscripcion')
      .select('suscripcion.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('suscripcion.estado')
      .getRawMany();

    // Esto devuelve algo como: [{ estado: 'Activo', cantidad: '5' }, { estado: 'Pendiente', cantidad: '10' }, ...]
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

  async countByChicanaFavorita() {
    return await this.suscripcionRepository.manager
      .getRepository('PerfilFan')
      .createQueryBuilder('perfil')
      .select('perfil.chicana_favorita', 'chicana')
      .addSelect('COUNT(perfil.id)', 'cantidad')
      .groupBy('perfil.chicana_favorita')
      .getRawMany();
  }

  async countByCiudad() {
    return await this.suscripcionRepository.manager
      .getRepository('PerfilFan') 
      .createQueryBuilder('perfil')
      .innerJoin('perfil.usuario', 'usuario') 
      .select('usuario.ciudad', 'ciudad')
      .addSelect('COUNT(perfil.id)', 'cantidad')
      .groupBy('usuario.ciudad')
      .orderBy('cantidad', 'DESC')
      .getRawMany();
  }

  async countByProvincia() {
    return await this.suscripcionRepository.manager
      .getRepository('PerfilFan') 
      .createQueryBuilder('perfil')
      .innerJoin('perfil.usuario', 'usuario') 
      .select('usuario.provincia', 'provincia')
      .addSelect('COUNT(perfil.id)', 'cantidad')
      .groupBy('usuario.provincia')
      .orderBy('cantidad', 'DESC')
      .getRawMany();
  }

  async obtenerPorId(id: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      // 👇 Agregamos perfilFan y su usuario para saber de quién es
      relations: ['membresia', 'perfilFan', 'perfilFan.usuario'] 
    });
    
    if (!suscripcion) {
      throw new NotFoundException(`No se encontró la suscripción con ID ${id}`);
    }
    
    return suscripcion;
  }

  async obtenerNivelParaCensura(usuarioId: number): Promise<number> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
        perfilFan: { usuario_id: usuarioId },
        estado: 'Activo' 
      },
    });

    // Si existe devolvemos el ID (1 o 2), si no, devolvemos 3 (Público)
    return suscripcion ? suscripcion.membresia_id : 3;
  }

  
}
