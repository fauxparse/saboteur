import { Suspicional } from '@/types/Event';
import { Milestone } from './Milestone';
import { IconHandFinger, IconTrash } from '@tabler/icons-react';
import { Menu } from '@mantine/core';

type SuspicionalBlockProps = {
  event: Suspicional;
  onDelete: (suspicional: Suspicional) => void;
};

export const SuspicionalBlock: React.FC<SuspicionalBlockProps> = ({
  event: suspicional,
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
      Suspicional
    </Milestone>
  );
};
