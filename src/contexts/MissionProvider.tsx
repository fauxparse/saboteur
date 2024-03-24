import { db } from '@/firebase';
import { MissionFirebaseSchema, parseMission } from '@/hooks/useMissions';
import { Mission } from '@/types';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

type Context = {
  mission: Mission;
  updateMission: (mission: Pick<Mission, 'id'> & Partial<Mission>) => void;
};

type MissionProviderProps = PropsWithChildren<{ mission: Mission }>;

export const MissionContext = createContext<Context>({} as Context);

export const MissionProvider: React.FC<MissionProviderProps> = ({ mission: initial, children }) => {
  const [mission, setMission] = useState(initial);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'missions', initial.id), (doc) => {
      setMission(parseMission(doc));
    });
    return unsubscribe;
  }, [initial]);

  const updateMission = useCallback(async (mission: Pick<Mission, 'id'> & Partial<Mission>) => {
    await updateDoc(doc(db, 'missions', mission.id), MissionFirebaseSchema.parse(mission));
  }, []);

  const value = useMemo(() => ({ mission, updateMission }), [mission, updateMission]);

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
};

export const useMission = () => useContextSelector(MissionContext, (v) => v);
