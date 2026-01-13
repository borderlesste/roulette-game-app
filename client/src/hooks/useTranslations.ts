import { useTranslation } from 'react-i18next';

/**
 * Hook personalizado para usar traducciones con mejor tipado
 */
export function useTranslations() {
  const { t, i18n } = useTranslation();

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    isPortuguese: i18n.language.startsWith('pt'),
    isSpanish: i18n.language.startsWith('es'),
    changeLanguage: (lang: 'es' | 'pt-BR') => {
      i18n.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);
    },
  };
}
