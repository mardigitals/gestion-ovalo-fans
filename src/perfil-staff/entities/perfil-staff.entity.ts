import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, DeleteDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { RolStaff } from '../../rol-staff/entities/rol-staff.entity';
import { ContenidoMultimedia } from 'src/contenido-multimedia/entities/contenido-multimedia.entity';

@Entity('perfil_staff')
export class PerfilStaff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuario_id: number;

  @Column({ type: 'int'})
  rol_staff_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  area?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo?: string | null;

  @Column({ type: 'date' })
  fecha_ingreso: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  eliminado_en: Date;

  // La relación 1:1 con la tabla de seguridad
  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  // Relación Many-to-One con RolStaff
  @ManyToOne(() => RolStaff, (rolStaff) => rolStaff.perfiles)
  @JoinColumn({ name: 'rol_staff_id' })
  rolStaff: RolStaff;

  // Relación inversa: Un perfil puede tener  muchos contenidos
  @OneToMany(() => ContenidoMultimedia, (contenido) => contenido.autor)
  contenidos: ContenidoMultimedia[];

}

