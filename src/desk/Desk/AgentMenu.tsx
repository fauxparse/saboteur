import { Agent } from '@/types/Agent';
import { Button, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconEdit,
  IconEyeglass2,
  IconGhost,
  IconLego,
  IconSlice,
  IconTrash,
} from '@tabler/icons-react';
import { AgentInfo } from './AgentInfo';
import { useMission } from '@/contexts/MissionProvider';
import { useCallback } from 'react';

type AgentMenuProps = {
  agent: Agent;
  onDelete: (agent: Agent) => void;
  onEliminate: (agent: Agent) => void;
  onReinstate: (agent: Agent) => void;
};

export const AgentMenu: React.FC<AgentMenuProps> = ({
  agent,
  onDelete,
  onEliminate,
  onReinstate,
}) => {
  const [editing, modal] = useDisclosure();

  const { mission, updateMission } = useMission();

  const isSaboteur = mission.saboteurId === agent.id;

  const setSaboteur = useCallback(() => {
    updateMission({
      id: mission.id,
      saboteurId: agent.id === mission.saboteurId ? null : agent.id,
    });
  }, [mission, updateMission, agent.id]);

  return (
    <>
      <Menu position="right-start" withArrow>
        <Menu.Target>
          <Button
            color={agent.color || undefined}
            leftSection={isSaboteur ? <IconEyeglass2 /> : <IconLego />}
            justify="start"
            variant={agent.eliminatedAt ? 'light' : 'filled'}
          >
            {agent.name}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconEyeglass2 />} onClick={setSaboteur}>
            Make Saboteur
          </Menu.Item>
          {agent.eliminatedAt ? (
            <Menu.Item leftSection={<IconGhost />} onClick={() => onReinstate(agent)}>
              Reinstate
            </Menu.Item>
          ) : (
            <Menu.Item leftSection={<IconSlice />} onClick={() => onEliminate(agent)}>
              Eliminate
            </Menu.Item>
          )}
          <Menu.Divider />
          <Menu.Item leftSection={<IconEdit />} onClick={modal.open}>
            Edit details
          </Menu.Item>
          <Menu.Item color="red" leftSection={<IconTrash />} onClick={() => onDelete(agent)}>
            Delete agent
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <AgentInfo agent={agent} opened={editing} onClose={modal.close} />
    </>
  );
};
