import { useAgents } from '@/contexts/AgentsProvider';
import { Agent, COLORS } from '@/types/Agent';
import {
  Box,
  Button,
  ColorPicker,
  Modal,
  ModalProps,
  Stack,
  TextInput,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@tanstack/react-form';
import { useEffect, useMemo, useState } from 'react';

type AgentInfoProps = ModalProps & {
  agent: Partial<Agent>;
};

export const AgentInfo: React.FC<AgentInfoProps> = ({ agent, opened, onClose, ...props }) => {
  const { createAgent, updateAgent } = useAgents();
  const [busy, setBusy] = useState(false);

  const theme = useMantineTheme();

  const swatches = useMemo(() => COLORS.map((c) => theme.colors[c][6]), [theme.colors]);

  const form = useForm({
    defaultValues: {
      name: agent.name,
      color: (agent.id && (String(agent.color) as Agent['color'])) || undefined,
    },
    onSubmit: async ({ value }) => {
      setBusy(true);
      if (agent.id) {
        await updateAgent({ id: agent.id, ...value });
      } else {
        await createAgent(value as Partial<Agent>);
      }
      setBusy(false);
      onClose();
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
    }
  }, [opened, form]);

  return (
    <Modal
      centered
      title={agent.id ? 'Edit agent' : 'New agent'}
      opened={opened}
      onClose={onClose}
      {...props}
    >
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
            <form.Field
              name="color"
              children={(field) => (
                <>
                  <ColorPicker
                    withPicker={false}
                    swatches={swatches}
                    value={field.state.value}
                    onChange={(v) => {
                      const color = COLORS[swatches.indexOf(v)];
                      field.handleChange(color);
                    }}
                  />
                  <Button color={field.state.value} type="submit" loading={busy}>
                    Save
                  </Button>
                </>
              )}
            />
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};
