import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { UsuarioAuth } from '../../usuario_auth/entities/usuario_auth.entity';
import { PerfilStaff } from 'src/perfil-staff/entities/perfil-staff.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_auth_id' })
  usuario_auth_id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ length: 20, unique: true })
  dni: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  @Column({ type: 'enum', enum: ['M', 'F', 'Prefiero no decirlo'] })
  genero: string;

  @Column({ length: 50, default: 'Argentina' })
  nacionalidad: string;

  @Column({ length: 25 })
  telefono: string;

  // Domicilio completo
  @Column({ length: 150 })
  calle: string;

  @Column({ length: 10 })
  numero: string;

  @Column({ length: 10, nullable: true })
  piso: string;

  @Column({ length: 10, nullable: true })
  depto: string;

  @Column({ length: 10 })
  cp: string;

  @Column({ length: 100 })
  ciudad: string;

  @Column({ length: 100 })
  provincia: string;

  @Column({ length: 50, default: 'Argentina' })
  pais: string;

  @DeleteDateColumn({ name: 'eliminado_en', type: 'datetime', nullable: true })
  eliminado_en: Date;

  // La relación 1:1 con la tabla de seguridad
  @OneToOne(() => UsuarioAuth)
  @JoinColumn({ name: 'usuario_auth_id' })
  auth: UsuarioAuth;

  // Relación con PerfilStaff (si es staff)
  @OneToOne(() => PerfilStaff, (perfil) => perfil.usuario, { 
  cascade: ['soft-remove', 'recover'] 
  })
  perfilStaff: PerfilStaff;

}