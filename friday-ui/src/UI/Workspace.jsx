import { AnimatePresence } from 'framer-motion';
import { useOrbState } from '../hooks/useOrbState';
import Dashboard from './Dashboard/Dashboard';

// Overlays the active workspace panel on top of the ambient LockScreen
// (Background + orb) based on the `workspace` state driven by voice commands.
export default function Workspace() {
    const { workspace, setWorkspace } = useOrbState();

    if (workspace === 'lockscreen') return null;

    return (
        <div className="absolute inset-0" style={{ zIndex: 40, pointerEvents: 'auto' }}>
            <AnimatePresence mode="wait">
                {workspace === 'dashboard' && (
                    <Dashboard key="dashboard" onLock={() => setWorkspace('lockscreen')} />
                )}
            </AnimatePresence>
        </div>
    );
}
