import { Suspicional } from '@/types/Event';
import { Milestone } from './Milestone';
import { IconHandFinger, IconTrash } from '@tabler/icons-react';
import { Menu } from '@mantine/core';
import { AgentPicker } from './AgentPicker';
import { PartialWithId } from '@/types';

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
  return (
    <Milestone
      icon={<IconHandFinger />}
      time={suspicional.startsAt}
      menu={
        <>
          <Menu.Item leftSection={<IconTrash />} color="red" onClick={() => onDelete(suspicional)}>
            Delete
          </Menu.Item>
        </>
      }
    >
      <AgentPicker
        value={suspicional.accused}
        onChange={(accused) => onUpdate({ ...suspicional, accused })}
      />
    </Milestone>
  );
};
