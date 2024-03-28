export type Mission = {
  id: string;
  startsAt: Date | null;
  endsAt: Date | null;
  saboteurId?: string | null;
};

export type PartialWithId<T extends { id: unknown }> = Pick<T, 'id'> & Partial<T>;
