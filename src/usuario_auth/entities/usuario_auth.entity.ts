import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuario_auth') // Vincula esta clase con tu tabla real
export class UsuarioAuth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255, select: false }) // select: false protege la contraseña de consultas accidentales
  contrasena_hash: string;

  @Column({
    type: 'enum',
    enum: ['Activo', 'Bloqueado', 'Pendiente'],
    default: 'Pendiente',
  })
  estado_cuenta: string;

  @Column({ type: 'datetime', nullable: true })
  ultimo_login: Date;

  @Column({ length: 255, nullable: true })
  token_recuperacion: string;

  @Column({ type: 'datetime', nullable: true })
  token_expiracion: Date;

  @Column({ type: 'tinyint', default: 0 })
  dos_factores_activado: number;

  @Column({ length: 255, nullable: true })
  dos_factores_secret: string;

  @Column({ length: 45, nullable: true })
  ultima_ip: string;

  @Column({ length: 255, nullable: true })
  navegador_dispositivo: string;

  @Column({ type: 'datetime', nullable: true })
  eliminado_en: Date; // Tu Baja Lógica
 
}