import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AutoEncrypter, Repository } from 'typeorm';
import { ContenidoMultimedia } from './entities/contenido-multimedia.entity';
import { PerfilStaff } from '../perfil-staff/entities/perfil-staff.entity';
import { CreateContenidoMultimediaDto } from './dto/create-contenido-multimedia.dto';
import { UpdateContenidoMultimediaDto } from './dto/update-contenido-multimedia.dto';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class ContenidoMultimediaService {
  constructor(
    @InjectRepository(ContenidoMultimedia)
    private readonly contenidoRepo: Repository<ContenidoMultimedia>,

    @InjectRepository(PerfilStaff)
    private readonly staffRepo: Repository<PerfilStaff>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // 1. CREATE 
  async create(createDto: CreateContenidoMultimediaDto, userId: number, file?: Express.Multer.File) {
    const staff = await this.staffRepo.findOne({ 
      where: { usuario_id: userId },
      relations: ['usuario', 'rolStaff'] 
    });
    
    if (!staff) {
      throw new UnauthorizedException('No tienes un perfil de staff para publicar contenido.');
    }

    // (Defensa en profundidad)
    const rolesPermitidos = ['Prensa', 'SuperAdmin'];
    if (!rolesPermitidos.includes(staff.rolStaff.nombre_rol)) {
      throw new ForbiddenException(`Tu rol (${staff.rolStaff.nombre_rol}) no tiene permisos para publicar contenido.`);
    }

    // LÓGICA DE CLOUDINARY
    let urlDefinitiva = createDto.url_recurso;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      urlDefinitiva = uploadResult.secure_url; // Guardamos el link oficial de Cloudinary
    }

    const nuevo = this.contenidoRepo.create({
      ...createDto,
      url_recurso: urlDefinitiva, // Sobrescribimos con la URL real
      autor: staff 
    });

    const guardado = await this.contenidoRepo.save(nuevo);

    // TU MAPEO  DE RESPUESTA
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
  async findAll(pagina: number = 1, limite: number = 10) {
    const saltar = (pagina - 1) * limite; // Cuántos registros me salteo

    const resultados = await this.contenidoRepo.find({
      relations: ['autor', 'autor.usuario'],
      order: { 
        es_destacado: 'DESC',      
        fecha_publicacion: 'DESC'  
      },
      take: limite, // Traigo máximo 10
      skip: saltar  // Salteando los anteriores
    });

    return resultados.map(item => ({
      ...item,
      autor: {
       nombre: item.autor?.usuario?.nombre || 'Desconocido',
        apellido: item.autor?.usuario?.apellido || 'Desconocido',
        area: item.autor?.area || 'Desconocido',
        cargo: item.autor?.cargo || 'Desconocido'
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
        nombre: contenido.autor?.usuario?.nombre || 'Desconocido',
        apellido: contenido.autor?.usuario?.apellido || 'Desconocido',
        area: contenido.autor?.area || 'Desconocido',
        cargo: contenido.autor?.cargo || 'Desconocido'
      }
    };
  }

  // 4. UPDATE 
  async update(id: number, updateDto: UpdateContenidoMultimediaDto, userId: number, file?: Express.Multer.File) {
    const contenido = await this.contenidoRepo.findOne({
      where: { id },
      relations: ['autor', 'autor.usuario'],
    });

    if (!contenido) throw new NotFoundException('Contenido no encontrado');

    // Validación de permisos (dueño o SuperAdmin)
    // Asumimos que averiguás si es SuperAdmin de antemano o lo traés del token, 
    // pero dejamos tu validación de dueño intacta por ahora:
    if (contenido.autor.usuario_id !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este contenido.');
    }

    // Subida a Cloudinary si mandan una foto NUEVA al editar
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      updateDto.url_recurso = uploadResult.secure_url;
    }

    const contenidoEditado = this.contenidoRepo.merge(contenido, updateDto);
    const guardado = await this.contenidoRepo.save(contenidoEditado);

   return {
      ...guardado,
      autor: {
        nombre: guardado.autor?.usuario?.nombre || 'Desconocido',
        apellido: guardado.autor?.usuario?.apellido || 'Desconocido',
        area: guardado.autor?.area || 'Desconocido',
        cargo: guardado.autor?.cargo || 'Desconocido'
      } }; 
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