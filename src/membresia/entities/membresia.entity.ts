import { ContenidoMultimedia } from "src/contenido-multimedia/entities/contenido-multimedia.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from "typeorm";
import { Suscripcion } from "src/suscripcion/entities/suscripcion.entity";

@Entity('membresia') 
export class Membresia {
    
    @PrimaryGeneratedColumn()
    id: number; 

    @Column({ type: 'varchar', length: 30 })
    nombre: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio_mensual: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio_anual: number;

    @Column({ type: 'text', nullable: true })
    descripcion_beneficios: string;
  
    @DeleteDateColumn({ name: 'eliminado_en', type: 'datetime', nullable: true })
    eliminado_en: Date;

    // Relación inversa: Una membresia puede tener muchos contenidos asociados
    @OneToMany(() => ContenidoMultimedia, (contenido) => contenido.nivel_acceso_requerido)
    contenidos: ContenidoMultimedia[];

    // Una membresia puede tener muchas suscripciones
    @OneToMany(() => Suscripcion, (suscripcion) => suscripcion.membresia)
    suscripciones: Suscripcion[];
    
}