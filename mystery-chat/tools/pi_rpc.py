#!/usr/bin/env python3
"""Small, strict JSONL client for Pi's RPC mode."""

from __future__ import annotations

import json
import os
import selectors
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any


class PiRPCError(RuntimeError):
    pass


class PiRPC:
    """Run one isolated, tool-free Pi conversation."""

    def __init__(
        self,
        *,
        system_prompt: str,
        model: str = "gpt-5.6-sol",
        thinking: str = "medium",
        provider: str = "openai-codex",
        timeout_seconds: float = 180.0,
        pi_command: str = "pi",
    ) -> None:
        self.timeout_seconds = timeout_seconds
        self._stderr = tempfile.TemporaryFile(mode="w+b")
        env = os.environ.copy()
        # Do not make a child playtest look like a continuation of the parent Pi session.
        for key in (
            "PI_SESSION_ID",
            "PI_SESSION_FILE",
            "PI_MODEL",
            "PI_PROVIDER",
            "PI_REASONING_LEVEL",
        ):
            env.pop(key, None)
        env["PI_SKIP_VERSION_CHECK"] = "1"

        command = [
            pi_command,
            "--mode",
            "rpc",
            "--provider",
            provider,
            "--model",
            model,
            "--thinking",
            thinking,
            "--no-session",
            "--no-tools",
            "--no-context-files",
            "--no-extensions",
            "--no-skills",
            "--no-prompt-templates",
            "--no-themes",
            "--no-approve",
            "--system-prompt",
            system_prompt,
        ]
        self.process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=self._stderr,
            env=env,
        )
        if self.process.stdin is None or self.process.stdout is None:
            raise PiRPCError("Pi subprocess did not expose stdin/stdout")
        self._selector = selectors.DefaultSelector()
        self._selector.register(self.process.stdout, selectors.EVENT_READ)
        self._buffer = b""
        self._queued_events: list[dict[str, Any]] = []

    def __enter__(self) -> "PiRPC":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def _stderr_text(self) -> str:
        self._stderr.flush()
        self._stderr.seek(0)
        return self._stderr.read().decode("utf-8", errors="replace").strip()

    def _send(self, command: dict[str, Any]) -> None:
        if self.process.poll() is not None:
            raise PiRPCError(
                f"Pi exited with code {self.process.returncode}: {self._stderr_text()}"
            )
        payload = json.dumps(command, ensure_ascii=False).encode("utf-8") + b"\n"
        assert self.process.stdin is not None
        self.process.stdin.write(payload)
        self.process.stdin.flush()

    def _next_event(self, deadline: float) -> dict[str, Any]:
        if self._queued_events:
            return self._queued_events.pop(0)

        while True:
            newline = self._buffer.find(b"\n")
            if newline >= 0:
                line = self._buffer[:newline]
                self._buffer = self._buffer[newline + 1 :]
                if line.endswith(b"\r"):
                    line = line[:-1]
                if not line:
                    continue
                try:
                    return json.loads(line)
                except json.JSONDecodeError as error:
                    raise PiRPCError(f"Invalid JSON from Pi: {line!r}") from error

            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise PiRPCError(
                    f"Timed out waiting for Pi after {self.timeout_seconds:.0f}s"
                )
            ready = self._selector.select(remaining)
            if not ready:
                continue
            assert self.process.stdout is not None
            chunk = os.read(self.process.stdout.fileno(), 65536)
            if not chunk:
                raise PiRPCError(
                    f"Pi closed stdout (code {self.process.poll()}): {self._stderr_text()}"
                )
            self._buffer += chunk

    def prompt(self, message: str) -> str:
        """Send one user turn and return the final assistant text."""
        request_id = f"prompt-{time.monotonic_ns()}"
        self._send({"id": request_id, "type": "prompt", "message": message})
        deadline = time.monotonic() + self.timeout_seconds
        accepted = False
        assistant_texts: list[str] = []

        while True:
            event = self._next_event(deadline)
            if event.get("type") == "response" and event.get("id") == request_id:
                if not event.get("success"):
                    raise PiRPCError(event.get("error", "Pi rejected prompt"))
                accepted = True
            elif event.get("type") == "message_end":
                message_data = event.get("message", {})
                if message_data.get("role") == "assistant":
                    text = "".join(
                        item.get("text", "")
                        for item in message_data.get("content", [])
                        if item.get("type") == "text"
                    ).strip()
                    if text:
                        assistant_texts.append(text)
            elif event.get("type") == "agent_settled":
                if not accepted:
                    raise PiRPCError("Pi settled before acknowledging the prompt")
                if not assistant_texts:
                    raise PiRPCError("Pi returned no assistant text")
                return assistant_texts[-1]
            elif event.get("type") == "extension_ui_request":
                raise PiRPCError("Unexpected extension UI request in isolated run")

    def close(self) -> None:
        if self.process.poll() is None:
            if self.process.stdin:
                self.process.stdin.close()
            try:
                self.process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.process.terminate()
                try:
                    self.process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                    self.process.wait(timeout=2)
        self._selector.close()
        if self.process.stdout:
            self.process.stdout.close()
        self._stderr.close()


def read_text(path: str | Path) -> str:
    return Path(path).read_text(encoding="utf-8").strip()
