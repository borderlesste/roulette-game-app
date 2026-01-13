/**
 * Servicio de traducción para mensajes del servidor
 * Proporciona traducciones en Español y Portugués de Brasil
 */

type Language = 'es' | 'pt-BR';

interface TranslationDict {
  [key: string]: string;
}

interface Translations {
  es: TranslationDict;
  'pt-BR': TranslationDict;
}

const translations: Translations = {
  es: {
    // Errores de validación
    'error.user_not_found': 'Usuario no encontrado',
    'error.insufficient_balance': 'Saldo insuficiente',
    'error.invalid_cpf': 'CPF inválido',
    'error.invalid_cnpj': 'CNPJ inválido',
    'error.invalid_phone': 'Teléfono inválido',
    'error.invalid_pix_key': 'Clave PIX inválida',
    'error.profile_incomplete': 'Debes completar tu perfil con CPF/CNPJ antes de hacer depósitos',
    'error.already_in_game': 'Ya estás en juego o en espera',
    'error.withdrawal_failed': 'El retiro falló',
    'error.transfer_error': 'Error en la transferencia',
    'error.transfer_cancelled': 'Transferencia cancelada',

    // Mensajes de éxito
    'success.profile_updated': 'Perfil actualizado correctamente',
    'success.pix_key_updated': 'Clave PIX actualizada correctamente',
    'success.deposit_requested': 'Depósito solicitado exitosamente',
    'success.withdrawal_requested': 'Retiro solicitado exitosamente',
    'success.joined_queue': 'Unido a la cola. Entrada: R$ {{amount}}',

    // Notificaciones de email
    'email.deposit_received_subject': 'Depósito de R$ {{amount}} Recibido',
    'email.deposit_received_title': 'Depósito Recibido',
    'email.deposit_received_body': 'Tu depósito de R$ {{amount}} ha sido acreditado exitosamente a tu cuenta.',
    'email.new_balance': 'Nuevo Saldo: R$ {{balance}}',

    'email.withdrawal_processed_subject': 'Retiro de R$ {{amount}} Procesado',
    'email.withdrawal_processed_title': 'Retiro Procesado',
    'email.withdrawal_processed_body': 'Tu retiro de R$ {{amount}} ha sido procesado. Recibirás los fondos en tu cuenta PIX en 1-2 minutos.',
    'email.pix_key': 'Clave PIX: {{pixKey}}',
    'email.estimated_time': 'Tiempo estimado: 1-2 minutos',

    'email.withdrawal_failed_subject': 'Retiro de R$ {{amount}} Fallido',
    'email.withdrawal_failed_title': 'Retiro Fallido',
    'email.withdrawal_failed_body': 'Tu retiro de R$ {{amount}} ha fallido: {{reason}}. El monto ha sido reembolsado a tu cuenta.',
    'email.action_taken': 'Acción tomada: El monto ha sido reembolsado a tu cuenta.',

    'email.payment_reminder_subject': 'Recordatorio: Pago de R$ {{amount}} Vence en {{days}} día(s)',
    'email.payment_reminder_title': 'Recordatorio de Pago',
    'email.payment_reminder_body': 'Tu pago de R$ {{amount}} vence en {{days}} día(s). Por favor, completa el pago para continuar jugando.',
  },

  'pt-BR': {
    // Erros de validação
    'error.user_not_found': 'Usuário não encontrado',
    'error.insufficient_balance': 'Saldo insuficiente',
    'error.invalid_cpf': 'CPF inválido',
    'error.invalid_cnpj': 'CNPJ inválido',
    'error.invalid_phone': 'Telefone inválido',
    'error.invalid_pix_key': 'Chave PIX inválida',
    'error.profile_incomplete': 'Você deve completar seu perfil com CPF/CNPJ antes de fazer depósitos',
    'error.already_in_game': 'Você já está em jogo ou aguardando',
    'error.withdrawal_failed': 'O saque falhou',
    'error.transfer_error': 'Erro na transferência',
    'error.transfer_cancelled': 'Transferência cancelada',

    // Mensagens de sucesso
    'success.profile_updated': 'Perfil atualizado com sucesso',
    'success.pix_key_updated': 'Chave PIX atualizada com sucesso',
    'success.deposit_requested': 'Depósito solicitado com sucesso',
    'success.withdrawal_requested': 'Saque solicitado com sucesso',
    'success.joined_queue': 'Entrou na fila. Entrada: R$ {{amount}}',

    // Notificações de email
    'email.deposit_received_subject': 'Depósito de R$ {{amount}} Recebido',
    'email.deposit_received_title': 'Depósito Recebido',
    'email.deposit_received_body': 'Seu depósito de R$ {{amount}} foi creditado com sucesso em sua conta.',
    'email.new_balance': 'Novo Saldo: R$ {{balance}}',

    'email.withdrawal_processed_subject': 'Saque de R$ {{amount}} Processado',
    'email.withdrawal_processed_title': 'Saque Processado',
    'email.withdrawal_processed_body': 'Seu saque de R$ {{amount}} foi processado. Você receberá os fundos em sua conta PIX em 1-2 minutos.',
    'email.pix_key': 'Chave PIX: {{pixKey}}',
    'email.estimated_time': 'Tempo estimado: 1-2 minutos',

    'email.withdrawal_failed_subject': 'Saque de R$ {{amount}} Falhou',
    'email.withdrawal_failed_title': 'Saque Falhou',
    'email.withdrawal_failed_body': 'Seu saque de R$ {{amount}} falhou: {{reason}}. O valor foi reembolsado em sua conta.',
    'email.action_taken': 'Ação tomada: O valor foi reembolsado em sua conta.',

    'email.payment_reminder_subject': 'Lembrete: Pagamento de R$ {{amount}} Vence em {{days}} dia(s)',
    'email.payment_reminder_title': 'Lembrete de Pagamento',
    'email.payment_reminder_body': 'Seu pagamento de R$ {{amount}} vence em {{days}} dia(s). Por favor, complete o pagamento para continuar jogando.',
  },
};

/**
 * Obtiene una traducción con interpolación de variables
 */
export function getTranslation(
  key: string,
  language: Language = 'es',
  variables?: Record<string, string | number>
): string {
  let translation = translations[language][key] || translations['es'][key] || key;

  // Interpolar variables
  if (variables) {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      translation = translation.replace(`{{${varKey}}}`, String(varValue));
    });
  }

  return translation;
}

/**
 * Obtiene todas las traducciones para un idioma
 */
export function getTranslations(language: Language = 'es'): TranslationDict {
  return translations[language] || translations['es'];
}

/**
 * Obtiene la traducción de un error
 */
export function getErrorTranslation(
  errorKey: string,
  language: Language = 'es',
  variables?: Record<string, string | number>
): string {
  const key = `error.${errorKey}`;
  return getTranslation(key, language, variables);
}

/**
 * Obtiene la traducción de un mensaje de éxito
 */
export function getSuccessTranslation(
  successKey: string,
  language: Language = 'es',
  variables?: Record<string, string | number>
): string {
  const key = `success.${successKey}`;
  return getTranslation(key, language, variables);
}

/**
 * Obtiene la traducción de un correo electrónico
 */
export function getEmailTranslation(
  emailKey: string,
  language: Language = 'es',
  variables?: Record<string, string | number>
): string {
  const key = `email.${emailKey}`;
  return getTranslation(key, language, variables);
}
