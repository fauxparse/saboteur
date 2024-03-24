import { useMission } from '@/contexts/MissionProvider';
import { Mission } from '@/types';
import { Button } from '@mantine/core';
import { isFuture, isPast } from 'date-fns';
import { useCallback } from 'react';

const isRunning = (mission: Mission) =>
  !!mission.startsAt && isPast(mission.startsAt) && (!mission.endsAt || isFuture(mission.endsAt));

export const MissionStatus = () => {
  const { mission, updateMission } = useMission();

  const start = useCallback(() => {
    updateMission({ id: mission.id, startsAt: mission.startsAt || new Date(), endsAt: null });
  }, [mission, updateMission]);

  const end = useCallback(() => {
    updateMission({ id: mission.id, endsAt: new Date() });
  }, [mission, updateMission]);

  return (
    <>
      {isRunning(mission) ? (
        <Button onClick={end}>End mission</Button>
      ) : (
        <Button onClick={start}>Start mission</Button>
      )}
    </>
  );
};
