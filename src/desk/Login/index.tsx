import { app } from '@/firebase';
import { Alert, Box, Button, Center, Stack, TextInput } from '@mantine/core';
import { useForm } from '@tanstack/react-form';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useState } from 'react';
import classes from './Login.module.css';

export const Login: React.FC = () => {
  const [loggingIn, setLoggingIn] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: ({ value: { email, password } }) => {
      const auth = getAuth(app);
      setLoggingIn(true);
      setError(null);
      setPersistence(auth, browserLocalPersistence).then(() => {
        signInWithEmailAndPassword(auth, email, password)
          .then(() => {
            setLoggingIn(false);
          })
          .catch((error) => {
            setError(error.message);
            setLoggingIn(false);
          });
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Center pos="fixed" inset={0}>
        <Box className={classes.fieldset} component="fieldset" disabled={loggingIn || undefined}>
          <Stack w="20rem">
            {error && <Alert>Sorry, that didn’t work. Please try again (but differently).</Alert>}
            <form.Field
              name="email"
              children={(field) => (
                <TextInput
                  label="Email"
                  autoFocus
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
              )}
            />
            <form.Field
              name="password"
              children={(field) => (
                <TextInput
                  label="Password"
                  type="password"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                />
              )}
            />
            <Button type="submit" variant="solid">
              Login
            </Button>
          </Stack>
        </Box>
      </Center>
    </form>
  );
};
