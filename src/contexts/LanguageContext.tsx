import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Language = 'en' | 'de';

type Translations = {
  [key: string]: {
    en: string;
    de: string;
  };
};

// Add all your translations here
const translations: Translations = {
  // General UI
  chat: { en: 'Chat', de: 'Chat' },
  conversations: { en: 'Conversations', de: 'Konversationen' },
  documents: { en: 'Documents', de: 'Dokumente' },
  activeSources: { en: 'Active Sources', de: 'Aktive Quellen' },
  settings: { en: 'Settings', de: 'Einstellungen' },
  save: { en: 'Save', de: 'Speichern' },
  cancel: { en: 'Cancel', de: 'Abbrechen' },
  delete: { en: 'Delete', de: 'Löschen' },
  edit: { en: 'Edit', de: 'Bearbeiten' },
  close: { en: 'Close', de: 'Schließen' },
  
  // Chat Interface
  send: { en: 'Send', de: 'Senden' },
  typeMessage: { en: 'Type a message...', de: 'Nachricht eingeben...' },
  newChat: { en: 'New Chat', de: 'Neuer Chat' },
  clearChat: { en: 'Clear Chat', de: 'Chat leeren' },
  uploadFile: { en: 'Upload file', de: 'Datei hochladen' },
  messagePlaceholder: { en: 'Type a message...', de: 'Nachricht eingeben...' },
  welcomeTitle: { en: 'Welcome to NOSTA AI', de: 'Willkommen bei NOSTA AI' },
  welcomeSubtitle: { en: 'Start a conversation by asking questions about your documents.', de: 'Starten Sie eine Konversation, indem Sie Fragen zu Ihren Dokumenten stellen.' },
  fileUploadOnlyLegal: { en: 'File upload is only available for Legal agent', de: 'Datei-Upload ist nur für den Rechtsberater verfügbar' },
  fileUploaded: { en: 'Uploaded file', de: 'Hochgeladene Datei' },
  fileProcessed: { en: 'File processed successfully', de: 'Datei erfolgreich verarbeitet' },
  fileUploadFailed: { en: 'Failed to process file', de: 'Verarbeitung der Datei fehlgeschlagen' },
  error: { en: 'Error', de: 'Fehler' },
  unknownError: { en: 'Unknown error', de: 'Unbekannter Fehler' },
  
  // Feedback
  feedback: { en: 'Feedback', de: 'Rückmeldung' },
  reportIssue: { en: 'Report an issue', de: 'Problem melden' },
  imageBroken: { en: 'Image broken', de: 'Bild kaputt' },
  inaccurateInfo: { en: 'Inaccurate information', de: 'Ungenaue Informationen' },
  irrelevant: { en: 'Irrelevant', de: 'Irrelevant' },
  brokenLink: { en: 'Broken link', de: 'Defekter Link' },
  documentLinkBroken: { en: 'Document link broken', de: 'Dokumentenlink defekt' },
  other: { en: 'Other', de: 'Andere' },
  submit: { en: 'Submit', de: 'Absenden' },
  feedbackThankYou: { en: 'Thank you for your feedback!', de: 'Vielen Dank für Ihr Feedback!' },
  feedbackImageBroken: { en: 'Thank you for reporting the broken image!', de: 'Vielen Dank für die Meldung des defekten Bildes!' },
  feedbackInaccurate: { en: 'Thank you for your feedback. We\'ll review the information.', de: 'Vielen Dank für Ihr Feedback. Wir werden die Informationen überprüfen.' },
  feedbackIrrelevant: { en: 'We appreciate your feedback and will use it to improve our responses.', de: 'Wir schätzen Ihr Feedback und werden es nutzen, um unsere Antworten zu verbessern.' },
  feedbackLinkBroken: { en: 'Thank you for reporting the broken document link!', de: 'Vielen Dank für die Meldung des defekten Dokumentenlinks!' },
  
  // Document related
  noDocuments: { en: 'No documents uploaded', de: 'Keine Dokumente hochgeladen' },
  uploadDocument: { en: 'Upload Document', de: 'Dokument hochladen' },
  documentUploaded: { en: 'Document uploaded successfully', de: 'Dokument erfolgreich hochgeladen' },
  availableDocuments: { en: 'Available Documents', de: 'Verfügbare Dokumente' },
  openDataSourceManagement: { en: 'Open Data Source Management', de: 'Datenquellenverwaltung öffnen' },
  addToActiveSources: { en: 'Add to active sources', de: 'Zu aktiven Quellen hinzufügen' },
  remove: { en: 'Remove', de: 'Entfernen' },
  
  // Webhook settings
  webhookUrl: { en: 'Webhook URL', de: 'Webhook-URL' },
  webhookHelp: { 
    en: 'Enter a webhook URL to receive chat events', 
    de: 'Geben Sie eine Webhook-URL ein, um Chat-Ereignisse zu erhalten' 
  },
  
  // Error messages
  errorOccurred: { en: 'An error occurred', de: 'Ein Fehler ist aufgetreten' },
  tryAgain: { en: 'Please try again', de: 'Bitte versuchen Sie es erneut' },
  
  // Success messages
  success: { en: 'Success', de: 'Erfolg' },
  changesSaved: { en: 'Changes saved', de: 'Änderungen gespeichert' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = 'en',
}) => {
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || defaultLanguage
  );

  const t = useCallback(
    (key: string) => {
      const translation = translations[key as keyof typeof translations];
      return (translation ? translation[language] : key) as string;
    },
    [language]
  );

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
