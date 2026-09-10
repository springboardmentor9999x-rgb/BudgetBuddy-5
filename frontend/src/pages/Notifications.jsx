import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";


// ==========================================================
// CONVERT BACKEND UTC TIME CORRECTLY
// ==========================================================

function parseNotificationDate(dateString) {

    if (!dateString) {
        return null;
    }

    let value = dateString;

    // Backend may return:
    // 2026-08-20T08:41:36
    //
    // Add Z so JavaScript understands it is UTC.
    if (
        typeof value === "string" &&
        !value.endsWith("Z") &&
        !value.includes("+")
    ) {
        value = value + "Z";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}


// ==========================================================
// LIVE TIME
// ==========================================================

function getTimeAgo(dateString) {

    const created = parseNotificationDate(dateString);

    if (!created) {
        return "Just now";
    }

    const now = new Date();

    const seconds = Math.floor(
        (now.getTime() - created.getTime()) / 1000
    );


    // Future timestamp protection
    if (seconds < 0) {
        return "Just now";
    }


    // Less than one minute
    if (seconds < 60) {
        return "Just now";
    }


    // Minutes
    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {

        return `${minutes} minute${
            minutes !== 1 ? "s" : ""
        } ago`;
    }


    // Hours
    const hours = Math.floor(minutes / 60);

    if (hours < 24) {

        return `${hours} hour${
            hours !== 1 ? "s" : ""
        } ago`;
    }


    // Days
    const days = Math.floor(hours / 24);

    if (days === 1) {
        return "Yesterday";
    }

    if (days < 7) {

        return `${days} days ago`;
    }


    return `${days} days ago`;
}


// ==========================================================
// EXACT DATE + TIME
// ==========================================================

function getExactDateTime(dateString) {

    const created = parseNotificationDate(dateString);

    if (!created) {
        return "Date unavailable";
    }

    return created.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }
    );
}


// ==========================================================
// NOTIFICATIONS
// ==========================================================

