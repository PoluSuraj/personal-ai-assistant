import { useEffect, useState } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { FaDownload } from "react-icons/fa";

export default function InstallAppButton({ size = "sm", variant = "outline" }) {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    setInstalled(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) {
      toast({ title: "Install from your browser menu", description: "Choose Install app or Add to Home Screen. On iPhone, use Share, then Add to Home Screen.", status: "info", duration: 5000, isClosable: true });
      return;
    }
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  };

  if (installed) return null;
  return <Button size={size} variant={variant} leftIcon={<FaDownload />} onClick={install}>Install app</Button>;
}
