export interface ChatbotAssessmentData {
  _id?: string;
  stressLevel: number;
  mood: string;
  severity: number;
  responses: string[];
  completedAt: string;
  recommendations: string;
  analysis: string;
}

export interface MindfulTrackerData {
  assessments: ChatbotAssessmentData[];
  totalAssessments: number;
  averageStressLevel: number;
  currentMood: string;
  sleepQuality: string;
  mindfulHours: number;
  journalStreak: number;
  lastAssessmentDate: string;
  moodTrend: string[];
}

export const getSleepScoreFromResponse = (response: string): number => {
  const responseLower = response.toLowerCase();
  if (responseLower.includes("very poor")) return 2;
  if (responseLower.includes("poor")) return 4;
  if (responseLower.includes("average")) return 6;
  if (responseLower.includes("good") && !responseLower.includes("very"))
    return 8;
  if (responseLower.includes("very good")) return 9;
  return 6;
};

export const getSleepQualityFromScore = (score: number): string => {
  if (score >= 9) return "Very good";
  if (score >= 8) return "Good";
  if (score >= 6) return "Average";
  if (score >= 4) return "Poor";
  return "Very poor";
};

export const getMoodEmoji = (mood: string): string => {
  switch (mood.toLowerCase()) {
    case "depression":
    case "sad":
      return "😢";
    case "positive":
    case "happy":
      return "😊";
    case "anxious":
    case "anxiety":
      return "😰";
    case "stressed":
    case "stress":
      return "😤";
    case "calm":
      return "😌";
    case "excited":
      return "🤗";
    case "angry":
      return "😠";
    case "neutral":
    default:
      return "😐";
  }
};

export const getDetailedSleepDisplay = (
  sleepQuality: string,
  assessments: any[]
): { display: string; isAverage: boolean } => {
  if (sleepQuality === "Average" && assessments.length > 0) {
    const sleepResponses = assessments
      .filter((a) => a.responses && a.responses[2])
      .map((a) => getSleepScoreFromResponse(a.responses[2]));

    if (sleepResponses.length > 0) {
      const average =
        sleepResponses.reduce((sum, score) => sum + score, 0) /
        sleepResponses.length;
      return { display: average.toFixed(1), isAverage: true };
    }
  }

  const score = getSleepScoreFromResponse(sleepQuality);
  return { display: score.toString(), isAverage: false };
};

export const calculateStreakDays = (assessments: any[]): number => {
  if (assessments.length === 0) return 0;

  const uniqueDates = [
    ...new Set(assessments.map((a) => new Date(a.completedAt).toDateString())),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let currentDate = new Date();

  for (let i = 0; i < uniqueDates.length; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setHours(0, 0, 0, 0);

    const assessmentDate = new Date(uniqueDates[i]);
    assessmentDate.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor(
      (checkDate.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference === 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (daysDifference === 1 && streak === 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 2);
    } else if (daysDifference === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export const getStreakDetails = (
  assessments: any[]
): { streak: number; streakData: boolean[] } => {
  const streak = calculateStreakDays(assessments);
  const streakData: boolean[] = [];

  for (let i = 6; i >= 0; i--) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toDateString();

    const hasAssessment = assessments.some(
      (a) => new Date(a.completedAt).toDateString() === dateStr
    );

    streakData.push(hasAssessment);
  }

  return { streak, streakData };
};

export const getTodayAssessmentCount = (assessments: any[]): number => {
  const today = new Date().toDateString();
  return assessments.filter(
    (a) => new Date(a.completedAt).toDateString() === today
  ).length;
};

export const getMoodTrend = (assessments: any[]): string[] => {
  const lastWeek = assessments
    .filter((a) => {
      const assessmentDate = new Date(a.completedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return assessmentDate >= weekAgo;
    })
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    .map((a) => a.mood);

  return lastWeek.slice(-3);
};

export const getStressLevelLabel = (level: number): string => {
  if (level <= 1) return "Very Low";
  if (level <= 2) return "Low";
  if (level <= 3) return "Normal";
  if (level <= 4) return "High";
  return "Very High";
};

export const getStressLevelColor = (level: number): string => {
  if (level <= 2) return "#8DAA6D";
  if (level <= 3) return "#F0CA00";
  return "#E74C3C";
};

export const getMoodIcon = (mood: string): "sad" | "happy" | "remove" => {
  switch (mood.toLowerCase()) {
    case "depression":
    case "sad":
      return "sad";
    case "positive":
    case "happy":
      return "happy";
    case "neutral":
    default:
      return "remove";
  }
};

export const formatMoodLabel = (mood: string): string => {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
};

export const processTrackerData = (
  assessments: any[],
  conversations: any[]
): MindfulTrackerData => {
  const now = new Date();
  const today = now.toDateString();
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentAssessments = assessments.filter(
    (a) => new Date(a.completedAt) >= thisWeek
  );

  const averageStressLevel =
    recentAssessments.length > 0
      ? recentAssessments.reduce((sum, a) => sum + (a.stressLevel || 0), 0) /
        recentAssessments.length
      : 0;

  const latestAssessment = assessments.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];

  const currentMood = latestAssessment?.mood || "neutral";

  let sleepQuality = "Average";
  if (latestAssessment?.responses?.[2]) {
    sleepQuality = latestAssessment.responses[2];
  } else {
    const sleepResponses = assessments
      .filter((a) => a.responses && a.responses[2])
      .map((a) => getSleepScoreFromResponse(a.responses[2]));

    if (sleepResponses.length > 0) {
      const sleepScore =
        sleepResponses.reduce((sum, score) => sum + score, 0) /
        sleepResponses.length;
      sleepQuality = getSleepQualityFromScore(sleepScore);
    }
  }

  const todayConversations = conversations.filter(
    (c) => new Date(c.createdAt || c.lastUpdated).toDateString() === today
  );
  const mindfulHours = todayConversations.length * 0.25;

  const journalStreak = calculateStreakDays(assessments);
  const moodTrend = getMoodTrend(assessments);

  return {
    assessments,
    totalAssessments: assessments.length,
    averageStressLevel,
    currentMood,
    sleepQuality,
    mindfulHours,
    journalStreak,
    lastAssessmentDate: latestAssessment?.completedAt || "",
    moodTrend,
  };
};
