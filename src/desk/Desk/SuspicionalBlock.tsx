import { Suspicional } from '@/types/Event';
import { Milestone } from './Milestone';
import { IconHandFinger, IconTrash } from '@tabler/icons-react';
import { Group, Menu, Text } from '@mantine/core';
import { AgentPicker } from './AgentPicker';
import { PartialWithId } from '@/types';
import { useAgents } from '@/contexts/AgentsProvider';
import { AgentName } from './AgentName';

type SuspicionalBlockProps = {
  event: Suspicional;
  onUpdate: (suspicional: PartialWithId<Suspicional>) => void;
  onDelete: (suspicional: Suspicional) => void;
};

export const SuspicionalBlock: React.FC<SuspicionalBlockProps> = ({
  event: suspicional,
  onUpdate,
  onDelete,
}) => {
  const { saboteur } = useAgents();

  return (
    <Milestone
      icon={<IconHandFinger />}
      time={suspicional.timestamp}
      menu={
        <>
          <Menu.Item leftSection={<IconTrash />} color="red" onClick={() => onDelete(suspicional)}>
            Delete
          </Menu.Item>
        </>
      }
    >
      <Group>
        {saboteur ? (
          <>
            <AgentName agent={saboteur} />
            <Text>accused</Text>
            <AgentPicker
              exceptSaboteur
              value={suspicional.accused}
              onChange={(accused) => onUpdate({ ...suspicional, accused })}
            />
          </>
        ) : (
          <Text>There is no saboteur</Text>
        )}
      </Group>
    </Milestone>
  );
};
