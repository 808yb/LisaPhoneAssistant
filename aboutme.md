# Lisa - Der KI-Telefonassistent

## Was ist Lisa?
Lisa ist ein hochintelligenter, sprachgesteuerter KI-Telefonassistent, der speziell für Unternehmen (wie z.B. Autohäuser, Werkstätten oder Agenturen) entwickelt wurde. Sie fungiert als erste Anlaufstelle für Kunden am Telefon und übernimmt Aufgaben, die normalerweise viel Zeit von Mitarbeitern in Anspruch nehmen. Lisa klingt dabei extrem natürlich, versteht komplexe Zusammenhänge und kann echte Geschäftsaktionen durchführen.

## Wie funktioniert Lisa?
Lisa basiert auf einer Kombination aus modernsten Technologien:

1. **Telefonie-Integration (Twilio):** Eingehende Anrufe werden über Twilio an das System weitergeleitet. Twilio wandelt die Sprache des Anrufers in Text um und sendet ihn in Echtzeit an den Server.
2. **Künstliche Intelligenz (Google Gemini 1.5):** Das Herzstück von Lisa. Gemini analysiert den Text, versteht den Kontext der Unterhaltung und entscheidet über den nächsten Schritt.
3. **Autonome Werkzeuge (Tool-Calling):** Lisa kann nicht nur reden, sondern auch *handeln*. Sie hat Zugriff auf interne Werkzeuge, um z.B.:
   - Freie Termine im Kalender zu prüfen (`check_availability`)
   - Externe Ressourcen (wie Mietfahrzeuge) abzufragen (`check_external_availability`)
   - Termine fest zu buchen (`book_appointment`)
   - Anrufer-Anliegen (Leads) strukturiert in der Datenbank zu speichern (`save_lead`)
4. **Text-to-Speech (Google Cloud TTS):** Die Antwort der KI wird in Bruchteilen einer Sekunde in eine lebensechte, natürliche Stimme umgewandelt und dem Anrufer vorgespielt.
5. **Intelligente Lückenfüller:** Um die kurze Ladezeit der KI zu überbrücken, nutzt Lisa dynamische "Smart Fillers" (z.B. "Ich schaue kurz im Kalender nach..."), die auf dem Kontext der Frage basieren.

## Warum gibt es Lisa?
Die Idee hinter Lisa ist es, die telefonische Erreichbarkeit von Unternehmen drastisch zu verbessern und gleichzeitig das Personal zu entlasten. 

- **Keine Warteschleifen:** Jeder Anruf wird sofort entgegengenommen.
- **Rund um die Uhr verfügbar:** Lisa kann auch außerhalb der Öffnungszeiten Terminanfragen bearbeiten oder Rückrufe notieren.
- **Zeitersparnis:** Standardanfragen wie Terminbuchungen, Statusabfragen oder Informationsauskünfte werden komplett automatisiert erledigt.
- **Höhere Kundenzufriedenheit:** Kunden bekommen sofort Antworten auf ihre Fragen, während die Mitarbeiter sich auf komplexe Aufgaben oder Kunden vor Ort konzentrieren können.

Lisa ist somit nicht einfach nur ein Anrufbeantworter, sondern ein vollwertiges, digitales Teammitglied.
