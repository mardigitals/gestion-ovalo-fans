import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, DeleteDateColumn } from 'typeorm';

@Entity('perfil_fan')
export class PerfilFan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuario_id: number;

  @Column({ type: 'varchar', length: 20 })
  alias: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string | null;

  @Column({ type: 'tinyint', default: 0})
  es_socio_club: boolean;

  @Column({ type: 'varchar', length: 150, nullable: true })
  bio?: string | null;

  @Column({ type: 'enum', enum: ['Ford', 'Chevrolet', 'Torino', 'Dodge', 'Toyota','Mercedes', 'Bmw'], nullable: true})
  hincha_marca_tc?: string | null;

  @Column({ type: 'enum', enum: ['1 de adentro','1 de afuera','2 de adentro','2 de afuera','3'], nullable: true })
  chicana_favorita?: string | null;

  @DeleteDateColumn({ name: 'eliminado_en', type: 'datetime', nullable: true })
  eliminado_en: Date;

  // La relación 1:1 con la tabla de seguridad
  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}