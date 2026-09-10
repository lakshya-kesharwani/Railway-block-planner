import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { can } from '../../utils/permissions';
import { Header } from '../common/Header';
import { AccessRestricted } from '../common/AccessRestricted';
import { WhatIfSimulatorView } from './WhatIfSimulatorView';
import { NewRequestModal } from '../requests/NewRequestModal';

export const WhatIfSimulatorPage: React.FC = () => {
  const { role, setActiveView } = useApp();
  const navigate = useNavigate();

  const handleBackToSchedule = () => {
    setActiveView('gantt');
    navigate('/schedule-and-map');
  };

  return (
    <div className="h-screen bg-railway-bg flex flex-col text-slate-100 selection:bg-railway-orange selection:text-white overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto h-full railway-grid-pattern">
          <div className="w-full mx-auto max-w-7xl pb-8">
            {!can(role, 'canOptimize') ? (
              <AccessRestricted 
                moduleName="What-If Simulator" 
                onReturn={handleBackToSchedule}
              />
            ) : (
              <WhatIfSimulatorView standalone />
            )}
          </div>
        </main>
      </div>

      <NewRequestModal />
    </div>
  );
};

export default WhatIfSimulatorPage;
