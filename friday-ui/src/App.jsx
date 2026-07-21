import './index.css';
import { OrbProvider } from './hooks/useOrbState';
import LockScreen from './components/LockScreen/LockScreen';
import Workspace from './UI/Workspace';
import DebugKeys from './components/Debug/DebugKeys';
import SpotifyCard from './components/Panels/SpotifyCard';
import { FridayProvider } from './context/FridayContext';
import FridaySync from './context/FridaySync';

export default function App() {
    return (
        <FridayProvider>
            <OrbProvider>
                <FridaySync />
                <LockScreen />
                <Workspace />
                <SpotifyCard />
                <DebugKeys />
            </OrbProvider>
        </FridayProvider>
    );
}
