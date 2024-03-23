import { useMission } from '@/contexts/MissionProvider';
import { useAgents } from '@/hooks/useAgents';
import { Agent } from '@/types';
import { Box, Button, Modal, ModalProps, Stack, TextInput } from '@mantine/core';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';

type AgentInfoProps = ModalProps & {
  agent: Agent;
};

export const AgentInfo: React.FC<AgentInfoProps> = ({ agent, onClose, ...props }) => {
  const { mission } = useMission();
  const { createAgent } = useAgents(mission);
  const [busy, setBusy] = useState(false);

  const form = useForm({
    defaultValues: {
      name: agent.name,
    },
    onSubmit: async ({ value }) => {
      setBusy(true);
      if (!agent.id) {
        await createAgent(value.name);
      }
      setBusy(false);
      onClose();
    },
  });

  return (
    <Modal centered title={agent.id ? 'Edit agent' : 'New agent'} onClose={onClose} {...props}>
      <Box
        component="form"
        display="contents"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Box component="fieldset" display="contents" disabled={busy || undefined}>
          <Stack>
            <form.Field
              name="name"
              children={(field) => (
                <TextInput
                  label="Name"
                  data-autofocus
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            />
            <Button type="submit" loading={busy}>
              Save
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};
