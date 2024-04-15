import { useMissions } from "@/hooks/useMissions";
import { Button, Center, List } from "@mantine/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import classes from "./Missions.module.css";

export const Missions: React.FC = () => {
  const { missions, createMission } = useMissions();

  const navigate = useNavigate();

  const createClicked = useCallback(async () => {
    const mission = await createMission();
    navigate({ to: "/desk/$missionId", params: { missionId: mission.id } });
  }, [createMission, navigate]);

  return (
    <Center className={classes.missions}>
      <Button onClick={createClicked}>Create Mission</Button>
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
