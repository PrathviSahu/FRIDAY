import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, X, Search, GripHorizontal } from 'lucide-react';
import { fetchChatText } from '../../api/chatText';

export default function SpotifyCard() {
    const [isVisible, setIsVisible] = useState(true);
    const [spotifyTrack, setSpotifyTrack] = useState({ playing: false, title: '', artist: '' });
    const [volume, setVolume] = useState(50);
    const [songQuery, setSongQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const handleMediaAction = async (cmd) => {
        try {
            await fetchChatText(cmd, true);
            setTimeout(async () => {
                const res = await fetch('http://localhost:8000/api/spotify/current-track');
                if (res.ok) setSpotifyTrack(await res.json());
            }, 600);
        } catch (_) {}
    };

    const handlePlaySong = async (e) => {
        e.preventDefault();
        const q = songQuery.trim();
        if (!q) return;
        setSearching(true);
        setSongQuery('');
        try {
            await fetchChatText(`play ${q}`, true);
            setTimeout(async () => {
                const res = await fetch('http://localhost:8000/api/spotify/current-track');
                if (res.ok) setSpotifyTrack(await res.json());
            }, 1200);
        } catch (_) {}
        setTimeout(() => setSearching(false), 1500);
    };

    useEffect(() => {
        const fetchTrack = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/spotify/current-track');
                if (res.ok) setSpotifyTrack(await res.json());
            } catch (_) {}
        };
        fetchTrack();
        const interval = setInterval(fetchTrack, 4000);
        return () => clearInterval(interval);
    }, []);

    if (!isVisible) {
        return (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVisible(true)}
                className="fixed bottom-8 right-10 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-[#0a1628]/95 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 text-[10px] font-medium tracking-wide transition-all shadow-lg pointer-events-auto cursor-pointer"
            >
                <Music size={13} />
                <span>Music</span>
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                drag
                dragConstraints={{ left: -500, right: 80, top: -500, bottom: 80 }}
                dragElastic={0.1}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="fixed bottom-24 right-10 z-40 w-64 rounded-2xl bg-[#0a1628]/95 border border-white/10 shadow-2xl backdrop-blur-2xl pointer-events-auto select-none overflow-hidden"
            >
                {/* Subtle top glow line when playing */}
                <div className={`h-[2px] w-full transition-all duration-700 ${
                    spotifyTrack.playing
                        ? 'bg-gradient-to-r from-transparent via-[#1DB954] to-transparent opacity-80'
                        : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
                }`} />

                <div className="p-4">
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-white/40">
                            <GripHorizontal size={14} className="cursor-grab" />
                            <span className="text-[10px] font-medium tracking-widest uppercase">Music</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Playing indicator dot */}
                            {spotifyTrack.playing && (
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full bg-[#1DB954]"
                                />
                            )}
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* ── Track Info ── */}
                    <div className="mb-3 min-h-[36px]">
                        {spotifyTrack.title ? (
                            <>
                                <div className="text-sm font-semibold text-white truncate leading-tight">
                                    {spotifyTrack.title}
                                </div>
                                <div className="text-[11px] text-white/45 truncate mt-0.5">
                                    {spotifyTrack.artist || 'Unknown Artist'}
                                </div>
                            </>
                        ) : (
                            <div className="text-[11px] text-white/30 italic">
                                Nothing playing right now
                            </div>
                        )}
                    </div>

                    {/* ── Playback Controls ── */}
                    <div className="flex items-center justify-between mb-4">
                        <motion.button
                            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                            onClick={() => handleMediaAction('previous track')}
                            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all cursor-pointer"
                        >
                            <SkipBack size={15} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                            onClick={() => handleMediaAction(spotifyTrack.playing ? 'pause music' : 'play music')}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#0a1628] hover:bg-white/90 transition-all shadow-lg cursor-pointer"
                        >
                            {spotifyTrack.playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                            onClick={() => handleMediaAction('next track')}
                            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all cursor-pointer"
                        >
                            <SkipForward size={15} />
                        </motion.button>
                    </div>

                    {/* ── Volume Slider ── */}
                    <div className="flex items-center gap-2 mb-3">
                        <Volume2 size={11} className="text-white/30 shrink-0" />
                        <input
                            type="range" min="0" max="100" value={volume}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setVolume(val);
                                handleMediaAction(`volume ${val}%`);
                            }}
                            className="w-full h-[3px] bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                            style={{ accentColor: '#ffffff' }}
                        />
                        <span className="font-mono text-[9px] text-white/30 w-6 text-right">{volume}</span>
                    </div>

                    {/* ── Song Search Bar ── */}
                    <form onSubmit={handlePlaySong}>
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-white/25 focus-within:bg-white/8 transition-all">
                            <Search size={11} className="text-white/30 shrink-0" />
                            <input
                                type="text"
                                value={songQuery}
                                onChange={(e) => setSongQuery(e.target.value)}
                                placeholder={searching ? 'Searching…' : 'Search & play a song'}
                                disabled={searching}
                                className="bg-transparent text-[11px] text-white/80 placeholder-white/25 outline-none w-full"
                            />
                            {songQuery.trim() && (
                                <motion.button
                                    type="submit"
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
                                >
                                    <Play size={11} />
                                </motion.button>
                            )}
                        </div>
                    </form>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
