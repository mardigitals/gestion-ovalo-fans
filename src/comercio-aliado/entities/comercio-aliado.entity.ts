import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('comercio_aliado_santafe') 
export class ComercioAliado {
  
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre_comercio: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  cuit: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rubro: string;

  @Column({ type: 'int' , nullable:true, default: 10}) 
  descuento_porcentaje: number;

  @Column({ 
    type: 'enum', 
    enum: ['SOLO_EFECTIVO', 'CON_TARJETA', 'CON_TRANSFERENCIA', 'EFECTIVO_TRANSFERENCIA', 'TODOS'] 
  })
  condicion_pago: string;

  @Column({ type: 'varchar', length: 150 })
  calle: string;

  @Column({ type: 'varchar', length: 10 })
  numero: string;

  @Column({ type: 'varchar', length: 50, default: 'Rafaela' })
  ciudad: string;

  @Column({ type: 'varchar', length: 10 })
  cp: string;
}