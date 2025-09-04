import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, AlertTriangle, Info } from "lucide-react";

interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function AdminNotifications() {
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "warning",
      title: "Pending Approvals",
      message: "5 legs are waiting for approval",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false
    },
    {
      id: "2", 
      type: "info",
      title: "Week Status",
      message: "Week 12 locks in 2 days",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false
    },
    {
      id: "3",
      type: "success",
      title: "Data Updated",
      message: "NFL odds have been refreshed",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      read: true
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "error": return <X className="h-4 w-4 text-red-500" />;
      case "success": return <Check className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Recent system alerts and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                notification.read 
                  ? 'bg-muted/30 border-border' 
                  : 'bg-background border-primary/20'
              }`}
            >
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{notification.title}</p>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatTimestamp(notification.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {unreadCount > 0 && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full">
              Mark all as read
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}