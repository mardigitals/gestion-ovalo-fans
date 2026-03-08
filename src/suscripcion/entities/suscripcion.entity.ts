import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { PerfilFan } from 'src/perfil-fan/entities/perfil-fan.entity';
import { Membresia } from 'src/membresia/entities/membresia.entity';
import { PerfilStaff } from 'src/perfil-staff/entities/perfil-staff.entity';

@Entity('suscripcion')
export class Suscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'perfil_fan_id' })
  perfil_fan_id: number;

  @Column({ name: 'membresia_id' })
  membresia_id: number;

  @Column({ type: 'datetime' })
  fecha_inicio: Date;

  @Column({ type: 'datetime' })
  fecha_fin: Date;

  @Column({ type: 'enum', enum: ['Activo', 'Vencido', 'Cancelado', 'Pendiente'], default: 'Pendiente' })
  estado: string;

  @Column({ name: 'staff_id_control', nullable: true })
  staff_id_control: number;

  @DeleteDateColumn({ name: 'eliminado_en', nullable: true })
  eliminado_en: Date;

  // Relaciones
  @ManyToOne(() => PerfilFan)
  @JoinColumn({ name: 'perfil_fan_id' })
  perfilFan: PerfilFan;

  @ManyToOne(() => Membresia)
  @JoinColumn({ name: 'membresia_id' })
  membresia: Membresia;

  @ManyToOne(() => PerfilStaff)
  @JoinColumn({ name: 'staff_id_control' })
  staffControl: PerfilStaff;

  //relaciones a pago_log y uso_beneficio 
}