import pytest
from backend.app.services.settler import settlement_worker

def test_settle_match_winner_home_win():
    # 2 - 1 -> Home win
    res = settlement_worker.evaluate_settlement(
        market="Match Winner (1X2)",
        selection="Home win",
        fixture_status="FINISHED",
        home_goals=2,
        away_goals=1
    )
    assert res == "WON"

    # 1 - 2 -> Home win lost
    res_lost = settlement_worker.evaluate_settlement(
        market="Match Winner (1X2)",
        selection="Home win",
        fixture_status="FINISHED",
        home_goals=1,
        away_goals=2
    )
    assert res_lost == "LOST"

def test_settle_match_winner_draw():
    res = settlement_worker.evaluate_settlement(
        market="Match Winner (1X2)",
        selection="Draw",
        fixture_status="FINISHED",
        home_goals=1,
        away_goals=1
    )
    assert res == "WON"

    res_lost = settlement_worker.evaluate_settlement(
        market="Match Winner (1X2)",
        selection="Draw",
        fixture_status="FINISHED",
        home_goals=2,
        away_goals=1
    )
    assert res_lost == "LOST"

def test_settle_over_under():
    # 2 + 1 = 3 -> Over 2.5 is WON
    res = settlement_worker.evaluate_settlement(
        market="Over/Under 2.5 Goals",
        selection="Over 2.5",
        fixture_status="FINISHED",
        home_goals=2,
        away_goals=1
    )
    assert res == "WON"

    # 1 + 0 = 1 -> Over 2.5 is LOST
    res_under = settlement_worker.evaluate_settlement(
        market="Over/Under 2.5 Goals",
        selection="Over 2.5",
        fixture_status="FINISHED",
        home_goals=1,
        away_goals=0
    )
    assert res_under == "LOST"

def test_settle_both_teams_to_score():
    res_won = settlement_worker.evaluate_settlement(
        market="Both Teams to Score",
        selection="Yes",
        fixture_status="FINISHED",
        home_goals=1,
        away_goals=1
    )
    assert res_won == "WON"

    res_lost = settlement_worker.evaluate_settlement(
        market="Both Teams to Score",
        selection="Yes",
        fixture_status="FINISHED",
        home_goals=3,
        away_goals=0
    )
    assert res_lost == "LOST"

def test_settle_postponed_match():
    res = settlement_worker.evaluate_settlement(
        market="Match Winner (1X2)",
        selection="Home win",
        fixture_status="POSTPONED",
        home_goals=None,
        away_goals=None
    )
    assert res == "POSTPONED"
