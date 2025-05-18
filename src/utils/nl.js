const nl = {
    translation: {
      // TopBar
      dashboard: "Dashboard",
      download: "Download",
      switchLanguage: "Taal wisselen",
      undo: "Ongedaan maken",
      redo: "Opnieuw uitvoeren",
  
      // CV Name
      cvWithoutName: "CV zonder naam",
      cvOf: "CV van",
  
      // General UI
      stepNotFound: "Stap niet gevonden",
      today: "Vandaag",
      yesterday: "Gisteren",
      daysAgo: "{{count}} dagen geleden",
      aWeekAgo: "Een week geleden",
      suggestions: "Suggesties",
      select: "Selecteer",
      uploadPhoto: "Upload foto",
      remove: "Verwijderen",
      onlyLettersAllowed: "Alleen letters zijn toegestaan",
      invalidEmail: "Vul een geldig e-mailadres in.",
      max5mb: "Maximale bestandsgrootte is 5MB",
      requiredField: "Verplicht veld",
      selectValidLevel: "Selecteer een geldig niveau",
      dragToReorder: "Versleep om te ordenen",
      duplicateValue: "Deze waarde bestaat al",
      maxHobbiesReached: "Je kunt maximaal 5 hobby’s toevoegen",
      emailPlaceholder: "E-mailadres",
      passwordPlaceholder: "Wachtwoord",
      passwordMinLength: "Wachtwoord moet minimaal 6 tekens bevatten.",
      loginError: "Er ging iets mis bij het inloggen.",
      resetEmailSent: "Wachtwoord reset e-mail is verzonden!",
      resetError: "Kan geen reset e-mail verzenden.",
      forgotPassword: "Wachtwoord vergeten?",
      sendResetLink: "Verzend resetlink",
      backToLogin: "Terug naar inloggen",
  
      // Sidebar & Steps
      personalInfo: "Persoonlijke gegevens",
      workExperience: "Werkervaring",
      education: "Opleidingen",
      skills: "Vaardigheden",
      languages: "Talen",
      hobbies: "Hobby’s",
      courses: "Cursussen",
      internships: "Stages",
      traits: "Eigenschappen",
      certifications: "Certificaten",
  
      // Personal Info
      photo: "Foto",
      firstName: "Voornaam",
      lastName: "Achternaam",
      email: "E-mail",
      phone: "Telefoon",
      address: "Adres",
      postalCode: "Postcode",
      city: "Stad",
      birthdate: "Geboortedatum",
      birthplace: "Geboorteplaats",
      license: "Rijbewijs",
      gender: "Geslacht",
      nationality: "Nationaliteit",
      maritalStatus: "Burgerlijke staat",
      website: "Website",
      linkedin: "LinkedIn",
  
      yes: "Ja",
      no: "Nee",
      male: "Man",
      female: "Vrouw",
      single: "Alleenstaand",
      married: "Getrouwd",
      cohabiting: "Samenwonend",
      divorced: "Gescheiden",
      widowed: "Weduwe / Weduwnaar",
  
      // Work Experience
      jobTitle: "Functie",
      company: "Bedrijf",
      cityField: "Stad",
      startDate: "Startdatum",
      endDate: "Einddatum",
      current: "Heden",
      month: "Maand",
      year: "Jaar",
      description: "Beschrijving",
      addExperience: "Ervaring toevoegen",
      startDateRequired: "Startdatum is verplicht",
      startBeforeEnd: "Startdatum moet vóór de einddatum liggen",
  
      // Education
      educationTitle: "Opleiding",
      institute: "Onderwijsinstelling",
      addEducation: "Opleiding toevoegen",
  
      // Skills
      skill: "Vaardigheid",
      skillPlaceholder: "bijv. Teamwork, JavaScript",
      level: "Niveau",
      addSkill: "Vaardigheid toevoegen",
      selectLevel: "Selecteer vaardigheidsniveau",
      noDuplicateSkills: "Deze vaardigheid bestaat al",
      skillSuggestions: [
        "Communicatie", "Samenwerken", "Leiderschap", "Probleemoplossend", "Creativiteit",
        "Tijdmanagement", "Aanpassingsvermogen", "Kritisch denken", "Conflictoplossing", "Projectmanagement",
        "Oog voor detail", "Organisatie", "Klantgerichtheid", "Besluitvorming", "Samenwerking"
      ],
  
      // Languages
      language: "Taal",
      languagePlaceholder: "bijv. Nederlands",
      languageLevel: "Taalniveau",
      addLanguage: "Taal toevoegen",
      noDuplicateLanguages: "Deze taal bestaat al",
      languageSuggestionList: {
        dutch: "Nederlands",
        english: "Engels",
        french: "Frans",
        german: "Duits",
        spanish: "Spaans",
      },
      languageSuggestions: "Suggesties",
  
      // Hobbies
      addHobby: "Hobby toevoegen",
      hobbyPlaceholder: "bijv. Fotografie, Schaken",
      hobbySuggestions: [
        "Fotografie", "Schaken", "Reizen", "Gamen", "Koken",
        "Lezen", "Wandelen", "Dansen", "Tekenen", "Schrijven",
        "Vrijwilligerswerk", "Bloggen", "Hardlopen", "Yoga", "Knutselen"
      ],
  
      // Traits
      trait: "Eigenschap",
traitPlaceholder: "bijv. Toegewijd, Creatief, Stipt",
      addTrait: "Eigenschap toevoegen",
      traitsPlaceholder: "bijv. Creatief, Betrouwbaar",
      traitSuggestions: [
        "Creatief", "Betrouwbaar", "Ambitieus", "Georganiseerd", "Analytisch",
        "Communicatief vaardig", "Probleemoplossend", "Resultaatgericht", "Flexibel", "Zelfstandig",
        "Teamspeler", "Leergierig", "Oplossingsgericht", "Stressbestendig", "Proactief"
      ],
  
      // Certifications
      addCertification: "Certificaat toevoegen",
      certificateName: "Naam van certificaat",
  
      // Internships
      addInternship: "Stage toevoegen",
  
      // Courses
      addCourse: "Cursus toevoegen",
      courseTitle: "Naam van cursus",
  
      // Shared
      languageLevels: {
        beginner: "Beginner",
        fair: "Redelijk",
        good: "Goed",
        veryGood: "Zeer goed",
        fluent: "Vloeiend",
        excellent: "Uitstekend",
        native: "Moedertaal",
      },
  
      months: [
        "januari", "februari", "maart", "april", "mei", "juni",
        "juli", "augustus", "september", "oktober", "november", "december"
      ],
  
      monthsShort: [
        "jan", "feb", "mrt", "apr", "mei", "jun",
        "jul", "aug", "sep", "okt", "nov", "dec"
      ],
  
      // Subscription Flow
      loginOrSignup: "Inloggen of account aanmaken",
      continueToDownload: "Log in om je CV te downloaden",
      loginWithGoogle: "Inloggen met Google",
      continueWithGoogle: "Ga verder met Google",
      orContinueWith: "Of ga verder met",
      signup: "Account aanmaken",
      createAccount: "Account aanmaken",
      alreadyHaveAccount: "Heb je al een account?",
      or: "of",
      choosePlan: "Kies je plan",
      selectSubscriptionToProceed: "Selecteer een abonnement om verder te gaan",
      try3DaysFor: "Probeer 3 dagen voor {{price}}",
      downloadNow: "Nu downloaden",
      readyToDownload: "Klaar om te downloaden?",
      clickToDownload: "Klik op de knop om je CV te downloaden",
      cancel: "Annuleren",
      skip: "Overslaan",
      back: "Terug",
  
      pricing: {
        "1month": "€4,95/maand",
        "3months": "€12,95/kwartaal",
        "6months": "€24,95/halfjaar",
        "1year": "€49,95/jaarlijks",
        "oneTime": "€7,95/eenmalig",
      },
  
      manageSubscription: "Abonnement beheren",
      activePlan: "Je hebt een actief abonnement",
      noPlan: "Je hebt nog geen abonnement",
      featureTemplates: "Alle CV-sjablonen",
      featureDownloads: "Onbeperkt downloaden",
      featureSupport: "Premium support",
      subscribe: "Abonneren",
      close: "Sluiten",
  
      // FloatingBar UI
template: "Thema",
themeColor: "Themakleur",
font: "Lettertype",
fontSize: "Lettergrootte",
lineSpacing: "Regelafstand",
preview: "Voorbeeld",

  
      // Dashboard / CVCard additions
      lastEdited: "Laatst bewerkt",
      duplicate: "Dupliceren",
      createNewCV: "Nieuw CV aanmaken",
      yourCVs: "Jouw CV's",
      listView: "Lijstweergave",
      gridView: "Rasterweergave",
      failedToLoadCVs: "CV's laden is mislukt.",
      anonymousUser: "Anonieme gebruiker",
      areYouSureDeleteAccount: "Weet je zeker dat je je account wilt verwijderen? Deze actie is permanent.",
      somethingWentWrong: "Er ging iets mis",

      plan1MonthLabel: "1 maand – €4,95",
plan1MonthDesc: "Toegang tot alle sjablonen en onbeperkt downloaden gedurende een maand.",
plan3MonthsLabel: "3 maanden - €12,95",
plan3MonthsDesc: "Bespaar met een kwartaalabonnement en geniet van volledige toegang.",
plan6MonthsLabel: "6 maanden - € 24,95",
plan6MonthsDesc: "Beste prijs! Maak, download en beheer je CV's zonder stress.",
plan1YearLabel: "1 jaar - €49,95",
plan1YearDesc: "Ideaal voor werkzoekenden: volledige toegang voor 12 maanden.",

planLabel: "Abonnement",
planNames: {
  "1month": "1 maand",
  "3months": "3 maanden",
  "6months": "6 maanden",
  "1year": "1 jaar",
},
planWithPrice: "{{plan}} ({{price}})",
planRenewsOn: "Je abonnement wordt verlengd op {{date}}",

mostPopular: "Meest gekozen",
secureStripeCheckout: "Veilige betaling via Stripe",
passwordCriteriaTooltip: "Minimaal 8 tekens, met hoofdletter, kleine letter, cijfer en speciaal teken.",
downloadHelpText: "Je bestand wordt als PDF opgeslagen in je downloadmap.",
stepLogin: "Inloggen",
stepPlan: "Abonnement",
stepDownload: "Downloaden",
login: "Inloggen",
signup: "Account aanmaken",
loading: "Laden",


    },
  };
  
  export default nl;
  