import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, OneToOne } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

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
  ultimo_login?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Agregamos type: 'varchar'
  token_recuperacion?: string | null;

  @Column({ type: 'datetime', nullable: true }) // Este ya tiene type, está bien
  token_expiracion?: Date | null;

  @Column({ type: 'tinyint', default: 0 })
  dos_factores_activado: number;

  @Column({ length: 255, nullable: true })
  dos_factores_secret: string;

  @Column({ length: 45, nullable: true })
  ultima_ip: string;

  @Column({ length: 255, nullable: true })
  navegador_dispositivo: string;

  @DeleteDateColumn({ name: 'eliminado_en', type: 'datetime', nullable: true })
  eliminado_en: Date; 

  @OneToOne(() => Usuario, (usuario) => usuario.auth, {
    cascade: ['soft-remove', 'recover']
  })
  usuario: Usuario;
 
}