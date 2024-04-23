import { Scene } from '@/types/Event';
import { Milestone } from './Milestone';
import { IconMasksTheater, IconTrash } from '@tabler/icons-react';
import { Checkbox, Group, Menu, TextInput } from '@mantine/core';
import { useForm } from '@tanstack/react-form';
import { useAgents } from '@/contexts/AgentsProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useMission } from '@/contexts/MissionProvider';
import { KeyboardEvent, useCallback } from 'react';

type SceneBlockProps = {
  event: Scene;
  onDelete: (scene: Scene) => void;
};

export const SceneBlock: React.FC<SceneBlockProps> = ({ event: scene, onDelete }) => {
  const { mission } = useMission();

  const { saboteur } = useAgents();

  const form = useForm({
    defaultValues: {
      name: scene.name,
      sabotaged: !!scene.sabotaged,
    },
    onSubmit: async ({ value }) => {
      await updateDoc(doc(db, 'missions', mission.id, 'events', scene.id), value);
    },
  });

  const keyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        e.currentTarget.blur();
        break;
    }
  }, []);

  return (
    <Milestone
      icon={<IconMasksTheater />}
      time={scene.timestamp}
      menu={
        <>
          <Menu.Item leftSection={<IconTrash />} color="red" onClick={() => onDelete(scene)}>
            Delete
          </Menu.Item>
        </>
      }
    >
      <Group
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <TextInput
              flex={1}
              autoFocus
              placeholder="Brief description of the scene"
              value={field.state.value}
              onKeyDown={keyDown}
              onChange={(e) => field.handleChange(e.currentTarget.value)}
              onBlur={(e) => {
                field.handleChange(e.currentTarget.value);
                form.handleSubmit();
              }}
            />
          )}
        </form.Field>
        <form.Field name="sabotaged">
          {(field) => (
            <Checkbox
              label="Sabotaged?"
              color={saboteur?.color || undefined}
              checked={field.state.value}
              onChange={(e) => {
                field.handleChange(e.currentTarget.checked);
                form.handleSubmit();
              }}
            />
          )}
        </form.Field>
      </Group>
    </Milestone>
  );
};
