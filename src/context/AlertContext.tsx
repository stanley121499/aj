import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type AlertType = "info" | "success" | "warning" | "error";

type AlertContextType = {
  message: string;
  type: AlertType;
  showAlert: (message: string, type: AlertType) => void;
  hideAlert: () => void;
  visible: boolean;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

/**
 * Global toast/alert provider. showAlert/hideAlert are stable so data contexts
 * can safely depend on them without refetch loops.
 */
export const AlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AlertType>("success");
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((nextMessage: string, nextType: AlertType) => {
    setMessage(nextMessage);
    setType(nextType);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setMessage("");
    setType("info");
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible]);

  const value = useMemo(
    () => ({
      message,
      type,
      showAlert,
      hideAlert,
      visible,
    }),
    [message, type, showAlert, hideAlert, visible]
  );

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
