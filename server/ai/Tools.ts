import { Type, FunctionDeclaration } from "@google/genai";

export const saveLeadFunctionDeclaration: FunctionDeclaration = {
  name: "save_lead",
  description: "Speichert ein neues Anliegen / Lead-Ticket für das Team, sobald der Anrufer seinen Namen, Anliegen und Kontaktdaten genannt hat.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      callerName: { type: Type.STRING, description: "Name des Anrufers" },
      phoneNumber: { type: Type.STRING, description: "Telefonnummer des Anrufers" },
      category: { type: Type.STRING, description: "Kategorie des Anliegens: 'service', 'sales', 'support', 'booking', 'other'" },
      concern: { type: Type.STRING, description: "Genaue Beschreibung des Kundenanliegens" },
      urgency: { type: Type.STRING, description: "Dringlichkeit: 'high' (wenn es dringend ist, 'schnell' gehen muss oder Notfall), 'normal' (Standard), 'low'" },
      additionalInfo: { type: Type.STRING, description: "Zusätzliche Infos oder Details zum Kunden/Anliegen" },
      preferredCallbackTime: { type: Type.STRING, description: "Wunschzeit für Rückruf" }
    },
    required: ["callerName", "phoneNumber", "category", "concern", "urgency"]
  }
};

export const updateLeadFunctionDeclaration: FunctionDeclaration = {
  name: "update_lead",
  description: "Ergänzt das zuletzt erstellte Ticket dieses Anrufs um weitere Informationen, falls der Kunde noch ein weiteres Anliegen hat.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      additionalConcern: { type: Type.STRING, description: "Das weitere Anliegen oder die Ergänzungen des Kunden" }
    },
    required: ["additionalConcern"]
  }
};

export const checkAvailabilityFunctionDeclaration: FunctionDeclaration = {
  name: "check_availability",
  description: "Prüft, welche Termine an einem bestimmten Datum noch frei sind. Verwende dieses Tool, um die Verfügbarkeit abzufragen, BEVOR du dem Kunden einen konkreten Termin vorschlägst.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Das Datum im Format YYYY-MM-DD (z.B. '2023-11-20')" }
    },
    required: ["date"]
  }
};

export const bookAppointmentFunctionDeclaration: FunctionDeclaration = {
  name: "book_appointment",
  description: "Bucht verbindlich einen Termin für den Kunden im Kalender. Wenn eine spezifische Ressource (wie Fahrzeug oder Zimmer) gebucht wird, MUSS die resourceId mitgegeben werden.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      callerName: { type: Type.STRING, description: "Der vollständige Name des Anrufers." },
      title: { type: Type.STRING, description: "Kurzer Titel des Termins (z.B. 'Radwechsel')" },
      startTime: { type: Type.STRING, description: "Startzeitpunkt als ISO-String mit Zeitzonen-Offset (z.B. '2023-11-20T10:00:00+02:00')" },
      endTime: { type: Type.STRING, description: "Endzeitpunkt als ISO-String mit Zeitzonen-Offset (z.B. '2023-11-20T11:00:00+02:00')" },
      notes: { type: Type.STRING, description: "Optionale Details zum Termin" },
      resourceId: { type: Type.NUMBER, description: "Optional: Die ID der zu buchenden Ressource (aus check_available_resources), falls zutreffend." },
      resourceName: { type: Type.STRING, description: "Optional: Der genaue Name der zu buchenden Ressource (aus dem Chatverlauf), falls du die ID nicht parat hast." }
    },
    required: ["callerName", "title", "startTime", "endTime"]
  }
};

export const checkAvailableResourcesFunctionDeclaration: FunctionDeclaration = {
  name: "check_available_resources",
  description: "Fragt das interne System nach frei verfügbaren Mietobjekten, Räumen oder Ressourcen (z.B. Fahrzeuge, Hotelzimmer) anhand eines optionalen Typs.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, description: "Der Typ der gesuchten Ressource (z.B. 'vehicle', 'room', 'equipment'). Kann weggelassen werden, um alle zu sehen." }
    }
  }
};

export const checkExternalAvailabilityFunctionDeclaration: FunctionDeclaration = {
  name: "check_external_availability",
  description: "Bündelt eine Live-API-Abfrage an das externe System des Kunden, um Verfügbarkeiten von externen Ressourcen oder Terminen abzufragen.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Optionales Datum für die Anfrage (z.B. wenn der Kunde ein konkretes Datum nennt)" },
      resourceType: { type: Type.STRING, description: "Optionaler Ressourcen-Typ" }
    }
  }
};
