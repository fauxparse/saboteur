export type Mission = {
  id: string;
  startsAt: Date | null;
  endsAt: Date | null;
  saboteurId?: string | null;
};

export type Agent = {
  id: string;
  name: string;
  userId?: string | null;
  color?: Color;
};

export const COLORS = ['red', 'blue', 'lime', 'orange', 'grape', 'teal', 'yellow'] as const;
export type Color = (typeof COLORS)[number];
