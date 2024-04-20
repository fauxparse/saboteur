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
import { ImageUploader } from './ImageUploader';
import { omit } from 'lodash-es';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/firebase';

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
      image: agent.image || null,
    },
    onSubmit: async ({ value }) => {
      setBusy(true);

      let agentId = agent.id;

      if (agentId) {
        await updateAgent({ id: agentId, ...omit(value, 'image') });
      } else {
        const doc = await createAgent(value as Partial<Agent>);
        agentId = doc.id;
      }

      if (agentId && value.image !== agent.image) {
        if (value.image) {
          const storageRef = ref(storage, `agents/${agentId}.jpg`);
          const res = await fetch(value.image);
          const blob = await res.blob();
          await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(storageRef);
          await updateAgent({ id: agentId, image: url });
        } else {
          await updateAgent({ id: agentId, image: null });
        }
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
          <Box
            display="grid"
            style={{
              gridTemplateColumns: '242px 1fr',
              gridTemplateRows: 'auto 1fr',
              gap: '1rem',
              alignItems: 'start',
            }}
          >
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
            </Stack>
            <form.Field
              name="color"
              children={(field) => (
                <>
                  <Box style={{ gridColumn: '1' }}>
                    <ColorPicker
                      withPicker={false}
                      swatches={swatches}
                      value={field.state.value}
                      onChange={(v) => {
                        const color = COLORS[swatches.indexOf(v)];
                        field.handleChange(color);
                      }}
                    />
                  </Box>
                  <Button
                    style={{ gridColumn: '1 / -1' }}
                    color={field.state.value}
                    type="submit"
                    loading={busy}
                  >
                    Save
                  </Button>
                </>
              )}
            />
            <form.Field name="image">
              {(field) => (
                <ImageUploader
                  style={{
                    gridColumn: 2,
                    gridRow: '1 / span 2',
                  }}
                  url={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};
