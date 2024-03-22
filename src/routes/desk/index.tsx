import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/desk/')({
  component: () => <div>Hello /desk/!</div>,
});
