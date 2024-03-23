import { Missions } from '@/desk/Missions';
import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/desk/_authenticated/')({
  component: Missions,
});
