import { useSyncStatus } from "./mud/useSyncStatus";
import { Map } from "./app/Map";

export default function App() {
  const syncStatus = useSyncStatus();

  if (!syncStatus.isLive) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <p className="text-center text-white">
          Syncing ({syncStatus.percentage}%)...
        </p>
      </div>
    );
  }

  return <Map />;
}
