import { useEffect, useState } from "react";

function Navbar() {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const token = localStorage.getItem("token");


    // ==========================================
    // GET NOTIFICATIONS
    // ==========================================

    const fetchNotifications = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:8000/notifications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch notifications");
            }

            const data = await response.json();

            setNotifications(data);

        } catch (error) {
            console.error(
                "Error fetching notifications:",
                error
            );
        }
    };


    // ==========================================
    // LOAD NOTIFICATIONS
    // ==========================================

    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, []);


    // ==========================================
    // MARK NOTIFICATION AS READ
    // ==========================================

    const markAsRead = async (notification) => {

        // If already read, do nothing
        if (notification.is_read) {
            return;
        }

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/notifications/${notification.id}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to mark notification as read"
                );
            }

            // Update frontend immediately
            setNotifications((previousNotifications) =>
                previousNotifications.map((item) =>
                    item.id === notification.id
                        ? {
                            ...item,
                            is_read: true
                        }
                        : item
                )
            );

        } catch (error) {
            console.error(
                "Error marking notification as read:",
                error
            );
        }
    };


    // ==========================================
    // DELETE NOTIFICATION
    // ==========================================

    const deleteNotification = async (notificationId) => {

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/notifications/${notificationId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to delete notification"
                );
            }

            // Remove notification immediately
            setNotifications((previousNotifications) =>
                previousNotifications.filter(
                    (notification) =>
                        notification.id !== notificationId
                )
            );

        } catch (error) {
            console.error(
                "Error deleting notification:",
                error
            );
        }
    };


    // ==========================================
    // COUNT UNREAD NOTIFICATIONS
    // ==========================================

    const unreadCount = notifications.filter(
        (notification) => !notification.is_read
    ).length;


    return (
        <div
            style={{
                height: "70px",
                background: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 30px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                position: "relative",
            }}
        >

            <h2>Dashboard</h2>


            {/* ======================================
                RIGHT SIDE
            ====================================== */}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "30px",
                }}
            >

                {/* ==================================
                    NOTIFICATION BELL
                ================================== */}

                <div
                    style={{
                        position: "relative",
                        cursor: "pointer",
                        fontSize: "28px",
                    }}
                    onClick={() =>
                        setShowNotifications(
                            !showNotifications
                        )
                    }
                >
                    🔔


                    {/* UNREAD COUNT */}

                    {unreadCount > 0 && (
                        <span
                            style={{
                                position: "absolute",
                                top: "-10px",
                                right: "-10px",
                                background: "#d33",
                                color: "white",
                                borderRadius: "50%",
                                width: "22px",
                                height: "22px",
                                fontSize: "13px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontWeight: "bold",
                            }}
                        >
                            {unreadCount}
                        </span>
                    )}

                </div>


                {/* WELCOME */}

                <div>
                    👤 Welcome
                </div>

            </div>


            {/* ======================================
                NOTIFICATION DROPDOWN
            ====================================== */}

            {showNotifications && (

                <div
                    style={{
                        position: "absolute",
                        top: "75px",
                        right: "70px",
                        width: "400px",
                        maxHeight: "450px",
                        overflowY: "auto",
                        background: "white",
                        borderRadius: "10px",
                        boxShadow:
                            "0 5px 20px rgba(0,0,0,0.2)",
                        zIndex: 1000,
                    }}
                >

                    {/* HEADER */}

                    <div
                        style={{
                            padding: "20px",
                            fontSize: "22px",
                            fontWeight: "bold",
                            borderBottom:
                                "1px solid #ddd",
                        }}
                    >
                        Notifications
                    </div>


                    {/* NO NOTIFICATIONS */}

                    {notifications.length === 0 && (

                        <div
                            style={{
                                padding: "25px",
                                textAlign: "center",
                                color: "#777",
                            }}
                        >
                            No notifications
                        </div>
                    )}


                    {/* NOTIFICATION LIST */}

                    {notifications.map(
                        (notification) => (

                            <div
                                key={notification.id}

                                onClick={() =>
                                    markAsRead(notification)
                                }

                                style={{
                                    padding: "18px 55px 18px 20px",
                                    borderBottom:
                                        "1px solid #eee",

                                    cursor:
                                        notification.is_read
                                            ? "default"
                                            : "pointer",

                                    background:
                                        notification.is_read
                                            ? "white"
                                            : "#f3f6ff",

                                    position: "relative",

                                    opacity:
                                        notification.is_read
                                            ? "0.65"
                                            : "1",
                                }}
                            >

                                {/* NOTIFICATION TYPE */}

                                <div
                                    style={{
                                        fontWeight: "bold",
                                        marginBottom: "8px",
                                        textTransform:
                                            "capitalize",
                                    }}
                                >
                                    {notification.notification_type}
                                </div>


                                {/* MESSAGE */}

                                <div
                                    style={{
                                        marginBottom: "10px",
                                    }}
                                >
                                    {notification.message}
                                </div>


                                {/* DATE */}

                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#777",
                                    }}
                                >
                                    {notification.created_at
                                        ? new Date(
                                            notification.created_at
                                        ).toLocaleString()
                                        : "Just now"
                                    }
                                </div>


                                {/* UNREAD RED DOT */}

                                {!notification.is_read && (

                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "25px",
                                            right: "45px",
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            background: "#d23c4a",
                                        }}
                                    />
                                )}


                                {/* DELETE BUTTON */}

                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();

                                        deleteNotification(
                                            notification.id
                                        );
                                    }}
                                    title="Delete notification"
                                    style={{
                                        position: "absolute",
                                        top: "18px",
                                        right: "12px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        fontSize: "18px",
                                    }}
                                >
                                    🗑️
                                </button>

                            </div>
                        )
                    )}

                </div>
            )}

        </div>
    );
}

export default Navbar;