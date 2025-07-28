import { api } from "@/src/api/config";
import { API_ENDPOINTS } from "@/src/constants/const";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type:
    | "assessment_reminder"
    | "music_update"
    | "vital_signs_alert"
    | "app_update"
    | "wellness_tip"
    | "chat_suggestion";
  read: boolean;
  priority: "low" | "medium" | "high";
  data: any;
  createdAt: string;
  updatedAt: string;
}

class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Récupérer les notifications (avec données mock pour l'instant)
  async getNotifications(
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    try {
      // Tentative d'appel à l'API réelle
      const response = await api.get(API_ENDPOINTS.notifications.list, {
        params: { unreadOnly },
      });

      if (response.data.success) {
        return {
          notifications: response.data.notifications,
          unreadCount: response.data.unreadCount,
        };
      }

      throw new Error("Failed to fetch notifications");
    } catch (error) {
      console.error("Error fetching notifications, using mock data:", error);

      // Retourner des données mock en cas d'erreur
      const mockNotifications = this.getMockNotifications();
      const unreadCount = mockNotifications.filter((n) => !n.read).length;

      return {
        notifications: mockNotifications,
        unreadCount,
      };
    }
  }

  // Données mock pour les tests
  private getMockNotifications(): Notification[] {
    return [
      {
        _id: "1",
        title: "🚀 Nouvelle fonctionnalité disponible",
        message: "Découvrez l'analyse des signes vitaux améliorée !",
        type: "app_update",
        read: false,
        priority: "medium",
        data: { version: "2.1.0" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "2",
        title: "🎵 Nouvelle musique relaxante",
        message:
          "De nouveaux sons apaisants ont été ajoutés à votre bibliothèque",
        type: "music_update",
        read: false,
        priority: "low",
        data: { category: "meditation" },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: "3",
        title: "💡 Conseil bien-être",
        message: "Prenez 5 minutes pour respirer profondément et vous détendre",
        type: "wellness_tip",
        read: true,
        priority: "low",
        data: {},
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await api.post(
        API_ENDPOINTS.notifications.markAsRead(notificationId)
      );
      return response.data.success;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await api.post(
        API_ENDPOINTS.notifications.markAllAsRead
      );
      return response.data.success;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }
}

export default NotificationService;
