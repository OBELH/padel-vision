"""Notification service — create and manage user notifications."""

import uuid

from sqlalchemy.orm import Session

from models.notification import Notification
from models.user import User


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    type: str,
    title: str,
    message: str,
    link: str | None = None,
) -> Notification:
    """Create a notification for a user."""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notif)
    db.flush()
    return notif


def notify_highlights_ready(
    db: Session,
    match_id: uuid.UUID,
    highlights_count: int,
    club_id: uuid.UUID | None = None,
) -> int:
    """
    Notify all relevant users that highlights are ready for a match.

    Targets:
    - All users linked to the club (club_admins)
    - All users linked to players in the match
    """
    from models.match_player import MatchPlayer

    # Find users to notify
    user_ids: set[uuid.UUID] = set()

    # Club admins
    if club_id:
        club_users = db.query(User).filter(
            User.club_id == club_id,
            User.is_active == True,
        ).all()
        for u in club_users:
            user_ids.add(u.id)

    # Players in the match → linked users
    match_players = db.query(MatchPlayer).filter(MatchPlayer.match_id == match_id).all()
    for mp in match_players:
        player_users = db.query(User).filter(
            User.player_id == mp.player_id,
            User.is_active == True,
        ).all()
        for u in player_users:
            user_ids.add(u.id)

    # If no specific users found, notify all active users (small app scenario)
    if not user_ids:
        all_users = db.query(User).filter(User.is_active == True).all()
        user_ids = {u.id for u in all_users}

    # Create notifications
    count = 0
    for uid in user_ids:
        create_notification(
            db=db,
            user_id=uid,
            type="highlights_ready",
            title="Highlights prêts ! 🎬",
            message=f"{highlights_count} highlight{'s' if highlights_count > 1 else ''} détecté{'s' if highlights_count > 1 else ''} par l'IA",
            link=f"/match/{match_id}",
        )
        count += 1

    return count


def notify_welcome(db: Session, user_id: uuid.UUID, full_name: str) -> Notification:
    """Send a welcome notification to a new user."""
    return create_notification(
        db=db,
        user_id=user_id,
        type="welcome",
        title="Bienvenue sur Padel Vision ! 🎾",
        message=f"Salut {full_name} ! Explorez vos matchs et partagez vos meilleurs moments.",
        link="/dashboard/club",
    )
