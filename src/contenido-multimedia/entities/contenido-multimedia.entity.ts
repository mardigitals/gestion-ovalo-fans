import { PerfilStaff } from "src/perfil-staff/entities/perfil-staff.entity";
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('contenido_multimedia')
export class ContenidoMultimedia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  titulo: string;

  @Column({ type: 'enum', enum: ['noticia', 'video', 'imagen'] }) 
  tipo: string;

  @Column({ length: 255 })
  url_recurso: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  carpeta: string;

  @Column({ type: 'int', nullable: true })
  nivel_acceso_requerido: number | null;

  @CreateDateColumn()
  fecha_publicacion: Date;

  @Column({ type: 'int', default: 0 })
  vistas: number;

  @Column({ type: 'boolean', default: false })
  es_destacado: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion_breve: string;

  @Column({ type: 'longtext', nullable: true })
  cuerpo: string;

  // Relación con PerfilStaff 
  @ManyToOne(() => PerfilStaff, (staff) => staff.contenidos)
  @JoinColumn({ name: 'autor_staff_id' })
  autor: PerfilStaff;
}