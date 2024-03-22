import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/agent/')({
  component: () => <div>Hello /agent/!</div>,
});
