import { useMissions } from '@/hooks/useMissions';
import { Button, Center, List } from '@mantine/core';

import classes from './Missions.module.css';
import { Link } from '@tanstack/react-router';

export const Missions: React.FC = () => {
  const { missions, createMission } = useMissions();

  return (
    <Center className={classes.missions}>
      <Button onClick={createMission}>Create Mission</Button>
      <List>
        {missions.map((mission) => (
          <List.Item key={mission.id}>
            <Link to="/desk/$missionId" params={{ missionId: mission.id }}>
              {mission.id}
            </Link>
          </List.Item>
        ))}
      </List>
    </Center>
  );
};
