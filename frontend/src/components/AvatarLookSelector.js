import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { apiService } from '../api';
import './AvatarLookSelector.css';

const labelForLook = (look) => {
  const name = look.name || 'Unnamed';
  const type = look.avatar_type ? ` · ${look.avatar_type}` : '';
  return `${name}${type}`;
};

const AvatarLookSelector = () => {
  const { avatarId, setAvatarId } = useStore();
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await apiService.getAvatars();
        if (cancelled) return;

        const list = Array.isArray(data.looks) ? data.looks : [];
        setLooks(list);

        if (data.error) {
          setLoadError(data.error);
        }

        const envDefault = (process.env.REACT_APP_DEFAULT_AVATAR_LOOK_ID || '').trim();
        const current = (useStore.getState().avatarId || '').trim();

        if (!current) {
          if (envDefault) {
            setAvatarId(envDefault);
          } else if (list[0]?.id) {
            setAvatarId(list[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || 'Failed to load avatars');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAvatarId]);

  const selectedLook = looks.find((l) => l.id === avatarId);

  return (
    <motion.div
      className="avatar-look-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
    >
      <div className="avatar-look-header">
        <h2>Avatar look</h2>
        {loading && <span className="avatar-look-badge">Loading…</span>}
        {!loading && avatarId && (
          <span className="avatar-look-badge" title={avatarId}>
            {avatarId.slice(0, 8)}…
          </span>
        )}
      </div>

      <p className="avatar-look-hint">
        HeyGen needs a <strong>look id</strong> (from your account). This is sent as{' '}
        <code>avatar_id</code> when generating the reply video.
      </p>

      {loadError && (
        <p className="avatar-look-warning" role="status">
          {loadError} — check backend <code>HEYGEN_API_KEY</code> and restart the API. You can
          still use <code>REACT_APP_DEFAULT_AVATAR_LOOK_ID</code> if it matches a look on your key.
        </p>
      )}

      {looks.length > 0 ? (
        <div className="avatar-look-row">
          {selectedLook?.preview_image_url && (
            <img
              className="avatar-look-thumb"
              src={selectedLook.preview_image_url}
              alt=""
              width={56}
              height={56}
            />
          )}
          <select
            className="avatar-look-select"
            value={avatarId}
            onChange={(e) => setAvatarId(e.target.value)}
            disabled={loading}
            aria-label="Choose HeyGen avatar look"
          >
            {looks.map((look) => (
              <option key={look.id} value={look.id}>
                {labelForLook(look)}
                {look.status && look.status !== 'completed' ? ` (${look.status})` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        !loading && (
          <p className="avatar-look-empty">
            No looks returned. Set <code>REACT_APP_DEFAULT_AVATAR_LOOK_ID</code> in{' '}
            <code>frontend/.env</code> to your look id, restart <code>npm start</code>, and ensure
            the backend can list looks for your API key.
          </p>
        )
      )}

      {avatarId && !looks.some((l) => l.id === avatarId) && !loading && (
        <p className="avatar-look-custom" role="status">
          Using look id from env or previous selection (not in this page of results):{' '}
          <code>{avatarId}</code>
        </p>
      )}
    </motion.div>
  );
};

export default AvatarLookSelector;
