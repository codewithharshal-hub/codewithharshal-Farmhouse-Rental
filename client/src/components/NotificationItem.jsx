import { iconFor, timeAgo } from "../utils/notifications";

export default function NotificationItem({ n, onOpen }) {
    return (
        <button type="button" className={`nt-item ${n.read ? "" : "unread"}`} onClick={() => onOpen(n)}>
            <span className="nt-ico" aria-hidden="true">{iconFor(n.type)}</span>

            <span className="nt-body">
                <span className="nt-title">{n.title}</span>
                {n.message && <span className="nt-msg">{n.message}</span>}
                <span className="nt-time">{timeAgo(n.createdAt)}</span>
            </span>

            {!n.read && <span className="nt-dot" aria-label="Unread" />}
        </button>
    );
}