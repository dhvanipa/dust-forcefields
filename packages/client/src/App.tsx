import { Synced } from "./mud/Synced";
import { Map } from "./app/Map";
import { useDustClient } from "./useDustClient";

export function App() {
  useDustClient();
  return (
    <div className="min-h-screen text-white bg-slate-800">
      <Synced
        fallback={({ message, percentage }) => (
          <div className="fixed inset-0 grid place-items-center p-4 tabular-nums">
            {message} ({percentage.toFixed(1)}%)…
          </div>
        )}
      >
        <Map />
      </Synced>
    </div>
  );
}
