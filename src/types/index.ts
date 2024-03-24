export type Mission = {
  id: string;
  startsAt: Date | null;
  endsAt: Date | null;
  saboteurId?: string | null;
};
