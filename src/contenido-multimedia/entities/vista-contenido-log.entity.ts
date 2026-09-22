import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContenidoMultimedia } from './contenido-multimedia.entity';

@Entity('vista_contenido_log')
export class VistaContenidoLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'datetime' })
  fecha_vista: Date;

  @ManyToOne(() => ContenidoMultimedia, (contenido) => contenido.vistasLog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contenido_id' })
  contenido: ContenidoMultimedia;
}