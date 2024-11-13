import { useEffect } from 'react';

export const useNotifications = (assignments) => {
  useEffect(() => {
    if (!("Notification" in window)) {
      return;
    }

    const checkPermission = async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return;
      }

      assignments.forEach(assignment => {
        if (assignment.status === 'pending') {
          const dueDate = new Date(assignment.due_date);
          const now = new Date();
          const timeUntilDue = dueDate - now;

          if (timeUntilDue <= 86400000 && timeUntilDue > 0) {
            const notification = new Notification("Assignment Due Soon!", {
              body: `${assignment.title} is due within 24 hours!`,
              icon: "/favicon.ico",
              tag: assignment._id // Prevent duplicate notifications
            });

            notification.onclick = () => {
              window.focus();
              window.location.href = `/assignments/${assignment.course_id}`;
            };
          }
        }
      });
    };

    checkPermission();
  }, [assignments]);
};