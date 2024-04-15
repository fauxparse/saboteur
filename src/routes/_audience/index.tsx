import { App } from '@/audience/App';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_audience/')({
  component: App,
});
