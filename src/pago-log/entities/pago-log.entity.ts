import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';

@Entity('pago_log')
export class PagoLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'suscripcion_id' })
  suscripcion_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  metodo_pago: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  id_transaccion_mp: string;

  @CreateDateColumn()
  fecha_pago: Date;

  // --- RELACIONES ---
  @ManyToOne(() => Suscripcion)
  @JoinColumn({ name: 'suscripcion_id' })
  suscripcion: Suscripcion;
}