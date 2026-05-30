import type { Request, Response } from "express";

type Difficulty = "easy" | "medium" | "hard";

interface SubjectInput {
  name?: string;
  difficulty?: Difficulty;
}

interface Subject {
  name: string;
  difficulty: Difficulty;
}

function normalizeDifficulty(value: unknown): Difficulty {
  const level = String(value || "").toLowerCase();
  if (level === "easy" || level === "hard" || level === "medium") {
    return level;
  }
  return "medium";
}

function parseSubjects(
  input: unknown,
  overallDifficulty?: Difficulty,
): Subject[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          return {
            name: item.trim(),
            difficulty: normalizeDifficulty(overallDifficulty),
          };
        }
        if (typeof item === "object") {
          const subject = item as SubjectInput;
          return {
            name: String(subject.name || "").trim(),
            difficulty: normalizeDifficulty(
              subject.difficulty || overallDifficulty,
            ),
          };
        }
        return null;
      })
      .filter((item): item is Subject => Boolean(item && item.name));
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => {
        const match = token.match(
          /^(.*?)(?:\((easy|medium|hard)\)|:(easy|medium|hard))$/i,
        );
        if (match) {
          const level = match[2] || match[3];
          return {
            name: match[1].trim(),
            difficulty: normalizeDifficulty(level),
          };
        }
        return {
          name: token,
          difficulty: normalizeDifficulty(overallDifficulty),
        };
      });
  }

  return [];
}

function buildPlan(
  subjects: Subject[],
  examDate?: string,
  hoursPerDay?: number,
) {
  const hours = Math.max(1, Number.parseInt(String(hoursPerDay || 3), 10) || 3);
  const weightMap: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

  const today = new Date();
  let totalDays = 7;

  if (examDate) {
    const exam = new Date(examDate);
    if (!Number.isNaN(exam.getTime())) {
      const diffMs = exam.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 1) {
        totalDays = Math.min(diffDays, 14);
      }
    }
  }

  const totalWeight = subjects.reduce((sum, subject) => {
    return sum + (weightMap[subject.difficulty] || 2);
  }, 0);

  const schedule: Array<{
    label: string;
    date: string;
    sessions: Array<{ subject: string; hours: number }>;
  }> = [];

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const baseHours = subjects.map((subject) => {
      const weight = weightMap[subject.difficulty] || 2;
      return Math.floor((hours * weight) / totalWeight);
    });

    let assigned = baseHours.reduce((sum, value) => sum + value, 0);
    let remainder = hours - assigned;

    const order = subjects
      .map((subject, idx) => ({
        idx,
        weight: weightMap[subject.difficulty] || 2,
      }))
      .sort((a, b) => b.weight - a.weight);

    order.forEach((item) => {
      if (remainder > 0) {
        baseHours[item.idx] += 1;
        remainder -= 1;
      }
    });

    const date = new Date(today);
    date.setDate(today.getDate() + dayIndex);

    const sessions = subjects.map((subject, idx) => ({
      subject: subject.name,
      hours: baseHours[idx],
    }));

    schedule.push({
      label: `Day ${dayIndex + 1}`,
      date: date.toISOString().slice(0, 10),
      sessions,
    });
  }

  return {
    startDate: today.toISOString().slice(0, 10),
    days: totalDays,
    hoursPerDay: hours,
    schedule,
  };
}

export function generatePlanner(req: Request, res: Response) {
  const { subjects, examDate, hoursPerDay, overallDifficulty } = req.body as {
    subjects?: unknown;
    examDate?: string;
    hoursPerDay?: number;
    overallDifficulty?: Difficulty;
  };

  const parsedSubjects = parseSubjects(subjects, overallDifficulty);

  if (!parsedSubjects.length) {
    return res.status(400).json({ error: "subjects are required" });
  }

  const plan = buildPlan(parsedSubjects, examDate, hoursPerDay);
  return res.json(plan);
}
