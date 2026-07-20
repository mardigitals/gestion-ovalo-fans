import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAdult', async: false })
export class IsAdultConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string | Date, args: ValidationArguments) {
    if (!propertyValue) return false;

    let dateOfBirth: Date;

    if (typeof propertyValue === 'string') {
      // 1. Limpiamos cualquier rastro de hora o zona horaria (T00:00...)
      const datePart = propertyValue.split('T')[0];

      if (datePart.includes('-')) {
        // Si llega en formato YYYY-MM-DD
        const [year, month, day] = datePart.split('-').map(Number);
        dateOfBirth = new Date(year, month - 1, day);
      } else if (datePart.includes('/')) {
        // Si llega en formato manual DD/MM/YYYY
        const [day, month, year] = datePart.split('/').map(Number);
        dateOfBirth = new Date(year, month - 1, day);
      } else {
        dateOfBirth = new Date(propertyValue);
      }
    } else {
      dateOfBirth = new Date(propertyValue);
    }

    // Verificamos que sea una fecha válida después del parseo manual
    if (isNaN(dateOfBirth.getTime())) return false;

    const today = new Date(); // Fecha local actual
    
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    // 2. La lógica matemática sigue igual, pero ahora los días comparados son 100% exactos
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age >= 18;
  }

  defaultMessage(args: ValidationArguments) {
    return 'El usuario debe ser mayor de 18 años para crear un perfil.';
  }
}

export function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAdultConstraint,
    });
  };
}