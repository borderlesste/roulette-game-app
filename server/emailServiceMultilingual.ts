import { Resend } from 'resend';
import { ENV } from './_core/env';
import { getEmailTranslation } from './translationService';

type Language = 'es' | 'pt-BR';

// Email service - resendApiKey es opcional
const resend = ENV.resendApiKey ? new Resend(ENV.resendApiKey) : null;
const FROM_EMAIL = 'noreply@roulettegame.com';

/**
 * Plantilla HTML de depósito recibido (multiidioma)
 */
function getDepositEmailTemplate(userName: string, amount: number, newBalance: number, language: Language): string {
  const title = getEmailTranslation('deposit_received_title', language);
  const body = getEmailTranslation('deposit_received_body', language, { amount });
  const balanceLabel = getEmailTranslation('new_balance', language, { balance: newBalance });

  const colors = {
    es: { primary: '#667eea', secondary: '#764ba2', accent: '#28a745' },
    'pt-BR': { primary: '#667eea', secondary: '#764ba2', accent: '#28a745' },
  };

  const color = colors[language];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 32px; font-weight: bold; color: ${color.accent}; margin: 20px 0; }
          .balance { background: #e8f4f8; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 ${title}</h1>
          </div>
          <div class="content">
            <p>${language === 'pt-BR' ? 'Olá' : 'Hola'} <strong>${userName}</strong>,</p>
            <p>${body}</p>
            <div class="amount">R$ ${amount.toFixed(2)}</div>
            <div class="balance">
              <strong>${balanceLabel}</strong>
            </div>
            <p>${language === 'pt-BR' ? 'Você já pode começar a jogar em nosso jogo de roleta. Boa sorte!' : 'Ya puedes comenzar a jugar en nuestro juego de ruleta. ¡Buena suerte!'}</p>
            <div class="footer">
              <p>${language === 'pt-BR' ? 'Se você não fez este depósito, por favor entre em contato com nosso time de suporte.' : 'Si no realizaste este depósito, por favor contacta a nuestro equipo de soporte.'}</p>
              <p>&copy; 2024 Roulette Game. ${language === 'pt-BR' ? 'Todos os direitos reservados.' : 'Todos los derechos reservados.'}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Plantilla HTML de retiro procesado (multiidioma)
 */
function getWithdrawalEmailTemplate(userName: string, amount: number, pixKey: string, language: Language): string {
  const title = getEmailTranslation('withdrawal_processed_title', language);
  const body = getEmailTranslation('withdrawal_processed_body', language, { amount });
  const pixKeyLabel = getEmailTranslation('pix_key', language, { pixKey });
  const timeLabel = getEmailTranslation('estimated_time', language);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 32px; font-weight: bold; color: #0066cc; margin: 20px 0; }
          .info-box { background: #e8f4f8; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏦 ${title}</h1>
          </div>
          <div class="content">
            <p>${language === 'pt-BR' ? 'Olá' : 'Hola'} <strong>${userName}</strong>,</p>
            <p>${body}</p>
            <div class="amount">R$ ${amount.toFixed(2)}</div>
            <div class="info-box">
              <strong>${pixKeyLabel}</strong><br>
              <strong>${timeLabel}</strong><br>
              <strong>${language === 'pt-BR' ? 'Status: Em processamento' : 'Estado: En proceso'}</strong>
            </div>
            <p>${language === 'pt-BR' ? 'Os fundos serão transferidos para sua conta PIX nos próximos 1-2 minutos. Se você não receber o dinheiro após 15 minutos, por favor entre em contato com nosso time de suporte.' : 'Los fondos serán transferidos a tu cuenta PIX en los próximos 1-2 minutos. Si no recibes el dinero después de 15 minutos, por favor contacta a nuestro equipo de soporte.'}</p>
            <div class="footer">
              <p>&copy; 2024 Roulette Game. ${language === 'pt-BR' ? 'Todos os direitos reservados.' : 'Todos los derechos reservados.'}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Plantilla HTML de retiro fallido (multiidioma)
 */
function getWithdrawalFailedEmailTemplate(userName: string, amount: number, reason: string, language: Language): string {
  const title = getEmailTranslation('withdrawal_failed_title', language);
  const body = getEmailTranslation('withdrawal_failed_body', language, { amount, reason });
  const actionLabel = getEmailTranslation('action_taken', language);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 32px; font-weight: bold; color: #dc3545; margin: 20px 0; }
          .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ ${title}</h1>
          </div>
          <div class="content">
            <p>${language === 'pt-BR' ? 'Olá' : 'Hola'} <strong>${userName}</strong>,</p>
            <p>${body}</p>
            <div class="amount">R$ ${amount.toFixed(2)}</div>
            <div class="warning-box">
              <strong>${actionLabel}</strong>
            </div>
            <p>${language === 'pt-BR' ? 'Por favor, verifique sua chave PIX e tente novamente. Se o problema persistir, entre em contato com nosso time de suporte.' : 'Por favor, verifica tu clave PIX e intenta nuevamente. Si el problema persiste, contacta a nuestro equipo de soporte.'}</p>
            <div class="footer">
              <p>&copy; 2024 Roulette Game. ${language === 'pt-BR' ? 'Todos os direitos reservados.' : 'Todos los derechos reservados.'}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Envía un correo de depósito recibido (multiidioma)
 */
export async function sendDepositEmail(
  email: string,
  userName: string,
  amount: number,
  newBalance: number,
  language: Language = 'es'
): Promise<void> {
  try {
    if (!ENV.resendApiKey || !resend) {
      console.warn('[Email] resendApiKey no configurada, saltando envío de email');
      return;
    }

    const subject = getEmailTranslation('deposit_received_subject', language, { amount });
    const html = getDepositEmailTemplate(userName, amount, newBalance, language);

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    console.log(`[Email] Correo de depósito enviado a ${email} en ${language}`);
  } catch (error) {
    console.error('[Email] Error enviando correo de depósito:', error);
    throw error;
  }
}

/**
 * Envía un correo de retiro procesado (multiidioma)
 */
export async function sendWithdrawalEmail(
  email: string,
  userName: string,
  amount: number,
  pixKey: string,
  language: Language = 'es'
): Promise<void> {
  try {
    if (!ENV.resendApiKey || !resend) {
      console.warn('[Email] resendApiKey no configurada, saltando envío de email');
      return;
    }

    const subject = getEmailTranslation('withdrawal_processed_subject', language, { amount });
    const html = getWithdrawalEmailTemplate(userName, amount, pixKey, language);

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    console.log(`[Email] Correo de retiro enviado a ${email} en ${language}`);
  } catch (error) {
    console.error('[Email] Error enviando correo de retiro:', error);
    throw error;
  }
}

/**
 * Envía un correo de retiro fallido (multiidioma)
 */
export async function sendWithdrawalFailedEmail(
  email: string,
  userName: string,
  amount: number,
  reason: string,
  language: Language = 'es'
): Promise<void> {
  try {
    if (!ENV.resendApiKey || !resend) {
      console.warn('[Email] resendApiKey no configurada, saltando envío de email');
      return;
    }

    const subject = getEmailTranslation('withdrawal_failed_subject', language, { amount });
    const html = getWithdrawalFailedEmailTemplate(userName, amount, reason, language);

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    console.log(`[Email] Correo de retiro fallido enviado a ${email} en ${language}`);
  } catch (error) {
    console.error('[Email] Error enviando correo de retiro fallido:', error);
    throw error;
  }
}
