import axios from "axios";
import { api } from "@/src/api/config";

export interface Notification {
  id: string;
  type: "reminder" | "achievement" | "health_alert" | "assessment" | "system";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    assessmentId?: string;
    heartRate?: number;
    stressLevel?: number;
    [key: string]: any;
  };
}

class NotificationService {
  private static instance: NotificationService;
  private mockNotifications: Notification[] = [
    {
      id: "1",
      type: "reminder",
      title: "Daily Check-in",
      message: "Time for your daily mental health assessment",
      timestamp: Date.now() - 3600000,
      read: false,
      actionUrl: "/assessment",
    },
    {
      id: "2",
      type: "health_alert",
      title: "Elevated Heart Rate",
      message:
        "Your heart rate has been elevated. Consider some relaxation exercises.",
      timestamp: Date.now() - 7200000,
      read: false,
      metadata: {
        heartRate: 95,
      },
    },
    {
      id: "3",
      type: "achievement",
      title: "7-Day Streak! 🎉",
      message:
        "Congratulations! You've completed assessments for 7 days in a row.",
      timestamp: Date.now() - 86400000,
      read: true,
    },
  ];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async getNotifications(userToken?: string): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> {
    try {
      console.log("🔔 Fetching notifications from backend...");

      // ✅ Use the configured api instance which already has the token
      const response = await api.get("/api/notifications");

      console.log("✅ Notifications response:", response.data);

      if (response.data.success && response.data.notifications) {
        const notifications = response.data.notifications;
        const unreadCount = notifications.filter(
          (n: Notification) => !n.read
        ).length;

        return {
          notifications,
          unreadCount,
        };
      } else {
        // Fallback to mock data if no notifications
        console.log("⚠️ No notifications from backend, using mock data");
        return this.getMockNotifications();
      }
    } catch (error) {
      console.log("⚠️ Error fetching notifications, using mock data:", error);

      // Return mock data instead of throwing error
      return this.getMockNotifications();
    }
  }

  private getMockNotifications(): {
    notifications: Notification[];
    unreadCount: number;
  } {
    const unreadCount = this.mockNotifications.filter((n) => !n.read).length;
    return {
      notifications: this.mockNotifications,
      unreadCount,
    };
  }

  public async markAsRead(
    notificationId: string,
    userToken?: string
  ): Promise<void> {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      console.log(`✅ Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
      // Update mock data locally
      const notification = this.mockNotifications.find(
        (n) => n.id === notificationId
      );
      if (notification) {
        notification.read = true;
      }
    }
  }

  public async markAllAsRead(userToken?: string): Promise<void> {
    try {
      // ✅ Corriger l'endpoint pour correspondre au backend
      await api.put("/api/notifications/mark-all-read");
      console.log("✅ Marked all notifications as read");
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
      // Update mock data locally
      this.mockNotifications.forEach((n) => (n.read = true));
    }
  }

  public async deleteNotification(
    notificationId: string,
    userToken?: string
  ): Promise<void> {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      console.log(`✅ Deleted notification ${notificationId}`);
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
      // Remove from mock data locally
      const index = this.mockNotifications.findIndex(
        (n) => n.id === notificationId
      );
      if (index > -1) {
        this.mockNotifications.splice(index, 1);
      }
    }
  }

  // Helper method to create notifications (for future backend integration)
  public async createNotification(
    notification: Omit<Notification, "id" | "timestamp" | "read">,
    userToken?: string
  ): Promise<void> {
    try {
      await api.post("/api/notifications", notification);
      console.log("✅ Created notification:", notification.title);
    } catch (error) {
      console.error("❌ Error creating notification:", error);
    }
  }
}

export default NotificationService;
