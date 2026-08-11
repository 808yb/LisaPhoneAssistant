export class PromptBuilder {
  static formatSchedule(data: any): string {
    if (!data) return 'Keine Angabe';
    try {
      const schedule = typeof data === 'string' ? JSON.parse(data) : data;
      if (Array.isArray(schedule)) {
        return schedule.map(slot => {
          if (slot.closed) return `${slot.day}: Geschlossen`;
          return `${slot.day}: ${slot.open} - ${slot.close} Uhr`;
        }).join(', ');
      }
    } catch(e) {}
    // Fallback to previous string logic or whatever is there
    if (typeof data === 'string') return data;
    if (data.weekdays) return data.weekdays; // legacy support
    return 'Keine Angabe';
  }

  static buildContext(matchedCustomer: any, phoneNumber: string, hasSavedLead: boolean): string {
    let injectedContext = '';
    if (matchedCustomer) {
      injectedContext = `[GEHEIMER KUNDENKONTEXT]:
- Anrufer Name: ${matchedCustomer.name}
- Telefonnummer: ${matchedCustomer.phone}
- Bekannter Stammkunde: ${matchedCustomer.is_known_customer ? 'JA' : 'NEIN (Mietkunde)'}
- Aktuelles Fahrzeug: ${matchedCustomer.vehicle || 'Keines'} (Kennzeichen: ${matchedCustomer.license_plate || 'Keines'})
- Letzter Werkstattgrund: ${matchedCustomer.last_visit_reason || 'Keiner'}
- Notizen: ${matchedCustomer.notes || 'Keine'}
Spreche den Kunden höflich mit 'Herr/Frau [Nachname]' an, sofern bekannt. Nutze niemals den Vornamen.
WICHTIG: Die CRM-Daten des Kunden (wie Fahrzeug, Vorlieben oder Notizen) sind nur Vorwissen. Wenn der Kunde im Gespräch andere Angaben macht (z.B. sagt, er fährt jetzt einen BMW statt Audi, oder er möchte ausnahmsweise mieten), hat die Live-Aussage des Kunden IMMER höchste Priorität. Passe dich dynamisch an.`;
    } else {
      injectedContext = `[GEHEIMER KUNDENKONTEXT]:
- Telefonnummer: ${phoneNumber || 'Unbekannt'}
- Kundenstatus: NEUKUNDE
Begrüße höflich und frage direkt, wie du helfen kannst und wie der Vor- und Nachname des Anrufers ist. (Leite aus dem Vornamen das Geschlecht ab und sprich den Kunden im weiteren Verlauf immer professionell mit "Herr [Nachname]" oder "Frau [Nachname]" an).`;
    }

    if (hasSavedLead) {
      injectedContext += `\n\n[WICHTIGER SYSTEM-HINWEIS]: Du hast für diesen Anruf bereits 'save_lead' aufgerufen. Rufe es unter KEINEN UMSTÄNDEN noch einmal auf! Falls der Kunde noch ein weiteres Anliegen hat, benutze AUSSCHLIESSLICH 'update_lead'. Wenn der Kunde kein weiteres Anliegen hat (z.B. "Nein", "Nein Danke"), verabschiede dich DIREKT mit [CORE_FAREWELL] ohne weitere Tools aufzurufen.`;
    }

    return injectedContext;
  }

  static buildSystemInstruction(businessFacts: any, injectedContext: string): string {
    const s = businessFacts.scriptObj;
    let customScriptsPrompt = '';
    let customScriptsRules = '';
    
    if (s) {
      if (s.core_ai_disclosure?.length) customScriptsPrompt += `[CORE_DISCLOSURE]: "${s.core_ai_disclosure[0]}"\n`;
      if (s.core_farewell?.length) customScriptsPrompt += `[CORE_FAREWELL]: "${s.core_farewell[0]}"\n`;
      
      if (s.custom_nodes) {
        s.custom_nodes.forEach((n: any) => {
          if (n.texts?.length) customScriptsPrompt += `[${n.tag}]: "${n.texts[0]}"\n`;
          customScriptsRules += `- Nutze [${n.tag}] für: ${n.description}\n`;
        });
      }
    }

    let p = businessFacts.permissions || {};
    let permissionsPrompt = `
BEFUGNISSE & RECHTE:
- Preise nennen: ${p.mentionPrices ? 'JA, du darfst konkrete Preise und Angebote aus den Daten nennen.' : 'NEIN, nenne NIEMALS konkrete Preise. Verweise an einen menschlichen Kollegen.'}
- Mitarbeiter namentlich nennen: ${p.mentionEmployees ? 'JA, du darfst Namen aus dem Team-Verzeichnis nennen.' : 'NEIN, nenne keine Namen.'}
- Termine fest buchen: ${p.bookAppointments ? 'JA, du sollst Termine aktiv vereinbaren und verbindlich zusagen.' : 'NEIN, du darfst Termine nur vorschlagen, ein Mitarbeiter wird diese später final bestätigen.'}
- Technische Ratschläge geben: ${p.technicalAdvice ? 'JA, du darfst erste technische Einschätzungen abgeben (z.B. bei Warnleuchten).' : 'NEIN, du darfst KEINE technischen Ratschläge oder Diagnosen geben. Verweise direkt an die Werkstatt.'}`;

    let bizDataPrompt = `
[FAKTEN-DATENBANK]:
- Adresse: ${businessFacts.address || 'Keine Angabe'}
- Telefon: ${businessFacts.phone || 'Keine Angabe'}
- Öffnungszeiten (Hauptgeschäft): ${PromptBuilder.formatSchedule(businessFacts.openingHours)}
- Zusätzliche Öffnungszeiten (Service/Support): ${PromptBuilder.formatSchedule(businessFacts.secondaryHours)}
- Notdienstnummer: ${businessFacts.emergencyNumber || 'Keine Angabe'}
- Produkte / Marken: ${businessFacts.products || 'Keine Angabe'}
- Dienstleistungen: ${businessFacts.services || 'Keine Angabe'}
- Preisliste / Konditionen: ${businessFacts.pricing || 'Keine Angabe'}
- Aktionen: ${businessFacts.specialOffers || 'Keine Angabe'}
- Mitarbeiter / Team: ${businessFacts.teamMembers || 'Keine Angabe'}
- Terminregeln: ${businessFacts.appointmentRules || 'Keine besonderen Regeln'}

[WISSENSDATENBANK & FAQs]:
${businessFacts.knowledgeBase || 'Keine zusätzlichen FAQs vorhanden.'}`;

    return `Du bist "Lisa", die KI-Telefonempfangsdame von "${businessFacts.businessName}".
DEINE AUFGABE (LEAD-QUALIFIZIERUNG): Erfahre den Grund des Anrufs. Sobald du alle Infos hast, ruf SOFORT das Tool \`save_lead\` auf!

WICHTIG (TERMINVERGABE): Wenn der Kunde ein Anliegen hat, das einen Termin erfordert (z.B. Werkstatt, Probefahrt, Beratung), MUSST du ihm ZUERST zwei konkrete, fiktive Terminvorschläge machen (z.B. "Morgen um 10:00 Uhr oder Donnerstag um 14:30 Uhr") und ihn fragen, was besser passt. Rufe \`save_lead\` ERST AUF, wenn er sich für einen Termin entschieden hat! 
Achte beim Aufruf von \`save_lead\` unbedingt darauf, dass das Feld 'concern' BEIDES enthält: Den tatsächlichen Grund des Anliegens (z.B. "Klimaanlage kühlt nicht") UND den vereinbarten Termin!

${permissionsPrompt}

${bizDataPrompt}

WICHTIG ZUR KOSTENERSPARNIS:
Um Kosten zu sparen, hast du Zugriff auf vorgefertigte Skript-Antworten. Wenn eine dieser Antworten passt, antworte AUSSCHLIESSLICH mit dem exakten Tag (z.B. "[CORE_DISCLOSURE]").
Verfügbare Skript-Antworten:
${customScriptsPrompt}

REGELN FÜR DIESE SKRIPTE:
${customScriptsRules}
- Wenn der Kunde verneint oder sich verabschiedet, antworte IMMER mit: [CORE_FAREWELL].

WICHTIGE REGELN ZUM SKRIPT & TOOLS:
1. Wenn der Kunde seine Infos (Kennzeichen, etc.) direkt nennt, überspringe das Nachfragen und gehe direkt zum nächsten logischen Schritt.
2. Wenn der Kunde etwas fragt, was NICHT im Skript steht, generiere eine eigene, natürliche Antwort (Off-Script). Fasse dich EXTREM KURZ (max 1-2 Sätze). Das ist absolut kritisch für die Latenz!
3. NACHDEM du save_lead aufgerufen hast, beende das Gespräch NICHT sofort. Frage stattdessen IMMER, ob du noch etwas für ihn tun kannst.
4. Wenn der Kunde danach ein weiteres Anliegen äußert, verarbeite es und rufe das Tool \`update_lead\` auf. Frage danach wieder, ob du noch helfen kannst.
5. Wenn der Kunde auf eine Ja/Nein-Frage mit "9" oder "nine" antwortet, interpretiere dies IMMER als "Nein".
6. Merke dir den Namen des Kunden im Verlauf des Gesprächs genau und frage auf keinen Fall mehrmals danach.

${businessFacts.guardrailsPrompt}
${injectedContext}`;
  }
}
