import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
 import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
// import { Evento } from '../evento/entities/evento.entity'; 
// import { Comercio } from '../comercio/entities/comercio.entity'; 

@Entity('uso_beneficio')
export class UsoBeneficio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  suscripcion_id: number;

  @Column({ length: 100 })
  tipo_beneficio: string; // Ej: 'VIP_BOXES', 'PRUEBAS_LIBRES'

  @Column({ type: 'enum', enum: ['Automático','Solicitado','Instantáneo QR'] })
  categoria_beneficio: string;

  @Column({ type: 'enum', enum: ['Pendiente','Aprobado','Rechazado','Completado'], default: 'Pendiente' })
  estado: string;

  @CreateDateColumn()
  fecha_solicitud: Date;

  @Column({ type: 'datetime', nullable: true })
  fecha_uso: Date;

  @Column({ length: 150, nullable: true })
  contacto_coordinador: string; // WhatsApp o Mail del staff que gestiona

  @Column({ type: 'text', nullable: true })
  notas_staff: string;

  @Column({ nullable: true })
  comercio_id: number;

  @Column({ nullable: true })
  evento_id: number;

  // RELACIONES
  @ManyToOne(() => Suscripcion)
  @JoinColumn({ name: 'suscripcion_id' })
  suscripcion: Suscripcion;


//   @ManyToOne(() => Evento, (evento) => evento.usosBeneficios)
//   @JoinColumn({ name: 'evento_id' })
//   evento: Evento;

  // @ManyToOne(() => Comercio)
  // @JoinColumn({ name: 'comercio_id' })
  // comercio: Comercio;
}