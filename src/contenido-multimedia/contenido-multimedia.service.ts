import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AutoEncrypter, Repository } from 'typeorm';
import { ContenidoMultimedia } from './entities/contenido-multimedia.entity';
import { PerfilStaff } from '../perfil-staff/entities/perfil-staff.entity';
import { CreateContenidoMultimediaDto } from './dto/create-contenido-multimedia.dto';
import { UpdateContenidoMultimediaDto } from './dto/update-contenido-multimedia.dto';

@Injectable()
export class ContenidoMultimediaService {
  constructor(
    @InjectRepository(ContenidoMultimedia)
    private readonly contenidoRepo: Repository<ContenidoMultimedia>,

    @InjectRepository(PerfilStaff)
    private readonly staffRepo: Repository<PerfilStaff>,
  ) {}

  // 1. CREATE con mapeo limpio
  async create(createDto: CreateContenidoMultimediaDto, userId: number) {
    const staff = await this.staffRepo.findOne({ where: { usuario_id: userId },
    relations: ['usuario', 'rolStaff'] 
  });
    
    if (!staff) {
      throw new UnauthorizedException('No tienes un perfil de staff para publicar contenido.');
    }

    const rolesPermitidos = ['Prensa', 'SuperAdmin'];
    if (!rolesPermitidos.includes(staff.rolStaff.nombre_rol)) {
      throw new ForbiddenException(`Tu rol (${staff.rolStaff.nombre_rol}) no tiene permisos para publicar contenido.`);
    }

    const nuevo = this.contenidoRepo.create({
      ...createDto,
      autor: staff 
    });

    const guardado = await this.contenidoRepo.save(nuevo);

    return {
      ...guardado,
      autor: {
        id: staff.id,
        area: staff.area,
        cargo: staff.cargo
      }
    };
  }

  // 2. FIND ALL con mapeo de lista
  async findAll() {
    const resultados = await this.contenidoRepo.find({
      relations: ['autor', 'autor.usuario'],
      order: { 
        es_destacado: 'DESC',      
        fecha_publicacion: 'DESC'  
      }
    });

    return resultados.map(item => ({
      ...item,
      autor: {
        nombre: item.autor.usuario.nombre,
        apellido: item.autor.usuario.apellido,
        area: item.autor.area,
        cargo: item.autor.cargo
      }
    }));
  }

  // 3. FIND ONE con incremento de vistas y mapeo
  async findOne(id: number) {
    const contenido = await this.contenidoRepo.findOne({
      where: { id },
      relations: ['autor', 'autor.usuario'],
    });

    if (!contenido) {
      throw new NotFoundException(`El contenido con ID ${id} no existe.`);
    }

    await this.contenidoRepo.increment({ id }, 'vistas', 1);

    return {
      ...contenido,
      vistas: contenido.vistas + 1,
      autor: {
        nombre: contenido.autor.usuario.nombre,
        apellido: contenido.autor.usuario.apellido,
        area: contenido.autor.area,
        cargo: contenido.autor.cargo
      }
    };
  }

  // 4. UPDATE con validación y mapeo de respuesta
  async update(id: number, updateDto: UpdateContenidoMultimediaDto, userId: number) {
    const contenido = await this.contenidoRepo.findOne({
      where: { id },
      relations: ['autor', 'autor.usuario'],
    });

    if (!contenido) throw new NotFoundException('Contenido no encontrado');

    if (contenido.autor.usuario_id !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este contenido.');
    }

    const contenidoEditado = this.contenidoRepo.merge(contenido, updateDto);
    const guardado = await this.contenidoRepo.save(contenidoEditado);

    return {
      ...guardado,
      autor: {
        nombre: guardado.autor.usuario.nombre,
        apellido: guardado.autor.usuario.apellido,
        area: guardado.autor.area,
        cargo: guardado.autor.cargo
      }
    };
  }

  // 5. REMOVE con validación de dueño o Admin
  async remove(id: number, userId: number, userRol: string) {
    const contenido = await this.contenidoRepo.findOne({
      where: { id },
      relations: ['autor', 'autor.usuario']
    });

    if (!contenido) throw new NotFoundException('Contenido no encontrado');

    const esDueño = contenido.autor.usuario_id === userId;
    const esAdmin = userRol === 'SuperAdmin';

    if (!esDueño && !esAdmin) {
      throw new ForbiddenException('No tienes permiso para borrar este contenido.');
    }

    await this.contenidoRepo.remove(contenido);
    return { message: `Contenido con ID ${id} eliminado correctamente por ID N°:${userId} del Staff` };
  }
}