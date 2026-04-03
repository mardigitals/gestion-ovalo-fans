import { UsoBeneficio } from 'src/uso-beneficio/entities/uso-beneficio.entity';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity('evento')
export class Evento {
  
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  titulo: string;

  @Column({ type: 'datetime'})
  fecha_evento: Date;

  @Column({ type: 'enum', enum: ['Carrera', 'Recital', 'Pruebas','Otros'] })
  tipo_evento: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column ({type: 'enum', enum: ['TC', 'TURISMO PISTA', 'TC PICK UP', 'TC MOURAS', 'TC 2000', 'TURISMO NACIONAL', 'CARSHOW SANTAFESINO', 'TZ SANTAFESINO','CORDOBA PISTA', 'KARTING', 'PICADAS', 'Otros'], default: 'Otros', nullable: true})
  categoria_carrera: string;

  // Relación inversa: Un perfil puede tener  muchos contenidos
  @OneToMany(() => UsoBeneficio, (usoBeneficio) => usoBeneficio.evento)
  usoBeneficios: UsoBeneficio[];

}
