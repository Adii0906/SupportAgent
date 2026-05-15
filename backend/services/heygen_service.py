import os
import aiohttp
import json
import asyncio
from typing import Optional, Dict, List


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

                        if not video_id:
                            raise Exception(
                                f"HeyGen did not return a video_id. session_id={session_id}, response={data}"
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

    async def _get_video_url_with_polling(self, video_id: str) -> str:
        """
        Poll for video completion and return URL
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "X-Api-Key": self.api_key
                }

                # Poll up to 5 minutes (30 * 10s)
                for i in range(30):
                    async with session.get(
                        f"{self.api_url}/videos/{video_id}",
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            video_data = data.get("data", {})
                            status = video_data.get("status")
                            print(f"Video {video_id} polling {i+1}/30: status={status}")
                            
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
        Get list of available avatars using V3 API
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

    async def resolve_avatar_id(self, requested_avatar_id: Optional[str]) -> str:
        """
        Resolve the requested avatar to one that is accessible for the current API key.
        """
        avatars = await self.get_avatars()
        if not avatars:
            raise Exception("No HeyGen avatars are available for this API key.")

        available_ids = {avatar.get("id") for avatar in avatars if avatar.get("id")}

        if requested_avatar_id and requested_avatar_id in available_ids:
            return requested_avatar_id

        if self.default_avatar and self.default_avatar in available_ids:
            print(
                f"Requested avatar '{requested_avatar_id}' is unavailable. "
                f"Using configured default avatar '{self.default_avatar}'."
            )
            return self.default_avatar

        fallback_avatar = avatars[0].get("id")
        if not fallback_avatar:
            raise Exception("HeyGen returned avatars, but none included a usable id.")

        print(
            f"Requested avatar '{requested_avatar_id}' is unavailable. "
            f"Using first accessible avatar '{fallback_avatar}'."
        )
        return fallback_avatar
