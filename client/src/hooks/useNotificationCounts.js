import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";

const ADMIN_EMAILS = ["21a91a0547@gmail.com", "21a91a0547@aec.edu.in"];

export default function useNotificationCounts(user) {
  const [counts, setCounts] = useState({ userUnread: 0, adminUnread: 0, inboxUnread: 0 });
  const [loading, setLoading] = useState(false);
  const isAdmin = useMemo(
    () => Boolean(user?.isAdmin) || ADMIN_EMAILS.includes(String(user?.email || "").toLowerCase()),
    [user]
  );

  useEffect(() => {
    let active = true;

    const loadCounts = async () => {
      if (!user?.email) {
        if (active) {
          setCounts({ userUnread: 0, adminUnread: 0, inboxUnread: 0 });
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const notificationsPromise = apiFetch("/api/v1/notifications");
        const inboxPromise = isAdmin ? apiFetch("/api/v1/contact/all") : Promise.resolve({ data: [] });
        const [notificationData, inboxData] = await Promise.all([notificationsPromise, inboxPromise]);

        if (!active) return;

        const notifications = notificationData?.data || [];
        const userUnread = notifications.filter((item) => item.status === "unread").length;
        const adminUnread = isAdmin
          ? notifications.filter((item) => item.status === "unread" && ["admin", "broadcast"].includes(item.audience)).length
          : 0;
        const inboxUnread = isAdmin
          ? (inboxData?.data || []).filter((item) => item.status === "new").length
          : 0;

        setCounts({ userUnread, adminUnread, inboxUnread });
      } catch {
        if (active) {
          setCounts({ userUnread: 0, adminUnread: 0, inboxUnread: 0 });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCounts();
    const interval = setInterval(loadCounts, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin, user?.email]);

  return { ...counts, isAdmin, loading };
}
