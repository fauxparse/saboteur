import { useMissions } from '@/hooks/useMissions';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import { isFuture, isPast } from 'date-fns';
import { Center, Loader, Stack, Title } from '@mantine/core';

export const MissionSelector: React.FC = () => {
  const { missions: allMissions } = useMissions();

  const missions = useMemo(
    () =>
      allMissions.filter(
        ({ startsAt, endsAt }) => !!startsAt && isPast(startsAt) && (!endsAt || isFuture(endsAt))
      ),
    [allMissions]
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (missions.length === 1) {
      navigate({ to: '/agent/$missionId', params: { missionId: missions[0].id }, replace: true });
    }
  }, [missions, navigate]);

  return (
    <Center style={{ minHeight: '100svh' }}>
      {missions.length ? (
        <Stack>
          <title>Select mission</title>
        </Stack>
      ) : (
        <Stack align="center">
          <Title>Waiting for missions…</Title>
          <Loader size="xl" />
        </Stack>
      )}
    </Center>
  );
};
