/**
 * Funksionet e validimit për format dhe inputet
 */

// Validimi i email-it
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

// Validimi i fjalëkalimit (min 6 karaktere)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Validimi i fjalëkalimit (me forcë)
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'medium';
  return 'strong';
};

// Validimi i numrit të telefonit (Kosovë)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+383|0)(4[0-9]|4[4-9])[0-9]{6}$/;
  return phoneRegex.test(phone);
};

// Validimi i kodit postar
export const isValidPostalCode = (postalCode: string): boolean => {
  const postalRegex = /^\d{5}$/;
  return postalRegex.test(postalCode);
};

// Validimi i URL-së
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validimi i datës
export const isValidDate = (date: string): boolean => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

// Validimi që data nuk është në të kaluarën
export const isFutureDate = (date: string): boolean => {
  const d = new Date(date);
  return d > new Date();
};

// Validimi i numrit (pozitiv)
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

// Validimi i numrit (jo negativ)
export const isNonNegativeNumber = (value: number): boolean => {
  return value >= 0;
};

// Validimi i fushës së zbrazët
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

// Validimi i gjatësisë minimale
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

// Validimi i gjatësisë maksimale
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

// Objekti i gabimeve për formularët
export interface ValidationErrors {
  [key: string]: string;
}

// Validimi i regjistrimit
export const validateRegistration = (data: {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!isNotEmpty(data.name)) {
    errors.name = 'Emri është i detyrueshëm';
  } else if (!hasMinLength(data.name, 2)) {
    errors.name = 'Emri duhet të ketë të paktën 2 karaktere';
  }

  if (!isNotEmpty(data.email)) {
    errors.email = 'Email-i është i detyrueshëm';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Email-i nuk është i vlefshëm';
  }

  if (!isNotEmpty(data.password)) {
    errors.password = 'Fjalëkalimi është i detyrueshëm';
  } else if (!isValidPassword(data.password)) {
    errors.password = 'Fjalëkalimi duhet të ketë të paktën 6 karaktere';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Fjalëkalimet nuk përputhen';
  }

  return errors;
};

// Validimi i login-it
export const validateLogin = (data: {
  email: string;
  password: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!isNotEmpty(data.email)) {
    errors.email = 'Email-i është i detyrueshëm';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Email-i nuk është i vlefshëm';
  }

  if (!isNotEmpty(data.password)) {
    errors.password = 'Fjalëkalimi është i detyrueshëm';
  }

  return errors;
};

// Validimi i dërgesës
export const validateShipment = (data: {
  pickupAddress: string;
  deliveryAddress: string;
  weightKg?: number;
  volumeM3?: number;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!isNotEmpty(data.pickupAddress)) {
    errors.pickupAddress = 'Adresa e marrjes është e detyrueshme';
  }

  if (!isNotEmpty(data.deliveryAddress)) {
    errors.deliveryAddress = 'Adresa e dorëzimit është e detyrueshme';
  }

  if (data.weightKg !== undefined && !isPositiveNumber(data.weightKg)) {
    errors.weightKg = 'Pesha duhet të jetë një numër pozitiv';
  }

  if (data.volumeM3 !== undefined && !isPositiveNumber(data.volumeM3)) {
    errors.volumeM3 = 'Vëllimi duhet të jetë një numër pozitiv';
  }

  return errors;
};

// Validimi i organizatës
export const validateOrganization = (data: {
  name: string;
  email: string;
  phone?: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!isNotEmpty(data.name)) {
    errors.name = 'Emri i organizatës është i detyrueshëm';
  }

  if (!isNotEmpty(data.email)) {
    errors.email = 'Email-i është i detyrueshëm';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Email-i nuk është i vlefshëm';
  }

  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.phone = 'Numri i telefonit nuk është i vlefshëm';
  }

  return errors;
};

// Validimi i shoferit
export const validateDriver = (data: {
  licenseNumber: string;
  phone: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!isNotEmpty(data.licenseNumber)) {
    errors.licenseNumber = 'Numri i licencës është i detyrueshëm';
  }

  if (!isNotEmpty(data.phone)) {
    errors.phone = 'Numri i telefonit është i detyrueshëm';
  } else if (!isValidPhoneNumber(data.phone)) {
    errors.phone = 'Numri i telefonit nuk është i vlefshëm';
  }

  return errors;
};