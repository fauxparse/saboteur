import { useMissions } from '@/hooks/useMissions';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const MissionSelector: React.FC = () => {
  const { missions } = useMissions();

  const navigate = useNavigate();

  useEffect(() => {
    if (missions.length === 1) {
      navigate({ to: '/agent/$missionId', params: { missionId: missions[0].id }, replace: true });
    }
  }, [missions, navigate]);

  return <>Missions</>;
};
