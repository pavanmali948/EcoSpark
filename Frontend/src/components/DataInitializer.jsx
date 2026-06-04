// DataInitializer.jsx - Component to initialize dummy data
import { useEffect } from 'react';
import { initializeDummyPumps, checkPumpsInitialized } from '../utils/initializeDummyData';

/**
 * This component auto-initializes dummy pump data when the app loads
 * Place it in your main App component
 */
const DataInitializer = () => {
    useEffect(() => {
        if (!checkPumpsInitialized()) {
            initializeDummyPumps();
        }
    }, []);

    return null; // This is an invisible component
};

export default DataInitializer;
