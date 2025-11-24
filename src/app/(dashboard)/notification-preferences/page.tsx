"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FormSuccess, FormError } from "@/components/ui/form-messages";

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    // push_notifications: true,
    in_app_notifications: true,
  });

  const [formState, setFormState] = useState<{
    success?: string;
    error?: string;
  }>({});

  useEffect(() => {
    const loadPrefs = async () => {
      const res = await axios.get("/api/notification-preferences", {
        withCredentials: true,
      });
      if (res.data?.success && res.data?.data) {
        setPrefs(res.data.data);
      }
    };
    loadPrefs();
  }, []);

  const handleSave = async () => {
    try {
      const response = await axios.post(
        "/api/notification-preferences",
        prefs,
        { withCredentials: true },
      );

      console.log(response, "response");
      if (response.data.success) {
        setFormState({
          success: "Preferences saved successfully",
        });
      } else {
        setFormState({
          error: response.data?.message || "Failed to save preferences.",
        });
      }
    } catch (error) {
      console.error("Error saving preferences", error);
      setFormState({
        error: "Network error: unable to save preferences.",
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />
      <h2 className="text-lg font-semibold">Notification Preferences</h2>

      <div className="flex justify-between items-center">
        <h3>Email Notifications</h3>
        <Switch
          checked={prefs.email_notifications}
          onCheckedChange={(v) =>
            setPrefs({ ...prefs, email_notifications: v })
          }
        />
      </div>

      <div className="flex justify-between items-center">
        <h3>In-App Notifications</h3>
        <Switch
          checked={prefs.in_app_notifications}
          onCheckedChange={(v) =>
            setPrefs({ ...prefs, in_app_notifications: v })
          }
        />
      </div>

      {/* <div className="flex justify-between items-center">
                <h3>Push Notifications</h3>
                <Switch
                    checked={prefs.push_notifications}
                    onCheckedChange={(v) => setPrefs({ ...prefs, push_notifications: v })}
                />
            </div> */}

      <Button onClick={handleSave}>Save Preferences</Button>
    </div>
  );
}
