import { useDustClient } from "../useDustClient";

export function Map() {
  const { data: dustClient } = useDustClient();

  return <div className="max-w-screen-sm mx-auto space-y-8 p-8">Map</div>;
}
