import { Scene } from '@/types/Event';
import { Milestone } from './Milestone';
import { IconMasksTheater, IconTrash } from '@tabler/icons-react';
import { Checkbox, Group, Menu, TextInput } from '@mantine/core';
import { useForm } from '@tanstack/react-form';
import { useAgents } from '@/contexts/AgentsProvider';

type SceneBlockProps = {
  event: Scene;
  onDelete: (scene: Scene) => void;
};

export const SceneBlock: React.FC<SceneBlockProps> = ({ event: scene, onDelete }) => {
  const { saboteur } = useAgents();

  const form = useForm({
    defaultValues: {
      name: '',
      sabotaged: false,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  return (
    <Milestone
      icon={<IconMasksTheater />}
      time={scene.startsAt}
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
              onChange={(e) => field.handleChange(e.currentTarget.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
        <form.Field name="sabotaged">
          {(field) => (
            <Checkbox
              label="Sabotaged?"
              color={saboteur?.color || undefined}
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.currentTarget.checked)}
            />
          )}
        </form.Field>
      </Group>
    </Milestone>
  );
};
