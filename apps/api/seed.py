"""Seed the database with demo data."""
import uuid
from datetime import datetime, timedelta

from db.base import Base
from db.session import engine, SessionLocal
from models import Club, Player, Match, MatchPlayer, Highlight

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Club).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    # Clubs
    club1_id = uuid.uuid4()
    club2_id = uuid.uuid4()
    clubs = [
        Club(id=club1_id, name="Padel Club Paris", address="12 Rue du Sport", city="Paris", email="contact@padelclubparis.fr", courts_count=6),
        Club(id=club2_id, name="Barcelona Padel Center", address="Carrer del Padel 42", city="Barcelona", email="info@bcnpadel.es", courts_count=8),
    ]

    # Players
    player_ids = [uuid.uuid4() for _ in range(8)]
    players = [
        Player(id=player_ids[0], email="omar@example.com", full_name="Omar Belhassine", nickname="El Patron", level="advanced", club_id=club1_id),
        Player(id=player_ids[1], email="lea@example.com", full_name="Léa Martinez", nickname="La Muraille", level="intermediate", club_id=club1_id),
        Player(id=player_ids[2], email="carlos@example.com", full_name="Carlos Ruiz", nickname="El Sniper", level="advanced", club_id=club1_id),
        Player(id=player_ids[3], email="sophie@example.com", full_name="Sophie Dubois", nickname="La Stratège", level="intermediate", club_id=club1_id),
        Player(id=player_ids[4], email="lucas@example.com", full_name="Lucas Bernard", nickname="Le Kamikaze", level="beginner", club_id=club1_id),
        Player(id=player_ids[5], email="nina@example.com", full_name="Nina Chen", nickname="Le Fantôme", level="intermediate", club_id=club1_id),
        Player(id=player_ids[6], email="marco@example.com", full_name="Marco Rossi", nickname="Il Muro", level="advanced", club_id=club2_id),
        Player(id=player_ids[7], email="anna@example.com", full_name="Anna Schmidt", nickname="Die Maschine", level="pro", club_id=club2_id),
    ]

    # Matches
    now = datetime.utcnow()
    match_ids = [uuid.uuid4() for _ in range(5)]
    matches = [
        Match(id=match_ids[0], club_id=club1_id, court_number=1, scheduled_at=now - timedelta(days=1, hours=2), status="completed", score_team_a="6-4 7-5", score_team_b="4-6 5-7", duration_minutes=72),
        Match(id=match_ids[1], club_id=club1_id, court_number=3, scheduled_at=now - timedelta(days=3), status="completed", score_team_a="6-3 6-2", score_team_b="3-6 2-6", duration_minutes=55),
        Match(id=match_ids[2], club_id=club1_id, court_number=2, scheduled_at=now - timedelta(hours=5), status="completed", score_team_a="4-6 6-4 7-6", score_team_b="6-4 4-6 6-7", duration_minutes=95),
        Match(id=match_ids[3], club_id=club1_id, court_number=1, scheduled_at=now + timedelta(hours=3), status="scheduled"),
        Match(id=match_ids[4], club_id=club2_id, court_number=5, scheduled_at=now - timedelta(days=2), status="completed", score_team_a="6-1 6-3", score_team_b="1-6 3-6", duration_minutes=48),
    ]

    # Match Players
    match_players = [
        # Match 1: Omar+Léa vs Carlos+Sophie
        MatchPlayer(match_id=match_ids[0], player_id=player_ids[0], team="A", position="right"),
        MatchPlayer(match_id=match_ids[0], player_id=player_ids[1], team="A", position="left"),
        MatchPlayer(match_id=match_ids[0], player_id=player_ids[2], team="B", position="right"),
        MatchPlayer(match_id=match_ids[0], player_id=player_ids[3], team="B", position="left"),
        # Match 2: Omar+Carlos vs Lucas+Nina
        MatchPlayer(match_id=match_ids[1], player_id=player_ids[0], team="A", position="right"),
        MatchPlayer(match_id=match_ids[1], player_id=player_ids[2], team="A", position="left"),
        MatchPlayer(match_id=match_ids[1], player_id=player_ids[4], team="B", position="right"),
        MatchPlayer(match_id=match_ids[1], player_id=player_ids[5], team="B", position="left"),
        # Match 3: Léa+Sophie vs Carlos+Lucas (epic 3-setter)
        MatchPlayer(match_id=match_ids[2], player_id=player_ids[1], team="A", position="right"),
        MatchPlayer(match_id=match_ids[2], player_id=player_ids[3], team="A", position="left"),
        MatchPlayer(match_id=match_ids[2], player_id=player_ids[2], team="B", position="right"),
        MatchPlayer(match_id=match_ids[2], player_id=player_ids[4], team="B", position="left"),
        # Match 4 (scheduled): Omar+Nina vs Léa+Lucas
        MatchPlayer(match_id=match_ids[3], player_id=player_ids[0], team="A", position="right"),
        MatchPlayer(match_id=match_ids[3], player_id=player_ids[5], team="A", position="left"),
        MatchPlayer(match_id=match_ids[3], player_id=player_ids[1], team="B", position="right"),
        MatchPlayer(match_id=match_ids[3], player_id=player_ids[4], team="B", position="left"),
        # Match 5 (Barcelona): Marco+Anna vs Omar+Carlos
        MatchPlayer(match_id=match_ids[4], player_id=player_ids[6], team="A", position="right"),
        MatchPlayer(match_id=match_ids[4], player_id=player_ids[7], team="A", position="left"),
        MatchPlayer(match_id=match_ids[4], player_id=player_ids[0], team="B", position="right"),
        MatchPlayer(match_id=match_ids[4], player_id=player_ids[2], team="B", position="left"),
    ]

    # Highlights
    highlights = [
        Highlight(match_id=match_ids[0], player_id=player_ids[0], timestamp_sec=320, type="smash", description="Smash croisé imparable depuis le filet"),
        Highlight(match_id=match_ids[0], player_id=player_ids[2], timestamp_sec=890, type="ace", description="Service gagnant dans le coin"),
        Highlight(match_id=match_ids[0], player_id=player_ids[1], timestamp_sec=1200, type="point", description="Lob parfait sur balle de set"),
        Highlight(match_id=match_ids[0], player_id=player_ids[0], timestamp_sec=2800, type="smash", description="Por tres incroyable pour conclure"),
        Highlight(match_id=match_ids[1], player_id=player_ids[0], timestamp_sec=150, type="point", description="Volée de revers chirurgicale"),
        Highlight(match_id=match_ids[1], player_id=player_ids[2], timestamp_sec=600, type="smash", description="Bandeja puissante depuis le fond"),
        Highlight(match_id=match_ids[2], player_id=player_ids[1], timestamp_sec=2400, type="point", description="Rallye de 30 échanges, point du match"),
        Highlight(match_id=match_ids[2], player_id=player_ids[3], timestamp_sec=3200, type="lob", description="Lob lobé au 3ème set, retournement total"),
        Highlight(match_id=match_ids[4], player_id=player_ids[7], timestamp_sec=500, type="smash", description="Vibora dévastatrice, point spectaculaire"),
        Highlight(match_id=match_ids[4], player_id=player_ids[6], timestamp_sec=1800, type="point", description="Chiquita parfaite en plein filet"),
    ]

    db.add_all(clubs)
    db.add_all(players)
    db.add_all(matches)
    db.add_all(match_players)
    db.add_all(highlights)
    db.commit()
    db.close()

    print(f"Seeded: {len(clubs)} clubs, {len(players)} players, {len(matches)} matches, {len(match_players)} match_players, {len(highlights)} highlights")


if __name__ == "__main__":
    seed()
