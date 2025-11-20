import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Card } from "@/components/ui/card";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else if (wasOffline) {
      // Mostrar brevemente quando voltar online
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top">
      <Card
        className={`p-3 shadow-lg border-2 ${
          isOnline
            ? "bg-green-500/10 border-green-500/50"
            : "bg-orange-500/10 border-orange-500/50"
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                Conectado - Sincronizando dados...
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">
                Modo Offline - Dados serão sincronizados quando voltar online
              </span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OfflineIndicator;