function Notifications() {

    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);

    // Used to refresh live time
    const [, setCurrentTime] = useState(new Date());

    const navigate = useNavigate();

    const token = localStorage.getItem("token");


    // ==========================================================
    // GET NOTIFICATIONS
    // ==========================================================

    const fetchNotifications = async () => {

        try {

            setLoading(true);

            const response = await fetch(
                "http://127.0.0.1:8000/notifications",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Failed to fetch notifications"
                );
            }


            const data = await response.json();


            // ==================================================
            // SORT NEWEST FIRST
            // ==================================================

            const sortedNotifications =
                [...data].sort((a, b) => {

                    const dateA =
                        parseNotificationDate(
                            a.created_at
                        );

                    const dateB =
                        parseNotificationDate(
                            b.created_at
                        );


                    if (!dateA && !dateB) {
                        return 0;
                    }

                    if (!dateA) {
                        return 1;
                    }

                    if (!dateB) {
                        return -1;
                    }


                    return (
                        dateB.getTime()
                        -
                        dateA.getTime()
                    );
                });


            setNotifications(
                sortedNotifications
            );

        } catch (error) {

            console.error(
                "Notification error:",
                error
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================================
    // LOAD NOTIFICATIONS
    // ==========================================================

    useEffect(() => {

        fetchNotifications();

    }, []);


    // ==========================================================
    // REFRESH LIVE TIME EVERY 30 SECONDS
    // ==========================================================

    useEffect(() => {

        const timer = setInterval(() => {

            setCurrentTime(
                new Date()
            );

        }, 30000);


        return () => {

            clearInterval(timer);

        };

    }, []);


    // ==========================================================
    // MARK AS READ
    // ==========================================================

    const markAsRead = async (
        notificationId
    ) => {

        try {

            const response = await fetch(
                `http://127.0.0.1:8000/notifications/${notificationId}/read`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Failed to mark notification as read"
                );
            }


            const updatedNotification =
                await response.json();


            setNotifications(
                previous =>
                    previous.map(
                        notification =>

                            notification.id ===
                            notificationId

                                ? updatedNotification

                                : notification
                    )
            );

        } catch (error) {

            console.error(
                "Mark as read error:",
                error
            );

            alert(
                "Unable to mark notification as read"
            );
        }
    };


    // ==========================================================
    // DELETE NOTIFICATION
    // ==========================================================

    const deleteNotification = async (
        notificationId
    ) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this notification?"
            );


        if (!confirmDelete) {
            return;
        }


        try {

            const response = await fetch(
                `http://127.0.0.1:8000/notifications/${notificationId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Failed to delete notification"
                );
            }


            setNotifications(
                previous =>
                    previous.filter(
                        notification =>
                            notification.id !==
                            notificationId
                    )
            );

        } catch (error) {

            console.error(
                "Delete notification error:",
                error
            );

            alert(
                "Unable to delete notification"
            );
        }
    };


    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {

        return (

            <div
                style={{
                    padding: "30px",
                }}
            >

                <h1>
                    🔔 Notifications
                </h1>

                <p>
                    Loading notifications...
                </p>

            </div>
        );
    }


    // ==========================================================
    // PAGE
    // ==========================================================

    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >
            <Sidebar />

            <main
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    padding: "30px",
                    boxSizing: "border-box",
                }}
            >

            {/* ==================================================
                HEADER
            ================================================== */}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    marginBottom: "25px",
                }}
            >

                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: "#1E3A8A",
                        color: "white",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "16px",
                    }}
                >
                    ← Back
                </button>


                <div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "32px",
                        }}
                    >
                        🔔 Notification History
                    </h1>


                    <p
                        style={{
                            marginTop: "5px",
                            color: "#64748b",
                        }}
                    >
                        View and manage all your notifications
                    </p>

                </div>

            </div>


            {/* ==================================================
                EMPTY
            ================================================== */}

            {notifications.length === 0 ? (

                <div
                    style={{
                        background: "white",
                        padding: "40px",
                        borderRadius: "10px",
                        textAlign: "center",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.1)",
                    }}
                >

                    <h3>
                        No Notifications
                    </h3>

                    <p>
                        You don't have any notifications yet.
                    </p>

                </div>

            ) : (

                <div
                    style={{
                        background: "white",
                        padding: "10px",
                        borderRadius: "10px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.1)",
                        overflowX: "auto",
                    }}
                >

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "17px",
                        }}
                    >

                        {/* ==================================================
                            HEADER
                        ================================================== */}

                        <thead>

                            <tr
                                style={{
                                    background:
                                        "#1E3A8A",
                                    color: "white",
                                }}
                            >

                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "left",
                                    }}
                                >
                                    Type
                                </th>


                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "left",
                                    }}
                                >
                                    Notification Message
                                </th>


                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "left",
                                    }}
                                >
                                    Time
                                </th>


                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "left",
                                    }}
                                >
                                    Date & Time
                                </th>


                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "center",
                                    }}
                                >
                                    Status
                                </th>


                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "center",
                                    }}
                                >
                                    Action
                                </th>

                            </tr>

                        </thead>


                        {/* ==================================================
                            NOTIFICATIONS
                        ================================================== */}

                        <tbody>

                            {notifications.map(
                                notification => (

                                    <tr
                                        key={
                                            notification.id
                                        }
                                        style={{
                                            borderBottom:
                                                "1px solid #ddd",

                                            background:
                                                notification.is_read
                                                    ? "white"
                                                    : "#f1f5f9",
                                        }}
                                    >

                                        {/* TYPE */}

                                        <td
                                            style={{
                                                padding:
                                                    "15px",
                                                fontWeight:
                                                    "bold",
                                                textTransform:
                                                    "capitalize",
                                            }}
                                        >
                                            {
                                                notification
                                                    .notification_type
                                            }
                                        </td>


                                        {/* MESSAGE */}

                                        <td
                                            style={{
                                                padding:
                                                    "15px",
                                                maxWidth:
                                                    "500px",
                                            }}
                                        >
                                            {
                                                notification
                                                    .message
                                            }
                                        </td>


                                        {/* LIVE TIME */}

                                        <td
                                            style={{
                                                padding:
                                                    "15px",
                                                whiteSpace:
                                                    "nowrap",
                                                color:
                                                    "#2563eb",
                                                fontWeight:
                                                    "500",
                                            }}
                                        >
                                            {getTimeAgo(
                                                notification
                                                    .created_at
                                            )}
                                        </td>


                                        {/* EXACT DATE */}

                                        <td
                                            style={{
                                                padding:
                                                    "15px",
                                                whiteSpace:
                                                    "nowrap",
                                                color:
                                                    "#64748b",
                                                fontSize:
                                                    "14px",
                                            }}
                                        >
                                            {getExactDateTime(
                                                notification
                                                    .created_at
                                            )}
                                        </td>


                                        {/* STATUS */}

                                        <td
                                            style={{
                                                padding:
                                                    "15px",
                                                textAlign:
                                                    "center",
                                            }}
                                        >

                                            {notification.is_read ? (

                                                <span
                                                    style={{
                                                        background:
                                                            "#dcfce7",
                                                        color:
                                                            "#166534",
                                                        padding:
                                                            "7px 12px",
                                                        borderRadius:
                                                            "20px",
                                                        fontWeight:
                                                            "bold",
                                                    }}
                                                >
                                                    Read
                                                </span>

                                            ) : (

                                                <span
                                                    style={{
                                                        background:
                                                            "#fee2e2",
                                                        color:
                                                            "#dc2626",
                                                        padding:
                                                            "7px 12px",
                                                        borderRadius:
                                                            "20px",
                                                        fontWeight:
                                                            "bold",
                                                    }}
                                                >
                                                    Unread
                                                </span>

                                            )}

                                        </td>


                                        {/* ACTION */}

                                        <td
                                            style={{
                                                padding:
                                                    "15px",
                                                textAlign:
                                                    "center",
                                            }}
                                        >

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "center",
                                                    gap:
                                                        "8px",
                                                    flexWrap:
                                                        "wrap",
                                                }}
                                            >

                                                {!notification.is_read && (

                                                    <button
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id
                                                            )
                                                        }
                                                        style={{
                                                            background:
                                                                "#f59e0b",
                                                            color:
                                                                "white",
                                                            border:
                                                                "none",
                                                            padding:
                                                                "8px 12px",
                                                            borderRadius:
                                                                "5px",
                                                            cursor:
                                                                "pointer",
                                                        }}
                                                    >
                                                        ✓ Mark Read
                                                    </button>

                                                )}


                                                <button
                                                    onClick={() =>
                                                        deleteNotification(
                                                            notification.id
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            "#dc2626",
                                                        color:
                                                            "white",
                                                        border:
                                                            "none",
                                                        padding:
                                                            "8px 12px",
                                                        borderRadius:
                                                            "5px",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >
                                                    🗑 Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}

            </main>
        </div>
    );
}

export default Notifications;