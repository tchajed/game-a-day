#!/usr/bin/env python3

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from playtest import Scenario, parse_player_action, run_playtest  # noqa: E402


class ParsePlayerActionTests(unittest.TestCase):
    def test_plain_json(self) -> None:
        self.assertEqual(
            parse_player_action(
                '{"message":"Hello", "stop":false, "reason":"greet"}'
            ),
            {"message": "Hello", "stop": False, "reason": "greet"},
        )

    def test_fenced_json(self) -> None:
        parsed = parse_player_action(
            'Result:\n```json\n{"message":"Bye", "stop":true, "reason":"done"}\n```'
        )
        self.assertTrue(parsed["stop"])
        self.assertEqual(parsed["message"], "Bye")

    def test_malformed_output_remains_visible(self) -> None:
        parsed = parse_player_action("Could you clarify?")
        self.assertEqual(parsed["message"], "Could you clarify?")
        self.assertFalse(parsed["stop"])
        self.assertEqual(parsed["reason"], "unparsed response")


class IsolationTests(unittest.TestCase):
    def test_story_receives_no_controller_setup(self) -> None:
        scenario = Scenario(
            version="fixture",
            slug="fixture",
            title="Fixture",
            role_label="Neighbor",
            briefing="Ask the neighbor about the beach.",
            hidden_prompt="Act as a neighbor and greet the player.",
            base_dir=ROOT,
        )
        turns, evaluation, stop_reason = run_playtest(
            scenario,
            "fixture-style",
            "Be methodical and mention no test machinery.",
            max_turns=3,
            model="gpt-5.6-sol",
            thinking="medium",
            timeout=5,
            pi_command=str(ROOT / "tests" / "fake_pi.py"),
            evaluate=False,
        )
        self.assertIsNone(evaluation)
        self.assertIn("leaked=false", turns[0].text)
        self.assertEqual(turns[1].text, "What did you notice?")
        self.assertEqual(
            turns[2].text, "Story received exactly: What did you notice?"
        )
        self.assertEqual(stop_reason, "fixture complete")


if __name__ == "__main__":
    unittest.main()
