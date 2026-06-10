export interface OnboardingProfile {
  faith_journey_stage?: string | null;
  denomination?: string | null;
  spiritual_challenges?: string[] | null;
  connection_styles?: string[] | null;
  reading_frequency?: string | null;
  prayer_style?: string | null;
  learning_style?: string | null;
  life_stage?: string | null;
  content_depth?: number | null;
  age_range?: string | null;
}

export interface AITone {
  warmth: number;        // 1-5: 1=reserved, 5=very warm
  complexity: number;    // 1-5: 1=simple, 5=academic
  register: string;      // "casual", "pastoral", "academic"
  tradition: string;     // "ecumenical", "protestant", "catholic", "orthodox", "evangelical"
  length: string;        // "brief", "moderate", "thorough"
  primary_challenge: string | null;
  prayer_register: string; // "conversational", "liturgical", "charismatic"
}

export function computeAITone(profile: OnboardingProfile): AITone {
  let warmth = 3;
  let complexity = 3;
  let register: string = "pastoral";
  let tradition: string = "ecumenical";
  let length: string = "moderate";
  let prayerRegister: string = "conversational";

  // Faith journey stage adjustments
  switch (profile.faith_journey_stage) {
    case "exploring":
      warmth = Math.min(5, warmth + 1);
      complexity = Math.max(1, complexity - 1);
      register = "casual";
      break;
    case "new-believer":
      warmth = Math.min(5, warmth + 1);
      complexity = Math.max(1, complexity - 1);
      register = "casual";
      break;
    case "growing":
      warmth = Math.min(5, warmth + 1);
      break;
    case "committed":
      complexity = Math.min(5, complexity + 1);
      break;
    case "questioning":
      warmth = Math.min(5, warmth + 1);
      register = "pastoral";
      break;
    case "coming-back":
      warmth = Math.min(5, warmth + 2);
      register = "pastoral";
      break;
  }

  // Denomination adjustments
  switch (profile.denomination) {
    case "Catholic":
      tradition = "catholic";
      prayerRegister = "liturgical";
      break;
    case "Orthodox":
      tradition = "orthodox";
      prayerRegister = "liturgical";
      break;
    case "Anglican":
      tradition = "protestant";
      prayerRegister = "liturgical";
      break;
    case "Presbyterian":
    case "Lutheran":
      tradition = "protestant";
      complexity = Math.min(5, complexity + 1);
      break;
    case "Pentecostal":
      tradition = "evangelical";
      prayerRegister = "charismatic";
      warmth = Math.min(5, warmth + 1);
      break;
    case "Baptist":
    case "Methodist":
      tradition = "protestant";
      break;
    case "Non-denominational":
      tradition = "evangelical";
      register = "casual";
      break;
  }

  // Connection styles adjustments
  if (profile.connection_styles) {
    if (profile.connection_styles.includes("Quiet reflection")) {
      register = "pastoral";
    }
    if (profile.connection_styles.includes("Academic study")) {
      complexity = Math.min(5, complexity + 1);
      register = "academic";
    }
    if (profile.connection_styles.includes("Contemplative prayer")) {
      prayerRegister = "liturgical";
    }
    if (profile.connection_styles.includes("Creative expression")) {
      warmth = Math.min(5, warmth + 1);
    }
  }

  // Prayer style overrides
  switch (profile.prayer_style) {
    case "Spontaneous and conversational":
      prayerRegister = "conversational";
      break;
    case "Structured and liturgical":
      prayerRegister = "liturgical";
      break;
    case "Passionate and expressive":
      prayerRegister = "charismatic";
      warmth = Math.min(5, warmth + 1);
      break;
    case "Silent and contemplative":
      prayerRegister = "liturgical";
      register = "pastoral";
      break;
  }

  // Learning style adjustments
  switch (profile.learning_style) {
    case "Reading and studying":
      complexity = Math.min(5, complexity + 1);
      length = "thorough";
      break;
    case "Listening and discussing":
      register = "casual";
      length = "moderate";
      break;
    case "Visual and creative":
      warmth = Math.min(5, warmth + 1);
      length = "moderate";
      break;
    case "Hands-on and practical":
      register = "casual";
      length = "brief";
      break;
  }

  // Life stage adjustments
  switch (profile.life_stage) {
    case "Middle school":
    case "High school":
      register = "casual";
      complexity = Math.max(1, complexity - 1);
      warmth = Math.min(5, warmth + 1);
      break;
    case "College":
      complexity = Math.min(5, complexity + 1);
      break;
    case "Retired":
      length = "thorough";
      break;
  }

  // Content depth maps directly to complexity
  if (profile.content_depth) {
    complexity = profile.content_depth;
    if (profile.content_depth <= 2) {
      length = "brief";
      register = "casual";
    } else if (profile.content_depth >= 4) {
      length = "thorough";
    }
  }

  // Age range adjustments
  switch (profile.age_range) {
    case "Under 14":
      register = "casual";
      complexity = 1;
      warmth = 5;
      length = "brief";
      break;
    case "14-17":
      register = "casual";
      complexity = Math.min(complexity, 2);
      warmth = Math.min(5, warmth + 1);
      break;
    case "51+":
      length = "thorough";
      break;
  }

  // Primary challenge
  const primaryChallenge = profile.spiritual_challenges?.[0] || null;

  return {
    warmth,
    complexity,
    register,
    tradition,
    length,
    primary_challenge: primaryChallenge,
    prayer_register: prayerRegister,
  };
}
