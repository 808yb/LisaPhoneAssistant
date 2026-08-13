export interface BusinessFacts {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: any;
  secondaryHours: any;
  pricing: string;
  emergencyNumber: string;
  specialOffers: string;
  guardrailsPrompt: string;
  products: string;
  services: string;
  teamMembers: string;
  appointmentRules: string;
  knowledgeBase: string;
  permissions: {
    mentionPrices: boolean;
    mentionEmployees: boolean;
    bookAppointments: boolean;
    technicalAdvice: boolean;
  };
  externalApiUrl?: string;
  externalApiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}
