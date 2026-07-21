import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, Move, X } from 'lucide-react';
import { fetchChatText } from '../../api/chatText';

export default function SpotifyCard() {
    const [isVisible, setIsVisible] = useState(true);
    const [spotifyTrack, setSpotifyTrack] = useState({ playing: false, title: '', artist: '' });
    const [volume, setVolume] = useState(50);

    const handleMediaAction = async (cmd) => {
        try {
            await fetchChatText(cmd, true); // silenceTts = true
            setTimeout(async () => {
                const res = await fetch('http://localhost:8000/api/spotify/current-track');
                if (res.ok) setSpotifyTrack(await res.json());
            }, 500);
        } catch (_) {}
    };

    useEffect(() => {
        const fetchTrack = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/spotify/current-track');
                if (res.ok) {
                    const data = await res.json();
                    setSpotifyTrack(data);
                }
            } catch (_) {}
        };
        fetchTrack();
        const interval = setInterval(fetchTrack, 4000);
        return () => clearInterval(interval);
    }, []);

    if (!isVisible) {
        return (
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsVisible(true)}
                className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#001018]/90 border border-[#00B7FF]/50 text-[#00B7FF] shadow-[0_0_20px_rgba(0,183,255,0.4)] cursor-pointer flex items-center gap-2 font-orbitron text-[10px] tracking-widest pointer-events-auto"
            >
                <Music size={16} className="animate-pulse" />
                <span className="hidden sm:inline">SPOTIFY</span>
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                drag
                dragConstraints={{ left: -400, right: 100, top: -400, bottom: 100 }}
                dragElastic={0.15}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ boxShadow: '0 0 30px rgba(0, 183, 255, 0.35)' }}
                className="fixed bottom-24 right-8 z-40 w-72 rounded-2xl border border-[#00B7FF]/40 bg-[#001018]/90 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(0,183,255,0.25)] cursor-grab active:cursor-grabbing pointer-events-auto select-none"
            >
                {/* Header / Drag Handle & Close Button */}
                <div className="flex items-center justify-between pb-2 border-b border-[#00B7FF]/20 mb-3">
                    <div className="flex items-center gap-2 font-orbitron text-[10px] tracking-[0.2em] text-[#00B7FF]">
                        <Move size={12} className="text-[#00B7FF]/60" />
                        <Music size={14} className="text-[#00B7FF] animate-pulse" />
                        <span>SPOTIFY FEED</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${spotifyTrack.playing ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-cyan-500/10 text-cyan-400/60 border border-cyan-500/20'}`}>
                            {spotifyTrack.playing ? 'PLAYING' : spotifyTrack.title ? 'PAUSED' : 'OFFLINE'}
                        </span>
                        
                        {/* Close button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1 rounded-full hover:bg-red-500/20 text-[#00B7FF]/60 hover:text-red-400 transition-colors cursor-pointer"
                            title="Close Spotify Card"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Track Info Display */}
                <div className="bg-[#001824]/70 border border-[#00B7FF]/20 rounded-xl p-3 text-left mb-3 relative overflow-hidden">
                    {/* Glowing active line */}
                    <div className={`absolute top-0 left-0 w-full h-[2px] ${spotifyTrack.playing ? 'bg-gradient-to-r from-green-500 via-[#00B7FF] to-green-500 animate-pulse' : 'bg-[#00B7FF]/20'}`} />
                    
                    {spotifyTrack.title ? (
                        <div>
                            <div className="font-orbitron text-xs font-bold text-[#DFFAFF] truncate drop-shadow-[0_0_8px_rgba(0,183,255,0.5)]">
                                {spotifyTrack.title}
                            </div>
                            <div className="font-grotesk text-[10px] text-[#00B7FF]/80 truncate mt-1">
                                {spotifyTrack.artist || 'Unknown Artist'}
                            </div>
                        </div>
                    ) : (
                        <div className="text-[10px] font-orbitron text-[#DFFAFF]/40 text-center py-2">
                            No active Spotify playback
                        </div>
                    )}
                </div>

                {/* Media Playback Controls */}
                <div className="flex items-center justify-evenly py-1 border-t border-[#00B7FF]/10 mb-3">
                    <motion.button
                        whileHover={{ scale: 1.18 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleMediaAction('previous track')}
                        className="p-2.5 rounded-xl bg-[#00B7FF]/10 hover:bg-[#00B7FF]/25 border border-[#00B7FF]/20 text-[#00B7FF] transition-all cursor-pointer shadow-[0_0_10px_rgba(0,183,255,0.15)]"
                        title="Previous Track"
                    >
                        <SkipBack size={14} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.18 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleMediaAction(spotifyTrack.playing ? 'pause music' : 'play music')}
                        className="p-3.5 rounded-full bg-gradient-to-r from-[#00B7FF]/40 to-[#00E5FF]/40 hover:from-[#00B7FF]/60 hover:to-[#00E5FF]/60 border border-[#00B7FF]/60 text-[#DFFAFF] transition-all cursor-pointer shadow-[0_0_18px_rgba(0,183,255,0.5)]"
                        title={spotifyTrack.playing ? 'Pause' : 'Play'}
                    >
                        {spotifyTrack.playing ? <Pause size={16} /> : <Play size={16} />}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.18 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleMediaAction('next track')}
                        className="p-2.5 rounded-xl bg-[#00B7FF]/10 hover:bg-[#00B7FF]/25 border border-[#00B7FF]/20 text-[#00B7FF] transition-all cursor-pointer shadow-[0_0_10px_rgba(0,183,255,0.15)]"
                        title="Next Track"
                    >
                        <SkipForward size={14} />
                    </motion.button>
                </div>

                {/* Volume Control Bar */}
                <div className="flex items-center gap-2 bg-[#001824]/50 border border-[#00B7FF]/15 rounded-xl px-3 py-2">
                    <Volume2 size={12} className="text-[#00B7FF]/70 shrink-0" />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setVolume(val);
                            handleMediaAction(`volume ${val}%`);
                        }}
                        className="w-full h-1 bg-[#00B7FF]/20 rounded-lg appearance-none cursor-pointer accent-[#00B7FF]"
                    />
                    <span className="font-mono text-[9px] text-[#00B7FF] w-6 text-right font-bold">{volume}%</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
