import { createFileRoute } from '@tanstack/react-router';
import { MissionSelector } from '@/agent/MissionSelector';

export const Route = createFileRoute('/agent/_missions/')({
  component: MissionSelector,
});
