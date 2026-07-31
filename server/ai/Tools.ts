import { Type, FunctionDeclaration } from "@google/genai";

export const saveLeadFunctionDeclaration: FunctionDeclaration = {
  name: "save_lead",
  description: "Speichert ein neues Anliegen / Lead-Ticket für das Autohaus-Team, sobald der Anrufer seinen Namen, Anliegen und Kontaktdaten genannt hat.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      callerName: { type: Type.STRING, description: "Name des Anrufers" },
      phoneNumber: { type: Type.STRING, description: "Telefonnummer des Anrufers" },
      category: { type: Type.STRING, description: "Kategorie des Anliegens: 'workshop', 'sales', 'test_drive', 'spare_parts', 'rental', 'general'" },
      concern: { type: Type.STRING, description: "Genaue Beschreibung des Kundenanliegens" },
      urgency: { type: Type.STRING, description: "Dringlichkeit: 'high', 'normal', 'low'" },
      vehicleInfo: { type: Type.STRING, description: "Fahrzeugmodell und Kennzeichen" },
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
