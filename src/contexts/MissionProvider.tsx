import { Mission } from '@/types';
import { PropsWithChildren, createContext, useContext } from 'react';

type Context = { mission: Mission };

type MissionProviderProps = PropsWithChildren<Context>;

const MissionContext = createContext<Context>({} as Context);

export const MissionProvider: React.FC<MissionProviderProps> = ({ mission, children }) => (
  <MissionContext.Provider value={{ mission }}>{children}</MissionContext.Provider>
);

export const useMission = () => useContext(MissionContext);
