import os
import aiohttp
import asyncio
from typing import Optional, Dict, List, Set


class HeyGenService:
    """
    HeyGen API service for avatar video generation using V3 API
    """

    def __init__(self):
        self.api_key = os.getenv("HEYGEN_API_KEY")
        self.api_url = "https://api.heygen.com/v3"
        self.default_avatar = os.getenv("HEYGEN_AVATAR_ID")

    async def generate_speaking_avatar_video(
        self,
        text: str,
        language: str = "en",
        avatar_id: Optional[str] = None
    ) -> str:
        """
        Generate avatar video from text using V3 Video Agents
        Returns video URL
        """
        avatar_id = await self.resolve_avatar_id(avatar_id)

        payload = {
            "prompt": text,
            "avatar_id": avatar_id,
            "mode": "generate"
        }

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "X-Api-Key": self.api_key,
                    "Content-Type": "application/json"
                }

                # Create session
                async with session.post(
                    f"{self.api_url}/video-agents",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        response_data = data.get("data", {})
                        video_id = response_data.get("video_id")
                        session_id = response_data.get("session_id")

                        if not video_id and session_id:
                            video_id = await self._wait_for_video_id_from_session(
                                session_id
                            )

                        if not video_id:
                            raise Exception(
                                f"HeyGen did not return a video_id. session_id={session_id}, "
                                f"response={data}"
                            )

                        print(
                            f"Created HeyGen video request. session_id={session_id}, "
                            f"video_id={video_id}, avatar_id={avatar_id}"
                        )
                        return await self._get_video_url_with_polling(video_id)
                    else:
                        error = await response.text()
                        raise Exception(f"HeyGen V3 API error: {error}")
        except Exception as e:
            print(f"Error generating avatar video: {e}")
            raise

    async def _wait_for_video_id_from_session(self, session_id: str) -> Optional[str]:
        """
        video_id is often null on POST /v3/video-agents; poll the session until it appears.
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"X-Api-Key": self.api_key}
                for i in range(120):
                    async with session.get(
                        f"{self.api_url}/video-agents/{session_id}",
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as response:
                        if response.status != 200:
                            error = await response.text()
                            raise Exception(
                                f"HeyGen session poll error {response.status}: {error}"
                            )
                        data = await response.json()
                        sess = data.get("data") or {}
                        video_id = sess.get("video_id")
                        sess_status = sess.get("status")
                        print(
                            f"Session {session_id} poll {i + 1}/120: "
                            f"status={sess_status}, video_id={'set' if video_id else 'null'}"
                        )
                        if video_id:
                            return video_id
                        if sess_status == "failed":
                            raise Exception(
                                f"HeyGen video agent session failed: {data}"
                            )
                    await asyncio.sleep(5)
        except Exception as e:
            print(f"Error polling HeyGen session {session_id}: {e}")
            raise
        return None

    async def _get_video_url_with_polling(self, video_id: str) -> str:
        """
        Poll for video completion and return URL
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "X-Api-Key": self.api_key
                }

                # Poll up to ~15 minutes (90 * 10s); Video Agent can exceed 5× realtime.
                max_rounds = int(os.getenv("HEYGEN_VIDEO_POLL_MAX_ROUNDS", "90"))
                for i in range(max_rounds):
                    async with session.get(
                        f"{self.api_url}/videos/{video_id}",
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            video_data = data.get("data", {})
                            status = video_data.get("status")
                            print(f"Video {video_id} polling {i+1}/{max_rounds}: status={status}")
                            
                            if status == "completed":
                                video_url = video_data.get("video_url")
                                if not video_url:
                                    raise Exception(f"HeyGen completed without video_url: {data}")
                                return video_url
                            elif status == "failed":
                                raise Exception(
                                    f"HeyGen video generation failed: "
                                    f"{video_data.get('error') or video_data.get('failure_message') or data}"
                                )
                        else:
                            error = await response.text()
                            raise Exception(
                                f"HeyGen video status error {response.status}: {error}"
                            )
                    await asyncio.sleep(10)
        except Exception as e:
            print(f"Error polling video status: {e}")
            raise

        raise Exception(f"Timed out waiting for HeyGen video {video_id} to complete.")

    async def get_avatars(self) -> List[Dict]:
        """
        Get list of avatar groups (characters) using V3 API.
        Video creation uses look IDs from /v3/avatars/looks, not group IDs.
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "X-Api-Key": self.api_key
                }

                async with session.get(
                    f"{self.api_url}/avatars",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", [])
                    error = await response.text()
                    raise Exception(f"HeyGen avatars API error: {error}")
        except Exception as e:
            print(f"Error fetching HeyGen avatars: {e}")
            return []

    async def get_avatar_look(self, look_id: str) -> Optional[Dict]:
        """
        Fetch a single avatar look by id. Look id is what HeyGen expects as avatar_id
        for POST /v3/video-agents and POST /v3/videos.
        """
        if not look_id or not look_id.strip():
            return None
        look_id = look_id.strip()
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"X-Api-Key": self.api_key}
                async with session.get(
                    f"{self.api_url}/avatars/looks/{look_id}",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data")
                    return None
        except Exception as e:
            print(f"Error fetching HeyGen avatar look {look_id}: {e}")
            return None

    async def list_avatar_looks(self) -> List[Dict]:
        """
        List all avatar looks for this API key (cursor pagination).
        """
        looks: List[Dict] = []
        token: Optional[str] = None
        try:
            async with aiohttp.ClientSession() as session:
                headers = {"X-Api-Key": self.api_key}
                while True:
                    params: Dict[str, str] = {"limit": "50"}
                    if token:
                        params["token"] = token
                    async with session.get(
                        f"{self.api_url}/avatars/looks",
                        headers=headers,
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=60),
                    ) as response:
                        if response.status != 200:
                            error = await response.text()
                            raise Exception(f"HeyGen avatar looks API error: {error}")
                        data = await response.json()
                        batch = data.get("data") or []
                        looks.extend(batch)
                        if not data.get("has_more"):
                            break
                        token = data.get("next_token")
                        if not token:
                            break
            return looks
        except Exception as e:
            print(f"Error listing HeyGen avatar looks: {e}")
            return looks

    def _look_is_usable(self, look: Dict) -> bool:
        status = look.get("status")
        if status == "failed":
            return False
        return True

    async def resolve_avatar_id(self, requested_avatar_id: Optional[str]) -> str:
        """
        Resolve to a look id usable as avatar_id for Video Agent / video create.

        HeyGen V3: pass a look id (from GET /v3/avatars/looks), not an avatar group id.
        Legacy ids like Wayne_20220920 are not valid for /v3/video-agents.
        """
        requested = (requested_avatar_id or "").strip() or None

        if requested:
            direct = await self.get_avatar_look(requested)
            if direct and direct.get("id"):
                if not self._look_is_usable(direct):
                    raise Exception(
                        f"Avatar look '{requested}' is not ready (status={direct.get('status')})."
                    )
                return direct["id"]

        all_looks = await self.list_avatar_looks()
        look_ids: Set[str] = {L.get("id") for L in all_looks if L.get("id")}

        if requested and requested in look_ids:
            match = next((L for L in all_looks if L.get("id") == requested), None)
            if match and not self._look_is_usable(match):
                raise Exception(
                    f"Avatar look '{requested}' is not ready (status={match.get('status')})."
                )
            return requested

        default = (self.default_avatar or "").strip() or None
        if default:
            dlook = await self.get_avatar_look(default)
            if dlook and dlook.get("id") and self._look_is_usable(dlook):
                if requested:
                    print(
                        f"Requested avatar '{requested}' is not a usable look for this key. "
                        f"Using HEYGEN_AVATAR_ID look '{dlook['id']}'."
                    )
                return dlook["id"]
            if default in look_ids:
                match = next((L for L in all_looks if L.get("id") == default), None)
                if match and self._look_is_usable(match):
                    if requested:
                        print(
                            f"Requested avatar '{requested}' is not a usable look for this key. "
                            f"Using HEYGEN_AVATAR_ID look '{default}'."
                        )
                    return default

        for look in all_looks:
            lid = look.get("id")
            if lid and self._look_is_usable(look):
                if requested:
                    print(
                        f"Requested avatar '{requested}' is not a usable look for this key. "
                        f"Using first available look '{lid}'."
                    )
                return lid

        raise Exception(
            "No usable HeyGen avatar looks found for this API key. "
            "Create or share a look in HeyGen, then set HEYGEN_AVATAR_ID to that look id "
            "or pass avatar_id from GET /v3/avatars/looks."
        )
