export interface BusinessFacts {
  dealershipName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  workshopHours: string;
  rentalRates: string;
  emergencyNumber: string;
  specialOffers: string;
  guardrailsPrompt: string;
}
