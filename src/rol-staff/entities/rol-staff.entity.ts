import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PerfilStaff } from '../../perfil-staff/entities/perfil-staff.entity';

@Entity('rol_staff')
export class RolStaff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre_rol: string;

  // Relación inversa: Un rol puede pertenecer a muchos miembros del staff
  @OneToMany(() => PerfilStaff, (perfil) => perfil.rolStaff)
  perfiles: PerfilStaff[];

}